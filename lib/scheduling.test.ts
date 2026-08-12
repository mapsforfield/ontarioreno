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
import {
  BASEMENT_FINANCING_PROGRAM,
  BATHROOM_FINANCING_PROGRAM,
  HAMILTON_PROGRAM,
} from './program-config.ts';

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

// ─── Remote consultations hover alongside the driving day ────────────────────
// A property too far to drive to is sold by video or phone. Such a booking must
// be inert in BOTH directions: it constrains nobody, and nothing constrains it.
// The bug it fixes is concrete — one Niagara Falls lead taken as the first
// appointment of a day anchored that rep's travel radius on Niagara Falls, so
// the next three leads were ineligible for them and fell to the other rep. The
// far lead cost no drive time and a whole day of capacity.

/** A booking someone drives to, and the same booking done as a call. */
const remoteAppt = (
  repId: string,
  date: string,
  time: string,
  area: 'HAMILTON' | 'SIMCOE' | 'ONTARIO' | null,
  coords: { latitude: number; longitude: number; city: string }
): BookedAppointment => ({ ...appt(repId, date, time, area), ...coords, remoteConsultation: true });

/** Niagara Falls — well outside the 10 km radius from Hamilton. */
const NIAGARA = { latitude: 43.0896, longitude: -79.0849, city: 'Niagara Falls' };

test('a remote booking never anchors the travel radius', () => {
  const day = [remoteAppt('rep-a', DATE, '16:00', 'ONTARIO', NIAGARA)];
  assert.equal(
    withinTravelRadius(HAMILTON_A, day, 10),
    true,
    'a call to Niagara Falls must not put Hamilton out of range'
  );
});

test('a remote destination is never measured against the radius', () => {
  const day: BookedAppointment[] = [{ ...appt('rep-a', DATE, '10:00', 'HAMILTON'), ...HAMILTON_A }];
  assert.equal(withinTravelRadius(NIAGARA, day, 10, false), false, 'as a site visit: too far');
  assert.equal(withinTravelRadius(NIAGARA, day, 10, true), true, 'as a call: no drive to constrain');
});

test('a remote booking neither sets nor breaks the scheduling-area lock', () => {
  const day = [remoteAppt('rep-a', DATE, '16:00', 'SIMCOE', NIAGARA)];
  assert.equal(deriveAreaLock(day).area, null, 'a call says nothing about where the van is');
  assert.equal(deriveAreaLock(day).conflict, false);
  assert.equal(repEligibleForArea(day, 'HAMILTON'), true);
});

test('a remote booking does not consume a fixed start', () => {
  const day = [remoteAppt('rep-a', DATE, '16:00', 'ONTARIO', NIAGARA)];
  assert.equal(collidesWithExisting('16:00', RESERVE, day), false);
  assert.deepEqual(freeStartsForRep(day, SLOTS, RESERVE), SLOTS, 'every start stays open');
});

test('a remote booking does not count toward the daily cap', () => {
  const day = [
    remoteAppt('rep-a', DATE, '10:00', 'ONTARIO', NIAGARA),
    remoteAppt('rep-a', DATE, '12:00', 'ONTARIO', NIAGARA),
    remoteAppt('rep-a', DATE, '14:00', 'ONTARIO', NIAGARA),
  ];
  const input = { ...baseInput, appointments: day, destination: HAMILTON_A };
  assert.ok(
    eligibleRepsForSlot(input, DATE, '16:00').includes('rep-a'),
    'three calls must not use up a rep’s three site visits'
  );
});

test('a remote booking carries no weight in rep assignment', () => {
  // The priming rep takes the first two visits of a day. If calls counted, two
  // far-away leads would push the next real visit onto the other rep.
  const day = [
    remoteAppt('rep-a', DATE, '10:00', 'ONTARIO', NIAGARA),
    remoteAppt('rep-a', DATE, '12:00', 'ONTARIO', NIAGARA),
  ];
  assert.equal(chooseRep(['rep-a', 'rep-b'], REPS, day, DATE, 2), 'rep-a');
});

test('a remote lead is offered every time, whatever the reps are doing', () => {
  // Nothing about a rep’s driving day can make a call impossible, so the
  // homeowner sees the full calendar and the rep arranges it around their road
  // time. Days off are the one rule that still applies — that is about the
  // person, not the driving.
  const appointments = [
    { ...appt('rep-a', DATE, '10:00', 'HAMILTON'), ...HAMILTON_A },
    { ...appt('rep-b', DATE, '10:00', 'HAMILTON'), ...HAMILTON_B },
  ];
  const input = {
    ...baseInput,
    appointments,
    destination: NIAGARA,
    destinationIsRemote: true,
  };
  assert.deepEqual(eligibleRepsForSlot(input, DATE, '10:00'), ['rep-a', 'rep-b']);

  const bothOff = { ...input, daysOff: new Set([`rep-a|${DATE}`, `rep-b|${DATE}`]) };
  assert.deepEqual(eligibleRepsForSlot(bothOff, DATE, '10:00'), [], 'a day off is still a day off');
});

