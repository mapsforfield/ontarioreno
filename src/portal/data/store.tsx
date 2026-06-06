import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { commissions as initialCommissions } from './commissions';
import { contractors as initialContractors } from './contractors';
import { deals as initialDeals } from './deals';
import {
  fetchGoogleCalendarEvents,
  GoogleCalendarEvent,
} from './googleCalendar';
import { users as initialUsers } from './users';
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
  addUser: (user: Omit<User, 'id' | 'role'>, actor?: User) => void;
  updateUser: (
    userId: string,
    updates: Partial<Omit<User, 'id' | 'role'>>,
    actor?: User
  ) => void;
  toggleUserActive: (userId: string, actor?: User) => void;
  authenticateUser: (email: string, password: string) => User | null;
  changeUserPassword: (
    userId: string,
    currentPassword: string,
    newPassword: string,
    actor?: User
  ) => { ok: boolean; message?: string };
  resetUserPassword: (
    userId: string,
    temporaryPassword: string,
    actor?: User
  ) => { ok: boolean; message?: string };
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

// localStorage persistence key. The "v1" suffix is a schema version. If the
// shape of PortalDataState ever changes in a breaking way, bump to "v2" and add
// a migration in loadStoredState() — never mutate v1 data in place, as that
// would silently corrupt existing sessions on older clients.
const STORAGE_KEY = 'ontarioreno.portal.data.v1';
const openDealStatuses: DealStatus[] = [
  'new_lead',
  'contacted',
  'appointment_booked',
  'quoted',
  'negotiating',
];
const projectedCommissionStatuses: DealStatus[] = [...openDealStatuses, 'won'];

const defaultState: PortalDataState = {
  activities: [],
  appointments: [],
  commissions: initialCommissions,
  contractors: initialContractors,
  deals: initialDeals,
  dispatches: [],
  proposals: [],
  users: initialUsers,
};

const PortalDataContext = createContext<PortalDataContextValue | undefined>(
  undefined
);

// Legacy demo-data IDs from an earlier version of the seed. These records no
// longer exist in the current seed files (deals.ts / commissions.ts), but the
// migration filters still remove them on load to clean up any stale localStorage
// sessions that were created with the old seed. IDs are generated with createId()
// (timestamp + random), so collision with these hardcoded strings is impossible.
const demoDealIds = new Set(['deal-001', 'deal-002', 'deal-003', 'deal-004']);
const demoCommissionIds = new Set([
  'commission-001',
  'commission-002',
  'commission-003',
  'commission-004',
]);

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

// INTERNAL PROTOTYPE WARNING:
// These local password hashes and temporary passwords exist only for the
// localStorage prototype. Replace this entire auth mechanism before production.
const prototypePasswordHashes: Record<string, string> = {
  oliver: 'local-prototype:b250YXJpb3Jlbm86b2xpdmVyMTIz',
  sabah: 'local-prototype:b250YXJpb3Jlbm86YWRtaW4xMjM=',
  xavier: 'local-prototype:b250YXJpb3Jlbm86eGF2aWVyMTIz',
};

const prototypeLoginEmails: Record<string, string> = {
  oliver: 'david.galaxykitchenrenovation@gmail.com',
  sabah: 'sabahohs@gmail.com',
  xavier: 'kb.live13@gmail.com',
};

function createPrototypePasswordHash(password: string) {
  return `local-prototype:${window.btoa(`ontarioreno:${password}`)}`;
}

