// ─── Availability and slot rules ──────────────────────────────────────────────
// Pure functions only — no database, no clock, no timezone surprises. Everything
// takes its inputs explicitly so the rules are unit-testable and identical on the
// server and in tests.
//
// Rules encoded here:
//   * Both reps work 7 days, 10:00–20:00 Ontario time.
//   * Fixed starts 10/12/14/16/18. Each reserves 120 minutes, so five
//     non-overlapping blocks exactly fill the day and travel buffer is implicit.
//   * 24-hour minimum lead time, 14-day rolling horizon.
//   * Per-rep, per-date scheduling-area lock: the first appointment assigned to a
//     rep on a date fixes that rep's area for the whole date. All of that rep's
//     appointments that date must agree on one area.
//   * Reps are independent — one may be locked to HAMILTON while the other is
//     locked to SIMCOE on the same date.

import type { SchedulingArea } from './program-config.js';

/** Statuses that still occupy the calendar. */
const ACTIVE_STATUSES = new Set(['scheduled', 'confirmed', 'rescheduled', 'completed']);

export type BookedAppointment = {
  assignedRepId: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:MM (24h)
  durationMinutes: number;
  schedulingArea: SchedulingArea | null;
  status: string;
  /** Property coordinates, when known. Drives the same-day travel radius. */
  latitude?: number | null;
  longitude?: number | null;
  /** Fallback for proximity when coordinates are missing. */
  city?: string | null;
};

/** A rep, as the assignment rules see them. Never a name — ordering is data. */
export type BookableRep = {
  id: string;
  /** Lower goes first. Ties fall back to a stable id sort. */
  bookingPriority: number;
};

/**
 * Where a booking is. Coordinates may be absent (unverified address, or a
 * hand-entered portal booking), in which case city is the proximity signal.
 */
export type Coordinates = {
  latitude?: number | null;
  longitude?: number | null;
  city?: string | null;
};

/** Generic so narrowing intersects rather than replacing the source type. */
const hasCoords = <T extends { latitude?: number | null; longitude?: number | null }>(
  v: T | null | undefined
): v is T & { latitude: number; longitude: number } =>
  typeof v?.latitude === 'number' && Number.isFinite(v.latitude) &&
  typeof v?.longitude === 'number' && Number.isFinite(v.longitude);

export type Slot = { date: string; time: string };

export function isActive(a: Pick<BookedAppointment, 'status'>): boolean {
  return ACTIVE_STATUSES.has(a.status);
}

