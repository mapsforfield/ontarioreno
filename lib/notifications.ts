// ─── Booking notifications ────────────────────────────────────────────────────
// Planning is pure and testable; delivery is a separate, injectable step.
//
// Rows are written in the SAME transaction as the appointment, so a provider
// outage can never lose a booking and a retry can never double-book. Reminders
// are scheduled at booking time rather than discovered by scanning appointments,
// which makes "what will this homeowner receive, and when" answerable from one
// table.

// The public flow calls the portal's OWN email composer rather than assembling
// the same template itself. Reconstructing the inputs by hand meant a public
// booking quietly lost the Provider row, the customer notes and the action
// buttons — matching a template is not the same as matching an email.
// These modules are pure string builders: no fetch, no env vars, no DOM.
import { generateConsultationEmailPreview } from '../src/portal/data/consultationEmails.js';
import type { Appointment, User } from '../src/portal/data/types.js';

export type NotificationChannel = 'sms' | 'email';

export type NotificationKind =
  | 'booking_confirmation'
  | 'reminder_24h'
  | 'reminder_day_of'
  | 'team_alert'
  | 'nurture_guide';

export type PlannedNotification = {
  channel: NotificationChannel;
  kind: NotificationKind;
  recipient: string;
  subject: string;
  body: string;
  /** Branded HTML for customer email; empty means send plain text only. */
  html?: string;
  /** ISO instant; the drain only picks up rows whose time has passed. */
  sendAfter: string;
  /**
   * Point after which this message is no longer true and must not be sent.
   *
   * Reminders are the only messages that expire, and they expire because their
   * wording is relative: a "tomorrow" reminder delivered on the day of the
   * visit is actively misleading. Empty means the message stays valid however
   * late it goes out — a confirmation is still worth sending.
   */
  expiresAt: string;
  idempotencyKey: string;
};

export type BookingContext = {
  appointmentId: string;
  publicReference: string;
  name: string;
  phone: string;
  email: string;
  propertyAddress: string;
  /** Ontario wall clock. */
  date: string;
  time: string;
  visitMinutes: number;
  consultationMode: 'in_person' | 'phone';
  /** Business inbox. Always alerted. */
  teamInbox: string;
  /** Assigned rep's address, alerted alongside the business inbox. */
  repEmail?: string;
  repName?: string;
  /** Answers, for the team alert — the homeowner's specific choice. */
  fundingPlan: string;
  projectScope: string;
  /**
   * Customer-facing project label ("ADU Grant Consultation"), matching what the
   * appointment records. Distinct from projectScope, which is the homeowner's
   * specific selection and is only useful internally.
   */
  projectTypeLabel?: string;
  /** Customer Notes template, shown in the email's "Your Notes" block. */
  customerNotes?: string;
};

// ─── Formatting ───────────────────────────────────────────────────────────────

export function friendlyDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-CA', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
}

export function friendlyTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

/** Ontario wall clock → UTC instant, DST-correct (mirrors calendar-links). */
export function torontoInstant(date: string, time: string): Date {
  const [y, mo, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  const wallAsIfUtc = Date.UTC(y, mo - 1, d, hh, mm);
  let guess = wallAsIfUtc;
  for (let i = 0; i < 2; i++) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Toronto',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(new Date(guess));
    const g = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
    const hour = g('hour') === 24 ? 0 : g('hour');
    guess = wallAsIfUtc - (Date.UTC(g('year'), g('month') - 1, g('day'), hour, g('minute')) - guess);
  }
  return new Date(guess);
}

// ─── Message copy ─────────────────────────────────────────────────────────────

export function smsBookingConfirmation(c: BookingContext): string {
  return `Hi ${c.name}, your OntarioReno site visit for ${c.propertyAddress} is confirmed for ${friendlyDate(c.date)} at ${friendlyTime(c.time)}. Need to reschedule? Reply to this text.`;
}

export function smsReminder24h(c: BookingContext): string {
  return `Reminder: Your OntarioReno site visit for ${c.propertyAddress} is scheduled for tomorrow (${friendlyDate(c.date)}) at ${friendlyTime(c.time)}. Please reply 'C' to confirm or reply 'R' if you need to reschedule.`;
}

export function smsReminderDayOf(c: BookingContext): string {
  return `Hi ${c.name}, our specialist is looking forward to visiting ${c.propertyAddress} today at ${friendlyTime(c.time)} for your ADU assessment. See you soon!`;
}

