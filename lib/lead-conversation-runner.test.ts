// Phase 1's contract, asserted: a real homeowner's reply produces a DRAFT and
// never a send, never a booking, and never silence where a person was needed.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runInboundReply, type ConversationState, type RunnerDeps } from './lead-conversation-runner.js';
import type { Classification } from './lead-conversation.js';
import type { OfferedSlot } from './lead-reply-templates.js';

const SLOTS: OfferedSlot[] = [
  { date: '2026-09-01', time: '10:00' },
  { date: '2026-09-02', time: '14:00' },
  { date: '2026-09-03', time: '18:00' },
];

type Recorded = Parameters<RunnerDeps['recordMessage']>[0];
type Patched = Parameters<RunnerDeps['updateConversation']>[1];

function harness(
  classification: Partial<Classification>,
  openSlots: OfferedSlot[] = SLOTS
) {
  const messages: Recorded[] = [];
  const patches: Patched[] = [];
  const deps: RunnerDeps = {
    listOpenSlots: async () => openSlots,
    recordMessage: async (m) => void messages.push(m),
    updateConversation: async (_id, patch) => void patches.push(patch),
    classify: async () => ({
      intent: 'prefers_weekdays',
      confident: true,
      rawBody: 'weekdays',
      ...classification,
    }),
  };
  return { deps, messages, patches };
}

const state = (over: Partial<ConversationState> = {}): ConversationState => ({
  id: 'conv-1',
  leadId: 'lead-1',
  phase: 'opened',
  offeredSlots: [],
  lastOutbound: 'Hi Sarah, this is Michael from OntarioReno about your basement...',
  ...over,
});

const reply = (body: string) => ({ messageSid: 'SM1', body, leadName: 'Sarah Whitfield' });

// ─── Nothing sends. That is the whole of phase 1. ─────────────────────────────

test('a reply produces a draft awaiting approval, never a send', () => {
  return (async () => {
    const { deps, messages } = harness({ intent: 'prefers_weekdays' });
    const out = await runInboundReply(state(), reply('weekdays are better'), deps, {} as NodeJS.ProcessEnv);

    assert.equal(out.kind, 'drafted');
    const outbound = messages.filter((m) => m.direction === 'out');
    assert.equal(outbound.length, 1);
    assert.equal(outbound[0].state, 'pending_approval', 'a draft must not be marked sent');
    assert.equal(outbound[0].templateId, 'picked_weekdays');
  })();
});

test('nothing is booked in phase 1, even when the state machine says book', () => {
  // The address is captured and handed over. Automatic booking is phase 2 and
  // must not arrive by accident.
  return (async () => {
    const { deps, patches } = harness({ intent: 'gave_address', addressText: '42 King St W' });
    const out = await runInboundReply(
      state({ phase: 'awaiting_address', offeredSlots: SLOTS.slice(0, 2) }),
      reply('42 King St W'),
      deps,
      {} as NodeJS.ProcessEnv
    );
    assert.equal(out.kind, 'escalated');
    assert.equal(patches.at(-1)?.phase, 'needs_human');
  })();
});

// ─── The homeowner's words survive everything ─────────────────────────────────

test('the inbound message is recorded before anything is decided', () => {
  // If every later step failed, what a real person sent is still on the thread.
  return (async () => {
    const { deps, messages } = harness({ intent: 'unclear', confident: false });
    await runInboundReply(state(), reply('my wife handles the calendar'), deps, {} as NodeJS.ProcessEnv);

    assert.equal(messages[0].direction, 'in');
    assert.equal(messages[0].body, 'my wife handles the calendar');
    assert.equal(messages[0].messageSid, 'SM1', 'the dedupe key is stored with it');
  })();
});

test('the classifier verdict is stored verbatim, right or wrong', () => {
  // So a bad call can be found afterwards rather than inferred from the reply.
  return (async () => {
    const { deps, messages } = harness({ intent: 'not_interested', confident: true });
    await runInboundReply(state(), reply('no thanks'), deps, {} as NodeJS.ProcessEnv);
    assert.equal(messages[0].intent, 'not_interested');
    assert.equal(messages[0].confident, true);
  })();
});

// ─── Never offer a time we do not have ────────────────────────────────────────

test('a draft offering times is refused when the calendar has none', () => {
  // "I've got  or " to a real prospect. Michael has options the calendar does
  // not know about; a template does not.
  return (async () => {
    const { deps, messages, patches } = harness({ intent: 'prefers_weekdays' }, []);
    const out = await runInboundReply(state(), reply('weekdays'), deps, {} as NodeJS.ProcessEnv);

    assert.equal(out.kind, 'escalated');
    if (out.kind === 'escalated') assert.equal(out.reason, 'NO_SLOTS_AVAILABLE');
    assert.equal(patches.at(-1)?.phase, 'needs_human');
    assert.ok(!messages.some((m) => m.direction === 'out' && m.body.length > 0));
  })();
});

test('one open slot is not enough to offer two', () => {
  return (async () => {
    const { deps } = harness({ intent: 'prefers_weekends' }, SLOTS.slice(0, 1));
    const out = await runInboundReply(state(), reply('weekends'), deps, {} as NodeJS.ProcessEnv);
    assert.equal(out.kind, 'escalated');
  })();
});

