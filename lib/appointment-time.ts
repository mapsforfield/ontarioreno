// ─── Appointment time format ──────────────────────────────────────────────────
// `Appointment.appointmentTime` is a 24-hour "HH:MM" string. Every consumer
// parses it that way (reminder cron, notification emails, calendar rendering),
// so a display label such as "3:00 PM" written into that column silently breaks
// them — `parseInt("3:00 PM")` yields NaN and the row stops reminding entirely.
//
// This module is the single definition of the accepted format. The API validates
// with it on write; readers use parseAppointmentMinutes to skip (and surface)
// anything malformed instead of computing with NaN.

/** Strict 24-hour "HH:MM" — 00:00 through 23:59. */
export const APPOINTMENT_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/** True when the value is a well-formed 24-hour "HH:MM" string. */
export function isValidAppointmentTime(value: unknown): value is string {
  return typeof value === 'string' && APPOINTMENT_TIME_PATTERN.test(value);
}

/**
 * Minutes since midnight for a well-formed "HH:MM", or null when the stored
 * value is empty or malformed. Returning null (rather than NaN) forces callers
 * to handle bad data explicitly.
 */
export function parseAppointmentMinutes(value: unknown): number | null {
  if (!isValidAppointmentTime(value)) return null;
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}
