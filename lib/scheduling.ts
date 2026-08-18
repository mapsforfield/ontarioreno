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
//   * ONTARIO is exempt from that lock in both directions: it is a program
//     bucket, not a place. The same-day travel radius is what keeps such a day
//     drivable, and it applies to every booking regardless of area.
//   * REMOTE bookings are exempt from all of it. See below.
//
// ─── Remote consultations ─────────────────────────────────────────────────────
// Every rule in this file exists to keep a rep's DRIVING day coherent. A remote
// consultation involves no driving, so none of them should apply to it — and,
// just as importantly, it must not apply any of them to anyone else.
//
// A remote booking is therefore inert in both directions:
//   * it never anchors the travel radius, and is never measured against it
//   * it neither sets nor respects the scheduling-area lock
//   * it does not consume a fixed start, so it cannot remove a slot
//   * it does not count toward the daily cap or toward rep assignment weight
//
// This is deliberate and is the point of the feature, not an oversight. One
// far-away lead used to anchor a rep's entire date on a city they were never
// going to drive to, which handed the rest of that day's leads to the other
// rep. See lib/remote-consultation.ts for which cities these are and why.

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
  /**
   * True when this is a video/phone consultation rather than a site visit.
   * Such a row is invisible to every rule in this file — see the header.
   * Optional and defaulted false, so a legacy row with no column is in-person,
   * which is exactly what it was before this field existed.
   */
  remoteConsultation?: boolean | null;
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

/** A booking someone has to drive to. The only kind these rules constrain. */
export function isInPerson(a: Pick<BookedAppointment, 'remoteConsultation'>): boolean {
  return a.remoteConsultation !== true;
}

/**
 * The rows a rep's day is actually built from: active AND in-person.
 *
 * Every constraint funnels through here, so "a remote booking constrains
 * nothing" is one filter rather than a rule repeated in five places that can
 * drift apart.
 */
