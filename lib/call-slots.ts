// ─── The two call times the first text offers ─────────────────────────────────
// Pure. No database, no clock of its own: every function takes the Ontario wall
// clock it should reason from, so a test can stand at 9:40pm on a Tuesday.
//
// WHY THIS EXISTS. The first text to a Meta lead used to be a link to the
// booking page. Links from unknown numbers read as scams, and fewer than one in
// five leads booked. The text now asks a question a person can answer with one
// word — "Does today at 4:30pm or tonight at 6pm work for a quick call?" — and
// the reply books the call.
//
// The two times are chosen the way a good salesperson would pick them:
//
//   1. The SOONEST time we can honestly call, at least an hour out so they
//      have time to read and answer.
//   2. A time in the OTHER part of the day. Daytime first → offer an evening,
//      because working homeowners pick up after work. Evening first → offer
//      the next morning.
//
// Two times, never a menu. A second option that is twenty minutes after the
// first is not a choice, so the pair is always at least 90 minutes apart.

import type { OfferedSlot } from './lead-reply-templates.js';

/** When the caller takes calls. Ontario wall clock. */
export type CallHours = {
  /** First start, minutes after midnight. */
  startMinute: number;
  /** Calls must END by this, minutes after midnight. */
  endMinute: number;
  /** 0 = Sunday … 6 = Saturday. */
  days: number[];
};

/** 7 days, 10am to 8pm: the hours the reps already work. */
export const DEFAULT_CALL_HOURS: CallHours = {
  startMinute: 10 * 60,
  endMinute: 20 * 60,
  days: [0, 1, 2, 3, 4, 5, 6],
};

/** Calls start on the hour and half hour. */
export const CALL_STEP_MINUTES = 30;
/** Never offer a time sooner than this — they need time to see the text. */
export const CALL_LEAD_MINUTES = 60;
/** A call is 5 to 10 minutes, so two can share a half hour. */
export const CALLS_PER_SLOT = 2;
/** At or after this is "evening". */
export const EVENING_FROM_MINUTE = 17 * 60;
/** The second option is at least this long after the first. */
const MIN_GAP_MINUTES = 90;
/** How far ahead we ever look. A week covers any run of closed days. */
const LOOKAHEAD_DAYS = 7;

/**
 * Texts go out between these. A lead that arrives at 11pm or 2am gets the
 * opener at 8:30am, with times relative to 8:30am, rather than a text that wakes
 * them up and says "tomorrow" about a day that, to them, is already today.
 */
export const QUIET_UNTIL_MINUTE = 8 * 60 + 30;
export const QUIET_FROM_MINUTE = 21 * 60 + 30;

/** Evenings in the order a homeowner would most like them. */
const EVENING_PREFERENCE = ['18:00', '18:30', '17:30', '19:00', '17:00', '19:30'];

// ─── Wall-clock arithmetic ────────────────────────────────────────────────────

