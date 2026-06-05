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
  users: User[];
  contractors: Contractor[];
  deals: Deal[];
  commissions: Commission[];
  proposals: ProposalHistory[];
};

type PortalDataContextValue = PortalDataState & {
  addUser: (user: Omit<User, 'id' | 'role'>) => void;
  updateUser: (userId: string, updates: Partial<Omit<User, 'id' | 'role'>>) => void;
  toggleUserActive: (userId: string) => void;
  addContractor: (contractor: ContractorDraft) => void;
  updateContractor: (contractorId: string, updates: Partial<Contractor>) => void;
  toggleContractorStatus: (contractorId: string) => void;
  addDeal: (deal: DealDraft, repId: string) => void;
  updateDeal: (dealId: string, updates: Partial<Deal>) => void;
  assignContractorToDeal: (dealId: string, contractorId: string | null) => void;
  addDealActivity: (dealId: string, note: string) => void;
  addProposalHistory: (
    proposal: Omit<ProposalHistory, 'id' | 'sentAt'>
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
    >
  ) => void;
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
  commissions: initialCommissions,
  contractors: initialContractors,
  deals: initialDeals,
  proposals: [],
  users: initialUsers,
};

const PortalDataContext = createContext<PortalDataContextValue | undefined>(
  undefined
);

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

function loadStoredState(): PortalDataState {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return defaultState;

  try {
    const parsed = JSON.parse(stored) as Partial<PortalDataState>;

    return {
      commissions: parsed.commissions ?? defaultState.commissions,
      contractors: parsed.contractors ?? defaultState.contractors,
      deals: (parsed.deals ?? defaultState.deals).map(normalizeDeal),
      proposals: parsed.proposals ?? defaultState.proposals,
      users: parsed.users ?? defaultState.users,
    };
  } catch {
    return defaultState;
  }
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
      addUser: (user) => {
        setState((current) => ({
          ...current,
          users: [
            ...current.users,
            {
              ...user,
              id: createId('user'),
              role: 'rep',
            },
          ],
        }));
      },
      updateUser: (userId, updates) => {
        setState((current) => ({
          ...current,
          users: current.users.map((user) =>
            user.id === userId
              ? { ...user, ...updates, id: user.id, role: user.role }
              : user
          ),
        }));
      },
      toggleUserActive: (userId) => {
        setState((current) => ({
          ...current,
          users: current.users.map((user) =>
            user.id === userId ? { ...user, active: !user.active } : user
          ),
        }));
      },
      addContractor: (contractor: ContractorDraft) => {
        setState((current) => ({
          ...current,
          contractors: [
            ...current.contractors,
            { ...contractor, id: createId('contractor') },
          ],
        }));
      },
      updateContractor: (
        contractorId: string,
        updates: Partial<Contractor>
      ) => {
        setState((current) => ({
          ...current,
          contractors: current.contractors.map((contractor) =>
            contractor.id === contractorId
              ? { ...contractor, ...updates, id: contractor.id }
              : contractor
          ),
        }));
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
      addDeal: (dealDraft: DealDraft, repId: string) => {
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
            commissions: [
              ...current.commissions,
              createCommissionForDeal(deal),
            ],
            contractors: current.contractors,
            deals: [...current.deals, deal],
            proposals: current.proposals,
            users: current.users,
          };
        });
      },
      updateDeal: (dealId: string, updates: Partial<Deal>) => {
        setState((current) => {
          const deals = current.deals.map((deal) =>
            deal.id === dealId
              ? { ...deal, ...updates, id: deal.id, updatedAt: new Date().toISOString() }
              : deal
          );

          return {
            ...current,
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
        contractorId: string | null
      ) => {
        setState((current) => ({
          ...current,
          deals: current.deals.map((deal) =>
            deal.id === dealId
              ? {
                  ...deal,
                  assignedContractorId: contractorId,
                  updatedAt: new Date().toISOString(),
                }
              : deal
          ),
        }));
      },
      addDealActivity: (dealId: string, note: string) => {
        const trimmedNote = note.trim();
        if (!trimmedNote) return;

        setState((current) => ({
          ...current,
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
        }));
      },
      addProposalHistory: (proposal) => {
        setState((current) => ({
          ...current,
          proposals: [
            {
              ...proposal,
              id: createId('proposal'),
              sentAt: new Date().toISOString(),
            },
            ...current.proposals,
          ],
        }));
      },
      updateCommission: (commissionId, updates) => {
        setState((current) => ({
          ...current,
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
        }));
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
