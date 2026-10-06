// ─── Arrival windows ──────────────────────────────────────────────────────────
//
// A portal booking can promise a WINDOW ("between 10 AM and 12 PM") instead of
// an exact start. `appointmentTime` stays the start of the window, so every
// existing reader keeps working; `arrivalWindowMinutes` (0 = exact time) is how
// long after it the rep may arrive.
//
// Two things must stay true:
//
//   * Anything that tells the homeowner WHEN says the whole window. Telling
//     them "10:00 AM" and turning up at 11:45 is the failure this prevents.
//   * The calendar is blocked for window + visit, not visit alone. A rep who
//     arrives at 11:59 for a 60-minute visit is busy until 12:59.
//
// Portal-only for now: the public booking flows never set it, so their rows
// read 0 and behave exactly as before.

/** The windows a rep can pick in the portal. 0 = exact time. */
export const ARRIVAL_WINDOW_OPTIONS = [0, 120] as const;

/** Normalise whatever a row or form holds into a whole, non-negative minute count. */
export function arrivalWindowOf(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
}

/** "HH:MM" plus minutes, or null when the start is not a valid time. */
export function addMinutesToTime(time: string, minutes: number): string | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(time ?? '');
  if (!match) return null;
  const total = Number(match[1]) * 60 + Number(match[2]) + minutes;
  if (!Number.isFinite(total) || total < 0 || total >= 24 * 60) return null;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** End of the arrival window as "HH:MM", or null for an exact-time booking. */
export function arrivalWindowEnd(time: string, windowMinutes: unknown): string | null {
  const w = arrivalWindowOf(windowMinutes);
  return w > 0 ? addMinutesToTime(time, w) : null;
}

/** "10:00 AM" — same style the customer messages already use. */
export function clockLabel(time: string): string {
  const [h, m] = time.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return time;
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

/**
 * The time as a reader should see it: "10:00 AM", or "10:00 AM – 12:00 PM"
 * when a window is set. `fmt` lets each surface keep its own clock style.
 */
export function formatTimeOrWindow(
  time: string,
  windowMinutes: unknown,
  fmt: (t: string) => string = clockLabel
): string {
  const end = arrivalWindowEnd(time, windowMinutes);
  return end ? `${fmt(time)} – ${fmt(end)}` : fmt(time);
}

/**
 * For prose: "at 10:00 AM" or "between 10:00 AM and 12:00 PM". Drops straight
 * into sentences that used to read "... on Tuesday at 10:00 AM".
 */
export function atTimeOrWindow(
  time: string,
  windowMinutes: unknown,
  fmt: (t: string) => string = clockLabel
): string {
  const end = arrivalWindowEnd(time, windowMinutes);
  return end ? `between ${fmt(time)} and ${fmt(end)}` : `at ${fmt(time)}`;
}

/** Minutes of the rep's day a booking occupies: the window plus the visit. */
export function blockedMinutes(durationMinutes: number, windowMinutes: unknown): number {
  return (Number(durationMinutes) || 0) + arrivalWindowOf(windowMinutes);
}
