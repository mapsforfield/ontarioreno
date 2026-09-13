import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_DAY_CAP_OVERRIDES,
  applySchedulingSettings,
  dayCapResolver,
  parseSchedulingSettings,
  pruneExpiredOverrides,
  schedulingDefaults,
} from './scheduling-settings.ts';
import { SHARED_SCHEDULING, programByKey } from './program-config.ts';
import { eligibleRepsForSlot, type AvailabilityInput } from './scheduling.ts';

// ─── Defaults ─────────────────────────────────────────────────────────────────

test('an absent settings row means exactly what the code ships with', () => {
  const settings = parseSchedulingSettings(null);
  assert.equal(settings.maxBookingsPerRepPerDay, SHARED_SCHEDULING.maxBookingsPerRepPerDay);
  assert.equal(settings.primaryRepPrimingBookings, SHARED_SCHEDULING.primaryRepPrimingBookings);
  assert.equal(settings.maxSameDayTravelKm, SHARED_SCHEDULING.maxSameDayTravelKm);
  assert.equal(settings.leadTimeHours, SHARED_SCHEDULING.leadTimeHours);
  assert.equal(settings.bookingHorizonDays, SHARED_SCHEDULING.bookingHorizonDays);
  assert.deepEqual(settings.dayCapOverrides, []);
});

test('a corrupt settings row falls back rather than taking the calendar down', () => {
  // The booking calendar must survive a bad row. Silence here is the feature.
  for (const raw of ['not json', '[]', 'null', '"3"', '']) {
    assert.deepEqual(parseSchedulingSettings(raw), schedulingDefaults(), `raw: ${raw}`);
  }
});

test('a field that is missing or nonsense falls back on its own, not with the others', () => {
  const settings = parseSchedulingSettings(
    JSON.stringify({ maxBookingsPerRepPerDay: 5, leadTimeHours: 'soon' })
  );
  assert.equal(settings.maxBookingsPerRepPerDay, 5, 'the good field is kept');
  assert.equal(settings.leadTimeHours, SHARED_SCHEDULING.leadTimeHours, 'the bad one defaults');
  assert.equal(settings.maxSameDayTravelKm, SHARED_SCHEDULING.maxSameDayTravelKm);
});

// ─── Bounds ───────────────────────────────────────────────────────────────────

test('out-of-range numbers are clamped, not accepted and not rejected', () => {
  const high = parseSchedulingSettings(
    JSON.stringify({ maxBookingsPerRepPerDay: 99, maxSameDayTravelKm: 5000, bookingHorizonDays: 900 })
  );
  assert.equal(high.maxBookingsPerRepPerDay, 8);
  assert.equal(high.maxSameDayTravelKm, 200);
  assert.equal(high.bookingHorizonDays, 60);

  // A cap of zero would silently close the calendar for everyone, which is not
  // a setting anyone means to type.
  const low = parseSchedulingSettings(
    JSON.stringify({ maxBookingsPerRepPerDay: 0, maxSameDayTravelKm: -4, bookingHorizonDays: 0 })
  );
  assert.equal(low.maxBookingsPerRepPerDay, 1);
  assert.equal(low.maxSameDayTravelKm, 1);
  assert.equal(low.bookingHorizonDays, 1);
});

test('priming may be zero — that is "no priming", a real choice', () => {
  assert.equal(parseSchedulingSettings(JSON.stringify({ primaryRepPrimingBookings: 0 })).primaryRepPrimingBookings, 0);
});

test('lead time may be zero — same-day bookings are a deliberate setting', () => {
  assert.equal(parseSchedulingSettings(JSON.stringify({ leadTimeHours: 0 })).leadTimeHours, 0);
});

// ─── Day-cap exceptions ───────────────────────────────────────────────────────

