import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import {
  classifyReply,
  matchReplyToAppointment,
  phoneKey,
  replyAlertBody,
  replyAlertSubject,
  replyUnclearBody,
  replyUnclearSubject,
  rescheduleAckSms,
  shouldRelayDownstream,
  verifyTwilioSignature,
} from './sms-replies.js';

// ─── Classification ───────────────────────────────────────────────────────────
// Reach is deliberately narrow. Every case below that must NOT classify is a
// real shape of message a homeowner sends, and each one would misfire something
// with a cost: a wrong 'reschedule' emails a rep to unpick a live booking and
// texts the homeowner; a wrong 'confirm' tells a rep a no-show is locked in.

test('the two answers the reminder actually asks for', () => {
  assert.equal(classifyReply('C'), 'confirm');
  assert.equal(classifyReply('R'), 'reschedule');
  assert.equal(classifyReply('c'), 'confirm');
  assert.equal(classifyReply('r'), 'reschedule');
});

test('the decoration people put around a one-letter answer', () => {
  assert.equal(classifyReply('C.'), 'confirm');
  assert.equal(classifyReply(' c '), 'confirm');
  assert.equal(classifyReply('*R*'), 'reschedule');
  assert.equal(classifyReply('C 👍'), 'confirm');
  assert.equal(classifyReply('"R"'), 'reschedule');
});

test('the literal words, and only those', () => {
  assert.equal(classifyReply('Confirmed'), 'confirm');
  assert.equal(classifyReply('Reschedule'), 'reschedule');
  assert.equal(classifyReply('rescheduled'), 'reschedule');
});

test('polite acknowledgement is NOT an answer', () => {
  // These all counted as confirmations once. A homeowner texting "Ok" after a
  // booking confirmation is acknowledging the message, not answering a
  // question they were never asked — the booking text says "reply to this
  // text", it does not offer C or R. Recording that as a confirmation told the
  // rep something the homeowner never said.
  for (const polite of ['Ok', 'okay', 'K', 'yes', 'yep', 'sure', 'thanks', 'sounds good', 'see you then']) {
    assert.equal(classifyReply(polite), 'unknown', `${polite} must not classify`);
  }
});

test('the thank-you notes people actually send', () => {
  for (const phrase of [
    'okay thanks', 'ok thanks', 'Okay thank you', 'Got it thanks',
    'Perfect thank you', 'no problem', 'Sure thing', 'Great thanks',
  ]) {
    assert.equal(classifyReply(phrase), 'unknown', `${phrase} must not classify`);
  }
});

test('a sentence that merely CONTAINS c or r is not an answer', () => {
  // The whole point of whole-message matching. Each of these read as an answer
  // under substring matching, and none of them is one.
  assert.equal(classifyReply('Can you come earlier?'), 'unknown');
  assert.equal(classifyReply('Rain is forecast, is that ok?'), 'unknown');
  assert.equal(classifyReply('My son will be there instead'), 'unknown');
  assert.equal(classifyReply('confirming that I cannot make it'), 'unknown');
  assert.equal(classifyReply('R but only if Friday works'), 'unknown');
  assert.equal(classifyReply('I need to reschedule please'), 'unknown');
  assert.equal(classifyReply('STOP'), 'unknown');
  assert.equal(classifyReply(''), 'unknown');
});

test('the messages that most need a human, and get one', () => {
  // Unknown does not mean ignored: these are forwarded to the rep verbatim.
  // Each is worth a rep's attention the night before a visit, and each would
  // be actively dangerous to interpret by machine.
  for (const urgent of ['Cancel', 'Running late', 'Can we do Friday instead', 'wrong number']) {
    assert.equal(classifyReply(urgent), 'unknown', `${urgent} must not be interpreted`);
  }
});

// ─── Matching ─────────────────────────────────────────────────────────────────

const appt = (over: Partial<Parameters<typeof matchReplyToAppointment>[0][0]>) => ({
  id: 'a1', appointmentDate: '2026-08-20', appointmentTime: '18:00',
  status: 'scheduled', deletedAt: null, ...over,
});

test('a reply is about the soonest live upcoming appointment', () => {
  const m = matchReplyToAppointment(
    [
      appt({ id: 'later', appointmentDate: '2026-09-14' }),
      appt({ id: 'tomorrow', appointmentDate: '2026-08-20' }),
    ],
    '2026-08-19T18:09'
  );
  assert.equal(m?.id, 'tomorrow');
});

test('a past, cancelled or trashed appointment is never touched', () => {
  const now = '2026-08-19T18:09';
  assert.equal(matchReplyToAppointment([appt({ appointmentDate: '2026-08-01' })], now), null);
  assert.equal(matchReplyToAppointment([appt({ status: 'cancelled' })], now), null);
  assert.equal(matchReplyToAppointment([appt({ status: 'completed' })], now), null);
  assert.equal(matchReplyToAppointment([appt({ deletedAt: new Date() })], now), null);
});

test('an appointment later today still counts', () => {
  const m = matchReplyToAppointment(
    [appt({ appointmentDate: '2026-08-19', appointmentTime: '19:30' })],
    '2026-08-19T18:09'
  );
  assert.equal(m?.id, 'a1');
});

