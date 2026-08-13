// ─── Program configuration ────────────────────────────────────────────────────
// Programs are configuration, not code. Adding a municipality or a scheduling
// area is a data change here; the flow, routing and scheduling are area-agnostic.
//
// Shared by the public page and the API, so this module must stay free of Node
// imports — it is bundled into the browser.

import { HAMILTON_ADU_CLOSURE, type ProgramClosure } from '../src/lib/programClosures.js';
import type { AddressResolutionCause } from './address-resolution.js';

/**
 * A scheduling area is a coarse bucket for a rep's day, not an eligibility rule.
 *
 * HAMILTON and SIMCOE are municipality-gated: the program only exists inside
 * that city, so the address decides which one applies. ONTARIO is different —
 * it is the bucket for programs we can deliver anywhere in the province
 * (financing, for instance, is not a city's money and has no municipal
 * boundary). It is deliberately NOT a region: what actually keeps a rep's day
 * drivable is the same-day travel radius in lib/scheduling.ts, measured in
 * kilometres between real coordinates, and that constraint applies to an
 * ONTARIO booking exactly as it does to a Hamilton one.
 */
export type SchedulingArea = 'HAMILTON' | 'SIMCOE' | 'ONTARIO';

/**
 * How a program decides whether it applies to an address.
 *
 *   'municipality'  — the City's money, so the ADDRESS decides. An address
 *                     outside the mapped municipalities gets no program.
 *   'ontario_wide'  — ours to deliver anywhere in Ontario, so the LANDING PAGE
 *                     decides. The address still has to resolve to Ontario, and
 *                     the travel radius still has to be satisfiable, but no
 *                     municipality list gates it.
 */
export type ProgramGeography = 'municipality' | 'ontario_wide';

/** Server-assigned. Never chosen by the homeowner. */
export type AddressState =
  | 'ADDRESS_VERIFIED'
  /**
   * Resolved from typed text rather than a picked suggestion, and matched
   * exactly one real address. Schedulable — a unique match is not an ambiguity
   * — but recorded separately from ADDRESS_VERIFIED so the softer path stays
   * auditable, and so a rep can eyeball it before driving out.
   */
  | 'ADDRESS_INFERRED'
  | 'ADDRESS_OUTSIDE_SERVICE_AREA'
  | 'ADDRESS_UNVERIFIED';

export type QuestionOption = { value: string; label: string };

export type Question = {
  key: string;
  label: string;
  /** Short clarifier shown under the label. */
  help?: string;
  options: QuestionOption[];
  /** Only these answers influence routing; everything else is captured for the rep. */
  routingRelevant?: boolean;
  /** Which screen of the progressive flow this question belongs to. */
  step: 1 | 2 | 3;
};

/**
 * The screen shown to a homeowner who answers "Not sure yet / Need guidance" on
 * the funding question, between that step and the contact form.
 *
 * It has no second question and no way out but forward: capacity to fund is a
 * lender's call, so asking a homeowner to self-assess it only manufactures a
 * decline. The screen exists to introduce financing the way a rep would on the
 * phone — normalised first, mechanics second — and then continue to the calendar.
 *
 * Deliberately says NOTHING about the size or timing of the first advance. It is
 * capped at $8,000 against a $50–60k scope, so naming it invites the homeowner
 * to anchor on money arriving early, conclude they need no financing, and feel
 * misled when the consultant lays out the real numbers at their kitchen table.
 * The advance is the consultant's to raise in person.
 */
export type FundingGuidance = {
  /** Rendered as the page title for this step — NOT repeated inside the card. */
  heading: string;
  /** Opening paragraph — the mechanics, and nothing else. */
  lead: string;
  /**
   * The reassurance, standing alone. Kept out of the lead paragraph on purpose:
   * trailing it behind an em dash both buried it and let it orphan across a line
   * break, splitting the two words that carry the whole screen.
   */
  leadEmphasis: string;
  /**
   * The payout sequence, shown as a thin strip. Labels only — NEVER amounts,
   * percentages or advance counts, for the same reason the copy omits them: a
   * homeowner given figures here does the arithmetic themselves and reaches a
   * conclusion the consultant has to undo in person. The strip exists to make
   * one thing obvious at a glance — the money sits at the END of the line.
   */
  milestones: string[];
  /** The solution, given the screen's one visual focal point. */
  highlight: string;
  /** Quiet closer, in lighter text so it does not compete with the highlight. */
  closing: string;
  continueLabel: string;
};

/**
 * The default nurture set: browsing, or a quarter away from starting. Programs
 * opt out by setting nurtureTimelines to [].
 */
export const DEFAULT_NURTURE_TIMELINES = ['exploring', '3_plus_months'];

