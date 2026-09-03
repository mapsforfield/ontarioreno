// ─── Which consultations a rep is allowed to see ─────────────────────────────
//
// A rep sees their own consultations. This module describes the two deliberate
// exceptions to that, both of which came from real situations:
//
//   1. TRANSFERS. Keven moved a client to Steven. Steven could find the client
//      in the Clients tab but every attempt to open their earlier consultation
//      closed the panel again, because that consultation was still Keven's. He
//      had been handed the customer and not the customer's history — so he was
//      about to walk into a visit knowing less than the homeowner assumed.
//
//      The rule: a rep who is responsible for a homeowner can see that
//      homeowner's other consultations, whoever they are assigned to.
//
//   2. NAMED PAIRS. Two reps who work closely can be given sight of each
//      other's calendar, so neither phones the other mid-visit. This is opt-in
//      and listed by name below. A rep added later gets nothing by default —
//      that is the point of listing it rather than inferring it.
//
// SCOPE — this widens what can be SEEN, never what can be CHANGED. Editing,
// transferring and deleting a consultation remain the assigned rep's (or an
// admin's), enforced server-side on `assignedRepId`; nothing here touches that.
//
// Worth knowing while reading this: the API hands every authenticated rep the
// full appointment list (api/appointments/index.ts), so this filter is what a
// rep is SHOWN, not what they could obtain. It is a product rule about focus
// and tidiness, not a security boundary — do not add a secret here and expect
// this to keep it.

import { phoneKey } from './clientLinks';
import type { Appointment, User } from './types';

/**
 * Reps who can see each other's consultations.
 *
 * Each entry is one mutual group. Identifiers match a user by email or by
 * display name, case-insensitively — email is the stabler of the two, so
 * prefer it when you know it.
 *
 * Keven and Steven asked for this: they work as a pair, they are close
 * friends, and neither could tell when the other was sitting in a homeowner's
 * kitchen. There is no privacy concern between them. That is a fact about
 * these two people, not a policy about reps, which is why adding a third
 * person here has to be a deliberate edit.
 *
 * Seeing is not the same as defaulting: both still open the calendar on their
 * own work and choose to bring the other in (see the rep filter in
 * PortalAppointments).
 */
export const APPOINTMENT_VISIBILITY_GROUPS: string[][] = [
  ['Keven', 'Steven'],
];

function identityKeys(user: Pick<User, 'name' | 'email'>): string[] {
  return [user.email, user.name]
    .map((v) => (v ?? '').trim().toLowerCase())
    .filter(Boolean);
}

function matchesIdentifier(user: Pick<User, 'name' | 'email'>, identifier: string): boolean {
  const wanted = identifier.trim().toLowerCase();
  return !!wanted && identityKeys(user).includes(wanted);
}

/**
 * The other reps whose consultations this user may see, by id.
 *
 * Empty for anyone not named in a group above, which is every rep by default.
 * `groups` is injectable so the matching rules can be tested against fixtures
 * rather than against whoever happens to be paired in production today.
 */
export function visibilityPartnerIds(
  user: Pick<User, 'id' | 'name' | 'email'>,
  users: Array<Pick<User, 'id' | 'name' | 'email'>>,
  groups: string[][] = APPOINTMENT_VISIBILITY_GROUPS
): string[] {
  const partnerIds = new Set<string>();

  for (const group of groups) {
    const inGroup = group.some((identifier) => matchesIdentifier(user, identifier));
    if (!inGroup) continue;

    for (const identifier of group) {
      for (const candidate of users) {
        if (candidate.id === user.id) continue;
        if (matchesIdentifier(candidate, identifier)) partnerIds.add(candidate.id);
      }
    }
  }

  return [...partnerIds];
}

type HomeownerFields = {
  clientId?: string | null;
  phone?: string | null;
  email?: string | null;
};

