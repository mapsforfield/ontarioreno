// ─── Admin-configurable calendar settings ─────────────────────────────────────
// The scheduling rules in lib/scheduling.ts take their numbers as arguments, and
// until now every caller passed the compile-time constants in SHARED_SCHEDULING
// (lib/program-config.ts). Those constants are still the defaults and still what
// the code ships with — this module is an OVERRIDE layer on top of them, stored
// in Setting.scheduling_settings and edited by an admin in the portal.
//
// It exists because capacity is a fact about the day, not about the code. A rep
// phones in and says they can take a fourth appointment tomorrow; before this,
// the only way to say yes was a deploy.
//
// No Node imports — this is bundled into the browser so the admin panel and the
// server validate against exactly the same bounds.

import { SHARED_SCHEDULING, type ProgramConfig } from './program-config.js';

/** Setting row that holds the JSON below. */
export const SCHEDULING_SETTINGS_KEY = 'scheduling_settings';

/**
 * One rep, one date, a different cap.
 *
 * The global cap is the normal week. This is the exception — one rep taking a
 * fourth visit on a day their colleague is off — and it is deliberately scoped
 * to a single date so it cannot outlive the reason for it. Nobody has to
 * remember to put the number back.
 */
export type DayCapOverride = {
  repId: string;
  /** YYYY-MM-DD. */
  date: string;
  maxBookings: number;
};

export type SchedulingSettings = {
  maxBookingsPerRepPerDay: number;
  primaryRepPrimingBookings: number;
  maxSameDayTravelKm: number;
  leadTimeHours: number;
  bookingHorizonDays: number;
  dayCapOverrides: DayCapOverride[];
};

/** The numeric fields, with the bounds both the panel and the API enforce. */
export const SCHEDULING_FIELDS = [
  {
    key: 'maxBookingsPerRepPerDay' as const,
    label: 'Appointments per rep per day',
    help: 'Hard cap on in-person visits one rep can be given on a single date. Remote consultations never count toward it.',
    min: 1,
    max: 8,
    unit: 'per day',
  },
  {
    key: 'primaryRepPrimingBookings' as const,
    label: 'Priming bookings',
    help: 'How many bookings the highest-priority rep takes before the other rep is considered at all. After this, assignment balances on fewest-booked.',
    min: 0,
    max: 8,
    unit: 'bookings',
  },
  {
    key: 'maxSameDayTravelKm' as const,
    label: 'Same-day travel radius',
    help: "A rep's visits on one date must sit within this radius of each other. Raising it lets one day span a wider area; lowering it offers fewer slots.",
    min: 1,
    max: 200,
    unit: 'km',
  },
  {
    key: 'leadTimeHours' as const,
    label: 'Minimum lead time',
    help: 'How much notice before the earliest time the calendar will offer. Lower it to allow same-day bookings.',
    min: 0,
    max: 168,
    unit: 'hours',
  },
  {
    key: 'bookingHorizonDays' as const,
    label: 'Booking horizon',
    help: 'How far ahead the public calendar offers times.',
    min: 1,
    max: 60,
    unit: 'days',
  },
];

export type SchedulingFieldKey = (typeof SCHEDULING_FIELDS)[number]['key'];

/** Ceiling on stored exceptions — a runaway list would be a slow settings read. */
export const MAX_DAY_CAP_OVERRIDES = 200;

const FIELD_BOUNDS = new Map(SCHEDULING_FIELDS.map((f) => [f.key, f]));

/** What the code shipped with. An empty settings row means exactly this. */
export function schedulingDefaults(): SchedulingSettings {
  return {
    maxBookingsPerRepPerDay: SHARED_SCHEDULING.maxBookingsPerRepPerDay,
    primaryRepPrimingBookings: SHARED_SCHEDULING.primaryRepPrimingBookings,
    maxSameDayTravelKm: SHARED_SCHEDULING.maxSameDayTravelKm,
    leadTimeHours: SHARED_SCHEDULING.leadTimeHours,
    bookingHorizonDays: SHARED_SCHEDULING.bookingHorizonDays,
    dayCapOverrides: [],
  };
}