export type ProgramConfig = {
  key: string;
  version: number;
  schedulingArea: SchedulingArea;
  /**
   * Whether the address or the landing page decides that this program applies.
   * See ProgramGeography. Every existing program is 'municipality', which is
   * exactly what they did before this field existed.
   */
  geography: ProgramGeography;
  /** Public flow is live only when true. */
  enabled: boolean;
  /**
   * Why a disabled program is disabled — set only when the intake CLOSED, and
   * left unset when it has simply not opened yet. The two read very differently
   * to a homeowner who followed an ad here: "not yet" invites them to come
   * back, "the funding ran out" tells them to look elsewhere now. The facts come
   * from src/lib/programClosures.ts so this page and the city pages can never
   * disagree about a date or a reason.
   */
  closure?: ProgramClosure;
  slug: string;
  areaLabel: string;
  /** The ONLY place an amount is rendered from. Never a literal in a component. */
  displayAmountLabel: string;
  /** Three short lines shown inline during the flow. */
  fundingHighlights: string[];
  /** Full terms, shown only behind a "full details" disclosure. */
  programTerms: string[];
  whyFreeText: string;
  /** Shown when the funding answer is "unsure". Required: every live program needs one. */
  fundingGuidance: FundingGuidance;
  eligibleProjectTypes: string[];
  /**
   * Timelines that get the guide and a follow-up INSTEAD of a calendar slot.
   *
   * A 45-minute in-person visit is the scarcest thing we have, so a grant
   * program spends it near the decision and nurtures the rest. A financing
   * program is the opposite case: there is no application window to be early
   * for, and a homeowner who is "just exploring" is usually someone who has not
   * yet been shown that the build is affordable at all — which is a conversation
   * a rep wins in person and a follow-up email does not. Such a program sets
   * this to [] and books everyone.
   *
   * The timeline still reaches the rep's brief either way: booking an
   * exploratory lead tags it rather than hiding it, so the consultant knows what
   * they are walking into.
   */
  nurtureTimelines: string[];
  /** Asked before booking, grouped by step. */
  questions: Question[];
  /** Asked after booking. Never blocks the calendar. */
  prepQuestions: Question[];
  /**
   * What the booked consultation actually is. Drives the customer-facing wording
   * and the Appointment.appointmentType written at booking, so the homeowner is
   * never unclear about whether someone is coming to the property.
   */
  consultationMode: 'in_person' | 'phone';
  /**
   * What the booked Appointment's projectType reads as. The homeowner's specific
   * choice (secondary suite / garden / laneway) is a raw enum value and belongs
   * in the rep's brief, not in a customer-facing field — this is the label the
   * calendar and confirmation email should show.
   */
  appointmentProjectTypeLabel: string;
  /** Customer Notes template applied automatically, by id (Setting.note_templates). */
  noteTemplateId: string;
  /**
   * Browser tab title and the step-3 heading. Both default to the grant-shaped
   * wording every program used before there was a program that is not a grant
   * ("<area> Secondary Suite Consultation", "How the <area> funding works"),
   * which is accurate for Hamilton and wrong for a basement financing offer that
   * is neither a secondary suite nor funding. Set them when the defaults would
   * describe the wrong thing.
   */
  pageTitle?: string;
  fundingStepHeading?: string;
  /** Guide offered to exploratory leads instead of a live consultation slot. */
  guideUrl: string;
  guideLabel: string;
  officialSourceUrls: string[];
  visitMinutes: number;
  reservationMinutes: number;
  slotStartTimes: string[];
  leadTimeHours: number;
  bookingHorizonDays: number;
  /** Hard cap on how many visits one rep can be given on a single date. */
  maxBookingsPerRepPerDay: number;
  /**
   * Bookings the highest-priority rep receives before a lower-priority rep is
   * considered at all. After this, assignment balances on fewest-booked with
   * ties broken by priority — which keeps the preferred rep busiest without
   * leaving the other idle.
   */
  primaryRepPrimingBookings: number;
  /**
   * A rep's visits on one date must all sit within this radius of each other.
   * Prevents a schedule that sends someone across the region between two
   * appointments; when no rep can satisfy it, the slot simply isn't offered.
   */
  maxSameDayTravelKm: number;
};

/**
 * Both reps work seven days, 10:00–20:00 Ontario time. Five fixed starts each
 * reserving 120 minutes exactly fill that window, so travel buffer is implicit
 * and no buffer arithmetic is needed anywhere.
 */
const SHARED_SCHEDULING: Pick<
  ProgramConfig,
  | 'visitMinutes' | 'reservationMinutes' | 'slotStartTimes' | 'leadTimeHours' | 'bookingHorizonDays'
  | 'maxBookingsPerRepPerDay' | 'primaryRepPrimingBookings' | 'maxSameDayTravelKm'
> = {
  visitMinutes: 45,
  reservationMinutes: 120,
  slotStartTimes: ['10:00', '12:00', '14:00', '16:00', '18:00'],
  leadTimeHours: 24,
  bookingHorizonDays: 14,
  maxBookingsPerRepPerDay: 3,
  primaryRepPrimingBookings: 2,
  maxSameDayTravelKm: 10,
};

// ── Step 1: the property ──
const OWNERSHIP: Question = {
  key: 'ownership',
  label: 'Do you own this property?',
  routingRelevant: true,
  step: 1,
  options: [
    { value: 'yes', label: 'Yes, I own it' },
    { value: 'no', label: 'No' },
    { value: 'unsure', label: "It's complicated" },
  ],
};

// ── Step 2: the project ──
const PROJECT_TYPE: Question = {
  key: 'projectType',
  label: 'What are you planning?',
  routingRelevant: true,
  step: 2,
  options: [
    { value: 'secondary_suite', label: 'Basement or secondary suite' },
    { value: 'garden_suite', label: 'Garden suite' },
    { value: 'laneway_suite', label: 'Laneway suite' },
    { value: 'unsure', label: 'Still deciding' },
  ],
};

const TIMELINE: Question = {
  key: 'timeline',
  label: 'When would you like to start?',
  routingRelevant: true,
  step: 2,
  options: [
    { value: 'asap', label: 'As soon as possible' },
    { value: '1_3_months', label: 'In 1–3 months' },
    { value: '3_plus_months', label: 'In 3+ months' },
    { value: 'exploring', label: 'Just exploring' },
  ],
};

// ── Step 3: the money ──
const CONTRIBUTION: Question = {
  key: 'contribution',
  label: 'How do you plan to fund the upfront project costs?',
  help: 'The grant covers up to 70% via reimbursement advances. Financing is available if you need it.',
  routingRelevant: true,
  step: 3,
  options: [
    { value: 'cash_equity', label: 'Cash / Savings / Existing Home Equity' },
    { value: 'need_financing', label: "I'd like to explore financing options" },
    { value: 'unsure', label: 'Not sure yet / Need guidance' },
  ],
};

/**
 * Preparation questions — asked AFTER booking, never before.
 *
 * They carry ZERO routing weight (we do not assess structure, zoning or
 * eligibility), so asking them up front added friction for no decision value.
 * A homeowner cannot reliably answer a building-code question anyway, and asking
 * one before showing the calendar implies we are adjudicating it. They belong in
 * the representative's visit brief.
 */