export function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from(
    { length: 12 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

function normalizeUser(user: User): User {
  let normalizedUser = user;

  if (normalizedUser.active === undefined) {
    normalizedUser = {
      ...normalizedUser,
      active: true,
    };
  }

  if (user.id === 'sabah') {
    normalizedUser = {
      ...normalizedUser,
      email: 'sabahohs@gmail.com',
    };
  }

  if (normalizedUser.id === 'oliver' && !normalizedUser.avatarUrl) {
    normalizedUser = {
      ...normalizedUser,
      avatarUrl: '/images/oliverpp.png',
    };
  }

  if (normalizedUser.id === 'oliver') {
    normalizedUser = {
      ...normalizedUser,
      email: 'David.galaxykitchenrenovation@gmail.com',
    };
  }

  if (normalizedUser.id === 'xavier' && !normalizedUser.avatarUrl) {
    normalizedUser = {
      ...normalizedUser,
      avatarUrl: '/images/kevenpp.png',
    };
  }

  if (normalizedUser.id === 'xavier') {
    normalizedUser = {
      ...normalizedUser,
      email: 'kb.live13@gmail.com',
    };
  }

  if (!normalizedUser.passwordHash && prototypePasswordHashes[normalizedUser.id]) {
    normalizedUser = {
      ...normalizedUser,
      passwordHash: prototypePasswordHashes[normalizedUser.id],
    };
  }

  return normalizedUser;
}

function getUserLoginEmail(user: User) {
  return (prototypeLoginEmails[user.id] ?? user.email).trim().toLowerCase();
}

function getUserPasswordHash(user: User) {
  return user.passwordHash ?? prototypePasswordHashes[user.id];
}

function normalizeUsers(users: User[]): User[] {
  const usersById = new Map(
    users.map((user) => {
      const normalizedUser = normalizeUser(user);
      return [normalizedUser.id, normalizedUser] as const;
    })
  );

  initialUsers.map(normalizeUser).forEach((user) => {
    if (!usersById.has(user.id)) {
      usersById.set(user.id, user);
    }
  });

  return Array.from(usersById.values());
}

function migrateDeals(deals: Deal[]) {
  const currentDeals = deals.map(normalizeDeal);
  const currentNonDemoDeals = currentDeals.filter(
    (deal) => !demoDealIds.has(deal.id)
  );
  const hasOliverImport = currentNonDemoDeals.some((deal) =>
    deal.id.startsWith('oliver-sold-')
  );
  const hasXavierImport = currentNonDemoDeals.some((deal) =>
    deal.id.startsWith('xavier-sold-')
  );
  const missingSeedDeals = initialDeals.filter(
    (deal) =>
      (deal.id.startsWith('oliver-sold-') && !hasOliverImport) ||
      (deal.id.startsWith('xavier-sold-') && !hasXavierImport)
  );

  return [...currentNonDemoDeals, ...missingSeedDeals];
}

function migrateCommissions(commissions: Commission[]) {
  const currentCommissionIds = new Set(
    commissions.map((commission) => commission.id)
  );
  const missingSeedCommissions = initialCommissions.filter(
    (commission) => !currentCommissionIds.has(commission.id)
  );

  return [
    ...commissions.filter(
      (commission) => !demoCommissionIds.has(commission.id)
    ),
    ...missingSeedCommissions,
  ];
}

function removeDemoDealActivities(activities: Activity[]) {
  return activities.filter(
    (activity) => !activity.dealId || !demoDealIds.has(activity.dealId)
  );
}

function removeDemoDealAppointments(appointments: Appointment[]) {
  return appointments.filter(
    (appointment) => !demoDealIds.has(appointment.dealId)
  );
}

function removeDemoDealProposals(proposals: ProposalHistory[]) {
  return proposals.filter((proposal) => !demoDealIds.has(proposal.dealId));
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

function loadStoredState(): PortalDataState {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return defaultState;

  try {
    const parsed = JSON.parse(stored) as Partial<PortalDataState>;
    const deals = migrateDeals(parsed.deals ?? defaultState.deals);

    return {
      activities: removeDemoDealActivities(
        parsed.activities ?? defaultState.activities
      ),
      appointments: removeDemoDealAppointments(
        parsed.appointments ?? defaultState.appointments
      ).map((appointment) => normalizeAppointment(appointment, deals)),
      commissions: syncCommissionsWithDeals(
        migrateCommissions(parsed.commissions ?? defaultState.commissions),
        deals
      ),
      contractors: parsed.contractors ?? defaultState.contractors,
      deals,
      dispatches: parsed.dispatches ?? defaultState.dispatches,
      proposals: removeDemoDealProposals(
        parsed.proposals ?? defaultState.proposals
      ),
      users: normalizeUsers(parsed.users ?? defaultState.users),
    };
  } catch {
    return defaultState;
  }
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
  const syncedCommissions = commissions
    .map((commission) => {
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

export function PortalDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PortalDataState>(loadStoredState);

  useEffect(() => {
    setState((current) => {
      const syncedCommissions = syncCommissionsWithDeals(
        current.commissions,
        current.deals
      );

      if (
        JSON.stringify(syncedCommissions) ===
        JSON.stringify(current.commissions)
      ) {
        return current;
      }

      return {
        ...current,
        commissions: syncedCommissions,
      };
    });
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

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
      addUser: (user, actor) => {
        setState((current) => {
          const newUser: User = {
            ...user,
            id: createId('user'),
            passwordHash:
              user.passwordHash ??
              createPrototypePasswordHash(generateTemporaryPassword()),
            role: 'rep',
          };

          return {
            ...current,
            activities: prependActivity(current.activities, actor, {
              actionLabel: `Rep added: ${newUser.name}`,
              actionType: 'rep_added',
              entityId: newUser.id,
              entityLabel: newUser.name,
              entityType: 'rep',
            }),
            users: [...current.users, newUser],
          };
        });
      },
      updateUser: (userId, updates, actor) => {
        setState((current) => {
          const existingUser = current.users.find((user) => user.id === userId);
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
                    metadata: {
                      active: updatedUser.active,
                    },
                  })
                : current.activities,
            users: current.users.map((user) =>
              user.id === userId
                ? { ...user, ...updates, id: user.id, role: user.role }
                : user
            ),
          };
        });
      },
      toggleUserActive: (userId, actor) => {
        setState((current) => {
          const existingUser = current.users.find((user) => user.id === userId);
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
            users: current.users.map((user) =>
              user.id === userId ? { ...user, active: !user.active } : user
            ),
          };
        });
      },
      authenticateUser: (email, password) => {
        const normalizedEmail = email.trim().toLowerCase();
        const passwordHash = createPrototypePasswordHash(password);

        return (
          state.users
            .map(normalizeUser)
            .find(
              (user) =>
                user.active &&
                getUserLoginEmail(user) === normalizedEmail &&
                getUserPasswordHash(user) === passwordHash
            ) ?? null
        );
      },
      changeUserPassword: (userId, currentPassword, newPassword, actor) => {
        const user = state.users
          .map(normalizeUser)
          .find((candidate) => candidate.id === userId);
        if (!user) return { ok: false, message: 'User not found.' };
        if (newPassword.length < 8) {
          return {
            ok: false,
            message: 'New password must be at least 8 characters.',
          };
        }
        if (
          getUserPasswordHash(user) !== createPrototypePasswordHash(currentPassword)
        ) {
          return { ok: false, message: 'Current password is incorrect.' };
        }

        setState((current) => ({
          ...current,
          activities: prependActivity(current.activities, actor, {
            actionLabel: `Password changed for ${user.name}`,
            actionType: 'user_password_changed',
            entityId: user.id,
            entityLabel: user.name,
            entityType: 'rep',
          }),
          users: current.users.map((candidate) =>
            candidate.id === userId
              ? {
                  ...candidate,
                  passwordHash: createPrototypePasswordHash(newPassword),
                }
              : candidate
          ),
        }));

        return { ok: true };
      },
      resetUserPassword: (userId, temporaryPassword, actor) => {
        const user = state.users.find((candidate) => candidate.id === userId);
        if (!user) return { ok: false, message: 'User not found.' };
        if (temporaryPassword.length < 8) {
          return {
            ok: false,
            message: 'Temporary password must be at least 8 characters.',
          };
        }

        setState((current) => ({
          ...current,
          activities: prependActivity(current.activities, actor, {
            actionLabel: `Password reset for ${user.name}`,
            actionType: 'user_password_reset',
            entityId: user.id,
            entityLabel: user.name,
            entityType: 'rep',
          }),
          users: current.users.map((candidate) =>
            candidate.id === userId
              ? {
                  ...candidate,
                  passwordHash: createPrototypePasswordHash(temporaryPassword),
                }
              : candidate
          ),
        }));

        return { ok: true };
      },
      logActivity: (activity, actor) => {
        setState((current) => ({
          ...current,
          activities: prependActivity(current.activities, actor, activity),
        }));
      },
      addContractor: (contractor: ContractorDraft, actor) => {
        setState((current) => {
          const newContractor: Contractor = {
            ...contractor,
            id: createId('contractor'),
          };

          return {
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
          };
        });
      },
      updateContractor: (
        contractorId: string,
        updates: Partial<Contractor>,
        actor?: User
      ) => {
        setState((current) => {
          const existingContractor = current.contractors.find(
            (contractor) => contractor.id === contractorId
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
            contractors: current.contractors.map((contractor) =>
              contractor.id === contractorId
                ? { ...contractor, ...updates, id: contractor.id }
                : contractor
            ),
          };
        });
      },
      deleteContractor: (contractorId, actor) => {
        setState((current) => {
          const contractor = current.contractors.find(
            (candidate) => candidate.id === contractorId
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
              (candidate) => candidate.id !== contractorId
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
      },
      toggleContractorStatus: (contractorId: string) => {
        setState((current) => ({
          ...current,
          contractors: current.contractors.map((contractor) =>
            contractor.id === contractorId
              ? {
                  ...contractor,
                  contractorStatus:
                    contractor.contractorStatus === 'active'
                      ? 'inactive'
                      : 'active',
                }
              : contractor
          ),
        }));
      },
      addDeal: (dealDraft: DealDraft, repId: string, actor) => {
        setState((current) => {
          const now = new Date().toISOString();
          const deal: Deal = {
            ...dealDraft,
            assignedContractorId: null,
            assignedRepId: repId,
            activity: [],
            createdAt: now,
            id: createId('deal'),
            status: 'new_lead',
            updatedAt: now,
          };

          return {
            activities: prependActivity(current.activities, actor, {
              actionLabel: `Deal created: ${getDealLabel(deal)}`,
              actionType: 'deal_created',
              dealId: deal.id,
              entityId: deal.id,
              entityLabel: getDealLabel(deal),
              entityType: 'deal',
            }),
            commissions: [
              ...current.commissions,
              createCommissionForDeal(deal),
            ],
            appointments: current.appointments,
            contractors: current.contractors,
            deals: [...current.deals, deal],
            dispatches: current.dispatches,
            proposals: current.proposals,
            users: current.users,
          };
        });
      },
      updateDeal: (dealId: string, updates: Partial<Deal>, actor) => {
        setState((current) => {
          const previousDeal = current.deals.find((deal) => deal.id === dealId);
          const deals = current.deals.map((deal) =>
            deal.id === dealId
              ? { ...deal, ...updates, id: deal.id, updatedAt: new Date().toISOString() }
              : deal
          );
          const nextDeal = deals.find((deal) => deal.id === dealId);
          let activities = current.activities;

          if (previousDeal && nextDeal) {
            if (updates.status && previousDeal.status !== nextDeal.status) {
              activities = prependActivity(activities, actor, {
                actionLabel: `Status changed to ${nextDeal.status
                  .split('_')
                  .join(' ')}`,
                actionType: 'deal_status_changed',
                dealId: nextDeal.id,
                entityId: nextDeal.id,
                entityLabel: getDealLabel(nextDeal),
                entityType: 'deal',
                metadata: {
                  from: previousDeal.status,
                  to: nextDeal.status,
                },
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
                metadata: {
                  nextFollowUpDate: nextDeal.nextFollowUpDate || null,
                },
              });
            }

            if (
              updates.financingRequired !== undefined &&
              previousDeal.financingRequired !== nextDeal.financingRequired
            ) {
              activities = prependActivity(activities, actor, {
                actionLabel: `Financing requirement changed for ${getDealLabel(
                  nextDeal
                )}`,
                actionType: 'deal_financing_changed',
                dealId: nextDeal.id,
                entityId: nextDeal.id,
                entityLabel: getDealLabel(nextDeal),
                entityType: 'deal',
                metadata: {
                  financingRequired: nextDeal.financingRequired,
                },
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
              const deal = deals.find((candidate) => candidate.id === commission.dealId);
              return deal ? normalizeCommissionWithDeal(commission, deal) : commission;
            }),
            deals,
          };
        });
      },
      deleteDeal: (dealId, actor) => {
        setState((current) => {
          const deal = current.deals.find((candidate) => candidate.id === dealId);

          return {
            ...current,
            activities: deal
              ? prependActivity(
                  current.activities.filter(
                    (activity) => activity.dealId !== dealId
                  ),
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
              (appointment) => appointment.dealId !== dealId
            ),
            commissions: current.commissions.filter(
              (commission) => commission.dealId !== dealId
            ),
            deals: current.deals.filter((candidate) => candidate.id !== dealId),
            dispatches: current.dispatches.filter(
              (dispatch) => dispatch.dealId !== dealId
            ),
            proposals: current.proposals.filter(
              (proposal) => proposal.dealId !== dealId
            ),
          };
        });
      },
      assignContractorToDeal: (
        dealId: string,
        contractorId: string | null,
        actor?: User
      ) => {
        setState((current) => {
          const deal = current.deals.find((candidate) => candidate.id === dealId);
          const contractor = current.contractors.find(
            (candidate) => candidate.id === contractorId
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
            deals: current.deals.map((candidateDeal) =>
              candidateDeal.id === dealId
                ? {
                    ...candidateDeal,
                    assignedContractorId: contractorId,
                    updatedAt: new Date().toISOString(),
                  }
                : candidateDeal
            ),
          };
        });
      },
      addDealActivity: (dealId: string, note: string, actor) => {
        const trimmedNote = note.trim();
        if (!trimmedNote) return;

        setState((current) => {
          const targetDeal = current.deals.find((deal) => deal.id === dealId);

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
      },
      addProposalHistory: (proposal, actor) => {
        setState((current) => {
          const contractor = current.contractors.find(
            (candidate) => candidate.id === proposal.contractorId
          );
          const deal = current.deals.find(
            (candidate) => candidate.id === proposal.dealId
          );
          const proposalHistory = {
            ...proposal,
            id: createId('proposal'),
            sentAt: new Date().toISOString(),
          };

          return {
            ...current,
            activities: prependActivity(current.activities, actor, {
              actionLabel: `Proposal sent to ${
                contractor?.companyName ?? 'contractor'
              }`,
              actionType: 'proposal_sent',
              contractorId: contractor?.id,
              dealId: deal?.id,
              entityId: proposalHistory.id,
              entityLabel: proposal.proposalSubject,
              entityType: 'proposal',
              metadata: {
                contractorName: contractor?.companyName ?? null,
              },
            }),
            proposals: [proposalHistory, ...current.proposals],
          };
        });
      },
      addContractorDispatch: (dispatch, actor) => {
        setState((current) => {
          const contractor = current.contractors.find(
            (candidate) => candidate.id === dispatch.contractorId
          );
          const deal = current.deals.find(
            (candidate) => candidate.id === dispatch.dealId
          );
          const now = new Date().toISOString();
          const contractorDispatch: ContractorDispatch = {
            ...dispatch,
            id: createId('dispatch'),
            sentAt:
              dispatch.status === 'sent' && !dispatch.sentAt
                ? now
                : dispatch.sentAt,
            createdAt: now,
            updatedAt: now,
          };
          const contractorName = contractor?.companyName ?? 'contractor';
          const note = `Opportunity dispatched to ${contractorName}`;

          return {
            ...current,
            activities: prependActivity(current.activities, actor, {
              actionLabel: `${note}${
                actor?.name ? ` by ${actor.name}` : ''
              }`,
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
      },
      updateContractorDispatch: (dispatchId, updates, actor) => {
        setState((current) => {
          const existingDispatch = current.dispatches.find(
            (dispatch) => dispatch.id === dispatchId
          );
          if (!existingDispatch) return current;

          const contractor = current.contractors.find(
            (candidate) => candidate.id === existingDispatch.contractorId
          );
          const deal = current.deals.find(
            (candidate) => candidate.id === existingDispatch.dealId
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
            updates.contractorResponseNote !==
              existingDispatch.contractorResponseNote;
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
            dispatches: current.dispatches.map((dispatch) =>
              dispatch.id === dispatchId ? nextDispatch : dispatch
            ),
          };
        });
      },
      assignDispatchContractor: (dispatchId, actor) => {
        setState((current) => {
          const dispatch = current.dispatches.find(
            (candidate) => candidate.id === dispatchId
          );
          if (!dispatch) return current;

          const contractor = current.contractors.find(
            (candidate) => candidate.id === dispatch.contractorId
          );
          const deal = current.deals.find(
            (candidate) => candidate.id === dispatch.dealId
          );
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
              metadata: {
                consultationId: dispatch.consultationId ?? null,
              },
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
              current.deals.map((candidateDeal) =>
                candidateDeal.id === dispatch.dealId
                  ? {
                      ...candidateDeal,
                      assignedContractorId: dispatch.contractorId,
                      updatedAt: new Date().toISOString(),
                    }
                  : candidateDeal
              ),
              dispatch.dealId,
              note
            ),
            dispatches: current.dispatches.map((candidate) =>
              candidate.id === dispatchId
                ? {
                    ...candidate,
                    status:
                      candidate.status === 'accepted'
                        ? candidate.status
                        : 'accepted',
                    updatedAt: new Date().toISOString(),
                  }
                : candidate
            ),
          };
        });
      },
      updateCommission: (commissionId, updates, actor) => {
        setState((current) => {
          const existingCommission = current.commissions.find(
            (commission) => commission.id === commissionId
          );
          const relatedDeal = current.deals.find(
            (deal) => deal.id === existingCommission?.dealId
          );
          const relatedRep = current.users.find(
            (user) => user.id === existingCommission?.repId
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

            if (updates.payoutStatus === 'pending') {
              return 0;
            }

            return Math.min(
              Math.max(requestedPaidAmount, 0),
              repEstimatedCommission
            );
          })();
          const nextPayoutStatus = normalizePayoutStatus(
            nextPaidAmount,
            repEstimatedCommission
          );
          const actionLabel =
            nextPayoutStatus === 'partial'
              ? `${
                  actor?.name ?? 'Admin'
                } recorded partial payout of ${new Intl.NumberFormat('en-CA', {
                  currency: 'CAD',
                  maximumFractionDigits: 0,
                  style: 'currency',
                }).format(nextPaidAmount)} for ${getDealLabel(relatedDeal)}`
              : `${
                  actor?.name ?? 'Admin'
                } updated ${repName}'s payout for ${getDealLabel(
                  relatedDeal
                )} to ${
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
              (candidate) => candidate.id === commission.dealId
            );
            const repEstimatedCommission = deal
              ? Math.round(deal.estimatedJobValue * 0.05)
              : commission.repEstimatedCommission;
            const adminTotalCommissionRate =
              updates.adminTotalCommissionRate ??
              commission.adminTotalCommissionRate;
            const adminTotalEstimatedCommission =
              updates.adminTotalEstimatedCommission ??
              (deal
                ? Math.round(deal.estimatedJobValue * adminTotalCommissionRate)
                : commission.adminTotalEstimatedCommission);
            const requestedPaidAmount =
              updates.repPaidCommission ?? commission.repPaidCommission;
            const repPaidCommission =
              updates.payoutStatus === 'paid'
                ? Math.max(requestedPaidAmount, repEstimatedCommission)
                : updates.payoutStatus === 'pending'
                  ? 0
                  : Math.min(
                      Math.max(requestedPaidAmount, 0),
                      repEstimatedCommission
                    );
            const payoutStatus = normalizePayoutStatus(
              repPaidCommission,
              repEstimatedCommission
            );

            return {
              ...commission,
              adminNetCommission:
                adminTotalEstimatedCommission - repEstimatedCommission,
              adminTotalCommissionRate,
              adminTotalEstimatedCommission,
              payoutStatus,
              repEstimatedCommission,
              repPaidCommission,
            };
          }),
          };
        });
      },
      addAppointment: (appointmentDraft, actor) => {
        setState((current) => {
          const now = new Date().toISOString();
          const appointment: Appointment = {
            ...appointmentDraft,
            createdAt: now,
            id: createId('appointment'),
            source: 'manual',
            updatedAt: now,
          };
          const deal = current.deals.find(
            (candidate) => candidate.id === appointment.dealId
          );
          const contractor = current.contractors.find(
            (candidate) => candidate.id === appointment.contractorId
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
      },
      updateAppointment: (appointmentId, updates, actor) => {
        setState((current) => {
          const previousAppointment = current.appointments.find(
            (appointment) => appointment.id === appointmentId
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
            (candidate) => candidate.id === nextAppointment?.dealId
          );
          const contractor = current.contractors.find(
            (candidate) => candidate.id === nextAppointment?.contractorId
          );
          const rep = current.users.find(
            (candidate) => candidate.id === nextAppointment?.assignedRepId
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
            (previousAppointment.appointmentDate !==
              nextAppointment.appointmentDate ||
              previousAppointment.appointmentTime !==
                nextAppointment.appointmentTime)
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
            previousAppointment.consultationStage !==
              nextAppointment.consultationStage
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
            (previousAppointment.outcomeSubmitted !==
              nextAppointment.outcomeSubmitted ||
              previousAppointment.estimatedProjectValue !==
                nextAppointment.estimatedProjectValue ||
              previousAppointment.financingNeeded !==
                nextAppointment.financingNeeded ||
              previousAppointment.homeownerInterestLevel !==
                nextAppointment.homeownerInterestLevel ||
              previousAppointment.nextStep !== nextAppointment.nextStep ||
              previousAppointment.recommendedContractorId !==
                nextAppointment.recommendedContractorId ||
              previousAppointment.closeProbability !==
                nextAppointment.closeProbability ||
              previousAppointment.outcomeNotes !== nextAppointment.outcomeNotes ||
              previousAppointment.objections !== nextAppointment.objections ||
              previousAppointment.followUpDate !== nextAppointment.followUpDate)
          ) {
            const isFirstSubmission =
              !previousAppointment.outcomeSubmitted &&
              nextAppointment.outcomeSubmitted;
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
            appointments: current.appointments.map((appointment) =>
              appointment.id === appointmentId && nextAppointment
                ? nextAppointment
                : appointment
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
                      note: `Consultation moved to Proposal Sent by ${
                        actor?.name ?? 'System'
                      }`,
                    }
                  : shouldAddOutcomeDealActivity &&
                      candidate.id === nextAppointment.dealId
                    ? {
                        createdAt: new Date().toISOString(),
                        id: createId('deal-activity'),
                        note: `Outcome report applied by ${
                          actor?.name ?? 'System'
                        }`,
                      }
                  : null;

              return {
                ...candidate,
                ...(linkedDealStatusUpdate
                  ? { status: linkedDealStatusUpdate }
                  : {}),
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
      },
      deleteAppointment: (appointmentId, actor) => {
        setState((current) => {
          const appointment = current.appointments.find(
            (candidate) => candidate.id === appointmentId
          );
          const deal = current.deals.find(
            (candidate) => candidate.id === appointment?.dealId
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
              (candidate) => candidate.id !== appointmentId
            ),
          };
        });
      },
      createDealFromAppointment: (appointmentId, actor) => {
        setState((current) => {
          const appointment = current.appointments.find(
            (candidate) => candidate.id === appointmentId
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
            homeownerName: appointment.customerName || appointment.title || 'Consultation lead',
            id: createId('deal'),
            nextFollowUpDate: appointment.followUpDate || appointment.appointmentDate,
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
            appointments: current.appointments.map((candidate) =>
              candidate.id === appointmentId
                ? { ...candidate, dealId: deal.id, updatedAt: now }
                : candidate
            ),
            commissions: [...current.commissions, createCommissionForDeal(deal)],
            deals: [...current.deals, deal],
          };
        });
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
              (candidate) =>
                candidate.externalEventId === appointment.externalEventId
            );
            const deal = current.deals.find(
              (candidate) => candidate.id === appointment.dealId
            );
            const entityLabel = appointment.dealId
              ? getDealLabel(deal)
              : event.title;

            if (existingIndex >= 0) {
              const previousAppointment = appointments[existingIndex];
              appointments[existingIndex] = {
                ...previousAppointment,
                ...appointment,
                createdAt: previousAppointment.createdAt,
                id: previousAppointment.id,
                syncedAt: now,
                updatedAt: now,
              };
              result = { ...result, updated: result.updated + 1 };
              activities = prependActivity(activities, actor, {
                actionLabel: `Google Calendar appointment updated: ${entityLabel}`,
                actionType: 'google_calendar_appointment_updated',
                dealId: appointment.dealId || undefined,
                entityId: previousAppointment.id,
                entityLabel,
                entityType: 'appointment',
                metadata: {
                  externalEventId: event.externalEventId,
                  source: 'google_calendar',
                },
              });

              if (previousAppointment.dealId !== appointment.dealId) {
                activities = prependActivity(activities, actor, {
                  actionLabel: appointment.dealId
                    ? `Appointment linked to deal: ${entityLabel}`
                    : `Appointment unlinked from deal: ${event.title}`,
                  actionType: appointment.dealId
                    ? 'appointment_linked_to_deal'
                    : 'appointment_unlinked_from_deal',
                  dealId: appointment.dealId || undefined,
                  entityId: previousAppointment.id,
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

          return {
            ...current,
            activities,
            appointments,
          };
        });

        return result;
      },
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
  }, [state]);

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
