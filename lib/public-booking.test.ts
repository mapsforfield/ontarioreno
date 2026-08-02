import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bookSlot, generateReference, SYSTEM_BOOKING_USER_ID, type BookingDeps } from './public-booking.ts';
import type { BookedAppointment } from './scheduling.ts';
import { HAMILTON_PROGRAM } from './program-config.ts';

const DATE = '2026-08-10';

const request = (overrides: Record<string, unknown> = {}) => ({
  date: DATE,
  time: '12:00',
  area: 'HAMILTON' as const,
  slotStartTimes: HAMILTON_PROGRAM.slotStartTimes,
  reservationMinutes: HAMILTON_PROGRAM.reservationMinutes,
  leadTimeHours: HAMILTON_PROGRAM.leadTimeHours,
  bookingHorizonDays: HAMILTON_PROGRAM.bookingHorizonDays,
  maxBookingsPerRepPerDay: HAMILTON_PROGRAM.maxBookingsPerRepPerDay,
  primaryRepPrimingBookings: HAMILTON_PROGRAM.primaryRepPrimingBookings,
  maxSameDayTravelKm: HAMILTON_PROGRAM.maxSameDayTravelKm,
  destination: null,
  nowWallToronto: '2026-08-01T09:00',
  programKey: HAMILTON_PROGRAM.key,
  programVersion: HAMILTON_PROGRAM.version,
  lead: {
    id: 'lead-1', name: 'Test Homeowner', phone: '000', email: 'h@example.test',
    address: '1 Test St', city: 'Hamilton', postalCode: 'L8P1A1', projectType: 'secondary_suite',
  },
  ...overrides,
});

/** Deps backed by an in-memory calendar, recording the order of operations. */
function makeDeps(
  seed: BookedAppointment[] = [],
  reps = [
    { id: 'rep-a', bookingPriority: 1 },
    { id: 'rep-b', bookingPriority: 2 },
  ]
) {
  const calls: string[] = [];
  const store = [...seed];
  const deps: BookingDeps = {
    lockDate: async () => { calls.push('lock'); },
    listBookableReps: async () => { calls.push('read:reps'); return reps; },
    listDaysOff: async () => { calls.push('read:daysOff'); return new Set<string>(); },
    listAppointments: async (_ids, d) => {
      calls.push('read:appointments');
      return store.filter((a) => a.appointmentDate === d);
    },
    createAppointment: async ({ repId, request: r }) => {
      calls.push('write');
      store.push({
        assignedRepId: repId, appointmentDate: r.date, appointmentTime: r.time,
        durationMinutes: r.reservationMinutes, schedulingArea: r.area, status: 'scheduled',
      });
      return { id: `appt-${store.length}` };
    },
  };
  return { deps, calls, store };
}

test('a booking succeeds and reserves the full two-hour block', async () => {
  const { deps, store } = makeDeps();
  const result = await bookSlot(deps, request());
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.durationMinutes, 120);
    assert.match(result.publicReference, /^OR-[A-Z2-9]{8}$/);
  }
  assert.equal(store.length, 1);
});

test('ATOMICITY: the date lock is taken before anything is read or written', async () => {
  const { deps, calls } = makeDeps();
  await bookSlot(deps, request());
  assert.equal(calls[0], 'lock', 'lock must come first');
  assert.ok(calls.indexOf('lock') < calls.indexOf('read:appointments'), 'lock before read');
  assert.ok(calls.indexOf('read:appointments') < calls.indexOf('write'), 'read before write');
  assert.equal(calls.filter((c) => c === 'write').length, 1);
});

test('SIMULTANEOUS BOOKING: the second request for the last slot is refused', async () => {
  // One rep left, both homeowners want 12:00. Serialised by the date lock, the
  // second re-reads inside the lock and finds the slot gone.
  const { deps, store } = makeDeps([], [{ id: 'rep-a', bookingPriority: 1 }]);
  const first = await bookSlot(deps, request());
  const second = await bookSlot(deps, request());

  assert.equal(first.ok, true);
  assert.equal(second.ok, false);
  if (!second.ok) {
    assert.equal(second.code, 'SLOT_UNAVAILABLE');
    assert.ok(second.alternatives.length > 0, 'alternatives are offered');
    assert.equal(second.alternatives.some((a) => a.time === '12:00'), false);
  }
  assert.equal(store.length, 1, 'exactly one appointment was created');
});

test('two reps means two homeowners CAN hold the same time', async () => {
  const { deps, store } = makeDeps();
  const a = await bookSlot(deps, request());
  const b = await bookSlot(deps, request());
  assert.equal(a.ok, true);
  assert.equal(b.ok, true);
  assert.equal(store.length, 2);
  assert.notEqual(store[0].assignedRepId, store[1].assignedRepId, 'different reps');
});

