/**
 * READ-ONLY audit: what is published to /grants vs. what is actually enrolled in
 * the recurring re-scan. Writes nothing. Answers "show me the gap".
 *
 *   npx tsx scripts/grant-watch-audit.ts
 *
 * Required env: DATABASE_URL
 */
import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';

neonConfig.webSocketConstructor = ws;

const PUBLISHED_REVIEW_STATES = ['reviewed', 'targeting'];

function pad(s: string, n: number): string {
  const v = s.length > n ? s.slice(0, n - 1) + '…' : s;
  return v + ' '.repeat(Math.max(0, n - v.length));
}

async function main(): Promise<void> {
  const { prisma } = await import('../lib/prisma.js');
  const { CURATED_PAGES } = await import('../lib/grants.js');

  const [programs, sources, pages] = await Promise.all([
    prisma.grantProgram.findMany({ orderBy: [{ city: 'asc' }, { name: 'asc' }] }),
    prisma.grantSource.findMany(),
    prisma.grantLandingPage.findMany(),
  ]);
  const sourceById = new Map(sources.map((s) => [s.id, s]));

  const published = programs.filter((p) => PUBLISHED_REVIEW_STATES.includes(p.reviewState));
  const publishedPages = pages.filter((p) => p.status === 'published');
  // Sources the monitor will actually fetch: active ones, PLUS every source
  // behind a watched (published) program.
  const watchedSourceIds = new Set([
    ...sources.filter((s) => s.active).map((s) => s.id),
    ...programs.filter((p) => p.watched).map((p) => p.sourceId),
  ]);

  console.log('\n=== PUBLISHED to /grants (hub rows: reviewState reviewed|targeting) ===');
  console.log(pad('CITY', 18) + pad('PROGRAM', 44) + pad('STATUS', 9) + pad('DEADLINE', 24) + 'ENROLLED?');
  for (const p of published) {
    const src = sourceById.get(p.sourceId);
    // Enrolment is the `watched` flag; the source being active is no longer
    // required, because the scan now covers watched programs' sources too.
    const enrolled = p.watched;
    console.log(
      pad(p.city, 18) + pad(p.name, 44) + pad(p.status, 9) + pad(p.deadline || '—', 24) +
      (enrolled ? 'yes' : `NO  (source active=${src?.active ?? 'missing'} / pageType=${src?.pageType ?? 'missing'})`),
    );
  }

  console.log('\n=== PUBLISHED landing pages (/grants/:slug) ===');
  for (const pg of publishedPages) {
    const prog = pg.programId ? programs.find((p) => p.id === pg.programId) : null;
    const watched = prog ? watchedSourceIds.has(prog.sourceId) : false;
    console.log(pad('/grants/' + pg.slug, 40) + pad(prog ? prog.status : 'NO PROGRAM LINK', 16) + (watched ? 'watched' : 'NOT WATCHED'));
  }

  console.log('\n=== CURATED hardcoded hub rows (lib/grants.ts CURATED_PAGES) ===');
  for (const c of CURATED_PAGES) {
    console.log(pad(c.city, 18) + pad(c.name, 44) + 'status hardcoded "active" — NEVER re-scanned');
  }

  console.log('\n=== GAP SUMMARY ===');
  const unwatched = published.filter((p) => !p.watched);
  console.log(`published programs:            ${published.length}`);
  console.log(`  of those, NOT enrolled:      ${unwatched.length}   <- must be 0 after backfill`);
  console.log(`flagged as status-changed:     ${programs.filter((p) => p.closureState === 'flagged' || p.closureState === 'auto-downgraded').length}`);
  console.log(`published landing pages:       ${publishedPages.length}`);
  console.log(`hardcoded curated rows:        ${CURATED_PAGES.length} (0 re-scanned)`);
  console.log(`active sources in scan loop:   ${watchedSourceIds.size}`);
  console.log(`  sources with a fetch error:  ${sources.filter((s) => s.active && s.lastError).length}`);
  const stale = sources.filter((s) => s.active && (!s.lastCheckedAt || Date.now() - new Date(s.lastCheckedAt).getTime() > 7 * 864e5));
  console.log(`  not checked in 7+ days:      ${stale.length}`);

  console.log('\n=== PUBLISHED programs whose scraped deadline is already past ===');
  const { isDeadlinePassed } = await import('../lib/grant-closure.js');
  let anyPast = false;
  for (const p of published) {
    if (!isDeadlinePassed(p.deadline)) continue;
    anyPast = true;
    console.log(`  ${p.city} — ${p.name} — deadline "${p.deadline}" — shows "${p.status}" — public override: ${p.publicStatusOverride || 'NONE (still live as-is)'}`);
  }
  if (!anyPast) console.log('  none');

  await prisma.$disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });
