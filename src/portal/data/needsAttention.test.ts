import assert from 'node:assert/strict';
import test from 'node:test';

import { countNeedsAttention, needsAttention, type AttentionFields } from './needsAttention.ts';
import { lostDealIds } from './followUps.ts';
import type { Deal } from './types.ts';

const TODAY = '2026-08-30';
const NOW = new Date(`${TODAY}T12:00:00Z`).getTime();
const daysAgo = (n: number) => new Date(NOW - n * 86400000).toISOString();

const ctx = (lost: Deal[] = []) => ({
  lostDeals: lostDealIds(lost),
  today: TODAY,
  now: NOW,
});

/** A consultation that is fully squared away — nothing should flag. */
const settled = (fields: Partial<AttentionFields> = {}): AttentionFields => ({
  assignedRepId: 'rep-1',
  appointmentDate: '2026-09-15',
  consultationStage: 'consultation_scheduled',
  dealId: null,
  followUpDate: '',
  homeownerInterestLevel: null,
  nextStep: 'estimate_required',
  outcomeSubmitted: false,
  status: 'scheduled',
  updatedAt: daysAgo(0),
  ...fields,
});

test('a squared-away upcoming consultation raises nothing', () => {
  assert.equal(needsAttention(settled(), ctx()), false);
});

test('a completed visit with no outcome report needs attention', () => {
  assert.equal(
    needsAttention(settled({ status: 'completed', outcomeSubmitted: false }), ctx()),
    true
  );
  assert.equal(
    needsAttention(settled({ status: 'completed', outcomeSubmitted: true }), ctx()),
    false
  );
});

test('a date that has passed without being closed out needs attention', () => {
  assert.equal(needsAttention(settled({ appointmentDate: '2026-08-01' }), ctx()), true);
});

test('a hot or warm homeowner with no next step needs attention', () => {
  for (const level of ['hot', 'warm'] as const) {
    assert.equal(
      needsAttention(settled({ homeownerInterestLevel: level, nextStep: 'no_action' }), ctx()),
      true
    );
  }
  assert.equal(
    needsAttention(settled({ homeownerInterestLevel: 'cold', nextStep: 'no_action' }), ctx()),
    false
  );
});

test('a due follow-up needs attention, but not once the deal is lost', () => {
  const due = settled({
    nextStep: 'follow_up_required',
    followUpDate: TODAY,
    dealId: 'd1',
  });
  assert.equal(needsAttention(due, ctx([{ id: 'd1', status: 'negotiating' } as Deal])), true);
  assert.equal(needsAttention(due, ctx([{ id: 'd1', status: 'lost' } as Deal])), false);
});

test('a follow-up dated in the future is not yet due', () => {
  assert.equal(
    needsAttention(settled({ nextStep: 'follow_up_required', followUpDate: '2026-12-01' }), ctx()),
    false
  );
});

// ─── The drift this module exists to close ───────────────────────────────────
// These three raised a flag on the dashboard but were missing from the nav
// badge, so the badge undercounted. Each must now flag from the one shared rule.

test('an estimate left sitting past the stale window needs attention', () => {
  assert.equal(
    needsAttention(settled({ consultationStage: 'estimate_requested', updatedAt: daysAgo(4) }), ctx()),
    true
  );
  assert.equal(
    needsAttention(settled({ consultationStage: 'estimate_requested', updatedAt: daysAgo(1) }), ctx()),
    false
  );
});

test('a contractor review left sitting past the stale window needs attention', () => {
  assert.equal(
    needsAttention(settled({ consultationStage: 'contractor_review', updatedAt: daysAgo(4) }), ctx()),
    true
  );
  assert.equal(
    needsAttention(settled({ consultationStage: 'contractor_review', updatedAt: daysAgo(1) }), ctx()),
    false
  );
});

test('a consultation with nobody assigned needs attention', () => {
  assert.equal(needsAttention(settled({ assignedRepId: '' }), ctx()), true);
});

test('the badge count and the dashboard list agree on the same set', () => {
  // One of each of the three conditions the badge used to miss, plus one that
  // both already agreed on, plus one that should stay quiet.
  const appointments = [
    settled({ consultationStage: 'estimate_requested', updatedAt: daysAgo(9) }),
    settled({ consultationStage: 'contractor_review', updatedAt: daysAgo(9) }),
    settled({ assignedRepId: '' }),
    settled({ status: 'completed', outcomeSubmitted: false }),
    settled(),
  ];
  const context = ctx();
  const listed = appointments.filter((a) => needsAttention(a, context));

  assert.equal(countNeedsAttention(appointments, context), 4);
  assert.equal(listed.length, countNeedsAttention(appointments, context));
});

// ─── Complaints that were deliberately closed — keep them closed ─────────────

test('a missing contractor is not a reason to nag', () => {
  // "change: stop flagging missing contractor as 'needs attention'"
  assert.equal(needsAttention(settled({ dealId: null }), ctx()), false);
});

test('a lost deal goes quiet on the badge as well as the dashboard', () => {
  const chasing = settled({ consultationStage: 'follow_up_required', dealId: 'd1' });
  assert.equal(countNeedsAttention([chasing], ctx([{ id: 'd1', status: 'lost' } as Deal])), 0);
});
