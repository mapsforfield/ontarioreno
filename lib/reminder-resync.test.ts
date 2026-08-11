import test from 'node:test';
import assert from 'node:assert/strict';
import {
  reconcileReminder,
  resyncAppointmentReminders,
  suppressPendingReminders,
  type ReminderStore,
} from './reminder-resync.ts';
import { planBookingNotifications, type BookingContext } from './notifications.ts';

type Row = {
  appointmentId?: string;
  kind: string;
  state: string;
  stateReason?: string;
  recipient: string;
  body: string;
  sendAfter: string;
  expiresAt: string;
  idempotencyKey: string;
  attempts?: number;
  sentAt?: string | null;
};

/** In-memory stand-in for the outbox, honouring the unique idempotency key. */
function fakeStore(seed: Row[] = []) {
  const rows = [...seed];
  const store: ReminderStore & { rows: Row[] } = {
    rows,
    notificationOutbox: {
      async updateMany(args: unknown) {
        const { where, data } = args as {
          where: { appointmentId: string; kind: { in: string[] }; state: string };
          data: Record<string, unknown>;
        };
        let count = 0;
        for (const row of rows) {
          if (
            row.appointmentId === where.appointmentId &&
            where.kind.in.includes(row.kind) &&
            row.state === where.state
          ) {
            Object.assign(row, data);
            count++;
          }
        }
        return { count };
      },
      async upsert(args: unknown) {
        const { where, create, update } = args as {
          where: { idempotencyKey: string };
          create: Row;
          update: Partial<Row>;
        };
        const existing = rows.find((r) => r.idempotencyKey === where.idempotencyKey);
        if (existing) Object.assign(existing, update);
        // Mirrors the column defaults in schema.prisma — a created row is
        // pending with no delivery history, which is what makes it eligible
        // for the drain.
        else rows.push({ state: 'pending', attempts: 0, sentAt: null, ...create });
        return {};
      },
    },
  };
  return store;
}

const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

/**
 * Today as ONTARIO sees it.
 *
 * `new Date().toISOString().slice(0, 10)` is the UTC date, and Toronto is four
 * or five hours behind — so from 8pm Ontario time onward the UTC date is
 * already tomorrow. A test that wants "an appointment later today" and uses the
 * UTC date silently gets "tomorrow night" instead, which is 27 hours out rather
 * than a few, so reminders that should have been suppressed are legitimately
 * still scheduled. That made this file pass all day and fail every evening.
 */
const todayToronto = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

const ctx = (over: Partial<BookingContext> = {}): BookingContext => ({
  appointmentId: 'appt-1',
  publicReference: 'OR-ABCD2345',
  name: 'Jane',
  phone: '9055550199',
  email: 'jane@example.test',
  propertyAddress: '100 King St W, Hamilton',
  date: inDays(10),
  time: '14:00',
  visitMinutes: 45,
  consultationMode: 'in_person',
  teamInbox: 'info@ontarioreno.ca',
  fundingPlan: 'Cash / Savings / Existing Home Equity',
  projectScope: 'Basement or secondary suite',
  projectTypeLabel: 'ADU Grant Consultation',
  ...over,
});

/** The outbox as it looks right after a booking. */
function booked(over: Partial<BookingContext> = {}) {
  const c = ctx(over);
  const rows = planBookingNotifications(c).map((n) => ({
    appointmentId: c.appointmentId,
    kind: n.kind,
    state: 'pending',
    recipient: n.recipient,
    body: n.body,
    sendAfter: n.sendAfter,
    expiresAt: n.expiresAt,
    idempotencyKey: n.idempotencyKey,
  }));
  return { c, store: fakeStore(rows) };
}

const reminders = (store: { rows: Row[] }) =>
  store.rows.filter((r) => r.kind === 'reminder_24h' || r.kind === 'reminder_day_of');
const pendingReminders = (store: { rows: Row[] }) =>
  reminders(store).filter((r) => r.state === 'pending');

// ─── The bug this module exists to prevent ────────────────────────────────────

