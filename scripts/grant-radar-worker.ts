/**
 * Grant Radar worker — runs on GitHub Actions (no Vercel timeout / cron / function
 * limits). Writes to the same Neon database the portal reads.
 *
 * Usage:
 *   npx tsx scripts/grant-radar-worker.ts discover [limitCities]
 *   npx tsx scripts/grant-radar-worker.ts scan     [limitSources]
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

  const { runDiscovery, scanAllSources, seedSources } = await import('../lib/grants.js');

  // Always make sure the registry + known-good seeds exist before either job.
  await seedSources();

  if (mode === 'discover') {
    const limit = limitArg ?? 6; // cities per weekly run (registry cycles over weeks)
    const result = await runDiscovery({ limit });
    console.log('[grant-radar:discover]', JSON.stringify(result, null, 2));
  } else if (mode === 'scan') {
    const result = await scanAllSources({ limit: limitArg }); // undefined = full sweep
    console.log('[grant-radar:scan]', JSON.stringify(result, null, 2));
  } else {
    throw new Error(`Unknown mode "${mode}" — expected "discover" or "scan".`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => { console.error('[grant-radar] worker failed:', err); process.exit(1); });
