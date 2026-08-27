// ─── Running one inbound reply through the conversation ───────────────────────
// The orchestration between the pure state machine and the database, with its
// database work injected so the ordering — record, classify, decide, draft —
// is testable without a Neon connection.
//
// PHASE 1 BEHAVIOUR, AND THE REASON FOR IT: nothing here sends a text and
// nothing here books an appointment. Every decision the state machine reaches
// is written down as a DRAFT for Michael to approve on the Conversations page.
// Real replies from real homeowners are the only way to find out which cases
// the classifier gets wrong, and reading fifty of those costs an afternoon
// while sending fifty wrong texts costs fifty prospects.
//
// A `book` action is therefore NOT booked here. It is handed over with the
// address the homeowner gave, and a person places it. Automatic booking is
// phase 2, and it should not ship until the drafts have been watched.

import {
  afterBooking,
  decideNextAction,
  type Classification,
  type ConversationPhase,
  type EscalationReason,
  type NextAction,
} from './lead-conversation.js';
import {
  renderReply,
  SLOTS_REQUIRED,
  type OfferedSlot,
  type ReplyTemplateId,
} from './lead-reply-templates.js';
import { classifyLeadReply } from './lead-classify.js';
import { resolvePickedSlot } from './lead-classify.js';

/** The conversation as stored. */
export type ConversationState = {
  id: string;
  leadId: string;
  phase: ConversationPhase;
  offeredSlots: OfferedSlot[];
  lastOutbound: string;
};

export type InboundReply = {
  /** Twilio's SID — the dedupe key. */
  messageSid: string;
  body: string;
  /** First name is all any template uses. */
  leadName: string;
};

export type RunnerDeps = {
  /** Real open times for this lead, best first. Empty when none. */
  listOpenSlots: (leadId: string) => Promise<OfferedSlot[]>;
  /** Append a message to the thread. */
  recordMessage: (m: {
    conversationId: string;
    direction: 'in' | 'out';
    body: string;
    state: string;
    templateId?: string;
    intent?: string;
    confident?: boolean;
    escalationReason?: string;
    messageSid?: string;
  }) => Promise<void>;
  /** Move the conversation on. */
  updateConversation: (
    id: string,
    patch: { phase?: ConversationPhase; offeredSlots?: OfferedSlot[]; needsHumanReason?: string }
  ) => Promise<void>;
  /** Overridable for tests. */
  classify?: typeof classifyLeadReply;
};

export type RunOutcome =
  /** A draft is waiting for Michael. */
  | { kind: 'drafted'; template: ReplyTemplateId; body: string; nextPhase: ConversationPhase }
  /** Nothing to say; the thread is closed and follow-ups stop. */
  | { kind: 'closed' }
  /** On the Conversations page for a person to answer. */
  | { kind: 'escalated'; reason: EscalationReason | 'NO_SLOTS_AVAILABLE' };

/**
 * One inbound reply, start to finish.
 *
 * Never throws on a classification or a template failure — both end at a
 * person. It will propagate a database error, because losing the record of
 * what a homeowner said is worse than a 500 Twilio will retry.
 */
export async function runInboundReply(
  conversation: ConversationState,
  reply: InboundReply,
  deps: RunnerDeps,
  env: NodeJS.ProcessEnv = process.env
): Promise<RunOutcome> {
  const classifyFn = deps.classify ?? classifyLeadReply;

  // ── 1. Record what they said, before deciding anything about it ──
  // If everything after this line fails, the words a real person sent are
  // still on the thread and Michael can act on them by hand.
  const classification: Classification = await classifyFn(
    {
      body: reply.body,
      phase: conversation.phase,
      offeredSlots: conversation.offeredSlots,
      lastOutbound: conversation.lastOutbound,
    },
    env
  );

  await deps.recordMessage({
    conversationId: conversation.id,
    direction: 'in',
    body: reply.body,
    state: 'received',
    intent: classification.intent,
    confident: classification.confident,
    messageSid: reply.messageSid,
  });

  // ── 2. Decide ──
  let action: NextAction = decideNextAction(conversation.phase, classification);

  // ── 3. A booking is a person's job in phase 1 ──
  // The state machine is allowed to reach `book`; we deliberately do not act on
  // it yet. The address they gave is on the thread, so the handover is complete.
  if (action.kind === 'book') {
    return escalate(conversation, deps, 'NEEDS_A_PERSON', reply.body);
  }

  if (action.kind === 'close') {
    await deps.updateConversation(conversation.id, { phase: 'closed', needsHumanReason: '' });
    return { kind: 'closed' };
  }

  if (action.kind === 'escalate') {
    return escalate(conversation, deps, action.reason, reply.body);
  }

  // ── 4. A reply needs real times before it can be drafted ──
  // Every offer names slots the calendar says are genuinely open, read at the
  // moment we draft. Offering a time we cannot honour is the one failure a
  // homeowner experiences as being lied to.
  const need = SLOTS_REQUIRED[action.template];
  let slots = conversation.offeredSlots;
  if (need > 0) {
    slots = await deps.listOpenSlots(conversation.leadId);
    if (slots.length < need) {
      // Nothing true to offer. Michael has options the calendar does not know
      // about; a template does not.
      return escalate(conversation, deps, 'NO_SLOTS_AVAILABLE', reply.body);
    }
    slots = slots.slice(0, Math.max(need, 2));
  }

  // The slot they picked has to be resolved against what we actually offered
  // before the ask-the-address draft can name it back to them.
  if (action.template === 'ask_address') {
    const picked = resolvePickedSlot(classification, conversation.offeredSlots);
    if (!picked) return escalate(conversation, deps, 'NOT_CONFIDENT', reply.body);
    slots = [picked];
  }

  let body: string;
  try {
    body = renderReply(action.template, { name: reply.leadName, slots });
  } catch (err) {
    // A template that cannot render is a bug, and the safe response to a bug in
    // the message path is to say nothing and tell a person.
    console.error('[lead-conversation] could not render draft:', err);
    return escalate(conversation, deps, 'NEEDS_A_PERSON', reply.body);
  }

  await deps.recordMessage({
    conversationId: conversation.id,
    direction: 'out',
    body,
    // The whole of phase 1 is this word. Approving it is what sends it.
    state: 'pending_approval',
    templateId: action.template,
  });

  // The phase moves when the DRAFT is written, not when it is sent. A homeowner
  // who texts twice before Michael approves must not produce two drafts that
  // both think they are answering the opener.
  await deps.updateConversation(conversation.id, {
    phase: action.nextPhase,
    offeredSlots: slots,
    needsHumanReason: '',
  });

  return { kind: 'drafted', template: action.template, body, nextPhase: action.nextPhase };
}

async function escalate(
  conversation: ConversationState,
  deps: RunnerDeps,
  reason: EscalationReason | 'NO_SLOTS_AVAILABLE',
  rawBody: string
): Promise<RunOutcome> {
  await deps.recordMessage({
    conversationId: conversation.id,
    direction: 'out',
    // No body: there is nothing we are proposing to say. A draft with empty
    // text on the Conversations page reads as "Michael writes this one",
    // which is exactly what it means.
    body: '',
    state: 'pending_approval',
    escalationReason: reason,
  });
  await deps.updateConversation(conversation.id, {
    phase: 'needs_human',
    needsHumanReason: reason,
  });
  void rawBody; // already on the thread from the inbound row
  return { kind: 'escalated', reason };
}

/** Re-exported so the API layer can finish a booking without importing three files. */
export { afterBooking };