test('malformed exception rows are dropped, good ones beside them survive', () => {
  const settings = parseSchedulingSettings(
    JSON.stringify({
      dayCapOverrides: [
        { repId: 'rep-1', date: '2026-09-14', maxBookings: 4 },
        { repId: '', date: '2026-09-14', maxBookings: 4 },
        { repId: 'rep-2', date: 'tomorrow', maxBookings: 4 },
        { repId: 'rep-3', maxBookings: 4 },
        'nonsense',
      ],
    })
  );
  assert.deepEqual(settings.dayCapOverrides, [{ repId: 'rep-1', date: '2026-09-14', maxBookings: 4 }]);
});

test('the same rep and date cannot end up stored twice with different caps', () => {
  const settings = parseSchedulingSettings(
    JSON.stringify({
      dayCapOverrides: [
        { repId: 'rep-1', date: '2026-09-14', maxBookings: 4 },
        { repId: 'rep-1', date: '2026-09-14', maxBookings: 6 },
      ],
    })
  );
  assert.equal(settings.dayCapOverrides.length, 1);
  assert.equal(settings.dayCapOverrides[0].maxBookings, 6, 'last write wins');
});

test('the exception list is capped so a settings read stays cheap', () => {
  const many = Array.from({ length: MAX_DAY_CAP_OVERRIDES + 50 }, (_, i) => ({
    repId: `rep-${i}`,
    date: '2026-09-14',
    maxBookings: 4,
  }));
  assert.equal(parseSchedulingSettings(JSON.stringify({ dayCapOverrides: many })).dayCapOverrides.length, MAX_DAY_CAP_OVERRIDES);
});

test('pruning drops yesterday and keeps today', () => {
  const rows = [
    { repId: 'rep-1', date: '2026-09-12', maxBookings: 4 },
    { repId: 'rep-1', date: '2026-09-13', maxBookings: 4 },
    { repId: 'rep-1', date: '2026-09-14', maxBookings: 4 },
  ];
  assert.deepEqual(
    pruneExpiredOverrides(rows, '2026-09-13').map((o) => o.date),
    ['2026-09-13', '2026-09-14'],
    "today's exception is still in force for the rest of today"
  );
});

test('with no exceptions there is no resolver at all — the flat cap path is untouched', () => {
  assert.equal(dayCapResolver(schedulingDefaults()), undefined);
});

test('the resolver answers the exception for its one rep-date and the global cap everywhere else', () => {
  const settings = { ...schedulingDefaults(), maxBookingsPerRepPerDay: 3, dayCapOverrides: [
    { repId: 'steven', date: '2026-09-14', maxBookings: 4 },
  ] };
  const cap = dayCapResolver(settings)!;
  assert.equal(cap('steven', '2026-09-14'), 4, 'the rep on the day');
  assert.equal(cap('steven', '2026-09-15'), 3, 'the same rep the next day');
  assert.equal(cap('keven', '2026-09-14'), 3, 'the other rep on the same day');
});

// ─── Applying to a program ────────────────────────────────────────────────────

test('applying settings never mutates the shared program constant', () => {
  const program = programByKey('hamilton-adu-grant');
  assert.ok(program, 'the Hamilton program should exist');
  const before = program.maxBookingsPerRepPerDay;
  const patched = applySchedulingSettings(program, { ...schedulingDefaults(), maxBookingsPerRepPerDay: 6 });
  assert.equal(patched.maxBookingsPerRepPerDay, 6);
  assert.equal(program.maxBookingsPerRepPerDay, before, 'the module-level config is unchanged');
  assert.equal(patched.key, program.key, 'everything else comes through untouched');
  assert.equal(patched.consultationMode, program.consultationMode);
});

// ─── The rule the whole feature exists for ────────────────────────────────────

const REPS = [
  { id: 'steven', bookingPriority: 1 },
  { id: 'keven', bookingPriority: 2 },
];

function visit(repId: string, time: string) {
  return {
    assignedRepId: repId,
    appointmentDate: '2026-09-14',
    appointmentTime: time,
    durationMinutes: 120,
    schedulingArea: 'HAMILTON' as const,
    status: 'scheduled',
    latitude: 43.25,
    longitude: -79.87,
    city: 'Hamilton',
  };
}