const PREP_QUESTIONS: Question[] = [
  {
    key: 'basementStatus',
    label: 'Current basement condition',
    step: 3,
    options: [
      { value: 'unfinished', label: 'Fully unfinished' },
      { value: 'partial', label: 'Partially finished' },
      { value: 'finished', label: 'Fully finished' },
      { value: 'unsure', label: 'Not sure' },
    ],
  },
  {
    key: 'separateEntrance',
    label: 'Is there already a separate entrance?',
    step: 3,
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
      { value: 'unsure', label: 'Not sure' },
    ],
  },
  {
    key: 'permitStatus',
    label: 'Building permit status',
    step: 3,
    options: [
      { value: 'not_applied', label: 'Haven’t applied yet' },
      { value: 'waiting', label: 'Waiting for approval' },
      { value: 'approved', label: 'Permit already issued' },
      { value: 'unsure', label: 'Not sure' },
    ],
  },
];

/**
 * Three short headlines shown inline; the full terms sit behind a disclosure.
 *
 * These deliberately separate UPFRONT cost from GRANT PAYOUT. The grant is a
 * reimbursement paid in advances, so a homeowner needs capital or financing in
 * place before construction — saying only "covers up to 70%" reads as money
 * arriving first, which sets the wrong expectation.
 */
const HAMILTON_FUNDING_GUIDANCE: FundingGuidance = {
  heading: 'That’s what the visit is for',
  lead: 'The Hamilton grant is paid out after the work is finished and inspected. Homeowners rarely have that cash ready upfront.',
  leadEmphasis: 'That’s normal.',
  // Four steps. Approval must appear — leaving it out implied a homeowner builds
  // first and finds out afterwards, which is the exact fear this screen answers.
  // Inspection stays out: five labels wrap onto a second line at card width,
  // which stops the strip reading as one sequence.
  milestones: ['Permit', 'Grant approved', 'Build', 'Grant released'],
  highlight: 'Many use an open loan with no early-payoff fee, cleared as the grant money arrives.',
  closing: 'Your consultant will walk you through the exact math and timeline during your visit.',
  continueLabel: 'Continue',
};

const HAMILTON_FUNDING_HIGHLIGHTS = [
  'Covers up to 70% of eligible costs, to a maximum of $40,000 per unit.',
  'Upfront Funding: You cover or finance initial construction costs (financing options available).',
  'Grant Payout: Up to $40,000 paid back in two advances ($8,000 upon permit approval, remaining balance upon final completion).',
];

export const HAMILTON_PROGRAM: ProgramConfig = {
  key: 'hamilton-adu-grant',
  version: 1,
  schedulingArea: 'HAMILTON',
  // The City's money, so the address decides — a Burlington address must never
  // pick up Hamilton's grant just because it arrived on Hamilton's page.
  geography: 'municipality',
  // Closed August 6, 2026 — the City's intake reached its funding capacity.
  //
  // Commit #17 removed the booking CTAs from the three pages that sold this
  // grant, but the flow itself stayed live, so every link that does not pass
  // through those pages — a running Meta ad, an earlier SMS, a bookmark — still
  // walked a homeowner to the calendar for a grant they can no longer apply
  // for. This is the switch that actually stops the booking: the API refuses
  // slots and bookings for a disabled program, so it closes on the server, not
  // just in the UI.
  //
  // Everything else here is left exactly as it was. Leads already booked keep
  // resolving their program by key, and nothing about the configuration needs
  // rebuilding if Hamilton reopens — this flips back to true with the closure
  // entry removed.
  enabled: false,
  closure: HAMILTON_ADU_CLOSURE,
  slug: 'hamilton',
  areaLabel: 'Hamilton',
  displayAmountLabel: 'up to $40,000 per eligible unit',
  fundingHighlights: HAMILTON_FUNDING_HIGHLIGHTS,
  programTerms: [
    'Covers up to 70% of eligible costs, to a maximum of $40,000 per eligible unit.',
    'The homeowner is responsible for remaining project costs.',
    'An issued City of Hamilton building permit is required before applying. (We handle the building permit process for you as part of the project design phase).',
    'The first advance follows application approval and is 20% of the estimated grant, capped at $8,000 per unit, calculated from a contractor’s estimate of eligible costs.',
    'The second advance follows occupancy-permit issuance and is calculated from actual eligible costs incurred.',
    'Both advances together cannot exceed $40,000 per eligible unit.',
  ],
  whyFreeText:
    "Contractors don't want to spend days researching grant rules and property eligibility for free, and homeowners don't want to pay upfront just to learn whether a secondary suite is even worth pursuing. We organize the details of your project upfront so it's ready for a builder to evaluate properly. When a project's a good fit, participating builders pay us for access to organized, qualified opportunities instead of chasing leads that go nowhere. That keeps our review free for you, and you're free to compare or decline any proposal you receive.",
  fundingGuidance: HAMILTON_FUNDING_GUIDANCE,
  eligibleProjectTypes: ['secondary_suite', 'garden_suite', 'laneway_suite'],
  // The grant's scarce in-person slots stay near the decision.
  nurtureTimelines: DEFAULT_NURTURE_TIMELINES,
  questions: [OWNERSHIP, PROJECT_TYPE, TIMELINE, CONTRIBUTION],
  prepQuestions: PREP_QUESTIONS,
  consultationMode: 'in_person',
  appointmentProjectTypeLabel: 'ADU Grant Consultation',
  noteTemplateId: 'hamilton-grant',
  guideUrl: '/hamilton-grant-guide',
  guideLabel: 'Hamilton $40,000 Grant Guide',
  officialSourceUrls: [],
  ...SHARED_SCHEDULING,
};

/**
 * Simcoe County exists as a complete configuration slot so the boundary is real,
 * but the homeowner flow stays OFF and the municipality map stays EMPTY until the
 * confirmed municipality list and exact funding rules are supplied. Nothing here
 * is guessed. Simcoe addresses therefore resolve to MANUAL_REVIEW, never DECLINE.
 */