test('a moved appointment never leaves a reminder quoting the old date', async () => {
  const { c, store } = booked();
  const oldDate = c.date;

  await resyncAppointmentReminders(
    store,
    { ...c, date: inDays(20), time: '11:00' },
    'appointment_moved'
  );

  for (const row of pendingReminders(store)) {
    assert.ok(!row.body.includes('100 King St W, Hamilton, ' + oldDate));
    assert.ok(row.sendAfter > new Date().toISOString(), 'never queued in the past');
  }
  // The old rows are stood down, not deleted — they stay as a record.
  const suppressed = reminders(store).filter((r) => r.state === 'suppressed');
  assert.equal(suppressed.length, 2);
  assert.equal(suppressed[0]?.stateReason, 'appointment_moved');
});

test('moving to a new slot queues reminders for that slot', async () => {
  const { c, store } = booked();

  const summary = await resyncAppointmentReminders(
    store,
    { ...c, date: inDays(20), time: '11:00' },
    'appointment_moved'
  );

  assert.equal(summary.suppressed, 2);
  assert.equal(summary.queued, 2);
  const pending = pendingReminders(store);
  assert.equal(pending.length, 2);
  for (const row of pending) assert.match(row.body, /11:00 AM|11 AM/);
});

test('moving back to a slot the homeowner already had revives it, not nothing', async () => {
  // The collision case: the original slot's row is suppressed but its unique
  // idempotency key still occupies the table, so a plain insert is dropped.
  const { c, store } = booked();
  const original = { date: c.date, time: c.time };

  await resyncAppointmentReminders(store, { ...c, date: inDays(20) }, 'appointment_moved');
  await resyncAppointmentReminders(store, { ...c, ...original }, 'appointment_moved');

  const pending = pendingReminders(store);
  assert.equal(pending.length, 2, 'homeowner is not left with zero reminders');
  for (const row of pending) assert.equal(row.state, 'pending');
});

test('resyncing twice to the same slot does not duplicate reminders', async () => {
  const { c, store } = booked();
  const moved = { ...c, date: inDays(20), time: '11:00' };

  await resyncAppointmentReminders(store, moved, 'appointment_moved');
  await resyncAppointmentReminders(store, moved, 'appointment_moved');

  assert.equal(pendingReminders(store).length, 2);
});

test('a visit moved to within the day queues nothing rather than a late reminder', async () => {
  const { c, store } = booked();

  const summary = await resyncAppointmentReminders(
    store,
    { ...c, date: todayToronto(), time: '23:30' },
    'appointment_moved'
  );

  assert.equal(summary.suppressed, 2);
  // The 24h window is gone; only a same-day reminder can still be true.
  assert.ok(summary.queued <= 1);
  for (const row of pendingReminders(store)) {
    assert.ok(row.sendAfter > new Date().toISOString());
  }
});

// ─── Cancellation and other non-move exits ────────────────────────────────────

test('cancelling stands down every pending reminder', async () => {
  const { c, store } = booked();

  const count = await suppressPendingReminders(store, c.appointmentId, 'appointment_cancelled');

  assert.equal(count, 2);
  assert.equal(pendingReminders(store).length, 0);
});

test('an already-sent reminder is left alone', async () => {
  const { c, store } = booked();
  const sent = reminders(store)[0]!;
  sent.state = 'sent';
  sent.sentAt = new Date().toISOString();

  await suppressPendingReminders(store, c.appointmentId, 'appointment_cancelled');

  assert.equal(sent.state, 'sent', 'history must keep saying what happened');
});

test('reminders for other appointments are untouched', async () => {
  const { store } = booked();
  store.rows.push({
    appointmentId: 'appt-OTHER',
    kind: 'reminder_24h',
    state: 'pending',
    recipient: '9055550100',
    body: 'other',
    sendAfter: new Date(Date.now() + 86_400_000).toISOString(),
    expiresAt: '',
    idempotencyKey: 'appt-OTHER:sms:reminder_24h',
  });

  await suppressPendingReminders(store, 'appt-1', 'appointment_cancelled');

  const other = store.rows.find((r) => r.appointmentId === 'appt-OTHER')!;
  assert.equal(other.state, 'pending');
});

test('confirmations and team alerts survive a resync', async () => {
  const { c, store } = booked();

  await resyncAppointmentReminders(store, { ...c, date: inDays(20) }, 'appointment_moved');

  const confirmations = store.rows.filter((r) => r.kind === 'booking_confirmation');
  assert.ok(confirmations.length > 0);
  for (const row of confirmations) assert.equal(row.state, 'pending');
});

