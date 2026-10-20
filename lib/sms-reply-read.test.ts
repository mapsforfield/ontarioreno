import test from 'node:test';
import assert from 'node:assert/strict';

import {
  isTapback,
  matchReplyToAppointment,
  readReplyPush,
  readReplySubject,
  READ_REPLY_STATUS,
  OPEN_REPLY_STATUSES,
} from './sms-replies.ts';
import { parseReadIntent, classifyAppointmentReply } from './sms-reply-classify.ts';
import { resolvesRescheduleRequest } from './sms-reply-resolution.ts';

const appt = (over: Record<string, unknown> = {}) => ({
  id: 'a1', appointmentDate: '2026-10-19', appointmentTime: '18:00', status: 'scheduled', deletedAt: null, ...over,
});

test('a reply sent just after the visit started still belongs to it', () => {
  // "Please cancel" at 6:10 for a 6:00 visit used to match nothing.
  assert.equal(matchReplyToAppointment([appt()], '2026-10-19T18:10')?.id, 'a1');
  assert.equal(matchReplyToAppointment([appt()], '2026-10-19T21:00')?.id, 'a1');
  assert.equal(matchReplyToAppointment([appt()], '2026-10-19T21:01'), null, 'three hours, no more');
});

test('an upcoming visit still wins over one that just started', () => {
  const m = matchReplyToAppointment(
    [appt({ id: 'earlier' }), appt({ id: 'tomorrow', appointmentDate: '2026-10-20' })],
    '2026-10-19T18:30'
  );
  assert.equal(m?.id, 'tomorrow');
});

test('a just-started visit that is completed or cancelled is never touched', () => {
  for (const status of ['completed', 'cancelled', 'no_show']) {
    assert.equal(matchReplyToAppointment([appt({ status })], '2026-10-19T18:10'), null, status);
  }
});

test('iMessage and Android reactions are recognised without a model', () => {
  assert.equal(isTapback('Liked “Hi Bino, our specialist is looking forward…”'), true);
  assert.equal(isTapback('Loved "See you then"'), true);
  assert.equal(isTapback('Emphasized “6 PM”'), true);
  assert.equal(isTapback('I liked the last guy'), false);
  assert.equal(isTapback('Please cancel'), false);
});

test('a reaction never reaches the model and reads as an acknowledgement', async () => {
  assert.equal(await classifyAppointmentReply('Liked “confirmed”', {}, {} as NodeJS.ProcessEnv), 'acknowledged');
});

test('no key, empty text or junk output all degrade to "unclear"', async () => {
  assert.equal(await classifyAppointmentReply('Cancel', {}, {} as NodeJS.ProcessEnv), 'unclear');
  assert.equal(await classifyAppointmentReply('   ', {}, { ANTHROPIC_API_KEY: 'x' } as NodeJS.ProcessEnv), 'unclear');
  assert.equal(parseReadIntent('{"intent":"cancel"}'), 'cancel');
  assert.equal(parseReadIntent('{"intent":"delete_everything"}'), 'unclear');
  assert.equal(parseReadIntent('not json'), 'unclear');
});

test('every label maps to a flag, and "Ok" asks nobody to do anything', () => {
  assert.equal(READ_REPLY_STATUS.cancel, 'cancel_requested');
  assert.equal(READ_REPLY_STATUS.reschedule, 'reschedule_requested');
  assert.equal(OPEN_REPLY_STATUSES.has(READ_REPLY_STATUS.acknowledged), false);
  // A model "confirm" is not the literal-C 'confirmed' — it never moves status.
  assert.notEqual(READ_REPLY_STATUS.confirm, 'confirmed');
});

test('the rep sees the meaning first and the homeowner is quoted exactly', () => {
  const subject = readReplySubject({ intent: 'cancel', customerName: 'Bino', date: '2026-10-19', time: '18:00' });
  assert.match(subject, /^Wants to CANCEL: Bino/);
  const push = readReplyPush({ intent: 'cancel', appointmentId: 'a1', customerName: 'Bino', date: '2026-10-19', time: '18:00', rawBody: 'Please cancel. I unable to going home today' });
  assert.equal(push.title, 'Bino wants to cancel');
  assert.match(push.body, /Please cancel\. I unable to going home today/);
  assert.equal(push.url, '/portal/appointments?reply=a1');
});

test('changing the status or moving the visit clears any open reply flag', () => {
  for (const flag of OPEN_REPLY_STATUSES) {
    const before = { smsReplyStatus: flag, status: 'scheduled', appointmentDate: '2026-10-19', appointmentTime: '18:00' };
    assert.equal(resolvesRescheduleRequest(before, { status: 'cancelled' }), true, flag);
    assert.equal(resolvesRescheduleRequest(before, { appointmentDate: '2026-10-21' }), true, flag);
    assert.equal(resolvesRescheduleRequest(before, { internalNotes: 'called' }), false, flag);
  }
  assert.equal(resolvesRescheduleRequest({ smsReplyStatus: 'acknowledged', status: 'scheduled' }, { status: 'confirmed' }), false);
});
