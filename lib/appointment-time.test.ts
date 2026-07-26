import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidAppointmentTime, parseAppointmentMinutes } from './appointment-time.ts';

test('accepts well-formed 24-hour times', () => {
  for (const value of ['00:00', '09:30', '10:00', '15:00', '23:59']) {
    assert.equal(isValidAppointmentTime(value), true, `expected ${value} to be valid`);
  }
});

test('rejects display labels — the bug this guards against', () => {
  // "3:00 PM" is what the reschedule picker used to submit. Stored in
  // appointmentTime it made parseInt() return NaN, so the reminder cron silently
  // skipped that appointment forever.
  for (const value of ['3:00 PM', '3:00PM', '12:00 AM', '3 PM', '15:00 ']) {
    assert.equal(isValidAppointmentTime(value), false, `expected ${value} to be rejected`);
  }
});

test('rejects out-of-range and malformed values', () => {
  for (const value of ['24:00', '23:60', '9:30', '099:30', '', ':', '1230', '12:3']) {
    assert.equal(isValidAppointmentTime(value), false, `expected ${value} to be rejected`);
  }
});

test('rejects non-string values', () => {
  for (const value of [undefined, null, 900, {}, [], new Date()]) {
    assert.equal(isValidAppointmentTime(value), false);
  }
});

test('parses valid times to minutes since midnight', () => {
  assert.equal(parseAppointmentMinutes('00:00'), 0);
  assert.equal(parseAppointmentMinutes('09:30'), 570);
  assert.equal(parseAppointmentMinutes('15:00'), 900);
  assert.equal(parseAppointmentMinutes('23:59'), 1439);
});

test('returns null rather than NaN for unusable values', () => {
  for (const value of ['3:00 PM', '', 'nonsense', undefined, null, '24:00']) {
    const result = parseAppointmentMinutes(value);
    assert.equal(result, null, `expected null for ${String(value)}`);
    assert.ok(!Number.isNaN(result as unknown as number));
  }
});