test('a homeowner with no phone produces no reminder rows', async () => {
  const { c, store } = booked({ phone: '' });

  const summary = await resyncAppointmentReminders(
    store,
    { ...c, phone: '', date: inDays(20) },
    'appointment_moved'
  );

  assert.equal(summary.queued, 0);
  assert.equal(pendingReminders(store).length, 0);
});

// ─── Send-time reconciliation, on a fixed clock ───────────────────────────────
// The portal is the only source of truth for the date. These run against an
// injected `now` so they say the same thing at 2am as at 2pm.

const liveAppointment = (over: Record<string, unknown> = {}) => ({
  id: 'appt-1',
  customerName: 'Jane',
  phone: '9055550199',
  address: '100 King St W',
  city: 'Hamilton',
  appointmentDate: '2026-08-10',
  appointmentTime: '16:00',
  status: 'scheduled',
  deletedAt: null,
  ...over,
});

/** 24h before a 2026-08-10 16:00 Toronto visit is 2026-08-09 16:00 Toronto. */
const DAY_BEFORE = new Date('2026-08-09T21:00:00Z');

test('the wording sent is built from the appointment, not the queued row', () => {
  const verdict = reconcileReminder(liveAppointment(), { kind: 'reminder_24h' }, DAY_BEFORE);

  assert.equal(verdict.action, 'send');
  if (verdict.action !== 'send') return;
  assert.match(verdict.body, /Monday, August 10/);
  assert.match(verdict.body, /4:00 PM/);
  assert.ok(!verdict.body.includes('August 7'));
});

test('a visit moved further out defers the reminder instead of sending it early', () => {
  // Standing on the day the ORIGINAL reminder was due, with the appointment now
  // a fortnight away.
  const verdict = reconcileReminder(
    liveAppointment({ appointmentDate: '2026-08-24' }),
    { kind: 'reminder_24h' },
    DAY_BEFORE
  );

  assert.equal(verdict.action, 'defer');
  if (verdict.action !== 'defer') return;
  assert.ok(verdict.sendAfter > DAY_BEFORE.toISOString());
  assert.match(verdict.body, /August 24/);
});

test('a visit pulled earlier drops a reminder whose moment has passed', () => {
  // Moved to the morning of the day we are standing on: "tomorrow" is a lie and
  // the day-of reminder covers it.
  const verdict = reconcileReminder(
    liveAppointment({ appointmentDate: '2026-08-09' }),
    { kind: 'reminder_24h' },
    DAY_BEFORE
  );

  assert.equal(verdict.action, 'suppress');
});

test('cancelled, deleted, slotless and missing all stop the text', () => {
  const cases: Array<[unknown, string]> = [
    [null, 'appointment_missing'],
    [liveAppointment({ deletedAt: new Date() }), 'appointment_deleted'],
    [liveAppointment({ status: 'cancelled' }), 'appointment_cancelled'],
    [liveAppointment({ appointmentDate: '' }), 'appointment_has_no_slot'],
    [liveAppointment({ phone: '' }), 'no_phone_on_appointment'],
  ];

  for (const [appointment, reason] of cases) {
    const verdict = reconcileReminder(appointment as never, { kind: 'reminder_24h' }, DAY_BEFORE);
    assert.equal(verdict.action, 'suppress');
    if (verdict.action !== 'suppress') continue;
    assert.equal(verdict.reason, reason);
  }
});

test('a rescheduled appointment is still a live one', () => {
  const verdict = reconcileReminder(
    liveAppointment({ status: 'rescheduled' }),
    { kind: 'reminder_24h' },
    DAY_BEFORE
  );

  assert.equal(verdict.action, 'send');
});

test('a store that throws never propagates out of a resync', async () => {
  const broken: ReminderStore = {
    notificationOutbox: {
      updateMany: async () => { throw new Error('db down'); },
      upsert: async () => { throw new Error('db down'); },
    },
  };

  const summary = await resyncAppointmentReminders(broken, ctx(), 'appointment_moved');

  assert.deepEqual(summary, { suppressed: 0, queued: 0 });
});
