import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// ─── Meta Pixel route guard ───────────────────────────────────────────────────
// Customer reschedule/cancel URLs carry a signed token in the query string. The
// Meta Pixel sends the full page URL to Meta as payload data (`dl`), which
// Referrer-Policy cannot suppress, so the pixel must not load on those routes.
//
// This test reads the real index.html and evaluates the actual regex literal
// that ships, rather than a copy. That way it fails if someone widens the guard
// (silently disabling analytics across the portal) or narrows it (re-opening the
// token leak) — the two ways this can regress.

const here = dirname(fileURLToPath(import.meta.url));
const indexHtml = readFileSync(join(here, '..', 'index.html'), 'utf8');

function extractGuardPattern(): RegExp {
  const match = indexHtml.match(/var OR_TOKENISED_ROUTES = (\/.*\/[gimsuy]*);/);
  assert.ok(
    match,
    'index.html must declare `var OR_TOKENISED_ROUTES = /.../;` — the Meta Pixel route guard'
  );
  const [body, flags] = (() => {
    const literal = match![1];
    const lastSlash = literal.lastIndexOf('/');
    return [literal.slice(1, lastSlash), literal.slice(lastSlash + 1)];
  })();
  return new RegExp(body, flags);
}

/** Routes whose URLs carry a signed token — the pixel must NOT load. */
const MUST_BLOCK = [
  '/portal/consultation/abc123/reschedule',
  '/portal/consultation/abc123/cancel',
  '/portal/consultation/clx0000000000000000000001/reschedule',
  '/portal/consultation/clx0000000000000000000001/cancel',
  // Trailing slash is the same route.
  '/portal/consultation/abc123/reschedule/',
  '/portal/consultation/abc123/cancel/',
];

/** Everything else — the pixel must continue to work exactly as before. */
const MUST_ALLOW = [
  '/',
  '/hamilton-basement-grant',
  '/hamilton-grant-guide',
  '/grants/hamilton-adu-grant',
  '/contractor-partners',
  '/match',
  // Other portal pages must not lose analytics.
  '/portal',
  '/portal/login',
  '/portal/appointments',
  '/portal/deals',
  // Consultation paths that are NOT the two token-bearing action routes.
  '/portal/consultation',
  '/portal/consultation/abc123',
  '/portal/consultation/abc123/details',
  '/portal/consultation/abc123/rescheduled',
  '/portal/consultation/abc123/cancellation',
  // Similar-looking paths elsewhere in the tree.
  '/consultation/abc123/reschedule',
  '/portal/consultations/abc123/cancel',
];

test('the guard blocks exactly the two token-bearing customer routes', () => {
  const pattern = extractGuardPattern();
  for (const path of MUST_BLOCK) {
    assert.equal(
      pattern.test(path),
      true,
      `expected the Meta Pixel to be suppressed on ${path} — it carries a signed token`
    );
  }
});

test('the guard leaves every other route untouched', () => {
  const pattern = extractGuardPattern();
  for (const path of MUST_ALLOW) {
    assert.equal(
      pattern.test(path),
      false,
      `expected the Meta Pixel to still load on ${path} — the guard is too broad`
    );
  }
});

test('the guard is anchored, so a token route cannot be smuggled past it', () => {
  const pattern = extractGuardPattern();
  // A nested path is not one of the two routes; an unanchored pattern would
  // match these and silently disable the pixel more widely than intended.
  assert.equal(pattern.test('/x/portal/consultation/abc/reschedule'), false);
  assert.equal(pattern.test('/portal/consultation/a/b/reschedule'), false);
  assert.equal(pattern.test('/portal/consultation//reschedule'), false);
});

test('pixel initialization and PageView are inside the guard', () => {
  const guardIndex = indexHtml.indexOf('OR_TOKENISED_ROUTES.test');
  const initIndex = indexHtml.indexOf("fbq('init'");
  const pageViewIndex = indexHtml.indexOf("fbq('track', 'PageView')");

  assert.ok(guardIndex > -1, 'the guard condition must be present in index.html');
  assert.ok(initIndex > -1, 'fbq init must still be present — the pixel is not being removed');
  assert.ok(pageViewIndex > -1, 'the PageView call must still be present');

  // Both must come after the guard; if either were hoisted above it, the pixel
  // would fire before the path check and leak the token.
  assert.ok(initIndex > guardIndex, "fbq('init') must sit inside the route guard");
  assert.ok(pageViewIndex > guardIndex, "fbq PageView must sit inside the route guard");
});

test('the third-party pixel script is not loaded outside the guard', () => {
  const guardIndex = indexHtml.indexOf('OR_TOKENISED_ROUTES.test');
  const scriptIndex = indexHtml.indexOf('connect.facebook.net');
  assert.ok(scriptIndex > -1, 'the pixel loader must still be present');
  assert.ok(
    scriptIndex > guardIndex,
    'fbevents.js must not be requested before the route check — no third-party request on token routes'
  );
});
