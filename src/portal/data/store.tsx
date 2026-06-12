import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { usePortalAuth } from '../auth';
import {
  Client,
  Commission,
  CommissionPayoutStatus,
  ContractorStatus,
  Contractor,
  ContractorDispatch,
  Deal,
  DealActivity,
  DealStatus,
  FinancingStatus,
  Activity,
  Appointment,
  ConsultationStage,
  Household,
  ProposalHistory,
  RepDayOff,
  SalesAgreement,
  SaleTrackerRow,
  User,
} from './types';

type ContractorDraft = Omit<Contractor, 'id'>;

type DealDraft = Pick<
  Deal,
  | 'homeownerName'
  | 'phone'
  | 'email'
  | 'address'
  | 'city'
  | 'postalCode'
  | 'projectType'
  | 'estimatedJobValue'
  | 'financingRequired'
  | 'nextFollowUpDate'
  | 'notes'
>;

type AppointmentDraft = Omit<
  Appointment,
  | 'createdAt'
  | 'externalCalendarId'
  | 'externalEventId'
  | 'id'
  | 'source'
  | 'syncedAt'
  | 'updatedAt'
>;

type PortalDataState = {
  activities: Activity[];
  appointments: Appointment[];
  clients: Client[];
  daysOff: RepDayOff[];
  households: Household[];
  salesAgreements: SalesAgreement[];
  users: User[];
  contractors: Contractor[];
  dispatches: ContractorDispatch[];
  deals: Deal[];
  commissions: Commission[];
  proposals: ProposalHistory[];
  trackerRows: SaleTrackerRow[];
  defaultCommissionRate: number;
};

type ContractorDispatchDraft = Omit<
  ContractorDispatch,
  'createdAt' | 'id' | 'updatedAt'
>;

type PortalDataContextValue = PortalDataState & {
  isLoading: boolean;
  setDefaultCommissionRate: (rate: number) => void;
  addUser: (user: Omit<User, 'id' | 'role'>, actor?: User) => Promise<{ tempPassword: string } | { error: string } | null>;
  updateUser: (
    userId: string,
    updates: Partial<Omit<User, 'id' | 'role'>>,
    actor?: User
  ) => void;
  toggleUserActive: (userId: string, actor?: User) => void;
  /** @deprecated auth is now handled by /api/auth/login — always returns null */
  authenticateUser: (email: string, password: string) => User | null;
  changeUserPassword: (
    userId: string,
    currentPassword: string,
    newPassword: string,
    actor?: User
  ) => Promise<{ ok: boolean; message?: string }>;
  resetUserPassword: (
    userId: string,
    temporaryPassword: string,
    actor?: User
  ) => Promise<{ ok: boolean; message?: string }>;
  logActivity: (activity: ActivityDraft, actor?: User) => void;
  addContractor: (contractor: ContractorDraft, actor?: User) => void;
  updateContractor: (
    contractorId: string,
    updates: Partial<Contractor>,
    actor?: User
  ) => void;
  deleteContractor: (contractorId: string, actor?: User) => void;
  toggleContractorStatus: (contractorId: string) => void;
  addDeal: (deal: DealDraft, repId: string, actor?: User) => void;
  updateDeal: (dealId: string, updates: Partial<Deal>, actor?: User) => void;
  deleteDeal: (dealId: string, actor?: User) => void;
  assignContractorToDeal: (
    dealId: string,
    contractorId: string | null,
    actor?: User
  ) => void;
  addDealActivity: (dealId: string, note: string, actor?: User) => void;
  addProposalHistory: (
    proposal: Omit<ProposalHistory, 'id' | 'sentAt'>,
    actor?: User
  ) => void;
  addContractorDispatch: (
    dispatch: ContractorDispatchDraft,
    actor?: User
  ) => void;
  updateContractorDispatch: (
    dispatchId: string,
    updates: Partial<ContractorDispatch>,
    actor?: User
  ) => void;
  assignDispatchContractor: (dispatchId: string, actor?: User) => void;
  updateCommission: (
    commissionId: string,
    updates: Partial<
      Pick<
        Commission,
        | 'adminTotalCommissionRate'
        | 'adminTotalEstimatedCommission'
        | 'payoutStatus'
        | 'repPaidCommission'
      >
    >,
    actor?: User
  ) => void;
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'source' | 'createdByUserId'>) => Promise<Client | null>;
  updateClient: (clientId: string, updates: Partial<Omit<Client, 'id' | 'createdAt' | 'createdByUserId' | 'source'>>) => Promise<Client | null>;
  deleteClient: (clientId: string) => Promise<void>;
  addDaysOff: (dates: string[], note: string, targetUserId?: string) => Promise<RepDayOff[]>;
  getUploadToken: (dealId: string) => Promise<{ clientToken: string; pathname: string } | null>;
  addSalesAgreement: (dealId: string, fileName: string, url: string) => Promise<SalesAgreement | null>;
  deleteSalesAgreement: (id: string) => Promise<void>;
  removeDayOff: (id: string) => Promise<void>;
  addHousehold: (name: string, notes: string, memberIds: string[]) => Promise<Household | null>;
  updateHousehold: (householdId: string, updates: { name?: string; notes?: string; addMemberId?: string; removeMemberId?: string }) => Promise<Household | null>;
  deleteHousehold: (householdId: string) => Promise<void>;
  getAppointmentsForClient: (clientId: string) => Appointment[];
  addTrackerRow: (repId: string, draft?: Partial<SaleTrackerRow>) => Promise<SaleTrackerRow | null>;
  updateTrackerRow: (id: string, updates: Partial<SaleTrackerRow>) => Promise<SaleTrackerRow | null>;
  deleteTrackerRow: (id: string) => Promise<void>;
  addAppointment: (appointment: AppointmentDraft, actor?: User) => void;
  updateAppointment: (
    appointmentId: string,
    updates: Partial<Appointment>,
    actor?: User
  ) => void;
  deleteAppointment: (appointmentId: string, actor?: User) => void;
  transferAppointment: (appointmentId: string, toRepId: string) => Promise<boolean>;
  createDealFromAppointment: (appointmentId: string, actor?: User) => void;
  getActivitiesForUser: (user: User) => Activity[];
  getAppointmentsForDeal: (dealId: string) => Appointment[];
  getDispatchesForConsultation: (consultationId: string) => ContractorDispatch[];
  getDispatchesForDeal: (dealId: string) => ContractorDispatch[];
  getVisibleDispatchesForUser: (user: User) => ContractorDispatch[];
  getVisibleAppointmentsForUser: (user: User) => Appointment[];
  getDealsForRep: (repId: string) => Deal[];
  getVisibleDealsForUser: (user: User) => Deal[];
  calculateRepPendingCommission: (repId: string) => number;
  calculateRepProjectedCommission: (repId: string) => number;
  calculateRepPaidCommission: (repId: string) => number;
  calculateAdminPendingRepCommission: () => number;
  calculateAdminPendingNetCommission: () => number;
  calculateAdminProjectedCommission: () => number;
  calculateAdminPaidRepCommission: () => number;
  calculateWonDeals: (repId: string) => number;
  calculateClosedVolume: (repId: string) => number;
  calculateHistoricalSalesTotal: (repId: string) => number;
  calculateHistoricalSalesCount: (repId: string) => number;
  calculatePipelineValue: (repId: string) => number;
  calculatePipelineValueForUser: (user: User) => number;
  calculateOpenDealsForUser: (user: User) => number;
  calculateVisiblePendingCommission: (user: User) => number;
  calculateVisibleWonDeals: (user: User) => number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const openDealStatuses: DealStatus[] = [
  'new_lead',
  'appointment_booked',
  'quoted',
  'negotiating',
];
const projectedCommissionStatuses: DealStatus[] = [...openDealStatuses, 'won'];

const DEFAULT_COMMISSION_RATE_KEY = 'portal_defaultCommissionRate';

function loadDefaultCommissionRate(): number {
  try {
    const v = localStorage.getItem(DEFAULT_COMMISSION_RATE_KEY);
    if (v !== null) return Math.min(1, Math.max(0, Number(v)));
  } catch {}
  return 0.1;
}

const emptyState: PortalDataState = {
  activities: [],
  appointments: [],
  clients: [],
  daysOff: [],
  households: [],
  salesAgreements: [],
  commissions: [],
  contractors: [],
  deals: [],
  dispatches: [],
  proposals: [],
  trackerRows: [],
  users: [],
  defaultCommissionRate: loadDefaultCommissionRate(),
};

const PortalDataContext = createContext<PortalDataContextValue | undefined>(
  undefined
);

// ─── Utility helpers ──────────────────────────────────────────────────────────

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function normalizeDealStatus(status: string): DealStatus {
  if (status === 'in_progress') return 'appointment_booked';

  const validStatuses: DealStatus[] = [
    'new_lead',
    'appointment_booked',
    'quoted',
    'negotiating',
    'won',
    'lost',
  ];

  return validStatuses.includes(status as DealStatus)
    ? (status as DealStatus)
    : 'new_lead';
}

function normalizeDeal(deal: Deal): Deal {
  return {
    ...deal,
    address: deal.address ?? '',
    activity: Array.isArray(deal.activity) ? deal.activity : [],
    postalCode: deal.postalCode ?? '',
    status: normalizeDealStatus(deal.status),
  };
}

