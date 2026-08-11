// ─── Remote (virtual) consultation cities ─────────────────────────────────────
// Some Ontario cities are real business and a bad drive. A rep can sell into
// them, but not by giving up an afternoon to get there — so a booking from one
// of these places is a CALL, and it must not shape the rest of a rep's day.
//
// The bug this exists to fix: the same-day travel radius anchors a rep's whole
// date on their first appointment. One Niagara Falls lead taken at 4pm made
// every later lead outside 10 km of Niagara Falls ineligible for that rep, so
// the next three bookings fell to the other rep. The far lead cost us nothing
// in drive time and a full day in capacity.
//
// A remote booking is therefore invisible to every scheduling rule (see
// lib/scheduling.ts): no travel radius, no scheduling-area lock, no daily cap,
// no slot collision, no weight in rep assignment. It hovers alongside the
// in-person day. The rep has the homeowner's details and arranges the call
// around their driving.
//
// This module is bundled into the browser with program-config.ts, so it must
// stay free of Node imports.

/**
 * Municipalities served by video/phone consultation rather than a site visit.
 *
 * Matched against the municipality Places resolved (Lead.city /
 * Lead.resolvedMunicipality), lower-cased and whitespace-collapsed.
 *
 * Deliberately an explicit list rather than a distance calculation. A radius
 * from some notional base would silently reclassify cities nobody has looked
 * at, and which places are worth a drive is a commercial call, not geometry.
 * Adding a city here is the whole change — everything downstream reads this.
 */
export const REMOTE_CONSULTATION_CITIES = [
  'windsor',
  'niagara falls',
  'thorold',
] as const;

const REMOTE_SET = new Set<string>(REMOTE_CONSULTATION_CITIES);

const normalizeCity = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');

/**
 * Is this municipality served remotely?
 *
 * Takes every name we hold for the property and returns true if ANY of them
 * matches. Places returns the locality in `city` for most addresses but the
 * administrative area for some, and a lead whose `city` came out blank still
 * has `resolvedMunicipality` — reading one field only would put a Niagara Falls
 * homeowner back on the in-person path by accident.
 */
export function isRemoteConsultationCity(...names: Array<string | null | undefined>): boolean {
  return names.some((name) => Boolean(name) && REMOTE_SET.has(normalizeCity(String(name))));
}

/** How the consultation is delivered. Drives copy, not scheduling. */
export type ConsultationDelivery = 'in_person' | 'remote';

export function consultationDelivery(
  ...names: Array<string | null | undefined>
): ConsultationDelivery {
  return isRemoteConsultationCity(...names) ? 'remote' : 'in_person';
}
