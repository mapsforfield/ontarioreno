// ─── Atomic public booking ────────────────────────────────────────────────────
// The orchestration lives here with its database work injected, so the ordering
// guarantee — lock BEFORE read, read and write inside one transaction — is
// unit-testable without a database.
//
// Concurrency: the advisory lock is scoped to the DATE, not the slot. Rep
// assignment is a server decision and the scheduling-area lock spans a whole day,
// so two concurrent requests must not independently pick the same rep or set
// conflicting locks. Locking the date makes eligibility-read and insert one
// indivisible step. Volume is a few bookings a day, so serialising a date is free.

import { randomUUID } from 'node:crypto';
import type { SchedulingArea } from './program-config.js';
import {
  chooseRep,
  eligibleRepsForSlot,
  minutesOfDay,
  type BookableRep,
  type BookedAppointment,
  type Coordinates,
  type Slot,
} from './scheduling.js';

/** Audit-only identity. Inactive and password-less, so it can never sign in. */
export const SYSTEM_BOOKING_USER_ID = 'system-public-booking';
export const SYSTEM_BOOKING_USER_NAME = 'Public Booking System';

export type BookingRequest = {
  date: string;
  time: string;
  area: SchedulingArea;
  slotStartTimes: string[];
  reservationMinutes: number;
  leadTimeHours: number;
  bookingHorizonDays: number;
  maxBookingsPerRepPerDay: number;
  primaryRepPrimingBookings: number;
  maxSameDayTravelKm: number;
  /** Property coordinates, for the same-day travel radius. */
  destination: Coordinates | null;
  nowWallToronto: string;
  programKey: string;
  programVersion: number;
  lead: {
    id: string;
    name: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    postalCode: string;
    projectType: string;
  };
  customerNotes?: string;
};

export type BookingDeps = {
  /** Transaction-scoped advisory lock on the date. Must be called first. */
  lockDate: (date: string) => Promise<void>;
  listBookableReps: () => Promise<BookableRep[]>;
  listDaysOff: (repIds: string[], date: string) => Promise<Set<string>>;
  listAppointments: (repIds: string[], date: string) => Promise<BookedAppointment[]>;
  createAppointment: (input: {
    repId: string;
    publicReference: string;
    request: BookingRequest;
  }) => Promise<{ id: string }>;
};

export type BookingResult =
  | {
      ok: true;
      appointmentId: string;
      publicReference: string;
      date: string;
      time: string;
      durationMinutes: number;
    }
  | { ok: false; code: 'SLOT_UNAVAILABLE'; alternatives: Slot[] }
  | { ok: false; code: 'INVALID_SLOT' };

/** Short, unambiguous, human-readable booking reference. */
export function generateReference(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1
  const hex = randomUUID().replace(/-/g, '');
  let out = '';
  for (let i = 0; i < 8; i++) {
    out += alphabet[parseInt(hex.slice(i * 2, i * 2 + 2), 16) % alphabet.length];
  }
  return `OR-${out}`;
}

export async function bookSlot(
  deps: BookingDeps,
  request: BookingRequest
): Promise<BookingResult> {
  if (
    minutesOfDay(request.time) === null ||
    !request.slotStartTimes.includes(request.time) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(request.date)
  ) {
    return { ok: false, code: 'INVALID_SLOT' };
  }

  // Inside the lead-time floor or beyond the horizon — never bookable.
  const earliest = request.nowWallToronto;
  if (`${request.date}T${request.time}` < earliest) {
    return { ok: false, code: 'INVALID_SLOT' };
  }

  // 1. Serialise every booking for this date before reading anything.
  await deps.lockDate(request.date);

  // 2. Re-derive eligibility inside the lock — this is the authoritative read.
  const reps = await deps.listBookableReps();
  const repIds = reps.map((rep) => rep.id);
  const daysOff = await deps.listDaysOff(repIds, request.date);
  const appointments = await deps.listAppointments(repIds, request.date);

  const availabilityInput = {
    reps,
    appointments,
    daysOff,
    area: request.area,
    slotStartTimes: request.slotStartTimes,
    reservationMinutes: request.reservationMinutes,
    leadTimeHours: request.leadTimeHours,
    bookingHorizonDays: request.bookingHorizonDays,
    maxBookingsPerRepPerDay: request.maxBookingsPerRepPerDay,
    primaryRepPrimingBookings: request.primaryRepPrimingBookings,
    maxSameDayTravelKm: request.maxSameDayTravelKm,
    destination: request.destination,
    nowWallToronto: request.nowWallToronto,
  };

  const candidates = eligibleRepsForSlot(availabilityInput, request.date, request.time);
  const repId = chooseRep(
    candidates,
    reps,
    appointments,
    request.date,
    request.primaryRepPrimingBookings
  );

  if (!repId) {
    // Same-day alternatives only — enough to be useful, nothing about other reps.
    const alternatives = request.slotStartTimes
      .filter((t) => t !== request.time)
      .filter((t) => eligibleRepsForSlot(availabilityInput, request.date, t).length > 0)
      .map((t) => ({ date: request.date, time: t }));
    return { ok: false, code: 'SLOT_UNAVAILABLE', alternatives };
  }

  // 3. Write inside the same transaction, while the lock still holds.
  const publicReference = generateReference();
  const created = await deps.createAppointment({ repId, publicReference, request });

  return {
    ok: true,
    appointmentId: created.id,
    publicReference,
    date: request.date,
    time: request.time,
    durationMinutes: request.reservationMinutes,
  };
}
