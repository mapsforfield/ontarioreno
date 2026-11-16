/**
 * Puts consultations that are already booked onto the Deals pipeline — the
 * ones made before bookings started creating their own deal
 * (lib/deal-from-appointment.ts).
 *
 * DRY RUN by default: lists what it would do and writes nothing.
 *
 *   npx tsx scripts/deal-from-appointment-backfill.ts            # dry run, today onward
 *   npx tsx scripts/deal-from-appointment-backfill.ts --apply    # write
 *   npx tsx scripts/deal-from-appointment-backfill.ts --since=2026-11-01
 *
 * Only consultations dated on/after --since (default: today, Toronto) — past
 * visits already have an outcome or don't, and dropping weeks of them into
 * "Appointment booked" would bury the live ones. Uses the exact same rules as
 * a live booking: events, cancelled and already-linked visits are skipped, and
 * a homeowner with an open deal is linked to it rather than duplicated.
 *
 * Required env: DATABASE_URL
 */
import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';

neonConfig.webSocketConstructor = ws;

async function main() {
  const apply = process.argv.includes('--apply');
  const sinceArg = process.argv.find((a) => a.startsWith('--since='))?.split('=')[1];
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto' }).format(new Date());
  const since = sinceArg || today;

  const { prisma } = await import('../lib/prisma.js');
  const { appointmentWantsDeal, ensureDealForAppointment, matchOpenDeal, OPEN_DEAL_STATUSES } = await import(
    '../lib/deal-from-appointment.js'
  );
  const { DEFAULT_TOTAL_COMMISSION_RATE } = await import('../lib/commission-ledger.js');

  const appointments = await prisma.appointment.findMany({
    where: { dealId: null, deletedAt: null, appointmentDate: { gte: since } },
    orderBy: [{ appointmentDate: 'asc' }, { appointmentTime: 'asc' }],
  });
  const todo = appointments.filter((a) => appointmentWantsDeal(a));
  const openDeals = await prisma.deal.findMany({
    where: { deletedAt: null, status: { in: OPEN_DEAL_STATUSES } },
    select: { id: true, email: true, phone: true, status: true, homeownerName: true, assignedRepId: true },
  });
  const reps = new Map((await prisma.user.findMany({ select: { id: true, name: true } })).map((u) => [u.id, u.name]));

  console.log(`${apply ? 'APPLYING' : 'DRY RUN'} — consultations from ${since} with no deal: ${todo.length}\n`);
  let created = 0;
  let linked = 0;
  for (const a of todo) {
    const match = matchOpenDeal(a, openDeals);
    const plan = match ? `link → existing ${match.status} deal (${match.homeownerName})` : 'create deal';
    console.log(`${a.appointmentDate} ${a.appointmentTime || '     '}  ${a.customerName.padEnd(28).slice(0, 28)}  ${String(reps.get(a.assignedRepId) ?? '?').padEnd(10)}  ${plan}`);
    if (!apply) continue;
    const r = await ensureDealForAppointment(prisma, a.id, { defaultTotalRate: DEFAULT_TOTAL_COMMISSION_RATE });
    if (r.outcome === 'created') created++;
    if (r.outcome === 'linked') linked++;
  }
  console.log(apply ? `\nCreated ${created}, linked ${linked}.` : '\nNothing written. Re-run with --apply to write.');
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