/**
 * Every identifier a row carries for its homeowner.
 *
 * A row can answer to more than one — a consultation booked through the portal
 * has a clientId AND a phone — and two rows are the same homeowner if they
 * share any of them.
 *
 * This is a looser test than `appointmentBelongsToClient` in clientLinks,
 * which refuses to match on phone once a row names a different client. That
 * strictness protects a client PROFILE from being shown someone else's
 * consultation, which is a data-integrity question. This is a different
 * question — may a rep who demonstrably works with this phone number see a row
 * carrying the same phone number — and there, matching is the safe direction
 * to err in: the cost of a miss is a rep walking into a visit blind, and the
 * cost of an over-match is a colleague seeing one extra row in a company where
 * the full list is already on the wire.
 */
export function homeownerKeys(row: HomeownerFields): string[] {
  const keys: string[] = [];
  if (row.clientId) keys.push(`client:${row.clientId}`);
  const phone = phoneKey(row.phone);
  if (phone) keys.push(`phone:${phone}`);
  const email = (row.email ?? '').trim().toLowerCase();
  if (email) keys.push(`email:${email}`);
  return keys;
}

/**
 * The homeowners this rep is responsible for, as a set of identifier keys.
 *
 * Built from both consultations and deals: a transfer may move either one, and
 * the whole point is that whichever arrives brings the history with it.
 */
export function responsibleHomeownerKeys(
  repId: string,
  appointments: Array<HomeownerFields & { assignedRepId?: string | null }>,
  deals: Array<HomeownerFields & { assignedRepId?: string | null }>
): Set<string> {
  const keys = new Set<string>();

  for (const row of [...appointments, ...deals]) {
    if (row.assignedRepId !== repId) continue;
    for (const key of homeownerKeys(row)) keys.add(key);
  }

  return keys;
}

/**
 * The one decision: may this user see this consultation?
 *
 * Everything that filters consultations for a rep goes through here, so the
 * rule cannot drift between the calendar, the agenda, search and the client
 * profile — the way it drifted into Steven being able to find a client he
 * could not open.
 */
export function canSeeAppointment(
  user: Pick<User, 'id' | 'role'>,
  appointment: Pick<Appointment, 'assignedRepId'> & HomeownerFields,
  context: { partnerIds: Set<string>; responsibleKeys: Set<string> }
): boolean {
  if (user.role === 'admin') return true;
  if (appointment.assignedRepId === user.id) return true;
  if (appointment.assignedRepId && context.partnerIds.has(appointment.assignedRepId)) return true;
  return homeownerKeys(appointment).some((key) => context.responsibleKeys.has(key));
}

/** Everything `canSeeAppointment` needs, computed once per pass rather than per row. */
export function visibilityContext(
  user: Pick<User, 'id' | 'name' | 'email'>,
  users: Array<Pick<User, 'id' | 'name' | 'email'>>,
  appointments: Array<HomeownerFields & { assignedRepId?: string | null }>,
  deals: Array<HomeownerFields & { assignedRepId?: string | null }>
): { partnerIds: Set<string>; responsibleKeys: Set<string> } {
  return {
    partnerIds: new Set(visibilityPartnerIds(user, users)),
    responsibleKeys: responsibleHomeownerKeys(user.id, appointments, deals),
  };
}

/** Convenience for the filter itself — used by the store. */
export function visibleAppointmentsFor<
  T extends Pick<Appointment, 'assignedRepId'> & HomeownerFields,
>(
  user: Pick<User, 'id' | 'role' | 'name' | 'email'>,
  appointments: T[],
  deals: Array<HomeownerFields & { assignedRepId?: string | null }>,
  users: Array<Pick<User, 'id' | 'name' | 'email'>>
): T[] {
  if (user.role === 'admin') return appointments;
  const context = visibilityContext(user, users, appointments, deals);
  return appointments.filter((appointment) => canSeeAppointment(user, appointment, context));
}

/** True when this user has anyone to filter in — drives showing the rep filter at all. */
export function hasVisibilityPartners(
  user: Pick<User, 'id' | 'name' | 'email'>,
  users: Array<Pick<User, 'id' | 'name' | 'email'>>
): boolean {
  return visibilityPartnerIds(user, users).length > 0;
}