export function constrainingAppointments(
  appointments: BookedAppointment[]
): BookedAppointment[] {
  return appointments.filter((a) => isActive(a) && isInPerson(a));
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
  return constrainingAppointments(sameDayAppointments).some((a) => {
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
    // Remote bookings are dropped here as well as everywhere else: a call to
    // Windsor says nothing about where the rep's van is, so letting it set the
    // day's area would strand them exactly as an ONTARIO booking would.
    constrainingAppointments(sameDayAppointments)
      .map((a) => a.schedulingArea)
      .filter((a): a is SchedulingArea => Boolean(a))
      // ONTARIO never locks a day. It is not a place — it is the bucket for
      // programs with no municipal boundary, so it carries no information about
      // where the rep actually is. What keeps their day drivable is the travel
      // radius below, measured between real coordinates, which constrains an
      // ONTARIO booking exactly as tightly as a Hamilton one. Letting it lock
      // would strand a rep: one province-wide booking at 10am would refuse
      // every other program for the rest of the day, including a property two
      // kilometres away.
      .filter((a) => a !== 'ONTARIO')
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
  // The mirror of the filter in deriveAreaLock: a province-wide booking is not
  // blocked by a rep's existing municipal lock either. Both directions have to
  // agree, or the rule would be asymmetric — a Hamilton visit could be added to
  // an ONTARIO day but not the reverse, purely by ordering.
  if (area === 'ONTARIO') return true;
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

// ─── Time-earned travel allowance ─────────────────────────────────────────────
//
// The flat radius alone was costing real bookings. It compared a candidate
// against EVERY appointment in the rep's day at one fixed distance, taking no
// account of how much time sat between them — so a single 10:00 booking in
// Brampton closed that rep's whole calendar to anything more than 10 km away,
// right through to 20:00, despite the slot grid leaving 75 minutes of driving
// time between consecutive visits and over four hours between the ends of it.
//
// A gap is drivable distance. These constants turn one into the other.

/**
 * Assumed average door-to-door speed. Deliberately conservative: this is
 * suburban arterial driving between appointments, not highway cruising, and an
 * optimistic figure here shows up as a rep arriving late to a homeowner.
 */
const AVERAGE_KM_PER_HOUR = 40;

/**
 * Taken off every gap before it buys any distance — parking, finding the door,
 * a visit that runs a few minutes long. A gap smaller than this earns nothing.
 */
const TRAVEL_BUFFER_MINUTES = 15;

/**
 * Roads are not straight lines. Distances here are great-circle, so a real
 * drive runs roughly a third longer; without this, an allowance derived from
 * driving TIME would quietly authorise about 30% more driving than it claims.
 */
const ROAD_DETOUR_FACTOR = 1.3;

/**
 * Hard ceiling, whatever the gap. Six idle hours are arithmetically worth a
 * 240 km drive, which is not a working day — past this point the gap has
 * stopped being spare capacity and started being an empty schedule.
 */
const MAX_TRAVEL_ALLOWANCE_KM = 100;

/**
 * How far apart two of a rep's visits may sit, given the time between them.
 *
 * Returns kilometres of REAL ROAD distance. Compare against a great-circle
 * measurement only after applying ROAD_DETOUR_FACTOR.
 */
export function travelAllowanceKm(gapMinutes: number, visitMinutes: number): number {
  // Start-to-start minus the time actually spent inside the first property.
  //
  // Deliberately NOT `durationMinutes` from the stored row: a public booking
  // writes the 120-minute RESERVATION there, not the 45-minute visit, so using
  // it would report a zero gap between consecutive slots and this whole
  // allowance would silently evaluate to nothing.
  const usable = gapMinutes - visitMinutes - TRAVEL_BUFFER_MINUTES;
  if (usable <= 0) return 0;
  return Math.min((usable / 60) * AVERAGE_KM_PER_HOUR, MAX_TRAVEL_ALLOWANCE_KM);
}

/**
 * The appointments immediately before and after `startMinutes` in the day.
 *
 * Only these constrain a drive. The old rule measured against all of them,
 * which asked a 16:00 booking to be near a 10:00 one it would never travel
 * to or from — six hours and another visit lie between them.
 */
function adjacentAppointments(
  sameDayAppointments: BookedAppointment[],
  startMinutes: number
): BookedAppointment[] {
  let before: { at: number; appointment: BookedAppointment } | null = null;
  let after: { at: number; appointment: BookedAppointment } | null = null;

  for (const appointment of sameDayAppointments) {
    const at = minutesOfDay(appointment.appointmentTime);
    // An unparseable time cannot be placed in the day, so it is treated as a
    // neighbour rather than skipped — dropping it would silently relax the rule.
    if (at === null) return sameDayAppointments;
    if (at <= startMinutes) {
      if (!before || at > before.at) before = { at, appointment };
    }
    if (at >= startMinutes) {
      if (!after || at < after.at) after = { at, appointment };
    }
  }

  const neighbours: BookedAppointment[] = [];
  if (before) neighbours.push(before.appointment);
  if (after && after.appointment !== before?.appointment) neighbours.push(after.appointment);
  return neighbours;
}

/**
 * Would adding this property to a rep's day leave them driving too far between
 * visits?
 *
 * Coordinates are compared directly. When either side lacks them — a portal
 * booking entered by hand, say — we fall back to city equality rather than
 * blocking the slot: refusing to offer times because of missing legacy data
 * would be a worse failure than an occasional long drive, and public bookings
 * always carry coordinates from Places.
 *
 * Remote consultations sit outside this entirely, in both directions:
 * `destinationIsRemote` means nobody is driving to the new booking, and remote
 * rows are filtered out of the existing day because nobody drove to those
 * either. A rep on a call is wherever they already were.
 *
 * ── The time-earned allowance ──
 * `timing` is optional, and its absence means exactly the old behaviour: flat
 * `maxKm` against every appointment in the day. Supplied, two things change,
 * and BOTH only ever loosen — no pair that satisfies the flat radius can be
 * rejected by the additions, because the flat radius is still checked first and
 * an allowance can only be granted on top of it:
 *
 *   1. Only the time-adjacent appointments are measured. A 10:00 booking has no
 *      bearing on whether 16:00 and 18:00 are drivable from each other.
 *   2. A pair further apart than `maxKm` still passes when the gap between them
 *      pays for the drive. See travelAllowanceKm.
 */
export function withinTravelRadius(
  destination: Coordinates | null,
  sameDayAppointments: BookedAppointment[],
  maxKm: number,
  destinationIsRemote = false,
  timing?: { startTime: string; visitMinutes: number }
): boolean {
  if (destinationIsRemote) return true; // no drive to constrain
  const existing = constrainingAppointments(sameDayAppointments);
  if (existing.length === 0) return true; // a free day imposes no constraint
  if (!destination) return true; // unknown destination ⇒ don't block

  const startMinutes = timing ? minutesOfDay(timing.startTime) : null;
  // Only narrow to the neighbours when the candidate's place in the day is
  // actually known. A malformed time falls back to measuring against the whole
  // day, which is the stricter of the two.
  const measured =
    startMinutes === null ? existing : adjacentAppointments(existing, startMinutes);

  return measured.every((appointment) => {
    // Both sides geocoded — measure it.
    if (hasCoords(destination) && hasCoords(appointment)) {
      const km = haversineKm(destination, appointment);
      if (km <= maxKm) return true; // the original rule, unchanged

      // Too far for the flat radius. Has the gap earned it?
      if (startMinutes === null || !timing) return false;
      const otherStart = minutesOfDay(appointment.appointmentTime);
      if (otherStart === null) return false;
      const allowance = travelAllowanceKm(
        Math.abs(otherStart - startMinutes),
        timing.visitMinutes
      );
      return km * ROAD_DETOUR_FACTOR <= allowance;
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
  /**
   * Time actually spent inside a property, which is what a gap between two
   * starts has to cover before any of it is available for driving.
   *
   * Optional: a caller that predates the time-earned allowance gets the flat
   * radius exactly as before, rather than a silently different rule.
   */
  visitMinutes?: number;
  /** Where this booking would be. Null when the address wasn't geocoded. */
  destination: Coordinates | null;
  /**
   * True when the property sits in a remote-consultation city, so this booking
   * is a call. Optional and defaulted false — a caller that predates the
   * feature books an in-person visit, exactly as it always did.
   */
  destinationIsRemote?: boolean;
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
    destinationIsRemote = false, visitMinutes,
  } = input;

  return reps
    .filter((rep) => {
      // A day off is a day off — the one rule a remote booking still obeys,
      // because it is about the person and not about the driving.
      if (daysOff.has(`${rep.id}|${date}`)) return false;
      // Only in-person work shapes a rep's day. A remote booking neither
      // appears in this list nor is measured against it.
      const day = constrainingAppointments(sameDay(appointments, rep.id, date));

      // A call has no location, no drive and no two-hour block, so none of the
      // rules below describe it. It hovers alongside whatever the rep has on.
      if (destinationIsRemote) return true;

      // Daily cap — a rep at capacity is done for the day regardless of gaps.
      if (day.length >= maxBookingsPerRepPerDay) return false;
      if (!repEligibleForArea(day, area)) return false;
      if (collidesWithExisting(time, reservationMinutes, day)) return false;
      // Keep a rep's day geographically tight — but let a genuine gap in the
      // day pay for a longer drive, which the flat radius alone refused to do.
      return withinTravelRadius(
        destination,
        day,
        maxSameDayTravelKm,
        false,
        typeof visitMinutes === 'number' ? { startTime: time, visitMinutes } : undefined
      );
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
  // Load is IN-PERSON work only. A rep who has taken three calls has given up
  // no driving time, so counting those would push the next site visit onto the
  // other rep — the same capacity loss, arriving by the other door.
  const load = (repId: string) =>
    constrainingAppointments(sameDay(appointments, repId, date)).length;

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
