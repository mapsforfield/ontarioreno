import test from 'node:test';
import assert from 'node:assert/strict';
import {
  chooseRep,
  collidesWithExisting,
  computeAvailability,
  deriveAreaLock,
  eligibleRepsForSlot,
  freeStartsForRep,
  intervalsOverlap,
  repEligibleForArea,
  addWallHours,
  dateRange,
  haversineKm,
  withinTravelRadius,
  type BookedAppointment,
} from './scheduling.ts';
import { HAMILTON_PROGRAM } from './program-config.ts';

const SLOTS = HAMILTON_PROGRAM.slotStartTimes;
const RESERVE = HAMILTON_PROGRAM.reservationMinutes; // 120

const appt = (
  repId: string,
  date: string,
  time: string,
  area: 'HAMILTON' | 'SIMCOE' | 'ONTARIO' | null,
  status = 'scheduled'
): BookedAppointment => ({
  assignedRepId: repId,
  appointmentDate: date,
  appointmentTime: time,
  durationMinutes: RESERVE,
  schedulingArea: area,
  status,
});

const DATE = '2026-08-10';
/** rep-a is the priority rep (lower number goes first). Names never appear. */
const REPS = [
  { id: 'rep-a', bookingPriority: 1 },
  { id: 'rep-b', bookingPriority: 2 },
];
const baseInput = {
  reps: REPS,
  appointments: [] as BookedAppointment[],
  daysOff: new Set<string>(),
  area: 'HAMILTON' as const,
  slotStartTimes: SLOTS,
  reservationMinutes: RESERVE,
  leadTimeHours: HAMILTON_PROGRAM.leadTimeHours,
  bookingHorizonDays: HAMILTON_PROGRAM.bookingHorizonDays,
  maxBookingsPerRepPerDay: HAMILTON_PROGRAM.maxBookingsPerRepPerDay,
  primaryRepPrimingBookings: HAMILTON_PROGRAM.primaryRepPrimingBookings,
  maxSameDayTravelKm: HAMILTON_PROGRAM.maxSameDayTravelKm,
  destination: null,
  nowWallToronto: '2026-08-01T09:00',
};

/** Two Hamilton addresses ~1.5 km apart, and one in Barrie ~85 km away. */
const HAMILTON_A = { latitude: 43.2557, longitude: -79.8711, city: 'Hamilton' };
const HAMILTON_B = { latitude: 43.2460, longitude: -79.8600, city: 'Hamilton' };
const BARRIE = { latitude: 44.3894, longitude: -79.6903, city: 'Barrie' };

// ─── Two-hour block geometry ─────────────────────────────────────────────────

test('the five fixed starts exactly fill 10:00–20:00 with no overlap', () => {
  assert.deepEqual(SLOTS, ['10:00', '12:00', '14:00', '16:00', '18:00']);
  for (let i = 0; i < SLOTS.length - 1; i++) {
    const a = Number(SLOTS[i].slice(0, 2)) * 60;
    const b = Number(SLOTS[i + 1].slice(0, 2)) * 60;
    assert.equal(b - a, RESERVE, 'consecutive starts must be exactly one reservation apart');
  }
  assert.equal(Number(SLOTS[SLOTS.length - 1].slice(0, 2)) * 60 + RESERVE, 20 * 60, 'last block ends at 20:00');
});

test('a booking reserves the full two hours, not the 45-minute visit', () => {
  assert.equal(intervalsOverlap(600, 120, 660, 120), true, '10:00 and 11:00 blocks overlap');
  assert.equal(intervalsOverlap(600, 120, 720, 120), false, '10:00 and 12:00 are adjacent, not overlapping');
  // If we only reserved the 45-minute visit, 10:00 and 11:00 would wrongly both fit.
  assert.equal(intervalsOverlap(600, 45, 660, 45), false);
});

