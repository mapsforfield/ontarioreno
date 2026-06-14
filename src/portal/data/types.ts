export type PortalRole = 'admin' | 'rep';

export type User = {
  id: string;
  name: string;
  role: PortalRole;
  email: string;
  avatarInitial: string;
  avatarUrl?: string;
  passwordHash?: string;
  active: boolean;
};

export type FinancingStatus =
  | 'financing_available'
  | 'cash_only'
  | 'pending_financing';

export type ContractorStatus = 'active' | 'pending' | 'inactive';

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
  contractorStatus: ContractorStatus;
  serviceAreas: string[];
  projectTypes: string[];
  averageProjectSize: number;
  notes: string;
  priorityScore: number;
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
  latitude?: number | null;
  longitude?: number | null;
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
  createdByUserId: string;
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
  homeownerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  projectType: string;
  estimatedJobValue: number;
  financingRequired: boolean;
  assignedRepId: string;
  assignedContractorId: string | null;
  status: DealStatus;
  notes: string;
  nextFollowUpDate: string;
  /** Deals imported from before the portal existed. Excluded from leaderboard rankings. */
  isHistorical?: boolean;
  activity: DealActivity[];
  createdAt: string;
  updatedAt: string;
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
