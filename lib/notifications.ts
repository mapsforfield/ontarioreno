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
  | 'nurture_guide'
  // Fires on SUBMISSION, for every routing outcome. `team_alert` is keyed to an
  // appointment and so could only ever announce a booking — which meant every
  // manual-review, nurture and decline lead was captured silently.
  | 'lead_alert'
  // First contact with a lead that arrived from an external form (a Meta
  // instant form), where the homeowner gave us their details and never saw a
  // calendar. Sent to the HOMEOWNER, unlike lead_alert.
  | 'lead_welcome'
  // The address provider failed or ran out of budget, so leads are being sent
  // to manual review by our own degradation rather than by their addresses.
  | 'address_provider_alert';

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
  if (c.consultationMode === 'phone') {
    return `Hi ${c.name}, your OntarioReno consultation call about ${c.propertyAddress} is confirmed for ${friendlyDate(c.date)} at ${friendlyTime(c.time)}. A specialist will call you. Need to reschedule? Reply to this text.`;
  }
  return `Hi ${c.name}, your OntarioReno site visit for ${c.propertyAddress} is confirmed for ${friendlyDate(c.date)} at ${friendlyTime(c.time)}. Need to reschedule? Reply to this text.`;
}

/**
 * First contact for a lead that came from an external form.
 *
 * One job: get them onto the calendar while they still remember filling the
 * form in. So it confirms receipt in half a line and spends the rest of the
 * message on the link — no pitch, no price, nothing to reply to, because every
 * extra sentence is another reason to put the phone down.
 *
 * Deliberately says "no cost and no obligation" rather than "free quote": the
 * word free appears twice in the ad already, and the objection at this exact
 * moment is not price, it is whether booking commits them to anything.
 *
 * STOP is appended because this is an unsolicited first message to a consumer
 * mobile — CASL and Twilio's own rules both want the opt-out on the first
 * contact, not the third.
 */
export function smsLeadWelcome(c: LeadWelcomeContext): string {
  const name = c.name.trim().split(/\s+/)[0] ?? '';
  const opener = name ? `Hi ${name} — OntarioReno here` : 'Hi — OntarioReno here';
  return (
    `${opener} about your basement. ` +
    `You can book your free in-home quote whenever suits you: ${c.bookingUrl} ` +
    `Takes a minute. Reply STOP to opt out.`
  );
}

export function smsReminder24h(c: ReminderContext): string {
  if (c.consultationMode === 'phone') {
    return `Reminder: Your OntarioReno consultation call about ${c.propertyAddress} is scheduled for tomorrow (${friendlyDate(c.date)}) at ${friendlyTime(c.time)}. Please reply 'C' to confirm or reply 'R' if you need to reschedule.`;
  }
  return `Reminder: Your OntarioReno site visit for ${c.propertyAddress} is scheduled for tomorrow (${friendlyDate(c.date)}) at ${friendlyTime(c.time)}. Please reply 'C' to confirm or reply 'R' if you need to reschedule.`;
}

