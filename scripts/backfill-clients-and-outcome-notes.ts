/**
 * One-off repair for the two gaps fixed in lib/client-from-appointment.ts and
 * lib/deal-outcome-notes.ts:
 *
 *  1. Consultations with no Client row (public-flow and book_lead bookings),
 *     so the homeowner is missing from Clients search.
 *  2. Deals whose consultation has a submitted outcome report that never
 *     reached the deal's notes.
 *
 * Dry run by default — prints what it would do and writes nothing.
 *
 *   DATABASE_URL='<neon url>' npx tsx scripts/backfill-clients-and-outcome-notes.ts
 *   DATABASE_URL='<neon url>' npx tsx scripts/backfill-clients-and-outcome-notes.ts --apply
 *
 * Sends no messages. Never deletes or overwrites a field that has a value.
 */
import { ensureClientForAppointment, appointmentWantsClient, matchClient } from '../lib/client-from-appointment.js';
import { withOutcomeNotes } from '../lib/deal-outcome-notes.js';

const apply = process.argv.includes('--apply');

async function main() {
  const { prisma } = await import('../lib/prisma.js');

  // ── 1. Clients ──
  const noClient = await prisma.appointment.findMany({
    where: { clientId: null, deletedAt: null },
    orderBy: { createdAt: 'asc' },
  });
  const wanting = noClient.filter((a) => appointmentWantsClient(a));
  const clients = await prisma.client.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, email: true, phone: true },
  });
  let wouldLink = 0;
  let wouldCreate = 0;
  for (const a of wanting) {
    const hit = matchClient(a, clients);
    if (hit) wouldLink++;
    else wouldCreate++;
    if (apply) {
      const r = await ensureClientForAppointment(prisma, a.id);
      if (r.outcome === 'created') {
        // So a second booking by the same homeowner later in this run links.
        const c = await prisma.client.findUnique({ where: { id: r.clientId }, select: { id: true, name: true, email: true, phone: true } });
        if (c) clients.push(c);
      }
    }
  }
  console.log(`Consultations without a client: ${noClient.length} (${wanting.length} homeowner bookings, rest are events/unnamed)`);
  console.log(`  ${apply ? 'linked' : 'would link'} to an existing client: ${wouldLink}`);
  console.log(`  ${apply ? 'created' : 'would create'} a client: ${wouldCreate}`);

  // ── 2. Outcome notes → deals ──
  const withOutcome = await prisma.appointment.findMany({
    where: { deletedAt: null, outcomeSubmitted: true, dealId: { not: null }, NOT: { outcomeNotes: '' } },
    select: { id: true, customerName: true, dealId: true, outcomeNotes: true, appointmentDate: true },
    orderBy: { appointmentDate: 'asc' },
  });
  let dealsUpdated = 0;
  for (const a of withOutcome) {
    const deal = await prisma.deal.findUnique({ where: { id: a.dealId! }, select: { id: true, notes: true, deletedAt: true } });
    if (!deal || deal.deletedAt) continue;
    const merged = withOutcomeNotes(deal.notes, a.outcomeNotes, { visitDate: a.appointmentDate });
    if (merged === deal.notes) continue;
    dealsUpdated++;
    console.log(`  deal for ${a.customerName} (visit ${a.appointmentDate})`);
    if (apply) await prisma.deal.update({ where: { id: deal.id }, data: { notes: merged } });
  }
  console.log(`Deals missing their outcome report: ${dealsUpdated} ${apply ? 'updated' : '(dry run — nothing written)'}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