test('phone formats the portal and Twilio disagree about', () => {
  // Twilio's E.164 against whatever a rep typed. These must all be one person.
  const expected = '4379997504';
  for (const raw of ['+14379997504', '(437) 999-7504', '437-999-7504', '1 437 999 7504']) {
    assert.equal(phoneKey(raw), expected);
  }
});

// ─── Copy ─────────────────────────────────────────────────────────────────────

const ctx = {
  intent: 'reschedule' as const,
  repName: 'Sabah',
  customerName: 'Jay',
  customerPhone: '+14379997504',
  date: '2026-08-20',
  time: '18:00',
  address: '15 Eastway Street, Brampton',
  rawBody: 'R',
};

test('a reschedule alert tells the rep the slot is still held', () => {
  const body = replyAlertBody(ctx);
  assert.match(body, /NOT been moved or cancelled/);
  assert.match(body, /still held/);
  assert.match(body, /15 Eastway Street, Brampton/);
  // The rep sees what was actually sent, not our label for it.
  assert.match(body, /They texted: "R"/);
  assert.match(replyAlertSubject(ctx), /^Reschedule requested by text: Jay/);
});

test('a confirmation alert asks the rep to do nothing', () => {
  const c = { ...ctx, intent: 'confirm' as const, rawBody: 'C' };
  assert.match(replyAlertSubject(c), /^Confirmed by text: Jay/);
  assert.match(replyAlertBody(c), /Nothing to do/);
});

test('the homeowner acknowledgement promises a call and no new time', () => {
  const sms = rescheduleAckSms({ customerName: 'Jay', repName: 'Sabah' });
  assert.match(sms, /Sabah/);
  assert.match(sms, /still held/);
  // Never invent a slot by machine — a rep agrees the new time on the phone.
  assert.doesNotMatch(sms, /\d{1,2}:\d{2}/);
  assert.doesNotMatch(sms, /cancelled/i);
});

// ─── Twilio signature ─────────────────────────────────────────────────────────

test('only a correctly signed webhook is accepted', () => {
  const url = 'https://ontarioreno.ca/api/sms/inbound';
  const params = { From: '+14379997504', Body: 'R', MessageSid: 'SM1' };
  const payload =
    url + Object.keys(params).sort().map((k) => k + params[k as keyof typeof params]).join('');
  const good = createHmac('sha1', 'tok').update(Buffer.from(payload, 'utf-8')).digest('base64');

  assert.equal(verifyTwilioSignature(url, params, 'tok', good), true);
  // Wrong token, tampered body, missing signature — all refused. This endpoint
  // writes to live appointments and can text a real homeowner.
  assert.equal(verifyTwilioSignature(url, params, 'other', good), false);
  assert.equal(verifyTwilioSignature(url, { ...params, Body: 'C' }, 'tok', good), false);
  assert.equal(verifyTwilioSignature(url, params, 'tok', ''), false);
  assert.equal(verifyTwilioSignature(url, params, '', good), false);
});

// ─── Chaining the Apps Script that already owned this webhook ─────────────────
// A Twilio number has one "a message comes in" slot, and the Apps Script that
// texts every new lead already had it. We forward to it and relay its answer,
// so first contact keeps working — these decide when that answer is relayed.

test('TwiML from the downstream handler is relayed to Twilio', () => {
  // This is the script telling Twilio to text a new lead. Swallowing it would
  // break first contact exactly as thoroughly as overwriting the webhook URL.
  assert.equal(
    shouldRelayDownstream(200, '<?xml version="1.0" encoding="UTF-8"?><Response><Message>Hi!</Message></Response>'),
    true
  );
  assert.equal(shouldRelayDownstream(200, '<Response><Message>Hi</Message></Response>'), true);
  assert.equal(shouldRelayDownstream(200, '  <Response></Response>  '), true);
});

test('anything that is not TwiML is never relayed', () => {
  // Twilio rejects a non-TwiML body, so relaying the script's bad day would
  // fail the whole webhook and lose our reply handling with it.
  assert.equal(shouldRelayDownstream(200, '<html><body>Script error</body></html>'), false);
  assert.equal(shouldRelayDownstream(200, ''), false);
  assert.equal(shouldRelayDownstream(200, '   '), false);
  assert.equal(shouldRelayDownstream(200, 'OK'), false);
  assert.equal(shouldRelayDownstream(500, '<Response></Response>'), false);
  assert.equal(shouldRelayDownstream(302, '<Response></Response>'), false);
});

// ─── Forwarding a reply we could not read ─────────────────────────────────────

test('an unreadable reply is forwarded without a claim about its meaning', () => {
  const unclear = {
    repName: 'Steven',
    customerName: 'Jay',
    customerPhone: '+14379997504',
    date: '2026-08-20',
    time: '18:00',
    address: '15 Eastway Street, Brampton',
    rawBody: 'Can we do Friday instead',
  };
  const body = replyUnclearBody(unclear);
  // The homeowner's own words, and an explicit statement that we did nothing.
  assert.match(body, /They wrote: "Can we do Friday instead"/);
  assert.match(body, /Nothing has been changed/);
  // Never asserts what they meant.
  assert.doesNotMatch(body, /confirmed/i);
  assert.doesNotMatch(body, /reschedule requested/i);
  assert.match(replyUnclearSubject(unclear), /needs your eyes/);
});