function formatConsultationStage(stage: ConsultationStage) {
  return stage
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from(
    { length: 12 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

function normalizeAppointment(appointment: Appointment, deals: Deal[]): Appointment {
  // Normalize empty-string dealId (from Google Calendar import) to null
  const dealId = appointment.dealId || null;
  const deal = deals.find((candidate) => candidate.id === dealId);

  return {
    ...appointment,
    dealId,
    address: appointment.address ?? appointment.location ?? '',
    city: appointment.city ?? deal?.city ?? '',
    postalCode: appointment.postalCode ?? '',
    contractorId:
      appointment.contractorId ?? deal?.assignedContractorId ?? null,
    customerName:
      appointment.customerName ?? appointment.title ?? deal?.homeownerName ?? '',
    customerNotes: appointment.customerNotes ?? '',
    durationMinutes: appointment.durationMinutes ?? 60,
    email: appointment.email ?? deal?.email ?? '',
    internalNotes: appointment.internalNotes ?? appointment.notes ?? '',
    phone: appointment.phone ?? deal?.phone ?? '',
    projectType: appointment.projectType ?? deal?.projectType ?? '',
    source: appointment.source ?? 'manual',
    status:
      appointment.status === 'confirmed'
        ? 'confirmed'
        : appointment.status ?? 'scheduled',
    consultationStage:
      appointment.consultationStage ??
      (appointment.status === 'completed'
        ? 'consultation_completed'
        : 'consultation_scheduled'),
    closeProbability: appointment.closeProbability ?? 0,
    estimatedProjectValue: appointment.estimatedProjectValue ?? 0,
    financingNeeded:
      appointment.financingNeeded === undefined
        ? null
        : appointment.financingNeeded,
    followUpDate: appointment.followUpDate ?? '',
    homeownerInterestLevel: appointment.homeownerInterestLevel ?? null,
    nextStep: appointment.nextStep ?? 'no_action',
    objections: appointment.objections ?? '',
    outcomeNotes: appointment.outcomeNotes ?? '',
    outcomeSubmitted: appointment.outcomeSubmitted ?? false,
    outcomeSubmittedAt: appointment.outcomeSubmittedAt,
    outcomeSubmittedByUserId: appointment.outcomeSubmittedByUserId,
    recommendedContractorId: appointment.recommendedContractorId ?? null,
  };
}

type ActivityDraft = Omit<
  Activity,
  'actorName' | 'actorRole' | 'actorUserId' | 'createdAt' | 'id'
>;

function createActivity(actor: User | undefined, draft: ActivityDraft): Activity {
  return {
    ...draft,
    actorName: actor?.name ?? 'System',
    actorRole: actor?.role ?? 'admin',
    actorUserId: actor?.id ?? 'system',
    createdAt: new Date().toISOString(),
    id: createId('activity'),
  };
}

function prependActivity(
  activities: Activity[],
  actor: User | undefined,
  draft: ActivityDraft
) {
  return [createActivity(actor, draft), ...activities].slice(0, 250);
}

function getDealLabel(deal: Deal | undefined) {
  if (!deal) return 'Deal';
  return `${deal.homeownerName} - ${deal.projectType}`;
}

function addDealTimelineNote(
  deals: Deal[],
  dealId: string | undefined,
  note: string
) {
  if (!dealId) return deals;

  return deals.map((deal) => {
    if (deal.id !== dealId) return deal;

    const activity: DealActivity = {
      createdAt: new Date().toISOString(),
      id: createId('activity'),
      note,
    };

    return {
      ...deal,
      activity: [activity, ...(deal.activity ?? [])],
      updatedAt: new Date().toISOString(),
    };
  });
}

function normalizeSearchValue(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function createCommissionForDeal(deal: Deal, defaultRate = loadDefaultCommissionRate()): Commission {
  const repEstimatedCommission = Math.round(deal.estimatedJobValue * 0.05);
  const adminTotalEstimatedCommission = Math.round(
    deal.estimatedJobValue * defaultRate
  );

  return {
    id: createId('commission'),
    adminNetCommission:
      adminTotalEstimatedCommission - repEstimatedCommission,
    adminTotalCommissionRate: defaultRate,
    adminTotalEstimatedCommission,
    dealId: deal.id,
    payoutStatus: 'pending',
    repCommissionRate: 0.05,
    repEstimatedCommission,
    repId: deal.assignedRepId,
    repPaidCommission: 0,
  };
}

function createMissingCommissionForDeal(deal: Deal): Commission {
  return {
    ...createCommissionForDeal(deal),
    id: `commission-${deal.id}`,
  };
}

function syncCommissionWithDeal(commission: Commission, deal: Deal) {
  const repEstimatedCommission = Math.round(deal.estimatedJobValue * 0.05);
  const adminTotalEstimatedCommission = Math.round(
    deal.estimatedJobValue * commission.adminTotalCommissionRate
  );

  return {
    ...commission,
    adminNetCommission:
      adminTotalEstimatedCommission - repEstimatedCommission,
    adminTotalEstimatedCommission,
    repEstimatedCommission,
    repId: deal.assignedRepId,
  };
}

function normalizePayoutStatus(
  repPaidCommission: number,
  repEstimatedCommission: number
): CommissionPayoutStatus {
  if (repPaidCommission <= 0) return 'pending';
  if (repPaidCommission >= repEstimatedCommission) return 'paid';
  return 'partial';
}

function normalizeCommissionWithDeal(commission: Commission, deal: Deal) {
  const synced = syncCommissionWithDeal(commission, deal);
  const repPaidCommission = Math.min(
    Math.max(synced.repPaidCommission, 0),
    synced.repEstimatedCommission
  );

  return {
    ...synced,
    payoutStatus: normalizePayoutStatus(
      repPaidCommission,
      synced.repEstimatedCommission
    ),
    repPaidCommission,
  };
}

function syncCommissionsWithDeals(
  commissions: Commission[],
  deals: Deal[]
): Commission[] {
  const dealsById = new Map(deals.map((deal) => [deal.id, deal]));
  const syncedCommissions = commissions.map((commission) => {
    const deal = dealsById.get(commission.dealId);
    return deal ? normalizeCommissionWithDeal(commission, deal) : commission;
  });
  const commissionDealIds = new Set(
    syncedCommissions.map((commission) => commission.dealId)
  );
  const missingWonDealCommissions = deals
    .filter((deal) => deal.status === 'won' && !deal.isHistorical && !commissionDealIds.has(deal.id))
    .map(createMissingCommissionForDeal);

  return [...syncedCommissions, ...missingWonDealCommissions];
}

// ─── API helper ───────────────────────────────────────────────────────────────

async function apiCall<T>(
  url: string,
  options?: RequestInit
): Promise<T | null> {
  try {
    const res = await fetch(url, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) {
      console.error(`[store] apiCall ${url} → ${res.status}`, await res.text().catch(() => ''));
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.error(`[store] apiCall ${url} threw`, err);
    return null;
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function PortalDataProvider({ children }: { children: ReactNode }) {
  const { currentUser, isAuthLoading } = usePortalAuth();
  const [state, setState] = useState<PortalDataState>(emptyState);
  const [isLoading, setIsLoading] = useState(true);
  const hasFetched = useRef(false);

  // Load all portal data from the API on mount.
  // We only run this when on a /portal route so public pages don't fire
  // unauthenticated API calls unnecessarily.
  useEffect(() => {
    if (!window.location.pathname.startsWith('/portal')) {
      setIsLoading(false);
      return;
    }

    // Wait until auth check resolves and a user is confirmed before fetching.
    // This prevents a race where GET /api/users fires before the JWT cookie
    // is verified, causing a 401 and leaving the store empty.
    if (isAuthLoading) return;
    if (!currentUser) {
      setIsLoading(false);
      return;
    }
    if (hasFetched.current) return;
    hasFetched.current = true;

    Promise.all([
      apiCall<User[]>('/api/users'),
      apiCall<Contractor[]>('/api/contractors'),
      apiCall<Deal[]>('/api/deals'),
      apiCall<Appointment[]>('/api/appointments'),
      apiCall<Commission[]>('/api/commissions'),
      apiCall<Activity[]>('/api/auth/activities'),
      apiCall<Client[]>('/api/appointments?_resource=clients'),
      apiCall<SaleTrackerRow[]>('/api/deals?_resource=tracker'),
      apiCall<Household[]>('/api/appointments?_resource=households'),
      apiCall<RepDayOff[]>('/api/appointments?_resource=days_off'),
      apiCall<SalesAgreement[]>('/api/deals?_resource=agreements'),
    ]).then(([users, contractors, rawDeals, appointments, commissions, activities, clients, trackerRows, households, daysOff, salesAgreements]) => {
      // Deals API now embeds proposals and dispatches — extract them
      type RawDeal = Deal & { proposals?: ProposalHistory[]; dispatches?: ContractorDispatch[] };
      const rawDealList = (rawDeals ?? []) as RawDeal[];
      const deals = rawDealList.map(normalizeDeal);
      const proposals = rawDealList.flatMap((d) => d.proposals ?? []);
      const dispatches = rawDealList.flatMap((d) => d.dispatches ?? []);

      setState({
        users: users ?? [],
        contractors: contractors ?? [],
        deals,
        appointments: (appointments ?? []).map((a) => normalizeAppointment(a, deals)),
        commissions: syncCommissionsWithDeals(commissions ?? [], deals),
        activities: activities ?? [],
        dispatches,
        proposals,
        clients: clients ?? [],
        daysOff: daysOff ?? [],
        households: households ?? [],
        salesAgreements: salesAgreements ?? [],
        trackerRows: trackerRows ?? [],
        defaultCommissionRate: loadDefaultCommissionRate(),
      });
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthLoading, currentUser?.id]);

  const value = useMemo<PortalDataContextValue>(() => {
    const getDealsForRep = (repId: string) =>
      state.deals.filter((deal) => deal.assignedRepId === repId);

    const getVisibleDealsForUser = (user: User) =>
      user.role === 'admin' ? state.deals : getDealsForRep(user.id);

    const getAppointmentsForDeal = (dealId: string) =>
      state.appointments.filter((appointment) => appointment.dealId === dealId);

    const getDispatchesForDeal = (dealId: string) =>
      state.dispatches.filter((dispatch) => dispatch.dealId === dealId);

    const getDispatchesForConsultation = (consultationId: string) =>
      state.dispatches.filter(
        (dispatch) => dispatch.consultationId === consultationId
      );

    const getVisibleAppointmentsForUser = (user: User) =>
      user.role === 'admin'
        ? state.appointments
        : state.appointments.filter(
            (appointment) => appointment.assignedRepId === user.id
          );

    const getActivitiesForUser = (user: User) => {
      if (user.role === 'admin') return state.activities;

      const visibleDealIds = new Set(
        getDealsForRep(user.id).map((deal) => deal.id)
      );

      return state.activities.filter(
        (activity) =>
          activity.dealId ? visibleDealIds.has(activity.dealId) : false
      );
    };

    const getVisibleDispatchesForUser = (user: User) => {
      if (user.role === 'admin') return state.dispatches;

      const visibleDealIds = new Set(
        getDealsForRep(user.id).map((deal) => deal.id)
      );

      return state.dispatches.filter((dispatch) =>
        visibleDealIds.has(dispatch.dealId)
      );
    };

    const calculatePipelineValue = (repId: string) =>
      getDealsForRep(repId)
        .filter((deal) => openDealStatuses.includes(deal.status) && !deal.isHistorical)
        .reduce((total, deal) => total + deal.estimatedJobValue, 0);

    const calculatePipelineValueForUser = (user: User) =>
      getVisibleDealsForUser(user)
        .filter((deal) => openDealStatuses.includes(deal.status) && !deal.isHistorical)
        .reduce((total, deal) => total + deal.estimatedJobValue, 0);

    const calculateRepPendingCommission = (repId: string) =>
      state.commissions
        .filter((commission) => {
          const deal = state.deals.find(
            (candidate) => candidate.id === commission.dealId
          );

          return (
            commission.repId === repId &&
            deal?.status === 'won' &&
            !deal.isHistorical &&
            commission.payoutStatus !== 'paid'
          );
        })
        .reduce(
          (total, commission) =>
            total +
            Math.max(
              commission.repEstimatedCommission -
                commission.repPaidCommission,
              0
            ),
          0
        );

    const calculateRepProjectedCommission = (repId: string) =>
      state.commissions
        .filter((commission) => {
          const deal = state.deals.find(
            (candidate) => candidate.id === commission.dealId
          );

          return (
            commission.repId === repId &&
            !deal?.isHistorical &&
            Boolean(deal && projectedCommissionStatuses.includes(deal.status))
          );
        })
        .reduce(
          (total, commission) => total + commission.repEstimatedCommission,
          0
        );

    const calculateRepPaidCommission = (repId: string) =>
      state.commissions
        .filter((commission) => commission.repId === repId)
        .reduce((total, commission) => total + commission.repPaidCommission, 0);

    const calculateAdminPendingRepCommission = () =>
      state.commissions
        .filter((commission) => {
          const deal = state.deals.find(
            (candidate) => candidate.id === commission.dealId
          );

          return deal?.status === 'won' && !deal.isHistorical && commission.payoutStatus !== 'paid';
        })
        .reduce(
          (total, commission) =>
            total +
            Math.max(
              commission.repEstimatedCommission -
                commission.repPaidCommission,
              0
            ),
          0
        );

    const calculateAdminPendingNetCommission = () =>
      state.commissions
        .filter((commission) => {
          const deal = state.deals.find(
            (candidate) => candidate.id === commission.dealId
          );

          return deal?.status === 'won' && !deal.isHistorical && commission.payoutStatus !== 'paid';
        })
        .reduce((total, commission) => total + commission.adminNetCommission, 0);

    const calculateAdminProjectedCommission = () =>
      state.commissions
        .filter((commission) => {
          const deal = state.deals.find(
            (candidate) => candidate.id === commission.dealId
          );

          return Boolean(
            deal && !deal.isHistorical && projectedCommissionStatuses.includes(deal.status)
          );
        })
        .reduce(
          (total, commission) =>
            total + commission.adminTotalEstimatedCommission,
          0
        );

    const calculateAdminPaidRepCommission = () =>
      state.commissions.reduce(
        (total, commission) => total + commission.repPaidCommission,
        0
      );

    // Historical deals are excluded from all leaderboard metrics
    const calculateWonDeals = (repId: string) =>
      getDealsForRep(repId).filter((deal) => deal.status === 'won' && !deal.isHistorical).length;

    const calculateClosedVolume = (repId: string) =>
      getDealsForRep(repId)
        .filter((deal) => deal.status === 'won' && !deal.isHistorical)
        .reduce((total, deal) => total + deal.estimatedJobValue, 0);

    // Total value of historical (pre-portal) won deals for a rep's personal reference
    const calculateHistoricalSalesTotal = (repId: string) =>
      getDealsForRep(repId)
        .filter((deal) => deal.isHistorical && deal.status === 'won')
        .reduce((total, deal) => total + deal.estimatedJobValue, 0);

    const calculateHistoricalSalesCount = (repId: string) =>
      getDealsForRep(repId).filter((deal) => deal.isHistorical && deal.status === 'won').length;

    const calculateOpenDealsForUser = (user: User) =>
      getVisibleDealsForUser(user).filter((deal) =>
        openDealStatuses.includes(deal.status)
      ).length;

    const calculateVisiblePendingCommission = (user: User) => {
      if (user.role === 'admin') {
        return calculateAdminPendingNetCommission();
      }

      return calculateRepPendingCommission(user.id);
    };

    const calculateVisibleWonDeals = (user: User) =>
      getVisibleDealsForUser(user).filter((deal) => deal.status === 'won')
        .length;

    return {
      ...state,
      isLoading,

      setDefaultCommissionRate: (rate: number) => {
        const clamped = Math.min(1, Math.max(0, rate));
        try { localStorage.setItem(DEFAULT_COMMISSION_RATE_KEY, String(clamped)); } catch {}
        setState((current) => ({ ...current, defaultCommissionRate: clamped }));
      },

      // ── User mutations ──────────────────────────────────────────────────────

      addUser: async (user, actor) => {
        const tempId = createId('user');
        const tempPassword = generateTemporaryPassword();
        const newUser: User = {
          ...user,
          id: tempId,
          role: 'rep',
          passwordHash: undefined,
        };

        setState((current) => ({
          ...current,
          activities: prependActivity(current.activities, actor, {
            actionLabel: `Rep added: ${newUser.name}`,
            actionType: 'rep_added',
            entityId: newUser.id,
            entityLabel: newUser.name,
            entityType: 'rep',
          }),
          users: [...current.users, newUser],
        }));

        // Server creates real ID — replace temp once saved
        // POST to /api/users base path has a Vercel routing bug with [[...id]].ts
        // User creation is handled by /api/auth/add-rep instead.
        const res = await fetch('/api/auth/add-rep', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...user, role: 'rep', password: tempPassword }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as { error?: string };
          return { error: body.error ?? 'Failed to create rep.' };
        }

        const saved = await res.json() as User;
        if (!saved) return null;

        setState((current) => ({
          ...current,
          users: current.users.map((u) => (u.id === tempId ? saved : u)),
        }));

        return { tempPassword };
      },

      updateUser: (userId, updates, actor) => {
        setState((current) => {
          const existingUser = current.users.find((u) => u.id === userId);
          const updatedUser = existingUser
            ? { ...existingUser, ...updates, id: existingUser.id, role: existingUser.role }
            : undefined;

          return {
            ...current,
            activities:
              existingUser && updatedUser
                ? prependActivity(current.activities, actor, {
                    actionLabel: `Rep edited: ${updatedUser.name}`,
                    actionType: 'rep_edited',
                    entityId: updatedUser.id,
                    entityLabel: updatedUser.name,
                    entityType: 'rep',
                    metadata: { active: updatedUser.active },
                  })
                : current.activities,
            users: current.users.map((u) =>
              u.id === userId
                ? { ...u, ...updates, id: u.id, role: u.role }
                : u
            ),
          };
        });

        apiCall(`/api/users/${userId}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        });
      },

      toggleUserActive: (userId, actor) => {
        setState((current) => {
          const existingUser = current.users.find((u) => u.id === userId);
          const nextActive = !existingUser?.active;

          return {
            ...current,
            activities: existingUser
              ? prependActivity(current.activities, actor, {
                  actionLabel: `${existingUser.name} ${
                    nextActive ? 'activated' : 'deactivated'
                  }`,
                  actionType: 'rep_status_changed',
                  entityId: existingUser.id,
                  entityLabel: existingUser.name,
                  entityType: 'rep',
                  metadata: { active: nextActive },
                })
              : current.activities,
            users: current.users.map((u) =>
              u.id === userId ? { ...u, active: !u.active } : u
            ),
          };
        });

        // Read current active state before the toggle to send correct value
        const currentUser = state.users.find((u) => u.id === userId);
        apiCall(`/api/users/${userId}`, {
          method: 'PATCH',
          body: JSON.stringify({ active: !currentUser?.active }),
        });
      },

      /** @deprecated — auth is handled by /api/auth/login */
      authenticateUser: () => null,

      changeUserPassword: async (userId, currentPassword, newPassword, actor) => {
        if (newPassword.length < 8) {
          return { ok: false, message: 'New password must be at least 8 characters.' };
        }

        const result = await apiCall<{ ok: boolean; error?: string }>(
          `/api/users/${userId}`,
          {
            method: 'PATCH',
            body: JSON.stringify({ currentPassword, password: newPassword }),
          }
        );

        if (!result) {
          return { ok: false, message: 'Current password is incorrect.' };
        }

        if (actor) {
          const user = state.users.find((u) => u.id === userId);
          setState((current) => ({
            ...current,
            activities: prependActivity(current.activities, actor, {
              actionLabel: `Password changed for ${user?.name ?? userId}`,
              actionType: 'user_password_changed',
              entityId: userId,
              entityLabel: user?.name ?? userId,
              entityType: 'rep',
            }),
          }));
        }

        return { ok: true };
      },

      resetUserPassword: async (userId, temporaryPassword, actor) => {
        if (temporaryPassword.length < 8) {
          return { ok: false, message: 'Temporary password must be at least 8 characters.' };
        }

        const result = await apiCall<{ ok: boolean }>(
          `/api/users/${userId}`,
          {
            method: 'PATCH',
            body: JSON.stringify({ password: temporaryPassword }),
          }
        );

        if (!result) {
          return { ok: false, message: 'Password reset failed.' };
        }

        const user = state.users.find((u) => u.id === userId);
        setState((current) => ({
          ...current,
          activities: prependActivity(current.activities, actor, {
            actionLabel: `Password reset for ${user?.name ?? userId}`,
            actionType: 'user_password_reset',
            entityId: userId,
            entityLabel: user?.name ?? userId,
            entityType: 'rep',
          }),
        }));

        return { ok: true };
      },

      logActivity: (activity, actor) => {
        setState((current) => ({
          ...current,
          activities: prependActivity(current.activities, actor, activity),
        }));

        apiCall('/api/auth/activities', {
          method: 'POST',
          body: JSON.stringify(activity),
        });
      },

      // ── Contractor mutations ────────────────────────────────────────────────

      addContractor: (contractor, actor) => {
        const tempId = createId('contractor');
        const newContractor: Contractor = { ...contractor, id: tempId };

        setState((current) => ({
          ...current,
          activities: prependActivity(current.activities, actor, {
            actionLabel: `Contractor added: ${newContractor.companyName}`,
            actionType: 'contractor_added',
            contractorId: newContractor.id,
            entityId: newContractor.id,
            entityLabel: newContractor.companyName,
            entityType: 'contractor',
          }),
          contractors: [...current.contractors, newContractor],
        }));

        apiCall<Contractor>('/api/contractors', {
          method: 'POST',
          body: JSON.stringify(contractor),
        }).then((saved) => {
          if (!saved) return;
          setState((current) => ({
            ...current,
            contractors: current.contractors.map((c) =>
              c.id === tempId ? saved : c
            ),
          }));
        });
      },

      updateContractor: (contractorId, updates, actor) => {
        setState((current) => {
          const existingContractor = current.contractors.find(
            (c) => c.id === contractorId
          );
          const updatedContractor = existingContractor
            ? { ...existingContractor, ...updates, id: existingContractor.id }
            : undefined;

          return {
            ...current,
            activities:
              existingContractor && updatedContractor
                ? prependActivity(
                    current.activities,
                    actor,
                    existingContractor.financingStatus !==
                      updatedContractor.financingStatus
                      ? {
                          actionLabel: `Contractor financing status changed: ${updatedContractor.companyName}`,
                          actionType: 'contractor_financing_changed',
                          contractorId: updatedContractor.id,
                          entityId: updatedContractor.id,
                          entityLabel: updatedContractor.companyName,
                          entityType: 'contractor',
                          metadata: {
                            from: existingContractor.financingStatus,
                            to: updatedContractor.financingStatus,
                          },
                        }
                      : {
                          actionLabel: `Contractor edited: ${updatedContractor.companyName}`,
                          actionType: 'contractor_edited',
                          contractorId: updatedContractor.id,
                          entityId: updatedContractor.id,
                          entityLabel: updatedContractor.companyName,
                          entityType: 'contractor',
                          metadata: {
                            status: updatedContractor.contractorStatus,
                          },
                        }
                  )
                : current.activities,
            contractors: current.contractors.map((c) =>
              c.id === contractorId
                ? { ...c, ...updates, id: c.id }
                : c
            ),
          };
        });

        apiCall(`/api/contractors/${contractorId}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        });
      },

      deleteContractor: (contractorId, actor) => {
        setState((current) => {
          const contractor = current.contractors.find(
            (c) => c.id === contractorId
          );

          return {
            ...current,
            activities: contractor
              ? prependActivity(current.activities, actor, {
                  actionLabel: `Contractor deleted: ${contractor.companyName}`,
                  actionType: 'contractor_deleted',
                  contractorId: contractor.id,
                  entityId: contractor.id,
                  entityLabel: contractor.companyName,
                  entityType: 'contractor',
                })
              : current.activities,
            contractors: current.contractors.filter(
              (c) => c.id !== contractorId
            ),
            deals: current.deals.map((deal) =>
              deal.assignedContractorId === contractorId
                ? {
                    ...deal,
                    assignedContractorId: null,
                    updatedAt: new Date().toISOString(),
                  }
                : deal
            ),
            dispatches: current.dispatches.filter(
              (dispatch) => dispatch.contractorId !== contractorId
            ),
          };
        });

        apiCall(`/api/contractors/${contractorId}`, { method: 'DELETE' });
      },

      toggleContractorStatus: (contractorId) => {
        const contractor = state.contractors.find((c) => c.id === contractorId);
        const nextStatus =
          contractor?.contractorStatus === 'active' ? 'inactive' : 'active';

        setState((current) => ({
          ...current,
          contractors: current.contractors.map((c) =>
            c.id === contractorId
              ? { ...c, contractorStatus: nextStatus as ContractorStatus }
              : c
          ),
        }));

        apiCall(`/api/contractors/${contractorId}`, {
          method: 'PATCH',
          body: JSON.stringify({ contractorStatus: nextStatus }),
        });
      },

      // ── Deal mutations ──────────────────────────────────────────────────────

      addDeal: (dealDraft, repId, actor) => {
        const tempId = createId('deal');
        const now = new Date().toISOString();
        const deal: Deal = {
          ...dealDraft,
          assignedContractorId: null,
          assignedRepId: repId,
          activity: [],
          createdAt: now,
          id: tempId,
          status: 'new_lead',
          updatedAt: now,
        };

        setState((current) => ({
          activities: prependActivity(current.activities, actor, {
            actionLabel: `Deal created: ${getDealLabel(deal)}`,
            actionType: 'deal_created',
            dealId: deal.id,
            entityId: deal.id,
            entityLabel: getDealLabel(deal),
            entityType: 'deal',
          }),
          commissions: [...current.commissions, createCommissionForDeal(deal, current.defaultCommissionRate)],
          appointments: current.appointments,
          clients: current.clients,
          daysOff: current.daysOff,
          households: current.households,
          salesAgreements: current.salesAgreements,
          contractors: current.contractors,
          deals: [...current.deals, deal],
          dispatches: current.dispatches,
          proposals: current.proposals,
          trackerRows: current.trackerRows,
          users: current.users,
          defaultCommissionRate: current.defaultCommissionRate,
        }));

        apiCall<Deal & { _commissionId?: string }>('/api/deals', {
          method: 'POST',
          body: JSON.stringify({ ...dealDraft, assignedRepId: repId }),
        }).then(async (saved) => {
          if (!saved) return;
          // Reload tracker rows so My Sales updates immediately
          const trackerRows = await apiCall<SaleTrackerRow[]>('/api/deals?_resource=tracker') ?? [];
          // Reload clients so the new client profile appears immediately
          const clients = await apiCall<Client[]>('/api/appointments?_resource=clients') ?? [];
          setState((current) => ({
            ...current,
            clients,
            deals: current.deals.map((d) => (d.id === tempId ? normalizeDeal(saved) : d)),
            commissions: current.commissions.map((c) => {
              if (c.dealId !== tempId) return c;
              return {
                ...c,
                dealId: saved.id,
                // Reconcile temp commission id with the real DB-assigned id
                ...(saved._commissionId ? { id: saved._commissionId } : {}),
              };
            }),
            trackerRows,
          }));
        });
      },

      updateDeal: (dealId, updates, actor) => {
        let clientIdForNotesSync: string | null = null;
        let linkedAppointmentIdForNotes: string | null = null;
        const snapshotDeals = state.deals;

        setState((current) => {
          const previousDeal = current.deals.find((d) => d.id === dealId);
          const deals = current.deals.map((d) =>
            d.id === dealId
              ? { ...d, ...updates, id: d.id, updatedAt: new Date().toISOString() }
              : d
          );

          if (updates.notes !== undefined) {
            // Sync to linked appointment's internalNotes
            const linkedApt = current.appointments.find((a) => a.dealId === dealId);
            if (linkedApt) linkedAppointmentIdForNotes = linkedApt.id;

            // Sync to client — try email first, then fall back to name
            const emailToMatch = previousDeal?.email || linkedApt?.email;
            const matchingClient =
              (emailToMatch ? current.clients.find((c) => c.email === emailToMatch) : null) ||
              current.clients.find((c) => c.name === previousDeal?.homeownerName);
            if (matchingClient) clientIdForNotesSync = matchingClient.id;
          }

          const nextDeal = deals.find((d) => d.id === dealId);
          let activities = current.activities;

          if (previousDeal && nextDeal) {
            if (updates.status && previousDeal.status !== nextDeal.status) {
              activities = prependActivity(activities, actor, {
                actionLabel: `Status changed to ${nextDeal.status.split('_').join(' ')}`,
                actionType: 'deal_status_changed',
                dealId: nextDeal.id,
                entityId: nextDeal.id,
                entityLabel: getDealLabel(nextDeal),
                entityType: 'deal',
                metadata: { from: previousDeal.status, to: nextDeal.status },
              });
            }

            if (
              updates.nextFollowUpDate !== undefined &&
              previousDeal.nextFollowUpDate !== nextDeal.nextFollowUpDate
            ) {
              activities = prependActivity(activities, actor, {
                actionLabel: `Follow-up date updated for ${getDealLabel(nextDeal)}`,
                actionType: 'deal_follow_up_changed',
                dealId: nextDeal.id,
                entityId: nextDeal.id,
                entityLabel: getDealLabel(nextDeal),
                entityType: 'appointment',
                metadata: { nextFollowUpDate: nextDeal.nextFollowUpDate || null },
              });
            }

            if (
              updates.financingRequired !== undefined &&
              previousDeal.financingRequired !== nextDeal.financingRequired
            ) {
              activities = prependActivity(activities, actor, {
                actionLabel: `Financing requirement changed for ${getDealLabel(nextDeal)}`,
                actionType: 'deal_financing_changed',
                dealId: nextDeal.id,
                entityId: nextDeal.id,
                entityLabel: getDealLabel(nextDeal),
                entityType: 'deal',
                metadata: { financingRequired: nextDeal.financingRequired },
              });
            }

            activities = prependActivity(activities, actor, {
              actionLabel: `Deal edited: ${getDealLabel(nextDeal)}`,
              actionType: 'deal_edited',
              dealId: nextDeal.id,
              entityId: nextDeal.id,
              entityLabel: getDealLabel(nextDeal),
              entityType: 'deal',
            });
          }

          return {
            ...current,
            activities,
            appointments: linkedAppointmentIdForNotes
              ? current.appointments.map((a) =>
                  a.id === linkedAppointmentIdForNotes
                    ? { ...a, internalNotes: updates.notes!, notes: updates.notes!, updatedAt: new Date().toISOString() }
                    : a
                )
              : current.appointments,
            clients: clientIdForNotesSync
              ? current.clients.map((c) =>
                  c.id === clientIdForNotesSync
                    ? { ...c, internalNotes: updates.notes!, updatedAt: new Date().toISOString() }
                    : c
                )
              : current.clients,
            commissions: current.commissions.map((commission) => {
              const deal = deals.find((d) => d.id === commission.dealId);
              return deal ? normalizeCommissionWithDeal(commission, deal) : commission;
            }),
            deals,
          };
        });

        apiCall<Deal>(`/api/deals/${dealId}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        }).then((saved) => {
          if (saved) {
            // Update the deal with the authoritative server response
            setState((current) => ({
              ...current,
              deals: current.deals.map((d) => d.id === dealId ? normalizeDeal(saved) : d),
            }));
          } else if (snapshotDeals) {
            // PATCH failed — revert the optimistic update
            setState((current) => ({ ...current, deals: snapshotDeals! }));
          }
        });

        if (updates.notes !== undefined) {
          if (linkedAppointmentIdForNotes) {
            apiCall(`/api/appointments/${linkedAppointmentIdForNotes}`, {
              method: 'PATCH',
              body: JSON.stringify({ internalNotes: updates.notes, notes: updates.notes }),
            });
          }
          if (clientIdForNotesSync) {
            apiCall('/api/appointments', {
              method: 'POST',
              body: JSON.stringify({ _action: 'update_client', id: clientIdForNotesSync, internalNotes: updates.notes }),
            });
          }
        }
      },

      deleteDeal: (dealId, actor) => {
        setState((current) => {
          const deal = current.deals.find((d) => d.id === dealId);

          return {
            ...current,
            activities: deal
              ? prependActivity(
                  current.activities.filter((a) => a.dealId !== dealId),
                  actor,
                  {
                    actionLabel: `Deal deleted: ${getDealLabel(deal)}`,
                    actionType: 'deal_deleted',
                    dealId,
                    entityId: dealId,
                    entityLabel: getDealLabel(deal),
                    entityType: 'deal',
                  }
                )
              : current.activities,
            appointments: current.appointments.filter(
              (a) => a.dealId !== dealId
            ),
            commissions: current.commissions.filter(
              (c) => c.dealId !== dealId
            ),
            deals: current.deals.filter((d) => d.id !== dealId),
            dispatches: current.dispatches.filter(
              (dispatch) => dispatch.dealId !== dealId
            ),
            proposals: current.proposals.filter(
              (proposal) => proposal.dealId !== dealId
            ),
          };
        });

        apiCall(`/api/deals/${dealId}`, { method: 'DELETE' });
      },

      assignContractorToDeal: (dealId, contractorId, actor) => {
        setState((current) => {
          const deal = current.deals.find((d) => d.id === dealId);
          const contractor = current.contractors.find(
            (c) => c.id === contractorId
          );

          return {
            ...current,
            activities: deal
              ? prependActivity(current.activities, actor, {
                  actionLabel: contractor
                    ? `Contractor assigned: ${contractor.companyName}`
                    : 'Contractor assignment cleared',
                  actionType: 'deal_contractor_assigned',
                  contractorId: contractor?.id,
                  dealId: deal.id,
                  entityId: deal.id,
                  entityLabel: getDealLabel(deal),
                  entityType: 'deal',
                  metadata: {
                    contractorName: contractor?.companyName ?? 'Unassigned',
                  },
                })
              : current.activities,
            deals: current.deals.map((d) =>
              d.id === dealId
                ? {
                    ...d,
                    assignedContractorId: contractorId,
                    updatedAt: new Date().toISOString(),
                  }
                : d
            ),
          };
        });

        apiCall(`/api/deals/${dealId}`, {
          method: 'PATCH',
          body: JSON.stringify({ assignedContractorId: contractorId }),
        });
      },

      addDealActivity: (dealId, note, actor) => {
        const trimmedNote = note.trim();
        if (!trimmedNote) return;

        setState((current) => {
          const targetDeal = current.deals.find((d) => d.id === dealId);

          return {
            ...current,
            activities: targetDeal
              ? prependActivity(current.activities, actor, {
                  actionLabel: `Activity note added: ${trimmedNote}`,
                  actionType: 'deal_activity_note_added',
                  dealId: targetDeal.id,
                  entityId: targetDeal.id,
                  entityLabel: getDealLabel(targetDeal),
                  entityType: 'deal',
                })
              : current.activities,
            deals: current.deals.map((deal) => {
              if (deal.id !== dealId) return deal;
              const activity: DealActivity = {
                createdAt: new Date().toISOString(),
                id: createId('activity'),
                note: trimmedNote,
              };
              return {
                ...deal,
                activity: [activity, ...(deal.activity ?? [])],
                updatedAt: new Date().toISOString(),
              };
            }),
          };
        });

        // POST note via the deals/:id endpoint (method: POST adds a note)
        apiCall(`/api/deals/${dealId}`, {
          method: 'POST',
          body: JSON.stringify({ note: trimmedNote }),
        });
      },

      addProposalHistory: (proposal, actor) => {
        // Declare outside setState so it's accessible in the .then() callback
        const proposalHistory: ProposalHistory = {
          ...proposal,
          id: createId('proposal'),
          sentAt: new Date().toISOString(),
        };

        setState((current) => {
          const contractor = current.contractors.find(
            (c) => c.id === proposal.contractorId
          );
          const deal = current.deals.find((d) => d.id === proposal.dealId);

          return {
            ...current,
            activities: prependActivity(current.activities, actor, {
              actionLabel: `Proposal sent to ${contractor?.companyName ?? 'contractor'}`,
              actionType: 'proposal_sent',
              contractorId: contractor?.id,
              dealId: deal?.id,
              entityId: proposalHistory.id,
              entityLabel: proposal.proposalSubject,
              entityType: 'proposal',
              metadata: { contractorName: contractor?.companyName ?? null },
            }),
            proposals: [proposalHistory, ...current.proposals],
          };
        });

        // Persist proposal to DB
        apiCall<ProposalHistory>(`/api/deals/${proposal.dealId}`, {
          method: 'POST',
          body: JSON.stringify({
            _action: 'add_proposal',
            contractorId: proposal.contractorId,
            templateType: proposal.templateType,
            proposalSubject: proposal.proposalSubject,
            proposalBody: proposal.proposalBody,
            sentAt: new Date().toISOString(),
            sentByUserId: proposal.sentByUserId,
          }),
        }).then((saved) => {
          if (!saved) return;
          // Replace temp id with DB-assigned id
          setState((current) => ({
            ...current,
            proposals: current.proposals.map((p) =>
              p.id === proposalHistory.id ? { ...p, id: saved.id } : p
            ),
          }));
        });
      },

      addContractorDispatch: (dispatch, actor) => {
        const now = new Date().toISOString();
        const tempId = createId('dispatch');
        const contractorDispatch: ContractorDispatch = {
          ...dispatch,
          id: tempId,
          sentAt: dispatch.status === 'sent' && !dispatch.sentAt ? now : dispatch.sentAt,
          createdAt: now,
          updatedAt: now,
        };

        setState((current) => {
          const contractor = current.contractors.find(
            (c) => c.id === dispatch.contractorId
          );
          const deal = current.deals.find((d) => d.id === dispatch.dealId);
          const contractorName = contractor?.companyName ?? 'contractor';
          const note = `Opportunity dispatched to ${contractorName}`;

          return {
            ...current,
            activities: prependActivity(current.activities, actor, {
              actionLabel: `${note}${actor?.name ? ` by ${actor.name}` : ''}`,
              actionType: 'contractor_dispatch_sent',
              contractorId: contractor?.id,
              dealId: deal?.id,
              entityId: contractorDispatch.id,
              entityLabel: contractorName,
              entityType: 'proposal',
              metadata: {
                consultationId: contractorDispatch.consultationId ?? null,
                dispatchStatus: contractorDispatch.status,
              },
            }),
            deals: addDealTimelineNote(current.deals, deal?.id, note),
            dispatches: [contractorDispatch, ...current.dispatches],
          };
        });

        // Persist dispatch to DB
        apiCall<ContractorDispatch>(`/api/deals/${dispatch.dealId}`, {
          method: 'POST',
          body: JSON.stringify({
            _action: 'add_dispatch',
            consultationId: dispatch.consultationId ?? null,
            contractorId: dispatch.contractorId,
            sentByUserId: dispatch.sentByUserId,
            sentAt: contractorDispatch.sentAt,
            status: dispatch.status ?? 'draft',
            contractorResponseNote: dispatch.contractorResponseNote ?? '',
            safeSummary: dispatch.safeSummary ?? '',
            estimatedProjectRange: dispatch.estimatedProjectRange ?? '',
            financingRequired: dispatch.financingRequired ?? false,
          }),
        }).then((saved) => {
          if (!saved) return;
          // Replace temp id with DB-assigned id
          setState((current) => ({
            ...current,
            dispatches: current.dispatches.map((d) =>
              d.id === tempId ? { ...d, id: saved.id } : d
            ),
          }));
        });
      },

      updateContractorDispatch: (dispatchId, updates, actor) => {
        let capturedDealId: string | null = null;

        setState((current) => {
          const existingDispatch = current.dispatches.find(
            (d) => d.id === dispatchId
          );
          if (!existingDispatch) return current;

          capturedDealId = existingDispatch.dealId;

          const contractor = current.contractors.find(
            (c) => c.id === existingDispatch.contractorId
          );
          const deal = current.deals.find(
            (d) => d.id === existingDispatch.dealId
          );
          const nextDispatch: ContractorDispatch = {
            ...existingDispatch,
            ...updates,
            id: existingDispatch.id,
            sentAt:
              updates.status === 'sent' && !existingDispatch.sentAt
                ? new Date().toISOString()
                : updates.sentAt ?? existingDispatch.sentAt,
            updatedAt: new Date().toISOString(),
          };
          const statusChanged =
            updates.status && updates.status !== existingDispatch.status;
          const responseNoteChanged =
            updates.contractorResponseNote !== undefined &&
            updates.contractorResponseNote !== existingDispatch.contractorResponseNote;
          const contractorName = contractor?.companyName ?? 'contractor';
          const statusLabel = nextDispatch.status.replace('_', ' ');
          const note = statusChanged
            ? `${contractorName} marked ${statusLabel}`
            : `Dispatch note updated for ${contractorName}`;

          return {
            ...current,
            activities:
              statusChanged || responseNoteChanged
                ? prependActivity(current.activities, actor, {
                    actionLabel: note,
                    actionType: statusChanged
                      ? 'contractor_dispatch_status_updated'
                      : 'contractor_dispatch_response_updated',
                    contractorId: contractor?.id,
                    dealId: deal?.id,
                    entityId: existingDispatch.id,
                    entityLabel: contractorName,
                    entityType: 'proposal',
                    metadata: {
                      from: existingDispatch.status,
                      to: nextDispatch.status,
                    },
                  })
                : current.activities,
            deals:
              statusChanged || responseNoteChanged
                ? addDealTimelineNote(current.deals, deal?.id, note)
                : current.deals,
            dispatches: current.dispatches.map((d) =>
              d.id === dispatchId ? nextDispatch : d
            ),
          };
        });

        // Persist dispatch updates to DB
        if (capturedDealId) {
          apiCall(`/api/deals/${capturedDealId}`, {
            method: 'POST',
            body: JSON.stringify({ _action: 'update_dispatch', dispatchId, ...updates }),
          });
        }
      },

      assignDispatchContractor: (dispatchId, actor) => {
        let capturedDealId: string | null = null;

        setState((current) => {
          const dispatch = current.dispatches.find(
            (d) => d.id === dispatchId
          );
          if (!dispatch) return current;

          capturedDealId = dispatch.dealId;

          const contractor = current.contractors.find(
            (c) => c.id === dispatch.contractorId
          );
          const deal = current.deals.find((d) => d.id === dispatch.dealId);
          const contractorName = contractor?.companyName ?? 'contractor';
          const note = `${contractorName} assigned as contractor`;

          return {
            ...current,
            activities: prependActivity(current.activities, actor, {
              actionLabel: note,
              actionType: 'contractor_dispatch_assigned',
              contractorId: contractor?.id,
              dealId: deal?.id,
              entityId: dispatch.id,
              entityLabel: contractorName,
              entityType: 'proposal',
              metadata: { consultationId: dispatch.consultationId ?? null },
            }),
            appointments: current.appointments.map((appointment) =>
              dispatch.consultationId &&
              appointment.id === dispatch.consultationId
                ? {
                    ...appointment,
                    contractorId: dispatch.contractorId,
                    consultationStage:
                      appointment.consultationStage === 'won' ||
                      appointment.consultationStage === 'lost'
                        ? appointment.consultationStage
                        : 'contractor_accepted',
                    updatedAt: new Date().toISOString(),
                  }
                : appointment
            ),
            deals: addDealTimelineNote(
              current.deals.map((d) =>
                d.id === dispatch.dealId
                  ? {
                      ...d,
                      assignedContractorId: dispatch.contractorId,
                      updatedAt: new Date().toISOString(),
                    }
                  : d
              ),
              dispatch.dealId,
              note
            ),
            dispatches: current.dispatches.map((d) =>
              d.id === dispatchId
                ? {
                    ...d,
                    status: d.status === 'accepted' ? d.status : 'accepted',
                    updatedAt: new Date().toISOString(),
                  }
                : d
            ),
          };
        });

        // Persist: mark dispatch accepted, update deal + appointment in DB
        if (capturedDealId) {
          apiCall(`/api/deals/${capturedDealId}`, {
            method: 'POST',
            body: JSON.stringify({ _action: 'assign_dispatch', dispatchId }),
          });
        }
      },

      // ── Commission mutations ────────────────────────────────────────────────

      updateCommission: (commissionId, updates, actor) => {
        setState((current) => {
          const existingCommission = current.commissions.find(
            (c) => c.id === commissionId
          );
          const relatedDeal = current.deals.find(
            (d) => d.id === existingCommission?.dealId
          );
          const relatedRep = current.users.find(
            (u) => u.id === existingCommission?.repId
          );
          const repName = relatedRep?.name ?? 'rep';
          const repEstimatedCommission = relatedDeal
            ? Math.round(relatedDeal.estimatedJobValue * 0.05)
            : existingCommission?.repEstimatedCommission ?? 0;
          const nextPaidAmount = (() => {
            if (!existingCommission) return 0;
            const requestedPaidAmount =
              updates.repPaidCommission ?? existingCommission.repPaidCommission;

            if (updates.payoutStatus === 'paid') {
              return Math.max(requestedPaidAmount, repEstimatedCommission);
            }
            if (updates.payoutStatus === 'pending') return 0;

            return Math.min(Math.max(requestedPaidAmount, 0), repEstimatedCommission);
          })();
          const nextPayoutStatus = normalizePayoutStatus(
            nextPaidAmount,
            repEstimatedCommission
          );
          const actionLabel =
            nextPayoutStatus === 'partial'
              ? `${actor?.name ?? 'Admin'} recorded partial payout of ${new Intl.NumberFormat('en-CA', {
                  currency: 'CAD',
                  maximumFractionDigits: 0,
                  style: 'currency',
                }).format(nextPaidAmount)} for ${getDealLabel(relatedDeal)}`
              : `${actor?.name ?? 'Admin'} updated ${repName}'s payout for ${getDealLabel(relatedDeal)} to ${
                  nextPayoutStatus.charAt(0).toUpperCase() +
                  nextPayoutStatus.slice(1)
                }`;

          return {
            ...current,
            activities:
              existingCommission && relatedDeal
                ? prependActivity(current.activities, actor, {
                    actionLabel,
                    actionType: 'commission_updated',
                    dealId: relatedDeal.id,
                    entityId: existingCommission.id,
                    entityLabel: getDealLabel(relatedDeal),
                    entityType: 'commission',
                    metadata: {
                      payoutStatus: nextPayoutStatus,
                      repPaidCommission: nextPaidAmount,
                    },
                  })
                : current.activities,
            commissions: current.commissions.map((commission) => {
              if (commission.id !== commissionId) return commission;

              const deal = current.deals.find(
                (d) => d.id === commission.dealId
              );
              const repEst = deal
                ? Math.round(deal.estimatedJobValue * 0.05)
                : commission.repEstimatedCommission;
              const adminTotalCommissionRate =
                updates.adminTotalCommissionRate ?? commission.adminTotalCommissionRate;
              const adminTotalEstimatedCommission =
                updates.adminTotalEstimatedCommission ??
                (deal
                  ? Math.round(deal.estimatedJobValue * adminTotalCommissionRate)
                  : commission.adminTotalEstimatedCommission);
              const requestedPaid =
                updates.repPaidCommission ?? commission.repPaidCommission;
              const repPaidCommission =
                updates.payoutStatus === 'paid'
                  ? Math.max(requestedPaid, repEst)
                  : updates.payoutStatus === 'pending'
                    ? 0
                    : Math.min(Math.max(requestedPaid, 0), repEst);
              const payoutStatus = normalizePayoutStatus(repPaidCommission, repEst);

              return {
                ...commission,
                adminNetCommission: adminTotalEstimatedCommission - repEst,
                adminTotalCommissionRate,
                adminTotalEstimatedCommission,
                payoutStatus,
                repEstimatedCommission: repEst,
                repPaidCommission,
              };
            }),
          };
        });

        apiCall(`/api/commissions/${commissionId}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        });
      },

      // ── Days off mutations ──────────────────────────────────────────────────

      addDaysOff: async (dates, note, targetUserId) => {
        const created = await apiCall<RepDayOff[]>('/api/appointments', {
          method: 'POST',
          body: JSON.stringify({ _action: 'add_days_off', dates, note, targetUserId }),
        });
        if (created) {
          setState((current) => ({
            ...current,
            daysOff: [
              ...current.daysOff.filter((d) => !created.some((c) => c.id === d.id)),
              ...created,
            ],
          }));
        }
        return created ?? [];
      },

      removeDayOff: async (id) => {
        await apiCall('/api/appointments', {
          method: 'POST',
          body: JSON.stringify({ _action: 'remove_day_off', id }),
        });
        setState((current) => ({
          ...current,
          daysOff: current.daysOff.filter((d) => d.id !== id),
        }));
      },

      // ── Household mutations ─────────────────────────────────────────────────

      addHousehold: async (name, notes, memberIds) => {
        const h = await apiCall<Household>('/api/appointments', {
          method: 'POST',
          body: JSON.stringify({ _action: 'create_household', name, notes, memberIds }),
        });
        if (h) {
          setState((current) => ({
            ...current,
            households: [h, ...current.households],
            clients: current.clients.map((c) =>
              memberIds.includes(c.id) ? { ...c, householdId: h.id } : c
            ),
          }));
        }
        return h;
      },

      updateHousehold: async (householdId, updates) => {
        const h = await apiCall<Household>('/api/appointments', {
          method: 'POST',
          body: JSON.stringify({ _action: 'update_household', id: householdId, ...updates }),
        });
        if (h) {
          setState((current) => ({
            ...current,
            households: current.households.map((hh) => (hh.id === householdId ? h : hh)),
            clients: current.clients.map((c) => {
              if (updates.addMemberId && c.id === updates.addMemberId) return { ...c, householdId };
              if (updates.removeMemberId && c.id === updates.removeMemberId) return { ...c, householdId: null };
              return c;
            }),
          }));
        }
        return h;
      },

      deleteHousehold: async (householdId) => {
        await apiCall('/api/appointments', {
          method: 'POST',
          body: JSON.stringify({ _action: 'delete_household', id: householdId }),
        });
        setState((current) => ({
          ...current,
          households: current.households.filter((h) => h.id !== householdId),
          clients: current.clients.map((c) =>
            c.householdId === householdId ? { ...c, householdId: null } : c
          ),
        }));
      },

      // ── Sales Agreement mutations ───────────────────────────────────────────

      getUploadToken: async (dealId) => {
        const result = await apiCall<{ clientToken: string; pathname: string }>(
          `/api/deals/${dealId}`,
          { method: 'POST', body: JSON.stringify({ _action: 'agreement_upload_token', dealId }) }
        );
        return result ?? null;
      },

      addSalesAgreement: async (dealId, fileName, url) => {
        const agreement = await apiCall<SalesAgreement>(`/api/deals/${dealId}`, {
          method: 'POST',
          body: JSON.stringify({ _action: 'add_agreement', dealId, fileName, url }),
        });
        if (agreement) {
          setState((current) => ({
            ...current,
            salesAgreements: [agreement, ...current.salesAgreements],
          }));
        }
        return agreement ?? null;
      },

      deleteSalesAgreement: async (id) => {
        const agreement = state.salesAgreements.find((a) => a.id === id);
        if (!agreement) return;
        await apiCall(`/api/deals/${agreement.dealId}`, {
          method: 'POST',
          body: JSON.stringify({ _action: 'delete_agreement', id }),
        });
        setState((current) => ({
          ...current,
          salesAgreements: current.salesAgreements.filter((a) => a.id !== id),
        }));
      },

      // ── Client mutations ────────────────────────────────────────────────────

      getAppointmentsForClient: (clientId) =>
        state.appointments.filter((a) => a.clientId === clientId),

      addClient: async (draft) => {
        const client = await apiCall<Client>('/api/appointments', {
          method: 'POST',
          body: JSON.stringify({ _action: 'create_client', ...draft }),
        });
        if (client) {
          setState((current) => ({ ...current, clients: [client, ...current.clients] }));
        }
        return client;
      },

      updateClient: async (clientId, updates) => {
        const client = await apiCall<Client>('/api/appointments', {
          method: 'POST',
          body: JSON.stringify({ _action: 'update_client', id: clientId, ...updates }),
        });
        if (client) {
          setState((current) => ({
            ...current,
            clients: current.clients.map((c) => (c.id === clientId ? client : c)),
          }));
        }
        return client;
      },

      deleteClient: async (clientId) => {
        await apiCall('/api/appointments', {
          method: 'POST',
          body: JSON.stringify({ _action: 'delete_client', id: clientId }),
        });
        setState((current) => ({
          ...current,
          clients: current.clients.filter((c) => c.id !== clientId),
        }));
      },

      // ── Sales Tracker mutations ─────────────────────────────────────────────

      addTrackerRow: async (repId, draft = {}) => {
        const row = await apiCall<SaleTrackerRow>('/api/deals', {
          method: 'POST',
          body: JSON.stringify({ _action: 'create_tracker_row', repId, ...draft }),
        });
        if (row) setState((current) => ({ ...current, trackerRows: [...current.trackerRows, row] }));
        return row;
      },

      updateTrackerRow: async (id, updates) => {
        const row = await apiCall<SaleTrackerRow>('/api/deals', {
          method: 'POST',
          body: JSON.stringify({ _action: 'update_tracker_row', id, ...updates }),
        });
        if (row) {
          setState((current) => ({
            ...current,
            trackerRows: current.trackerRows.map((r) => (r.id === id ? row : r)),
          }));
        }
        return row;
      },

      deleteTrackerRow: async (id) => {
        await apiCall('/api/deals', {
          method: 'POST',
          body: JSON.stringify({ _action: 'delete_tracker_row', id }),
        });
        setState((current) => ({
          ...current,
          trackerRows: current.trackerRows.filter((r) => r.id !== id),
        }));
      },

      // ── Appointment mutations ───────────────────────────────────────────────

      addAppointment: (appointmentDraft, actor) => {
        const tempId = createId('appointment');
        const now = new Date().toISOString();
        const appointment: Appointment = {
          ...appointmentDraft,
          createdAt: now,
          id: tempId,
          source: 'manual',
          updatedAt: now,
        };

        setState((current) => {
          const deal = current.deals.find((d) => d.id === appointment.dealId);
          const contractor = current.contractors.find(
            (c) => c.id === appointment.contractorId
          );
          const entityLabel =
            appointment.customerName || appointment.title || getDealLabel(deal);

          return {
            ...current,
            activities: prependActivity(current.activities, actor, {
              actionLabel: `Consultation created for ${entityLabel}`,
              actionType: 'consultation_created',
              contractorId: appointment.contractorId || undefined,
              dealId: appointment.dealId || undefined,
              entityId: appointment.id,
              entityLabel,
              entityType: 'appointment',
              metadata: {
                appointmentDate: appointment.appointmentDate,
                appointmentTime: appointment.appointmentTime,
                contractor: contractor?.companyName ?? null,
                status: appointment.status,
              },
            }),
            appointments: [appointment, ...current.appointments],
          };
        });

        apiCall<Appointment>('/api/appointments', {
          method: 'POST',
          body: JSON.stringify(appointmentDraft),
        }).then((saved) => {
          if (!saved) return;
          setState((current) => ({
            ...current,
            appointments: current.appointments.map((a) =>
              a.id === tempId ? normalizeAppointment(saved, current.deals) : a
            ),
          }));
        });
      },

      updateAppointment: (appointmentId, updates, actor) => {
        // Capture linked deal updates so we can persist them after setState
        let capturedLinkedDealId: string | null = null;
        let capturedLinkedDealUpdates: Record<string, unknown> = {};
        let capturedClientIdForNotes: string | null = null;

        setState((current) => {
          const previousAppointment = current.appointments.find(
            (a) => a.id === appointmentId
          );
          const nextAppointment = previousAppointment
            ? {
                ...previousAppointment,
                ...updates,
                id: previousAppointment.id,
                updatedAt: new Date().toISOString(),
              }
            : undefined;
          const deal = current.deals.find(
            (d) => d.id === nextAppointment?.dealId
          );
          const contractor = current.contractors.find(
            (c) => c.id === nextAppointment?.contractorId
          );
          const rep = current.users.find(
            (u) => u.id === nextAppointment?.assignedRepId
          );
          const entityLabel =
            nextAppointment?.customerName ||
            nextAppointment?.title ||
            getDealLabel(deal);
          let actionType = 'consultation_edited';
          let actionLabel = `Consultation edited for ${entityLabel}`;
          let shouldAddDealProposalActivity = false;
          let shouldAddOutcomeDealActivity = false;
          let linkedDealStatusUpdate: DealStatus | null = null;
          let linkedDealFollowUpDate: string | null = null;
          let linkedDealFinancingRequired: boolean | null = null;
          let linkedDealEstimatedValue: number | null = null;
          let linkedDealContractorId: string | null | undefined;

          if (
            previousAppointment &&
            nextAppointment &&
            (previousAppointment.appointmentDate !== nextAppointment.appointmentDate ||
              previousAppointment.appointmentTime !== nextAppointment.appointmentTime)
          ) {
            actionType = 'consultation_rescheduled';
            actionLabel = `Consultation rescheduled for ${entityLabel}`;
          }

          if (
            previousAppointment &&
            nextAppointment &&
            previousAppointment.assignedRepId !== nextAppointment.assignedRepId
          ) {
            actionType = 'consultation_assigned_to_rep';
            actionLabel = `Consultation assigned to ${rep?.name ?? 'Unassigned Rep'} for ${entityLabel}`;
          }

          if (
            previousAppointment &&
            nextAppointment &&
            previousAppointment.contractorId !== nextAppointment.contractorId
          ) {
            actionType = 'consultation_assigned_to_contractor';
            actionLabel = `Consultation assigned to ${
              contractor?.companyName ?? 'Unassigned Contractor'
            } for ${entityLabel}`;
          }

          if (
            previousAppointment &&
            nextAppointment &&
            previousAppointment.dealId !== nextAppointment.dealId
          ) {
            actionType = nextAppointment.dealId
              ? 'consultation_linked_to_deal'
              : 'consultation_unlinked_from_deal';
            actionLabel = nextAppointment.dealId
              ? `Consultation linked to deal: ${entityLabel}`
              : `Consultation unlinked from deal: ${entityLabel}`;
          }

          if (
            previousAppointment &&
            nextAppointment &&
            previousAppointment.customerNotes !== nextAppointment.customerNotes
          ) {
            actionType = 'consultation_customer_notes_updated';
            actionLabel = `Customer notes updated for ${entityLabel}`;
          }

          if (
            previousAppointment &&
            nextAppointment &&
            previousAppointment.internalNotes !== nextAppointment.internalNotes
          ) {
            actionType = 'consultation_internal_notes_updated';
            actionLabel = `Internal notes updated for ${entityLabel}`;
          }

          if (
            previousAppointment &&
            nextAppointment &&
            previousAppointment.consultationStage !== nextAppointment.consultationStage
          ) {
            actionType = 'consultation_stage_changed';
            actionLabel = `Consultation stage changed to ${formatConsultationStage(
              nextAppointment.consultationStage
            )} for ${entityLabel}`;

            if (nextAppointment.consultationStage === 'won') {
              actionType = 'consultation_won';
              actionLabel = `Consultation marked won for ${entityLabel}`;
              linkedDealStatusUpdate = 'won';
            } else if (nextAppointment.consultationStage === 'lost') {
              actionType = 'consultation_lost';
              actionLabel = `Consultation marked lost for ${entityLabel}`;
              linkedDealStatusUpdate = 'lost';
            } else if (nextAppointment.consultationStage === 'estimate_requested') {
              actionType = 'consultation_estimate_requested';
              linkedDealStatusUpdate =
                deal && ['new_lead', 'appointment_booked'].includes(deal.status)
                  ? 'quoted'
                  : deal?.status === 'quoted'
                    ? 'negotiating'
                    : null;
            } else if (nextAppointment.consultationStage === 'contractor_review') {
              actionType = 'consultation_contractor_review';
            } else if (nextAppointment.consultationStage === 'proposal_sent') {
              actionType = 'consultation_proposal_sent';
              shouldAddDealProposalActivity = Boolean(nextAppointment.dealId);
            } else if (nextAppointment.consultationStage === 'follow_up_required') {
              actionType = 'consultation_follow_up_required';
            }
          }

          if (
            previousAppointment &&
            nextAppointment &&
            previousAppointment.status !== nextAppointment.status
          ) {
            if (nextAppointment.status === 'completed') {
              actionType = 'consultation_completed';
              actionLabel = `Consultation marked completed for ${entityLabel}`;
            } else if (nextAppointment.status === 'cancelled') {
              actionType = 'consultation_cancelled';
              actionLabel = `Consultation cancelled for ${entityLabel}`;
            } else if (nextAppointment.status === 'no_show') {
              actionType = 'consultation_no_show';
              actionLabel = `Consultation marked no-show for ${entityLabel}`;
            } else if (nextAppointment.status === 'rescheduled') {
              actionType = 'consultation_rescheduled';
              actionLabel = `Consultation rescheduled for ${entityLabel}`;
            } else if (nextAppointment.status === 'confirmed') {
              actionType = 'consultation_confirmed';
              actionLabel = `Consultation confirmed for ${entityLabel}`;
            } else if (nextAppointment.status === 'scheduled') {
              actionType = 'consultation_status_changed';
              actionLabel = `Consultation status changed to scheduled for ${entityLabel}`;
            }
          }

          if (
            previousAppointment &&
            nextAppointment &&
            (previousAppointment.outcomeSubmitted !== nextAppointment.outcomeSubmitted ||
              previousAppointment.estimatedProjectValue !== nextAppointment.estimatedProjectValue ||
              previousAppointment.financingNeeded !== nextAppointment.financingNeeded ||
              previousAppointment.homeownerInterestLevel !== nextAppointment.homeownerInterestLevel ||
              previousAppointment.nextStep !== nextAppointment.nextStep ||
              previousAppointment.recommendedContractorId !== nextAppointment.recommendedContractorId ||
              previousAppointment.closeProbability !== nextAppointment.closeProbability ||
              previousAppointment.outcomeNotes !== nextAppointment.outcomeNotes ||
              previousAppointment.objections !== nextAppointment.objections ||
              previousAppointment.followUpDate !== nextAppointment.followUpDate)
          ) {
            const isFirstSubmission =
              !previousAppointment.outcomeSubmitted && nextAppointment.outcomeSubmitted;
            actionType = isFirstSubmission
              ? 'consultation_outcome_submitted'
              : 'consultation_outcome_edited';
            actionLabel = isFirstSubmission
              ? `Outcome report submitted for ${entityLabel}`
              : `Outcome report edited for ${entityLabel}`;

            if (nextAppointment.outcomeSubmitted && nextAppointment.dealId) {
              shouldAddOutcomeDealActivity = true;
              if (nextAppointment.estimatedProjectValue > 0) {
                linkedDealEstimatedValue = nextAppointment.estimatedProjectValue;
              }
              if (nextAppointment.financingNeeded !== null) {
                linkedDealFinancingRequired = nextAppointment.financingNeeded;
              }
              if (nextAppointment.nextStep === 'won') {
                linkedDealStatusUpdate = 'won';
              } else if (nextAppointment.nextStep === 'lost') {
                linkedDealStatusUpdate = 'lost';
              } else if (
                nextAppointment.nextStep === 'follow_up_required' &&
                nextAppointment.followUpDate
              ) {
                linkedDealFollowUpDate = nextAppointment.followUpDate;
              }
              if (nextAppointment.recommendedContractorId) {
                linkedDealContractorId = nextAppointment.recommendedContractorId;
              }
            }
          }

          // Sync notes to linked deal when internalNotes/notes change on the appointment
          const linkedDealNotesUpdate =
            nextAppointment?.dealId &&
            previousAppointment &&
            (updates.internalNotes !== undefined || updates.notes !== undefined)
              ? (updates.internalNotes ?? updates.notes ?? null)
              : null;

          // Sync notes to matching client record
          if (
            previousAppointment &&
            (updates.internalNotes !== undefined || updates.notes !== undefined)
          ) {
            const matchingClient =
              (nextAppointment?.email ? current.clients.find((c) => c.email === nextAppointment.email) : null) ||
              current.clients.find((c) => c.name === nextAppointment?.customerName);
            if (matchingClient) capturedClientIdForNotes = matchingClient.id;
          }

          // Capture any linked deal mutations for persistence outside setState
          if (nextAppointment?.dealId) {
            capturedLinkedDealId = nextAppointment.dealId;
            capturedLinkedDealUpdates = {
              ...(linkedDealStatusUpdate ? { status: linkedDealStatusUpdate } : {}),
              ...(linkedDealEstimatedValue !== null ? { estimatedJobValue: linkedDealEstimatedValue } : {}),
              ...(linkedDealFinancingRequired !== null ? { financingRequired: linkedDealFinancingRequired } : {}),
              ...(linkedDealFollowUpDate !== null ? { nextFollowUpDate: linkedDealFollowUpDate } : {}),
              ...(linkedDealContractorId !== undefined ? { assignedContractorId: linkedDealContractorId } : {}),
              ...(linkedDealNotesUpdate !== null ? { notes: linkedDealNotesUpdate } : {}),
            };
          }

          return {
            ...current,
            activities:
              previousAppointment && nextAppointment
                ? prependActivity(current.activities, actor, {
                    actionLabel,
                    actionType,
                    contractorId: nextAppointment.contractorId || undefined,
                    dealId: nextAppointment.dealId || undefined,
                    entityId: nextAppointment.id,
                    entityLabel,
                    entityType: 'appointment',
                    metadata: {
                      appointmentDate: nextAppointment.appointmentDate,
                      appointmentTime: nextAppointment.appointmentTime,
                      assignedRep: rep?.name ?? null,
                      consultationStage: nextAppointment.consultationStage,
                      contractor: contractor?.companyName ?? null,
                      outcomeSubmitted: nextAppointment.outcomeSubmitted,
                      status: nextAppointment.status,
                    },
                  })
                : current.activities,
            appointments: current.appointments.map((a) =>
              a.id === appointmentId && nextAppointment ? nextAppointment : a
            ),
            clients: capturedClientIdForNotes
              ? current.clients.map((c) =>
                  c.id === capturedClientIdForNotes
                    ? { ...c, internalNotes: (updates.internalNotes ?? updates.notes ?? c.internalNotes), updatedAt: new Date().toISOString() }
                    : c
                )
              : current.clients,
            deals: current.deals.map((candidate) => {
              if (!nextAppointment || candidate.id !== nextAppointment.dealId) {
                return candidate;
              }

              const activity =
                shouldAddDealProposalActivity && candidate.id === nextAppointment.dealId
                  ? {
                      createdAt: new Date().toISOString(),
                      id: createId('deal-activity'),
                      note: `Consultation moved to Proposal Sent by ${actor?.name ?? 'System'}`,
                    }
                  : shouldAddOutcomeDealActivity && candidate.id === nextAppointment.dealId
                    ? {
                        createdAt: new Date().toISOString(),
                        id: createId('deal-activity'),
                        note: `Outcome report applied by ${actor?.name ?? 'System'}`,
                      }
                    : null;

              return {
                ...candidate,
                ...(linkedDealStatusUpdate ? { status: linkedDealStatusUpdate } : {}),
                ...(linkedDealEstimatedValue !== null
                  ? { estimatedJobValue: linkedDealEstimatedValue }
                  : {}),
                ...(linkedDealFinancingRequired !== null
                  ? { financingRequired: linkedDealFinancingRequired }
                  : {}),
                ...(linkedDealFollowUpDate !== null
                  ? { nextFollowUpDate: linkedDealFollowUpDate }
                  : {}),
                ...(linkedDealContractorId !== undefined
                  ? { assignedContractorId: linkedDealContractorId }
                  : {}),
                ...(linkedDealNotesUpdate !== null
                  ? { notes: linkedDealNotesUpdate }
                  : {}),
                activity: activity
                  ? [activity, ...(candidate.activity ?? [])]
                  : candidate.activity,
                updatedAt:
                  linkedDealStatusUpdate ||
                  linkedDealEstimatedValue !== null ||
                  linkedDealFinancingRequired !== null ||
                  linkedDealFollowUpDate !== null ||
                  linkedDealContractorId !== undefined ||
                  linkedDealNotesUpdate !== null ||
                  activity
                    ? new Date().toISOString()
                    : candidate.updatedAt,
              };
            }),
          };
        });

        apiCall(`/api/appointments/${appointmentId}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        });

        // Persist client notes sync
        if (capturedClientIdForNotes) {
          const notesValue = updates.internalNotes ?? updates.notes;
          if (notesValue !== undefined) {
            apiCall('/api/appointments', {
              method: 'POST',
              body: JSON.stringify({ _action: 'update_client', id: capturedClientIdForNotes, internalNotes: notesValue }),
            });
          }
        }

        // If the outcome submission changed linked deal fields, persist those too
        if (capturedLinkedDealId && Object.keys(capturedLinkedDealUpdates).length > 0) {
          apiCall(`/api/deals/${capturedLinkedDealId}`, {
            method: 'PATCH',
            body: JSON.stringify(capturedLinkedDealUpdates),
          });
        }
      },

      deleteAppointment: (appointmentId, actor) => {
        setState((current) => {
          const appointment = current.appointments.find(
            (a) => a.id === appointmentId
          );
          const deal = current.deals.find(
            (d) => d.id === appointment?.dealId
          );

          return {
            ...current,
            activities: appointment
              ? prependActivity(current.activities, actor, {
                  actionLabel: `Consultation deleted: ${
                    appointment.customerName || appointment.title || getDealLabel(deal)
                  }`,
                  actionType: 'consultation_deleted',
                  contractorId: appointment.contractorId || undefined,
                  dealId: appointment.dealId || undefined,
                  entityId: appointment.id,
                  entityLabel:
                    appointment.customerName ||
                    appointment.title ||
                    getDealLabel(deal),
                  entityType: 'appointment',
                })
              : current.activities,
            appointments: current.appointments.filter(
              (a) => a.id !== appointmentId
            ),
          };
        });

        apiCall(`/api/appointments/${appointmentId}`, { method: 'DELETE' });
      },

      transferAppointment: async (appointmentId, toRepId) => {
        const updated = await apiCall<Appointment>('/api/appointments', {
          method: 'POST',
          body: JSON.stringify({ _action: 'transfer_appointment', id: appointmentId, toRepId }),
        });
        if (!updated) return false;
        setState((current) => ({
          ...current,
          appointments: current.appointments.map((a) =>
            a.id === appointmentId ? { ...a, assignedRepId: toRepId } : a
          ),
        }));
        return true;
      },

      createDealFromAppointment: (appointmentId, actor) => {
        // Capture deal data outside setState so we can persist it after
        let capturedDeal: Deal | null = null;

        setState((current) => {
          const appointment = current.appointments.find(
            (a) => a.id === appointmentId
          );
          if (!appointment || appointment.dealId) return current;

          const now = new Date().toISOString();
          // Fall back to matching client record if address fields are missing on the appointment
          const linkedClient = appointment.email
            ? current.clients?.find((c) => c.email === appointment.email)
            : undefined;
          const dealAddress = appointment.address?.trim() || linkedClient?.address?.trim() || '';
          const dealCity = appointment.city?.trim() || linkedClient?.city?.trim() || '';
          const dealPostalCode = appointment.postalCode?.trim() || linkedClient?.postalCode?.trim() || '';
          const deal: Deal = {
            activity: [],
            address: dealAddress,
            assignedContractorId:
              appointment.recommendedContractorId ?? appointment.contractorId,
            assignedRepId: appointment.assignedRepId,
            city: dealCity,
            createdAt: now,
            email: appointment.email,
            estimatedJobValue: appointment.estimatedProjectValue || 0,
            financingRequired: appointment.financingNeeded ?? false,
            homeownerName:
              appointment.customerName || appointment.title || 'Consultation lead',
            id: createId('deal'),
            nextFollowUpDate:
              appointment.followUpDate || appointment.appointmentDate,
            notes: appointment.internalNotes || appointment.notes,
            phone: appointment.phone,
            postalCode: dealPostalCode,
            projectType: appointment.projectType || 'Consultation',
            status: 'appointment_booked',
            updatedAt: now,
          };

          capturedDeal = deal;

          return {
            ...current,
            activities: prependActivity(
              prependActivity(current.activities, actor, {
                actionLabel: `Deal created from consultation: ${getDealLabel(deal)}`,
                actionType: 'deal_created_from_consultation',
                dealId: deal.id,
                entityId: deal.id,
                entityLabel: getDealLabel(deal),
                entityType: 'deal',
              }),
              actor,
              {
                actionLabel: `Consultation linked to deal: ${getDealLabel(deal)}`,
                actionType: 'consultation_linked_to_deal',
                dealId: deal.id,
                entityId: appointment.id,
                entityLabel: getDealLabel(deal),
                entityType: 'appointment',
              }
            ),
            appointments: current.appointments.map((a) =>
              a.id === appointmentId
                ? { ...a, dealId: deal.id, updatedAt: now }
                : a
            ),
            commissions: [
              ...current.commissions,
              createCommissionForDeal(deal, current.defaultCommissionRate),
            ],
            deals: [...current.deals, deal],
          };
        });

        // Persist: create the deal in the DB, then link the appointment to it
        if (!capturedDeal) return;
        const tempDeal = capturedDeal as Deal;
        const tempId = tempDeal.id;

        apiCall<Deal & { _commissionId?: string }>('/api/deals', {
          method: 'POST',
          body: JSON.stringify({
            homeownerName: tempDeal.homeownerName,
            phone: tempDeal.phone,
            email: tempDeal.email,
            address: tempDeal.address ?? '',
            city: tempDeal.city,
            postalCode: tempDeal.postalCode ?? '',
            projectType: tempDeal.projectType,
            estimatedJobValue: tempDeal.estimatedJobValue,
            financingRequired: tempDeal.financingRequired,
            assignedRepId: tempDeal.assignedRepId,
            assignedContractorId: tempDeal.assignedContractorId ?? null,
            status: tempDeal.status,
            notes: tempDeal.notes,
            nextFollowUpDate: tempDeal.nextFollowUpDate,
            _fromAppointmentId: appointmentId,
          }),
        }).then(async (saved) => {
          if (!saved) return;
          const realDealId = saved.id;

          // Reload tracker rows and clients so UI reflects new records immediately
          const [trackerRows, clients] = await Promise.all([
            apiCall<SaleTrackerRow[]>('/api/deals?_resource=tracker').then((r) => r ?? []),
            apiCall<Client[]>('/api/appointments?_resource=clients').then((r) => r ?? []),
          ]);

          // Replace temp IDs with the real DB-assigned IDs
          setState((current) => ({
            ...current,
            clients,
            deals: current.deals.map((d) =>
              d.id === tempId ? normalizeDeal(saved) : d
            ),
            commissions: current.commissions.map((c) => {
              if (c.dealId !== tempId) return c;
              return {
                ...c,
                dealId: realDealId,
                ...(saved._commissionId ? { id: saved._commissionId } : {}),
              };
            }),
            appointments: current.appointments.map((a) =>
              a.id === appointmentId ? { ...a, dealId: realDealId } : a
            ),
            trackerRows,
          }));

          // Persist the appointment → deal link in the DB
          apiCall(`/api/appointments/${appointmentId}`, {
            method: 'PATCH',
            body: JSON.stringify({ dealId: realDealId }),
          });
        });
      },

      // ── Selectors / calculators (pure, no API) ──────────────────────────────
      calculateAdminPaidRepCommission,
      calculateAdminPendingNetCommission,
      calculateAdminPendingRepCommission,
      calculateAdminProjectedCommission,
      calculateClosedVolume,
      calculateHistoricalSalesTotal,
      calculateHistoricalSalesCount,
      calculateOpenDealsForUser,
      calculatePipelineValue,
      calculatePipelineValueForUser,
      calculateRepPaidCommission,
      calculateRepPendingCommission,
      calculateRepProjectedCommission,
      calculateVisiblePendingCommission,
      calculateVisibleWonDeals,
      calculateWonDeals,
      getActivitiesForUser,
      getAppointmentsForDeal,
      getDispatchesForConsultation,
      getDispatchesForDeal,
      getVisibleDispatchesForUser,
      getVisibleAppointmentsForUser,
      getDealsForRep,
      getVisibleDealsForUser,
    };
  }, [state, isLoading]);

  return (
    <PortalDataContext.Provider value={value}>
      {children}
    </PortalDataContext.Provider>
  );
}

export function usePortalData() {
  const context = useContext(PortalDataContext);

  if (!context) {
    throw new Error('usePortalData must be used inside PortalDataProvider');
  }

  return context;
}

export function isFinancingStatus(value: string): value is FinancingStatus {
  return ['cash_only', 'financing_available', 'pending_financing'].includes(
    value
  );
}

export function isContractorStatus(value: string): value is ContractorStatus {
  return ['active', 'pending', 'inactive'].includes(value);
}
