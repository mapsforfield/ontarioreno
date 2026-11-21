// Call mode, end to end without a database: the two times the opener offers,
// the words it uses, and what each kind of reply does.
//
// The contract: a clear reply is answered or booked with no one in the loop; an
// unclear one is NEVER answered by the machine and always reaches the caller's
// phone; nothing a homeowner receives promises a visit or asks for an address.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
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
  room: 'basement' as const,
  slots: [{ date: TUE, time: '16:30' }, { date: TUE, time: '18:00' }],
  sendWall: at('15:10'),
};

test('opener asks one question with two real times, no link', () => {
  assert.equal(
    smsLeadCallOpener(OPENER),
    "Hi Sarah, it's Mark from OntarioReno about your basement. Does today at 4:30pm or tonight at 6pm work for a quick call?"
  );
  assert.ok(!/https?:|\.ca\//.test(smsLeadCallOpener(OPENER)));
});

test('opener fits one SMS segment and has no em dash', () => {
  const body = smsLeadCallOpener({ ...OPENER, name: 'Alexandrina-Marguerite', room: 'bathroom' });
  assert.ok(body.length <= 160, `${body.length} chars`);
  assert.ok(!body.includes('—'));
  assert.match(body, /your bathroom renovation/);
});

test('opener without a name still reads', () => {
  assert.match(smsLeadCallOpener({ ...OPENER, name: '' }), /^Hi, it's Mark/);
});

test('opener keeps the one-first-text key and expires before the first time', () => {
  const [row] = planLeadCallOpener(OPENER);
  assert.equal(row.idempotencyKey, 'lead-1:sms:lead_welcome');
  // 4:30pm Toronto (EST, UTC-5) minus 20 minutes.
  assert.equal(row.expiresAt, '2026-11-17T21:10:00.000Z');
  assert.equal(planLeadCallOpener({ ...OPENER, slots: OPENER.slots.slice(0, 1) }).length, 0);
});

// ─── Templates ────────────────────────────────────────────────────────────────

test('no call template promises a visit, asks for an address, or uses an em dash', () => {
  const ctx = { name: 'Sarah', slots: OPENER.slots, now: at('15:10'), sender: 'Mark', about: 'your basement' };
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
  offeredSlots: OPENER.slots,
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
  assert.match(h.sent[0], /^Sorry, that time just filled up\. I can do tonight at 5pm or tomorrow at 10am\./);
  assert.equal(h.patches.at(-1)?.phase, 'awaiting_time_choice');
  assert.deepEqual(h.patches.at(-1)?.offeredSlots, [{ date: TUE, time: '17:00' }, { date: '2026-11-18', time: '10:00' }]);
});

test('"how long is the call?" is answered and re-offers times, no one involved', async () => {
  const h = harness({ intent: 'asked_duration' });
  await runInboundReply(callState(), reply('how long?'), h.deps, ENV);
  assert.match(h.sent[0], /^Just 5 to 10 minutes\./);
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

test('any reply that hands the thread to a person also alerts them', async () => {
  const h = harness({ intent: 'wants_call' });
  await runInboundReply(callState(), reply('just call me'), h.deps, ENV);
  assert.equal(h.sent.length, 1);
  assert.equal(h.patches.at(-1)?.phase, 'needs_human');
  assert.deepEqual(h.alerts, ['NEEDS_A_PERSON']);
});
