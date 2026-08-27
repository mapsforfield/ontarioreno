import test from 'node:test';
import assert from 'node:assert/strict';
import {
  dayOfReminderAt,
  deliverSms,
  toE164,
  friendlyDate,
  friendlyTime,
  planBookingNotifications,
  planLeadWelcomeNotifications,
  smsLeadWelcome,
  smsBookingConfirmation,
  smsReminder24h,
  smsReminderDayOf,
  smsProviderConfigured,
  torontoInstant,
  type BookingContext,
} from './notifications.ts';
import { buildIcs, googleCalendarUrl, outlookCalendarUrl, torontoToUtc } from './calendar-links.ts';
import { TESTING_MODE_MASTER, deliveryEnabled, testingModeEnabled } from './app-config.ts';

const future = () => {
  const d = new Date(Date.now() + 10 * 24 * 60 * 60_000);
  return d.toISOString().slice(0, 10);
};

const ctx = (over: Partial<BookingContext> = {}): BookingContext => ({
  appointmentId: 'appt-1',
  publicReference: 'OR-ABCD2345',
  name: 'Jane',
  phone: '9055550199',
  email: 'jane@example.test',
  propertyAddress: '100 King St W, Hamilton',
  date: future(),
  time: '14:00',
  visitMinutes: 45,
  consultationMode: 'in_person',
  teamInbox: 'info@ontarioreno.ca',
  fundingPlan: 'Cash / Savings / Existing Home Equity',
  projectScope: 'Basement or secondary suite',
  projectTypeLabel: 'ADU Grant Consultation',
  ...over,
});

// ─── Message copy ─────────────────────────────────────────────────────────────

test('booking confirmation SMS matches the approved copy', () => {
  const c = ctx({ date: '2026-08-10' });
  assert.equal(
    smsBookingConfirmation(c),
    "Hi Jane, your OntarioReno site visit for 100 King St W, Hamilton is confirmed for Monday, August 10 at 2:00 PM. Need to reschedule? Reply to this text."
  );
});

test('24-hour reminder SMS matches the approved copy', () => {
  const c = ctx({ date: '2026-08-10' });
  const body = smsReminder24h(c);
  assert.match(body, /^Reminder: Your OntarioReno site visit for 100 King St W, Hamilton is scheduled for tomorrow \(Monday, August 10\) at 2:00 PM\./);
  assert.match(body, /reply 'C' to confirm or reply 'R' if you need to reschedule\.$/);
});

test('morning-of reminder SMS matches the approved copy', () => {
  const c = ctx({ date: '2026-08-10' });
  assert.equal(
    smsReminderDayOf(c),
    'Hi Jane, our specialist is looking forward to visiting 100 King St W, Hamilton today at 2:00 PM for your ADU assessment. See you soon!'
  );
});

test('date and time render the way a homeowner reads them', () => {
  assert.equal(friendlyDate('2026-08-10'), 'Monday, August 10');
  assert.equal(friendlyTime('10:00'), '10:00 AM');
  assert.equal(friendlyTime('14:00'), '2:00 PM');
  assert.equal(friendlyTime('18:00'), '6:00 PM');
});

// ─── Scheduling ───────────────────────────────────────────────────────────────

test('a booking plans confirmation, both reminders and a team alert', () => {
  const planned = planBookingNotifications(ctx());
  const kinds = planned.map((p) => `${p.channel}:${p.kind}`).sort();
  assert.deepEqual(kinds, [
    'email:booking_confirmation',
    'email:team_alert',
    'sms:booking_confirmation',
    'sms:reminder_24h',
    'sms:reminder_day_of',
  ]);
});

test('every planned message carries a unique idempotency key', () => {
  const planned = planBookingNotifications(ctx());
  const keys = planned.map((p) => p.idempotencyKey);
  assert.equal(new Set(keys).size, keys.length);
  for (const k of keys) assert.ok(k.startsWith('appt-1:'), 'keyed to the appointment');
});

test('the 24-hour reminder is skipped when the booking is inside 24 hours', () => {
  // Otherwise it would text "tomorrow" about a visit happening today.
  const tomorrow = new Date(Date.now() + 6 * 60 * 60_000).toISOString().slice(0, 10);
  const planned = planBookingNotifications(ctx({ date: tomorrow, time: '10:00' }));
  assert.equal(planned.some((p) => p.kind === 'reminder_24h'), false);
});

