import assert from 'node:assert/strict';
import test from 'node:test';

import {
  clientIp,
  createRateLimiter,
  createSpendCap,
  createTtlCache,
} from './rate-limit.js';

/** Controllable clock, so nothing here depends on wall time. */
function clock(start = 1_700_000_000_000) {
  let at = start;
  return { now: () => at, advance: (ms: number) => (at += ms) };
}

test('a caller is allowed up to the limit and refused after it', () => {
  const c = clock();
  const limiter = createRateLimiter(c.now);
  const rule = { limit: 3, windowMs: 60_000 };

  assert.equal(limiter.check('a', rule).allowed, true);
  assert.equal(limiter.check('a', rule).allowed, true);
  const third = limiter.check('a', rule);
  assert.equal(third.allowed, true);
  assert.equal(third.remaining, 0);

  const refused = limiter.check('a', rule);
  assert.equal(refused.allowed, false);
  assert.ok(refused.retryAfterSeconds > 0);
});

test('callers are counted independently', () => {
  const c = clock();
  const limiter = createRateLimiter(c.now);
  const rule = { limit: 1, windowMs: 60_000 };

  assert.equal(limiter.check('a', rule).allowed, true);
  assert.equal(limiter.check('a', rule).allowed, false);
  // A different caller is unaffected by the first one's exhaustion.
  assert.equal(limiter.check('b', rule).allowed, true);
});

test('the window slides rather than resetting on a boundary', () => {
  const c = clock();
  const limiter = createRateLimiter(c.now);
  const rule = { limit: 2, windowMs: 1000 };

  limiter.check('a', rule);
  c.advance(600);
  limiter.check('a', rule);
  assert.equal(limiter.check('a', rule).allowed, false);

  // The first hit ages out; exactly one slot frees up, not the whole budget.
  c.advance(500);
  assert.equal(limiter.check('a', rule).allowed, true);
  assert.equal(limiter.check('a', rule).allowed, false);
});

test('retry-after reflects when a slot actually frees', () => {
  const c = clock();
  const limiter = createRateLimiter(c.now);
  const rule = { limit: 1, windowMs: 10_000 };

  limiter.check('a', rule);
  c.advance(4000);
  assert.equal(limiter.check('a', rule).retryAfterSeconds, 6);
});

test('the forged half of x-forwarded-for cannot mint a fresh identity', () => {
  // Vercel appends the address it observed; anything before it is client-sent.
  assert.equal(clientIp({ 'x-forwarded-for': '203.0.113.9' }), '203.0.113.9');
  assert.equal(
    clientIp({ 'x-forwarded-for': '1.2.3.4, 203.0.113.9' }),
    '203.0.113.9'
  );
  // A spoofed leading entry must not change the key we rate-limit on.
  const spoofed = clientIp({ 'x-forwarded-for': 'totally-made-up, 203.0.113.9' });
  assert.equal(spoofed, '203.0.113.9');
});

test('client ip falls back rather than throwing', () => {
  assert.equal(clientIp({}), 'unknown');
  assert.equal(clientIp({ 'x-real-ip': '198.51.100.7' }), '198.51.100.7');
  assert.equal(clientIp({ 'x-forwarded-for': [] }), 'unknown');
});

test('the spend cap refuses once the daily budget is gone', () => {
  const c = clock();
  const cap = createSpendCap(2, c.now);

  assert.equal(cap.tryConsume(), true);
  assert.equal(cap.tryConsume(), true);
  assert.equal(cap.tryConsume(), false);
  assert.equal(cap.spentToday(), 2);

  // A refused call must not be billed against the budget it just failed.
  assert.equal(cap.spentToday(), 2);
});

test('the spend cap rolls over to a new day', () => {
  const c = clock(Date.parse('2026-08-10T23:00:00Z'));
  const cap = createSpendCap(1, c.now);

  assert.equal(cap.tryConsume(), true);
  assert.equal(cap.tryConsume(), false);

  c.advance(2 * 60 * 60_000); // into 2026-08-11 UTC
  assert.equal(cap.tryConsume(), true);
});

test('identical lookups are served from cache until they expire', () => {
  const c = clock();
  const cache = createTtlCache<string[]>(1000, 10, c.now);

  cache.set('king st', ['a', 'b']);
  assert.deepEqual(cache.get('king st'), ['a', 'b']);

  c.advance(1001);
  assert.equal(cache.get('king st'), undefined);
});

test('the cache stays bounded', () => {
  const c = clock();
  const cache = createTtlCache<number>(60_000, 3, c.now);

  for (let i = 0; i < 10; i += 1) cache.set(`k${i}`, i);
  // The newest write always survives; the cache never grows past its bound.
  assert.equal(cache.get('k9'), 9);
  assert.equal(cache.get('k0'), undefined);
});
