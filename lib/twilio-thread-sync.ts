// ─── Pulling back texts that were sent from somewhere other than the portal ──
//
// The portal's Conversations thread only ever contained messages that went
// through `conversation_send`. A reply typed into the standalone Twilio
// dashboard therefore left no row at all — the thread looked like we had said
// nothing, and `lastOutbound` still held the message BEFORE it. That field is
// what the classifier is given as the referent for the homeowner's next reply,
// so a hand-sent message did not just go missing from the display: it made the
// next inbound be read against the wrong question.
//
// This reconciles the thread against Twilio's own log. It is a REPAIR, not a
// second send path — nothing here texts anybody.
//
// What it deliberately does NOT do:
//   - move the phase. A hand-sent text is a person taking the thread over, and
//     inferring "we must be awaiting_time_choice now" from words we did not
//     template is exactly the guess the whole design refuses to make.
//   - draft a reply. Rows arrive already-settled ('sent' / 'received'); a
//     synced inbound is one the webhook missed, and it needs a person's eyes,
//     not a classification made minutes late against stale state.

import { toE164 } from './notifications.js';

/** One message as Twilio's REST API reports it. */
type TwilioMessage = {
  sid?: string;
  body?: string;
  direction?: string;
  date_sent?: string;
  date_created?: string;
};

export type SyncableMessage = {
  messageSid: string;
  direction: 'in' | 'out';
  body: string;
  sentAt: Date;
};

/**
 * Every message between our number and one lead, newest last.
 *
 * Two calls rather than one: Twilio filters on an exact To/From pair, and
 * there is no "either direction" query. Both are read-only GETs and Twilio
 * does not bill for them.
 */
export async function fetchThread(
  leadPhone: string,
  env = process.env,
  limit = 50
): Promise<SyncableMessage[]> {
  const accountSid = env.TWILIO_ACCOUNT_SID;
  const authToken = env.TWILIO_AUTH_TOKEN;
  const ourNumber = env.TWILIO_FROM_NUMBER;
  if (!accountSid || !authToken || !ourNumber) return [];

  const lead = toE164(leadPhone);
  if (!lead) return [];

  const auth = `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`;
  const base = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`;

  const read = async (params: Record<string, string>): Promise<TwilioMessage[]> => {
    try {
      const url = `${base}?${new URLSearchParams({ ...params, PageSize: String(limit) })}`;
      const r = await fetch(url, { headers: { Authorization: auth } });
      if (!r.ok) return [];
      const payload = (await r.json().catch(() => ({}))) as { messages?: TwilioMessage[] };
      return payload.messages ?? [];
    } catch {
      // A sync that cannot reach Twilio must leave the thread exactly as it
      // was. The portal's own rows are still correct, just incomplete.
      return [];
    }
  };

  const [outbound, inbound] = await Promise.all([
    read({ From: ourNumber, To: lead }),
    read({ From: lead, To: ourNumber }),
  ]);

  const rows: SyncableMessage[] = [];
  for (const m of [...outbound, ...inbound]) {
    if (!m.sid) continue;
    const stamp = m.date_sent || m.date_created;
    const sentAt = stamp ? new Date(stamp) : null;
    if (!sentAt || !Number.isFinite(sentAt.getTime())) continue;
    rows.push({
      messageSid: m.sid,
      // Twilio calls anything it sent for us 'outbound-api' / 'outbound-reply'
      // and anything it received 'inbound'.
      direction: String(m.direction ?? '').startsWith('outbound') ? 'out' : 'in',
      body: m.body ?? '',
      sentAt,
    });
  }
  return rows.sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime());
}

/**
 * Which of Twilio's messages this thread has never seen.
 *
 * Matching is by SID for anything we recorded one for, and by exact body for
 * the rest — outbound rows written by `conversation_send` carry no SID, so
 * without the body check every message the portal itself sent would be
 * re-imported as a duplicate on the first sync.
 */
export function missingFromThread(
  remote: SyncableMessage[],
  local: Array<{ messageSid?: string | null; body?: string; direction?: string }>
): SyncableMessage[] {
  const seenSids = new Set(local.map((m) => m.messageSid).filter(Boolean) as string[]);
  const seenBodies = new Set(
    local.map((m) => `${m.direction ?? ''}:${(m.body ?? '').trim()}`).filter((k) => !k.endsWith(':'))
  );
  return remote.filter(
    (m) =>
      !seenSids.has(m.messageSid) &&
      !seenBodies.has(`${m.direction}:${m.body.trim()}`)
  );
}