test('reminders are scheduled relative to the slot, not the booking moment', () => {
  const date = future();
  const planned = planBookingNotifications(ctx({ date, time: '14:00' }));
  const start = torontoInstant(date, '14:00').getTime();
  const r24 = planned.find((p) => p.kind === 'reminder_24h')!;
  assert.equal(new Date(r24.sendAfter).getTime(), start - 24 * 60 * 60_000);
  // "Tomorrow" stops being true once the appointment day begins, so the row
  // must carry an expiry the drain can act on rather than sending it late.
  assert.ok(r24.expiresAt);
  assert.ok(new Date(r24.expiresAt).getTime() <= start);
  assert.ok(new Date(r24.expiresAt).getTime() > new Date(r24.sendAfter).getTime());

  const dayOf = planned.find((p) => p.kind === 'reminder_day_of')!;
  // A day-of reminder is noise once the rep is on the doorstep.
  assert.equal(new Date(dayOf.expiresAt).getTime(), start);

  // Confirmations and team alerts stay true however late they go out.
  for (const kind of ['booking_confirmation', 'team_alert']) {
    for (const row of planned.filter((p) => p.kind === kind)) {
      assert.equal(row.expiresAt, '');
    }
  }
});

test('day-of reminder lands at 08:00 local, or earlier for an early slot', () => {
  assert.equal(dayOfReminderAt('2026-08-10', '10:00').getTime(), torontoInstant('2026-08-10', '08:00').getTime());
  assert.equal(dayOfReminderAt('2026-08-10', '18:00').getTime(), torontoInstant('2026-08-10', '08:00').getTime());
  // A hypothetical 09:00 slot must not be reminded after it has started.
  assert.equal(dayOfReminderAt('2026-08-10', '09:00').getTime(), torontoInstant('2026-08-10', '07:00').getTime());
});

test('a homeowner with no phone still gets email, and no SMS is planned', () => {
  const planned = planBookingNotifications(ctx({ phone: '' }));
  assert.equal(planned.some((p) => p.channel === 'sms'), false);
  assert.ok(planned.some((p) => p.kind === 'booking_confirmation' && p.channel === 'email'));
  assert.ok(planned.some((p) => p.kind === 'team_alert'), 'the team is told regardless');
});

