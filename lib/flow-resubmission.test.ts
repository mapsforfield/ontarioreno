import test from 'node:test';
import assert from 'node:assert/strict';

import { isResubmission, RESUBMISSION_WINDOW_MS } from './flow-resubmission.ts';

const NOW = new Date('2026-09-02T20:07:42Z');

function prior(overrides: Partial<Parameters<typeof isResubmission>[0]> = {}) {
  return {
    createdAt: new Date(NOW.getTime() - 49_000),
    appointmentId: null,
    status: 'new',
    submissionContactedAt: null,
    deletedAt: null,
    ...overrides,
  };
}

// The real cluster from scripts/submission-duplicate-audit.ts.
test('the same visit pressing the button again reuses the row', () => {
  assert.equal(isResubmission(prior(), NOW), true, '49 seconds later is the same attempt');
  assert.equal(
    isResubmission(prior({ createdAt: new Date(NOW.getTime() - 22_000) }), NOW),
    true,
    '22 seconds — Huy Hoang Nguyen'
  );
});

test('two real bookings weeks apart stay two rows', () => {
  // Stanley booked, then booked again 25 hours later. Both are real jobs.
  assert.equal(
    isResubmission(prior({ createdAt: new Date(NOW.getTime() - 25 * 3600_000) }), NOW),
    false
  );
  assert.equal(
    isResubmission(prior({ createdAt: new Date(NOW.getTime() - RESUBMISSION_WINDOW_MS - 1) }), NOW),
    false,
    'just past the window is a new submission'
  );
});

test('a submission that already booked is never overwritten', () => {
  assert.equal(
    isResubmission(prior({ appointmentId: 'apt_1' }), NOW),
    false,
    'the appointment is the thing the row exists to record'
  );
});

test('a submission a rep has already worked is never overwritten', () => {
  assert.equal(isResubmission(prior({ submissionContactedAt: NOW }), NOW), false);
  assert.equal(
    isResubmission(prior({ status: 'attempting' }), NOW),
    false,
    'anything logged against the lead moves it off new'
  );
});

test('a trashed submission is not revived through the side door', () => {
  assert.equal(isResubmission(prior({ deletedAt: NOW }), NOW), false);
});

test('clock skew does not start a duplicate', () => {
  assert.equal(
    isResubmission(prior({ createdAt: new Date(NOW.getTime() + 5_000) }), NOW),
    true
  );
});
