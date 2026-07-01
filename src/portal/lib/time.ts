// The portal is a single-timezone business tool: everything happens in Ontario
// (America/Toronto). All "today"/"now" logic is pinned here so it never depends
// on the viewer's device clock and never drifts to UTC (which rolls a day early
// every evening for anyone east of the prime meridian, Eastern included).

const TORONTO = 'America/Toronto';

/**
 * YYYY-MM-DD for the given instant (default: now) in Ontario time.
 * DST-safe — `America/Toronto` handles the EST/EDT switch automatically.
 */
export function torontoDateKey(instant: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TORONTO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Today's date (YYYY-MM-DD) in Ontario time. */
export function torontoToday(): string {
  return torontoDateKey();
}

/**
 * YYYY-MM-DD from a Date using its LOCAL calendar day (no UTC conversion).
 * Use when reading back a date that was built in local time (e.g. calendar-grid
 * cells), so the key always matches the day that was rendered.
 */
export function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
