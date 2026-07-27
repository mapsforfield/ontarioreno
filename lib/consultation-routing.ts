// ─── Routing decision ─────────────────────────────────────────────────────────
// Pure and server-authoritative. The browser receives an outcome, never the
// inputs or the rules.
//
// Two principles, both asserted by tests:
//   1. DECLINE is reachable only from something the homeowner stated as certain
//      (they do not own the property) or a fact we resolved with confidence (the
//      address is not in Ontario). Every ambiguity goes to MANUAL_REVIEW.
//   2. Property questions — basement condition, separate entrance, permit status
//      — carry ZERO weight. We do not assess structure, zoning or eligibility.

import type { AddressState, ProgramConfig, SchedulingArea } from './program-config.js';

export type RoutingOutcome = 'DIRECT_CALENDAR' | 'MANUAL_REVIEW' | 'NURTURE' | 'DECLINE';

export type RoutingReason =
  | 'NOT_PROPERTY_OWNER'
  | 'OUTSIDE_ONTARIO'
  | 'ADDRESS_UNVERIFIED'
  | 'MUNICIPALITY_UNRECOGNISED'
  | 'PROGRAM_NOT_ENABLED'
  | 'OWNERSHIP_UNCERTAIN'
  | 'PROJECT_TYPE_UNCERTAIN'
  | 'PROJECT_TYPE_NOT_LISTED'
  | 'CONTRIBUTION_UNCERTAIN'
  | 'WANTS_FINANCING'
  | 'EXPLORATORY_TIMELINE'
  | 'ELIGIBLE_FOR_BOOKING';

export type RoutingInput = {
  addressState: AddressState;
  /** Municipality resolved from the address, or null when unrecognised. */
  area: SchedulingArea | null;
  /** Program for that area, or null when the area maps to no program. */
  program: ProgramConfig | null;
  answers: Record<string, string>;
};

export type RoutingResult = {
  outcome: RoutingOutcome;
  reasons: RoutingReason[];
};

const UNCERTAIN = new Set(['unsure', 'unknown', '']);

export function routeConsultation(input: RoutingInput): RoutingResult {
  const { addressState, area, program, answers } = input;
  const reasons: RoutingReason[] = [];

  const ownership = answers.ownership ?? '';
  const projectType = answers.projectType ?? '';
  const timeline = answers.timeline ?? '';
  const contribution = answers.contribution ?? '';

  // ── 1. DECLINE — only from certainty ──
  if (ownership === 'no') {
    return { outcome: 'DECLINE', reasons: ['NOT_PROPERTY_OWNER'] };
  }
  if (addressState === 'ADDRESS_OUTSIDE_SERVICE_AREA') {
    return { outcome: 'DECLINE', reasons: ['OUTSIDE_ONTARIO'] };
  }

  // ── 2. MANUAL_REVIEW — every form of doubt ──
  if (addressState === 'ADDRESS_UNVERIFIED') reasons.push('ADDRESS_UNVERIFIED');
  if (!area) reasons.push('MUNICIPALITY_UNRECOGNISED');
  // A recognised area whose program is not live yet (Simcoe at launch) must be
  // reviewed by a person, never declined — we do serve there.
  if (area && (!program || !program.enabled)) reasons.push('PROGRAM_NOT_ENABLED');
  if (UNCERTAIN.has(ownership)) reasons.push('OWNERSHIP_UNCERTAIN');
  if (UNCERTAIN.has(projectType)) reasons.push('PROJECT_TYPE_UNCERTAIN');
  // Only "not sure" needs a person. Wanting to discuss financing is a normal
  // answer for a program that funds 70% — it must not block the calendar.
  if (contribution === 'unsure') reasons.push('CONTRIBUTION_UNCERTAIN');
  if (
    program &&
    projectType &&
    !UNCERTAIN.has(projectType) &&
    !program.eligibleProjectTypes.includes(projectType)
  ) {
    // Not a decline: whether a project qualifies is the City's call, not ours.
    reasons.push('PROJECT_TYPE_NOT_LISTED');
  }
  if (reasons.length > 0) return { outcome: 'MANUAL_REVIEW', reasons };

  // ── 3. NURTURE — qualified but not ready ──
  if (timeline === 'exploring') {
    return { outcome: 'NURTURE', reasons: ['EXPLORATORY_TIMELINE'] };
  }

  // ── 4. DIRECT_CALENDAR ──
  // Wanting to discuss financing is recorded for the rep's brief, not a barrier.
  const booked: RoutingReason[] = ['ELIGIBLE_FOR_BOOKING'];
  if (contribution === 'need_financing') booked.push('WANTS_FINANCING');
  return { outcome: 'DIRECT_CALENDAR', reasons: booked };
}

/** True when the outcome should show the booking calendar. */
export function offersCalendar(outcome: RoutingOutcome): boolean {
  return outcome === 'DIRECT_CALENDAR';
}
