// Every assertion here is a message a real homeowner could receive, or a
// decision that moves a real appointment. The bias throughout is that
// escalating to Michael is cheap and a wrong text is not.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  afterBooking,
  decideNextAction,
  type Classification,
  type ConversationPhase,
} from './lead-conversation.js';
import {
  ALL_TEMPLATE_IDS,
  renderReply,
  slotLabel,
  SLOTS_REQUIRED,
  type OfferedSlot,
} from './lead-reply-templates.js';

const SLOTS: OfferedSlot[] = [
  { date: '2026-09-01', time: '10:00' },
  { date: '2026-09-02', time: '14:00' },
  { date: '2026-09-03', time: '18:00' },
];

const say = (over: Partial<Classification> = {}): Classification => ({
  intent: 'prefers_weekdays',
  confident: true,
  rawBody: 'weekdays',
  ...over,
});

// ─── The safety rails ─────────────────────────────────────────────────────────

test('an unsure classifier never sends anything', () => {
  // The single most important line in the file. A fluent wrong guess reaches a
  // real person; an escalation reaches Michael.
  for (const intent of ['prefers_weekdays', 'picked_slot', 'gave_address', 'not_interested'] as const) {
    const action = decideNextAction('opened', say({ intent, confident: false }));
    assert.equal(action.kind, 'escalate', `${intent} acted on without confidence`);
    if (action.kind === 'escalate') assert.equal(action.reason, 'NOT_CONFIDENT');
  }
});

test('a conversation a human owns is never re-entered automatically', () => {
  // Otherwise a closed lead gets texted again, and a booked homeowner gets two
  // different answers from us on the same thread.
  for (const phase of ['booked', 'closed', 'needs_human'] as ConversationPhase[]) {
    const action = decideNextAction(phase, say({ intent: 'prefers_weekdays' }));
    assert.equal(action.kind, 'escalate', `${phase} was acted on`);
    if (action.kind === 'escalate') assert.equal(action.reason, 'ALREADY_WITH_A_HUMAN');
  }
});

test('"unclear" is always a person, never a guess', () => {
  for (const phase of ['opened', 'awaiting_time_choice', 'awaiting_address'] as ConversationPhase[]) {
    const action = decideNextAction(phase, say({ intent: 'unclear', rawBody: 'my wife handles this' }));
    assert.equal(action.kind, 'escalate');
  }
});

// ─── The happy path, end to end ───────────────────────────────────────────────

test('weekdays → two real times → a pick → the address → booked', () => {
  const a = decideNextAction('opened', say({ intent: 'prefers_weekdays' }));
  assert.deepEqual(a, { kind: 'reply', template: 'picked_weekdays', nextPhase: 'awaiting_time_choice' });

  const b = decideNextAction('awaiting_time_choice', say({ intent: 'picked_slot', pickedSlotIndex: 0, rawBody: 'the first one' }));
  assert.deepEqual(b, { kind: 'reply', template: 'ask_address', nextPhase: 'awaiting_address' });

  const c = decideNextAction('awaiting_address', say({ intent: 'gave_address', addressText: '42 King St W', rawBody: '42 King St W' }));
  assert.deepEqual(c, { kind: 'book', addressText: '42 King St W' });

  const d = afterBooking({ result: 'BOOKED', date: '2026-09-01', time: '10:00', address: '42 King St W, Hamilton' });
  assert.deepEqual(d, { kind: 'reply', template: 'booked_confirmation', nextPhase: 'booked' });
});

test('weekends takes the same route with its own wording', () => {
  const a = decideNextAction('opened', say({ intent: 'prefers_weekends', rawBody: 'weekends' }));
  assert.deepEqual(a, { kind: 'reply', template: 'picked_weekends', nextPhase: 'awaiting_time_choice' });
});

// ─── Questions do not cost us the thread ──────────────────────────────────────