export const SIMCOE_PROGRAM: ProgramConfig = {
  key: 'simcoe-adu-program',
  version: 0,
  schedulingArea: 'SIMCOE',
  geography: 'municipality',
  enabled: false,
  slug: 'simcoe',
  areaLabel: 'Simcoe County',
  displayAmountLabel: '',
  fundingHighlights: [],
  programTerms: [],
  whyFreeText: HAMILTON_PROGRAM.whyFreeText,
  // Empty like every other Simcoe funding field: the payout milestones are not
  // confirmed, and this copy describes them. Simcoe asks no funding question, so
  // the screen is unreachable until both are supplied together.
  fundingGuidance: {
    heading: '', lead: '', leadEmphasis: '', milestones: [], highlight: '', closing: '', continueLabel: '',
  },
  eligibleProjectTypes: [],
  nurtureTimelines: DEFAULT_NURTURE_TIMELINES,
  questions: [OWNERSHIP, PROJECT_TYPE, TIMELINE],
  prepQuestions: PREP_QUESTIONS,
  consultationMode: 'in_person',
  appointmentProjectTypeLabel: 'ADU Grant Consultation',
  noteTemplateId: '',
  guideUrl: '',
  guideLabel: '',
  officialSourceUrls: [],
  ...SHARED_SCHEDULING,
};


// ─── Basement renovation financing ────────────────────────────────────────────
// Not a grant and not a city's money: our own financing offer, so it has no
// municipal boundary and is declared 'ontario_wide'. The landing page decides
// that this program applies, not the address — see resolveProgramGeography.
//
// Every figure below is taken from signed sales agreements rather than written
// for the page. The three most recent quote 7.99%, 8.99% and 9.99%, all on a
// 36-month term with a 240-month amortization, and all state the same structure:
// nothing upfront, up to 40% of funds released at signing or commencement with
// the owner's authorization, the balance after completion, no early-payment
// penalty and no lien registered. Nothing here may be changed without a document
// that says so.

const BASEMENT_PROJECT_TYPE: Question = {
  key: 'projectType',
  label: 'What are you planning?',
  routingRelevant: true,
  step: 2,
  options: [
    { value: 'basement_finish', label: 'Finish an unfinished basement' },
    { value: 'basement_renovation', label: 'Renovate an existing basement' },
    { value: 'basement_apartment', label: 'Basement apartment or in-law suite' },
    { value: 'unsure', label: 'Still deciding' },
  ],
};

const BASEMENT_CONTRIBUTION: Question = {
  key: 'contribution',
  label: 'How are you thinking about paying for the work?',
  help: 'Financing covers the full cost with nothing due upfront. Paying cash is fine too.',
  routingRelevant: true,
  step: 3,
  options: [
    { value: 'need_financing', label: "I'd like to use the monthly financing" },
    { value: 'cash_equity', label: 'Cash / Savings / Existing Home Equity' },
    { value: 'unsure', label: 'Not sure yet / Need guidance' },
  ],
};

/**
 * Shown to someone who answers "Not sure yet" on funding — the one screen in the
 * flow whose whole job is to remove a fear rather than collect an answer.
 *
 * The fear here is the opposite of the grant's. A grant homeowner worries the
 * money arrives too late; a financing homeowner worries about being on the hook
 * before anything is built. So the milestones lead with approval and with the
 * fact that nothing is owed upfront, and the highlight is the open loan — the
 * single term that most changes how the offer feels, because it means a payment
 * schedule is a floor and not a commitment.
 *
 * States no rate. Rate is the lender's call on the day, it varied across all
 * three agreements on file, and a number here would be quoted back to us.
 */
const BASEMENT_FUNDING_GUIDANCE: FundingGuidance = {
  heading: 'That is what the visit is for',
  lead: 'The financing covers the full cost of the build, so there is nothing to pay before the work starts.',
  leadEmphasis: 'Nothing upfront.',
  milestones: ['Approved', 'Funds released', 'Build', 'Balance released'],
  highlight:
    'It is an open loan — you can pay it down or pay it off at any time, with no penalty and no lien on your home.',
  closing: 'Your consultant will price your basement and walk through the exact monthly number with you.',
  continueLabel: 'Continue',
};

const BASEMENT_FUNDING_HIGHLIGHTS = [
  'No upfront cost — the build is financed in full, on approved credit.',
  'Up to 40% of funds can be released at signing or project start with your authorization; the remaining 60% after completion.',
  'Open loan: pay it down or pay it off at any time, with no penalty and no lien registered against your property.',
];

export const BASEMENT_FINANCING_PROGRAM: ProgramConfig = {
  key: 'basement-financing',
  version: 1,
  // ONTARIO is the bucket, not a region. Which properties are actually bookable
  // is decided by the same-day travel radius against a rep's existing day, so
  // widening coverage is a scheduling question, never a config edit here.
  schedulingArea: 'ONTARIO',
  geography: 'ontario_wide',
  enabled: true,
  slug: 'basement',
  areaLabel: 'Ontario',
  // "as low as" is doing real work: $399 is roughly a $42,000 project at the
  // lowest rate on file, and most projects finance higher. Stating it as a
  // starting point rather than a price is what keeps it honest.
  displayAmountLabel: 'from about $399 a month, on approved credit',
  fundingHighlights: BASEMENT_FUNDING_HIGHLIGHTS,
  // Four lines, not nine.
  //
  // This screen sits between a homeowner and a booking, not between them and a
  // signature. The rate table, the amortization, the 0.40% construction draw and
  // the worked example of what $399 buys are all TRUE and all belong in the
  // agreement the consultant walks through in person — putting them here asked
  // somebody to underwrite themselves off a phone screen, which is how a lead
  // talks itself out of a free visit.
  //
  // What survives is only what changes whether booking is a good idea: that
  // approval is required, that nothing is owed upfront, that they are never
  // trapped in it, and that the real numbers arrive in writing before anything
  // is signed.
  //
  // The one-time administration fee is deliberately not listed. It is financed
  // rather than paid upfront, so "no upfront cost" stays true without it, and
  // the fee lands with the rest of the real numbers in the written quote the
  // consultant walks through. It is not a term someone needs in order to decide
  // whether to book a visit.
  programTerms: [
    'Financing is a personal open loan and is subject to credit approval.',
    'Up to 40% of funds may be released at signing or project start with your authorization; the remaining 60% after completion.',
    'No upfront cost, no early payment penalties, and no liens registered against the property.',
    'Your exact rate, term and monthly payment are confirmed in writing before you sign anything.',
  ],
  whyFreeText:
    "Homeowners don't want to pay upfront just to find out what a basement costs, and contractors don't want to spend evenings quoting projects that were never going to happen. We scope the project properly first — measurements, condition, what you actually want — so a builder can price it for real. When a project is a good fit, participating builders pay us for access to organized, qualified opportunities instead of chasing leads that go nowhere. That keeps the visit free for you, and you're free to compare or decline any proposal you receive.",
  fundingGuidance: BASEMENT_FUNDING_GUIDANCE,
  eligibleProjectTypes: ['basement_finish', 'basement_renovation', 'basement_apartment'],
  // Everyone gets the calendar. There is no application deadline to be early
  // for, and someone "just exploring" is usually someone who does not yet know
  // the build is affordable — which is exactly what the visit demonstrates.
  nurtureTimelines: [],
  questions: [OWNERSHIP, BASEMENT_PROJECT_TYPE, TIMELINE, BASEMENT_CONTRIBUTION],
  prepQuestions: PREP_QUESTIONS,
  // Nobody prices a basement without standing in it.
  consultationMode: 'in_person',
  appointmentProjectTypeLabel: 'Basement Renovation Consultation',
  pageTitle: 'Basement Renovation Consultation | OntarioReno',
  fundingStepHeading: 'How the monthly financing works',
  // No dedicated template yet; the rep's brief still carries every answer.
  noteTemplateId: '',
  guideUrl: '',
  guideLabel: '',
  officialSourceUrls: [],
  ...SHARED_SCHEDULING,
};

