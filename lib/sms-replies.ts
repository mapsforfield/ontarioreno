// ─── Inbound SMS replies ──────────────────────────────────────────────────────
// The reminder text asks the homeowner to "reply 'C' to confirm or 'R' to
// reschedule" (lib/notifications.ts). For a long time nothing read those
// answers: they arrived in Twilio and stopped there, so a rep could drive to a
// visit the homeowner had already tried to move.
//
// This module is the pure half — classification, matching and message copy. It
// has no fetch, no Prisma and no env, so every rule below is unit-testable and
// the webhook in api/appointments stays thin routing.

import { createHmac, timingSafeEqual } from 'node:crypto';

/** What the homeowner told us. `unknown` is recorded but acted on by nobody. */
export type ReplyIntent = 'confirm' | 'reschedule' | 'unknown';

/**
 * Tokens accepted as an answer, matched against the WHOLE message only.
 *
 * Precision over reach, for the same reason grant closure is (lib/grant-
 * closure.ts): a false 'reschedule' emails a rep to unpick a booking nobody
 * asked to move, and a false 'confirm' tells that rep a no-show is locked in.
 * "Can you come earlier?" contains a c and an r and must match neither — so
 * substring matching is deliberately not used anywhere here.
 */
const CONFIRM_WORDS = new Set([
  'c', 'confirm', 'confirmed', 'confirms', 'confirming', 'confirm please',
  'yes', 'y', 'yes please', 'yep', 'yup', 'ok', 'okay', 'k',
  'sounds good', 'see you then', 'still good',
]);

const RESCHEDULE_WORDS = new Set([
  'r', 'reschedule', 'resched', 'rescheduled', 'rescheduling',
  'reschedule please', 'need to reschedule', 'please reschedule',
]);

/**
 * Strip the decoration people put around a one-letter answer — "C.", "*R*",
 * "C 👍" — without touching the words themselves. Keeps internal spaces so the
 * multi-word phrases above still match.
 */
