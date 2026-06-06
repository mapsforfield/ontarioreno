import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  fetchGoogleCalendarEvents,
  GoogleCalendarEvent,
} from './googleCalendar';
import {
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
  ProposalHistory,
  User,
} from './types';

type ContractorDraft = Omit<Contractor, 'id'>;

type DealDraft = Pick<
  Deal,
  | 'homeownerName'
  | 'phone'
  | 'email'
  | 'city'
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
  users: User[];
  contractors: Contractor[];
  dispatches: ContractorDispatch[];
  deals: Deal[];
  commissions: Commission[];
  proposals: ProposalHistory[];
};

type ContractorDispatchDraft = Omit<
  ContractorDispatch,
  'createdAt' | 'id' | 'updatedAt'
>;

type PortalDataContextValue = PortalDataState & {
  isLoading: boolean;
  addUser: (user: Omit<User, 'id' | 'role'>, actor?: User) => void;
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
  addAppointment: (appointment: AppointmentDraft, actor?: User) => void;
  updateAppointment: (
    appointmentId: string,
    updates: Partial<Appointment>,
    actor?: User
  ) => void;
  deleteAppointment: (appointmentId: string, actor?: User) => void;
  createDealFromAppointment: (appointmentId: string, actor?: User) => void;
  importGoogleCalendarEvents: (
    actor?: User,
    events?: GoogleCalendarEvent[]
  ) => Promise<{ imported: number; updated: number; unlinked: number }>;
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
  calculatePipelineValue: (repId: string) => number;
  calculatePipelineValueForUser: (user: User) => number;
  calculateOpenDealsForUser: (user: User) => number;
  calculateVisiblePendingCommission: (user: User) => number;
  calculateVisibleWonDeals: (user: User) => number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const openDealStatuses: DealStatus[] = [
  'new_lead',
  'contacted',
  'appointment_booked',
  'quoted',
  'negotiating',
];
const projectedCommissionStatuses: DealStatus[] = [...openDealStatuses, 'won'];

const emptyState: PortalDataState = {
  activities: [],
  appointments: [],
  commissions: [],
  contractors: [],
  deals: [],
  dispatches: [],
  proposals: [],
  users: [],
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
    'contacted',
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
    activity: Array.isArray(deal.activity) ? deal.activity : [],
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
  const deal = deals.find((candidate) => candidate.id === appointment.dealId);

  return {
    ...appointment,
    address: appointment.address ?? appointment.location ?? '',
    city: appointment.city ?? deal?.city ?? '',
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

function findRepForGoogleEvent(
  event: GoogleCalendarEvent,
  users: User[]
) {
  const eventText = normalizeSearchValue(
    `${event.teamMemberName ?? ''} ${event.title} ${event.description}`
  );

  return users.find(
    (user) =>
      user.role === 'rep' &&
      user.active &&
      eventText.includes(normalizeSearchValue(user.name))
  );
}

function findDealForGoogleEvent(event: GoogleCalendarEvent, deals: Deal[]) {
  const eventText = normalizeSearchValue(
    `${event.title} ${event.description}`
  );

  const nameMatch = deals.find((deal) =>
    eventText.includes(normalizeSearchValue(deal.homeownerName))
  );
  if (nameMatch) return nameMatch;

  return deals.find((deal) => {
    const projectType = normalizeSearchValue(deal.projectType);
    return projectType && eventText.includes(projectType);
  });
}

function googleEventToAppointment(
  event: GoogleCalendarEvent,
  actor: User | undefined,
  users: User[],
  deals: Deal[]
): Appointment {
  const [appointmentDate, appointmentTime = ''] =
    event.startDateTime.split('T');
  const matchedDeal = findDealForGoogleEvent(event, deals);
  const matchedRep = findRepForGoogleEvent(event, users);
  const fallbackRep = users.find((user) => user.role === 'rep' && user.active);
  const assignedRepId =
    matchedRep?.id ??
    (actor?.role === 'rep' ? actor.id : undefined) ??
    matchedDeal?.assignedRepId ??
    fallbackRep?.id ??
    actor?.id ??
    'unassigned';

  return {
    appointmentDate,
    appointmentTime: appointmentTime.slice(0, 5),
    appointmentType: 'home_visit',
    address: event.location,
    assignedRepId,
    consultationStage: 'consultation_scheduled',
    contractorId: matchedDeal?.assignedContractorId ?? null,
    closeProbability: 0,
    city: matchedDeal?.city ?? '',
    createdAt: new Date().toISOString(),
    createdByUserId: actor?.id ?? 'system',
    customerNotes: '',
    customerName: matchedDeal?.homeownerName ?? event.title,
    dealId: matchedDeal?.id ?? '',
    durationMinutes: 60,
    email: '',
    externalCalendarId: event.externalCalendarId,
    externalEventId: event.externalEventId,
    estimatedProjectValue: 0,
    financingNeeded: null,
    followUpDate: '',
    homeownerInterestLevel: null,
    id: `google-${event.externalEventId}`,
    internalNotes: `${event.title}\n\n${event.description}`,
    location: event.location,
    notes: `${event.title}\n\n${event.description}`,
    nextStep: 'no_action',
    objections: '',
    outcomeNotes: '',
    outcomeSubmitted: false,
    phone: '',
    projectType: matchedDeal?.projectType ?? 'Consultation',
    recommendedContractorId: null,
    source: 'google_calendar',
    status: 'scheduled',
    syncedAt: new Date().toISOString(),
    title: event.title,
    updatedAt: new Date().toISOString(),
  };
}

function createCommissionForDeal(deal: Deal): Commission {
  const repEstimatedCommission = Math.round(deal.estimatedJobValue * 0.05);
  const adminTotalEstimatedCommission = Math.round(
    deal.estimatedJobValue * 0.1
  );

  return {
    id: createId('commission'),
    adminNetCommission:
      adminTotalEstimatedCommission - repEstimatedCommission,
    adminTotalCommissionRate: 0.1,
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
    .filter((deal) => deal.status === 'won' && !commissionDealIds.has(deal.id))
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
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function PortalDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PortalDataState>(emptyState);
  const [isLoading, setIsLoading] = useState(true);

  // Load all portal data from the API on mount.
  // We only run this when on a /portal route so public pages don't fire
  // unauthenticated API calls unnecessarily.
  useEffect(() => {
    if (!window.location.pathname.startsWith('/portal')) {
      setIsLoading(false);
      return;
    }

    Promise.all([
      apiCall<User[]>('/api/users'),
      apiCall<Contractor[]>('/api/contractors'),
      apiCall<Deal[]>('/api/deals'),
      apiCall<Appointment[]>('/api/appointments'),
      apiCall<Commission[]>('/api/commissions'),
      apiCall<Activity[]>('/api/activities'),
    ]).then(([users, contractors, rawDeals, appointments, commissions, activities]) => {
      const deals = (rawDeals ?? []).map(normalizeDeal);

      setState({
        users: users ?? [],
        contractors: contractors ?? [],
        deals,
        appointments: (appointments ?? []).map((a) => normalizeAppointment(a, deals)),
        commissions: syncCommissionsWithDeals(commissions ?? [], deals),
        activities: activities ?? [],
        dispatches: [],
        proposals: [],
      });
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        .filter((deal) => openDealStatuses.includes(deal.status))
        .reduce((total, deal) => total + deal.estimatedJobValue, 0);

    const calculatePipelineValueForUser = (user: User) =>
      getVisibleDealsForUser(user)
        .filter((deal) => openDealStatuses.includes(deal.status))
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

          return deal?.status === 'won' && commission.payoutStatus !== 'paid';
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

          return deal?.status === 'won' && commission.payoutStatus !== 'paid';
        })
        .reduce((total, commission) => total + commission.adminNetCommission, 0);

    const calculateAdminProjectedCommission = () =>
      state.commissions
        .filter((commission) => {
          const deal = state.deals.find(
            (candidate) => candidate.id === commission.dealId
          );

          return Boolean(
            deal && projectedCommissionStatuses.includes(deal.status)
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

    const calculateWonDeals = (repId: string) =>
      getDealsForRep(repId).filter((deal) => deal.status === 'won').length;

    const calculateClosedVolume = (repId: string) =>
      getDealsForRep(repId)
        .filter((deal) => deal.status === 'won')
        .reduce((total, deal) => total + deal.estimatedJobValue, 0);

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

      // ── User mutations ──────────────────────────────────────────────────────

      addUser: (user, actor) => {
        const tempId = createId('user');
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
        apiCall<User>('/api/users', {
          method: 'POST',
          body: JSON.stringify({ ...user, role: 'rep' }),
        }).then((saved) => {
          if (!saved) return;
          setState((current) => ({
            ...current,
            users: current.users.map((u) => (u.id === tempId ? saved : u)),
          }));
        });
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

        apiCall('/api/activities', {
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
          commissions: [...current.commissions, createCommissionForDeal(deal)],
          appointments: current.appointments,
          contractors: current.contractors,
          deals: [...current.deals, deal],
          dispatches: current.dispatches,
          proposals: current.proposals,
          users: current.users,
        }));

        apiCall<Deal>('/api/deals', {
          method: 'POST',
          body: JSON.stringify({ ...dealDraft, assignedRepId: repId }),
        }).then((saved) => {
          if (!saved) return;
          setState((current) => ({
            ...current,
            deals: current.deals.map((d) => (d.id === tempId ? normalizeDeal(saved) : d)),
            commissions: current.commissions.map((c) =>
              c.dealId === tempId ? { ...c, dealId: saved.id } : c
            ),
          }));
        });
      },

      updateDeal: (dealId, updates, actor) => {
        setState((current) => {
          const previousDeal = current.deals.find((d) => d.id === dealId);
          const deals = current.deals.map((d) =>
            d.id === dealId
              ? { ...d, ...updates, id: d.id, updatedAt: new Date().toISOString() }
              : d
          );
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
            commissions: current.commissions.map((commission) => {
              const deal = deals.find((d) => d.id === commission.dealId);
              return deal ? normalizeCommissionWithDeal(commission, deal) : commission;
            }),
            deals,
          };
        });

        apiCall(`/api/deals/${dealId}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        });
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
        setState((current) => {
          const contractor = current.contractors.find(
            (c) => c.id === proposal.contractorId
          );
          const deal = current.deals.find((d) => d.id === proposal.dealId);
          const proposalHistory = {
            ...proposal,
            id: createId('proposal'),
            sentAt: new Date().toISOString(),
          };

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
        // proposals are currently memory-only; add API endpoint in follow-up PR
      },

      addContractorDispatch: (dispatch, actor) => {
        setState((current) => {
          const contractor = current.contractors.find(
            (c) => c.id === dispatch.contractorId
          );
          const deal = current.deals.find((d) => d.id === dispatch.dealId);
          const now = new Date().toISOString();
          const contractorDispatch: ContractorDispatch = {
            ...dispatch,
            id: createId('dispatch'),
            sentAt:
              dispatch.status === 'sent' && !dispatch.sentAt ? now : dispatch.sentAt,
            createdAt: now,
            updatedAt: now,
          };
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
        // dispatches are currently memory-only; add API endpoint in follow-up PR
      },

      updateContractorDispatch: (dispatchId, updates, actor) => {
        setState((current) => {
          const existingDispatch = current.dispatches.find(
            (d) => d.id === dispatchId
          );
          if (!existingDispatch) return current;

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
      },

      assignDispatchContractor: (dispatchId, actor) => {
        setState((current) => {
          const dispatch = current.dispatches.find(
            (d) => d.id === dispatchId
          );
          if (!dispatch) return current;

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
                deal && ['new_lead', 'contacted', 'appointment_booked'].includes(deal.status)
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
                activity: activity
                  ? [activity, ...(candidate.activity ?? [])]
                  : candidate.activity,
                updatedAt:
                  linkedDealStatusUpdate ||
                  linkedDealEstimatedValue !== null ||
                  linkedDealFinancingRequired !== null ||
                  linkedDealFollowUpDate !== null ||
                  linkedDealContractorId !== undefined ||
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

      createDealFromAppointment: (appointmentId, actor) => {
        setState((current) => {
          const appointment = current.appointments.find(
            (a) => a.id === appointmentId
          );
          if (!appointment || appointment.dealId) return current;

          const now = new Date().toISOString();
          const deal: Deal = {
            activity: [],
            assignedContractorId:
              appointment.recommendedContractorId ?? appointment.contractorId,
            assignedRepId: appointment.assignedRepId,
            city: appointment.city,
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
            projectType: appointment.projectType || 'Consultation',
            status: 'appointment_booked',
            updatedAt: now,
          };

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
              createCommissionForDeal(deal),
            ],
            deals: [...current.deals, deal],
          };
        });

        // TODO: persist createDealFromAppointment via API in follow-up PR
      },

      importGoogleCalendarEvents: async (actor, providedEvents) => {
        const events = providedEvents ?? (await fetchGoogleCalendarEvents());
        let result = { imported: 0, updated: 0, unlinked: 0 };

        setState((current) => {
          const now = new Date().toISOString();
          let activities = current.activities;
          const appointments = [...current.appointments];

          events.forEach((event) => {
            const appointment = googleEventToAppointment(
              event,
              actor,
              current.users,
              current.deals
            );
            const existingIndex = appointments.findIndex(
              (a) => a.externalEventId === appointment.externalEventId
            );
            const deal = current.deals.find(
              (d) => d.id === appointment.dealId
            );
            const entityLabel = appointment.dealId
              ? getDealLabel(deal)
              : event.title;

            if (existingIndex >= 0) {
              const prev = appointments[existingIndex];
              appointments[existingIndex] = {
                ...prev,
                ...appointment,
                createdAt: prev.createdAt,
                id: prev.id,
                syncedAt: now,
                updatedAt: now,
              };
              result = { ...result, updated: result.updated + 1 };
              activities = prependActivity(activities, actor, {
                actionLabel: `Google Calendar appointment updated: ${entityLabel}`,
                actionType: 'google_calendar_appointment_updated',
                dealId: appointment.dealId || undefined,
                entityId: prev.id,
                entityLabel,
                entityType: 'appointment',
                metadata: {
                  externalEventId: event.externalEventId,
                  source: 'google_calendar',
                },
              });

              if (prev.dealId !== appointment.dealId) {
                activities = prependActivity(activities, actor, {
                  actionLabel: appointment.dealId
                    ? `Appointment linked to deal: ${entityLabel}`
                    : `Appointment unlinked from deal: ${event.title}`,
                  actionType: appointment.dealId
                    ? 'appointment_linked_to_deal'
                    : 'appointment_unlinked_from_deal',
                  dealId: appointment.dealId || undefined,
                  entityId: prev.id,
                  entityLabel,
                  entityType: 'appointment',
                });
              }
            } else {
              appointments.unshift(appointment);
              result = {
                ...result,
                imported: result.imported + 1,
                unlinked: result.unlinked + (appointment.dealId ? 0 : 1),
              };
              activities = prependActivity(activities, actor, {
                actionLabel: `Google Calendar appointment imported: ${entityLabel}`,
                actionType: 'google_calendar_appointment_imported',
                dealId: appointment.dealId || undefined,
                entityId: appointment.id,
                entityLabel,
                entityType: 'appointment',
                metadata: {
                  externalEventId: event.externalEventId,
                  source: 'google_calendar',
                },
              });
              activities = prependActivity(activities, actor, {
                actionLabel: appointment.dealId
                  ? `Appointment linked to deal: ${entityLabel}`
                  : `Appointment imported as unlinked: ${event.title}`,
                actionType: appointment.dealId
                  ? 'appointment_linked_to_deal'
                  : 'appointment_unlinked_from_deal',
                dealId: appointment.dealId || undefined,
                entityId: appointment.id,
                entityLabel,
                entityType: 'appointment',
              });
            }
          });

          return { ...current, activities, appointments };
        });

        return result;
      },

      // ── Selectors / calculators (pure, no API) ──────────────────────────────
      calculateAdminPaidRepCommission,
      calculateAdminPendingNetCommission,
      calculateAdminPendingRepCommission,
      calculateAdminProjectedCommission,
      calculateClosedVolume,
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