// ─── Bathroom renovation financing ────────────────────────────────────────────
// The same financing product as the basement offer above — same lender, same
// signed structure — pointed at a different project. It is a separate program
// rather than another project type on the basement flow because the two are sold
// on different pages to different intent, and the rep's brief, the questions and
// the appointment label all need to say "bathroom".
//
// The financing terms below are copied from the basement program deliberately
// rather than shared: if one offer's terms ever change without the other's, the
// diff has to show it. Nothing here may be changed without a document that says
// so, exactly as above.

const BATHROOM_PROJECT_TYPE: Question = {
  key: 'projectType',
  label: 'What are you planning?',
  routingRelevant: true,
  step: 2,
  options: [
    { value: 'bathroom_refresh', label: 'Update an existing bathroom' },
    { value: 'bathroom_gut', label: 'Full gut and rebuild' },
    { value: 'bathroom_addition', label: 'Add a new bathroom' },
    { value: 'multiple_bathrooms', label: 'More than one bathroom' },
    { value: 'unsure', label: 'Still deciding' },
  ],
};

const BATHROOM_CONTRIBUTION: Question = {
  key: 'contribution',
  label: 'How are you thinking about paying for the work?',
  help: 'Financing covers the full cost with nothing due upfront. Paying cash is fine too.',
  routingRelevant: true,
  step: 3,
  options: [
    { value: 'need_financing', label: "I'd like to use the monthly financing" },
    { value: 'cash_equity', label: 'Cash / Savings / Existing Home Equity' },
    { value: 'unsure', label: 'Not sure yet / Need guidance' },
  ],
};

/**
 * Prep questions — asked AFTER booking, never before, and carrying no routing
 * weight. The basement set asks about entrances and permits, which a bathroom
 * project has no use for. What a rep actually wants before walking in is whether
 * the layout is moving (the single biggest driver of a bathroom quote), what is
 * there now, and whether there is a known water problem.
 */
const BATHROOM_PREP_QUESTIONS: Question[] = [
  {
    key: 'bathroomType',
    label: 'Which bathroom is it?',
    step: 3,
    options: [
      { value: 'main', label: 'Main / family bathroom' },
      { value: 'ensuite', label: 'Primary ensuite' },
      { value: 'powder', label: 'Powder room' },
      { value: 'basement', label: 'Basement bathroom' },
      { value: 'unsure', label: 'Not sure' },
    ],
  },
  {
    key: 'layoutChange',
    label: 'Is the layout staying the same?',
    step: 3,
    options: [
      { value: 'same_layout', label: 'Same layout, new finishes' },
      { value: 'moving_fixtures', label: 'Moving the tub, shower or toilet' },
      { value: 'unsure', label: 'Not sure' },
    ],
  },
  {
    key: 'waterDamage',
    label: 'Any known leaks or water damage?',
    step: 3,
    options: [
      { value: 'none', label: 'None that we know of' },
      { value: 'suspected', label: 'Something we are worried about' },
      { value: 'known', label: 'Yes, there is damage' },
      { value: 'unsure', label: 'Not sure' },
    ],
  },
];

const BATHROOM_FUNDING_GUIDANCE: FundingGuidance = {
  heading: 'That is what the visit is for',
  lead: 'The financing covers the full cost of the renovation, so there is nothing to pay before the work starts.',
  leadEmphasis: 'Nothing upfront.',
  milestones: ['Approved', 'Funds released', 'Build', 'Balance released'],
  highlight:
    'It is an open loan — you can pay it down or pay it off at any time, with no penalty and no lien on your home.',
  closing: 'Your consultant will price your bathroom and walk through the exact monthly number with you.',
  continueLabel: 'Continue',
};

const BATHROOM_FUNDING_HIGHLIGHTS = [
  'No upfront cost — the renovation is financed in full, on approved credit.',
  'Up to 40% of funds can be released at signing or project start with your authorization; the remaining 60% after completion.',
  'Open loan: pay it down or pay it off at any time, with no penalty and no lien registered against your property.',
];