export function normalizeReply(raw: string): string {
  return (raw ?? '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function classifyReply(raw: string): ReplyIntent {
  const text = normalizeReply(raw);
  if (!text) return 'unknown';
  if (CONFIRM_WORDS.has(text)) return 'confirm';
  if (RESCHEDULE_WORDS.has(text)) return 'reschedule';
  return 'unknown';
}

// ─── Matching a reply to an appointment ───────────────────────────────────────

/** The only fields matching needs. Keeps this callable from tests with plain objects. */
export type ReplyCandidate = {
  id: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  deletedAt?: Date | string | null;
};

/** Statuses that can still be confirmed or moved. */
const LIVE_STATUSES = new Set(['scheduled', 'confirmed', 'rescheduled']);

/**
 * Which appointment is this homeowner answering about?
 *
 * The soonest still-live appointment at or after `now` — that is the one the
 * reminder was about. A homeowner with a visit tomorrow and a follow-up next
 * month is answering about tomorrow.
 *
 * Returns null rather than guessing when nothing upcoming is live. An answer
 * with no live appointment behind it is still recorded (see SmsReply) so it
 * stays visible, but it must never reach in and change a completed or
 * cancelled row.
 */
export function matchReplyToAppointment(
  candidates: ReplyCandidate[],
  nowLocal: string
): ReplyCandidate | null {
  const stamp = (a: ReplyCandidate) => `${a.appointmentDate}T${a.appointmentTime || '00:00'}`;
  const live = candidates
    .filter((a) => !a.deletedAt && LIVE_STATUSES.has(a.status))
    .filter((a) => stamp(a) >= nowLocal)
    .sort((a, b) => stamp(a).localeCompare(stamp(b)));
  return live[0] ?? null;
}

/**
 * Last ten digits, which is what a North American number is actually identified
 * by. Twilio hands us "+14379997504" while the portal stores whatever the rep
 * typed — "(437) 999-7504", "437-999-7504", "1 437 999 7504". Comparing the
 * raw strings matched almost nothing.
 */
export function phoneKey(raw: string): string {
  const digits = (raw ?? '').replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

// ─── Copy ─────────────────────────────────────────────────────────────────────

export type ReplyNotificationContext = {
  intent: Exclude<ReplyIntent, 'unknown'>;
  repName: string;
  customerName: string;
  customerPhone: string;
  /** Ontario wall clock. */
  date: string;
  time: string;
  address: string;
  /** Exactly what the homeowner sent, never a paraphrase. */
  rawBody: string;
};

function friendlyDate(d: string): string {
  if (!d) return 'TBD';
  try {
    return new Date(`${d}T12:00:00`).toLocaleDateString('en-CA', {
      weekday: 'long', month: 'long', day: 'numeric',
    });
  } catch { return d; }
}

function friendlyTime(t: string): string {
  if (!t) return 'TBD';
  const [h, m] = t.split(':').map(Number);
  if (Number.isNaN(h)) return t;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return m === 0 ? `${hour} ${suffix}` : `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function replyAlertSubject(c: ReplyNotificationContext): string {
  const when = `${friendlyDate(c.date)} ${friendlyTime(c.time)}`;
  return c.intent === 'confirm'
    ? `Confirmed by text: ${c.customerName} — ${when}`
    : `Reschedule requested by text: ${c.customerName} — ${when}`;
}

export function replyAlertBody(c: ReplyNotificationContext): string {
  const when = `${friendlyDate(c.date)} at ${friendlyTime(c.time)}`;
  const head =
    c.intent === 'confirm'
      ? `${c.customerName} replied to the reminder and confirmed.`
      : `${c.customerName} replied to the reminder asking to reschedule. The appointment has NOT been moved or cancelled — the slot is still held for you.`;
  return [
    `Hi ${c.repName || 'there'},`,
    '',
    head,
    '',
    `Appointment: ${when}`,
    `Address: ${c.address || 'No address on file'}`,
    `Phone: ${c.customerPhone}`,
    `They texted: "${c.rawBody.trim()}"`,
    '',
    c.intent === 'confirm'
      ? 'Nothing to do — this is just so you know before you drive.'
      : 'Call them to agree a new time, then move the appointment in the portal.',
  ].join('\n');
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (ch) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch] ?? ch
  );
}

export function replyAlertHtml(c: ReplyNotificationContext): string {
  const accent = c.intent === 'confirm' ? '#047857' : '#b45309';
  const banner = c.intent === 'confirm' ? 'Confirmed by text' : 'Reschedule requested';
  const lead =
    c.intent === 'confirm'
      ? `${c.customerName} confirmed by text.`
      : `${c.customerName} asked to reschedule. The appointment has not been moved or cancelled — the slot is still held.`;
  const rows: Array<[string, string]> = [
    ['Customer', c.customerName],
    ['When', `${friendlyDate(c.date)} at ${friendlyTime(c.time)}`],
    ['Address', c.address || 'No address on file'],
    ['Phone', c.customerPhone],
    ['They texted', `"${c.rawBody.trim()}"`],
  ];
  const cells = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 0;color:#64748b;width:34%;">${k}</td>` +
        `<td style="padding:6px 0;font-weight:600;">${escapeHtml(v)}</td></tr>`
    )
    .join('');
  const footer =
    c.intent === 'confirm'
      ? 'Nothing to do — this is just so you know before you drive.'
      : 'Call them to agree a new time, then move the appointment in the portal.';

  return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;background:#f0f4f8;padding:32px 12px;">` +
    `<div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;">` +
    `<div style="background:${accent};color:#ffffff;padding:16px 20px;font-weight:800;font-size:15px;">${banner}</div>` +
    `<div style="padding:20px;color:#1e293b;font-size:14px;line-height:1.6;">` +
    `<p style="margin:0 0 16px;">${escapeHtml(lead)}</p>` +
    `<table style="width:100%;border-collapse:collapse;">${cells}</table>` +
    `<p style="margin:18px 0 0;color:#475569;">${footer}</p>` +
    `</div></div></body></html>`;
}

/**
 * The text back to a homeowner who asked to reschedule.
 *
 * Deliberately promises a call and nothing else: the slot is still held, and
 * telling them it is gone before a rep has spoken to them is how a booking
 * turns into a lost lead. No new time is ever offered by machine.
 */
export function rescheduleAckSms(c: { customerName: string; repName: string }): string {
  const who = c.repName || 'Your specialist';
  const greeting = c.customerName ? `Thanks ${c.customerName}` : 'Thanks';
  return `${greeting} — no problem. ${who} from OntarioReno will call you shortly to find a new time. Your current appointment is still held until you speak.`;
}

// ─── Twilio request authenticity ──────────────────────────────────────────────

/**
 * Verify Twilio's X-Twilio-Signature over the exact request.
 *
 * The webhook URL is public and it writes to appointments, so an unsigned POST
 * from anyone could mark a live visit as "reschedule requested" and text a real
 * homeowner. The scheme is Twilio's: HMAC-SHA1 over the full URL followed by
 * every POST parameter, sorted by key, concatenated as key+value.
 */
export function verifyTwilioSignature(
  url: string,
  params: Record<string, string>,
  authToken: string,
  signature: string
): boolean {
  if (!authToken || !signature) return false;
  const payload =
    url +
    Object.keys(params)
      .sort()
      .map((k) => k + params[k])
      .join('');
  const expected = createHmac('sha1', authToken)
    .update(Buffer.from(payload, 'utf-8'))
    .digest('base64');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

// ─── Chaining the existing Apps Script handler ────────────────────────────────

/**
 * Should we hand Twilio the downstream handler's answer instead of our own?
 *
 * A Twilio number has exactly ONE "a message comes in" webhook, and this one
 * was already taken: OntarioReno's Google Apps Script has always answered it,
 * and that script is what sends a brand-new lead their first text. Taking the
 * slot outright would have deleted that feature silently.
 *
 * So we sit in front and pass every request through. If the script answers with
 * TwiML — which is how a handler tells Twilio to send a message — that answer is
 * Twilio's instruction to text the lead, and discarding it in favour of our own
 * empty response would break first contact just as thoroughly as overwriting
 * the URL would have. Relay it verbatim.
 *
 * Anything that is not TwiML (an Apps Script error page, an HTML redirect, an
 * empty 200 from a script that uses the REST API instead) is NOT relayed:
 * Twilio rejects a non-TwiML body, and turning the script's bad day into a
 * failed webhook would lose OUR reply handling too.
 */
export function shouldRelayDownstream(
  status: number,
  body: string
): boolean {
  if (status < 200 || status >= 300) return false;
  const trimmed = (body ?? '').trim();
  if (!trimmed) return false;
  // TwiML is always a <Response> document, optionally behind an XML prolog.
  return /^(<\?xml[^>]*\?>\s*)?<Response[\s>]/i.test(trimmed);
}
