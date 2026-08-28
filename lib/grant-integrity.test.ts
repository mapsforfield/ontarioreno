/**
 * Safety net for the grant system's INVARIANTS — the rules that, when broken,
 * put something untrue in front of a homeowner.
 *
 * Same idea as src/portal/data/portal-inventory.test.ts, which exists because
 * the Contract Creator was lost to a merge that resolved in favour of the side
 * without it. Nothing caught it until a rep noticed.
 *
 * These are the failures this file is here to catch:
 *   • A published program stops being enrolled in the closure re-scan, so
 *     /grants advertises a program nobody is watching. (The original bug.)
 *   • A closed program's notice or its status flag disappears, so a dead
 *     program silently reads as open again.
 *   • A booking CTA for the CLOSED program comes back on its page, sending a
 *     homeowner to an appointment for funding they cannot apply for — or the
 *     live offer that replaced it disappears, dead-ending the visitor instead.
 *   • The two hand-maintained status lists drift apart, so the nav and the hub
 *     tell a visitor different things about the same city.
 *
 * Deliberately changing one of these? Update the expectation here in the same
 * commit — that makes it a visible line in the diff instead of a silent
 * regression.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { BASEMENT_FINANCING_PROGRAM } from './program-config.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel: string) => readFileSync(join(repoRoot, rel), 'utf8');

const grants = read('lib/grants.ts');
const navbar = read('src/components/Navbar.tsx');

// ─── Publishing must enrol ────────────────────────────────────────────────────

test('publishing a program still enrols it in the closure re-scan', () => {
  assert.ok(
    /PUBLISHED_REVIEW_STATES\.includes\(String\(updated\.reviewState\)\)[\s\S]{0,160}enrollProgramInRescan/.test(grants),
    'Approving a program for /grants no longer enrols it in the re-scan. A program can now be public and unwatched — the exact bug this system was built to fix.',
  );
  assert.ok(
    /updated\.status === 'published' && updated\.programId[\s\S]{0,160}enrollProgramInRescan/.test(grants),
    'Publishing a landing page no longer enrols its program in the re-scan.',
  );
});

test('the monitor still scans watched programs, not just active sources', () => {
  assert.ok(
    /prisma\.grantProgram\.findMany\(\{\s*where:\s*\{\s*watched:\s*true\s*\}/.test(grants),
    'scanAllSources no longer loads watched programs, so a published program whose source was deactivated is invisible again.',
  );
});

test('the nightly worker still self-heals the watch list before scanning', () => {
  const worker = read('scripts/grant-radar-worker.ts');
  assert.ok(
    /backfillWatchlist\(\)/.test(worker),
    'The worker no longer re-runs the backfill before a scan. A publish path that forgets to enrol would go unnoticed.',
  );
});

// ─── Curated rows must be able to say "closed" ────────────────────────────────

test('curated hub rows still carry their own status', () => {
  assert.ok(
    /rows\.push\(\{[^}]*status: c\.status \?\? 'active'/.test(grants),
    "Curated /grants rows are hardcoded 'active' again. A closed curated program would advertise itself as open — this is how Hamilton's closure went unnoticed.",
  );
});

// ─── Closed programs stay closed ──────────────────────────────────────────────
// Update these when a city genuinely reopens; the point is that it takes a
// deliberate edit here rather than happening by accident.

const CLOSED_CITIES = ['Hamilton', 'St. Catharines'];

test('closed curated cities are still marked closed on the hub', () => {
  for (const city of CLOSED_CITIES) {
    const row = grants.split('\n').find((l) => l.includes(`city: '${city}'`) && l.includes('CURATED') === false && l.includes('name:'));
    assert.ok(row, `No CURATED_PAGES row found for ${city}.`);
    assert.match(
      row,
      /status: 'closed'/,
      `${city} is no longer marked closed in CURATED_PAGES, so /grants will advertise it as open. If it genuinely reopened, update CLOSED_CITIES here too.`,
    );
  }
});

test('the nav still separates open programs from closed ones', () => {
  assert.ok(navbar.includes("label: 'Open Now'"), 'The nav no longer groups open programs separately.');
  assert.ok(
    navbar.includes("label: 'Closed — Reference Only'"),
    'The nav no longer labels closed programs, so a homeowner cannot tell before clicking.',
  );
});

test('the nav and the hub agree about which cities are closed', () => {
  // These two lists are maintained by hand and are not wired together, so this
  // is the only thing stopping them from disagreeing in public.
  const closedSection = navbar.slice(navbar.indexOf("label: 'Closed — Reference Only'"));
  // Cut at the end of the section's items array (`],`), not the first `},` —
  // that would be the end of the first ITEM and silently hide every entry after it.
  const closedBlock = closedSection.slice(0, closedSection.indexOf('],'));
  for (const city of CLOSED_CITIES) {
    assert.ok(
      closedBlock.includes(city),
      `${city} is closed on the /grants hub but is not in the nav's closed section. The nav and the hub would tell a visitor different things.`,
    );
  }
});

// ─── The homepage is a status surface too ─────────────────────────────────────
// Added after the homepage spent three weeks featuring Hamilton's closed
// $40,000 grant as the gold "strongest grant opportunity" card, with a
// "See My Estimated Grant" button on it. The hub and the nav were both correct
// the whole time; the homepage was a third hand-maintained copy that nothing
// compared against them. It is compared now.

test('the homepage and the hub agree about which cities are closed', () => {
  const home = read('src/pages/Home.tsx');
  const closures = read('src/lib/programClosures.ts');

  const listed = closures
    .slice(closures.indexOf('CLOSED_GRANT_CITIES = ['))
    .slice(0, closures.slice(closures.indexOf('CLOSED_GRANT_CITIES = [')).indexOf(']'));
  for (const city of CLOSED_CITIES) {
    assert.ok(
      listed.includes(city),
      `${city} is closed on the /grants hub but missing from CLOSED_GRANT_CITIES, so every marketing page treats it as open.`,
    );
  }

  assert.ok(
    home.includes('isGrantCityClosed'),
    'The homepage no longer checks closure status, so a closed grant can be featured as fundable again.',
  );
  for (const city of CLOSED_CITIES) {
    assert.ok(
      new RegExp(`city: '${city}'`).test(home),
      `The homepage features ${city} without tagging it with a city, so isGrantCityClosed cannot mark it closed.`,
    );
  }
});

test('the homepage does not advertise a closed grant amount or a grant CTA', () => {
  const home = read('src/pages/Home.tsx');
  const featured = home.slice(home.indexOf('const featuredPrograms = ['), home.indexOf('const disposableEmailDomains'));

  assert.ok(
    !/Up to \$40,000/.test(featured),
    'The homepage advertises "Up to $40,000" again. Hamilton closed on August 6, 2026 — that is money a reader cannot apply for.',
  );
  assert.ok(
    !/See My Estimated Grant/.test(featured),
    'The homepage offers to estimate a grant for a closed program again.',
  );
  // Comments are stripped first: this file's own notes quote the copy being
  // banned, and a guard that trips on the explanation of why it exists is a
  // guard people delete.
  const homeCopy = home.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  assert.ok(
    !/strongest grant opportunity/.test(homeCopy),
    'The homepage calls a closed program the strongest grant opportunity again.',
  );
});

// ─── No booking for a closed program ──────────────────────────────────────────

const CLOSED_PROGRAM_PAGES = [
  'src/pages/HamiltonGrant.tsx',
  'src/pages/HamiltonSecondarySuiteGrant.tsx',
  'src/pages/HamiltonBasementGrantAd.tsx',
];

test('closed Hamilton pages show the closure notice', () => {
  for (const rel of CLOSED_PROGRAM_PAGES) {
    const source = read(rel);
    assert.ok(
      source.includes('ProgramClosedNotice'),
      `${rel} no longer renders ProgramClosedNotice. The page leads with "$40,000" for a program that is closed.`,
    );
  }
});

test('closed Hamilton pages do not book the closed grant', () => {
  // Narrowed deliberately from "no /consultation/ link at all".
  //
  // What must never happen is a homeowner booking an in-home visit for a grant
  // they cannot apply for — that is a wasted afternoon and our credibility. The
  // ban is therefore on Hamilton's own booking slug, not on booking as such.
  //
  // These pages now route to /consultation/basement, an OPEN Ontario-wide
  // financing offer that builds the same basement with nothing owed upfront.
  // Linking a live program is the point; if that program ever closes, disable
  // it in program-config and the flow's closed screen catches it.
  for (const rel of CLOSED_PROGRAM_PAGES) {
    const source = read(rel);
    const closedBookings = source.match(/href="\/consultation\/hamilton/g) ?? [];
    assert.equal(
      closedBookings.length,
      0,
      `${rel} links to Hamilton's booking calendar again. A homeowner would book an in-home visit for a grant they cannot apply for.`,
    );
  }
});

test('closed Hamilton pages offer the open basement financing consultation', () => {
  // The other half of the rule above: a closed page must not dead-end either.
  // These are paid-for visitors who wanted a finished basement, and the live
  // offer is what keeps the page converting without advertising closed money.
  for (const rel of CLOSED_PROGRAM_PAGES) {
    const source = read(rel);
    assert.ok(
      source.includes('BASEMENT_FINANCING_OFFER'),
      `${rel} no longer offers the basement financing consultation. A closed page with no live next step loses the lead entirely.`,
    );
  }
});

test('the basement financing offer points at a program that is actually enabled', () => {
  // The offer is shown to people whose program just closed. Pointing it at a
  // second closed program would repeat the exact failure it exists to fix.
  const offer = read('src/lib/programClosures.ts');
  const slug = offer.match(/href:\s*"\/consultation\/([a-z-]+)"/)?.[1];
  assert.ok(slug, 'BASEMENT_FINANCING_OFFER must state the consultation slug it links to');
  assert.equal(BASEMENT_FINANCING_PROGRAM.slug, slug);
  assert.equal(
    BASEMENT_FINANCING_PROGRAM.enabled,
    true,
    `/consultation/${slug} is disabled, so every closed page now sends its traffic to another closed program.`,
  );
});

test('the shared closure notice and its data still exist', () => {
  for (const rel of ['src/components/ProgramClosedNotice.tsx', 'src/lib/programClosures.ts']) {
    assert.ok(read(rel).trim().length > 0, `${rel} is missing or empty — every closure notice depends on it.`);
  }
});

test('the calculator does not advertise a closed program as funded', () => {
  const calc = read('src/pages/GrantEligibilityCalculator.tsx');
  assert.ok(
    !/eyebrow: 'Funding active/.test(calc),
    "The calculator says a program has active funding again. Both programs it covers are closed.",
  );
  assert.ok(
    calc.includes('closed: true'),
    'The calculator no longer flags its programs as closed.',
  );
});