test('AREA LOCK: a Simcoe booking is refused once both reps are locked to Hamilton', async () => {
  const seed: BookedAppointment[] = [
    { assignedRepId: 'rep-a', appointmentDate: DATE, appointmentTime: '10:00', durationMinutes: 120, schedulingArea: 'HAMILTON', status: 'scheduled' },
    { assignedRepId: 'rep-b', appointmentDate: DATE, appointmentTime: '10:00', durationMinutes: 120, schedulingArea: 'HAMILTON', status: 'scheduled' },
  ];
  const { deps, store } = makeDeps(seed);
  const result = await bookSlot(deps, request({ area: 'SIMCOE', time: '14:00' }));
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.code, 'SLOT_UNAVAILABLE');
  assert.equal(store.length, 2, 'no appointment was written');
});

test('AREA LOCK: the free rep still takes the other area', async () => {
  const seed: BookedAppointment[] = [
    { assignedRepId: 'rep-a', appointmentDate: DATE, appointmentTime: '10:00', durationMinutes: 120, schedulingArea: 'HAMILTON', status: 'scheduled' },
  ];
  const { deps, store } = makeDeps(seed);
  const result = await bookSlot(deps, request({ area: 'SIMCOE', time: '14:00' }));
  assert.equal(result.ok, true);
  assert.equal(store[store.length - 1].assignedRepId, 'rep-b', 'the unlocked rep takes it');
});

test('off-grid times, bad dates and past slots are rejected before any lock', async () => {
  for (const bad of [{ time: '11:00' }, { time: '25:00' }, { date: 'nonsense' }, { date: '2026-07-01' }]) {
    const { deps, calls } = makeDeps();
    const result = await bookSlot(deps, request(bad));
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, 'INVALID_SLOT');
    assert.equal(calls.length, 0, `no database work for ${JSON.stringify(bad)}`);
  }
});

test('references are unique and unambiguous', () => {
  const seen = new Set(Array.from({ length: 500 }, () => generateReference()));
  assert.equal(seen.size, 500);
  for (const ref of seen) assert.equal(/[IO01]/.test(ref.slice(3)), false, 'no confusable characters');
});

// ─── Public booking must never require portal authentication ─────────────────

const here = dirname(fileURLToPath(import.meta.url));
const leadsApi = readFileSync(join(here, '..', 'api', 'leads', 'index.ts'), 'utf8');

test('the public flow is routed BEFORE requireAuth', () => {
  const flowIndex = leadsApi.indexOf("req.query['flow'] !== undefined");
  const authIndex = leadsApi.indexOf('await requireAuth(req, res)');
  assert.ok(flowIndex > -1, 'the ?flow= route must exist');
  assert.ok(authIndex > -1, 'requireAuth still guards the portal routes');
  assert.ok(flowIndex < authIndex, 'a homeowner must never hit an auth check');
});

test('no public flow handler calls requireAuth', () => {
  const start = leadsApi.indexOf('async function handlePublicFlow');
  const end = leadsApi.indexOf('export default async function handler');
  assert.ok(start > -1 && end > start);
  const body = leadsApi.slice(start, end);
  assert.equal(/requireAuth|requireAdmin|denyContractor/.test(body), false);
});

test('public bookings are attributed to the inactive system identity', () => {
  assert.equal(SYSTEM_BOOKING_USER_ID, 'system-public-booking');
  // The booking helper is shared with the portal, where a real rep is the
  // author — so attribution is now a fallback rather than a constant. The
  // system identity must remain what it falls back TO.
  assert.ok(leadsApi.includes('createdByUserId: createdByUserId ?? SYSTEM_BOOKING_USER_ID'));
  // Seeded inactive and password-less, so it can never sign in.
  assert.ok(/id: SYSTEM_BOOKING_USER_ID[\s\S]{0,400}active: false/.test(leadsApi));
  assert.equal(/SYSTEM_BOOKING_USER_ID[\s\S]{0,400}passwordHash/.test(leadsApi), false);
});

test('the public flow never attributes a booking to a signed-in user', () => {
  // The homeowner's own booking must stay anonymous even though the helper it
  // now shares can accept an author. Passing a user id from the public handler
  // would put a rep's name on a booking they did not make.
  const start = leadsApi.indexOf("if (flow === 'book' && req.method === 'POST')");
  const end = leadsApi.indexOf("if (flow === 'drain')");
  assert.ok(start > -1 && end > start);
  const publicBookHandler = leadsApi.slice(start, end);
  assert.equal(/createdByUserId/.test(publicBookHandler), false);
  assert.ok(publicBookHandler.includes("bookedVia: 'public_flow'"));
});

test('booking from the portal is admin-only and silent unless asked', () => {
  const start = leadsApi.indexOf("if (action === 'book_lead')");
  assert.ok(start > -1);
  const handler = leadsApi.slice(start, start + 1800);
  // An unauthenticated caller must never reach a rep's calendar.
  assert.ok(handler.includes("user.role !== 'admin'"));
  // Notifying is opt-in: absent or false must not text the homeowner.
  assert.ok(handler.includes('notify: data.notify === true'));
  assert.ok(handler.includes("bookedVia: 'portal_admin'"));
});
