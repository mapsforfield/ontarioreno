import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseDeadlineDate,
  isDeadlinePassed,
  detectClosureLanguage,
  detectPageClosureLanguage,
  extractProminentText,
  detectApplicationLinkRemoved,
  detectClosureSignals,
  shouldAutoDowngrade,
  signalKeys,
} from './grant-closure.js';

const NOW = new Date('2026-08-06T12:00:00Z');

// ─── Deadline parsing ─────────────────────────────────────────────────────────

test('parses the St. Catharines deadline format that went unnoticed', () => {
  const d = parseDeadlineDate('December 31, 2025');
  assert.ok(d);
  assert.equal(d.toISOString().slice(0, 10), '2025-12-31');
  assert.equal(isDeadlinePassed('December 31, 2025', NOW), true);
});

test('parses ISO, day-first, and abbreviated month formats', () => {
  for (const raw of ['2025-12-31', '31 December 2025', 'Dec. 31, 2025', 'Applications close 2025/12/31']) {
    assert.equal(parseDeadlineDate(raw)?.toISOString().slice(0, 10), '2025-12-31', raw);
  }
});

test('a month with no day gets the whole month, so nothing expires early', () => {
  assert.equal(parseDeadlineDate('March 2026')?.toISOString().slice(0, 10), '2026-03-31');
  assert.equal(parseDeadlineDate('February 2024')?.toISOString().slice(0, 10), '2024-02-29');
  // September 2026 is still ahead of NOW — must not be called passed.
  assert.equal(isDeadlinePassed('September 2026', NOW), false);
});

test('a bare year runs to December 31', () => {
  assert.equal(parseDeadlineDate('2026')?.toISOString().slice(0, 10), '2026-12-31');
  assert.equal(isDeadlinePassed('2026', NOW), false);
  assert.equal(isDeadlinePassed('2025', NOW), true);
});

test('open-ended deadlines never parse, so they are never auto-downgraded', () => {
  for (const raw of ['Ongoing', 'rolling intake', 'No deadline', 'first-come, first-served',
    'Open until funds are exhausted', 'while funds last', 'N/A', 'TBD', '']) {
    assert.equal(parseDeadlineDate(raw), null, raw);
    assert.equal(isDeadlinePassed(raw, NOW), false, raw);
  }
});

test('an open-ended phrase wins even when it mentions a year', () => {
  assert.equal(parseDeadlineDate('Ongoing since 2021'), null);
});

// These three are verbatim from a real backfill run. Every one of them is a
// START date sitting in the scraped `deadline` field, and reading them as end
// dates auto-downgraded three live programs on the public page.
test('a start date in the deadline field is not a deadline', () => {
  for (const raw of [
    'Launched January 15, 2025',
    'March 6, 2025 (applications open; pending appeal period)',
    'Program opened April 2024',
    'Effective January 1, 2025',
    'Accepting applications from June 2025',
  ]) {
    assert.equal(parseDeadlineDate(raw), null, raw);
    assert.equal(isDeadlinePassed(raw, NOW), false, raw);
  }
});

test('a real deadline still parses when the text also names a start date', () => {
  assert.equal(
    parseDeadlineDate('Opened March 2024; applications close December 31, 2027')?.toISOString().slice(0, 10),
    '2027-12-31',
  );
  assert.equal(parseDeadlineDate('Open now, deadline March 31, 2025')?.toISOString().slice(0, 10), '2025-03-31');
});

test('the St. Catharines case still fires — it is a genuine end date', () => {
  assert.equal(isDeadlinePassed('December 31, 2025', NOW), true);
});

test('today is not past; yesterday is', () => {
  assert.equal(isDeadlinePassed('August 6, 2026', NOW), false);
  assert.equal(isDeadlinePassed('August 5, 2026', NOW), true);
});

test('unparseable text is null rather than a guess', () => {
  assert.equal(parseDeadlineDate('see the city website'), null);
});

