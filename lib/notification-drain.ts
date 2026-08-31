// ─── Outbox drain ─────────────────────────────────────────────────────────────
// Takes its Prisma client as an argument so both API functions can call it
// without importing each other, and so tests can drive it with a fake.

import { deliverEmail, deliverSms, smsProviderConfigured } from './notifications.js';
import { deliveryEnabled } from './app-config.js';
import {
  reconcileReminder,
  REMINDER_KINDS,
  type ReminderAppointment,
} from './reminder-resync.js';

export type DrainSummary = {
  considered: number;
  sent: number;
  suppressed: number;
  blocked: number;
  failed: number;
  /** Rows dropped because their message had stopped being true. */
  stale: number;
  /** Reminders carried forward because their visit moved further out. */
  deferred: number;
  /** Rows another drain had already claimed. Not an error — see `claim` below. */
  skipped: number;
  /** Rows recovered from a drain that died mid-send. */
  requeued: number;
};

/** Minimal surface of the Prisma client this needs. */
export type OutboxStore = {
  notificationOutbox: {
    findMany: (args: unknown) => Promise<
      Array<{
        id: string;
        channel: string;
        kind?: string;
        appointmentId?: string | null;
        recipient: string;
        subject: string;
        body: string;
        html?: string;
        attempts: number;
        expiresAt?: string;
      }>
    >;
    update: (args: unknown) => Promise<unknown>;
    /** Used for the atomic claim and the stalled-row sweep. */
    updateMany: (args: unknown) => Promise<{ count: number }>;
  };
  /** Reminders are rebuilt from the appointment at send time, so the drain has
   *  to be able to read one. */
  appointment: {
    findUnique: (args: unknown) => Promise<ReminderAppointment | null>;
  };
};

/**
 * How long a row may sit in `sending` before a later drain assumes the run that
 * claimed it died and puts it back. Generous on purpose: requeuing a row that is
 * genuinely still in flight is the one way this mechanism could cause the double
 * send it exists to prevent. No provider call here comes close to this.
 */
const STALLED_SEND_MS = 15 * 60_000;

/**
 * Deliver everything due. Never throws — a booking must not fail, and a cron must
 * not die, because one message could not go out.
 *
 * Non-production environments record every row and deliver nothing: the live
 * Resend key is scoped to Preview too, so without this a preview test booking
 * would email the real business inbox and whatever address a tester typed.
 */