export const BATHROOM_FINANCING_PROGRAM: ProgramConfig = {
  key: 'bathroom-financing',
  version: 1,
  schedulingArea: 'ONTARIO',
  geography: 'ontario_wide',
  enabled: true,
  slug: 'bathroom',
  areaLabel: 'Ontario',
  // "from about" is load bearing, more so here than on the basement offer.
  //
  // $99 is an entry-point payment, not a price: at the same rate and
  // amortization the basement's $399 comes from, it is roughly a $10,000
  // project, and this site's own bathroom page puts a typical Ontario bathroom
  // at $15,000–$40,000. So most homeowners reading this will finance well above
  // $99, and the wording has to make that obvious before a consultant is stood
  // in a bathroom walking a number back. Stated as a starting point, never as
  // "your payment", and never without "on approved credit".
  displayAmountLabel: 'from about $99 a month, on approved credit',
  fundingHighlights: BATHROOM_FUNDING_HIGHLIGHTS,
  programTerms: [
    'Financing is a personal open loan and is subject to credit approval.',
    'Up to 40% of funds may be released at signing or project start with your authorization; the remaining 60% after completion.',
    'No upfront cost, no early payment penalties, and no liens registered against the property.',
    'Your exact rate, term and monthly payment are confirmed in writing before you sign anything.',
  ],
  whyFreeText:
    "Homeowners don't want to pay upfront just to find out what a bathroom costs, and contractors don't want to spend evenings quoting projects that were never going to happen. We scope the project properly first — measurements, condition, what you actually want — so a builder can price it for real. When a project is a good fit, participating builders pay us for access to organized, qualified opportunities instead of chasing leads that go nowhere. That keeps the visit free for you, and you're free to compare or decline any proposal you receive.",
  fundingGuidance: BATHROOM_FUNDING_GUIDANCE,
  eligibleProjectTypes: [
    'bathroom_refresh',
    'bathroom_gut',
    'bathroom_addition',
    'multiple_bathrooms',
  ],
  // Same reasoning as the basement offer: no application window to be early for,
  // and an exploratory lead is usually someone who has not been shown the build
  // is affordable yet. Everyone gets the calendar.
  nurtureTimelines: [],
  questions: [OWNERSHIP, BATHROOM_PROJECT_TYPE, TIMELINE, BATHROOM_CONTRIBUTION],
  prepQuestions: BATHROOM_PREP_QUESTIONS,
  // Nobody prices tile, waterproofing and a plumbing move off a photo.
  consultationMode: 'in_person',
  appointmentProjectTypeLabel: 'Bathroom Renovation Consultation',
  pageTitle: 'Bathroom Renovation Consultation | OntarioReno',
  fundingStepHeading: 'How the monthly financing works',
  noteTemplateId: '',
  guideUrl: '',
  guideLabel: '',
  officialSourceUrls: [],
  ...SHARED_SCHEDULING,
};

// ─── Kitchen renovation financing ─────────────────────────────────────────────
// Third of the three financing offers, same lender and same signed structure as
// the basement and bathroom ones. Separate program for the same reason the
// bathroom is separate: different page, different intent, and the rep's brief
// and the appointment label have to say "kitchen".
//
// Terms are copied rather than shared, deliberately, exactly as above — if one
// offer's terms ever change without the others', the diff has to show it.

const KITCHEN_PROJECT_TYPE: Question = {
  key: 'projectType',
  label: 'What are you planning?',
  routingRelevant: true,
  step: 2,
  options: [
    { value: 'full_remodel', label: 'Full Kitchen Remodel' },
    { value: 'cabinets_countertops', label: 'Cabinets & Countertops Only' },
    { value: 'unsure', label: 'Not Sure / Undecided' },
  ],
};

/**
 * Kitchen's own timeline question — NOT the shared TIMELINE above.
 *
 * The shared one is used by Hamilton, Simcoe, basement and bathroom, and
 * editing it in place would have silently changed four live flows to make one
 * of them shorter. This is the same question with the two low-intent answers
 * folded together.
 *
 * The VALUES are deliberately unchanged from the shared set ('asap',
 * '1_3_months', 'exploring'), so routing, the rep's brief and anything counting
 * timelines across programs keep reading the same vocabulary.
 *
 * What genuinely changes: a homeowner who is three-plus months out now answers
 * 'exploring' rather than '3_plus_months', so they are tagged
 * EXPLORATORY_TIMELINE instead of TIMELINE_BEYOND_BOOKING_WINDOW. Both still
 * book — kitchen sets nurtureTimelines to [] — but the rep's brief no longer
 * distinguishes "far out but committed" from "browsing". That is the intended
 * trade for a shorter form, not an oversight.
 */
const KITCHEN_TIMELINE: Question = {
  key: 'timeline',
  label: 'When would you like to start?',
  routingRelevant: true,
  step: 2,
  options: [
    { value: 'asap', label: 'As soon as possible' },
    { value: '1_3_months', label: '1–3 months' },
    { value: 'exploring', label: 'Just planning / Exploring' },
  ],
};

const KITCHEN_CONTRIBUTION: Question = {
  key: 'contribution',
  label: 'How are you thinking about paying for the work?',
  help: 'Financing covers the full cost with nothing due upfront. Paying cash is fine too.',
  routingRelevant: true,
  step: 3,
  options: [
    { value: 'need_financing', label: "I'd like to use the monthly financing" },
    { value: 'cash_equity', label: 'Cash / Savings / Existing Home Equity' },
    { value: 'unsure', label: 'Not sure yet / Need guidance' },
  ],
};

/**
 * Prep questions — asked AFTER booking, never before, carrying no routing
 * weight. What actually moves a kitchen quote is cabinetry, whether services
 * are being moved, and whether appliances are in scope. None of the basement's
 * entrance-and-permit questions apply.
 */
const KITCHEN_PREP_QUESTIONS: Question[] = [
  {
    key: 'cabinetPlan',
    label: 'What are you thinking for cabinets?',
    step: 3,
    options: [
      { value: 'reface', label: 'Reface or paint what is there' },
      { value: 'all_new', label: 'All new cabinets' },
      { value: 'unsure', label: 'Not sure yet' },
    ],
  },
  {
    key: 'layoutChange',
    label: 'Is the layout staying the same?',
    step: 3,
    options: [
      { value: 'same_layout', label: 'Same layout, new finishes' },
      { value: 'moving_services', label: 'Moving the sink, gas or the range' },
      { value: 'removing_wall', label: 'Removing a wall' },
      { value: 'unsure', label: 'Not sure' },
    ],
  },
  {
    key: 'applianceScope',
    label: 'Are appliances part of the project?',
    step: 3,
    options: [
      { value: 'keeping', label: 'Keeping the current appliances' },
      { value: 'new_appliances', label: 'New appliances included' },
      { value: 'unsure', label: 'Not sure' },
    ],
  },
];

