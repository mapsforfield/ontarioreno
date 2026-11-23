// Call mode, end to end without a database: the two times the opener offers,
// the words it uses, and what each kind of reply does.
//
// The contract: a clear reply is answered or booked with no one in the loop; an
// unclear one is NEVER answered by the machine and always reaches the caller's
// phone; nothing a homeowner receives promises a visit or asks for an address.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveProposedSlot,
  callSlotLabel,
  callSlotPair,
  openCallSlots,
  openerSendWall,
  pickCallSlots,
} from './call-slots.js';
import { planLeadCallOpener, smsLeadCallOpener } from './notifications.js';
import { runInboundReply, type ConversationState, type RunnerDeps } from './lead-conversation-runner.js';
import { decideNextAction, type Classification } from './lead-conversation.js';
import { ALL_TEMPLATE_IDS, renderReply, type OfferedSlot } from './lead-reply-templates.js';
import { checkReplyFits, parseFitVerdict } from './reply-fit-check.js';
import { bookingUrlFor } from './lead-inbound.js';

// Tuesday 17 November 2026.
const TUE = '2026-11-17';
const at = (time: string, date = TUE) => `${date}T${time}`;

// ─── The picker ───────────────────────────────────────────────────────────────

test('afternoon lead: soonest time today, then an evening', () => {
  const pair = pickCallSlots(at('15:10'));
  assert.deepEqual(pair, [
    { date: TUE, time: '16:30' },
    { date: TUE, time: '18:00' },
  ]);
  assert.equal(callSlotPair(pair[0], pair[1], at('15:10')), 'today at 4:30pm or tonight at 6pm');
});

test('evening lead: tonight if there is room, then tomorrow morning', () => {
  const pair = pickCallSlots(at('17:20'));
  assert.equal(callSlotPair(pair[0], pair[1], at('17:20')), 'tonight at 6:30pm or tomorrow at 10am');
});

test('late lead: tomorrow morning or evening, day said once', () => {
  const pair = pickCallSlots(at('19:10'));
  assert.equal(callSlotPair(pair[0], pair[1], at('19:10')), 'tomorrow at 10am or 6pm');
});

test('never sooner than an hour, never outside 10am to 8pm', () => {
  for (let h = 0; h < 24; h++) {
    for (const m of ['00', '29', '31', '59']) {
      const now = at(`${String(h).padStart(2, '0')}:${m}`);
      const [a, b] = pickCallSlots(now);
      for (const s of [a, b]) {
        const mins = Number(s.time.slice(0, 2)) * 60 + Number(s.time.slice(3));
        assert.ok(mins >= 600 && mins <= 1170, `${now} offered ${s.time}`);
        if (s.date === TUE) {
          const nowMins = h * 60 + Number(m);
          assert.ok(mins >= nowMins + 60, `${now} offered ${s.time}, under an hour away`);
        }
      }
    }
  }
});

test('the two options are never within 90 minutes of each other', () => {
  for (let h = 0; h < 24; h++) {
    const now = at(`${String(h).padStart(2, '0')}:15`);
    const [a, b] = pickCallSlots(now);
    const t = (s: OfferedSlot) => new Date(`${s.date}T${s.time}:00Z`).getTime();
    assert.ok(t(b) - t(a) >= 90 * 60_000, `${now}: ${a.time} and ${b.time}`);
  }
});

test('a full half hour is skipped', () => {
  const taken = [at('16:30'), at('16:30')];
  const [a] = pickCallSlots(at('15:10'), taken);
  assert.equal(a.time, '17:00');
  // One booking is not full: two calls share a half hour.
  assert.equal(pickCallSlots(at('15:10'), [at('16:30')])[0].time, '16:30');
});

test('closed days are skipped', () => {
  const weekdaysOnly = { startMinute: 600, endMinute: 1200, days: [1, 2, 3, 4, 5] };
  // Friday 20 Nov, 7:30pm → Monday.
  const open = openCallSlots('2026-11-20T19:30', [], weekdaysOnly);
  assert.equal(open[0].date, '2026-11-23');
});

