/**
 * Grant Radar worker — runs on GitHub Actions (no Vercel timeout / cron / function
 * limits). Writes to the same Neon database the portal reads.
 *
 * Usage:
 *   npx tsx scripts/grant-radar-worker.ts discover [limitCities]
 *   npx tsx scripts/grant-radar-worker.ts scan     [limitSources]
 *   npx tsx scripts/grant-radar-worker.ts backfill            (enrol every published program)
 *   npx tsx scripts/grant-radar-worker.ts deadlines           (flag past deadlines, no fetching)
 *
 * Required env: DATABASE_URL, ANTHROPIC_API_KEY, TAVILY_API_KEY
 * Optional env: RESEND_API_KEY, GRANT_ALERT_EMAIL, EMAIL_FROM, GRANT_EXTRACT_MODEL
 *
 * The Neon serverless driver needs a WebSocket constructor in plain Node, so we
 * set it BEFORE importing lib/grants (which lazily builds the Prisma client).
 */
import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';

neonConfig.webSocketConstructor = ws;

async function main(): Promise<void> {
  const mode = (process.argv[2] ?? 'scan').toLowerCase();
  const limitArg = process.argv[3] ? Number(process.argv[3]) : undefined;

  const { runDiscovery, scanAllSources, seedSources, backfillWatchlist, sweepPastDeadlines } =
    await import('../lib/grants.js');

  // Always make sure the registry + known-good seeds exist before either job.
  await seedSources();

  if (mode === 'discover') {
    const limit = limitArg ?? 6; // cities per weekly run (registry cycles over weeks)
    const result = await runDiscovery({ limit });
    console.log('[grant-radar:discover]', JSON.stringify(result, null, 2));
  } else if (mode === 'scan') {
    // Self-healing enrolment: anything published since the last run joins the
    // watch list before we scan, so the two sets cannot drift apart again even
    // if a future publish path forgets to call enrollProgramInRescan.
    const enrolment = await backfillWatchlist();
    if (enrolment.enrolled > 0) console.log('[grant-radar:scan] enrolled', enrolment.enrolled, 'newly-published programs');
    const result = await scanAllSources({ limit: limitArg }); // undefined = full sweep
    console.log('[grant-radar:scan]', JSON.stringify(result, null, 2));
  } else if (mode === 'backfill') {
    const enrolment = await backfillWatchlist();
    const pastDeadlines = await sweepPastDeadlines();
    console.log('[grant-radar:backfill]', JSON.stringify({ ...enrolment, pastDeadlines }, null, 2));
  } else if (mode === 'deadlines') {
    console.log('[grant-radar:deadlines]', JSON.stringify(await sweepPastDeadlines(), null, 2));
  } else if (mode === 'audit') {
    // READ-ONLY. Prints the published set vs. the enrolled set so the gap this
    // whole feature exists to close can actually be checked, not assumed.
    const { runAudit } = await import('./grant-watch-audit.js');
    await runAudit();
  } else {
    throw new Error(`Unknown mode "${mode}" — expected "discover", "scan", "backfill", "deadlines", or "audit".`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => { console.error('[grant-radar] worker failed:', err); process.exit(1); });
