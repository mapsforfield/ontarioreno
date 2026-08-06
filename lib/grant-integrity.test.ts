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
 *   • A booking CTA comes back on a closed program's page, sending a homeowner
 *     to an appointment for funding they cannot apply for.
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

test('closed Hamilton pages do not send anyone to the booking calendar', () => {
  for (const rel of CLOSED_PROGRAM_PAGES) {
    const source = read(rel);
    const bookingLinks = source.match(/href="\/consultation\//g) ?? [];
    assert.equal(
      bookingLinks.length,
      0,
      `${rel} links to the booking calendar again. A homeowner would book an in-home visit for a grant they cannot apply for.`,
    );
  }
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
