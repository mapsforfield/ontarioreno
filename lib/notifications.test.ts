import test from 'node:test';
import assert from 'node:assert/strict';
import {
  dayOfReminderAt,
  friendlyDate,
  friendlyTime,
  planBookingNotifications,
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
  // Plain text still accompanies it for clients that block HTML.
  assert.ok(confirmation.body.includes('Your consultation is confirmed.'));
});

test('the confirmation email never carries the unsigned cancel links', () => {
  // /portal/consultation/:id/... authorizes on the appointment id alone, so
  // emailing it publicly would let anyone guessing a cuid cancel a visit.
  const html = planBookingNotifications(ctx()).find(
    (p) => p.kind === 'booking_confirmation' && p.channel === 'email'
  )!.html!;
  assert.equal(/\/portal\/consultation\//.test(html), false, 'no portal action links');
  assert.equal(/Reschedule<\/a>|Cancel Appointment/.test(html), false, 'no action buttons');
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