test('the confirmation uses the branded portal template', () => {
  const planned = planBookingNotifications(ctx());
  const confirmation = planned.find(
    (p) => p.kind === 'booking_confirmation' && p.channel === 'email'
  )!;
  assert.ok(confirmation.html, 'HTML must be generated');
  // Same template the portal sends, not a second look for the same brand.
  assert.match(confirmation.html!, /<!DOCTYPE html|<table/i);
  assert.ok(confirmation.html!.includes('OntarioReno'));
  assert.ok(confirmation.html!.includes('Appointment Confirmed'));
  // Plain text still accompanies it for clients that block HTML — the portal's
  // own wording, since the whole message now comes from the portal's composer.
  assert.ok(confirmation.body.includes('has been booked'));
  // The plain-text reschedule/cancel links must be absolute or they are dead
  // in every mail client.
  assert.ok(confirmation.body.includes('https://'));
  assert.ok(!/Reschedule: \//.test(confirmation.body));
  // Subject keeps the brand and the date rather than the portal's generic one.
  assert.match(confirmation.subject, /OntarioReno site visit/);
});

test('the email is the portal email — Provider, notes and actions all present', () => {
  // A public booking must receive the same message a rep sends from the Emails
  // tab. Rebuilding the inputs by hand previously dropped all three of these.
  const html = planBookingNotifications(
    ctx({ repName: 'David', customerNotes: 'Pre-qualified through OntarioReno.' })
  ).find((p) => p.kind === 'booking_confirmation' && p.channel === 'email')!.html!;

  assert.ok(html.includes('PROVIDER') || html.includes('Provider'), 'Provider row');
  assert.ok(html.includes('David'), 'assigned rep named');
  assert.ok(html.includes('Pre-qualified through OntarioReno.'), 'customer notes block');
  assert.ok(/Reschedule/.test(html), 'action buttons present, as the portal sends');
});

test('the branded HTML shows the visit details a homeowner needs', () => {
  const html = planBookingNotifications(ctx({ date: '2026-08-10' })).find(
    (p) => p.kind === 'booking_confirmation' && p.channel === 'email'
  )!.html!;
  assert.ok(html.includes('100 King St W, Hamilton') || html.includes('Hamilton'), 'address shown');
  assert.ok(html.includes('Jane'), 'greeting by name');
  assert.ok(html.includes('2:00 PM'), 'time shown');
});

test('the email shows the readable project label, never the raw form value', () => {
  // The appointment row and the confirmation email must agree; an earlier version
  // labelled the appointment correctly while the email still said "secondary_suite".
  const html = planBookingNotifications(ctx()).find(
    (p) => p.kind === 'booking_confirmation' && p.channel === 'email'
  )!.html!;
  assert.ok(html.includes('ADU Grant Consultation'), 'label shown');
  assert.equal(/secondary_suite|garden_suite|laneway_suite/.test(html), false, 'no raw values');
});

test('the team alert keeps the specific choice, in words', () => {
  const alert = planBookingNotifications(ctx()).find((p) => p.kind === 'team_alert')!;
  assert.ok(alert.body.includes('Basement or secondary suite'), 'the rep sees what they picked');
  assert.ok(alert.body.includes('Cash / Savings / Existing Home Equity'));
});

test('phone numbers are normalised to what Twilio accepts', () => {
  // Whatever a homeowner types into the form has to become E.164.
  assert.equal(toE164('(905) 555-0199'), '+19055550199');
  assert.equal(toE164('905-555-0199'), '+19055550199');
  assert.equal(toE164('9055550199'), '+19055550199');
  assert.equal(toE164('1 905 555 0199'), '+19055550199');
  assert.equal(toE164('+1 905 555 0199'), '+19055550199');
});

test('an unusable phone number is rejected rather than guessed at', () => {
  // Guessing would mean texting a stranger.
  assert.equal(toE164('555-0199'), null);
  assert.equal(toE164(''), null);
  assert.equal(toE164('not a phone number'), null);
});

test('SMS is blocked, not attempted, when Twilio is not configured', async () => {
  const outcome = await deliverSms('9055550199', 'Hi', {} as NodeJS.ProcessEnv);
  assert.equal(outcome.state, 'blocked');
  assert.equal(outcome.reason, 'no_sms_provider');
});

test('a malformed number fails without calling Twilio', async () => {
  const outcome = await deliverSms('123', 'Hi', {
    TWILIO_ACCOUNT_SID: 'AC1', TWILIO_AUTH_TOKEN: 't', TWILIO_FROM_NUMBER: '+15550001111',
  } as NodeJS.ProcessEnv);
  assert.equal(outcome.state, 'failed');
  assert.match(outcome.reason, /unusable_phone_number/);
});

test('SMS rows carry no HTML', () => {
  for (const sms of planBookingNotifications(ctx()).filter((p) => p.channel === 'sms')) {
    assert.ok(!sms.html, `${sms.kind} must not carry HTML`);
  }
});

test('the team alert carries every field the team needs to act', () => {
  const alert = planBookingNotifications(ctx()).find((p) => p.kind === 'team_alert')!;
  for (const needle of [
    'Jane', '9055550199', 'jane@example.test', '100 King St W',
    'Cash / Savings / Existing Home Equity', 'Basement or secondary suite', 'OR-ABCD2345',
  ]) {
    assert.ok(alert.body.includes(needle), `team alert must include ${needle}`);
  }
});

// ─── Calendar links ───────────────────────────────────────────────────────────

test('Ontario wall clock converts to the correct UTC instant across DST', () => {
  // EDT (UTC-4) in August, EST (UTC-5) in January.
  assert.equal(torontoToUtc('2026-08-10', '14:00').toISOString(), '2026-08-10T18:00:00.000Z');
  assert.equal(torontoToUtc('2026-01-12', '14:00').toISOString(), '2026-01-12T19:00:00.000Z');
});

test('calendar links carry title, location and the right window', () => {
  const event = {
    title: 'OntarioReno - Hamilton ADU Site Visit',
    description: 'Reference: OR-ABCD2345',
    location: '100 King St W, Hamilton',
    date: '2026-08-10', time: '14:00', durationMinutes: 45,
  };
  // Read the params back the way a browser would; URLSearchParams encodes
  // spaces as '+', which decodeURIComponent does not reverse.
  const google = new URL(googleCalendarUrl(event));
  assert.equal(google.hostname, 'calendar.google.com');
  assert.equal(google.searchParams.get('text'), 'OntarioReno - Hamilton ADU Site Visit');
  assert.equal(google.searchParams.get('location'), '100 King St W, Hamilton');
  assert.equal(google.searchParams.get('dates'), '20260810T180000Z/20260810T184500Z');
  assert.equal(google.searchParams.get('ctz'), 'America/Toronto');

  const outlook = new URL(outlookCalendarUrl(event));
  assert.equal(outlook.hostname, 'outlook.live.com');
  assert.equal(outlook.searchParams.get('subject'), 'OntarioReno - Hamilton ADU Site Visit');
  assert.equal(outlook.searchParams.get('startdt'), '2026-08-10T18:00:00.000Z');
  assert.equal(outlook.searchParams.get('enddt'), '2026-08-10T18:45:00.000Z');
});

test('the .ics is well formed and escapes commas per RFC 5545', () => {
  const ics = buildIcs(
    { title: 'OntarioReno - Hamilton ADU Site Visit', description: 'Reference: OR-ABCD2345',
      location: '100 King St W, Hamilton', date: '2026-08-10', time: '14:00', durationMinutes: 45 },
    'OR-ABCD2345'
  );
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.match(ics, /END:VCALENDAR$/);
  assert.ok(ics.includes('DTSTART:20260810T180000Z'));
  assert.ok(ics.includes('DTEND:20260810T184500Z'));
  assert.ok(ics.includes('LOCATION:100 King St W\\, Hamilton'), 'comma must be escaped');
  assert.ok(ics.includes('\r\n'), 'CRLF line endings are required');
});

// ─── Guards ───────────────────────────────────────────────────────────────────

test('testing mode is OFF on the live domain and ON while testing', () => {
  // Customers must never see routing codes; testers must never be left guessing
  // why a submission routed the way it did.
  for (const host of ['ontarioreno.ca', 'www.ontarioreno.ca', 'OntarioReno.ca']) {
    assert.equal(testingModeEnabled(host), false, `${host} is live traffic`);
  }
  for (const host of ['ontarioreno-abc123-mapsforfields-projects.vercel.app', 'localhost', '127.0.0.1']) {
    assert.equal(testingModeEnabled(host), true, `${host} is a testing host`);
  }
  assert.equal(testingModeEnabled(null), false, 'no host known ⇒ assume live');
  assert.equal(testingModeEnabled(undefined), false);
});

test('the master switch is the single place to kill the panel outright', () => {
  assert.equal(TESTING_MODE_MASTER, true, 'the host rule is the active control');
});

test('real delivery happens in production only', () => {
  assert.equal(deliveryEnabled({ VERCEL_ENV: 'production' }), true);
  for (const env of ['preview', 'development', undefined]) {
    assert.equal(deliveryEnabled({ VERCEL_ENV: env }), false, `must not send from ${env}`);
  }
});

test('SMS reports as unconfigured until a Twilio adapter is wired', () => {
  assert.equal(smsProviderConfigured({} as NodeJS.ProcessEnv), false);
  assert.equal(
    smsProviderConfigured({
      TWILIO_ACCOUNT_SID: 'x', TWILIO_AUTH_TOKEN: 'y', TWILIO_FROM_NUMBER: 'z',
    } as NodeJS.ProcessEnv),
    true
  );
});

// ─── First contact for external (Meta instant form) leads ────────────────────
// This is an unsolicited text to a real consumer mobile. Everything below is a
// rule that, broken, either texts somebody twice or texts them something we are
// not allowed to send.

const WELCOME = {
  leadId: 'lead-1',
  name: 'Dennis Mahalingam',
  phone: '9055550199',
  bookingUrl: 'https://ontarioreno.ca/consultation/basement',
};

test('the welcome text greets by first name and names a real sender', () => {
  const body = smsLeadWelcome(WELCOME);
  assert.match(body, /^Hi Dennis, this is Michael from OntarioReno/, 'first name only — the full name reads like a mail merge');
  assert.ok(!body.includes('Mahalingam'), 'surname never appears');
  assert.match(body, /OntarioReno/, 'name ourselves early, or it arrives as an unknown sender');
});

test('the welcome text asks one binary question', () => {
  // The whole reason this message changed: the old one asked for nothing, so a
  // lead who was interested but not ready to open a calendar had no smaller
  // step to take. A question that can be answered in one word is that step.
  const body = smsLeadWelcome(WELCOME);
  assert.match(body, /weekdays or weekends/i, 'the ask is a reply, not a click');
  assert.match(body, /\?/, 'it has to actually be a question');
});

test('the booking link is offered last, as the alternative', () => {
  // Kept because it costs nothing and serves the lead who would rather
  // self-serve — but it trails the question rather than replacing it.
  const body = smsLeadWelcome(WELCOME);
  assert.ok(body.includes(WELCOME.bookingUrl), 'the link is still there');
  assert.ok(
    body.indexOf('weekdays') < body.indexOf(WELCOME.bookingUrl),
    'the question comes before the link, or the link is the ask again'
  );
  assert.ok(body.trim().endsWith(WELCOME.bookingUrl), 'nothing follows the link');
});

test('the sender name is configurable and never blank', () => {
  // Whoever this names has to be the person actually reading the replies.
  assert.match(smsLeadWelcome({ ...WELCOME, senderName: 'Dana' }), /this is Dana from OntarioReno/);
  assert.match(smsLeadWelcome({ ...WELCOME, senderName: '   ' }), /this is Michael from OntarioReno/);
});

test('no STOP footer at this volume', () => {
  // Deliberate: the footer belonged to the bulk sends this replaced. This is a
  // handful a day from a named sender who replies, and Twilio still honours
  // STOP at the carrier level whatever the body says. If this ever goes back to
  // hundreds at a time, the footer comes back with it.
  assert.ok(!/reply stop/i.test(smsLeadWelcome(WELCOME)));
});

test('a lead with no name still gets a sendable message', () => {
  const body = smsLeadWelcome({ ...WELCOME, name: '' });
  assert.match(body, /^Hi, this is Michael from OntarioReno/);
  assert.ok(!body.includes('undefined'), 'never leak a placeholder into a real send');
});

test('the welcome text stays inside two SMS segments', () => {
  // Longer than this and carriers split it, which costs more and can deliver
  // out of order — a link arriving in the second half of a broken message is a
  // link nobody taps.
  assert.ok(
    smsLeadWelcome(WELCOME).length <= 306,
    `welcome sms is ${smsLeadWelcome(WELCOME).length} characters`
  );
});

test('one text per lead, whatever the sender does', () => {
  // Meta retries webhooks. The key is the lead id and nothing else, so a
  // re-post collides on the unique index instead of sending a second text.
  const a = planLeadWelcomeNotifications(WELCOME);
  const b = planLeadWelcomeNotifications(WELCOME, new Date(Date.now() + 60_000));
  assert.equal(a.length, 1);
  assert.equal(a[0].idempotencyKey, b[0].idempotencyKey);
  assert.equal(a[0].idempotencyKey, 'lead-1:sms:lead_welcome');
});

test('no phone means no message, and no failure either', () => {
  // A lead captured with only an email is somebody to call, not a delivery to
  // retry. Queueing an unsendable row would show as a failure in the outbox.
  assert.deepEqual(planLeadWelcomeNotifications({ ...WELCOME, phone: '' }), []);
  assert.deepEqual(planLeadWelcomeNotifications({ ...WELCOME, phone: '   ' }), []);
});

test('the welcome never expires and is sent immediately', () => {
  const [row] = planLeadWelcomeNotifications(WELCOME);
  assert.equal(row.channel, 'sms');
  assert.equal(row.kind, 'lead_welcome');
  assert.equal(row.expiresAt, '', 'its wording is not tied to a date, so it cannot go stale');
  assert.ok(new Date(row.sendAfter).getTime() <= Date.now() + 1000);
});

test('the number is normalised the same way every other send is', () => {
  const [row] = planLeadWelcomeNotifications(WELCOME);
  assert.equal(toE164(row.recipient), '+19055550199');
});

// ─── Who hears about a booking, and how fast ──────────────────────────────────

test('the booking alert reaches the fast inbox and the archive separately', () => {
  const planned = planBookingNotifications(
    ctx({ teamInbox: 'alerts@gmail.com', archiveInbox: 'info@ontarioreno.ca', repEmail: 'rep@example.com' })
  );
  const alerts = planned.filter((n) => n.kind === 'team_alert');
  assert.deepEqual(
    alerts.map((n) => n.recipient).sort(),
    ['alerts@gmail.com', 'info@ontarioreno.ca', 'rep@example.com']
  );
  // Separate rows, not one CC. info@ontarioreno.ca is a web-host mailbox that
  // forwards to Gmail, and that hop has taken over an hour — it must not be
  // able to hold up the copy that arrives in seconds.
  assert.equal(new Set(alerts.map((n) => n.idempotencyKey)).size, 3);
});

test('no archive address configured still alerts the team', () => {
  const alerts = planBookingNotifications(ctx({ teamInbox: 'alerts@gmail.com', repEmail: '' }))
    .filter((n) => n.kind === 'team_alert');
  assert.deepEqual(alerts.map((n) => n.recipient), ['alerts@gmail.com']);
});

test('an archive address equal to the team inbox is not mailed twice', () => {
  const alerts = planBookingNotifications(
    ctx({ teamInbox: 'same@example.com', archiveInbox: 'same@example.com', repEmail: '' })
  ).filter((n) => n.kind === 'team_alert');
  assert.equal(alerts.length, 1);
});