function input(overrides: Partial<AvailabilityInput>): AvailabilityInput {
  return {
    reps: REPS,
    appointments: [visit('steven', '14:00'), visit('steven', '16:00'), visit('steven', '18:00')],
    // Keven is off, which is the situation that creates the need in the first place.
    daysOff: new Set(['keven|2026-09-14']),
    area: 'HAMILTON',
    slotStartTimes: ['10:00', '12:00', '14:00', '16:00', '18:00'],
    reservationMinutes: 120,
    leadTimeHours: 24,
    bookingHorizonDays: 14,
    maxBookingsPerRepPerDay: 3,
    primaryRepPrimingBookings: 2,
    maxSameDayTravelKm: 10,
    destination: { latitude: 43.25, longitude: -79.87, city: 'Hamilton' },
    nowWallToronto: '2026-09-13T09:00',
    ...overrides,
  };
}

test('at the normal cap a rep with three visits is done for the day', () => {
  assert.deepEqual(eligibleRepsForSlot(input({}), '2026-09-14', '10:00'), []);
});

test('a one-day exception opens the fourth slot for that rep on that date', () => {
  const settings = { ...schedulingDefaults(), dayCapOverrides: [
    { repId: 'steven', date: '2026-09-14', maxBookings: 4 },
  ] };
  const withException = input({ dayCapFor: dayCapResolver(settings) });
  assert.deepEqual(
    eligibleRepsForSlot(withException, '2026-09-14', '10:00'),
    ['steven'],
    'the 10am the rep phoned in about'
  );
  assert.deepEqual(eligibleRepsForSlot(withException, '2026-09-14', '12:00'), ['steven']);
});

test('the exception does not leak into the next day', () => {
  const settings = { ...schedulingDefaults(), dayCapOverrides: [
    { repId: 'steven', date: '2026-09-14', maxBookings: 4 },
  ] };
  const nextDay = input({
    dayCapFor: dayCapResolver(settings),
    appointments: [
      { ...visit('steven', '14:00'), appointmentDate: '2026-09-15' },
      { ...visit('steven', '16:00'), appointmentDate: '2026-09-15' },
      { ...visit('steven', '18:00'), appointmentDate: '2026-09-15' },
    ],
    daysOff: new Set(['keven|2026-09-15']),
  });
  assert.deepEqual(eligibleRepsForSlot(nextDay, '2026-09-15', '10:00'), []);
});

test('a fifth booking is still refused once the exception of four is used up', () => {
  const settings = { ...schedulingDefaults(), dayCapOverrides: [
    { repId: 'steven', date: '2026-09-14', maxBookings: 4 },
  ] };
  const full = input({
    dayCapFor: dayCapResolver(settings),
    appointments: [
      visit('steven', '10:00'),
      visit('steven', '14:00'),
      visit('steven', '16:00'),
      visit('steven', '18:00'),
    ],
  });
  assert.deepEqual(eligibleRepsForSlot(full, '2026-09-14', '12:00'), []);
});

test('an exception cannot reach past a day off — that rule still holds', () => {
  const settings = { ...schedulingDefaults(), dayCapOverrides: [
    { repId: 'keven', date: '2026-09-14', maxBookings: 6 },
  ] };
  assert.deepEqual(
    eligibleRepsForSlot(input({ dayCapFor: dayCapResolver(settings) }), '2026-09-14', '10:00'),
    [],
    'a rep who is off is off, whatever their cap says'
  );
});

test('a remote consultation is still exempt from the cap entirely', () => {
  // The exception layer must not become a second place that decides what a
  // remote booking is measured against. It is measured against nothing.
  const full = input({
    appointments: [visit('steven', '10:00'), visit('steven', '14:00'), visit('steven', '16:00')],
    destinationIsRemote: true,
  });
  assert.deepEqual(eligibleRepsForSlot(full, '2026-09-14', '12:00'), ['steven']);
});