/**
 * The exact email the portal sends, generated by the portal's own composer.
 *
 * A public booking is just an appointment, so it gets the same message a rep
 * would send from the Emails tab — same layout, Provider row, customer notes and
 * action buttons — rather than a lookalike that drifts every time one side
 * changes.
 */
export function buildPortalConfirmation(c: BookingContext): { subject: string; body: string; html: string } {
  const appointment = {
    id: c.appointmentId,
    customerName: c.name,
    phone: c.phone,
    email: c.email,
    address: c.propertyAddress,
    city: '',
    appointmentDate: c.date,
    appointmentTime: c.time,
    appointmentType: c.consultationMode === 'phone' ? 'phone_consultation' : 'home_visit',
    // The readable label, not the raw form value — must match the appointment.
    projectType: c.projectTypeLabel || c.projectScope,
    customerNotes: c.customerNotes ?? '',
    internalNotes: '',
    title: null,
  } as unknown as Appointment;

  const rep = c.repName ? ({ name: c.repName, email: c.repEmail ?? '' } as User) : undefined;

  const preview = generateConsultationEmailPreview('booking_confirmation', {
    appointment,
    rep,
    // No contractor is assigned at booking time, exactly as when a rep books
    // from the portal — the template's own fallback wording applies.
    contractor: undefined,
  });

  return { subject: preview.subject, body: preview.body, html: preview.html };
}

export function emailBookingConfirmation(c: BookingContext): { subject: string; body: string } {
  const meeting = c.consultationMode === 'phone'
    ? `Initial Consultation Call · ${c.visitMinutes} minutes`
    : `In-Person Site Visit · ${c.visitMinutes} minutes`;
  return {
    subject: `Your OntarioReno site visit — ${friendlyDate(c.date)} at ${friendlyTime(c.time)}`,
    body: [
      `Hi ${c.name},`,
      '',
      'Your consultation is confirmed.',
      '',
      `When:      ${friendlyDate(c.date)} at ${friendlyTime(c.time)}`,
      `What:      ${meeting}`,
      `Where:     ${c.propertyAddress}`,
      `Reference: ${c.publicReference}`,
      '',
      'What happens next',
      '  1. Confirmation sent — this email.',
      '  2. Zoning review — we run a preliminary property assessment before we arrive.',
      `  3. Site visit — a specialist arrives at ${c.propertyAddress} at the scheduled time.`,
      '',
      'Need to change anything? Just reply to this email.',
      '',
      'OntarioReno',
    ].join('\n'),
  };
}

export function emailTeamAlert(c: BookingContext): { subject: string; body: string } {
  return {
    subject: `New site visit booked — ${c.name}, ${friendlyDate(c.date)} ${friendlyTime(c.time)}`,
    body: [
      'A homeowner booked a site visit through the public consultation flow.',
      '',
      `Name:           ${c.name}`,
      `Phone:          ${c.phone || 'Not provided'}`,
      `Email:          ${c.email || 'Not provided'}`,
      `Property:       ${c.propertyAddress}`,
      `Project scope:  ${c.projectScope || 'Not provided'}`,
      `Funding plan:   ${c.fundingPlan || 'Not provided'}`,
      `Booked slot:    ${friendlyDate(c.date)} at ${friendlyTime(c.time)}`,
      `Assigned to:    ${c.repName || c.repEmail || 'Unassigned'}`,
      `Reference:      ${c.publicReference}`,
      `Appointment ID: ${c.appointmentId}`,
    ].join('\n'),
  };
}

// ─── Scheduling ───────────────────────────────────────────────────────────────

/**
 * Day-of reminder time: 08:00 Ontario on the appointment date, or two hours
 * before the slot when that is earlier. With the current 10:00 earliest start
 * these coincide; the rule is written generally so an earlier slot cannot ship
 * a reminder after the visit has begun.
 */
export function dayOfReminderAt(date: string, time: string): Date {
  const eightAm = torontoInstant(date, '08:00');
  const twoHoursBefore = new Date(torontoInstant(date, time).getTime() - 2 * 60 * 60_000);
  return twoHoursBefore < eightAm ? twoHoursBefore : eightAm;
}

