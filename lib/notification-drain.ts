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
  };
  /** Reminders are rebuilt from the appointment at send time, so the drain has
   *  to be able to read one. */
  appointment: {
    findUnique: (args: unknown) => Promise<ReminderAppointment | null>;
  };
};

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
  };

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

    // Checked before anything else: a message whose wording has expired must
    // not go out even in an environment that would otherwise deliver it. The
    // drain cannot run continuously — the platform's cron granularity is daily
    // — so a reminder can and will be picked up hours after it was due. Sending
    // it then would tell a homeowner their visit is "tomorrow" on the morning
    // it is actually happening.
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
