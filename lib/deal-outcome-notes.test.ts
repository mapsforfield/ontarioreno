import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withOutcomeNotes } from './deal-outcome-notes.js';

const booking = 'Booked through the public Basement Renovation Consultation flow.\nMunicipality: Oshawa';
const outcome = 'Gave him 50k plus hst. Settled 44k plus hst, half finance.\nWill follow up next week';

test('Hossein: outcome lands on top of the auto-created deal, booking notes kept', () => {
  const out = withOutcomeNotes(booking, outcome, { visitDate: '2026-11-18' });
  assert.ok(out.includes('OUTCOME REPORT · 2026-11-18'));
  assert.ok(out.indexOf(outcome) < out.indexOf(booking));
  assert.ok(out.includes(booking));
});

test('re-saving the same outcome does not stack a copy', () => {
  const once = withOutcomeNotes(booking, outcome, { visitDate: '2026-11-18' });
  assert.equal(withOutcomeNotes(once, outcome, { visitDate: '2026-11-18', previousOutcomeNotes: outcome }), once);
});

test('editing the outcome replaces the old wording in place', () => {
  const once = withOutcomeNotes(booking, outcome, { visitDate: '2026-11-18' });
  const edited = outcome + '\nCalled back: wants 42k.';
  const twice = withOutcomeNotes(once, edited, { visitDate: '2026-11-18', previousOutcomeNotes: outcome });
  assert.equal(twice.split('OUTCOME REPORT').length, 2);
  assert.ok(twice.includes('Called back: wants 42k.'));
  assert.ok(twice.includes(booking));
});

test('an empty outcome never clears the deal notes', () => {
  assert.equal(withOutcomeNotes(booking, '   ', { visitDate: '2026-11-18' }), booking);
});

test('an empty deal gets just the outcome block', () => {
  const out = withOutcomeNotes('', outcome, { visitDate: '2026-11-18' });
  assert.ok(out.startsWith('─'));
  assert.ok(out.endsWith(outcome));
});