const KITCHEN_FUNDING_GUIDANCE: FundingGuidance = {
  heading: 'That is what the visit is for',
  lead: 'The financing covers the full cost of the renovation, so there is nothing to pay before the work starts.',
  leadEmphasis: 'Nothing upfront.',
  milestones: ['Approved', 'Funds released', 'Build', 'Balance released'],
  highlight:
    'It is an open loan — you can pay it down or pay it off at any time, with no penalty and no lien on your home.',
  closing: 'Your consultant will price your kitchen and walk through the exact monthly number with you.',
  continueLabel: 'Continue',
};

const KITCHEN_FUNDING_HIGHLIGHTS = [
  'No upfront cost — the renovation is financed in full, on approved credit.',
  'Up to 40% of funds can be released at signing or project start with your authorization; the remaining 60% after completion.',
  'Open loan: pay it down or pay it off at any time, with no penalty and no lien registered against your property.',
];

export const KITCHEN_FINANCING_PROGRAM: ProgramConfig = {
  key: 'kitchen-financing',
  version: 1,
  schedulingArea: 'ONTARIO',
  geography: 'ontario_wide',
  enabled: true,
  slug: 'kitchen',
  areaLabel: 'Ontario',
  // "from about" is doing the same work here as on the other two offers, and
  // the gap is the widest of the three: at the rate the basement's $399 comes
  // from, $199 is roughly a $21,000 project, where this site's own kitchen page
  // puts a typical Ontario kitchen at $30,000–$70,000 and most between $35,000
  // and $55,000. So $199 is an entry point most readers will finance well above.
  // Stated as a starting point, never as "your payment".
  displayAmountLabel: 'from about $199 a month, on approved credit',
  fundingHighlights: KITCHEN_FUNDING_HIGHLIGHTS,
  programTerms: [
    'Financing is a personal open loan and is subject to credit approval.',
    'Up to 40% of funds may be released at signing or project start with your authorization; the remaining 60% after completion.',
    'No upfront cost, no early payment penalties, and no liens registered against the property.',
    'Your exact rate, term and monthly payment are confirmed in writing before you sign anything.',
  ],
  whyFreeText:
    "Homeowners don't want to pay upfront just to find out what a kitchen costs, and contractors don't want to spend evenings quoting projects that were never going to happen. We scope the project properly first — measurements, condition, what you actually want — so a builder can price it for real. When a project is a good fit, participating builders pay us for access to organized, qualified opportunities instead of chasing leads that go nowhere. That keeps the visit free for you, and you're free to compare or decline any proposal you receive.",
  fundingGuidance: KITCHEN_FUNDING_GUIDANCE,
  eligibleProjectTypes: ['full_remodel', 'cabinets_countertops'],
  nurtureTimelines: [],
  questions: [OWNERSHIP, KITCHEN_PROJECT_TYPE, KITCHEN_TIMELINE, KITCHEN_CONTRIBUTION],
  prepQuestions: KITCHEN_PREP_QUESTIONS,
  // Nobody prices cabinetry and a possible wall removal off a photo.
  consultationMode: 'in_person',
  appointmentProjectTypeLabel: 'Kitchen Renovation Consultation',
  pageTitle: 'Kitchen Renovation Consultation | OntarioReno',
  fundingStepHeading: 'How the monthly financing works',
  noteTemplateId: '',
  guideUrl: '',
  guideLabel: '',
  officialSourceUrls: [],
  ...SHARED_SCHEDULING,
};

/**
 * The three financing offers, as a set.
 *
 * Exported so the tests can assert across all of them rather than pairwise —
 * the scheduling rules only hold if EVERY offer shares them, and a fourth
 * offer added without these constants would otherwise ship unnoticed.
 */
export const FINANCING_PROGRAMS: ProgramConfig[] = [
  BASEMENT_FINANCING_PROGRAM,
  BATHROOM_FINANCING_PROGRAM,
  KITCHEN_FINANCING_PROGRAM,
];

export const PROGRAMS: ProgramConfig[] = [
  HAMILTON_PROGRAM,
  SIMCOE_PROGRAM,
  ...FINANCING_PROGRAMS,
];

/**
 * Municipality → scheduling area.
 *
 * Hamilton is a single-tier amalgamated city, so Places returns community names
 * rather than "Hamilton" for many valid addresses. All six former municipalities
 * are listed, plus the two commonly-returned nested communities.
 *
 * SIMCOE is intentionally absent: the participating municipality list has not
 * been confirmed, and guessing it would route real homeowners incorrectly.
 */
export const MUNICIPALITY_AREA: Record<string, SchedulingArea> = {
  hamilton: 'HAMILTON',
  ancaster: 'HAMILTON',
  dundas: 'HAMILTON',
  flamborough: 'HAMILTON',
  glanbrook: 'HAMILTON',
  'stoney creek': 'HAMILTON',
  waterdown: 'HAMILTON', // within Flamborough
  binbrook: 'HAMILTON', // within Glanbrook
};

const normalizeMunicipality = (v: string) => v.trim().toLowerCase().replace(/\s+/g, ' ');

/** Scheduling area for a municipality name, or null when unrecognised. */
export function areaForMunicipality(municipality: string | null | undefined): SchedulingArea | null {
  if (!municipality) return null;
  return MUNICIPALITY_AREA[normalizeMunicipality(municipality)] ?? null;
}

/**
 * Causes that mean "we have a real, complete, Ontario address" — even if the
 * municipality maps to no scheduling area. An Ontario-wide program can schedule
 * on any of these; the rest are genuine doubt about the address itself and must
 * keep going to a human exactly as they do today.
 */