test('the times in the draft are read fresh, not remembered', () => {
  // A slot open when we last spoke may be gone now. The offer has to be true
  // at the moment it is written.
  return (async () => {
    const fresh: OfferedSlot[] = [
      { date: '2026-09-10', time: '12:00' },
      { date: '2026-09-11', time: '16:00' },
    ];
    const { deps, messages, patches } = harness({ intent: 'asked_price' }, fresh);
    await runInboundReply(
      state({ offeredSlots: SLOTS }),
      reply('how much roughly?'),
      deps,
      {} as NodeJS.ProcessEnv
    );
    const draft = messages.find((m) => m.direction === 'out');
    assert.ok(draft?.body.includes('Sep 10'), 'the draft offers the stale times');
    assert.ok(!draft?.body.includes('Sep 1,'), 'the draft still names a time we no longer have');
    assert.deepEqual(patches.at(-1)?.offeredSlots, fresh, 'what we offered must be what we store');
  })();
});

// ─── A pick is resolved against what we actually offered ──────────────────────

test('a picked slot is named back to them from the list they were shown', () => {
  return (async () => {
    const offered = SLOTS.slice(0, 2);
    const { deps, messages } = harness({ intent: 'picked_slot', pickedSlotIndex: 1 });
    const out = await runInboundReply(
      state({ phase: 'awaiting_time_choice', offeredSlots: offered }),
      reply('the second one'),
      deps,
      {} as NodeJS.ProcessEnv
    );
    assert.equal(out.kind, 'drafted');
    const draft = messages.find((m) => m.direction === 'out');
    assert.ok(draft?.body.includes('Wed Sep 2, 2pm'), 'the draft names the wrong slot back to them');
    assert.match(draft?.body ?? '', /address/i);
  })();
});

test('a pick pointing past what we offered is a person, not slot zero', () => {
  return (async () => {
    const { deps } = harness({ intent: 'picked_slot', pickedSlotIndex: 5 });
    const out = await runInboundReply(
      state({ phase: 'awaiting_time_choice', offeredSlots: SLOTS.slice(0, 2) }),
      reply('that one'),
      deps,
      {} as NodeJS.ProcessEnv
    );
    assert.equal(out.kind, 'escalated');
  })();
});

// ─── Escalations and closes ───────────────────────────────────────────────────

test('an escalation writes an empty draft for Michael to fill in', () => {
  // An empty draft on the Conversations page reads as "this one is yours",
  // which is exactly what it means. Never a half-written guess.
  return (async () => {
    const { deps, messages, patches } = harness({ intent: 'unclear', confident: false });
    await runInboundReply(state(), reply('do you do the permits too or is that on me'), deps, {} as NodeJS.ProcessEnv);

    const draft = messages.find((m) => m.direction === 'out');
    assert.equal(draft?.body, '');
    assert.equal(draft?.escalationReason, 'NOT_CONFIDENT');
    assert.equal(patches.at(-1)?.needsHumanReason, 'NOT_CONFIDENT');
  })();
});

test('"not interested" writes no draft and closes the thread', () => {
  // The close is what stops the follow-up sequence chasing someone who said no.
  return (async () => {
    const { deps, messages, patches } = harness({ intent: 'not_interested' });
    const out = await runInboundReply(state(), reply('not interested'), deps, {} as NodeJS.ProcessEnv);

    assert.deepEqual(out, { kind: 'closed' });
    assert.equal(messages.filter((m) => m.direction === 'out').length, 0, 'we replied to a no');
    assert.equal(patches.at(-1)?.phase, 'closed');
  })();
});

test('a conversation a human already owns produces no new draft text', () => {
  return (async () => {
    for (const phase of ['booked', 'closed', 'needs_human'] as const) {
      const { deps, messages } = harness({ intent: 'prefers_weekdays' });
      const out = await runInboundReply(state({ phase }), reply('weekdays'), deps, {} as NodeJS.ProcessEnv);
      assert.equal(out.kind, 'escalated', `${phase} was answered automatically`);
      assert.ok(!messages.some((m) => m.direction === 'out' && m.body.length > 0));
    }
  })();
});

// ─── The phase moves on the draft, not on the send ────────────────────────────

test('the phase advances when the draft is written', () => {
  // Otherwise a homeowner who texts twice before Michael approves produces two
  // drafts that both believe they are answering the opener.
  return (async () => {
    const { deps, patches } = harness({ intent: 'prefers_weekdays' });
    await runInboundReply(state(), reply('weekdays'), deps, {} as NodeJS.ProcessEnv);
    assert.equal(patches.at(-1)?.phase, 'awaiting_time_choice');
  })();
});

test('a classifier that throws still leaves the reply on a person’s desk', () => {
  return (async () => {
    const { deps, messages } = harness({});
    deps.classify = async () => {
      throw new Error('network');
    };
    await assert.rejects(() => runInboundReply(state(), reply('weekdays'), deps, {} as NodeJS.ProcessEnv));
    // Nothing was drafted on the way out — no half-answer reaches a homeowner.
    assert.ok(!messages.some((m) => m.direction === 'out'));
  })();
});