// ─── Closure language ─────────────────────────────────────────────────────────

test('detects each closure phrase we care about', () => {
  const cases = [
    'The program is closed to new applications.',
    'We are no longer accepting applications for this grant.',
    'Funding for this stream has been fully exhausted.',
    'This intake is fully subscribed.',
    'Applicants are being added to a waiting list.',
    'Applications closed on the date shown above.',
  ];
  for (const c of cases) {
    assert.ok(detectClosureLanguage(c).length > 0, c);
  }
});

test('does not fire on a live program that merely has a closing date', () => {
  const live = [
    'Applications close on June 1, 2027 — apply early.',
    'The closing date for this round is March 31, 2027.',
    'The intake will close once the budget is committed.',
    'City Hall is closed on statutory holidays.',
    'Lane closures are in effect on King Street.',
    'The program reopened for a second intake this spring.',
    // The trap: an OPEN program described by its exhaustion condition.
    'This grant is open until funds are exhausted.',
    'Applications are accepted while funds last.',
  ];
  for (const c of live) {
    assert.deepEqual(detectClosureLanguage(c), [], c);
  }
});

test('reports the matching phrase as evidence', () => {
  const [signal] = detectClosureLanguage('Note: this program is closed as of last month.');
  assert.equal(signal.kind, 'closure-language');
  assert.match(signal.detail, /closed/);
});

// ─── Application link ─────────────────────────────────────────────────────────

const APPLY_HTML = '<div><a href="https://city.ca/adu/apply-now">Apply now</a><a href="/contact">Contact</a></div>';
const NO_APPLY_HTML = '<div><a href="/contact">Contact us</a><a href="/news">News</a><a href="/about">About the city</a></div>';

test('an intact apply link is not a removal', () => {
  assert.equal(detectApplicationLinkRemoved(APPLY_HTML.padEnd(250, ' '), 'https://city.ca/adu/apply-now'), false);
});

test('a moved URL that still has an apply link is a move, not a closure', () => {
  assert.equal(detectApplicationLinkRemoved(APPLY_HTML.padEnd(250, ' '), 'https://city.ca/old/apply'), false);
});

test('recorded link gone AND no apply link anywhere is a removal', () => {
  assert.equal(detectApplicationLinkRemoved(NO_APPLY_HTML.padEnd(250, ' '), 'https://city.ca/adu/apply-now'), true);
});

test('missing or tiny HTML never manufactures a signal', () => {
  assert.equal(detectApplicationLinkRemoved('', 'https://city.ca/apply'), false);
  assert.equal(detectApplicationLinkRemoved('<p>hi</p>', 'https://city.ca/apply'), false);
});

// ─── Allocation rules are not closures (the Belleville false positive) ────────
// Verbatim from the Belleville "New Accessory Dwelling Unit Grant" page. The
// scanner matched "budget is exhausted" and flagged a LIVE program as closed:
// the old exclusion required the funding word right after "until the", so
// "until the PROGRAM budget" — two words apart — slipped straight through.
const BELLEVILLE =
  'Funding is available until the program budget is exhausted, and applications ' +
  'are reviewed on a first-come, first-served basis.';

test('a first-come/first-served allocation rule is not a closure', () => {
  assert.deepEqual(detectClosureLanguage(BELLEVILLE), []);
  assert.deepEqual(detectPageClosureLanguage(BELLEVILLE, `<h1>New Accessory Dwelling Unit Grant</h1><p>${BELLEVILLE}</p>`), []);
});

test('conditional funding language stays live however it is phrased', () => {
  const live = [
    'Funding is available until the program budget is exhausted.',
    'Grants are issued until the annual allocation is exhausted.',
    'Applications are accepted while the budget lasts.',
    'Awards continue unless the available funds are depleted.',
    'The rebate is subject to funding availability.',
    'Applications are reviewed on a first-come, first-served basis.',
    'Funding is available until funds are exhausted; apply early.',
  ];
  for (const c of live) assert.deepEqual(detectClosureLanguage(c), [], c);
});