test('a question is answered and the times are re-offered', () => {
  // The point of these three: answering must not drop the homeowner out of the
  // booking flow, which is what a plain answer with no follow-up question does.
  const cases = [
    ['asked_price', 'answer_price'],
    ['asked_duration', 'answer_duration'],
    ['different_project', 'other_project'],
  ] as const;
  for (const [intent, template] of cases) {
    const action = decideNextAction('opened', say({ intent }));
    assert.deepEqual(action, { kind: 'reply', template, nextPhase: 'awaiting_time_choice' });
  }
});

test('every question template actually ends by asking about the times', () => {
  for (const id of ['answer_price', 'answer_duration', 'other_project'] as const) {
    const body = renderReply(id, { name: 'Sarah', slots: SLOTS });
    assert.match(body, /\?$/, `${id} does not end in a question`);
    assert.ok(body.includes(slotLabel(SLOTS[0])), `${id} does not offer a real time`);
  }
});

// ─── The deliberate silences ──────────────────────────────────────────────────

test('"not interested" gets no reply at all', () => {
  const action = decideNextAction('opened', say({ intent: 'not_interested', rawBody: 'not interested thanks' }));
  assert.deepEqual(action, { kind: 'close' });
});

test('closing is what stops the follow-ups chasing a no', () => {
  // Michael's decision: no reply saves the message. The phase is what matters —
  // a lead left in 'opened' would be nudged again in an hour.
  const closed = decideNextAction('closed', say({ intent: 'prefers_weekdays' }));
  assert.equal(closed.kind, 'escalate');
});

// ─── Things that are a person's job ───────────────────────────────────────────

test('"call me" asks for a time and then stops', () => {
  const action = decideNextAction('opened', say({ intent: 'wants_call', rawBody: 'just call me' }));
  assert.deepEqual(action, { kind: 'reply', template: 'wants_call', nextPhase: 'needs_human' });
});

test('"a few months out" is answered, then handed over', () => {
  // Nothing here may turn "a few months" into a date.
  const action = decideNextAction('opened', say({ intent: 'later_timeframe', rawBody: 'maybe the spring' }));
  assert.deepEqual(action, { kind: 'reply', template: 'further_out', nextPhase: 'needs_human' });
});

test('"who is this" re-asks without advancing the conversation', () => {
  const action = decideNextAction('opened', say({ intent: 'asked_who_is_this', rawBody: 'who is this?' }));
  assert.deepEqual(action, { kind: 'reply', template: 'who_is_this', nextPhase: 'opened' });
});

// ─── Answers that do not fit the question ─────────────────────────────────────

test('an answer to a question we did not ask goes to Michael', () => {
  // An address volunteered before we asked, or a slot picked before any was
  // offered. Understood, but not answerable from a template.
  const early = decideNextAction('opened', say({ intent: 'gave_address', addressText: '42 King St' }));
  assert.equal(early.kind, 'escalate');

  const noAddress = decideNextAction('awaiting_address', say({ intent: 'picked_slot', pickedSlotIndex: 1 }));
  assert.equal(noAddress.kind, 'escalate');
});

test('"neither of those work" is not answered with the same two times', () => {
  // Re-offering what they just turned down is the loop a person spots
  // immediately and an automation never does.
  const action = decideNextAction('awaiting_time_choice', say({ intent: 'prefers_weekdays', rawBody: 'neither really' }));
  assert.equal(action.kind, 'escalate');
  if (action.kind === 'escalate') assert.equal(action.reason, 'INTENT_DOES_NOT_FIT_PHASE');
});

test('"they picked one" without saying which is not a pick', () => {
  for (const index of [undefined, null, -1]) {
    const action = decideNextAction(
      'awaiting_time_choice',
      say({ intent: 'picked_slot', pickedSlotIndex: index as number | null | undefined })
    );
    assert.equal(action.kind, 'escalate', `index ${index} was treated as a real pick`);
  }
});

// ─── The booking race and the address that will not resolve ───────────────────

test('a slot taken mid-conversation is admitted, not papered over', () => {
  const action = afterBooking({ result: 'SLOT_TAKEN', alternatives: 2 });
  assert.deepEqual(action, { kind: 'reply', template: 'slot_taken', nextPhase: 'awaiting_time_choice' });
});

