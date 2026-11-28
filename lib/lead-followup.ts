// ─── The call follow-up (November 2026) ──────────────────────────────────────
// The link text is the first text again (it booked 37% of Meta leads within
// three days, against 13% for the call opener). This adds ONE thing on top of
// it: leads who neither book nor reply get a second text two hours later
// asking for a quick call instead.
//
//   Text 1 (unchanged): "Hi Sarah, this is Michael from OntarioReno about your
//     basement. To get started, book your free in-home consultation here: <link>"
//   Text 2 (this file): "Hi Sarah, Michael again. If a quick call is easier
//     than the form, what time works today or tomorrow?"
//
// Text 2 is queued at intake and decided at SEND time: the drain asks
// followUpSkipReason() first, so a lead who booked through the form, replied,
// or was picked up by a rep in the meantime never gets it. Anything the check
// cannot confirm is treated as "do not send": a missed follow-up costs one
// lead a nudge, a wrong one texts somebody who already booked.
//
// Once it sends, the thread is opened in CALL mode so a reply with a time is
// booked as a callback exactly like the call opener's replies (see
// lib/lead-conversation-runner.ts).

import { torontoInstant, type PlannedNotification } from './notifications.js';
import { torontoWallClock } from './scheduling.js';
import { phoneKey } from './sms-replies.js';

export const FOLLOWUP_KIND = 'lead_followup';

/** How long after the first text the follow-up waits. */
export const FOLLOWUP_DELAY_MS = 2 * 60 * 60_000;

/** Call hours: the follow-up only lands between 10am and 8pm, Ontario time. */
const SEND_FROM_MINUTE = 10 * 60;
const SEND_UNTIL_MINUTE = 20 * 60;

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Ontario wall clock ("YYYY-MM-DDTHH:MM") the follow-up goes out at: two hours
 * after `now`, moved to 10am when that falls outside call hours (the same
 * morning when it is early, the next morning when it is late).
 */
export function followUpSendWall(now: Date): string {
  const wall = torontoWallClock(new Date(now.getTime() + FOLLOWUP_DELAY_MS)).slice(0, 16);
  const date = wall.slice(0, 10);
  const [h, m] = wall.slice(11, 16).split(':').map(Number);
  const minute = h * 60 + m;
  if (minute < SEND_FROM_MINUTE) return `${date}T10:00`;
  if (minute >= SEND_UNTIL_MINUTE) return `${addDays(date, 1)}T10:00`;
  return wall;
}

export type LeadFollowUpContext = {
  leadId: string;
  name: string;
  phone: string;
  /** Who signs. Must match text 1, so the thread never switches names. */
  senderName: string;
};

export function smsLeadFollowUp(c: { name: string; senderName: string }): string {
  const name = c.name.trim().split(/\s+/)[0] ?? '';
  const sender = c.senderName.trim() || 'Michael';
  const greeting = name ? `Hi ${name}, ` : 'Hi, ';
  return `${greeting}${sender} again. If a quick call is easier than the form, what time works today or tomorrow?`;
}

/**
 * The follow-up row. Expires at 8pm on its send day, so a missed drain can
 * never text someone late in the evening or a day later.
 */
export function planLeadFollowUp(c: LeadFollowUpContext, now: Date = new Date()): PlannedNotification[] {
  if (!c.phone.trim()) return [];
  const wall = followUpSendWall(now);
  const date = wall.slice(0, 10);
  return [
    {
      channel: 'sms',
      kind: FOLLOWUP_KIND,
      recipient: c.phone,
      subject: '',
      body: smsLeadFollowUp(c),
      sendAfter: torontoInstant(date, wall.slice(11, 16)).toISOString(),
      expiresAt: torontoInstant(date, '20:00').toISOString(),
      idempotencyKey: `${c.leadId}:sms:${FOLLOWUP_KIND}`,
    },
  ];
}

/** Loose on purpose: the drain passes the real Prisma client. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Store = any;

/**
 * Why the follow-up must NOT go out, or null when the lead is still silent.
 *
 * Silent means all of: the lead still exists and is untouched (status 'new',
 * no appointment), it has no text thread (one is created on their first
 * reply), no text has come from their number since they arrived, and no
 * appointment has been booked on their number since they arrived (booking
 * through the form creates a separate consultation lead, so it is matched by
 * phone, not by lead id).
 */
export async function followUpSkipReason(
  store: Store,
  row: { leadId?: string | null; recipient: string }
): Promise<string | null> {
  try {
    if (!row.leadId || !store?.lead?.findUnique) return 'followup_check_unavailable';
    const lead = await store.lead.findUnique({
      where: { id: row.leadId },
      select: { id: true, phone: true, status: true, appointmentId: true, deletedAt: true, createdAt: true },
    });
    if (!lead || lead.deletedAt) return 'lead_gone';
    if (lead.appointmentId || lead.status !== 'new') return 'lead_already_worked';

    const thread = await store.leadConversation.findUnique({ where: { leadId: lead.id }, select: { id: true } });
    if (thread) return 'lead_replied';

    const key = phoneKey(String(lead.phone || row.recipient || ''));
    if (!key) return 'followup_check_unavailable';
    const since = new Date(lead.createdAt);

    const replies: Array<{ fromNumber: string }> = await store.smsReply.findMany({
      where: { createdAt: { gte: since } },
      select: { fromNumber: true },
    });
    if (replies.some((r) => phoneKey(String(r.fromNumber ?? '')) === key)) return 'lead_replied';

    const booked: Array<{ phone: string }> = await store.appointment.findMany({
      where: { createdAt: { gte: since } },
      select: { phone: true },
    });
    if (booked.some((a) => phoneKey(String(a.phone ?? '')) === key)) return 'lead_booked';

    return null;
  } catch (err) {
    console.error('[lead-followup] silence check failed, not sending:', err);
    return 'followup_check_failed';
  }
}

/**
 * After the follow-up has gone out: open the lead's thread in call mode, so a
 * reply naming a time is booked as a callback. Never replaces an existing
 * thread (a reply that raced the send already made one).
 */
export async function openFollowUpThread(
  store: Store,
  row: { leadId?: string | null; recipient: string; body: string },
  senderName: string
): Promise<void> {
  try {
    if (!row.leadId || !store?.leadConversation?.findUnique) return;
    const existing = await store.leadConversation.findUnique({ where: { leadId: row.leadId }, select: { id: true } });
    if (existing) return;
    await store.leadConversation.create({
      data: {
        leadId: row.leadId,
        phase: 'awaiting_time_choice',
        mode: 'call',
        sender: senderName,
        offeredSlotsJson: [],
        lastOutbound: row.body,
        phoneKey: phoneKey(row.recipient),
      },
    });
  } catch (err) {
    console.error('[lead-followup] could not open the call thread:', err);
  }
}

/** The name text 2 signed itself with, read back from its own wording. */
export function followUpSender(body: string): string {
  return body.match(/^Hi(?: [^,]*)?, (\S+) again\./)?.[1] ?? '';
}
