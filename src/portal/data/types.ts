export type PortalRole = 'admin' | 'rep';

export type User = {
  id: string;
  name: string;
  role: PortalRole;
  email: string;
  avatarInitial: string;
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
  financingStatus: FinancingStatus;
  contractorStatus: ContractorStatus;
  serviceAreas: string[];
  projectTypes: string[];
  averageProjectSize: number;
  notes: string;
  priorityScore: number;
};

export type DealStatus =
  | 'new_lead'
  | 'contacted'
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

export type Deal = {
  id: string;
  homeownerName: string;
  phone: string;
  email: string;
  city: string;
  projectType: string;
  estimatedJobValue: number;
  financingRequired: boolean;
  assignedRepId: string;
  assignedContractorId: string | null;
  status: DealStatus;
  notes: string;
  nextFollowUpDate: string;
  activity: DealActivity[];
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