const ADDRESS_USABLE_CAUSES = new Set<AddressResolutionCause>([
  'RESOLVED',
  'RESOLVED_FROM_TYPED_TEXT',
  'MUNICIPALITY_UNMAPPED',
]);

export type GeographyInput = {
  area: SchedulingArea | null;
  addressState: AddressState;
  cause: AddressResolutionCause;
};

/**
 * The scheduling area and address state a program should actually be routed on.
 *
 * For a municipality-gated program this returns its input untouched — the City's
 * money, the address decides, nothing changes.
 *
 * For an Ontario-wide program it fills the gap that would otherwise send every
 * lead to a queue: a complete Toronto address maps to no SchedulingArea, so it
 * arrived as ADDRESS_UNVERIFIED with area null, which routing reads as
 * MUNICIPALITY_UNRECOGNISED and slot generation reads as "no area, no calendar".
 * That is correct for a Hamilton grant and wrong for financing, which has no
 * municipal boundary. So the area becomes ONTARIO and an address that was only
 * unverified BECAUSE of the unmapped municipality is promoted to verified.
 *
 * What it deliberately does not do:
 *   - rescue an address outside Ontario. That decline is still a decline.
 *   - rescue an incomplete address, ambiguous typed text, or a provider outage.
 *     Those are doubt about the ADDRESS, which no program's geography can fix.
 *   - upgrade ADDRESS_INFERRED to ADDRESS_VERIFIED. Inferred is already
 *     schedulable and the weaker provenance stays on the record.
 */
export function resolveProgramGeography(
  program: Pick<ProgramConfig, 'geography'>,
  resolved: GeographyInput
): { area: SchedulingArea | null; addressState: AddressState } {
  const { area, addressState, cause } = resolved;
  if (program.geography !== 'ontario_wide') return { area, addressState };
  if (addressState === 'ADDRESS_OUTSIDE_SERVICE_AREA') return { area, addressState };
  if (!ADDRESS_USABLE_CAUSES.has(cause)) return { area, addressState };

  return {
    area: 'ONTARIO',
    addressState:
      addressState === 'ADDRESS_UNVERIFIED' && cause === 'MUNICIPALITY_UNMAPPED'
        ? 'ADDRESS_VERIFIED'
        : addressState,
  };
}

/**
 * Derive a program from a scheduling area.
 *
 * Only meaningful for a municipality-gated area, where the area IS the program.
 * ONTARIO holds every financing offer (basement, bathroom, kitchen), so this
 * returns the first — which is why the submit branch never routes an
 * ontario_wide program through here and uses the landing page's slug instead.
 * The remaining callers are the legacy fallback for a stored lead with no
 * programKey, all of which predate the bathroom offer.
 */
export function programForArea(area: SchedulingArea | null): ProgramConfig | null {
  if (!area) return null;
  return PROGRAMS.find((p) => p.schedulingArea === area) ?? null;
}

export function programBySlug(slug: string): ProgramConfig | null {
  return PROGRAMS.find((p) => p.slug === slug) ?? null;
}

/** The program a stored lead was captured under, by its persisted programKey. */
export function programByKey(key: string | null | undefined): ProgramConfig | null {
  if (!key) return null;
  return PROGRAMS.find((p) => p.key === key) ?? null;
}

/**
 * Turn a stored answer value into the words the homeowner actually saw.
 *
 * Searches prepQuestions as well as questions: the booking branch's local
 * version looked only at `questions`, so the three prep keys (basementStatus,
 * separateEntrance, permitStatus) rendered blank wherever they appeared.
 *
 * Falls back to the raw value rather than to '' — an unrecognised value is
 * still information, and silently blanking it hides the fact that a lead was
 * captured under a question set that has since changed.
 */
export function answerLabel(
  program: ProgramConfig | null,
  key: string,
  value: string | null | undefined
): string {
  const raw = (value ?? '').trim();
  if (!raw) return '';
  if (!program) return raw;
  const question = [...program.questions, ...program.prepQuestions].find((q) => q.key === key);
  return question?.options.find((o) => o.value === raw)?.label ?? raw;
}

export type ReadableAnswer = {
  key: string;
  /** The question as it was asked, or the bare key if we no longer ask it. */
  questionLabel: string;
  /** Raw stored value, kept so the UI can show what was actually recorded. */
  value: string;
  /** Human label, or '' when the homeowner left it blank. */
  valueLabel: string;
};

/**
 * Every stored answer, in the program's own question order.
 *
 * The submit branch writes every key in the question set even when blank, so
 * empty values are normal and are reported as such rather than dropped —
 * "not answered" is a different fact from "not asked".
 *
 * Keys present in the data but absent from the program (captured under an older
 * version, whose config we do not retain) are appended at the end rather than
 * discarded, labelled by their bare key.
 */
export function readableAnswers(
  program: ProgramConfig | null,
  answers: Record<string, unknown> | null | undefined
): ReadableAnswer[] {
  const stored = (answers ?? {}) as Record<string, unknown>;
  const out: ReadableAnswer[] = [];
  const seen = new Set<string>();

  for (const question of [...(program?.questions ?? []), ...(program?.prepQuestions ?? [])]) {
    if (!(question.key in stored)) continue;
    seen.add(question.key);
    const value = String(stored[question.key] ?? '').trim();
    out.push({
      key: question.key,
      questionLabel: question.label,
      value,
      valueLabel: answerLabel(program, question.key, value),
    });
  }

  for (const [key, rawValue] of Object.entries(stored)) {
    if (seen.has(key)) continue;
    const value = String(rawValue ?? '').trim();
    out.push({ key, questionLabel: key, value, valueLabel: value });
  }

  return out;
}

/** Public-facing question set, minus anything with no options. */
export function publicQuestions(program: ProgramConfig): Question[] {
  return program.questions.filter((q) => q.options.length > 0);
}

/** Questions for one screen of the progressive flow. */
export function questionsForStep(program: ProgramConfig, step: 1 | 2 | 3): Question[] {
  return publicQuestions(program).filter((q) => q.step === step);
}
