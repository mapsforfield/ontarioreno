/**
 * Sends the "How did it go?" push. Server-only (Prisma + web-push); the pure
 * selection rules and their tests live in lib/outcome-nudge.ts.
 *
 * Called from two places, because the GitHub Actions schedule that is meant to
 * run every 15 minutes actually runs every 2–6 hours (GitHub delays scheduled
 * workflows on busy runners). So:
 *   1. the notification drain (/api/leads?flow=drain), and
 *   2. any portal load of the consultation list (/api/appointments GET),
 *      throttled to once a minute per server instance — reps open the portal
 *      all day, which makes the nudge land within minutes, not hours.
 * The compare-and-set on outcomeNudgedAt keeps the two from double-sending.
 */
import { prisma } from './prisma.js';
import { withSchema } from './schema.js';
import { deliveryEnabled } from './app-config.js';
import { selectOutcomeNudges, torontoNow, outcomeNudgePayload } from './outcome-nudge.js';

/**
 * Push "How did it go?" to each rep whose visit ended 15 min – 6 h ago and has
 * no outcome yet. Production only (preview deployments never push), at most
 * once per appointment: the row is claimed by stamping outcomeNudgedAt with a
 * compare-and-set before anything is sent, so overlapping drains cannot both
 * send it.
 */
export async function sendOutcomeNudges(): Promise<{ nudged: number; skipped?: string }> {
  if (!deliveryEnabled()) return { nudged: 0, skipped: 'not production' };
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return { nudged: 0, skipped: 'no VAPID keys' };
  }
  const { date, minutes } = torontoNow();
  const candidates = await withSchema(() =>
    prisma.appointment.findMany({
      where: {
        appointmentDate: date,
        outcomeSubmitted: false,
        outcomeNudgedAt: null,
        deletedAt: null,
        status: { in: ['scheduled', 'confirmed', 'completed'] },
      },
      select: {
        id: true,
        appointmentDate: true,
        appointmentTime: true,
        durationMinutes: true,
        status: true,
        appointmentType: true,
        outcomeSubmitted: true,
        outcomeNudgedAt: true,
        assignedRepId: true,
        deletedAt: true,
        customerName: true,
        title: true,
      },
    })
  );
  const due = selectOutcomeNudges(candidates, date, minutes);
  if (due.length === 0) return { nudged: 0 };

  const webpush = await import('web-push');
  webpush.default.setVapidDetails(
    `mailto:${process.env.VAPID_CONTACT_EMAIL ?? 'noreply@ontarioreno.ca'}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  let nudged = 0;
  for (const apt of due) {
    const claimed = await prisma.appointment.updateMany({
      where: { id: apt.id, outcomeNudgedAt: null },
      data: { outcomeNudgedAt: new Date() },
    });
    if (claimed.count === 0) continue;
    const subs = await prisma.pushSubscription.findMany({ where: { userId: apt.assignedRepId } });
    const payload = JSON.stringify(outcomeNudgePayload(apt));
    await Promise.allSettled(
      subs.map((sub) =>
        webpush.default.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload)
      )
    );
    nudged += 1;
  }
  return { nudged };
}

let lastOpportunisticRun = 0;

/** The portal-load trigger: at most once a minute per instance, never throws. */
export async function maybeSendOutcomeNudges(): Promise<void> {
  const now = Date.now();
  if (now - lastOpportunisticRun < 60_000) return;
  lastOpportunisticRun = now;
  try {
    await sendOutcomeNudges();
  } catch (err) {
    console.error('[outcome-nudge] opportunistic run failed', err);
  }
}