test('a slot taken with nothing left to offer goes to Michael', () => {
  // "Sorry, someone grabbed that one. I've still got  or ." — never send this.
  const action = afterBooking({ result: 'SLOT_TAKEN', alternatives: 1 });
  assert.equal(action.kind, 'escalate');
});

test('an address Google cannot place is asked about once more', () => {
  const action = afterBooking({ result: 'ADDRESS_UNRESOLVED' });
  assert.deepEqual(action, { kind: 'reply', template: 'address_unclear', nextPhase: 'awaiting_address' });
});

test('an address the model saw but could not extract is asked about, not guessed', () => {
  const action = decideNextAction('awaiting_address', say({ intent: 'gave_address', addressText: '  ', rawBody: 'its the blue one' }));
  assert.deepEqual(action, { kind: 'reply', template: 'address_unclear', nextPhase: 'awaiting_address' });
});

test('a booking that fails for any other reason is never improvised around', () => {
  const action = afterBooking({ result: 'CANNOT_BOOK' });
  assert.equal(action.kind, 'escalate');
});

// ─── The rendered copy ────────────────────────────────────────────────────────

test('a slot reads as an unambiguous date, not a bare weekday', () => {
  // The booking horizon is fourteen days, so "Tuesday" is two Tuesdays and a
  // homeowner who picks the wrong one was misled by us.
  assert.equal(slotLabel({ date: '2026-09-01', time: '10:00' }), 'Tue Sep 1, 10am');
  assert.equal(slotLabel({ date: '2026-09-02', time: '14:30' }), 'Wed Sep 2, 2:30pm');
  assert.equal(slotLabel({ date: '2026-09-03', time: '18:00' }), 'Thu Sep 3, 6pm');
});

test('the confirmation states the time and the address it is holding', () => {
  const body = renderReply('booked_confirmation', {
    name: 'Sarah Whitfield',
    slots: [],
    booked: { date: '2026-09-03', time: '18:00', address: '42 King St W, Hamilton' },
  });
  assert.match(body, /^Sarah, you're booked for Thu Sep 3, 6pm at 42 King St W, Hamilton\./);
  assert.ok(!body.includes('Whitfield'), 'first name only, like every other message');
});

test('a nameless lead still gets a sendable confirmation', () => {
  const body = renderReply('booked_confirmation', {
    name: '',
    slots: [],
    booked: { date: '2026-09-03', time: '18:00', address: '42 King St W' },
  });
  assert.match(body, /^You're booked for/);
  assert.ok(!body.includes('undefined'));
});

test('no template can render with fewer slots than it needs', () => {
  // A missing slot renders as "I've got  or " and goes to a real person. The
  // state machine checks first; this is the backstop.
  for (const id of ALL_TEMPLATE_IDS) {
    const need = SLOTS_REQUIRED[id];
    if (need === 0) continue;
    assert.throws(
      () => renderReply(id, { name: 'Sarah', slots: SLOTS.slice(0, need - 1) }),
      `${id} rendered with too few slots`
    );
  }
});

test('no template leaks a placeholder or an empty slot label', () => {
  for (const id of ALL_TEMPLATE_IDS) {
    const body = renderReply(id, {
      name: 'Sarah',
      slots: SLOTS,
      booked: { date: '2026-09-03', time: '18:00', address: '42 King St W' },
    });
    assert.ok(!body.includes('undefined'), `${id} leaks undefined`);
    assert.ok(!body.includes('NaN'), `${id} leaks NaN`);
    assert.ok(!/\s{2,}/.test(body), `${id} has a gap where something failed to render`);
    assert.ok(body.length <= 306, `${id} is ${body.length} characters`);
  }
});

test('no template carries a STOP footer', () => {
  // These are replies inside a conversation the homeowner started, not an
  // unsolicited send. Same decision as the opener.
  for (const id of ALL_TEMPLATE_IDS) {
    const body = renderReply(id, {
      name: 'Sarah',
      slots: SLOTS,
      booked: { date: '2026-09-03', time: '18:00', address: '42 King St W' },
    });
    assert.ok(!/reply stop/i.test(body), `${id} carries an opt-out footer`);
  }
});
