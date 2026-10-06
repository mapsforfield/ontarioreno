import test from 'node:test';
import assert from 'node:assert/strict';
import {
  arrivalWindowEnd,
  arrivalWindowOf,
  atTimeOrWindow,
  blockedMinutes,
  formatTimeOrWindow,
} from './arrival-window.ts';
import { smsReminder24h, smsReminderDayOf } from './notifications.ts';
import { reconcileReminder, reminderContextFor } from './reminder-resync.ts';
import { collidesWithExisting, type BookedAppointment } from './scheduling.ts';

test('a 10:00 booking with a 2-hour window reads 10–12', () => {
  assert.equal(arrivalWindowEnd('10:00', 120), '12:00');
  assert.equal(formatTimeOrWindow('10:00', 120), '10:00 AM – 12:00 PM');
  assert.equal(atTimeOrWindow('10:00', 120), 'between 10:00 AM and 12:00 PM');
});

test('no window means the exact time, worded exactly as before', () => {
  for (const w of [0, null, undefined, '', 'nonsense', -30]) {
    assert.equal(arrivalWindowOf(w), 0);
    assert.equal(formatTimeOrWindow('10:00', w), '10:00 AM');
    assert.equal(atTimeOrWindow('10:00', w), 'at 10:00 AM');
  }
});

test('a window that would run past midnight is not invented', () => {
  assert.equal(arrivalWindowEnd('23:00', 120), null);
});

const ctx = {
  appointmentId: 'a1',
  name: 'Sam',
  phone: '+15555550100',
  propertyAddress: '835 Guildwood Blvd, London',
  date: '2026-10-07',
  time: '10:00',
};

test('homeowner reminder texts quote the whole window', () => {
  const windowed = { ...ctx, arrivalWindowMinutes: 120 };
  assert.match(smsReminder24h(windowed), /between 10:00 AM and 12:00 PM/);
  assert.match(smsReminderDayOf(windowed), /today between 10:00 AM and 12:00 PM/);
  assert.doesNotMatch(smsReminder24h(windowed), / at 10:00 AM/);
});

test('exact-time reminder wording is unchanged', () => {
  assert.match(smsReminder24h(ctx), /\) at 10:00 AM\./);
  assert.match(smsReminderDayOf(ctx), /today at 10:00 AM/);
});

test('reminders rebuilt from the appointment row carry the window', () => {
  const row = {
    id: 'a1',
    customerName: 'Sam',
    phone: '+15555550100',
    address: '835 Guildwood Blvd',
    city: 'London',
    appointmentDate: '2026-10-07',
    appointmentTime: '10:00',
    status: 'scheduled',
    arrivalWindowMinutes: 120,
  };
  assert.equal(reminderContextFor(row).arrivalWindowMinutes, 120);
  const verdict = reconcileReminder(row, { kind: 'reminder_24h' }, new Date('2026-10-06T15:00:00Z'));
  assert.ok(verdict.action === 'send' || verdict.action === 'defer');
  assert.match(verdict.body, /between 10:00 AM and 12:00 PM/);
});

test('the calendar is blocked for window + visit', () => {
  assert.equal(blockedMinutes(60, 120), 180);
  const booked: BookedAppointment = {
    assignedRepId: 'r1',
    appointmentDate: '2026-10-07',
    appointmentTime: '10:00',
    durationMinutes: 60,
    arrivalWindowMinutes: 120,
    schedulingArea: null,
    status: 'scheduled',
  };
  // Rep could arrive 11:59 and stay till ~1 — 12:00 and 12:30 are taken.
  assert.equal(collidesWithExisting('12:00', 60, [booked]), true);
  assert.equal(collidesWithExisting('12:30', 60, [booked]), true);
  assert.equal(collidesWithExisting('13:00', 60, [booked]), false);
  // Without the window, the same row frees up at 11:00.
  assert.equal(collidesWithExisting('11:00', 60, [{ ...booked, arrivalWindowMinutes: 0 }]), false);
});
