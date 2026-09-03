import test from 'node:test';
import assert from 'node:assert/strict';
import { nearestSlots } from './slot-suggestions.ts';
import { computeAvailability, type BookedAppointment } from './scheduling.ts';

// ─── The unlocated calendar, and the swap that repairs it ─────────────────────
//
// The bug this guards, in the words of the homeowner who found it: "it seems
// like it's giving me availability then after telling me it's not available."
//
// He picked Sunday 10am from the calendar-early flow, typed his address, and
// was told the slot had just been taken. Nothing had been taken. The calendar
// on screen 1 is computed before the address is known, so the same-day travel
// radius has nothing to measure and every start looks free — while the booking,
// which does know, could not reach his property from either rep's day.

const REPS = [
  { id: 'keven', bookingPriority: 100 },
  { id: 'steven', bookingPriority: 100 },
];

/** Sunday 2026-09-06, as it actually stood in the calendar that day. */
const SUNDAY: BookedAppointment[] = [
  {
    assignedRepId: 'keven',
    appointmentDate: '2026-09-06',
    appointmentTime: '12:00',
    durationMinutes: 120,
    schedulingArea: 'ONTARIO',
    status: 'scheduled',
    // Woolwich — about 90km from Toronto.
    latitude: 43.4861463,
    longitude: -80.4017771,
    city: 'Woolwich',
    remoteConsultation: false,
  },
  {
    assignedRepId: 'steven',
    appointmentDate: '2026-09-06',
    appointmentTime: '10:00',
    durationMinutes: 60,
    schedulingArea: null,
    latitude: null,
    longitude: null,
    city: 'Brantford',
    status: 'scheduled',
    remoteConsultation: false,
  },
];

const BASE = {
  reps: REPS,
  appointments: SUNDAY,
  daysOff: new Set<string>(),
  area: 'ONTARIO' as const,
  slotStartTimes: ['10:00', '12:00', '14:00', '16:00', '18:00'],
  reservationMinutes: 120,
  leadTimeHours: 24,
  bookingHorizonDays: 1,
  maxBookingsPerRepPerDay: 3,
  primaryRepPrimingBookings: 2,
  maxSameDayTravelKm: 10,
  visitMinutes: 45,
  nowWallToronto: '2026-09-05T08:00',
};

test('the unlocated calendar offers a time the located one cannot honour', () => {
  const unlocated = computeAvailability({ ...BASE, destination: null });
  assert.ok(
    unlocated.some((s) => s.date === '2026-09-06' && s.time === '10:00'),
    'this is what the homeowner is shown before we know the address'
  );

  // The same day, measured from a Toronto property.
  const located = computeAvailability({
    ...BASE,
    destination: { latitude: 43.7, longitude: -79.42, city: 'Toronto' },
  });
  assert.ok(
    !located.some((s) => s.date === '2026-09-06' && s.time === '10:00'),
    'and this is the truth the booking applies'
  );

  // The gap between those two lists is the bug. It cannot be closed by making
  // the first list smaller — nobody has given us an address yet — so it is
  // closed by asking again once they have, one screen before the booking. If
  // this assertion ever fails, that re-check has become unnecessary and the
  // flow can be simplified; until then it is load bearing.
  assert.notDeepEqual(unlocated, located);
});

test('a homeowner whose time is gone is offered the nearest ones, not a list', () => {
  const located = computeAvailability({
    ...BASE,
    bookingHorizonDays: 5,
    destination: { latitude: 43.7, longitude: -79.42, city: 'Toronto' },
  });
  const swaps = nearestSlots(located, { date: '2026-09-06', time: '10:00' });
  assert.ok(swaps.length > 0, 'a swap must be offered whenever anything is bookable');
  assert.ok(swaps.length <= 3, 'three taps, not a calendar');
  for (const s of swaps) {
    assert.ok(
      located.some((l) => l.date === s.date && l.time === s.time),
      'every offered time must be one the booking will actually accept'
    );
  }
});

test('the nearest times are the closest in either direction, day before direction', () => {
  const open = [
    { date: '2026-09-06', time: '14:00' }, // 4h after
    { date: '2026-09-06', time: '18:00' }, // 8h after
    { date: '2026-09-05', time: '18:00' }, // 16h before
    { date: '2026-09-10', time: '10:00' }, // 4 days after
  ];
  assert.deepEqual(nearestSlots(open, { date: '2026-09-06', time: '10:00' }), [
    { date: '2026-09-06', time: '14:00' },
    { date: '2026-09-06', time: '18:00' },
    { date: '2026-09-05', time: '18:00' },
  ]);
});

test('three suggestions are never all the same afternoon', () => {
  const open = [
    { date: '2026-09-06', time: '12:00' },
    { date: '2026-09-06', time: '14:00' },
    { date: '2026-09-06', time: '16:00' },
    { date: '2026-09-07', time: '10:00' },
  ];
  const swaps = nearestSlots(open, { date: '2026-09-06', time: '10:00' });
  // Someone who cannot do Sunday must still have something to say yes to.
  assert.equal(swaps.filter((s) => s.date === '2026-09-06').length, 2);
  assert.deepEqual(swaps[2], { date: '2026-09-07', time: '10:00' });
});