test('a completed exhaustion still fires — the rule change must not blunt it', () => {
  for (const c of [
    'The program budget has been fully exhausted for 2026.',
    'Funding for this stream has been fully allocated.',
    'The 2026 allocation was depleted in March.',
  ]) {
    assert.ok(detectClosureLanguage(c).length > 0, c);
  }
});

// ─── Confidence and DOM scoping ───────────────────────────────────────────────

test('loose wording in body copy is dropped, but flagged in a status banner', () => {
  assert.deepEqual(detectPageClosureLanguage('The application window is closing soon.'), []);

  const banner = '<div class="alert alert-danger">Intake closed</div><p>About the grant.</p>';
  const signals = detectPageClosureLanguage('About the grant.', banner);
  assert.equal(signals.length, 1);
  assert.equal(signals[0].placement, 'prominent');
  assert.match(signals[0].detail, /Status banner says/);
});

test('an explicit phrase in a banner outranks the same phrase in body copy', () => {
  const html = '<div class="program-status">This program is closed to new applications.</div>';
  const [signal] = detectPageClosureLanguage('This program is closed to new applications.', html);
  assert.equal(signal.confidence, 'high');
  assert.equal(signal.placement, 'prominent');
});

test('an explicit phrase in body copy alone is medium, and still reported', () => {
  const [signal] = detectClosureLanguage('We are no longer accepting applications for this grant.');
  assert.equal(signal.confidence, 'medium');
  assert.equal(signal.placement, 'body');
});

test('every reported signal clears the confidence threshold', () => {
  const signals = detectPageClosureLanguage(
    'This program is closed.',
    '<h2>Program closed</h2><span class="badge">Closed</span>',
  );
  assert.ok(signals.length > 0);
  for (const s of signals) assert.notEqual(s.confidence, 'low');
});

test('status regions are pulled out of headings, badges and meta tags', () => {
  const html =
    '<meta name="description" content="The intake is closed."><h1>ADU Grant</h1>' +
    '<div class="callout"><p>No longer accepting applications.</p></div><p>Body copy here.</p>';
  const prominent = extractProminentText(html);
  assert.match(prominent, /intake is closed/);
  assert.match(prominent, /ADU Grant/);
  assert.match(prominent, /No longer accepting/);
});

test('a page with no HTML is judged as body copy, never upgraded', () => {
  assert.equal(extractProminentText(''), '');
  assert.deepEqual(detectPageClosureLanguage('The window is closing soon.', ''), []);
});

test('the Belleville page raises no signals end to end', () => {
  const signals = detectClosureSignals(
    { name: 'New Accessory Dwelling Unit Grant', deadline: 'Until program budget exhausted; first-come, first-served', sourceUrl: 'https://belleville.ca/adu/apply-now' },
    { httpStatus: 200, text: BELLEVILLE, html: APPLY_HTML.padEnd(250, ' ') },
    NOW,
  );
  assert.deepEqual(signals, []);
});

// ─── Combined ─────────────────────────────────────────────────────────────────

const program = { name: 'Test ADU Grant', deadline: 'December 31, 2027', sourceUrl: 'https://city.ca/adu/apply-now' };
const liveObs = { httpStatus: 200, text: 'Apply for up to $40,000 toward an additional dwelling unit. Applications close December 31, 2027.', html: APPLY_HTML.padEnd(250, ' ') };

test('a healthy live page raises no signals', () => {
  assert.deepEqual(detectClosureSignals(program, liveObs, NOW), []);
});

test('a 404 raises http-gone and stops reading the page', () => {
  const signals = detectClosureSignals(program, { httpStatus: 404, fetchError: 'HTTP 404', text: '', html: '' }, NOW);
  assert.equal(signals.length, 1);
  assert.equal(signals[0].kind, 'http-gone');
});

