import assert from 'node:assert/strict';
import test from 'node:test';

import {
  clientIp,
  createRateLimiter,
  createSharedSpendCap,
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

test('the shared cap refuses once the shared total passes the limit', async () => {
  const c = clock();
  let total = 0;
  const cap = createSharedSpendCap({
    api: 'places',
    dailyLimit: 2,
    increment: async () => (total += 1),
    now: c.now,
  });

  assert.equal(await cap.tryConsume(), true);
  assert.equal(await cap.tryConsume(), true);
  assert.equal(await cap.tryConsume(), false);
});

test('a second instance sees spend from the first', async () => {
  const c = clock();
  let shared = 0;
  const increment = async () => (shared += 1);
  const instanceA = createSharedSpendCap({ api: 'places', dailyLimit: 2, increment, now: c.now });
  const instanceB = createSharedSpendCap({ api: 'places', dailyLimit: 2, increment, now: c.now });

  assert.equal(await instanceA.tryConsume(), true);
  assert.equal(await instanceB.tryConsume(), true);
  // The budget is global — B is refused because of A's spend, which is the
  // whole point of moving the counter out of process memory.
  assert.equal(await instanceB.tryConsume(), false);
  assert.equal(await instanceA.tryConsume(), false);
});

test('an exhausted instance stops querying the counter', async () => {
  const c = clock();
  let calls = 0;
  const cap = createSharedSpendCap({
    api: 'places',
    dailyLimit: 1,
    increment: async () => (calls += 1),
    now: c.now,
  });

  await cap.tryConsume();
  await cap.tryConsume(); // refused, and the day is now known to be exhausted
  const afterRefusal = calls;

  for (let i = 0; i < 20; i += 1) assert.equal(await cap.tryConsume(), false);
  // Defending the Google bill must not run up a database bill.
  assert.equal(calls, afterRefusal);
});

test('an exhausted instance recovers on the next day', async () => {
  const c = clock(Date.parse('2026-08-10T23:00:00Z'));
  const perDay = new Map<string, number>();
  const cap = createSharedSpendCap({
    api: 'places',
    dailyLimit: 1,
    increment: async (key) => {
      const next = (perDay.get(key) ?? 0) + 1;
      perDay.set(key, next);
      return next;
    },
    now: c.now,
  });

  assert.equal(await cap.tryConsume(), true);
  assert.equal(await cap.tryConsume(), false);

  c.advance(2 * 60 * 60_000); // into the next UTC day
  assert.equal(await cap.tryConsume(), true);
});

test('an unreachable counter allows the call rather than blocking lookups', async () => {
  const cap = createSharedSpendCap({
    api: 'places',
    dailyLimit: 1,
    increment: async () => {
      throw new Error('database unreachable');
    },
  });

  // A database blip is far likelier than an attack; degrading every address
  // lookup to manual review would be the worse failure.
  assert.equal(await cap.tryConsume(), true);
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