const isDate = (v: unknown): v is string =>
  typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

export function clampSchedulingField(
  key: SchedulingFieldKey,
  raw: unknown,
  fallback: number
): number {
  const bounds = FIELD_BOUNDS.get(key)!;
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(bounds.max, Math.max(bounds.min, Math.round(n)));
}

/**
 * Read the stored JSON into a fully-populated settings object.
 *
 * Never throws and never returns a partial: a malformed row, a missing field or
 * an out-of-range number falls back to the shipped default for that field
 * alone. A settings row that cannot be parsed must not take the booking
 * calendar down with it.
 */
export function parseSchedulingSettings(raw: string | null | undefined): SchedulingSettings {
  const defaults = schedulingDefaults();
  let parsed: Record<string, unknown> = {};
  try {
    const value: unknown = raw ? JSON.parse(raw) : {};
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      parsed = value as Record<string, unknown>;
    }
  } catch {
    return defaults;
  }

  const out: SchedulingSettings = { ...defaults };
  for (const field of SCHEDULING_FIELDS) {
    out[field.key] = clampSchedulingField(field.key, parsed[field.key], defaults[field.key]);
  }

  const overrides: DayCapOverride[] = [];
  const rawOverrides = Array.isArray(parsed['dayCapOverrides']) ? parsed['dayCapOverrides'] : [];
  for (const row of rawOverrides as Array<Record<string, unknown>>) {
    const repId = typeof row?.['repId'] === 'string' ? row['repId'] : '';
    const date = row?.['date'];
    if (!repId || !isDate(date)) continue;
    // Last write wins for a duplicate rep+date, so the stored list can never
    // hold two rows that disagree about the same day.
    const key = `${repId}|${date}`;
    const existing = overrides.findIndex((o) => `${o.repId}|${o.date}` === key);
    if (existing >= 0) overrides.splice(existing, 1);
    overrides.push({
      repId,
      date,
      maxBookings: clampSchedulingField(
        'maxBookingsPerRepPerDay',
        row?.['maxBookings'],
        out.maxBookingsPerRepPerDay
      ),
    });
  }
  out.dayCapOverrides = overrides.slice(-MAX_DAY_CAP_OVERRIDES);
  return out;
}

/**
 * Drop exceptions for dates that have already passed.
 *
 * Called on save rather than on read: an expired row changes nothing about
 * today's availability, so pruning it is housekeeping, not correctness — and
 * doing it on read would make a GET write.
 */
export function pruneExpiredOverrides(
  overrides: DayCapOverride[],
  today: string
): DayCapOverride[] {
  return overrides.filter((o) => o.date >= today);
}

/**
 * The program a booking should actually be computed against.
 *
 * Returns a new object — program configs are module-level constants shared by
 * every request, and mutating one would leak an admin's setting into whatever
 * else is in flight.
 */
export function applySchedulingSettings<T extends ProgramConfig>(
  program: T,
  settings: SchedulingSettings
): T {
  return {
    ...program,
    maxBookingsPerRepPerDay: settings.maxBookingsPerRepPerDay,
    primaryRepPrimingBookings: settings.primaryRepPrimingBookings,
    maxSameDayTravelKm: settings.maxSameDayTravelKm,
    leadTimeHours: settings.leadTimeHours,
    bookingHorizonDays: settings.bookingHorizonDays,
  };
}

/**
 * Per-rep, per-date cap lookup for the scheduling rules.
 *
 * Returns undefined when there are no exceptions at all, so the flat
 * `maxBookingsPerRepPerDay` path stays exactly what it was rather than being
 * routed through a function that always answers the same number.
 */
export function dayCapResolver(
  settings: SchedulingSettings
): ((repId: string, date: string) => number) | undefined {
  if (settings.dayCapOverrides.length === 0) return undefined;
  const byKey = new Map(
    settings.dayCapOverrides.map((o) => [`${o.repId}|${o.date}`, o.maxBookings])
  );
  return (repId, date) => byKey.get(`${repId}|${date}`) ?? settings.maxBookingsPerRepPerDay;
}