test('regression: a far-away lead no longer blocks the rest of the rep’s day', () => {
  // The Wednesday that prompted this. The priority rep took the first booking
  // of the day, in Niagara Falls. Every later Hamilton lead then found them
  // ineligible and went to the other rep.
  const asSiteVisit: BookedAppointment[] = [
    { ...appt('rep-a', DATE, '16:00', 'ONTARIO'), ...NIAGARA },
  ];
  const before = { ...baseInput, appointments: asSiteVisit, destination: HAMILTON_A };
  assert.deepEqual(
    eligibleRepsForSlot(before, DATE, '18:00'),
    ['rep-b'],
    'the old behaviour: the priority rep is locked out of their own city'
  );

  const asCall = [remoteAppt('rep-a', DATE, '16:00', 'ONTARIO', NIAGARA)];
  const after = { ...baseInput, appointments: asCall, destination: HAMILTON_A };
  assert.deepEqual(
    eligibleRepsForSlot(after, DATE, '18:00'),
    ['rep-a', 'rep-b'],
    'as a call, the far lead costs the priority rep nothing'
  );
  assert.equal(
    chooseRep(eligibleRepsForSlot(after, DATE, '18:00'), REPS, asCall, DATE, 2),
    'rep-a',
    'and the next Hamilton lead still goes to the priority rep'
  );
});

test('an in-person booking is unchanged by the remote field being absent', () => {
  // Every row written before the column existed reads as false. If that ever
  // flipped, the travel radius would quietly stop applying to real visits.
  const legacy: BookedAppointment[] = [{ ...appt('rep-a', DATE, '10:00', 'HAMILTON'), ...HAMILTON_A }];
  assert.equal(legacy[0].remoteConsultation, undefined);
  assert.equal(withinTravelRadius(BARRIE, legacy, 10), false, 'still too far');
  assert.equal(deriveAreaLock(legacy).area, 'HAMILTON', 'still locks the day');
});

// ─── One rep, one day, every program ─────────────────────────────────────────
//
// The scheduler is program-agnostic on purpose: it is handed a rep's whole day
// and never filters by programKey. That is what makes a rep's calendar a single
// calendar rather than one per offer. These tests pin it, because the failure
// mode is silent and expensive — two programs each believing they own the day
// would double-book a rep into one 45-minute visit twice over, and nobody would
// find out until a homeowner is standing at the door.
//
// They use the BATHROOM program's constants against BASEMENT bookings
// deliberately. Both offers spread SHARED_SCHEDULING, so if a future edit gives
// one program its own starts or its own cap, these are the tests that notice.

test('a basement booking blocks the same start for a bathroom lead', () => {
  const appointments = [
    appt('rep-a', DATE, '10:00', 'ONTARIO'),
    appt('rep-b', DATE, '10:00', 'ONTARIO'),
  ];
  const input = {
    ...baseInput,
    appointments,
    area: 'ONTARIO' as const,
    slotStartTimes: BATHROOM_FINANCING_PROGRAM.slotStartTimes,
    reservationMinutes: BATHROOM_FINANCING_PROGRAM.reservationMinutes,
    maxBookingsPerRepPerDay: BATHROOM_FINANCING_PROGRAM.maxBookingsPerRepPerDay,
  };
  const slots = computeAvailability(input);
  assert.equal(
    slots.some((s) => s.date === DATE && s.time === '10:00'),
    false,
    'both reps are already out on basement visits at 10:00'
  );
  assert.ok(slots.some((s) => s.date === DATE && s.time === '12:00'), 'the rest of the day is still open');
});

test('the daily cap counts a rep’s visits across programs, not per program', () => {
  // The cap protects a rep's day, so three basement visits must exhaust it for
  // a bathroom lead too. A per-program cap would quietly allow six.
  const cap = BATHROOM_FINANCING_PROGRAM.maxBookingsPerRepPerDay;
  const appointments: BookedAppointment[] = [];
  for (const rep of ['rep-a', 'rep-b']) {
    for (const time of SLOTS.slice(0, cap)) appointments.push(appt(rep, DATE, time, 'ONTARIO'));
  }
  const slots = computeAvailability({
    ...baseInput,
    appointments,
    area: 'ONTARIO' as const,
    maxBookingsPerRepPerDay: cap,
  });
  assert.equal(slots.some((s) => s.date === DATE), false, 'the day is full regardless of which offer fills it');
});

test('the travel radius measures a bathroom lead against a basement visit', () => {
  // Neither program locks an area (both are ONTARIO), so the radius is the only
  // thing keeping the drive sane. A rep anchored in Hamilton by a basement
  // visit must not be handed a Barrie bathroom on the same day.
  const appointments = [
    { ...appt('rep-a', DATE, '10:00', 'ONTARIO'), ...HAMILTON_A },
    { ...appt('rep-b', DATE, '10:00', 'ONTARIO'), ...HAMILTON_A },
  ];
  const input = {
    ...baseInput,
    appointments,
    area: 'ONTARIO' as const,
    destination: BARRIE,
    maxSameDayTravelKm: BATHROOM_FINANCING_PROGRAM.maxSameDayTravelKm,
  };
  assert.deepEqual(eligibleRepsForSlot(input, DATE, '12:00'), []);
  // ...and a nearby bathroom on the same day is still fine.
  assert.deepEqual(
    eligibleRepsForSlot({ ...input, destination: HAMILTON_B }, DATE, '12:00'),
    ['rep-a', 'rep-b']
  );
});

test('the two financing offers share one set of scheduling constants', () => {
  // If these ever diverge it is a deliberate act, and it should show up here as
  // a failing test rather than as a rep with two overlapping 10:00 visits.
  for (const field of [
    'visitMinutes',
    'reservationMinutes',
    'leadTimeHours',
    'bookingHorizonDays',
    'maxBookingsPerRepPerDay',
    'primaryRepPrimingBookings',
    'maxSameDayTravelKm',
  ] as const) {
    assert.equal(
      BATHROOM_FINANCING_PROGRAM[field],
      BASEMENT_FINANCING_PROGRAM[field],
      `${field} differs between the basement and bathroom offers`
    );
  }
  assert.deepEqual(
    BATHROOM_FINANCING_PROGRAM.slotStartTimes,
    BASEMENT_FINANCING_PROGRAM.slotStartTimes
  );
});
