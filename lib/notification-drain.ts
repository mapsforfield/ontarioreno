// ─── Outbox drain ─────────────────────────────────────────────────────────────
// Takes its Prisma client as an argument so both API functions can call it
// without importing each other, and so tests can drive it with a fake.

import { deliverEmail, smsProviderConfigured } from './notifications.js';
import { deliveryEnabled } from './app-config.js';

export type DrainSummary = {
  considered: number;
  sent: number;
  suppressed: number;
  blocked: number;
  failed: number;
};

/** Minimal surface of the Prisma client this needs. */
export type OutboxStore = {
  notificationOutbox: {
    findMany: (args: unknown) => Promise<
      Array<{
        id: string;
        channel: string;
        recipient: string;
        subject: string;
        body: string;
        attempts: number;
      }>
    >;
    update: (args: unknown) => Promise<unknown>;
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
  const summary: DrainSummary = { considered: 0, sent: 0, suppressed: 0, blocked: 0, failed: 0 };

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

    if (!canDeliver) {
      state = 'suppressed';
      reason = `non_production_env:${env.VERCEL_ENV ?? 'local'}`;
      summary.suppressed++;
    } else if (row.channel === 'sms' && !smsProviderConfigured(env)) {
      // Composed, scheduled and recorded — parked until an adapter is wired to
      // the existing Twilio account rather than standing up a second sender.
      state = 'blocked';
      reason = 'no_sms_provider_pending_twilio_inspection';
      summary.blocked++;
    } else if (row.channel === 'email') {
      const outcome = await deliverEmail(row.recipient, row.subject, row.body, env);
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
