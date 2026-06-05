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
import { users as initialUsers } from './users';
import {
  Commission,
  CommissionPayoutStatus,
  ContractorStatus,
  Contractor,
  Deal,
  DealActivity,
  DealStatus,
  FinancingStatus,
  Activity,
  Appointment,
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

type PortalDataState = {
  activities: Activity[];
  appointments: Appointment[];
  users: User[];
  contractors: Contractor[];
  deals: Deal[];
  commissions: Commission[];
  proposals: ProposalHistory[];
};

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
  addContractor: (contractor: ContractorDraft, actor?: User) => void;
  updateContractor: (
    contractorId: string,
    updates: Partial<Contractor>,
    actor?: User
  ) => void;
  toggleContractorStatus: (contractorId: string) => void;
  addDeal: (deal: DealDraft, repId: string, actor?: User) => void;
  updateDeal: (dealId: string, updates: Partial<Deal>, actor?: User) => void;
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
  addAppointment: (
    appointment: Omit<Appointment, 'createdAt' | 'id' | 'updatedAt'>,
    actor?: User
  ) => void;
  updateAppointment: (
    appointmentId: string,
    updates: Partial<Appointment>,
    actor?: User
  ) => void;
  getActivitiesForUser: (user: User) => Activity[];
  getAppointmentsForDeal: (dealId: string) => Appointment[];
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
  calculateBrokerScore: (repId: string) => number;
  calculatePipelineValue: (repId: string) => number;
  calculatePipelineValueForUser: (user: User) => number;
  calculateOpenDealsForUser: (user: User) => number;
  calculateVisiblePendingCommission: (user: User) => number;
  calculateVisibleBrokerScore: (user: User) => number;
};

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
  proposals: [],
  users: initialUsers,
};

const PortalDataContext = createContext<PortalDataContextValue | undefined>(
  undefined
);

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
  const importedDealIds = new Set(initialDeals.map((deal) => deal.id));
  const currentDeals = deals.map(normalizeDeal);
  const hasOliverImport = currentDeals.some((deal) =>
    importedDealIds.has(deal.id)
  );

  return [
    ...currentDeals.filter((deal) => !demoDealIds.has(deal.id)),
    ...(hasOliverImport ? [] : initialDeals),
  ];
}