test('a 404 still reports a past deadline we already hold', () => {
  const signals = detectClosureSignals({ ...program, deadline: 'December 31, 2025' }, { httpStatus: 404, fetchError: 'HTTP 404', text: '', html: '' }, NOW);
  assert.deepEqual(signalKeys(signals), 'deadline-passed,http-gone');
});

test('a network outage is not treated as a closure', () => {
  const signals = detectClosureSignals(program, { httpStatus: 0, fetchError: 'timeout', text: '', html: '' }, NOW);
  assert.deepEqual(signals, []);
});

test('a 500 is an outage, not a closure', () => {
  const signals = detectClosureSignals(program, { httpStatus: 500, fetchError: 'HTTP 500', text: '', html: '' }, NOW);
  assert.deepEqual(signals, []);
});

test('closure language on a reachable page is flagged', () => {
  const signals = detectClosureSignals(program, { ...liveObs, text: 'This program is closed. Funding has been fully exhausted.' }, NOW);
  assert.ok(signals.some((s) => s.kind === 'closure-language'));
});

test('only a passed deadline auto-downgrades the public page', () => {
  assert.equal(shouldAutoDowngrade([{ kind: 'closure-language', detail: 'x' }]), false);
  assert.equal(shouldAutoDowngrade([{ kind: 'http-gone', detail: 'x' }]), false);
  assert.equal(shouldAutoDowngrade([{ kind: 'link-removed', detail: 'x' }]), false);
  assert.equal(shouldAutoDowngrade([{ kind: 'deadline-passed', detail: 'x' }]), true);
});

// ─── Wiring guard ─────────────────────────────────────────────────────────────
// The original bug was not a broken function — it was two sets that drifted:
// "sources we re-scan" and "programs we published". These assert the structural
// link stays in place, so a future edit that unpicks it turns CI red rather than
// quietly putting a program back on /grants with nobody watching it.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const grantsSource = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'grants.ts'), 'utf8');

test('every publish path enrols the program in the re-scan', () => {
  // reviewState → reviewed/targeting (the /grants hub gate)
  assert.match(grantsSource, /PUBLISHED_REVIEW_STATES\.includes\(String\(updated\.reviewState\)\)[\s\S]{0,120}enrollProgramInRescan/);
  // publishing a landing page
  assert.match(grantsSource, /updated\.status === 'published' && updated\.programId[\s\S]{0,120}enrollProgramInRescan/);
});

test('the monitor scans watched programs, not just active sources', () => {
  assert.match(grantsSource, /prisma\.grantProgram\.findMany\(\{\s*where:\s*\{\s*watched:\s*true\s*\}/);
  // Closure checks must not sit behind the fetch-error guard or the content hash.
  const closureIdx = grantsSource.indexOf('result.watchedChecked++');
  const errorGuardIdx = grantsSource.indexOf('if (obs.fetchError) {');
  const hashIdx = grantsSource.indexOf('const unchanged = sig === source.lastHash');
  assert.ok(closureIdx > 0 && errorGuardIdx > 0 && hashIdx > 0, 'scan structure changed — re-check this guard');
  assert.ok(closureIdx < errorGuardIdx, 'closure check must run before the fetch-error early-continue');
  assert.ok(closureIdx < hashIdx, 'closure check must run before the content-hash short-circuit');
});

test('the scan pulls a deactivated source back in for a watched program', () => {
  assert.match(grantsSource, /enrollProgramInRescan[\s\S]{0,600}grantSource\.update\(\{ where: \{ id: p\.sourceId \}, data: \{ active: true \} \}/);
});

test('signal keys are stable regardless of detection order', () => {
  const a = signalKeys([{ kind: 'deadline-passed', detail: '' }, { kind: 'http-gone', detail: '' }]);
  const b = signalKeys([{ kind: 'http-gone', detail: '' }, { kind: 'deadline-passed', detail: '' }, { kind: 'http-gone', detail: '' }]);
  assert.equal(a, b);
});