/** Minutes since midnight for "HH:MM", or null when malformed. */
export function minutesOfDay(time: string): number | null {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return null;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Half-open interval overlap: [aStart, aStart+aDur) vs [bStart, bStart+bDur). */
export function intervalsOverlap(
  aStart: number,
  aDuration: number,
  bStart: number,
  bDuration: number
): boolean {
  return aStart < bStart + bDuration && bStart < aStart + aDuration;
}

/** Does a proposed booking collide with any of a rep's existing same-day blocks? */
export function collidesWithExisting(
  proposedTime: string,
  proposedDuration: number,
  sameDayAppointments: BookedAppointment[]
): boolean {
  const start = minutesOfDay(proposedTime);
  if (start === null) return true; // malformed input is never bookable
  return sameDayAppointments.filter(isActive).some((a) => {
    const existingStart = minutesOfDay(a.appointmentTime);
    if (existingStart === null) return true; // unparseable existing row blocks the slot
    return intervalsOverlap(start, proposedDuration, existingStart, a.durationMinutes);
  });
}

export type AreaLock =
  | { area: SchedulingArea; conflict: false }
  | { area: null; conflict: false }
  | { area: null; conflict: true };

/**
 * The rep's scheduling-area lock for a date, derived from their existing
 * appointments. `conflict: true` means the stored rows already disagree — the rep
 * is then treated as unavailable for that whole date rather than guessed at.
 */
export function deriveAreaLock(sameDayAppointments: BookedAppointment[]): AreaLock {
  const areas = new Set(
    sameDayAppointments
      .filter(isActive)
      .map((a) => a.schedulingArea)
      .filter((a): a is SchedulingArea => Boolean(a))
  );
  if (areas.size === 0) return { area: null, conflict: false };
  if (areas.size === 1) return { area: [...areas][0], conflict: false };
  return { area: null, conflict: true };
}

/** May this rep take work in `area` on this date? */
export function repEligibleForArea(
  sameDayAppointments: BookedAppointment[],
  area: SchedulingArea
): boolean {
  const lock = deriveAreaLock(sameDayAppointments);
  if (lock.conflict) return false;
  return lock.area === null || lock.area === area;
}

/** Fixed starts this rep still has free on a date. */
export function freeStartsForRep(
  sameDayAppointments: BookedAppointment[],
  slotStartTimes: string[],
  reservationMinutes: number
): string[] {
  return slotStartTimes.filter(
    (time) => !collidesWithExisting(time, reservationMinutes, sameDayAppointments)
  );
}

// ─── Same-day travel radius ───────────────────────────────────────────────────

const EARTH_RADIUS_KM = 6371;

/** Great-circle distance in km. */
export function haversineKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

const sameCity = (a?: string | null, b?: string | null) =>
  Boolean(a && b && a.trim().toLowerCase() === b.trim().toLowerCase());

/**
 * Would adding this property to a rep's day leave them driving too far between
 * visits?
 *
 * Coordinates are compared directly. When either side lacks them — a portal
 * booking entered by hand, say — we fall back to city equality rather than
 * blocking the slot: refusing to offer times because of missing legacy data
 * would be a worse failure than an occasional long drive, and public bookings
 * always carry coordinates from Places.
 */
export function withinTravelRadius(
  destination: Coordinates | null,
  sameDayAppointments: BookedAppointment[],
  maxKm: number
): boolean {
  const existing = sameDayAppointments.filter(isActive);
  if (existing.length === 0) return true; // a free day imposes no constraint
  if (!destination) return true; // unknown destination ⇒ don't block

  return existing.every((appointment) => {
    // Both sides geocoded — measure it.
    if (hasCoords(destination) && hasCoords(appointment)) {
      return haversineKm(destination, appointment) <= maxKm;
    }
    // Otherwise same-city is the best signal available. Never block on missing
    // data alone: an unbookable day is a worse outcome than an occasional drive.
    if (appointment.city && destination.city) return sameCity(appointment.city, destination.city);
    return true;
  });
}

// ─── Calendar / clock helpers ─────────────────────────────────────────────────

const TORONTO = 'America/Toronto';

/** "YYYY-MM-DDTHH:MM" wall-clock time in Ontario for an instant. */
export function torontoWallClock(instant: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TORONTO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(instant);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  // Intl can render midnight as "24"; normalise it.
  const hour = get('hour') === '24' ? '00' : get('hour');
  return `${get('year')}-${get('month')}-${get('day')}T${hour}:${get('minute')}`;
}

/** Add whole hours to a "YYYY-MM-DDTHH:MM" wall-clock string. */
export function addWallHours(wall: string, hours: number): string {
  const [datePart, timePart] = wall.split('T');
  const [y, mo, d] = datePart.split('-').map(Number);
  const [h, mi] = timePart.split(':').map(Number);
  const anchor = Date.UTC(y, mo - 1, d, h + hours, mi);
  const dt = new Date(anchor);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${dt.getUTCFullYear()}-${p(dt.getUTCMonth() + 1)}-${p(dt.getUTCDate())}T${p(dt.getUTCHours())}:${p(dt.getUTCMinutes())}`;
}

/** `count` consecutive calendar dates starting at `startDate` (pure calendar math). */
export function dateRange(startDate: string, count: number): string[] {
  const [y, mo, d] = startDate.split('-').map(Number);
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const dt = new Date(Date.UTC(y, mo - 1, d + i));
    const p = (n: number) => String(n).padStart(2, '0');
    out.push(`${dt.getUTCFullYear()}-${p(dt.getUTCMonth() + 1)}-${p(dt.getUTCDate())}`);
  }
  return out;
}

// ─── Availability ─────────────────────────────────────────────────────────────

export type AvailabilityInput = {
  /** Reps eligible for public booking, with their assignment order. */
  reps: BookableRep[];
  /** Every active appointment for those reps inside the window. */
  appointments: BookedAppointment[];
  /** "repId|YYYY-MM-DD" keys. */
  daysOff: Set<string>;
  area: SchedulingArea;
  slotStartTimes: string[];
  reservationMinutes: number;
  leadTimeHours: number;
  bookingHorizonDays: number;
  maxBookingsPerRepPerDay: number;
  primaryRepPrimingBookings: number;
  maxSameDayTravelKm: number;
  /** Where this booking would be. Null when the address wasn't geocoded. */
  destination: Coordinates | null;
  /** Ontario wall clock "YYYY-MM-DDTHH:MM". Injected so tests are deterministic. */
  nowWallToronto: string;
};

function sameDay(
  appointments: BookedAppointment[],
  repId: string,
  date: string
): BookedAppointment[] {
  return appointments.filter((a) => a.assignedRepId === repId && a.appointmentDate === date);
}

/**
 * Reps that could take `area` at `date`/`time`, before any priority ordering.
 *
 * Every constraint that can disqualify a rep lives here, so availability and
 * booking can never disagree about who is eligible.
 */
export function eligibleRepsForSlot(input: AvailabilityInput, date: string, time: string): string[] {
  const {
    reps, appointments, daysOff, area, reservationMinutes,
    maxBookingsPerRepPerDay, maxSameDayTravelKm, destination,
  } = input;

  return reps
    .filter((rep) => {
      if (daysOff.has(`${rep.id}|${date}`)) return false;
      const day = sameDay(appointments, rep.id, date);
      // Daily cap — a rep at capacity is done for the day regardless of gaps.
      if (day.filter(isActive).length >= maxBookingsPerRepPerDay) return false;
      if (!repEligibleForArea(day, area)) return false;
      if (collidesWithExisting(time, reservationMinutes, day)) return false;
      // Keep a rep's day geographically tight.
      return withinTravelRadius(destination, day, maxSameDayTravelKm);
    })
    .map((rep) => rep.id);
}

/**
 * Slots offered to the homeowner: the union across eligible reps, deduplicated,
 * carrying no representative identity and no booked counts.
 */
export function computeAvailability(input: AvailabilityInput): Slot[] {
  const earliestWall = addWallHours(input.nowWallToronto, input.leadTimeHours);
  const startDate = input.nowWallToronto.slice(0, 10);
  const dates = dateRange(startDate, input.bookingHorizonDays + 1);

  const slots: Slot[] = [];
  for (const date of dates) {
    for (const time of input.slotStartTimes) {
      if (`${date}T${time}` < earliestWall) continue; // inside the lead-time floor
      if (eligibleRepsForSlot(input, date, time).length > 0) slots.push({ date, time });
    }
  }
  return slots;
}

/**
 * Which rep takes the booking.
 *
 * Two phases, in this order:
 *
 *  1. PRIMING — while the highest-priority rep has fewer than
 *     `primingBookings` visits that date, they take everything. This keeps the
 *     preferred rep's day genuinely full rather than half-filling two calendars.
 *  2. BALANCING — after that, the fewest-booked eligible rep wins, with ties
 *     broken by priority order. The lower-priority rep therefore catches up
 *     before the preferred rep is topped up again.
 *
 * With priming = 2 and a cap of 3, an empty day fills:
 *   primary, primary, secondary, secondary, primary, secondary, then full.
 *
 * Priority comes from the rep records, never from names.
 */
export function chooseRep(
  candidates: string[],
  reps: BookableRep[],
  appointments: BookedAppointment[],
  date: string,
  primingBookings: number
): string | null {
  if (candidates.length === 0) return null;

  const byPriority = [...reps].sort(
    (a, b) => a.bookingPriority - b.bookingPriority || a.id.localeCompare(b.id)
  );
  const rank = new Map(byPriority.map((rep, index) => [rep.id, index]));
  const load = (repId: string) => sameDay(appointments, repId, date).filter(isActive).length;

  // Phase 1 — prime the top-priority rep, provided they are actually eligible.
  const primary = byPriority[0];
  if (primary && candidates.includes(primary.id) && load(primary.id) < primingBookings) {
    return primary.id;
  }

  // Phase 2 — fewest booked, ties to the higher-priority rep.
  return [...candidates].sort(
    (a, b) =>
      load(a) - load(b) ||
      (rank.get(a) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b) ?? Number.MAX_SAFE_INTEGER) ||
      a.localeCompare(b)
  )[0];
}
