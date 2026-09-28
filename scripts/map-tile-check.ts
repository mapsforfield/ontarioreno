/**
 * Daily check that the public maps still get real map tiles.
 *
 *   npx tsx scripts/map-tile-check.ts
 *
 * Probes the primary AND fallback providers from lib/map-tiles.ts. If either is
 * serving a placeholder or failing, it emails GRANT_ALERT_EMAIL (when
 * RESEND_API_KEY is set) and exits 1 so the GitHub Actions run goes red.
 *
 * The site already swaps to the fallback on its own; this is so a swap — or a
 * fallback that has quietly died too — never goes unnoticed the way CARTO's
 * "API KEY REQUIRED" watermark did.
 *
 * Optional env: RESEND_API_KEY, GRANT_ALERT_EMAIL, EMAIL_FROM
 */
import { Resend } from 'resend';
import { FALLBACK_TILES, PRIMARY_TILES, probeTiles } from '../lib/map-tiles.js';

// OSM's usage policy blocks anonymous clients — identify ourselves.
const init = { headers: { 'User-Agent': 'OntarioReno-map-check/1.0 (+https://ontarioreno.ca)' } };

async function main(): Promise<void> {
  const problems: string[] = [];
  for (const [role, p] of [['PRIMARY', PRIMARY_TILES], ['FALLBACK', FALLBACK_TILES]] as const) {
    const problem = await probeTiles(p, init);
    console.log(`${role} ${p.name}: ${problem ?? 'OK'}`);
    if (problem) problems.push(`${role} — ${p.name}: ${problem}`);
  }
  if (!problems.length) return;

  const primaryDown = problems.some((p) => p.startsWith('PRIMARY'));
  const fallbackDown = problems.some((p) => p.startsWith('FALLBACK'));
  const impact = primaryDown && fallbackDown
    ? 'The /grants map is showing NO usable map background right now.'
    : primaryDown
      ? 'The /grants map has switched itself to the fallback and still works, but it is running without a spare.'
      : 'The /grants map is fine, but its fallback is broken — the next primary outage would blank it.';
  const body = [
    impact, '',
    ...problems, '',
    'Fix: pick a working keyless provider in lib/map-tiles.ts (the only place tile URLs live).',
  ].join('\n');
  console.error(body);

  if (process.env.RESEND_API_KEY) {
    const from = process.env.EMAIL_FROM ?? 'OntarioReno <info@ontarioreno.ca>';
    const to = process.env.GRANT_ALERT_EMAIL ?? 'info@ontarioreno.ca';
    try {
      await new Resend(process.env.RESEND_API_KEY).emails.send({ from, to, subject: '⚠ Grants map tiles need attention', text: body });
    } catch (err) {
      console.error('[map-tile-check] alert email failed:', err);
    }
  }
  process.exitCode = 1;
}

main().catch((err) => { console.error(err); process.exitCode = 1; });