function minuteOf(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

function hhmm(minute: number): string {
  return `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
}

/** YYYY-MM-DD plus n days. UTC arithmetic on a date-only value, so DST cannot move it. */
export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

function weekday(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Whole days from `from` to `to`, both YYYY-MM-DD. */
function dayDiff(from: string, to: string): number {
  const [a, b, c] = from.split('-').map(Number);
  const [x, y, z] = to.split('-').map(Number);
  return Math.round((Date.UTC(x, y - 1, z) - Date.UTC(a, b - 1, c)) / 86_400_000);
}

/** Minutes from `nowWall`'s midnight to a slot, so slots on different days compare. */
function absMinute(nowDate: string, slot: OfferedSlot): number {
  return dayDiff(nowDate, slot.date) * 1440 + minuteOf(slot.time);
}

function key(slot: OfferedSlot): string {
  return `${slot.date}T${slot.time}`;
}

function isEvening(slot: OfferedSlot): boolean {
  return minuteOf(slot.time) >= EVENING_FROM_MINUTE;
}

// ─── Picking ──────────────────────────────────────────────────────────────────

/**
 * Every call time we could offer, soonest first.
 *
 * `taken` is the wall-clock start ("YYYY-MM-DDTHH:MM") of every call already
 * booked. A half hour holding CALLS_PER_SLOT of them is full.
 */
export function openCallSlots(
  nowWall: string,
  taken: string[] = [],
  hours: CallHours = DEFAULT_CALL_HOURS
): OfferedSlot[] {
  const nowDate = nowWall.slice(0, 10);
  const earliest = minuteOf(nowWall.slice(11, 16)) + CALL_LEAD_MINUTES;

  const load = new Map<string, number>();
  for (const t of taken) {
    const k = t.slice(0, 16);
    load.set(k, (load.get(k) ?? 0) + 1);
  }

  const out: OfferedSlot[] = [];
  for (let d = 0; d <= LOOKAHEAD_DAYS; d++) {
    const date = addDays(nowDate, d);
    if (!hours.days.includes(weekday(date))) continue;
    for (let m = hours.startMinute; m + CALL_STEP_MINUTES <= hours.endMinute; m += CALL_STEP_MINUTES) {
      if (d * 1440 + m < earliest) continue;
      const slot = { date, time: hhmm(m) };
      if ((load.get(key(slot)) ?? 0) >= CALLS_PER_SLOT) continue;
      out.push(slot);
    }
  }
  return out;
}

/**
 * The two times to offer. Fewer than two only when the calendar truly has
 * fewer, and the caller must then fall back rather than send half a question.
 */
export function pickCallSlots(
  nowWall: string,
  taken: string[] = [],
  hours: CallHours = DEFAULT_CALL_HOURS
): OfferedSlot[] {
  const open = openCallSlots(nowWall, taken, hours);
  if (open.length === 0) return [];
  const nowDate = nowWall.slice(0, 10);
  const first = open[0];
  const firstAt = absMinute(nowDate, first);
  const later = open.filter((s) => absMinute(nowDate, s) >= firstAt + MIN_GAP_MINUTES);

  let second: OfferedSlot | undefined;
  if (!isEvening(first)) {
    // Daytime first → the soonest evening, at the most natural evening time.
    const evenings = later.filter(isEvening);
    const day = evenings[0]?.date;
    if (day) {
      const onDay = evenings.filter((s) => s.date === day);
      second =
        EVENING_PREFERENCE.map((t) => onDay.find((s) => s.time === t)).find(Boolean) ?? onDay[0];
    }
  } else {
    // Evening first → the next morning, as early as it opens.
    second = later.find((s) => s.date !== first.date && !isEvening(s));
  }
  second ??= later[0] ?? open[1];
  return second ? [first, second] : [first];
}

/**
 * When the opener should actually go out: now, unless now is the middle of the
 * night, in which case 8:30am. Returns a wall clock.
 */
export function openerSendWall(nowWall: string): string {
  const date = nowWall.slice(0, 10);
  const minute = minuteOf(nowWall.slice(11, 16));
  if (minute < QUIET_UNTIL_MINUTE) return `${date}T${hhmm(QUIET_UNTIL_MINUTE)}`;
  if (minute >= QUIET_FROM_MINUTE) return `${addDays(date, 1)}T${hhmm(QUIET_UNTIL_MINUTE)}`;
  return nowWall.slice(0, 16);
}

// ─── Saying it ────────────────────────────────────────────────────────────────

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function clock(time: string): string {
  const m = minuteOf(time);
  const h = Math.floor(m / 60);
  const suffix = h >= 12 ? 'pm' : 'am';
  const hour = h % 12 || 12;
  return m % 60 ? `${hour}:${String(m % 60).padStart(2, '0')}${suffix}` : `${hour}${suffix}`;
}

/** "today at", "tonight at", "tomorrow at", "Thursday at". */
function dayPhrase(slot: OfferedSlot, nowWall: string): string {
  const diff = dayDiff(nowWall.slice(0, 10), slot.date);
  if (diff === 0) return isEvening(slot) ? 'tonight at' : 'today at';
  if (diff === 1) return 'tomorrow at';
  return `${WEEKDAYS[weekday(slot.date)]} at`;
}

/** "tomorrow at 10am". Relative to when the homeowner will read it. */
export function callSlotLabel(slot: OfferedSlot, nowWall: string): string {
  return `${dayPhrase(slot, nowWall)} ${clock(slot.time)}`;
}

/**
 * "tomorrow at 10am or 6pm", "today at 4:30pm or tonight at 6pm".
 * The day is said once when both times share it.
 */
export function callSlotPair(a: OfferedSlot, b: OfferedSlot, nowWall: string): string {
  const pa = dayPhrase(a, nowWall);
  const pb = dayPhrase(b, nowWall);
  return pa === pb
    ? `${pa} ${clock(a.time)} or ${clock(b.time)}`
    : `${pa} ${clock(a.time)} or ${pb} ${clock(b.time)}`;
}

// ─── Their time, not ours ─────────────────────────────────────────────────────

/** What the homeowner proposed, as the classifier resolved it. */
export type ProposedTime = {
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM, 24h. The time they named, or the start of their window. */
  from: string;
  /** HH:MM, 24h. End of their window ("after 5", "tomorrow afternoon"). Absent for an exact time. */
  to?: string | null;
};

/** Never book a proposed time sooner than this: a call needs a moment's notice. */
export const PROPOSED_LEAD_MINUTES = 15;
/** A call that starts after this would run past the end of call hours. */
const LAST_START_BUFFER = 15;

/**
 * Turn the time a homeowner named into a call we can honestly make, or null.
 *
 * An exact time ("7pm", "tomorrow at 2:15") is booked AS SAID, if it is inside
 * call hours, at least 15 minutes away and not already holding two calls. A
 * window ("after 5", "tomorrow afternoon") books its first open half hour.
 * Null means: outside hours, in the past, too far out, or full. The caller
 * hands that to a person rather than haggling by text.
 */
export function resolveProposedSlot(
  nowWall: string,
  p: ProposedTime,
  taken: string[] = [],
  hours: CallHours = DEFAULT_CALL_HOURS
): OfferedSlot | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.date) || !/^\d{2}:\d{2}$/.test(p.from)) return null;
  const nowDate = nowWall.slice(0, 10);
  const diff = dayDiff(nowDate, p.date);
  if (diff < 0 || diff > LOOKAHEAD_DAYS) return null;
  if (!hours.days.includes(weekday(p.date))) return null;

  const earliest = minuteOf(nowWall.slice(11, 16)) + PROPOSED_LEAD_MINUTES;
  const ok = (m: number) =>
    m >= hours.startMinute &&
    m <= hours.endMinute - LAST_START_BUFFER &&
    diff * 1440 + m >= earliest &&
    taken.filter((t) => t.slice(0, 16) === `${p.date}T${hhmm(m)}`).length < CALLS_PER_SLOT;

  const from = minuteOf(p.from);
  const to = p.to && /^\d{2}:\d{2}$/.test(p.to) ? minuteOf(p.to) : null;
  if (to === null) return ok(from) ? { date: p.date, time: hhmm(from) } : null;

  // A window: the first open half hour inside it (and inside call hours).
  let m = Math.max(from, hours.startMinute);
  if (m % CALL_STEP_MINUTES) m += CALL_STEP_MINUTES - (m % CALL_STEP_MINUTES);
  for (; m < to; m += CALL_STEP_MINUTES) {
    if (ok(m)) return { date: p.date, time: hhmm(m) };
  }
  return null;
}
