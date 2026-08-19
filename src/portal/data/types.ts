export type PortalRole = 'admin' | 'rep' | 'contractor';

export type User = {
  id: string;
  name: string;
  role: PortalRole;
  email: string;
  avatarInitial: string;
  avatarUrl?: string;
  passwordHash?: string;
  active: boolean;
  /** For contractor accounts — the contractor this login is scoped to. */
  contractorId?: string | null;
  /** Display name of the linked contractor (returned by login/me). */
  contractorName?: string | null;
};

export type FinancingStatus =
  | 'financing_available'
  | 'cash_only'
  | 'pending_financing';

export type ContractorStatus = 'active' | 'pending' | 'inactive';

/** A lender a contractor runs financing through (FinanceIt, iFinance, …). */
export type FinancePartner = {
  id: string;
  name: string;
  logoUrl?: string | null;
  website?: string;
  notes?: string;
  active: boolean;
  sortOrder: number;
};

export type Contractor = {
  id: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  website: string;
  logoUrl?: string;
  publicCompanyName?: string;
  publicPhone?: string;
  publicEmail?: string;
  publicWebsite?: string;
  emailFooterText?: string;
  financingStatus: FinancingStatus;
  /** Ids of the FinancePartners this contractor is set up with. Often empty. */
  financePartnerIds: string[];
  contractorStatus: ContractorStatus;
  serviceAreas: string[];
  projectTypes: string[];
  averageProjectSize: number;
  notes: string;
  priorityScore: number;
  /** Mailing address — used for the commission-invoice "TO" box. */
  address?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  /** Total commission rate negotiated with this contractor (fraction, e.g. 0.085).
   *  Admin-only — the API strips this field for non-admin users. */
  commissionRate?: number;
};

export type DealStatus =
  | 'new_lead'
  | 'appointment_booked'
  | 'quoted'
  | 'negotiating'
  | 'won'
  | 'lost';

export type DealActivity = {
  id: string;
  createdAt: string;
  note: string;
};

export type ActivityEntityType =
  | 'deal'
  | 'contractor'
  | 'commission'
  | 'rep'
  | 'proposal'
  | 'appointment';

export type AppointmentType =
  | 'home_visit'
  | 'phone_consultation'
  | 'video_consultation'
  | 'showroom_visit'
  | 'supplier_meeting'
  | 'site_check'
  | 'custom_event';

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'completed'
  | 'rescheduled'
  | 'cancelled'
  | 'no_show';

export type AppointmentSource = 'manual' | 'google_calendar';

export type ConsultationStage =
  | 'lead_qualified'
  | 'consultation_scheduled'
  | 'consultation_completed'
  | 'estimate_requested'
  | 'contractor_review'
  | 'proposal_sent'
  | 'contractor_accepted'
  | 'won'
  | 'lost'
  | 'follow_up_required';

export type ConsultationInterestLevel =
  | 'hot'
  | 'warm'
  | 'cold'
  | 'not_interested';

export type ConsultationNextStep =
  | 'estimate_required'
  | 'contractor_review'
  | 'follow_up_required'
  | 'won'
  | 'lost'
  | 'no_action';

export type Appointment = {
  id: string;
  dealId: string | null;
  customerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  projectType: string;
  assignedRepId: string;
  contractorId: string | null;
  appointmentDate: string;
  appointmentTime: string;
  durationMinutes: number;
  appointmentType: AppointmentType;
  status: AppointmentStatus;
  consultationStage: ConsultationStage;
  location: string;
  notes: string;
  customerNotes: string;
  internalNotes: string;
  source: AppointmentSource;
  title?: string;
  outcomeSubmitted: boolean;
  outcomeSubmittedAt?: string;
  outcomeSubmittedByUserId?: string;
  estimatedProjectValue: number;
  financingNeeded: boolean | null;
  homeownerInterestLevel: ConsultationInterestLevel | null;
  nextStep: ConsultationNextStep;
  recommendedContractorId: string | null;
  closeProbability: number;
  outcomeNotes: string;
  objections: string;
  followUpDate: string;
  clientId?: string | null;
  /** Set when the consultation was booked from a Lead in the Sales Workspace. */
  leadId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  /**
   * True when the property is outside the drive radius and this consultation is
   * a video/phone call. THE scheduling source of truth (see lib/scheduling.ts)
   * — the calendar reads it to mark the booking so a rep can tell a call from a
   * drive at a glance. Never derive scheduling behaviour from appointmentType.
   */
  remoteConsultation?: boolean | null;
  deletedAt?: string | null;
  externalCalendarId?: string;
  externalEventId?: string;
  syncedAt?: string;
  reminderMinutes: number;
  reminderSentAt?: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
};

