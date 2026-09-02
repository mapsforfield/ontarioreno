import test from 'node:test';
import assert from 'node:assert/strict';

import { dealWonDate, nextWonAt, wonInMonth } from './deal-won-date.ts';

const MARCH = '2026-03-14T10:00:00Z';
const SEPTEMBER = '2026-09-02T10:00:00Z';
const dateKey = (d: Date) => d.toISOString().slice(0, 10);

test('a deal won in March stays in March after it is edited in September', () => {
  const deal = { status: 'won', wonAt: MARCH, updatedAt: SEPTEMBER };
  assert.equal(dealWonDate(deal)?.toISOString(), new Date(MARCH).toISOString());
  assert.equal(wonInMonth(deal, '2026-09', dateKey), false, 'this is the bug — it must not count as September');
  assert.equal(wonInMonth(deal, '2026-03', dateKey), true);
});

test('a deal won before the column existed falls back to updatedAt', () => {
  const deal = { status: 'won', wonAt: null, updatedAt: SEPTEMBER };
  assert.equal(dealWonDate(deal)?.toISOString(), new Date(SEPTEMBER).toISOString());
});

test('a deal that is not won has no win date at all', () => {
  assert.equal(dealWonDate({ status: 'lost', wonAt: MARCH, updatedAt: SEPTEMBER }), null);
  assert.equal(dealWonDate({ status: 'proposal_sent', wonAt: null, updatedAt: SEPTEMBER }), null);
  assert.equal(
    wonInMonth({ status: 'lost', wonAt: null, updatedAt: SEPTEMBER }, '2026-09', dateKey),
    false,
    'a lost deal must never land in a WON bucket through the fallback'
  );
});

test('wonAt is stamped on the way into won and cleared on the way out', () => {
  const now = new Date(SEPTEMBER);
  assert.equal(nextWonAt('proposal_sent', 'won', now), now);
  assert.equal(nextWonAt('won', 'lost', now), null);
});

test('an edit that is not a status change leaves the win date alone', () => {
  const now = new Date(SEPTEMBER);
  assert.equal(nextWonAt('won', undefined, now), undefined, 'editing a note must not re-date the win');
  assert.equal(nextWonAt('won', 'won', now), undefined, 'a no-op status write must not re-date it either');
  assert.equal(nextWonAt('lost', 'proposal_sent', now), undefined);
});

test('re-winning a deal takes the later date, not the original', () => {
  const now = new Date(SEPTEMBER);
  // It was not won during the stretch it sat in lost.
  assert.equal(nextWonAt('lost', 'won', now), now);
});