function migrateCommissions(commissions: Commission[]) {
  const importedCommissionIds = new Set(
    initialCommissions.map((commission) => commission.id)
  );
  const hasOliverImport = commissions.some((commission) =>
    importedCommissionIds.has(commission.id)
  );

  return [
    ...commissions.filter(
      (commission) => !demoCommissionIds.has(commission.id)
    ),
    ...(hasOliverImport ? [] : initialCommissions),
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

function loadStoredState(): PortalDataState {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return defaultState;

  try {
    const parsed = JSON.parse(stored) as Partial<PortalDataState>;

    return {
      activities: removeDemoDealActivities(
        parsed.activities ?? defaultState.activities
      ),
      appointments: removeDemoDealAppointments(
        parsed.appointments ?? defaultState.appointments
      ),
      commissions: migrateCommissions(
        parsed.commissions ?? defaultState.commissions
      ),
      contractors: parsed.contractors ?? defaultState.contractors,
      deals: migrateDeals(parsed.deals ?? defaultState.deals),
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

function normalizeCommissionWithDeal(commission: Commission, deal: Deal) {
  const synced = syncCommissionWithDeal(commission, deal);

  return {
    ...synced,
    repPaidCommission: Math.min(
      Math.max(synced.repPaidCommission, 0),
      synced.repEstimatedCommission
    ),
  };
}

export function PortalDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PortalDataState>(loadStoredState);

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

    const calculateBrokerScore = (repId: string) => {
      const repDeals = getDealsForRep(repId);
      const openDeals = repDeals.filter((deal) =>
        openDealStatuses.includes(deal.status)
      );
      const wonDeals = repDeals.filter((deal) => deal.status === 'won');
      const pipelineScore = Math.min(calculatePipelineValue(repId) / 2500, 48);
      const activityScore = Math.min(openDeals.length * 12, 24);
      const winScore = Math.min(wonDeals.length * 10, 20);
      const followUpScore = repDeals.some((deal) => deal.nextFollowUpDate)
        ? 8
        : 0;

      return Math.round(
        pipelineScore + activityScore + winScore + followUpScore
      );
    };

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

    const calculateVisibleBrokerScore = (user: User) => {
      if (user.role === 'rep') return calculateBrokerScore(user.id);

      const repIds = Array.from(
        new Set(state.deals.map((deal) => deal.assignedRepId))
      );
      if (repIds.length === 0) return 0;

      return Math.round(
        repIds.reduce((total, repId) => total + calculateBrokerScore(repId), 0) /
          repIds.length
      );
    };

    return {
      ...state,
      addUser: (user, actor) => {
        setState((current) => {
          const newUser: User = {
            ...user,
            id: createId('user'),
            passwordHash:
              user.passwordHash ?? createPrototypePasswordHash('temporary123'),
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
      updateCommission: (commissionId, updates, actor) => {
        setState((current) => {
          const existingCommission = current.commissions.find(
            (commission) => commission.id === commissionId
          );
          const relatedDeal = current.deals.find(
            (deal) => deal.id === existingCommission?.dealId
          );

          return {
            ...current,
            activities:
              existingCommission && relatedDeal
                ? prependActivity(current.activities, actor, {
                    actionLabel: `Commission payout updated for ${getDealLabel(
                      relatedDeal
                    )}`,
                    actionType: 'commission_updated',
                    dealId: relatedDeal.id,
                    entityId: existingCommission.id,
                    entityLabel: getDealLabel(relatedDeal),
                    entityType: 'commission',
                    metadata: {
                      payoutStatus:
                        updates.payoutStatus ??
                        existingCommission.payoutStatus,
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
            const repPaidCommission = Math.min(
              Math.max(
                updates.repPaidCommission ?? commission.repPaidCommission,
                0
              ),
              repEstimatedCommission
            );
            const payoutStatus =
              updates.payoutStatus ??
              (repPaidCommission <= 0
                ? 'pending'
                : repPaidCommission >= repEstimatedCommission
                  ? 'paid'
                  : 'partial');

            return {
              ...commission,
              adminNetCommission:
                adminTotalEstimatedCommission - repEstimatedCommission,
              adminTotalCommissionRate,
              adminTotalEstimatedCommission,
              payoutStatus: payoutStatus as CommissionPayoutStatus,
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
            updatedAt: now,
          };
          const deal = current.deals.find(
            (candidate) => candidate.id === appointment.dealId
          );

          return {
            ...current,
            activities: prependActivity(current.activities, actor, {
              actionLabel: `Appointment created for ${getDealLabel(deal)}`,
              actionType: 'appointment_created',
              dealId: appointment.dealId,
              entityId: appointment.id,
              entityLabel: getDealLabel(deal),
              entityType: 'appointment',
              metadata: {
                appointmentDate: appointment.appointmentDate,
                appointmentTime: appointment.appointmentTime,
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
          let actionType = 'appointment_edited';
          let actionLabel = `Appointment edited for ${getDealLabel(deal)}`;

          if (
            previousAppointment &&
            nextAppointment &&
            (previousAppointment.appointmentDate !==
              nextAppointment.appointmentDate ||
              previousAppointment.appointmentTime !==
                nextAppointment.appointmentTime)
          ) {
            actionType = 'appointment_rescheduled';
            actionLabel = `Appointment rescheduled for ${getDealLabel(deal)}`;
          }

          if (
            previousAppointment &&
            nextAppointment &&
            previousAppointment.status !== nextAppointment.status
          ) {
            if (nextAppointment.status === 'completed') {
              actionType = 'appointment_completed';
              actionLabel = `Appointment marked completed for ${getDealLabel(
                deal
              )}`;
            } else if (nextAppointment.status === 'cancelled') {
              actionType = 'appointment_cancelled';
              actionLabel = `Appointment cancelled for ${getDealLabel(deal)}`;
            } else if (nextAppointment.status === 'no_show') {
              actionType = 'appointment_no_show';
              actionLabel = `Appointment marked no-show for ${getDealLabel(
                deal
              )}`;
            } else if (nextAppointment.status === 'rescheduled') {
              actionType = 'appointment_rescheduled';
              actionLabel = `Appointment rescheduled for ${getDealLabel(deal)}`;
            }
          }

          return {
            ...current,
            activities:
              previousAppointment && nextAppointment
                ? prependActivity(current.activities, actor, {
                    actionLabel,
                    actionType,
                    dealId: nextAppointment.dealId,
                    entityId: nextAppointment.id,
                    entityLabel: getDealLabel(deal),
                    entityType: 'appointment',
                    metadata: {
                      appointmentDate: nextAppointment.appointmentDate,
                      appointmentTime: nextAppointment.appointmentTime,
                      status: nextAppointment.status,
                    },
                  })
                : current.activities,
            appointments: current.appointments.map((appointment) =>
              appointment.id === appointmentId && nextAppointment
                ? nextAppointment
                : appointment
            ),
          };
        });
      },
      calculateAdminPaidRepCommission,
      calculateAdminPendingNetCommission,
      calculateAdminPendingRepCommission,
      calculateAdminProjectedCommission,
      calculateBrokerScore,
      calculateOpenDealsForUser,
      calculatePipelineValue,
      calculatePipelineValueForUser,
      calculateRepPaidCommission,
      calculateRepPendingCommission,
      calculateRepProjectedCommission,
      calculateVisibleBrokerScore,
      calculateVisiblePendingCommission,
      getActivitiesForUser,
      getAppointmentsForDeal,
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