test('an existing block removes exactly its own slot', () => {
  const day = [appt('rep-a', DATE, '12:00', 'HAMILTON')];
  assert.equal(collidesWithExisting('12:00', RESERVE, day), true);
  assert.equal(collidesWithExisting('10:00', RESERVE, day), false);
  assert.equal(collidesWithExisting('14:00', RESERVE, day), false);
  assert.deepEqual(freeStartsForRep(day, SLOTS, RESERVE), ['10:00', '14:00', '16:00', '18:00']);
});

test('cancelled and no-show blocks free the slot again', () => {
  const day = [appt('rep-a', DATE, '12:00', 'HAMILTON', 'cancelled')];
  assert.equal(collidesWithExisting('12:00', RESERVE, day), false);
  assert.equal(deriveAreaLock(day).area, null, 'a cancelled booking must not hold the area lock');
});

// ─── Per-rep, per-date scheduling-area lock ──────────────────────────────────

test('the first appointment of the day locks that rep to its area', () => {
  const day = [appt('rep-a', DATE, '10:00', 'HAMILTON')];
  assert.equal(deriveAreaLock(day).area, 'HAMILTON');
  assert.equal(repEligibleForArea(day, 'HAMILTON'), true);
  assert.equal(repEligibleForArea(day, 'SIMCOE'), false);
});

test('a rep with no bookings that day is eligible for either area', () => {
  assert.equal(repEligibleForArea([], 'HAMILTON'), true);
  assert.equal(repEligibleForArea([], 'SIMCOE'), true);
});

test('a rep may take more work in the SAME area that day', () => {
  const day = [appt('rep-a', DATE, '10:00', 'HAMILTON')];
  const input = { ...baseInput, appointments: day };
  assert.deepEqual(eligibleRepsForSlot(input, DATE, '14:00'), ['rep-a', 'rep-b']);
});

test('rows that disagree on area fail closed rather than guess', () => {
  const day = [appt('rep-a', DATE, '10:00', 'HAMILTON'), appt('rep-a', DATE, '12:00', 'SIMCOE')];
  assert.equal(deriveAreaLock(day).conflict, true);
  assert.equal(repEligibleForArea(day, 'HAMILTON'), false);
  assert.equal(repEligibleForArea(day, 'SIMCOE'), false);
});

test('reps lock independently — one Hamilton, one Simcoe, same date', () => {
  const appointments = [appt('rep-a', DATE, '10:00', 'HAMILTON'), appt('rep-b', DATE, '10:00', 'SIMCOE')];
  const hamiltonAt14 = eligibleRepsForSlot({ ...baseInput, appointments }, DATE, '14:00');
  const simcoeAt14 = eligibleRepsForSlot({ ...baseInput, appointments, area: 'SIMCOE' }, DATE, '14:00');
  assert.deepEqual(hamiltonAt14, ['rep-a'], 'only the Hamilton-locked rep may take Hamilton');
  assert.deepEqual(simcoeAt14, ['rep-b'], 'only the Simcoe-locked rep may take Simcoe');
});

test('a lock on one date does not affect the next date', () => {
  const appointments = [appt('rep-a', DATE, '10:00', 'SIMCOE')];
  const input = { ...baseInput, appointments };
  assert.equal(eligibleRepsForSlot(input, DATE, '14:00').includes('rep-a'), false);
  assert.equal(eligibleRepsForSlot(input, '2026-08-11', '14:00').includes('rep-a'), true);
});

// ─── Availability ────────────────────────────────────────────────────────────

test('days off remove that rep for the whole date', () => {
  const input = { ...baseInput, daysOff: new Set([`rep-a|${DATE}`]) };
  assert.deepEqual(eligibleRepsForSlot(input, DATE, '10:00'), ['rep-b']);
});

