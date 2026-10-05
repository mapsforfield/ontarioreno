// ─── Telling a person a text thread is waiting on them ────────────────────────
//
// Nothing in the conversation runner sends a text on its own: every decision it
// reaches is written down as a draft for a person to approve. That is the right
// default, and it has one failure mode — a draft nobody knows about is silence
// to the homeowner, exactly the silence the drafts were built to end. Replies
// were sitting for hours because the only way to find one was to open the
// Conversations page and look.
//
// So every inbound reply on an unbooked lead's thread announces itself by
// email. Deliberately NOT a summary, a digest, or anything on a schedule: the
// value is entirely in arriving within a minute of the homeowner texting, and a
// message that arrives with tomorrow's batch is one they have already given up
// on.
//
// This file only builds the words. Queueing and delivery are the caller's, so
// the wording can be tested without a database or a mail provider.

/** What we send SMS from is irrelevant here; this is internal mail only. */
export type ConversationAlertContext = {
  leadId: string;
  conversationId: string;
  /** Twilio's id for the inbound message. The dedupe key for the alert. */
  messageSid: string;
  /** Whatever we have. An unnamed lead is still worth being told about. */
  leadName: string;
  leadPhone: string;
  /** The homeowner's words, verbatim. Never our reading of them. */
  body: string;
  /** What the classifier made of it, and whether it was sure. */
  intent: string;
  confident: boolean;
  /**
   * What is now waiting on the reader.
   *  - 'draft'    a reply is written and needs approving
   *  - 'escalated' the automation stopped; the reply is theirs to write
   *  - 'closed'   they said no. Nothing to do, but worth knowing.
   */
  outcome: 'draft' | 'escalated' | 'closed';
  /** The drafted text, when there is one. */
  draftBody?: string;
  /** Why it stopped, when it did. */
  reason?: string;
};

const PORTAL_URL = 'https://ontarioreno.ca/portal/conversations';

/** Plain-language versions of the machine's words. Reps do not read enums. */
const REASON_LABEL: Record<string, string> = {
  NOT_CONFIDENT: 'not sure what they meant',
  INTENT_DOES_NOT_FIT_PHASE: "understood them, but it doesn't answer what we asked",
  NEEDS_A_PERSON: 'needs a person',
  ALREADY_WITH_A_HUMAN: 'you are already handling this thread',
  NO_SLOTS_AVAILABLE: 'nothing open to offer them',
};

const INTENT_LABEL: Record<string, string> = {
  prefers_weekdays: 'prefers weekdays',
  prefers_weekends: 'prefers weekends',
  picked_slot: 'picked one of the times',
  gave_address: 'gave their address',
  not_interested: 'not interested',
  unclear: 'unclear',
};

function displayName(c: ConversationAlertContext): string {
  return c.leadName.trim() || c.leadPhone.trim() || 'A lead';
}

/**
 * The subject line carries the whole message.
 *
 * It is read on a phone, on a lock screen, while doing something else — so the
 * homeowner's actual words go in it, truncated rather than summarised. "Reply
 * from a lead" tells the reader nothing they can act on without opening it,
 * and an alert you have to open to triage is an alert that waits.
 */
export function conversationAlertSubject(c: ConversationAlertContext): string {
  const said = c.body.trim().replace(/\s+/g, ' ');
  const short = said.length > 60 ? `${said.slice(0, 57)}…` : said;
  const lead = displayName(c);
  if (c.outcome === 'closed') return `${lead} is not interested — "${short}"`;
  return `${lead} texted: "${short}"`;
}

export function conversationAlertBody(c: ConversationAlertContext): string {
  const lines: string[] = [
    `${displayName(c)} · ${c.leadPhone}`,
    '',
    'They said:',
    `  "${c.body.trim()}"`,
    '',
  ];

  const read = INTENT_LABEL[c.intent] ?? c.intent ?? 'unclear';
  // The confidence is shown because it is the reader's cue to distrust the
  // line above it. A classification presented as fact, when the model itself
  // was unsure, is how a wrong reading becomes a wrong reply.
  lines.push(`Read as: ${read}${c.confident ? '' : ' (not confident)'}`, '');

  if (c.outcome === 'draft' && c.draftBody) {
    lines.push(
      'A reply is drafted and waiting for you to approve it:',
      `  "${c.draftBody.trim()}"`,
      '',
      'Nothing has been sent. It goes out when you approve it.',
      ''
    );
  } else if (c.outcome === 'escalated') {
    lines.push(
      `The automation stopped — ${REASON_LABEL[c.reason ?? ''] ?? 'it needs a person'}.`,
      'There is no draft; this one is yours to write.',
      ''
    );
  } else if (c.outcome === 'closed') {
    lines.push('The thread is closed and no follow-ups will go out.', '');
  }

  lines.push(`Open the thread: ${PORTAL_URL}`);
  return lines.join('\n');
}

/**
 * One outbox row per recipient rather than a CC.
 *
 * Same reason the booking alerts are split: info@ forwards through the web host
 * and that hop has taken anywhere from one to seventy-six minutes. A CC would
 * make the fast copy wait behind the slow one, which is the entire problem this
 * alert exists to solve.
 *
 * Keyed on the inbound message SID, so a Twilio webhook retry collapses into
 * the row already queued instead of mailing the same reply twice.
 */
export function planConversationAlert(
  c: ConversationAlertContext,
  recipients: string[],
  now: Date = new Date()
): Array<{
  leadId: string;
  channel: 'email';
  kind: string;
  recipient: string;
  subject: string;
  body: string;
  html: string;
  sendAfter: string;
  expiresAt: string;
  idempotencyKey: string;
}> {
  const at = now.toISOString();
  const subject = conversationAlertSubject(c);
  const body = conversationAlertBody(c);
  const unique = recipients
    .map((r) => r.trim())
    .filter((r, i, all) => r && all.indexOf(r) === i);

  return unique.map((recipient) => ({
    leadId: c.leadId,
    channel: 'email' as const,
    kind: 'conversation_alert',
    recipient,
    subject,
    body,
    html: '',
    sendAfter: at,
    // Never expires. Unlike a reminder, nothing in this message stops being
    // true because it arrived late — and a reply nobody saw is still a reply
    // worth answering.
    expiresAt: '',
    idempotencyKey: `${c.conversationId}:email:conversation_alert:${c.messageSid}:${recipient}`,
  }));
}