export type Client = {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  projectTypes: string[];
  internalNotes: string;
  source: string;
  householdId?: string | null;
  deletedAt?: string | null;
  createdByUserId: string;
  /** Who last saved the profile. Null on rows written before this was recorded. */
  updatedByUserId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RepDayOff = {
  id: string;
  userId: string;
  date: string;
  note: string;
  createdAt: string;
};

export type SalesAgreement = {
  id: string;
  dealId: string;
  fileName: string;
  url: string;
  uploadedByUserId: string;
  createdAt: string;
};

/**
 * Drawings, permits and other supporting paperwork on a deal.
 *
 * Separate from SalesAgreement on purpose — see the note on the Prisma model.
 * There is one signed agreement per deal and many documents, and only the
 * agreement is read by the commission flow.
 */
export type DealDocument = {
  id: string;
  dealId: string;
  fileName: string;
  url: string;
  /** 'drawings_permits' today; a label rather than an enum. */
  category: string;
  /** Original MIME type — reps photograph permits as often as they scan them. */
  contentType: string;
  uploadedByUserId: string;
  createdAt: string;
};

export type Household = {
  id: string;
  name: string;
  notes: string;
  memberIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type Activity = {
  id: string;
  actorUserId: string;
  actorName: string;
  actorRole: PortalRole;
  actionType: string;
  actionLabel: string;
  entityType: ActivityEntityType;
  entityId: string;
  entityLabel: string;
  dealId?: string;
  contractorId?: string;
  createdAt: string;
  metadata?: Record<string, string | number | boolean | null>;
  /** Client-only flag: a locally-created activity awaiting persistence to the
   *  DB. Stripped before POST; never present on server-returned activities. */
  pendingSync?: boolean;
};

export type Deal = {
  id: string;
  /** Link to the originating client record (source of truth for contact info). */
  clientId?: string | null;
  homeownerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  projectType: string;
  estimatedJobValue: number;
  /** Promotional finance fee (%) deducted from the job value before commission. */
  financeFeePercent?: number;
  financingRequired: boolean;
  assignedRepId: string;
  assignedContractorId: string | null;
  status: DealStatus;
  notes: string;
  nextFollowUpDate: string;
  /** Deals imported from before the portal existed. Excluded from leaderboard rankings. */
  isHistorical?: boolean;
  /** Sequential commission-invoice number, assigned on first invoice generation. */
  invoiceNumber?: number | null;
  activity: DealActivity[];
  createdAt: string;
  updatedAt: string;
};

/** A personal to-do item owned by one user. */
export type Task = {
  id: string;
  userId: string;
  title: string;
  dueAt?: string | null;
  done: boolean;
  createdAt: string;
  updatedAt: string;
};

/** The "FROM" box on the commission invoice — your incorporation details. */
export type BusinessProfile = {
  legalName: string;
  addressLine1: string;
  addressLine2: string;
  hstNumber: string;
  bankName: string;
  institutionNumber: string;
  transitNumber: string;
  accountNumber: string;
};

export type CommissionInvoiceRecord = {
  id: string;
  invoiceNumber: number | null;
  dealId: string | null;
  contractorId: string | null;
  customerName: string;
  contractorName: string;
  salesPrice: number;
  commissionRate: number;
  baseAmount: number;
  adjustmentsTotal: number;
  netAmount: number;
  sentTo: string;
  sentByUserId: string | null;
  createdAt: string;
  /** Full JSON snapshot of the invoice data, used to re-render the exact PDF. */
  snapshot?: string | null;
};

export type FinanceFile = {
  key: string;
  fileName: string;
};

export type FinanceDocument = {
  type: string;
  label: string;
  note?: string;
  requested: boolean;
  /** Every file attached to this row — a section can hold many (e.g. 6 months
   *  of statements). Read/written through the helpers in FinanceTab. */
  files?: FinanceFile[];
  /** Legacy single-file fields, written before a section could hold more than
   *  one. Still read so payloads saved back then keep rendering; new uploads
   *  only ever append to `files`. */
  key?: string;
  fileName?: string;
};

export type FinancePayload = {
  firstName: string;
  middleName: string;
  lastName: string;
  birthday: string; // YYYY-MM-DD
  phone: string;
  address: string;
  mailingSameAsInstall?: boolean; // mailing address = install (home) address
  mailingAddress?: string; // used only when mailingSameAsInstall is false
  email: string;
  incomeWithTaxes: string;
  otherIncome: string;
  housingStatus?: 'own' | 'rent' | ''; // owns with a mortgage, or rents
  monthlyHousingPayment?: string; // monthly mortgage or rent
  employer: string;
  employmentPosition: string;
  employerAddress: string;
  dlPhotoKey?: string;
  dlPhotoName?: string;
  status: 'draft' | 'submitted' | 'approved' | 'declined';
  documents: FinanceDocument[];
  notes?: string;
};

export type ClientVideo = {
  id: string;
  clientId: string;
  label: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  uploadedByUserId: string | null;
  createdAt: string;
  /** Short-lived signed URL for streaming the private video. */
  url: string;
};

export type SaleTrackerFundedStatus = 'YES' | 'PARTIALLY' | 'NO' | '';

export type SaleTrackerRow = {
  id: string;
  repId: string;
  dealId?: string | null;
  clientName: string;
  projectTotal: number;
  paymentType: string;
  city: string;
  startDate: string;
  signingStatus: string;
  approvalStatus: string;
  fundedStatus: SaleTrackerFundedStatus;
  amountLeftToPay: number | null;
  notes: string;
  onHold: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

// ─── Leads + Interactions (Sales Workspace) ──────────────────────────────────

export type LeadStatus =
  | 'new'
  | 'attempting'
  | 'callback_scheduled'
  | 'booked'
  | 'qualified'
  | 'won'
  | 'lost'
  | 'dead'
  | 'duplicate';

/** Statuses that drop a lead out of the call queue entirely. */
export const TERMINAL_LEAD_STATUSES: LeadStatus[] = [
  'booked',
  'qualified',
  'won',
  'lost',
  'dead',
  'duplicate',
];

export type LeadSource = 'meta' | 'import' | 'manual';

export type CallOutcome =
  | 'no_answer'
  | 'voicemail'
  | 'callback_scheduled'
  | 'not_interested'
  | 'wrong_number'
  | 'duplicate'
  | 'not_qualified'
  | 'already_booked'
  | 'needs_follow_up'
  | 'booked';

export type InteractionChannel =
  | 'call'
  | 'sms'
  | 'email'
  | 'whatsapp'
  | 'note'
  | 'system'
  | 'ai_summary';

export type InteractionDirection = 'outbound' | 'inbound' | 'internal';

export type Interaction = {
  id: string;
  leadId: string;
  userId: string | null;
  channel: InteractionChannel;
  outcome: CallOutcome | null;
  body: string;
  occurredAt: string;
  // Stored on the row but NOT returned by the leads list — see interactionSelect
  // in api/leads/index.ts. Optional so nothing reads them off list state by
  // accident; fetch the row directly if a screen ever needs them.
  direction?: InteractionDirection;
  subject?: string | null;
  durationSeconds?: number | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: string;
};

export type Lead = {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  postalCode: string;
  projectType: string;
  budget: string;
  financingInterest: boolean | null;
  source: LeadSource | string;
  sourceDetail: string;
  externalId?: string | null;
  submittedAt: string;
  status: LeadStatus;
  assignedRepId: string | null;
  callbackAt: string | null;
  lastContactedAt: string | null;
  attemptCount: number;
  notes: string;
  clientId?: string | null;
  dealId?: string | null;
  appointmentId?: string | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  /** Embedded by the API on list/queue fetches. */
  interactions: Interaction[];

  // ── Consultation-flow capture ──
  // Written by the public flow (api/leads/index.ts, ?flow=submit). Already on
  // the wire everywhere — leadInclude uses `include`, not `select` — so these
  // were only ever missing from the type. Optional because leads from other
  // sources (manual, meta, import) never carry them.
  programKey?: string | null;
  programVersion?: number | null;
  schedulingArea?: string | null;
  addressState?: AddressState | null;
  resolvedMunicipality?: string | null;
  answersJson?: Record<string, string> | null;
  routingOutcome?: RoutingOutcome | null;
  routingReasonCodes?: string[];
  /** '' on every lead submitted before the column existed — unknown, not clean. */
  addressResolutionCause?: string;
  needsReview?: boolean;

  // ── Submissions-log worklist ──
  /** null = unworked. Moves only on an explicit click. */
  submissionContactedAt?: string | null;
  submissionContactedById?: string | null;
  submissionOutcomeNote?: string;
};

export type RoutingOutcome = 'DIRECT_CALENDAR' | 'MANUAL_REVIEW' | 'NURTURE' | 'DECLINE';

/** Mirrors AddressState in lib/program-config.ts — keep the two in step. */
export type AddressState =
  | 'ADDRESS_VERIFIED'
  /** Resolved from typed text that matched exactly one real address. */
  | 'ADDRESS_INFERRED'
  | 'ADDRESS_UNVERIFIED'
  | 'ADDRESS_OUTSIDE_SERVICE_AREA';

/** Booking status for a submission, fetched alongside the submissions log. */
export type SubmissionAppointment = {
  id: string;
  status: string;
  appointmentDate: string;
  appointmentTime: string;
  publicReference: string | null;
  deletedAt?: string | null;
};

export type SubmissionsPayload = {
  leads: Lead[];
  appointments: SubmissionAppointment[];
};

/** One row of a pasted/uploaded lead import (admin). */
export type LeadImportRow = {
  name: string;
  phone?: string;
  email?: string;
  city?: string;
  address?: string;
  postalCode?: string;
  projectType?: string;
  budget?: string;
  financingInterest?: boolean | null;
  source?: string;
  sourceDetail?: string;
  submittedAt?: string;
  notes?: string;
  externalId?: string;
  importSource?: 'auto' | 'meta' | 'website_intake';
  importStatus?: string;
  extraAnswers?: Record<string, string>;
};

export type LeadImportResult = {
  created: number;
  updated: number;
  merged: number;
  duplicates: number;
  skipped: number;
  failed: number;
  failures: Array<{ row: number; name?: string; reason: string }>;
};

/** A reusable Customer Notes template for booking consultations. */
export type NoteTemplate = { id: string; label: string; body: string };

export type CommissionPayoutStatus = 'pending' | 'partial' | 'paid';

export type Commission = {
  id: string;
  dealId: string;
  repId: string;
  repCommissionRate: number;
  repEstimatedCommission: number;
  repPaidCommission: number;
  payoutStatus: CommissionPayoutStatus;
  adminTotalCommissionRate: number;
  adminTotalEstimatedCommission: number;
  adminNetCommission: number;
  /** How much of the admin's net (total − rep) has been collected from the
   *  contractor. Tracked independently of the rep payout. Optional only so
   *  older records/seed data compile; the DB column is non-null (default 0). */
  adminNetPaidCommission?: number;
  /** One-off flat payout: total + rep amounts are entered manually and NOT
   *  recomputed from job value × rate. */
  customPayout?: boolean;
};

export type ProposalTemplateType =
  | 'new_job_opportunity'
  | 'financing_required'
  | 'cash_job'
  | 'contractor_follow_up';

export type ProposalHistory = {
  id: string;
  contractorId: string;
  dealId: string;
  templateType: ProposalTemplateType;
  proposalSubject: string;
  proposalBody: string;
  sentAt: string;
  sentByUserId: string;
};

export type ContractorDispatchStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'interested'
  | 'accepted'
  | 'declined'
  | 'expired';

export type ContractorDispatch = {
  id: string;
  consultationId?: string;
  dealId: string;
  contractorId: string;
  sentByUserId: string;
  sentAt: string;
  status: ContractorDispatchStatus;
  contractorResponseNote: string;
  safeSummary: string;
  estimatedProjectRange: string;
  financingRequired: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * A saved starting point for the Contract Creator. Captures everything that
 * repeats between deals — contractor, template, payment structure and the whole
 * scope of work — and deliberately omits client-specific fields, which change
 * every time.
 */
export type ContractPreset = {
  id: string;
  name: string;
  ownerUserId: string;
  /** Published by an admin for the whole team, rather than personal to one rep. */
  shared: boolean;
  contractorId: string;
  templateId: string;
  payload: unknown;
  createdAt: string;
  updatedAt: string;
};