test('a slot disappears only when EVERY eligible rep is busy', () => {
  const appointments = [appt('rep-a', DATE, '10:00', 'HAMILTON')];
  let slots = computeAvailability({ ...baseInput, appointments });
  assert.ok(slots.some((s) => s.date === DATE && s.time === '10:00'), 'rep-b still free at 10:00');

  appointments.push(appt('rep-b', DATE, '10:00', 'HAMILTON'));
  slots = computeAvailability({ ...baseInput, appointments });
  assert.equal(slots.some((s) => s.date === DATE && s.time === '10:00'), false, 'both reps busy');
  assert.ok(slots.some((s) => s.date === DATE && s.time === '12:00'), 'other slots remain');
});

test('the 24-hour lead time and 14-day horizon are enforced', () => {
  const slots = computeAvailability({ ...baseInput, nowWallToronto: '2026-08-01T09:00' });
  const dates = [...new Set(slots.map((s) => s.date))].sort();
  assert.equal(dates.includes('2026-08-01'), false, 'today is inside the lead-time floor');
  assert.equal(dates[0], '2026-08-02');
  assert.ok(slots.some((s) => s.date === '2026-08-02' && s.time === '10:00'));
  assert.equal(dates[dates.length - 1], '2026-08-15', '14-day rolling horizon');
});

test('lead time trims part of a day rather than the whole day', () => {
  // 12:30 on the 1st ⇒ earliest is 12:30 on the 2nd, so 10:00/12:00 are gone.
  const slots = computeAvailability({ ...baseInput, nowWallToronto: '2026-08-01T12:30' });
  const second = slots.filter((s) => s.date === '2026-08-02').map((s) => s.time);
  assert.deepEqual(second, ['14:00', '16:00', '18:00']);
});

test('availability exposes no representative identity', () => {
  const slots = computeAvailability(baseInput);
  for (const slot of slots) {
    assert.deepEqual(Object.keys(slot).sort(), ['date', 'time']);
  }
});

test('wall-clock and calendar helpers behave', () => {
  assert.equal(addWallHours('2026-08-01T09:00', 24), '2026-08-02T09:00');
  assert.equal(addWallHours('2026-08-31T23:00', 2), '2026-09-01T01:00');
  assert.deepEqual(dateRange('2026-08-30', 3), ['2026-08-30', '2026-08-31', '2026-09-01']);
});

// ─── Representative assignment ───────────────────────────────────────────────

const PRIMING = HAMILTON_PROGRAM.primaryRepPrimingBookings; // 2
const CAP = HAMILTON_PROGRAM.maxBookingsPerRepPerDay; // 3

/**
 * Fill an empty day one booking at a time and record who each one goes to.
 *
 * Successive homeowners pick different times, so bookings cycle through the
 * slots rather than all contending for 10:00. (Always taking the earliest free
 * slot would model one person booking six times, which is not the scenario and
 * hides the priming rule behind slot collisions.)
 */
function simulateDay(repCount = 2) {
  const reps = REPS.slice(0, repCount);
  const booked: BookedAppointment[] = [];
  const order: Array<string | null> = [];
  // One more attempt than total capacity, so we also observe the day closing.
  for (let i = 0; i < repCount * CAP + 1; i++) {
    const input = { ...baseInput, reps, appointments: booked };
    let picked: string | null = null;
    // Start at this homeowner's preferred time, falling forward if it's gone.
    for (let offset = 0; offset < SLOTS.length; offset++) {
      const time = SLOTS[(i + offset) % SLOTS.length];
      const candidates = eligibleRepsForSlot(input, DATE, time);
      picked = chooseRep(candidates, reps, booked, DATE, PRIMING);
      if (picked) { booked.push(appt(picked, DATE, time, 'HAMILTON')); break; }
    }
    order.push(picked);
    if (!picked) break;
  }
  return order;
}

test('an empty day fills in the exact priority order: A,A,B,B,A,B then closes', () => {
  // Prime the priority rep to 2, then balance on fewest-booked with ties going
  // to priority, capped at 3 each.
  assert.deepEqual(simulateDay(), ['rep-a', 'rep-a', 'rep-b', 'rep-b', 'rep-a', 'rep-b', null]);
});

