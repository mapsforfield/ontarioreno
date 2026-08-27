// ─── The state machine behind a text conversation with an unbooked lead ───────
// Pure. No clock, no database, no model call. It takes the conversation's
// current phase plus a classification of what the homeowner just said, and
// returns ONE action.
//
// The division of labour, which is the whole safety property:
//
//   lib/lead-classify.ts   the model READS the reply → an intent
//   this file              deterministic code DECIDES what happens
//   lib/lead-reply-templates.ts   Michael's words, rendered
//
// The model never chooses to book, never chooses to close a lead, and never
// writes a sentence. It only says what it thinks the homeowner meant, and every
// route out of "I am not sure" ends at a person.

import type { ReplyTemplateId } from './lead-reply-templates.js';

/** Where a conversation is. Terminal phases are booked, closed, needs_human. */
export type ConversationPhase =
  /** Opener sent, nothing back yet. */
  | 'opened'
  /** We offered two real slots and are waiting for a pick. */
  | 'awaiting_time_choice'
  /** They picked a slot; we need somewhere to send a rep. */
  | 'awaiting_address'
  /** Booked. The ordinary appointment machinery owns them now. */
  | 'booked'
  /** They said no. We do not reply and we do not follow up. */
  | 'closed'
  /** Michael has it. Nothing automatic happens until he acts. */
  | 'needs_human';

/**
 * What the homeowner meant. Produced by the model, consumed only here.
 *
 * `unclear` is not a failure mode to be minimised — it is the pressure-release
 * valve that keeps every other branch honest. A classifier that never returns
 * it is a classifier that is guessing.
 */
export type ReplyIntent =
  | 'prefers_weekdays'
  | 'prefers_weekends'
  | 'picked_slot'
  | 'gave_address'
  | 'asked_price'
  | 'asked_duration'
  | 'asked_who_is_this'
  | 'not_interested'
  | 'wants_call'
  | 'different_project'
  | 'later_timeframe'
  | 'unclear';

export type Classification = {
  intent: ReplyIntent;
  /**
   * False whenever the model is not sure. Any false lands on Michael's desk
   * whatever the intent says — see decideNextAction.
   */
  confident: boolean;
  /** Which offered slot they picked, 0-based, when intent is picked_slot. */
  pickedSlotIndex?: number | null;
  /** The address as they typed it, when intent is gave_address. */
  addressText?: string | null;
  /** Their own words, carried through to every escalation unedited. */
  rawBody: string;
};

export type NextAction =
  /** Draft this template back to them. */
  | { kind: 'reply'; template: ReplyTemplateId; nextPhase: ConversationPhase }
  /** Try to book the picked slot at the given address. */
  | { kind: 'book'; addressText: string }
  /** Say nothing, follow up never again. */
  | { kind: 'close' }
  /** Michael reads it and decides. */
  | { kind: 'escalate'; reason: EscalationReason };

export type EscalationReason =
  /** The model told us it was not sure. */
  | 'NOT_CONFIDENT'
  /** We understood them, but not as an answer to what we asked. */
  | 'INTENT_DOES_NOT_FIT_PHASE'
  /** Understood, and it is genuinely a person's job. */
  | 'NEEDS_A_PERSON'
  /** A human already owns this conversation. */
  | 'ALREADY_WITH_A_HUMAN';

/** Phases where nothing automatic may happen, ever. */
const TERMINAL: ConversationPhase[] = ['booked', 'closed', 'needs_human'];

/**
 * The questions a homeowner can ask at any point without it meaning they have
 * stopped considering the visit. Each is answered AND re-offers the times, so
 * answering never costs us the thread.
 */
const QUESTION_REPLIES: Partial<Record<ReplyIntent, ReplyTemplateId>> = {
  asked_price: 'answer_price',
  asked_duration: 'answer_duration',
  different_project: 'other_project',
};

