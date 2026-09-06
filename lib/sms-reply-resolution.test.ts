import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolvesRescheduleRequest } from './sms-reply-resolution.js';

const pending = {
  smsReplyStatus: 'reschedule_requested',
  status: 'scheduled',
  appointmentDate: '2026-09-07',
  appointmentTime: '12:00',
};

// ─── The reported case ───────────────────────────────────────────────────────
// A homeowner texted R for tomorrow's visit, the rep phoned him, he kept the
// slot, and the rep set Status → Confirmed. The chip stayed up.

test('a rep confirming by hand takes the chip down', () => {
  assert.equal(resolvesRescheduleRequest(pending, { status: 'confirmed' }), true);
});

test('any other outcome the rep records also settles it', () => {
  assert.equal(resolvesRescheduleRequest(pending, { status: 'cancelled' }), true);
  assert.equal(resolvesRescheduleRequest(pending, { status: 'rescheduled' }), true);
  assert.equal(resolvesRescheduleRequest(pending, { status: 'completed' }), true);
});

test('actually moving the appointment settles it too', () => {
  assert.equal(resolvesRescheduleRequest(pending, { appointmentDate: '2026-09-11' }), true);
  assert.equal(resolvesRescheduleRequest(pending, { appointmentTime: '15:00' }), true);
});

// ─── What must NOT clear it ──────────────────────────────────────────────────
// An open request is a rep's to-do. It has to survive every edit that is not an
// answer to it, or the first person to type a note loses the whole signal.

test('unrelated edits leave the request open', () => {
  assert.equal(resolvesRescheduleRequest(pending, { internalNotes: 'called, no answer' }), false);
  assert.equal(resolvesRescheduleRequest(pending, { assignedRepId: 'user_2' }), false);
  assert.equal(resolvesRescheduleRequest(pending, { dealId: 'deal_9' }), false);
  assert.equal(resolvesRescheduleRequest(pending, {}), false);
});

test('re-saving the same values is not a change', () => {
  assert.equal(
    resolvesRescheduleRequest(pending, {
      status: 'scheduled',
      appointmentDate: '2026-09-07',
      appointmentTime: '12:00',
      internalNotes: 'touched the notes only',
    }),
    false
  );
});

test('an appointment with no open request is untouched', () => {
  assert.equal(resolvesRescheduleRequest({ ...pending, smsReplyStatus: '' }, { status: 'confirmed' }), false);
  assert.equal(
    resolvesRescheduleRequest({ ...pending, smsReplyStatus: 'confirmed' }, { status: 'cancelled' }),
    false
  );
  assert.equal(resolvesRescheduleRequest(null, { status: 'confirmed' }), false);
});

test('a caller that states smsReplyStatus outright is not second-guessed', () => {
  assert.equal(
    resolvesRescheduleRequest(pending, { status: 'confirmed', smsReplyStatus: 'reschedule_requested' }),
    false
  );
});

// A row written before the reply columns existed reads as null, not ''.
test('legacy rows with null fields do not throw or misfire', () => {
  assert.equal(resolvesRescheduleRequest({ smsReplyStatus: null, status: null }, { status: 'confirmed' }), false);
  assert.equal(
    resolvesRescheduleRequest({ smsReplyStatus: 'reschedule_requested', status: null }, { status: 'confirmed' }),
    true
  );
});
