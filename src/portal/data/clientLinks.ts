// Which consultations belong to a client profile.
//
// `Appointment.clientId` is the real link, but the server only sets it when a
// consultation is booked or created through the API. A client added by hand,
// imported, or created before the link existed therefore showed "No
// consultations yet" while their consultations sat in the system under the same
// phone number — so an admin who looked up an old customer by phone got a
// profile with no history and no rep on it at all.
//
// The fallbacks are the identifiers a consultation is actually keyed on: the
// phone number and the email. Name is deliberately NOT matched — two different
// homeowners share a common name far too often, and putting one person's
// consultation on another person's profile is worse than showing none.

import type { Appointment, Client } from './types';

/**
 * The last 10 digits of a phone number, or '' when there aren't 10.
 *
 * The same number is stored as +1XXXXXXXXXX, 1XXXXXXXXXX and XXX-XXX-XXXX
 * across bookings, imports and hand entry, so the digits are the only part
 * that compares reliably.
 */
export function phoneKey(value: string | null | undefined): string {
  const digits = (value ?? '').replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : '';
}

function emailKey(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

type ContactFields = { phone?: string | null; email?: string | null };

/** True when this consultation should appear on that client's profile. */
export function appointmentBelongsToClient(
  appointment: Pick<Appointment, 'clientId'> & ContactFields,
  client: Pick<Client, 'id'> & ContactFields
): boolean {
  if (appointment.clientId === client.id) return true;
  // Already claimed by someone else — never move it onto this profile.
  if (appointment.clientId) return false;
  const phone = phoneKey(client.phone);
  if (phone && phoneKey(appointment.phone) === phone) return true;
  const email = emailKey(client.email);
  return !!email && emailKey(appointment.email) === email;
}

/** True when this deal is the same person as that client. */
export function dealMatchesClient(
  deal: ContactFields,
  client: Pick<Client, 'id'> & ContactFields
): boolean {
  const email = emailKey(client.email);
  if (email && emailKey(deal.email) === email) return true;
  const phone = phoneKey(client.phone);
  return !!phone && phoneKey(deal.phone) === phone;
}

/**
 * True when two consultations are the same homeowner.
 *
 * Used to carry finance details forward: a rep who books the same customer a
 * second time was retyping the whole application, because it is stored per
 * consultation. Same keys as above — the explicit client link first, then the
 * phone, then the email. Name is still deliberately not matched.
 */
export function sameHomeowner(
  a: Pick<Appointment, 'clientId'> & ContactFields,
  b: Pick<Appointment, 'clientId'> & ContactFields
): boolean {
  if (a.clientId && b.clientId) return a.clientId === b.clientId;
  const phone = phoneKey(a.phone);
  if (phone && phoneKey(b.phone) === phone) return true;
  const email = emailKey(a.email);
  return !!email && emailKey(b.email) === email;
}