test('the daily cap is hard — a rep at capacity is skipped entirely', () => {
  const full = [
    appt('rep-a', DATE, '10:00', 'HAMILTON'),
    appt('rep-a', DATE, '12:00', 'HAMILTON'),
    appt('rep-a', DATE, '14:00', 'HAMILTON'),
  ];
  const input = { ...baseInput, appointments: full };
  assert.deepEqual(eligibleRepsForSlot(input, DATE, '16:00'), ['rep-b'], 'rep-a is done for the day');
  assert.equal(full.filter((a) => a.assignedRepId === 'rep-a').length, CAP);
});

test('when every rep is at capacity the day disappears from availability', () => {
  const appointments: BookedAppointment[] = [];
  for (const rep of ['rep-a', 'rep-b']) {
    for (const time of SLOTS.slice(0, CAP)) appointments.push(appt(rep, DATE, time, 'HAMILTON'));
  }
  const slots = computeAvailability({ ...baseInput, appointments });
  assert.equal(slots.some((s) => s.date === DATE), false, 'a fully booked day is not offered');
  assert.ok(slots.some((s) => s.date === '2026-08-11'), 'other dates unaffected');
});

test('priority comes from the records, not the order they arrive in', () => {
  const flipped = [
    { id: 'rep-a', bookingPriority: 5 },
    { id: 'rep-b', bookingPriority: 1 },
  ];
  assert.equal(chooseRep(['rep-a', 'rep-b'], flipped, [], DATE, PRIMING), 'rep-b');
});

test('the priming rep is skipped when they are not eligible for the slot', () => {
  // rep-a on a day off: rep-b takes it despite rep-a being higher priority.
  const input = { ...baseInput, daysOff: new Set([`rep-a|${DATE}`]) };
  const candidates = eligibleRepsForSlot(input, DATE, '10:00');
  assert.deepEqual(candidates, ['rep-b']);
  assert.equal(chooseRep(candidates, REPS, [], DATE, PRIMING), 'rep-b');
});

test('no eligible rep yields no assignment', () => {
  assert.equal(chooseRep([], REPS, [], DATE, PRIMING), null);
});

// ─── Same-day travel radius ──────────────────────────────────────────────────

test('distance is measured correctly', () => {
  assert.ok(haversineKm(HAMILTON_A, HAMILTON_B) < 2, 'two Hamilton points are close');
  assert.ok(haversineKm(HAMILTON_A, BARRIE) > 80, 'Hamilton to Barrie is far');
});

test('a rep already booked nearby can take another nearby visit', () => {
  const day = [{ ...appt('rep-a', DATE, '10:00', 'HAMILTON'), ...HAMILTON_A }];
  assert.equal(withinTravelRadius(HAMILTON_B, day, 10), true);
});

test('a far-away property is handed to the other rep', () => {
  const appointments = [{ ...appt('rep-a', DATE, '10:00', 'HAMILTON'), ...HAMILTON_A }];
  const input = { ...baseInput, appointments, destination: BARRIE };
  // rep-a is anchored in Hamilton; rep-b has a free day so may travel.
  assert.deepEqual(eligibleRepsForSlot(input, DATE, '12:00'), ['rep-b']);
});

test('when BOTH reps are anchored far away, the slot is not offered', () => {
  const appointments = [
    { ...appt('rep-a', DATE, '10:00', 'HAMILTON'), ...HAMILTON_A },
    { ...appt('rep-b', DATE, '10:00', 'HAMILTON'), ...HAMILTON_B },
  ];
  const input = { ...baseInput, appointments, destination: BARRIE };
  assert.deepEqual(eligibleRepsForSlot(input, DATE, '12:00'), []);
  const slots = computeAvailability(input);
  assert.equal(slots.some((s) => s.date === DATE), false, 'the whole day drops out');
});

test('a rep with an empty day can be sent anywhere', () => {
  assert.equal(withinTravelRadius(BARRIE, [], 10), true);
});

