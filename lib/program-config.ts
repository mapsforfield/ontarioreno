// ─── Program configuration ────────────────────────────────────────────────────
// Programs are configuration, not code. Adding a municipality or a scheduling
// area is a data change here; the flow, routing and scheduling are area-agnostic.
//
// Shared by the public page and the API, so this module must stay free of Node
// imports — it is bundled into the browser.

export type SchedulingArea = 'HAMILTON' | 'SIMCOE';

/** Server-assigned. Never chosen by the homeowner. */
export type AddressState =
  | 'ADDRESS_VERIFIED'
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

export type ProgramConfig = {
  key: string;
  version: number;
  schedulingArea: SchedulingArea;
  /** Public flow is live only when true. */
  enabled: boolean;
  slug: string;
  areaLabel: string;
  /** The ONLY place an amount is rendered from. Never a literal in a component. */
  displayAmountLabel: string;
  /** Three short lines shown inline during the flow. */
  fundingHighlights: string[];
  /** Full terms, shown only behind a "full details" disclosure. */
  programTerms: string[];
  whyFreeText: string;
  eligibleProjectTypes: string[];
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
const HAMILTON_FUNDING_HIGHLIGHTS = [
  'Covers up to 70% of eligible costs, to a maximum of $40,000 per unit.',
  'Upfront Funding: You cover or finance initial construction costs (financing options available).',
  'Grant Payout: Up to $40,000 paid back in two advances ($8,000 upon permit approval, remaining balance upon final completion).',
];

export const HAMILTON_PROGRAM: ProgramConfig = {
  key: 'hamilton-adu-grant',
  version: 1,
  schedulingArea: 'HAMILTON',
  enabled: true,
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
  eligibleProjectTypes: ['secondary_suite', 'garden_suite', 'laneway_suite'],
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
  enabled: false,
  slug: 'simcoe',
  areaLabel: 'Simcoe County',
  displayAmountLabel: '',
  fundingHighlights: [],
  programTerms: [],
  whyFreeText: HAMILTON_PROGRAM.whyFreeText,
  eligibleProjectTypes: [],
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

export const PROGRAMS: ProgramConfig[] = [HAMILTON_PROGRAM, SIMCOE_PROGRAM];

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

export function programForArea(area: SchedulingArea | null): ProgramConfig | null {
  if (!area) return null;
  return PROGRAMS.find((p) => p.schedulingArea === area) ?? null;
}

export function programBySlug(slug: string): ProgramConfig | null {
  return PROGRAMS.find((p) => p.slug === slug) ?? null;
}

/** Public-facing question set, minus anything with no options. */
export function publicQuestions(program: ProgramConfig): Question[] {
  return program.questions.filter((q) => q.options.length > 0);
}

/** Questions for one screen of the progressive flow. */
export function questionsForStep(program: ProgramConfig, step: 1 | 2 | 3): Question[] {
  return publicQuestions(program).filter((q) => q.step === step);
}
