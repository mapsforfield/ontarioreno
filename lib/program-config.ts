// ─── Program configuration ────────────────────────────────────────────────────
// Programs are configuration, not code. Adding a municipality or a scheduling
// area is a data change here; the flow, routing and scheduling are area-agnostic.
//
// Shared by the public page and the API, so this module must stay free of Node
// imports — it is bundled into the browser.

import { HAMILTON_ADU_CLOSURE, type ProgramClosure } from '../src/lib/programClosures.js';

export type SchedulingArea = 'HAMILTON' | 'SIMCOE';

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

export type ProgramConfig = {
  key: string;
  version: number;
  schedulingArea: SchedulingArea;
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
  // Empty like every other Simcoe funding field: the payout milestones are not
  // confirmed, and this copy describes them. Simcoe asks no funding question, so
  // the screen is unreachable until both are supplied together.
  fundingGuidance: {
    heading: '', lead: '', leadEmphasis: '', milestones: [], highlight: '', closing: '', continueLabel: '',
  },
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
