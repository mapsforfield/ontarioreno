/**
 * Recover the real win date for deals won before `Deal.wonAt` existed.
 *
 *   DATABASE_URL='<neon url>' npx tsx scripts/deal-won-date-backfill.ts          # report only
 *   DATABASE_URL='<neon url>' npx tsx scripts/deal-won-date-backfill.ts --write  # apply
 *
 * READ-ONLY unless --write is passed.
 *
 * Why this is recoverable at all: every status change writes an Activity row
 * with actionType 'deal_status_changed' and metadata {from, to}. The createdAt
 * of the FIRST row where to = 'won' is when the deal was actually won — a fact
 * updatedAt lost the moment anyone edited the deal afterwards.
 *
 * Deals with no such row keep wonAt null and go on falling back to updatedAt,
 * exactly as they behave today. A guessed date would be worse than a known
 * approximation: it would look authoritative on a screen reps are paid against.
 *
 * Nothing here touches a deal that already has wonAt, and nothing changes a
 * deal's status, value or commission.
 */
import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';

neonConfig.webSocketConstructor = ws;

function pad(s: string, n: number): string {
  const v = s.length > n ? s.slice(0, n - 1) + '…' : s;
  return v + ' '.repeat(Math.max(0, n - v.length));
}

export async function runWonDateBackfill(write: boolean): Promise<void> {
  const { prisma } = await import('../lib/prisma.js');
  const { ensureSchema } = await import('../lib/schema.js');

  // The wonAt column reaches production lazily, on first access. Run the same
  // reconcile here so this script works whether or not anything has touched a
  // deal since the deploy — otherwise it fails with a bare ColumnNotFound and
  // the fix looks broken rather than merely early.
  await ensureSchema();

  const deals = await prisma.deal.findMany({
    where: { status: 'won', wonAt: null, deletedAt: null },
    select: {
      id: true,
      homeownerName: true,
      estimatedJobValue: true,
      isHistorical: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: 'desc' },
  });

  console.log(`\nWon deals with no recorded win date: ${deals.length}`);
  if (deals.length === 0) {
    console.log('Nothing to do.\n');
    return;
  }

  // One query for every status-change row on these deals, then matched in
  // memory — a per-deal query would be one round trip each against Neon.
  const activity = await prisma.activity.findMany({
    where: {
      actionType: 'deal_status_changed',
      dealId: { in: deals.map((d) => d.id) },
    },
    select: { dealId: true, createdAt: true, metadata: true },
    orderBy: { createdAt: 'asc' },
  });

  const firstWonAt = new Map<string, Date>();
  for (const row of activity) {
    const to = (row.metadata as { to?: string } | null)?.to;
    if (to !== 'won' || !row.dealId) continue;
    // Ordered ascending, so the first one seen is the earliest.
    if (!firstWonAt.has(row.dealId)) firstWonAt.set(row.dealId, row.createdAt);
  }

  const recoverable = deals.filter((d) => firstWonAt.has(d.id));
  const unknown = deals.filter((d) => !firstWonAt.has(d.id));

  const header =
    pad('WON (recovered)', 22) + pad('WAS SHOWING AS', 22) + pad('MOVES?', 8) +
    pad('HOMEOWNER', 24) + 'VALUE';

  console.log(`\n=== Recoverable from the activity log: ${recoverable.length} ===`);
  console.log(header);
  for (const d of recoverable) {
    const won = firstWonAt.get(d.id)!;
    const moves = won.toISOString().slice(0, 7) !== d.updatedAt.toISOString().slice(0, 7);
    console.log(
      pad(won.toISOString().slice(0, 10), 22) +
      pad(d.updatedAt.toISOString().slice(0, 10), 22) +
      pad(moves ? 'YES' : '—', 8) +
      pad(d.homeownerName ?? '—', 24) +
      `$${Math.round(d.estimatedJobValue).toLocaleString()}`
    );
  }

  console.log(`\n=== No status-change row — left on the updatedAt fallback: ${unknown.length} ===`);
  for (const d of unknown) {
    console.log(
      '  ' + pad(d.updatedAt.toISOString().slice(0, 10), 14) +
      pad(d.homeownerName ?? '—', 24) +
      (d.isHistorical ? '(historical import)' : '')
    );
  }

  const moving = recoverable.filter(
    (d) => firstWonAt.get(d.id)!.toISOString().slice(0, 7) !== d.updatedAt.toISOString().slice(0, 7)
  );
  console.log(`\nDeals that will move OUT of the month they are currently shown in: ${moving.length}`);

  if (!write) {
    console.log('\nRead-only. Re-run with --write to apply.\n');
    return;
  }

  let written = 0;
  for (const d of recoverable) {
    await prisma.deal.update({ where: { id: d.id }, data: { wonAt: firstWonAt.get(d.id)! } });
    written++;
  }
  console.log(`\nWrote wonAt on ${written} deals. ${unknown.length} left on the fallback.\n`);
}

if (process.argv[1] && process.argv[1].includes('deal-won-date-backfill')) {
  runWonDateBackfill(process.argv.includes('--write'))
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
