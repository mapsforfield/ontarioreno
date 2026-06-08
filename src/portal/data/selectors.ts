// DEAD CODE — do not use. All selector and calculation functions here operate
// on static seed arrays, not live store state. The canonical implementations
// are in store.tsx and are accessed via usePortalData(). This file exists as a
// historical artifact and should be deleted once confirmed unused.
import { commissions } from './commissions';
import { contractors } from './contractors';
import { deals } from './deals';
import { users } from './users';
import { Commission, Contractor, Deal, DealStatus, User } from './types';

const openDealStatuses: DealStatus[] = [
  'new_lead',
  'appointment_booked',
  'quoted',
  'negotiating',
];

export function getUsers(): User[] {
  return users.filter((user) => user.active);
}

export function getReps(): User[] {
  return getUsers().filter((user) => user.role === 'rep');
}

export function getContractors(): Contractor[] {
  return contractors;
}

export function getDeals(): Deal[] {
  return deals;
}

export function getDealsForRep(repId: string): Deal[] {
  return deals.filter((deal) => deal.assignedRepId === repId);
}

export function getVisibleDealsForUser(user: User): Deal[] {
  if (user.role === 'admin') {
    return getDeals();
  }

  return getDealsForRep(user.id);
}

export function getRepCommissions(repId: string): Commission[] {
  return commissions.filter((commission) => commission.repId === repId);
}

export function calculateRepPendingCommission(repId: string): number {
  return getRepCommissions(repId)
    .filter((commission) => commission.payoutStatus !== 'paid')
    .reduce(
      (total, commission) =>
        total +
        Math.max(
          commission.repEstimatedCommission - commission.repPaidCommission,
          0
        ),
      0
    );
}

export function calculateAdminPendingNetCommission(): number {
  return commissions
    .filter((commission) => commission.payoutStatus !== 'paid')
    .reduce((total, commission) => total + commission.adminNetCommission, 0);
}

export function calculatePipelineValue(repId: string): number {
  return getDealsForRep(repId)
    .filter((deal) => openDealStatuses.includes(deal.status))
    .reduce((total, deal) => total + deal.estimatedJobValue, 0);
}

export function calculateWonDeals(repId: string): number {
  return getDealsForRep(repId).filter((deal) => deal.status === 'won').length;
}

export function calculateClosedVolume(repId: string): number {
  return getDealsForRep(repId)
    .filter((deal) => deal.status === 'won')
    .reduce((total, deal) => total + deal.estimatedJobValue, 0);
}

export function calculateOpenDealsForUser(user: User): number {
  return getVisibleDealsForUser(user).filter((deal) =>
    openDealStatuses.includes(deal.status)
  ).length;
}

export function calculateVisiblePendingCommission(user: User): number {
  if (user.role === 'admin') {
    return calculateAdminPendingNetCommission();
  }

  return calculateRepPendingCommission(user.id);
}

export function calculateVisibleWonDeals(user: User): number {
  if (user.role === 'rep') {
    return calculateWonDeals(user.id);
  }

  return getVisibleDealsForUser(user).filter((deal) => deal.status === 'won')
    .length;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-CA', {
    currency: 'CAD',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value);
}

export function formatFinancingStatus(status: Contractor['financingStatus']) {
  const labels: Record<Contractor['financingStatus'], string> = {
    cash_only: 'Cash Only',
    financing_available: 'Financing Available',
    pending_financing: 'Pending Financing',
  };

  return labels[status];
}

export function formatDealStatus(status: DealStatus) {
  const labels: Record<DealStatus, string> = {
    appointment_booked: 'Appointment Booked',
    lost: 'Lost',
    negotiating: 'Negotiating',
    new_lead: 'New Lead',
    quoted: 'Quoted',
    won: 'Won',
  };

  return labels[status];
}