test('overnight leads are texted at 8:30am, with times relative to then', () => {
  assert.equal(openerSendWall(at('23:10')), '2026-11-18T08:30');
  assert.equal(openerSendWall(at('02:00')), at('08:30'));
  assert.equal(openerSendWall(at('14:05')), at('14:05'));
  const send = openerSendWall(at('23:10'));
  const [a, b] = pickCallSlots(send);
  assert.equal(callSlotPair(a, b, send), 'today at 10am or tonight at 6pm');
});

test('labels further out use the weekday', () => {
  assert.equal(callSlotLabel({ date: '2026-11-19', time: '18:00' }, at('09:00')), 'Thursday at 6pm');
});

// ─── The opener ───────────────────────────────────────────────────────────────

const OPENER = {
  leadId: 'lead-1',
  name: 'Sarah Whitfield',
  phone: '4165550100',
  senderName: 'Mark',
  sendWall: at('15:10'),
};
/** Two fixed times, as threads opened before Nov 22 2026 still hold. */
const OLD_SLOTS: OfferedSlot[] = [{ date: TUE, time: '16:30' }, { date: TUE, time: '18:00' }];

test("opener is Sabah's exact wording, for every ad, with no link", () => {
  assert.equal(
    smsLeadCallOpener(OPENER),
    "Hi Sarah, it's Mark from OntarioReno. Thanks for asking about finishing your basement from $399/mo. What time works today or tomorrow for a quick 5-min call?"
  );
  assert.ok(!/https?:|\.ca\//.test(smsLeadCallOpener(OPENER)));
});

test('opener fits two SMS segments and has no em dash', () => {
  const body = smsLeadCallOpener({ ...OPENER, name: 'Alexandrina-Marguerite' });
  assert.ok(body.length <= 306, `${body.length} chars`);
  assert.ok(!body.includes('—'));
});

test('opener without a name still reads', () => {
  assert.match(smsLeadCallOpener({ ...OPENER, name: '' }), /^Hi, it's Mark/);
});

test('opener keeps the one-first-text key and expires at the end of its day', () => {
  const [row] = planLeadCallOpener(OPENER);
  assert.equal(row.idempotencyKey, 'lead-1:sms:lead_welcome');
  // 11:59pm Toronto (EST, UTC-5): "today or tomorrow" must not arrive the next day.
  assert.equal(row.expiresAt, '2026-11-18T04:59:00.000Z');
  assert.equal(planLeadCallOpener({ ...OPENER, phone: '' }).length, 0);
});

// ─── Templates ────────────────────────────────────────────────────────────────

test('no call template promises a visit, asks for an address, or uses an em dash', () => {
  const ctx = { name: 'Sarah', slots: OLD_SLOTS, now: at('15:10'), sender: 'Mark', about: 'your basement' };
  for (const id of ALL_TEMPLATE_IDS.filter((t) => t.startsWith('call_'))) {
    const body = renderReply(id, ctx);
    assert.ok(!/visit|address|come (by|take)/i.test(body), `${id}: ${body}`);
    assert.ok(!body.includes('—'), `${id} has an em dash`);
    // One segment where possible; the bathroom "who is this" runs to two.
    assert.ok(body.length <= 200, `${id} is ${body.length} chars`);
  }
});

// ─── The state machine ────────────────────────────────────────────────────────

const c = (over: Partial<Classification>): Classification => ({
  intent: 'unclear', confident: true, rawBody: '', ...over,
});

test('call mode: a pick books, it never asks for an address', () => {
  const a = decideNextAction('awaiting_time_choice', c({ intent: 'picked_slot', pickedSlotIndex: 1 }), 'call');
  assert.deepEqual(a, { kind: 'book_call' });
  // Visit mode is unchanged.
  const v = decideNextAction('awaiting_time_choice', c({ intent: 'picked_slot', pickedSlotIndex: 1 }));
  assert.equal(v.kind === 'reply' && v.template, 'ask_address');
});

test('call mode: questions get call answers', () => {
  const a = decideNextAction('awaiting_time_choice', c({ intent: 'asked_duration' }), 'call');
  assert.equal(a.kind === 'reply' && a.template, 'call_answer_duration');
  const w = decideNextAction('awaiting_time_choice', c({ intent: 'asked_who_is_this' }), 'call');
  assert.equal(w.kind === 'reply' && w.template, 'call_who_is_this');
});

// ─── The runner, autopilot ────────────────────────────────────────────────────

type Recorded = Parameters<RunnerDeps['recordMessage']>[0];
type Patched = Parameters<RunnerDeps['updateConversation']>[1];

function harness(classification: Partial<Classification>, book: 'BOOKED' | 'SLOT_TAKEN' | 'CANNOT_BOOK' = 'BOOKED') {
  const messages: Recorded[] = [];
  const patches: Patched[] = [];
  const sent: string[] = [];
  const alerts: string[] = [];
  const booked: OfferedSlot[] = [];
  const deps: RunnerDeps = {
    listOpenSlots: async () => [{ date: TUE, time: '17:00' }, { date: '2026-11-18', time: '10:00' }],
    recordMessage: async (m) => void messages.push(m),
    updateConversation: async (_id, patch) => void patches.push(patch),
    classify: async () => ({ intent: 'unclear', confident: true, rawBody: '', ...classification }),
    send: async (body) => void sent.push(body),
    bookCall: async (_lead, slot) => {
      booked.push(slot);
      return book;
    },
    alertHuman: async (reason) => void alerts.push(reason),
    nowWall: () => at('15:20'),
  };
  return { deps, messages, patches, sent, alerts, booked };
}

const callState = (over: Partial<ConversationState> = {}): ConversationState => ({
  id: 'conv-1',
  leadId: 'lead-1',
  phase: 'awaiting_time_choice',
  offeredSlots: OLD_SLOTS,
  lastOutbound: smsLeadCallOpener(OPENER),
  mode: 'call',
  ...over,
});
const reply = (body: string) => ({ messageSid: 'SM1', body, leadName: 'Sarah Whitfield', sender: 'Mark', about: 'your basement' });
const ENV = {} as NodeJS.ProcessEnv;

test('"6 works" books 6pm, confirms by text, and pings the caller', async () => {
  const h = harness({ intent: 'picked_slot', pickedSlotIndex: 1 });
  const out = await runInboundReply(callState(), reply('6 works'), h.deps, ENV);
  assert.equal(out.kind, 'sent');
  assert.deepEqual(h.booked, [{ date: TUE, time: '18:00' }]);
  assert.deepEqual(h.sent, ["Perfect, Sarah. I'll call you tonight at 6pm from this number. Talk then."]);
  assert.equal(h.patches.at(-1)?.phase, 'booked');
  assert.deepEqual(h.alerts, ['CALL_BOOKED']);
  assert.equal(h.messages.find((m) => m.direction === 'out')?.state, 'sent');
});

test('a time that filled up re-offers two fresh ones', async () => {
  const h = harness({ intent: 'picked_slot', pickedSlotIndex: 0 }, 'SLOT_TAKEN');
  await runInboundReply(callState(), reply('4:30'), h.deps, ENV);
  assert.equal(h.sent[0], 'Sorry, that time just filled up. What other time works today or tomorrow?');
  assert.equal(h.patches.at(-1)?.phase, 'awaiting_time_choice');
  assert.deepEqual(h.patches.at(-1)?.offeredSlots, [{ date: TUE, time: '17:00' }, { date: '2026-11-18', time: '10:00' }]);
});

test('"how long is the call?" is answered and re-offers times, no one involved', async () => {
  const h = harness({ intent: 'asked_duration' });
  await runInboundReply(callState(), reply('how long?'), h.deps, ENV);
  assert.match(h.sent[0], /^Just 5 minutes\./);
  assert.deepEqual(h.alerts, []);
});

test('anything unsure is never answered by the machine and always pings the caller', async () => {
  for (const cls of [
    { intent: 'picked_slot' as const, pickedSlotIndex: 0, confident: false },
    { intent: 'unclear' as const },
    { intent: 'prefers_weekends' as const },
  ]) {
    const h = harness(cls);
    const out = await runInboundReply(callState(), reply('hmm'), h.deps, ENV);
    assert.equal(out.kind, 'escalated');
    assert.deepEqual(h.sent, [], `sent for ${cls.intent}`);
    assert.equal(h.alerts.length, 1, `no alert for ${cls.intent}`);
    assert.equal(h.booked.length, 0);
  }
});

test('"no thanks" closes quietly', async () => {
  const h = harness({ intent: 'not_interested' });
  const out = await runInboundReply(callState(), reply('not interested'), h.deps, ENV);
  assert.equal(out.kind, 'closed');
  assert.deepEqual(h.sent, []);
});

test('a reply after the call is booked goes to the caller, not the machine', async () => {
  const h = harness({ intent: 'picked_slot', pickedSlotIndex: 0 });
  await runInboundReply(callState({ phase: 'booked' }), reply('can we do 7 instead'), h.deps, ENV);
  assert.deepEqual(h.sent, []);
  assert.equal(h.alerts.length, 1);
});

test('without a send function, call mode falls back to drafts', async () => {
  const h = harness({ intent: 'asked_duration' });
  delete h.deps.send;
  const out = await runInboundReply(callState(), reply('how long'), h.deps, ENV);
  assert.equal(out.kind, 'drafted');
  assert.deepEqual(h.sent, []);
});

test('"not now" gets a gracious close, the thread goes to a person, and they are alerted', async () => {
  const h = harness({ intent: 'later_timeframe' });
  const out = await runInboundReply(callState(), reply('I will get back at you in the new year'), h.deps, ENV);
  assert.equal(out.kind, 'sent');
  assert.deepEqual(h.sent, ["No problem, Sarah. I'll check back with you then. Thanks!"]);
  assert.equal(h.patches.at(-1)?.phase, 'needs_human');
  assert.deepEqual(h.alerts, ['NEEDS_A_PERSON']);
  // Never asks "when?" of someone who just said when.
  assert.ok(!/\?/.test(h.sent[0]));
});

test('"please call me" gets no automatic text, only an alert to the caller', async () => {
  for (const body of ["I'm free anytime today. Please call me", 'Can I call you', 'open to a call Monday if you are free?']) {
    const h = harness({ intent: 'wants_call' });
    const out = await runInboundReply(callState(), reply(body), h.deps, ENV);
    assert.equal(out.kind, 'escalated');
    assert.deepEqual(h.sent, [], body);
    assert.equal(h.alerts.length, 1, body);
  }
});

test('the fit check can block an automatic reply: nothing sent, held back on the thread, caller alerted', async () => {
  const h = harness({ intent: 'asked_price' });
  h.deps.checkFit = async () => ({ fits: false, reason: 'ignores their credit concern' });
  const out = await runInboundReply(callState(), reply('how much? my credit check failed'), h.deps, ENV);
  assert.deepEqual(out, { kind: 'escalated', reason: 'REPLY_DID_NOT_FIT' });
  assert.deepEqual(h.sent, []);
  assert.equal(h.alerts.length, 1);
  const held = h.messages.find((m) => m.state === 'discarded');
  assert.match(held?.body ?? '', /^It depends on the size and layout/);
  assert.match(held?.escalationReason ?? '', /^REPLY_DID_NOT_FIT/);
});

test('a fit check that errors blocks the reply too', async () => {
  const h = harness({ intent: 'asked_duration' });
  h.deps.checkFit = async () => { throw new Error('timeout'); };
  const out = await runInboundReply(callState(), reply('how long?'), h.deps, ENV);
  assert.equal(out.kind, 'escalated');
  assert.deepEqual(h.sent, []);
});

test('a reply the fit check passes is sent as before', async () => {
  const h = harness({ intent: 'asked_duration' });
  let seen = '';
  h.deps.checkFit = async (i) => { seen = i.proposedReply; return { fits: true, reason: 'ok' }; };
  await runInboundReply(callState(), reply('how long is the call?'), h.deps, ENV);
  assert.match(h.sent[0], /^Just 5 minutes\./);
  assert.equal(seen, h.sent[0]);
});

test('a booking confirmation is not held up by the fit check', async () => {
  const h = harness({ intent: 'picked_slot', pickedSlotIndex: 1 });
  let called = false;
  h.deps.checkFit = async () => { called = true; return { fits: false, reason: 'x' }; };
  await runInboundReply(callState(), reply('6pm'), h.deps, ENV);
  assert.equal(called, false);
  assert.equal(h.sent.length, 1);
});

test('the price reply never claims they asked a question', () => {
  const body = renderReply('call_answer_price', { name: 'Sarah', slots: OLD_SLOTS, now: at('15:10') });
  assert.ok(!/fair question/i.test(body));
});

test('fit verdicts: only an explicit true lets a reply through', () => {
  assert.equal(parseFitVerdict('{"fits":true,"reason":"ok"}').fits, true);
  assert.equal(parseFitVerdict('{"fits":false,"reason":"no"}').fits, false);
  assert.equal(parseFitVerdict('{"reason":"missing"}').fits, false);
  assert.equal(parseFitVerdict('{"fits":"true"}').fits, false);
  assert.equal(parseFitVerdict('not json').fits, false);
});

test('no API key means no automatic reply gets through the fit check', async () => {
  const v = await checkReplyFits({ theirMessage: 'hi', ourPreviousMessage: '', proposedReply: 'hello' }, {} as NodeJS.ProcessEnv);
  assert.equal(v.fits, false);
});


// ─── Their own time (Nov 22 2026) ─────────────────────────────────────────────

test('a named time inside call hours is booked as said', () => {
  assert.deepEqual(resolveProposedSlot(at('15:20'), { date: TUE, from: '19:00' }), { date: TUE, time: '19:00' });
  assert.deepEqual(resolveProposedSlot(at('09:00'), { date: TUE, from: '14:15' }), { date: TUE, time: '14:15' });
});

test('a window books its first open half hour', () => {
  assert.deepEqual(resolveProposedSlot(at('15:20'), { date: TUE, from: '17:00', to: '20:00' }), { date: TUE, time: '17:00' });
  assert.deepEqual(resolveProposedSlot(at('08:00'), { date: TUE, from: '09:00', to: '12:00' }), { date: TUE, time: '10:00' });
  assert.deepEqual(
    resolveProposedSlot(at('15:20'), { date: TUE, from: '17:00', to: '20:00' }, [at('17:00'), at('17:00')]),
    { date: TUE, time: '17:30' }
  );
});

test('a time we cannot honour resolves to nothing', () => {
  assert.equal(resolveProposedSlot(at('15:20'), { date: TUE, from: '21:00' }), null, 'after hours');
  assert.equal(resolveProposedSlot(at('15:20'), { date: TUE, from: '09:00' }), null, 'before hours');
  assert.equal(resolveProposedSlot(at('15:20'), { date: TUE, from: '15:25' }), null, 'too soon');
  assert.equal(resolveProposedSlot(at('15:20'), { date: '2026-11-16', from: '12:00' }), null, 'past day');
  assert.equal(resolveProposedSlot(at('15:20'), { date: TUE, from: '19:00' }, [at('19:00'), at('19:00')]), null, 'full');
  assert.equal(resolveProposedSlot(at('15:20'), { date: 'Tuesday', from: '19:00' }), null, 'unparsed date');
});

test('"7 tonight" books 7pm, confirms, and alerts the caller', async () => {
  const h = harness({ intent: 'proposed_time', proposedDate: TUE, proposedFrom: '19:00' });
  h.deps.resolveProposed = async (p) => resolveProposedSlot(at('15:20'), p);
  const out = await runInboundReply(callState({ offeredSlots: [] }), reply('7 tonight works'), h.deps, ENV);
  assert.equal(out.kind, 'sent');
  assert.deepEqual(h.booked, [{ date: TUE, time: '19:00' }]);
  assert.deepEqual(h.sent, ["Perfect, Sarah. I'll call you tonight at 7pm from this number. Talk then."]);
  assert.deepEqual(h.alerts, ['CALL_BOOKED']);
});

test('"10pm" is not booked or answered; the caller arranges it', async () => {
  const h = harness({ intent: 'proposed_time', proposedDate: TUE, proposedFrom: '22:00' });
  h.deps.resolveProposed = async (p) => resolveProposedSlot(at('15:20'), p);
  const out = await runInboundReply(callState({ offeredSlots: [] }), reply('10pm?'), h.deps, ENV);
  assert.equal(out.kind, 'escalated');
  assert.deepEqual(h.booked, []);
  assert.deepEqual(h.sent, []);
  assert.equal(h.alerts.length, 1);
});

test('follow-up replies ask for their time, never offer two fixed slots', () => {
  for (const id of ['call_answer_price', 'call_answer_duration', 'call_other_project', 'call_who_is_this', 'call_slot_taken'] as const) {
    const body = renderReply(id, { name: 'Sarah', slots: [], now: at('15:10'), sender: 'Mark' });
    assert.match(body, /What (other )?time works today or tomorrow/, id);
  }
});

// ─── "Can't talk, I can text": the booking link ───────────────────────────────

const BATHROOM_LINK = 'https://ontarioreno.ca/consultation/bathroom';

test('"working all day, I can text" gets the booking link, then the thread goes to a person', async () => {
  const h = harness({ intent: 'prefers_text' });
  const out = await runInboundReply(
    callState(),
    { ...reply('I will be working all day tomorrow. I can text though'), bookingUrl: BATHROOM_LINK },
    h.deps,
    ENV
  );
  assert.equal(out.kind, 'sent');
  assert.deepEqual(h.sent, [
    `No problem, Sarah. You can book a free in-home consultation for any day and time that suits you here: ${BATHROOM_LINK}`,
  ]);
  // A person owns it now, so the link is never sent twice and the caller knows.
  assert.equal(h.patches.at(-1)?.phase, 'needs_human');
  assert.deepEqual(h.alerts, ['NEEDS_A_PERSON']);
  assert.deepEqual(h.booked, []);
});

test('a second reply after the link is never answered automatically', async () => {
  const h = harness({ intent: 'prefers_text' });
  const out = await runInboundReply(callState({ phase: 'needs_human' }), reply('still busy'), h.deps, ENV);
  assert.equal(out.kind, 'escalated');
  assert.deepEqual(h.sent, []);
});

test('an unsure "can\'t talk" reads goes to a person, no link', async () => {
  const h = harness({ intent: 'prefers_text', confident: false });
  const out = await runInboundReply(callState(), reply('busy'), h.deps, ENV);
  assert.equal(out.kind, 'escalated');
  assert.deepEqual(h.sent, []);
});

test('the fit check can hold the link back', async () => {
  const h = harness({ intent: 'prefers_text' });
  h.deps.checkFit = async () => ({ fits: false, reason: 'they asked a question' });
  const out = await runInboundReply(callState(), reply('busy, how much is it?'), h.deps, ENV);
  assert.equal(out.kind, 'escalated');
  assert.deepEqual(h.sent, []);
});

test('the link only goes out on call threads', () => {
  assert.deepEqual(decideNextAction('awaiting_time_choice', c({ intent: 'prefers_text' }), 'call'), {
    kind: 'reply', template: 'call_booking_link', nextPhase: 'needs_human',
  });
  assert.deepEqual(decideNextAction('opened', c({ intent: 'prefers_text' }), 'visit'), {
    kind: 'escalate', reason: 'NEEDS_A_PERSON',
  });
});

test('booking link copy: no em dash, no name when we have none, basement page by default', () => {
  const body = renderReply('call_booking_link', { name: '', slots: [] });
  assert.equal(
    body,
    'No problem. You can book a free in-home consultation for any day and time that suits you here: https://ontarioreno.ca/consultation/basement'
  );
  assert.ok(!body.includes('—'));
  assert.match(renderReply('call_booking_link', { name: 'Jamie', slots: [], bookingUrl: BATHROOM_LINK }), /^No problem, Jamie\. .*\/consultation\/bathroom$/);
});

test('bathroom threads link the bathroom page, everything else the basement page, env overrides win', () => {
  assert.equal(bookingUrlFor('Hi Jamie, thanks for asking about your bathroom renovation'), BATHROOM_LINK);
  assert.equal(bookingUrlFor('Hi Colin, it is Mark from OntarioReno about your basement', {} as NodeJS.ProcessEnv), 'https://ontarioreno.ca/consultation/basement');
  assert.equal(bookingUrlFor(null, {} as NodeJS.ProcessEnv), 'https://ontarioreno.ca/consultation/basement');
  assert.equal(bookingUrlFor('basement', { LEAD_WELCOME_BOOKING_URL: 'https://example.test/b' } as NodeJS.ProcessEnv), 'https://example.test/b');
});
