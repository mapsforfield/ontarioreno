// ─── The branch for a text from a lead who has no appointment yet ─────────────
// Everything here hangs off ONE case that used to end the request: an inbound
// SMS whose number matches no upcoming appointment. Before this, that message
// was written to SmsReply and dropped — nobody was told, and a homeowner who
// answered our opener got silence.
//
// WHAT THIS MUST NOT DISTURB, and why the call site is where it is:
//
//   * The forward to SMS_FORWARD_URL still happens first, before the signature
//     check, exactly as it did. This runs long after both.
//   * A reply from a BOOKED lead never reaches here. That path — confirm,
//     reschedule, and the verbatim forward of anything else to the assigned rep
//     — is untouched, and it is the one reps already depend on.
//   * Every failure in this file is swallowed. The SmsReply row is written by
//     the caller before we are called, so the worst case is the status quo:
//     the message is logged and a person finds it.

import { phoneKey } from './sms-replies.js';
import { availableSlotsForLead, spreadAcrossDays } from './lead-availability.js';
import { runInboundReply, type ConversationState, type RunnerDeps } from './lead-conversation-runner.js';
import type { ConversationPhase } from './lead-conversation.js';
import type { OfferedSlot } from './lead-reply-templates.js';

/** How many times a draft may offer. Two is the question; a third is a menu. */
const SLOTS_TO_OFFER = 2;

type LeadRow = {
  id: string;
  name?: string | null;
  phone?: string | null;
  appointmentId?: string | null;
  deletedAt?: Date | null;
  schedulingArea?: string | null;
  programKey?: string | null;
  city?: string | null;
  resolvedMunicipality?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

type ConversationRow = {
  id: string;
  leadId: string;
  phase: string;
  offeredSlotsJson: unknown;
  lastOutbound: string;
};

/**
 * The client shape this needs. Every member is optional at the call site — a
 * store without these tables (the existing sms-inbound unit tests) simply skips
 * the whole branch rather than throwing.
 */
export type LeadInboundStore = {
  lead?: { findMany: (args: unknown) => Promise<LeadRow[]> };
  leadConversation?: {
    findUnique: (args: unknown) => Promise<ConversationRow | null>;
    create: (args: unknown) => Promise<ConversationRow>;
    update: (args: unknown) => Promise<unknown>;
  };
  leadConversationMessage?: {
    findUnique: (args: unknown) => Promise<{ id: string } | null>;
    create: (args: unknown) => Promise<unknown>;
  };
  user?: unknown;
  appointment?: unknown;
  repDayOff?: unknown;
};

const PHASES: ConversationPhase[] = [
  'opened',
  'awaiting_time_choice',
  'awaiting_address',
  'booked',
  'closed',
  'needs_human',
];

/** A phase we do not recognise is a person's problem, never a guess. */
function toPhase(raw: string): ConversationPhase {
  return PHASES.includes(raw as ConversationPhase) ? (raw as ConversationPhase) : 'needs_human';
}

function toSlots(raw: unknown): OfferedSlot[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s): s is OfferedSlot => !!s && typeof s === 'object')
    .filter((s) => typeof s.date === 'string' && typeof s.time === 'string');
}

/**
 * Handle an inbound text from a lead with no appointment.
 *
 * Returns false when the message was not ours to handle — no matching lead, the
 * tables are unavailable, an already-seen message, or anything thrown. The
 * caller carries on exactly as it did before this existed.
 */
export async function handleLeadReply(
  store: LeadInboundStore,
  params: { messageSid: string; from: string; body: string },
  env: NodeJS.ProcessEnv = process.env
): Promise<boolean> {
  try {
    if (!store.lead?.findMany || !store.leadConversation || !store.leadConversationMessage) {
      return false;
    }
    const key = phoneKey(params.from);
    if (!key) return false;

    // Twilio retries a webhook it believes failed. Without this a retry drafts
    // a second reply to the same message.
    const seen = await store.leadConversationMessage
      .findUnique({ where: { messageSid: params.messageSid } })
      .catch(() => null);
    if (seen) return false;

    // Phone formats are reconciled in JS because a lead's number is whatever
    // the ad form or a rep typed. Only leads with NO appointment: a booked
    // lead's reply belongs to the appointment path, which already alerts the
    // assigned rep whatever the message says.
    const candidates = await store.lead
      .findMany({
        where: { deletedAt: null, appointmentId: null, phone: { not: '' } },
        select: {
          id: true, name: true, phone: true, appointmentId: true,
          schedulingArea: true, programKey: true, city: true,
          resolvedMunicipality: true, latitude: true, longitude: true,
        },
      })
      .catch(() => [] as LeadRow[]);
    const lead = candidates.find((l) => phoneKey(String(l.phone ?? '')) === key);
    if (!lead) return false;

    // A conversation is created on first REPLY rather than when the opener is
    // sent, so a lead who never answers leaves no row to reason about.
    let row = await store.leadConversation
      .findUnique({ where: { leadId: lead.id } })
      .catch(() => null);
    if (!row) {
      row = await store.leadConversation.create({
        data: { leadId: lead.id, phase: 'opened', phoneKey: key, lastOutbound: '' },
      });
    }

    const conversation: ConversationState = {
      id: row.id,
      leadId: row.leadId,
      phase: toPhase(row.phase),
      offeredSlots: toSlots(row.offeredSlotsJson),
      lastOutbound: row.lastOutbound ?? '',
    };

    const deps: RunnerDeps = {
      listOpenSlots: async () => {
        const payload = await availableSlotsForLead(store as never, lead);
        // Spread across days: computeAvailability is chronological, so the
        // first two are usually the same morning — and offering "Tue 10am or
        // Tue 12pm" to someone who said Tuesday does not work wastes both.
        return spreadAcrossDays(payload.slots ?? [], SLOTS_TO_OFFER) as OfferedSlot[];
      },
      recordMessage: async (m) => {
        await store.leadConversationMessage!.create({
          data: {
            conversationId: m.conversationId,
            direction: m.direction,
            body: m.body,
            state: m.state,
            templateId: m.templateId ?? '',
            intent: m.intent ?? '',
            confident: m.confident ?? false,
            escalationReason: m.escalationReason ?? '',
            messageSid: m.messageSid ?? null,
          },
        });
      },
      updateConversation: async (id, patch) => {
        await store.leadConversation!.update({
          where: { id },
          data: {
            ...(patch.phase ? { phase: patch.phase } : {}),
            ...(patch.offeredSlots ? { offeredSlotsJson: patch.offeredSlots } : {}),
            ...(patch.needsHumanReason !== undefined
              ? { needsHumanReason: patch.needsHumanReason }
              : {}),
          },
        });
      },
    };

    await runInboundReply(
      conversation,
      { messageSid: params.messageSid, body: params.body, leadName: lead.name ?? '' },
      deps,
      env
    );
    return true;
  } catch (err) {
    // The reply is already in SmsReply. Failing loudly here would make Twilio
    // retry the whole webhook, which re-runs the forward to the downstream
    // handler — a far worse outcome than a draft that did not get written.
    console.error('[lead-inbound] could not run the conversation:', err);
    return false;
  }
}