test('missing coordinates fall back to city, and never block on absent data', () => {
  const noCoords = [{ ...appt('rep-a', DATE, '10:00', 'HAMILTON'), city: 'Hamilton' }];
  assert.equal(withinTravelRadius({ city: 'Hamilton' }, noCoords, 10), true, 'same city ⇒ near');
  assert.equal(withinTravelRadius({ city: 'Barrie' }, noCoords, 10), false, 'different city ⇒ far');
  // Nothing known at all must not make the day unbookable.
  const unknown = [appt('rep-a', DATE, '10:00', 'HAMILTON')];
  assert.equal(withinTravelRadius(null, unknown, 10), true);
  assert.equal(withinTravelRadius({ city: null }, unknown, 10), true);
});

test('cancelled bookings release both the cap and the travel anchor', () => {
  const day = [{ ...appt('rep-a', DATE, '10:00', 'HAMILTON', 'cancelled'), ...HAMILTON_A }];
  assert.equal(withinTravelRadius(BARRIE, day, 10), true, 'a cancelled visit anchors nothing');
});

// ─── ONTARIO is a program bucket, not a place ────────────────────────────────
// An Ontario-wide program (financing, say) has no municipal boundary, so its
// bookings must not pin a rep's day to a region. Everything below asserts that
// the AREA lock steps aside for it while the TRAVEL radius — the rule that
// actually keeps a day drivable — keeps applying unchanged.

test('an ONTARIO booking never locks a rep to an area', () => {
  const day = [appt('r1', '2026-08-20', '10:00', 'ONTARIO')];
  assert.equal(deriveAreaLock(day).area, null, 'ONTARIO must not become the lock for the day');
  assert.equal(deriveAreaLock(day).conflict, false);
});

test('a rep on an ONTARIO booking can still take municipal work that day', () => {
  const day = [appt('r1', '2026-08-20', '10:00', 'ONTARIO')];
  assert.equal(repEligibleForArea(day, 'HAMILTON'), true);
  assert.equal(repEligibleForArea(day, 'SIMCOE'), true);
});

test('a rep locked to a municipality can still take ONTARIO work', () => {
  // The mirror of the case above. If this direction failed, the rule would
  // depend on which booking happened to come first.
  const day = [appt('r1', '2026-08-20', '10:00', 'HAMILTON')];
  assert.equal(repEligibleForArea(day, 'HAMILTON'), true);
  assert.equal(repEligibleForArea(day, 'SIMCOE'), false, 'municipal lock still binds municipal work');
  assert.equal(repEligibleForArea(day, 'ONTARIO'), true);
});

test('ONTARIO does not rescue a day whose stored rows already conflict', () => {
  const day = [appt('r1', '2026-08-20', '10:00', 'HAMILTON'), appt('r1', '2026-08-20', '12:00', 'SIMCOE')];
  assert.equal(deriveAreaLock(day).conflict, true);
  assert.equal(repEligibleForArea(day, 'ONTARIO'), false, 'a contradictory day stays unavailable');
});

test('the travel radius still binds an ONTARIO booking', () => {
  // The whole justification for exempting ONTARIO from the area lock is that
  // this rule is stricter and geographic. If it ever stopped applying, the
  // exemption would let one rep be sent across the province in a day.
  const brampton = { latitude: 43.7315, longitude: -79.7624, city: 'Brampton' };
  const nearby = { latitude: 43.7000, longitude: -79.7400, city: 'Brampton' };
  const ajax = { latitude: 43.8509, longitude: -79.0204, city: 'Ajax' };
  const day: BookedAppointment[] = [
    { ...appt('r1', '2026-08-20', '10:00', 'ONTARIO'), ...brampton },
  ];
  assert.equal(withinTravelRadius(nearby, day, 10), true, 'a few km away is bookable');
  assert.equal(withinTravelRadius(ajax, day, 10), false, 'across the GTA is not');
});