export function smsReminderDayOf(c: ReminderContext): string {
  // Never promise a doorstep for a call. This message goes to real prospects
  // on the morning of, and "looking forward to visiting" would have someone in
  // Windsor clearing their afternoon for a van.
  if (c.consultationMode === 'phone') {
    return `Hi ${c.name}, our specialist is looking forward to speaking with you today at ${friendlyTime(c.time)} about ${c.propertyAddress}. Talk soon!`;
  }
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
  // A remote consultation must never be described as a visit. The subject
  // line, the "Where", and step 3 all used to say a specialist was coming to
  // the property no matter the mode — which for a Windsor homeowner is someone
  // waiting in their kitchen for a van that was never dispatched.
  const remote = c.consultationMode === 'phone';
  const meeting = remote
    ? `Consultation Call · ${c.visitMinutes} minutes`
    : `In-Person Site Visit · ${c.visitMinutes} minutes`;
  return {
    subject: remote
      ? `Your OntarioReno consultation call — ${friendlyDate(c.date)} at ${friendlyTime(c.time)}`
      : `Your OntarioReno site visit — ${friendlyDate(c.date)} at ${friendlyTime(c.time)}`,
    body: [
      `Hi ${c.name},`,
      '',
      'Your consultation is confirmed.',
      '',
      `When:      ${friendlyDate(c.date)} at ${friendlyTime(c.time)}`,
      `What:      ${meeting}`,
      remote
        ? `Call:      ${c.phone || 'the number you gave us'}`
        : `Where:     ${c.propertyAddress}`,
      `Reference: ${c.publicReference}`,
      '',
      'What happens next',
      '  1. Confirmation sent — this email.',
      remote
        ? '  2. Property review — we look over your address and project before we call.'
        : '  2. Zoning review — we run a preliminary property assessment before we arrive.',
      remote
        // Honest about the timing: the specialist works this around their
        // in-person day, so the slot is when they will reach out, not a
        // guaranteed ring at the second.
        ? '  3. Consultation call — a specialist calls you around your chosen time to go through the project.'
        : `  3. Site visit — a specialist arrives at ${c.propertyAddress} at the scheduled time.`,
      '',
      'Need to change anything? Just reply to this email.',
      '',
      'OntarioReno',
    ].join('\n'),
  };
}

