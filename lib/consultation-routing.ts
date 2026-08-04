// ─── Routing decision ─────────────────────────────────────────────────────────
// Pure and server-authoritative. The browser receives an outcome, never the
// inputs or the rules.
//
// Two principles, both asserted by tests:
//   1. DECLINE is reachable only from something the homeowner stated as certain
//      (they do not own the property) or a fact we resolved with confidence (the
//      address is not in Ontario). Every ambiguity about a fact we rely on goes
//      to MANUAL_REVIEW — but "I don't know how I'd pay for it" is not one of
//      those facts. See the funding note below.
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
  | 'WANTS_FINANCING'
  | 'NEEDS_FUNDING_GUIDANCE'
  | 'EXPLORATORY_TIMELINE'
  | 'TIMELINE_BEYOND_BOOKING_WINDOW'
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
  // ADDRESS_INFERRED is deliberately absent: it means the typed text matched
  // exactly ONE real address, which the server then standardised the same way it
  // standardises a picked suggestion. A single unambiguous match is not doubt,
  // and treating it as doubt is what sent qualified homeowners to a queue for
  // the sole offence of not knowing they had to tap the dropdown. Anything less
  // certain than a unique match never reaches this function as INFERRED.
  if (addressState === 'ADDRESS_UNVERIFIED') reasons.push('ADDRESS_UNVERIFIED');
  if (!area) reasons.push('MUNICIPALITY_UNRECOGNISED');
  // A recognised area whose program is not live yet (Simcoe at launch) must be
  // reviewed by a person, never declined — we do serve there.
  if (area && (!program || !program.enabled)) reasons.push('PROGRAM_NOT_ENABLED');
  if (UNCERTAIN.has(ownership)) reasons.push('OWNERSHIP_UNCERTAIN');
  if (UNCERTAIN.has(projectType)) reasons.push('PROJECT_TYPE_UNCERTAIN');
  // No funding answer blocks the calendar — not even "not sure".
  //
  // "Not sure yet / Need guidance" is a REQUEST for the conversation, not doubt
  // about eligibility, and it is the one answer a homeowner cannot give
  // reliably: whether they can fund the build is a lender's call, not theirs.
  // Queueing it meant chasing by phone the people who had already raised their
  // hand. Instead the flow shows them how milestone payouts and an open loan
  // work, then sends them to the calendar like everyone else; the answer rides
  // along to the consultant's brief as context.
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
  // A 45-minute in-person slot is the scarcest thing we have. Someone who is
  // browsing, or who is a quarter away from starting, gets the guide and a
  // follow-up instead — the visit is far more useful nearer the decision.
  if (timeline === 'exploring' || timeline === '3_plus_months') {
    return {
      outcome: 'NURTURE',
      reasons: [timeline === 'exploring' ? 'EXPLORATORY_TIMELINE' : 'TIMELINE_BEYOND_BOOKING_WINDOW'],
    };
  }

  // ── 4. DIRECT_CALENDAR ──
  // The funding answer is recorded for the rep's brief, never a barrier. The two
  // tags differ in what the consultant should open with: WANTS_FINANCING already
  // knows it needs financing, NEEDS_FUNDING_GUIDANCE has seen the explainer once
  // and expects the numbers walked through in person.
  const booked: RoutingReason[] = ['ELIGIBLE_FOR_BOOKING'];
  if (contribution === 'need_financing') booked.push('WANTS_FINANCING');
  if (contribution === 'unsure') booked.push('NEEDS_FUNDING_GUIDANCE');
  return { outcome: 'DIRECT_CALENDAR', reasons: booked };
}

/** True when the outcome should show the booking calendar. */
export function offersCalendar(outcome: RoutingOutcome): boolean {
  return outcome === 'DIRECT_CALENDAR';
}
