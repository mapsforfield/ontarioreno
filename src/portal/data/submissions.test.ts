import test from 'node:test';
import assert from 'node:assert/strict';
import { countUnworkedSubmissions, isUnworkedSubmission } from './submissions.ts';
import type { Lead } from './types.ts';

const lead = (over: Partial<Lead> = {}): Lead =>
  ({
    id: 'lead-1',
    name: 'Jane',
    source: 'consultation_flow',
    submissionContactedAt: null,
    appointmentId: null,
    deletedAt: null,
    interactions: [],
    ...over,
  }) as Lead;

test('a submission nobody has touched needs contact', () => {
  assert.equal(isUnworkedSubmission(lead()), true);
});

test('an explicit contact mark clears it', () => {
  assert.equal(isUnworkedSubmission(lead({ submissionContactedAt: '2026-07-31T12:00:00Z' })), false);
});

test('a booked submission was handled at the time', () => {
  // An appointment exists and the team alert fired when it was made, so it is
  // not outstanding work — counting it would overstate the backlog by every
  // historical booking.
  assert.equal(isUnworkedSubmission(lead({ appointmentId: 'appt-1' })), false);
});

test('a trashed submission is not work waiting to be done', () => {
  assert.equal(isUnworkedSubmission(lead({ deletedAt: '2026-07-30T00:00:00Z' })), false);
});

test('leads from other sources never count', () => {
  for (const source of ['manual', 'meta', 'import', 'website_intake']) {
    assert.equal(isUnworkedSubmission(lead({ source })), false, `${source} counted`);
  }
});

test('the real backlog: 19 submissions, 9 needing contact', () => {
  // The actual shape of the database when the log was built — 13 direct
  // calendar of which 10 booked, 5 manual review, 1 nurture. The 9 that need
  // contact are exactly the ones the old alert could never announce: every
  // non-booking outcome, plus the three that were shown a calendar and left.
  const leads: Lead[] = [
    ...Array.from({ length: 10 }, (_, i) =>
      lead({ id: `booked-${i}`, routingOutcome: 'DIRECT_CALENDAR', appointmentId: `appt-${i}` })
    ),
    ...Array.from({ length: 3 }, (_, i) =>
      lead({ id: `abandoned-${i}`, routingOutcome: 'DIRECT_CALENDAR' })
    ),
    ...Array.from({ length: 5 }, (_, i) =>
      lead({ id: `review-${i}`, routingOutcome: 'MANUAL_REVIEW' })
    ),
    lead({ id: 'nurture-0', routingOutcome: 'NURTURE' }),
  ];

  assert.equal(leads.length, 19, 'total submissions');
  assert.equal(countUnworkedSubmissions(leads), 9, 'needing first contact');

  // And the log itself still shows all 19 — the predicate narrows a count,
  // never row visibility.
  assert.equal(leads.filter((l) => l.source === 'consultation_flow').length, 19);
});

test('working through the backlog decrements the count', () => {
  const leads = [lead({ id: 'a' }), lead({ id: 'b' })];
  assert.equal(countUnworkedSubmissions(leads), 2);
  leads[0].submissionContactedAt = '2026-07-31T12:00:00Z';
  assert.equal(countUnworkedSubmissions(leads), 1);
  // Un-marking is reversible, so the count comes back.
  leads[0].submissionContactedAt = null;
  assert.equal(countUnworkedSubmissions(leads), 2);
});