export function emailTeamAlert(c: BookingContext): { subject: string; body: string } {
  const remote = c.consultationMode === 'phone';
  return {
    subject: remote
      ? `New consultation CALL booked — ${c.name}, ${friendlyDate(c.date)} ${friendlyTime(c.time)}`
      : `New site visit booked — ${c.name}, ${friendlyDate(c.date)} ${friendlyTime(c.time)}`,
    body: [
      remote
        ? 'A homeowner booked a VIRTUAL consultation through the public flow — outside the drive radius, so nobody is travelling to this one.'
        : 'A homeowner booked a site visit through the public consultation flow.',
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

// ─── Submission alerts ────────────────────────────────────────────────────────

export type LeadWelcomeContext = {
  leadId: string;
  name: string;
  phone: string;
  /** Absolute URL of the booking flow this lead should land on. */
  bookingUrl: string;
};

/**
 * The one text a new external lead gets, and only ever one.
 *
 * Returns nothing without a phone number: a lead captured with only an email is
 * not a texting failure to be retried, it is a lead somebody has to call.
 *
 * ── Why this is not part of planSubmissionNotifications ──
 * That planner runs on the PUBLIC flow, where the homeowner has just been shown
 * the calendar. Texting them a link to the screen they are already looking at
 * is noise at best. This fires only for leads that arrive from outside, where
 * nobody has seen a calendar yet.
 *
 * The key is the lead id and nothing else, so an external form that re-posts a
 * lead — Meta retries webhooks — cannot produce a second text. Enrichment of an
 * existing lead never reaches here at all; see handleIntake.
 */
export function planLeadWelcomeNotifications(
  c: LeadWelcomeContext,
  now: Date = new Date()
): PlannedNotification[] {
  if (!c.phone.trim() || !c.bookingUrl.trim()) return [];
  return [
    {
      channel: 'sms',
      kind: 'lead_welcome',
      recipient: c.phone,
      subject: '',
      body: smsLeadWelcome(c),
      // Sent immediately, and never expires: unlike a reminder its wording is
      // not tied to a date, so a delayed send is still true. Late is worse than
      // prompt here, but it is not wrong.
      sendAfter: now.toISOString(),
      expiresAt: '',
      idempotencyKey: `${c.leadId}:sms:lead_welcome`,
    },
  ];
}

export type SubmissionContext = {
  leadId: string;
  name: string;
  phone: string;
  email: string;
  /** Best address we have — often partial, and sometimes empty. */
  propertyAddress: string;
  municipality: string;
  /** Routing outcome and reason codes, verbatim. Not re-derived here. */
  outcome: string;
  reasons: string[];
  /** Readable answer labels where we have them, raw values otherwise. */
  projectScope: string;
  fundingPlan: string;
  timeline: string;
  ownership: string;
  programLabel: string;
  addressState: string;
  /** AddressResolutionCause, as a string — see lib/address-resolution.ts. */
  addressCause: string;
  /** Human sentence for that cause, so the alert explains itself. */
  addressCauseDetail: string;
  /** True when the cause was our provider failing, not the address. */
  providerDegraded: boolean;
  /** Business inbox. Always alerted. */
  teamInbox: string;
};

/**
 * Lead in one line, so the outcome is legible from a phone notification without
 * opening anything.
 */
export function leadAlertSubject(c: SubmissionContext): string {
  const label: Record<string, string> = {
    DIRECT_CALENDAR: 'ready to book',
    MANUAL_REVIEW: 'NEEDS REVIEW',
    NURTURE: 'nurture',
    DECLINE: 'declined',
  };
  const where = c.municipality || c.propertyAddress || 'address unverified';
  return `New consultation lead (${label[c.outcome] ?? c.outcome}) — ${c.name}, ${where}`;
}

export function emailLeadAlert(c: SubmissionContext): { subject: string; body: string } {
  const lines = [
    'A homeowner completed the public consultation form.',
    '',
    `Outcome:        ${c.outcome}`,
    `Reasons:        ${c.reasons.length ? c.reasons.join(', ') : 'None recorded'}`,
    '',
    `Name:           ${c.name}`,
    `Phone:          ${c.phone || 'Not provided'}`,
    `Email:          ${c.email || 'Not provided'}`,
    `Property:       ${c.propertyAddress || 'Not resolved'}`,
    `Municipality:   ${c.municipality || 'Not resolved'}`,
    `Program:        ${c.programLabel}`,
    '',
    `Project scope:  ${c.projectScope || 'Not provided'}`,
    `Timeline:       ${c.timeline || 'Not provided'}`,
    `Funding plan:   ${c.fundingPlan || 'Not provided'}`,
    `Ownership:      ${c.ownership || 'Not provided'}`,
    '',
    `Address state:  ${c.addressState} (${c.addressCause})`,
    `                ${c.addressCauseDetail}`,
    `Lead ID:        ${c.leadId}`,
  ];

  if (c.outcome === 'DIRECT_CALENDAR') {
    // Qualifying and booking are separate events. This lead was shown the
    // calendar; nothing yet says they picked a slot.
    lines.push('', 'This lead was offered the calendar. A separate booking alert follows only if they chose a time.');
  }
  if (c.providerDegraded) {
    lines.push(
      '',
      '⚠ This lead reached manual review because OUR address provider failed, not',
      '  because of the address itself. See the address provider alert.',
    );
  }
  lines.push('', 'This lead is unassigned and waiting in admin triage.');

  return { subject: leadAlertSubject(c), body: lines.join('\n') };
}

export function emailAddressProviderAlert(c: SubmissionContext): { subject: string; body: string } {
  return {
    subject: `⚠ Address verification is degraded — ${c.addressCause}`,
    body: [
      'Consultation submissions are being routed to manual review because the',
      'address provider is not working, not because the addresses are bad.',
      '',
      `Cause:      ${c.addressCause}`,
      `What it is: ${c.addressCauseDetail}`,
      '',
      'Until this is fixed, every submission — including homeowners whose address',
      'is perfectly good and who would otherwise have been shown the calendar —',
      'lands in manual review and nobody is offered a booking slot.',
      '',
      `First lead affected today: ${c.leadId} (${c.name})`,
      '',
      'This alert is sent at most once per cause per day, so it will not repeat',
      'for every affected lead. It will fire again tomorrow if still unresolved.',
    ].join('\n'),
  };
}

/**
 * Everything a submission should announce, whatever it routed to.
 *
 * Unlike the booking planner this is keyed on the LEAD, so it does not need —
 * and must not wait for — an appointment to exist.
 */
export function planSubmissionNotifications(
  c: SubmissionContext,
  now: Date = new Date()
): PlannedNotification[] {
  const at = now.toISOString();
  const planned: PlannedNotification[] = [];
  if (!c.teamInbox) return planned;

  const alert = emailLeadAlert(c);
  planned.push({
    channel: 'email', kind: 'lead_alert', recipient: c.teamInbox,
    subject: alert.subject, body: alert.body,
    // Never expires: a lead is worth hearing about late.
    sendAfter: at, expiresAt: '',
    idempotencyKey: `${c.leadId}:email:lead_alert:${c.teamInbox}`,
  });

  if (c.providerDegraded) {
    const outage = emailAddressProviderAlert(c);
    planned.push({
      channel: 'email', kind: 'address_provider_alert', recipient: c.teamInbox,
      subject: outage.subject, body: outage.body,
      sendAfter: at, expiresAt: '',
      // Keyed to the cause and the DAY, not the lead. A dead API key affects
      // every submission; one row per lead would bury the inbox in identical
      // mail and teach everyone to ignore it. The unique constraint on
      // idempotencyKey collapses the rest into this one, and a still-broken
      // provider re-alerts tomorrow.
      idempotencyKey: `address_provider_alert:${c.addressCause}:${at.slice(0, 10)}`,
    });
  }

  return planned;
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

/**
 * Everything a reminder consists of, for one appointment at one date and time.
 *
 * Split out of `planBookingNotifications` because reminders outlive the booking
 * that created them: when a homeowner reschedules, the queued rows describe a
 * visit that is no longer happening and have to be rebuilt. Both the booking
 * path and the resync path plan them here, so the copy and the timing rules
 * cannot drift apart.
 */
export type ReminderContext = Pick<
  BookingContext,
  'appointmentId' | 'name' | 'phone' | 'propertyAddress' | 'date' | 'time'
> &
  // Reminders are rebuilt from the appointment row every time they are sent, so
  // this has to travel with it. Optional because most callers describe a site
  // visit, which is what the wording assumed before remote bookings existed.
  Partial<Pick<BookingContext, 'consultationMode'>>;

export function planReminderNotifications(
  c: ReminderContext,
  /**
   * Appended to the idempotency key. Empty for the original booking, which
   * keeps the keys already in the table unchanged. A resync passes the new
   * date and time, so moving to a new slot writes a new row, and moving BACK
   * to a slot the homeowner already had revives that slot's original row
   * rather than colliding with it.
   */
  revision = '',
  now: Date = new Date(),
  /**
   * Normally a reminder whose send time has already passed is not queued at
   * all — at booking time that means the moment for it never existed. The
   * send-time reconciler needs the full schedule regardless, because "this
   * row's send time has passed" is exactly the condition under which it should
   * go out.
   */
  includeElapsed = false
): PlannedNotification[] {
  if (!c.phone) return [];
  const suffix = revision ? `:${revision}` : '';
  const start = torontoInstant(c.date, c.time);
  const planned: PlannedNotification[] = [];

  const reminderAt = new Date(start.getTime() - 24 * 60 * 60_000);
  // A booking made inside 24 hours has already missed this window; the day-of
  // reminder still covers it, so scheduling it in the past would only send a
  // "tomorrow" message about today.
  if (includeElapsed || reminderAt.getTime() > now.getTime()) {
    planned.push({
      channel: 'sms', kind: 'reminder_24h', recipient: c.phone,
      subject: '', body: smsReminder24h(c), sendAfter: reminderAt.toISOString(),
      // This message says "tomorrow". Once the appointment day has begun it
      // is a lie, and the day-of reminder covers the same visit anyway.
      expiresAt: torontoInstant(c.date, '00:00').toISOString(),
      idempotencyKey: `${c.appointmentId}:sms:reminder_24h${suffix}`,
    });
  }

  const dayOf = dayOfReminderAt(c.date, c.time);
  if (includeElapsed || dayOf.getTime() > now.getTime()) {
    planned.push({
      channel: 'sms', kind: 'reminder_day_of', recipient: c.phone,
      subject: '', body: smsReminderDayOf(c), sendAfter: dayOf.toISOString(),
      // A reminder that arrives after the rep is on the doorstep is noise.
      expiresAt: start.toISOString(),
      idempotencyKey: `${c.appointmentId}:sms:reminder_day_of${suffix}`,
    });
  }

  return planned;
}

/** Everything a confirmed booking should send, with its schedule. */
export function planBookingNotifications(c: BookingContext): PlannedNotification[] {
  const now = new Date().toISOString();
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

    planned.push(...planReminderNotifications(c));
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
 * Whether SMS can be delivered from here.
 *
 * OntarioReno already runs Twilio through Google Apps Script outside this repo,
 * which sends the initial response to a new lead. This adapter deliberately
 * uses the *same* Twilio account and sender number rather than standing up a
 * second one: two systems texting the same people from different numbers, with
 * different opt-out lists, is worse than one. The two do not overlap — Apps
 * Script handles first contact, this handles booking confirmations and
 * reminders — so a homeowner never gets the same message twice.
 *
 * With no credentials configured the messages are still composed, scheduled
 * and recorded; they park as `blocked` rather than being lost.
 */
export function smsProviderConfigured(env = process.env): boolean {
  return Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_FROM_NUMBER);
}

/**
 * Normalise to E.164, which is the only format Twilio accepts.
 *
 * Homeowners type phone numbers as they please — "(905) 555-0199",
 * "905-555-0199", "1 905 555 0199". Returns null when the input cannot be
 * trusted to be a North American number, so a malformed number is recorded as
 * a failure rather than silently sent somewhere unintended.
 */
export function toE164(raw: string): string | null {
  const digits = (raw ?? '').replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  // Already international and plausible — pass it through untouched.
  if (raw.trim().startsWith('+') && digits.length >= 8 && digits.length <= 15) {
    return `+${digits}`;
  }
  return null;
}

/**
 * Send one SMS through Twilio's REST API.
 *
 * Called directly rather than through the Twilio SDK: one form-encoded POST is
 * the whole integration, and the SDK is a large dependency for a serverless
 * bundle that is already close to its limits.
 */
export async function deliverSms(
  to: string,
  body: string,
  env = process.env
): Promise<DeliveryOutcome> {
  const accountSid = env.TWILIO_ACCOUNT_SID;
  const authToken = env.TWILIO_AUTH_TOKEN;
  const from = env.TWILIO_FROM_NUMBER;
  if (!accountSid || !authToken || !from) {
    return { state: 'blocked', reason: 'no_sms_provider' };
  }

  const destination = toE164(to);
  if (!destination) return { state: 'failed', reason: `unusable_phone_number:${to}` };

  try {
    const r = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`,
      {
        method: 'POST',
        headers: {
          // Twilio uses HTTP basic auth: account SID as user, token as password.
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ To: destination, From: from, Body: body }).toString(),
      }
    );

    const payload = (await r.json().catch(() => ({}))) as {
      sid?: string;
      message?: string;
      code?: number;
    };

    if (!r.ok) {
      // Twilio's own error text is far more useful than the status alone —
      // unverified number, opted-out recipient, bad sender — so keep it.
      return {
        state: 'failed',
        reason: `twilio_${r.status}${payload.code ? `_${payload.code}` : ''}:${payload.message ?? 'send_failed'}`,
      };
    }
    return { state: 'sent', reason: payload.sid ?? '' };
  } catch (err) {
    return { state: 'failed', reason: err instanceof Error ? err.message : String(err) };
  }
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
