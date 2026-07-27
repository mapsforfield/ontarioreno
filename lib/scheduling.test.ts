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
  type BookedAppointment,
} from './scheduling.ts';
import { HAMILTON_PROGRAM } from './program-config.ts';

const SLOTS = HAMILTON_PROGRAM.slotStartTimes;
const RESERVE = HAMILTON_PROGRAM.reservationMinutes; // 120

const appt = (
  repId: string,
  date: string,
  time: string,
  area: 'HAMILTON' | 'SIMCOE' | null,
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
const baseInput = {
  repIds: ['rep-a', 'rep-b'],
  appointments: [] as BookedAppointment[],
  daysOff: new Set<string>(),
  area: 'HAMILTON' as const,
  slotStartTimes: SLOTS,
  reservationMinutes: RESERVE,
  leadTimeHours: HAMILTON_PROGRAM.leadTimeHours,
  bookingHorizonDays: HAMILTON_PROGRAM.bookingHorizonDays,
  nowWallToronto: '2026-08-01T09:00',
};

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

test('assignment spreads load and is deterministic', () => {
  const appointments = [appt('rep-a', DATE, '10:00', 'HAMILTON')];
  assert.equal(chooseRep(['rep-a', 'rep-b'], appointments, DATE), 'rep-b', 'lighter rep wins');
  assert.equal(chooseRep(['rep-a', 'rep-b'], [], DATE), 'rep-a', 'stable tiebreak when equal');
  assert.equal(chooseRep([], [], DATE), null);
});
