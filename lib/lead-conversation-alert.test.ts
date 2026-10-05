import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  conversationAlertBody,
  conversationAlertSubject,
  planConversationAlert,
  type ConversationAlertContext,
} from './lead-conversation-alert.js';

const base: ConversationAlertContext = {
  leadId: 'lead_1',
  conversationId: 'convo_1',
  messageSid: 'SM123',
  leadName: 'Dal',
  leadPhone: '+15195912683',
  body: 'Sunday 12 pm',
  intent: 'picked_slot',
  confident: true,
  outcome: 'draft',
  draftBody: 'Great — what is the property address?',
};

// ─── The subject line ─────────────────────────────────────────────────────────
// This is read on a lock screen, so it has to be triageable without opening
// anything. The homeowner's own words are what make it so.

test('the subject carries who texted and what they said', () => {
  const subject = conversationAlertSubject(base);
  assert.match(subject, /Dal/);
  assert.match(subject, /Sunday 12 pm/);
});

test('a long message is truncated, not summarised', () => {
  const subject = conversationAlertSubject({
    ...base,
    body: 'Weekends work best for us, ideally Sunday afternoon if you have anything then',
  });
  assert.ok(subject.length < 100, subject);
  assert.match(subject, /Weekends work best/);
  assert.match(subject, /…/);
});

test('a lead with no name is still worth being told about', () => {
  assert.match(conversationAlertSubject({ ...base, leadName: '  ' }), /\+15195912683/);
});

test('a not-interested reply says so in the subject', () => {
  const subject = conversationAlertSubject({
    ...base,
    outcome: 'closed',
    body: 'no thanks',
    intent: 'not_interested',
  });
  assert.match(subject, /not interested/i);
});

// ─── The body ─────────────────────────────────────────────────────────────────

test('the homeowner is quoted verbatim, never paraphrased', () => {
  const body = conversationAlertBody({ ...base, body: '168 wedtbridge avenue' });
  assert.match(body, /168 wedtbridge avenue/);
});

test('a draft is shown, and said to be unsent', () => {
  const body = conversationAlertBody(base);
  assert.match(body, /Great — what is the property address\?/);
  assert.match(body, /Nothing has been sent/);
});

test('an unconfident reading is flagged as one', () => {
  const body = conversationAlertBody({ ...base, confident: false });
  assert.match(body, /not confident/);
});

test('a confident reading does not cry wolf', () => {
  assert.doesNotMatch(conversationAlertBody(base), /not confident/);
});

test('an escalation says why, in words a rep reads', () => {
  const body = conversationAlertBody({
    ...base,
    outcome: 'escalated',
    reason: 'ALREADY_WITH_A_HUMAN',
    draftBody: '',
  });
  assert.match(body, /already handling this thread/);
  assert.doesNotMatch(body, /ALREADY_WITH_A_HUMAN/);
});

test('every alert links to the thread', () => {
  assert.match(conversationAlertBody(base), /ontarioreno\.ca\/portal\/conversations/);
});

// ─── Queueing ─────────────────────────────────────────────────────────────────

test('one row per recipient, never a CC', () => {
  const rows = planConversationAlert(base, ['fast@gmail.com', 'info@ontarioreno.ca']);
  assert.equal(rows.length, 2);
  assert.deepEqual(
    rows.map((r) => r.recipient),
    ['fast@gmail.com', 'info@ontarioreno.ca']
  );
});

test('a repeated recipient is only mailed once', () => {
  const rows = planConversationAlert(base, ['a@b.com', ' a@b.com ', '']);
  assert.equal(rows.length, 1);
});

// A Twilio webhook retry re-runs the whole path with the same SID. Two emails
// about one text teaches the reader to ignore the alert.
test('the key is the message, so a retry collapses', () => {
  const first = planConversationAlert(base, ['a@b.com'])[0];
  const again = planConversationAlert(base, ['a@b.com'])[0];
  assert.equal(first?.idempotencyKey, again?.idempotencyKey);
  assert.match(String(first?.idempotencyKey), /SM123/);
});

test('a different reply on the same thread is a different alert', () => {
  const first = planConversationAlert(base, ['a@b.com'])[0];
  const second = planConversationAlert({ ...base, messageSid: 'SM999' }, ['a@b.com'])[0];
  assert.notEqual(first?.idempotencyKey, second?.idempotencyKey);
});

// Nothing in this message stops being true because it was slow. A reply nobody
// saw is still a reply worth answering.
test('the alert never expires', () => {
  assert.equal(planConversationAlert(base, ['a@b.com'])[0]?.expiresAt, '');
});
