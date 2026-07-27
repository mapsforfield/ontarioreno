// ─── Add-to-calendar links ────────────────────────────────────────────────────
// Browser-safe (no Node imports). Times are stored as Ontario wall clock, so
// every provider link needs a real UTC instant — computed DST-correctly rather
// than by assuming a fixed -05:00/-04:00 offset.

const TORONTO = 'America/Toronto';

/** Ontario wall clock (YYYY-MM-DD + HH:MM) → the UTC instant it refers to. */
export function torontoToUtc(date: string, time: string): Date {
  const [y, mo, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  const wallAsIfUtc = Date.UTC(y, mo - 1, d, hh, mm);
  let guess = wallAsIfUtc;

  // Two passes converge even across a DST boundary.
  for (let i = 0; i < 2; i++) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: TORONTO,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(new Date(guess));
    const g = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
    const hour = g('hour') === 24 ? 0 : g('hour');
    const renderedAsUtc = Date.UTC(g('year'), g('month') - 1, g('day'), hour, g('minute'));
    guess = wallAsIfUtc - (renderedAsUtc - guess);
  }
  return new Date(guess);
}

/** Compact UTC stamp used by Google Calendar and iCalendar: 20260810T140000Z */
export function toStamp(d: Date): string {
  return `${d.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
}

export type CalendarEvent = {
  title: string;
  description: string;
  location: string;
  date: string; // YYYY-MM-DD, Ontario
  time: string; // HH:MM, Ontario
  durationMinutes: number;
};

function window(event: CalendarEvent) {
  const start = torontoToUtc(event.date, event.time);
  const end = new Date(start.getTime() + event.durationMinutes * 60_000);
  return { start, end };
}

export function googleCalendarUrl(event: CalendarEvent): string {
  const { start, end } = window(event);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${toStamp(start)}/${toStamp(end)}`,
    details: event.description,
    location: event.location,
    ctz: TORONTO,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function outlookCalendarUrl(event: CalendarEvent): string {
  const { start, end } = window(event);
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    body: event.description,
    location: event.location,
    startdt: start.toISOString(),
    enddt: end.toISOString(),
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/** Escape per RFC 5545: backslash, semicolon, comma, and newlines. */
function icsEscape(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** iCalendar payload — used by Apple Calendar and any .ics download. */
export function buildIcs(event: CalendarEvent, uid: string): string {
  const { start, end } = window(event);
  // CRLF line endings are required by the spec; some clients reject LF-only.
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//OntarioReno//Consultation//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${icsEscape(uid)}@ontarioreno.ca`,
    `DTSTAMP:${toStamp(new Date())}`,
    `DTSTART:${toStamp(start)}`,
    `DTEND:${toStamp(end)}`,
    `SUMMARY:${icsEscape(event.title)}`,
    `DESCRIPTION:${icsEscape(event.description)}`,
    `LOCATION:${icsEscape(event.location)}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${icsEscape(event.title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}
