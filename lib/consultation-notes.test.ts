import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeNotes, seedBookingNotes, torontoDateStamp } from './consultation-notes.js';

// ── mergeNotes ──────────────────────────────────────────────────────────────

test('mergeNotes returns the incoming note when nothing is on file', () => {
  assert.equal(mergeNotes('', 'Booked through the public Hamilton grant flow.'),
    'Booked through the public Hamilton grant flow.');
  assert.equal(mergeNotes(null, 'New note'), 'New note');
});

test('mergeNotes keeps what is on file when the incoming note is empty', () => {
  assert.equal(mergeNotes('Called her as David. Wants a basement.', ''),
    'Called her as David. Wants a basement.');
});

test('mergeNotes never drops prior notes when the field is cleared', () => {
  assert.equal(mergeNotes('Important history', '   '), 'Important history');
});

test('mergeNotes does not duplicate history the rep was already shown', () => {
  const onFile = 'Project: basement\n\nPREVIOUS: spoke in June.';
  const edited = `${onFile}\nAdded today: wants financing.`;
  assert.equal(mergeNotes(onFile, edited), edited);
});

test('mergeNotes is stable across a re-save with only whitespace differences', () => {
  const merged = mergeNotes('Line one\nLine two', '  Line one\n  Line two  ');
  assert.equal(merged.includes('PREVIOUS NOTES'), false);
});

test('mergeNotes stacks genuinely new notes above the earlier ones, with a date', () => {
  const merged = mergeNotes('Spoke in June about the kitchen.', 'New basement consult booked.', {
    stamp: '2026-08-24',
  });
  assert.ok(merged.startsWith('New basement consult booked.'));
  assert.ok(merged.includes('2026-08-24'));
  // The whole point: the old note is still there.
  assert.ok(merged.includes('Spoke in June about the kitchen.'));
});

// ── seedBookingNotes ────────────────────────────────────────────────────────

const brief =
  'Booked through the public Hamilton grant flow.\nProject: Finish an unfinished basement';

test('seedBookingNotes is just the brief for a first-time customer', () => {
  assert.equal(seedBookingNotes(brief, ''), brief);
});

test('seedBookingNotes leads with the new booking and carries history below it', () => {
  const seeded = seedBookingNotes(brief, 'Kitchen quote in June. Do not call before 5pm.', {
    stamp: '2026-08-24',
  });
  assert.ok(seeded.startsWith(brief));
  assert.ok(seeded.includes('EARLIER CONSULTATIONS'));
  assert.ok(seeded.includes('Do not call before 5pm.'));
});

test('regression: a repeat booking does not erase what the rep knew last time', () => {
  const whatTheRepKnew = 'Didn’t do appointment as Steven. Called her as David.';
  assert.ok(seedBookingNotes(brief, whatTheRepKnew).includes(whatTheRepKnew));
});

test('torontoDateStamp formats as YYYY-MM-DD in Toronto time', () => {
  assert.equal(torontoDateStamp(new Date('2026-08-24T03:30:00Z')), '2026-08-23');
});
