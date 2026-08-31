// ─── Free slots for one lead ──────────────────────────────────────────────────
// Extracted here, with its database work taken as a parameter, so that every
// surface that OFFERS a homeowner a time reads the same computation:
//
//   * the public consultation calendar
//   * the portal's booking panel
//   * the text conversation's drafted offers (lib/lead-conversation-runner.ts)
//
// This is the same reason bookSlot is shared rather than reimplemented. A rep
// offered a time on one surface and not another is a rep who ends up
// double-booked — and a homeowner told over text that Thursday is free, when
// the calendar says otherwise, experiences that as being lied to.
//
// Nothing here writes. It is the read half; bookSlot still owns the lock, the
// conflict check and the insert.

import {
  addWallHours,
  computeAvailability,
  torontoWallClock,
  type BookedAppointment,
} from './scheduling.js';
import { isRemoteConsultationCity } from './remote-consultation.js';
import {
  programByKey,
  programForArea,
  type ProgramConfig,
  type SchedulingArea,
} from './program-config.js';
import type { LeadSlotsPayload, SlotBlock } from './lead-slots.js';

/** Statuses that still occupy a rep's calendar. */
export const ACTIVE_APPOINTMENT_STATUSES = ['scheduled', 'confirmed', 'rescheduled', 'completed'];

/** Reps eligible for public booking, in assignment order. Names never appear. */
export const BOOKABLE_REP_QUERY = {
  where: { role: 'rep', active: true, acceptsPublicBooking: true },
  select: { id: true, bookingPriority: true },
  orderBy: [{ bookingPriority: 'asc' as const }, { id: 'asc' as const }],
};

/** Fields the scheduling rules need from an existing appointment. */
export const SCHEDULING_APPOINTMENT_SELECT = {
  assignedRepId: true,
  appointmentDate: true,
  appointmentTime: true,
  durationMinutes: true,
  schedulingArea: true,
  status: true,
  latitude: true,
  longitude: true,
  city: true,
  // Without this the rules cannot tell a call from a site visit, and every
  // remote booking anchors the rep's day again — the exact bug it fixes.
  remoteConsultation: true,
};

/**
 * Is this lead's property served remotely?
 *
 * Both name fields are consulted: Places fills `city` for most addresses and
 * `resolvedMunicipality` carries what it actually returned, and a lead that
 * arrived with one of them blank must not quietly fall back to in-person.
 */
export function leadIsRemote(lead: {
  city?: string | null;
  resolvedMunicipality?: string | null;
}): boolean {
  return isRemoteConsultationCity(lead.city, lead.resolvedMunicipality);
}