/** Everything a confirmed booking should send, with its schedule. */
export function planBookingNotifications(c: BookingContext): PlannedNotification[] {
  const now = new Date().toISOString();
  const start = torontoInstant(c.date, c.time);
  const confirmation = buildPortalConfirmation(c);
  const team = emailTeamAlert(c);
  const planned: PlannedNotification[] = [];

  if (c.email) {
    planned.push({
      channel: 'email', kind: 'booking_confirmation', recipient: c.email,
      // Subject keeps the brand and the date — more useful in an inbox than the
      // portal's generic one, and it is the only part that differs.
      subject: emailBookingConfirmation(c).subject,
      body: confirmation.body,
      html: confirmation.html,
      sendAfter: now, expiresAt: '',
      idempotencyKey: `${c.appointmentId}:email:booking_confirmation`,
    });
  }
  if (c.phone) {
    planned.push({
      channel: 'sms', kind: 'booking_confirmation', recipient: c.phone,
      subject: '', body: smsBookingConfirmation(c), sendAfter: now, expiresAt: '',
      idempotencyKey: `${c.appointmentId}:sms:booking_confirmation`,
    });

    const reminderAt = new Date(start.getTime() - 24 * 60 * 60_000);
    // A booking made inside 24 hours has already missed this window; the day-of
    // reminder still covers it, so scheduling it in the past would only send a
    // "tomorrow" message about today.
    if (reminderAt.getTime() > Date.now()) {
      planned.push({
        channel: 'sms', kind: 'reminder_24h', recipient: c.phone,
        subject: '', body: smsReminder24h(c), sendAfter: reminderAt.toISOString(),
        // This message says "tomorrow". Once the appointment day has begun it
        // is a lie, and the day-of reminder covers the same visit anyway.
        expiresAt: torontoInstant(c.date, '00:00').toISOString(),
        idempotencyKey: `${c.appointmentId}:sms:reminder_24h`,
      });
    }

    const dayOf = dayOfReminderAt(c.date, c.time);
    if (dayOf.getTime() > Date.now()) {
      planned.push({
        channel: 'sms', kind: 'reminder_day_of', recipient: c.phone,
        subject: '', body: smsReminderDayOf(c), sendAfter: dayOf.toISOString(),
        // A reminder that arrives after the rep is on the doorstep is noise.
        expiresAt: start.toISOString(),
        idempotencyKey: `${c.appointmentId}:sms:reminder_day_of`,
      });
    }
  }

  // The business inbox always hears about a booking; the assigned rep gets the
  // same alert so they aren't relying on someone forwarding it. Separate rows
  // rather than a CC, so one bouncing address can't suppress the other.
  const alerted = [c.teamInbox, c.repEmail].filter(
    (address, index, all): address is string =>
      Boolean(address) && all.indexOf(address) === index
  );
  for (const recipient of alerted) {
    planned.push({
      channel: 'email', kind: 'team_alert', recipient,
      subject: team.subject, body: team.body, sendAfter: now, expiresAt: '',
      idempotencyKey: `${c.appointmentId}:email:team_alert:${recipient}`,
    });
  }

  return planned;
}

// ─── Delivery ─────────────────────────────────────────────────────────────────

export type DeliveryOutcome = {
  state: 'sent' | 'failed' | 'suppressed' | 'blocked';
  reason: string;
};

/**
 * SMS has no configured provider in this repository.
 *
 * OntarioReno already runs Twilio through Google Apps Script outside this repo.
 * Standing instruction: do not stand up a competing sender before that setup —
 * sender number, consent records, opt-out list, webhook — has been inspected.
 * Two systems texting the same people from different numbers, with different
 * suppression lists, is worse than one system that waits. So the message is
 * composed, scheduled and recorded here, and parked as `blocked` until an adapter
 * is wired to the existing account.
 */
export function smsProviderConfigured(env = process.env): boolean {
  return Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_FROM_NUMBER);
}

export async function deliverEmail(
  to: string,
  subject: string,
  body: string,
  env = process.env,
  html?: string
): Promise<DeliveryOutcome> {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) return { state: 'blocked', reason: 'no_email_provider' };
  try {
    const { Resend } = await import('resend');
    const { error } = await new Resend(apiKey).emails.send({
      from: env.EMAIL_FROM ?? 'OntarioReno <info@ontarioreno.ca>',
      to,
      subject,
      // Plain text always accompanies the HTML, so clients that block or can't
      // render it still show a usable message.
      text: body,
      ...(html ? { html } : {}),
    });
    if (error) return { state: 'failed', reason: error.message ?? 'send_failed' };
    return { state: 'sent', reason: '' };
  } catch (err) {
    return { state: 'failed', reason: err instanceof Error ? err.message : String(err) };
  }
}