export function decideNextAction(
  phase: ConversationPhase,
  c: Classification
): NextAction {
  // ── 1. A human already has it ──
  // Booked, closed, or escalated: the automation had its turn. Re-entering
  // here is how a closed lead gets texted again and how a booked homeowner
  // gets two different answers from us.
  if (TERMINAL.includes(phase)) {
    return { kind: 'escalate', reason: 'ALREADY_WITH_A_HUMAN' };
  }

  // ── 2. Doubt outranks everything ──
  // Before any intent is acted on. A confident-looking intent with the
  // confidence flag down is exactly the case that sends a wrong-but-fluent
  // text to a real person.
  if (!c.confident) {
    return { kind: 'escalate', reason: 'NOT_CONFIDENT' };
  }

  // ── 3. Intents that mean the same thing wherever they appear ──
  if (c.intent === 'unclear') {
    return { kind: 'escalate', reason: 'NEEDS_A_PERSON' };
  }
  if (c.intent === 'not_interested') {
    // No reply. Michael's call: a "no thanks" costs us a message to answer and
    // gains nothing, and the close is what stops the follow-up sequence
    // chasing someone who already said no.
    return { kind: 'close' };
  }
  if (c.intent === 'wants_call') {
    // We ask for a time, and the answer is work for a person rather than a
    // booking — there is no slot to hold and no address to send anyone to.
    return { kind: 'reply', template: 'wants_call', nextPhase: 'needs_human' };
  }
  if (c.intent === 'asked_who_is_this') {
    // Back to the top of the funnel: the template re-asks the opener's
    // question, so the phase does not advance.
    return { kind: 'reply', template: 'who_is_this', nextPhase: phase };
  }
  if (c.intent === 'later_timeframe') {
    // They are interested but not now. Michael decides when to chase, because
    // "a few months" is not a date and nothing here should invent one.
    return { kind: 'reply', template: 'further_out', nextPhase: 'needs_human' };
  }

  // A pricing / duration / other-project question is answered in place and
  // always re-offers times, so the thread keeps moving toward a booking.
  const questionReply = QUESTION_REPLIES[c.intent];
  if (questionReply) {
    return { kind: 'reply', template: questionReply, nextPhase: 'awaiting_time_choice' };
  }

  // ── 4. Intents that only make sense as an answer to what we last asked ──
  switch (phase) {
    case 'opened':
      if (c.intent === 'prefers_weekdays') {
        return { kind: 'reply', template: 'picked_weekdays', nextPhase: 'awaiting_time_choice' };
      }
      if (c.intent === 'prefers_weekends') {
        return { kind: 'reply', template: 'picked_weekends', nextPhase: 'awaiting_time_choice' };
      }
      // Someone who answers the opener with a street address, or by picking a
      // time we never offered, is not following the script. Understood, but
      // not answerable by a template.
      return { kind: 'escalate', reason: 'INTENT_DOES_NOT_FIT_PHASE' };

    case 'awaiting_time_choice':
      if (c.intent === 'picked_slot') {
        // The index has to be real. A model that says "they picked one" without
        // saying which has told us nothing we can act on.
        if (typeof c.pickedSlotIndex !== 'number' || c.pickedSlotIndex < 0) {
          return { kind: 'escalate', reason: 'NOT_CONFIDENT' };
        }
        return { kind: 'reply', template: 'ask_address', nextPhase: 'awaiting_address' };
      }
      // Re-stating a weekday/weekend preference after we have already offered
      // real times usually means neither time suited them. Offering the same
      // two again is the loop a person notices and we do not.
      if (c.intent === 'prefers_weekdays' || c.intent === 'prefers_weekends') {
        return { kind: 'escalate', reason: 'INTENT_DOES_NOT_FIT_PHASE' };
      }
      return { kind: 'escalate', reason: 'INTENT_DOES_NOT_FIT_PHASE' };

    case 'awaiting_address':
      if (c.intent === 'gave_address') {
        const text = (c.addressText ?? '').trim();
        if (!text) {
          // The model saw an address and could not extract it. Ask again in
          // Michael's words rather than guessing from the raw body.
          return { kind: 'reply', template: 'address_unclear', nextPhase: 'awaiting_address' };
        }
        return { kind: 'book', addressText: text };
      }
      return { kind: 'escalate', reason: 'INTENT_DOES_NOT_FIT_PHASE' };
  }
}

/**
 * What happens after a booking attempt.
 *
 * Separate from decideNextAction because it is not the homeowner's reply that
 * decides it — it is the calendar. Splitting them keeps the slot-taken race
 * out of the intent logic.
 */
// A STRING discriminant, not `ok: true | false`. This project does not compile
// under `strict`, and without strictNullChecks a boolean literal widens to
// `boolean` — so `if (outcome.ok)` narrows nothing and every field access on
// the other members fails to typecheck.
export type BookingOutcome =
  | { result: 'BOOKED'; date: string; time: string; address: string }
  | { result: 'SLOT_TAKEN'; alternatives: number }
  | { result: 'ADDRESS_UNRESOLVED' }
  | { result: 'CANNOT_BOOK' };

export function afterBooking(outcome: BookingOutcome): NextAction {
  if (outcome.result === 'BOOKED') {
    return { kind: 'reply', template: 'booked_confirmation', nextPhase: 'booked' };
  }
  if (outcome.result === 'ADDRESS_UNRESOLVED') {
    // Google could not place what they typed. Asking once more is cheap and
    // usually works; a second failure is a person's job, which the state
    // machine reaches because the phase does not advance and Michael sees the
    // conversation stalled.
    return { kind: 'reply', template: 'address_unclear', nextPhase: 'awaiting_address' };
  }
  if (outcome.result === 'SLOT_TAKEN' && outcome.alternatives >= 2) {
    return { kind: 'reply', template: 'slot_taken', nextPhase: 'awaiting_time_choice' };
  }
  // Taken with nothing left to offer, or the booking failed for a reason we
  // have no true sentence for. Never improvise at this point — the homeowner
  // is one message from an appointment and a wrong word here is expensive.
  return { kind: 'escalate', reason: 'NEEDS_A_PERSON' };
}