export async function drainOutbox(
  prisma: OutboxStore,
  limit = 25,
  env = process.env
): Promise<DrainSummary> {
  const canDeliver = deliveryEnabled(env);
  const now = new Date().toISOString();
  const summary: DrainSummary = {
    considered: 0, sent: 0, suppressed: 0, blocked: 0, failed: 0, stale: 0, deferred: 0,
    skipped: 0, requeued: 0,
  };

  // ── Recover anything a dead run was holding ──
  // A drain that is killed between claiming a row and recording its outcome
  // leaves that row in `sending`, which no later drain would ever pick up. On
  // a serverless platform the process being killed mid-request is routine, so
  // this has to be swept rather than assumed away.
  summary.requeued = (
    await prisma.notificationOutbox
      .updateMany({
        where: {
          state: 'sending',
          updatedAt: { lt: new Date(Date.now() - STALLED_SEND_MS).toISOString() },
        },
        data: { state: 'pending', stateReason: 'requeued_after_interrupted_send' },
      })
      .catch(() => ({ count: 0 }))
  ).count;

  const due = await prisma.notificationOutbox
    .findMany({
      where: { state: 'pending', sendAfter: { lte: now } },
      orderBy: { sendAfter: 'asc' },
      take: limit,
    })
    .catch(() => []);

  summary.considered = due.length;

  for (const row of due) {
    let state: string;
    let reason: string;

    // ── Reminders are rebuilt from the appointment, never trusted as stored ──
    // A queued reminder is a schedule, not a script. Its body was written when
    // the visit was booked, and the visit may have moved since — by a rep in
    // the portal, by the homeowner rescheduling themselves, or by something
    // that does not exist yet. Deriving the wording here, at the last possible
    // moment, is what makes a stale date impossible rather than merely
    // unlikely: there is no write path that can forget to do this, because
    // this is the only door a message leaves through.
    if (row.kind && (REMINDER_KINDS as readonly string[]).includes(row.kind)) {
      const appointment = row.appointmentId
        ? await prisma.appointment
            .findUnique({ where: { id: row.appointmentId } })
            .catch(() => null)
        : null;
      const verdict = reconcileReminder(appointment, { kind: row.kind });

      if (verdict.action === 'suppress') {
        await prisma.notificationOutbox
          .update({
            where: { id: row.id },
            data: { state: 'suppressed', stateReason: verdict.reason, attempts: row.attempts + 1 },
          })
          .catch(() => {});
        summary.stale++;
        continue;
      }

      if (verdict.action === 'defer') {
        // Stays pending, re-timed to the slot the appointment now has. Attempts
        // are untouched: nothing was tried, so nothing failed.
        await prisma.notificationOutbox
          .update({
            where: { id: row.id },
            data: {
              sendAfter: verdict.sendAfter,
              expiresAt: verdict.expiresAt,
              body: verdict.body,
              stateReason: 'rescheduled_to_match_appointment',
            },
          })
          .catch(() => {});
        summary.deferred++;
        continue;
      }

      // Send the rebuilt wording, not the row's — and carry the recomputed
      // expiry with it, so the stored one (written against a slot that may no
      // longer exist) cannot veto a message the appointment says is valid.
      row.body = verdict.body;
      row.expiresAt = verdict.expiresAt;
    }

    // ── Claim the row before anything is sent ──
    // This is a compare-and-set: the update only matches while the row is
    // still `pending`, so of two drains racing for it exactly one gets a
    // count of 1 and the other gets 0 and moves on. Without it, both read the
    // same pending row and both deliver — a real homeowner receiving the same
    // reminder twice. That race was theoretical while the only schedule was
    // one drain a day; it is not, now that a cron runs every fifteen minutes
    // alongside the inline drains a dozen portal actions already trigger.
    //
    // Placed after the reminder reconcile above so `suppress` and `defer` keep
    // working exactly as they did: neither sends anything, and recomputing a
    // verdict twice costs nothing. From here on, a message goes out.
    const claimed = await prisma.notificationOutbox
      .updateMany({
        where: { id: row.id, state: 'pending' },
        data: { state: 'sending' },
      })
      .catch(() => ({ count: 0 }));

    if (claimed.count !== 1) {
      summary.skipped++;
      continue;
    }

    // Checked before anything else: a message whose wording has expired must
    // not go out even in an environment that would otherwise deliver it. The
    // drain runs every fifteen minutes, not continuously, and a run can be
    // missed — so a reminder can still be picked up well after it was due.
    // Sending it then would tell a homeowner their visit is "tomorrow" on the
    // morning it is actually happening.
    if (row.expiresAt && row.expiresAt <= now) {
      state = 'suppressed';
      reason = 'stale_message_window_passed';
      summary.stale++;
    } else if (!canDeliver) {
      state = 'suppressed';
      reason = `non_production_env:${env.VERCEL_ENV ?? 'local'}`;
      summary.suppressed++;
    } else if (row.channel === 'sms' && !smsProviderConfigured(env)) {
      // Composed, scheduled and recorded — parked rather than lost, so turning
      // on credentials is all that stands between here and delivery.
      state = 'blocked';
      reason = 'no_sms_provider';
      summary.blocked++;
    } else if (row.channel === 'sms') {
      const outcome = await deliverSms(row.recipient, row.body, env);
      state = outcome.state;
      reason = outcome.reason;
      if (outcome.state === 'sent') summary.sent++;
      else if (outcome.state === 'blocked') summary.blocked++;
      else summary.failed++;
    } else if (row.channel === 'email') {
      const outcome = await deliverEmail(row.recipient, row.subject, row.body, env, row.html);
      state = outcome.state;
      reason = outcome.reason;
      if (outcome.state === 'sent') summary.sent++;
      else if (outcome.state === 'blocked') summary.blocked++;
      else summary.failed++;
    } else {
      state = 'blocked';
      reason = 'unsupported_channel';
      summary.blocked++;
    }

    await prisma.notificationOutbox
      .update({
        where: { id: row.id },
        data: {
          state,
          stateReason: reason,
          attempts: row.attempts + 1,
          lastError: state === 'failed' ? reason : '',
          sentAt: state === 'sent' ? new Date().toISOString() : null,
        },
      })
      .catch(() => {});
  }

  return summary;
}
