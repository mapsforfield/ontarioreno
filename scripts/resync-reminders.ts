/**
 * One-time repair: bring already-queued reminder texts in line with the
 * appointments they describe.
 *
 * Reminders were queued at booking time with the date and time baked into the
 * body, and until now nothing rewrote them when an appointment moved. Every
 * homeowner who rescheduled before this fix shipped still has a text sitting in
 * the outbox quoting their ORIGINAL slot. This finds those rows and repairs
 * them; the API handlers keep them right from here on.
 *
 * Reports only, unless run with --apply. NOTHING in this script sends a
 * message — it writes outbox rows and never calls the drain, so a dry run
 * cannot text anyone and neither can a real one.
 *
 *   npx tsx scripts/resync-reminders.ts            # report what is wrong
 *   npx tsx scripts/resync-reminders.ts --apply    # fix it
 */

import { prisma } from '../lib/prisma.js';
import { planReminderNotifications } from '../lib/notifications.js';
import { resyncAppointmentReminders, suppressPendingReminders } from '../lib/reminder-resync.js';

const APPLY = process.argv.includes('--apply');
const REMINDER_KINDS = ['reminder_24h', 'reminder_day_of'];
/** Statuses where a visit is still expected to happen. */
const LIVE_STATUSES = ['scheduled', 'confirmed', 'rescheduled'];

async function main() {
  const pending = await prisma.notificationOutbox.findMany({
    where: { state: 'pending', kind: { in: REMINDER_KINDS } },
    orderBy: { sendAfter: 'asc' },
  });

  console.log(
    `${pending.length} pending reminder row(s) in the outbox` +
      (APPLY ? '' : ' — dry run, nothing will be written')
  );
  if (pending.length === 0) return;

  const ids = [...new Set(pending.map((r) => r.appointmentId).filter(Boolean))] as string[];
  const appointments = await prisma.appointment.findMany({ where: { id: { in: ids } } });
  const byId = new Map(appointments.map((a) => [a.id, a]));

  let repaired = 0;
  let stoodDown = 0;
  let alreadyCorrect = 0;

  for (const id of ids) {
    const rows = pending.filter((r) => r.appointmentId === id);
    const appointment = byId.get(id);

    // Gone, cancelled or binned: there is no visit to remind anyone about.
    const dead =
      !appointment ||
      appointment.deletedAt ||
      !LIVE_STATUSES.includes(appointment.status) ||
      !appointment.appointmentDate ||
      !appointment.appointmentTime;

    if (dead) {
      const why = !appointment ? 'appointment no longer exists'
        : appointment.deletedAt ? 'appointment deleted'
        : !appointment.appointmentDate || !appointment.appointmentTime ? 'no date/time on record'
        : `status is "${appointment.status}"`;
      console.log(`  ${id}  STAND DOWN ${rows.length} row(s) — ${why}`);
      if (APPLY) stoodDown += await suppressPendingReminders(prisma, id, 'backfill_no_live_appointment');
      continue;
    }

    const context = {
      appointmentId: id,
      name: appointment.customerName ?? '',
      phone: appointment.phone ?? '',
      propertyAddress:
        [appointment.address, appointment.city].filter(Boolean).join(', ') ||
        (appointment.address ?? ''),
      date: appointment.appointmentDate,
      time: appointment.appointmentTime,
    };

    // A row is wrong if the schedule it was queued under is not the schedule
    // the appointment now has. Comparing sendAfter catches every date or time
    // move; comparing the body catches an address or name correction too.
    const expected = planReminderNotifications(context, `${context.date}T${context.time}`);
    const drifted = rows.some((row) => {
      const match = expected.find((e) => e.kind === row.kind);
      return !match || match.sendAfter !== row.sendAfter || match.body !== row.body;
    });

    if (!drifted && rows.length === expected.length) {
      alreadyCorrect++;
      continue;
    }

    console.log(
      `  ${id}  REPAIR — queued for ${rows.map((r) => r.sendAfter.slice(0, 16)).join(', ')}; ` +
        `appointment is ${context.date} ${context.time}`
    );
    if (APPLY) {
      const summary = await resyncAppointmentReminders(prisma, context, 'backfill_resync');
      repaired++;
      console.log(`      stood down ${summary.suppressed}, queued ${summary.queued}`);
    }
  }

  console.log(
    APPLY
      ? `\nDone. ${repaired} appointment(s) repaired, ${stoodDown} stale row(s) stood down, ${alreadyCorrect} already correct.`
      : `\n${alreadyCorrect} appointment(s) already correct. Re-run with --apply to fix the rest.`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