/** The lead fields availability actually reads. */
export type AvailabilityLead = {
  schedulingArea?: string | null;
  programKey?: string | null;
  city?: string | null;
  resolvedMunicipality?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

/** The two reads this needs, so the caller supplies its own client. */
export type AvailabilityStore = {
  user: { findMany: (args: unknown) => Promise<Array<{ id: string; bookingPriority: number }>> };
  appointment: { findMany: (args: unknown) => Promise<Array<Record<string, unknown>>> };
  repDayOff: {
    findMany: (args: unknown) => Promise<Array<{ userId: string; date: string }>>;
  };
};

/** Program the lead was CAPTURED under, falling back to the area's. */
export function programForLead(lead: AvailabilityLead): ProgramConfig | null {
  return (
    programByKey(lead.programKey ?? undefined) ??
    programForArea(lead.schedulingArea as SchedulingArea) ??
    null
  );
}

/**
 * Free slots for this lead's area, honouring the rep day limits, days off and
 * the same-day travel ceiling.
 *
 * Returns a `blocked` reason rather than an empty list without explanation:
 * "no times" and "this program is closed" look identical to a caller and mean
 * completely different things to a homeowner.
 */
export async function availableSlotsForLead(
  store: AvailabilityStore,
  lead: AvailabilityLead,
  nowWall: string = torontoWallClock()
): Promise<LeadSlotsPayload> {
  const empty = (blocked: SlotBlock): LeadSlotsPayload => ({ slots: [], visitMinutes: 0, blocked });
  if (!lead.schedulingArea) return empty({ reason: 'NO_AREA' });

  // Keying on the lead is what lets two Ontario-wide programs coexist: they
  // share the ONTARIO area, so resolving by area alone would hand every one of
  // them the first match.
  const program = programForLead(lead);
  if (!program) return empty({ reason: 'NO_AREA' });
  if (!program.enabled) {
    return empty(
      program.closure
        ? {
            reason: 'PROGRAM_CLOSED',
            programName: program.closure.shortName,
            confirmedOn: program.closure.confirmedOn,
          }
        : { reason: 'PROGRAM_NOT_OPEN', programName: program.areaLabel }
    );
  }

  const remote = leadIsRemote(lead);
  const reps = await store.user.findMany(BOOKABLE_REP_QUERY);
  const repIds = reps.map((r) => r.id);
  if (repIds.length === 0) return empty({ reason: 'NO_REPS' });

  const fromDate = nowWall.slice(0, 10);
  const toDate = new Date(
    Date.UTC(
      Number(fromDate.slice(0, 4)),
      Number(fromDate.slice(5, 7)) - 1,
      Number(fromDate.slice(8, 10)) + program.bookingHorizonDays + 1
    )
  )
    .toISOString()
    .slice(0, 10);

  const [appointments, daysOffRows] = await Promise.all([
    store.appointment.findMany({
      where: {
        assignedRepId: { in: repIds },
        appointmentDate: { gte: fromDate, lte: toDate },
        deletedAt: null,
        status: { in: ACTIVE_APPOINTMENT_STATUSES },
      },
      select: SCHEDULING_APPOINTMENT_SELECT,
    }),
    store.repDayOff.findMany({
      where: { userId: { in: repIds }, date: { gte: fromDate, lte: toDate } },
      select: { userId: true, date: true },
    }),
  ]);

  const slots = computeAvailability({
    reps,
    appointments: appointments as BookedAppointment[],
    daysOff: new Set(daysOffRows.map((d) => `${d.userId}|${d.date}`)),
    area: lead.schedulingArea as SchedulingArea,
    slotStartTimes: program.slotStartTimes,
    reservationMinutes: program.reservationMinutes,
    leadTimeHours: program.leadTimeHours,
    bookingHorizonDays: program.bookingHorizonDays,
    maxBookingsPerRepPerDay: program.maxBookingsPerRepPerDay,
    primaryRepPrimingBookings: program.primaryRepPrimingBookings,
    maxSameDayTravelKm: program.maxSameDayTravelKm,
    visitMinutes: program.visitMinutes,
    destination: { latitude: lead.latitude, longitude: lead.longitude, city: lead.city },
    destinationIsRemote: remote,
    nowWallToronto: nowWall,
  });

  return {
    slots,
    visitMinutes: program.visitMinutes,
    remoteConsultation: remote,
    // The same two inputs computeAvailability just used, so a calendar can tell
    // "booked" from "too soon" without guessing. See slotGrid.
    slotGrid: {
      startTimes: program.slotStartTimes,
      earliestWall: addWallHours(nowWall, program.leadTimeHours),
    },
  };
}

/**
 * The first few open times, for a text message.
 *
 * Spread across DIFFERENT DAYS wherever possible. computeAvailability returns
 * chronologically, so the first three are usually three slots on the same
 * morning — offering "Tue 10am or Tue 12pm" to someone who said the day does
 * not suit them wastes both messages.
 */
export function spreadAcrossDays(
  slots: Array<{ date: string; time: string }>,
  count: number
): Array<{ date: string; time: string }> {
  const picked: Array<{ date: string; time: string }> = [];
  const usedDays = new Set<string>();
  for (const slot of slots) {
    if (picked.length >= count) break;
    if (usedDays.has(slot.date)) continue;
    usedDays.add(slot.date);
    picked.push(slot);
  }
  // Not enough distinct days — fall back to filling from the front rather than
  // returning too few, because too few is what stops a draft being written.
  for (const slot of slots) {
    if (picked.length >= count) break;
    if (picked.some((p) => p.date === slot.date && p.time === slot.time)) continue;
    picked.push(slot);
  }
  return picked;
}
