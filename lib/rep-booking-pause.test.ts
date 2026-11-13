import test from 'node:test';
import assert from 'node:assert/strict';
import { availableSlotsForLead, BOOKABLE_REP_QUERY } from './lead-availability.ts';

// ─── Pausing a rep for new bookings ──────────────────────────────────────────
// Admin → Calendar settings → "Who gets new bookings" flips
// User.acceptsPublicBooking. The public calendar, the text flow and bookSlot
// all pick reps through BOOKABLE_REP_QUERY, so that one filter is the whole
// feature. If it is dropped, the switch in the portal still moves and nothing
// happens — a paused rep keeps getting leads and nobody can tell why.

test('the bookable-rep query excludes paused reps', () => {
  assert.equal(BOOKABLE_REP_QUERY.where.acceptsPublicBooking, true);
  assert.equal(BOOKABLE_REP_QUERY.where.active, true);
  assert.equal(BOOKABLE_REP_QUERY.where.role, 'rep');
});

test('availability asks the store for reps with exactly that query', async () => {
  let seen: unknown;
  await availableSlotsForLead(
    {
      user: {
        findMany: async (args) => {
          seen = args;
          return [];
        },
      },
      appointment: { findMany: async () => [] },
      repDayOff: { findMany: async () => [] },
    },
    { schedulingArea: 'ONTARIO', city: 'Oakville' },
    '2026-11-13T09:00'
  );
  assert.deepEqual(seen, BOOKABLE_REP_QUERY);
});
