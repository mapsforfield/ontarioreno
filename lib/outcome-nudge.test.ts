import test from 'node:test';
import assert from 'node:assert/strict';

import { selectOutcomeNudges, torontoNow, outcomeNudgePayload, type NudgeCandidate } from './outcome-nudge.ts';
import { summarizeLostReasons, lostReasonLabel, isLostReason } from './lost-reasons.ts';

const base: NudgeCandidate = {
  id: 'a1',
  appointmentDate: '2026-10-20',
  appointmentTime: '12:00',
  durationMinutes: 60,
  status: 'scheduled',
  appointmentType: 'home_visit',
  outcomeSubmitted: false,
  outcomeNudgedAt: null,
  assignedRepId: 'rep1',
  deletedAt: null,
};
const at = (h: number, m = 0) => h * 60 + m;

test('nudges 15 minutes after the scheduled end, not before', () => {
  assert.equal(selectOutcomeNudges([base], '2026-10-20', at(13, 14)).length, 0);
  assert.equal(selectOutcomeNudges([base], '2026-10-20', at(13, 15)).length, 1);
});

test('gives up after six hours — the Attention tab catches the rest', () => {
  assert.equal(selectOutcomeNudges([base], '2026-10-20', at(19, 0)).length, 1);
  assert.equal(selectOutcomeNudges([base], '2026-10-20', at(19, 1)).length, 0);
});

test('never twice, never once the outcome is in', () => {
  assert.equal(selectOutcomeNudges([{ ...base, outcomeNudgedAt: new Date() }], '2026-10-20', at(14)).length, 0);
  assert.equal(selectOutcomeNudges([{ ...base, outcomeSubmitted: true }], '2026-10-20', at(14)).length, 0);
});

test('quiet hours: nothing before 8:00 or after 21:30 Toronto', () => {
  const late = { ...base, appointmentTime: '20:00' };
  assert.equal(selectOutcomeNudges([late], '2026-10-20', at(21, 30)).length, 1);
  assert.equal(selectOutcomeNudges([late], '2026-10-20', at(21, 31)).length, 0);
  assert.equal(selectOutcomeNudges([{ ...base, appointmentTime: '06:00' }], '2026-10-20', at(7, 59)).length, 0);
});

test('skips cancelled, no-show, rescheduled, events, trashed, unassigned, other days', () => {
  for (const status of ['cancelled', 'no_show', 'rescheduled']) {
    assert.equal(selectOutcomeNudges([{ ...base, status }], '2026-10-20', at(14)).length, 0, status);
  }
  assert.equal(selectOutcomeNudges([{ ...base, appointmentType: 'supplier_meeting' }], '2026-10-20', at(14)).length, 0);
  assert.equal(selectOutcomeNudges([{ ...base, deletedAt: new Date() }], '2026-10-20', at(14)).length, 0);
  assert.equal(selectOutcomeNudges([{ ...base, assignedRepId: null }], '2026-10-20', at(14)).length, 0);
  assert.equal(selectOutcomeNudges([base], '2026-10-21', at(14)).length, 0);
});

test('phone consultations are nudged too — they have outcomes', () => {
  assert.equal(selectOutcomeNudges([{ ...base, appointmentType: 'phone_consultation' }], '2026-10-20', at(14)).length, 1);
});

test('missing duration falls back to an hour', () => {
  assert.equal(selectOutcomeNudges([{ ...base, durationMinutes: null }], '2026-10-20', at(13, 15)).length, 1);
});

test('torontoNow reads Ontario wall time across DST', () => {
  // 2026-10-20 16:30 UTC is 12:30 EDT.
  assert.deepEqual(torontoNow(new Date('2026-10-20T16:30:00Z')), { date: '2026-10-20', minutes: at(12, 30) });
  // 2026-12-01 04:30 UTC is still Nov 30 in Toronto (EST).
  assert.deepEqual(torontoNow(new Date('2026-12-01T04:30:00Z')), { date: '2026-11-30', minutes: at(23, 30) });
});

test('the push deep-links to the outcome sheet and goes to the rep, not the homeowner', () => {
  const p = outcomeNudgePayload({ id: 'abc', customerName: 'Marvin' });
  assert.equal(p.url, '/portal/appointments?outcome=abc');
  assert.match(p.body, /Marvin/);
});

test('lost reasons: counted most-common first, unanswered last', () => {
  const summary = summarizeLostReasons([
    { status: 'lost', lostReason: 'price' },
    { status: 'lost', lostReason: 'price' },
    { status: 'lost', lostReason: null },
    { status: 'lost', lostReason: null },
    { status: 'lost', lostReason: null },
    { status: 'lost', lostReason: 'timing' },
    { status: 'won', lostReason: 'price' },
  ]);
  assert.deepEqual(summary.map((s) => [s.key, s.count]), [['price', 2], ['timing', 1], [null, 3]]);
  assert.equal(lostReasonLabel(null), 'No reason given');
  assert.equal(isLostReason('bogus'), false);
});
