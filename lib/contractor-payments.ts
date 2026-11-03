// What a contractor account (PJ at Galaxy) is shown about the commission it owes.
//
// PJ knows the rate — 8.5% is his contract — so the TOTAL commission, what he
// has paid and what is left are his to see, and the 45-day remainder is shown
// to him in full and loudly: he is the one paying it.
//
// What he is NOT shown is how that total is divided: the rep's 5% and the
// house's 3.5%. Nothing about the split leaves the server, and this function
// is the only shape his payments feed takes. It builds each row from named
// fields rather than spreading the commission, so a column added to Commission
// later cannot ride along by accident.
//
// Scope is his contractor's own won deals only (the query in
// api/appointments/index.ts). Historical deals are out: they predate the
// portal and their payment terms aren't recorded.

export type ContractorPaymentSource = {
  deal: {
    id: string;
    homeownerName: string;
    projectType: string;
    city: string;
    estimatedJobValue: number;
    parentDealId?: string | null;
  };
  commission: {
    adminTotalCommissionRate: number;
    adminTotalEstimatedCommission: number;
    repEstimatedCommission: number;
    repPaidCommission: number;
    adminNetCommission: number;
    adminNetPaidCommission: number;
    customPayout: boolean;
    balanceClockStartedAt: string;
    balanceClockDays: number;
    balanceSettledAt: string;
  };
};

export type ContractorPayment = {
  dealId: string;
  homeownerName: string;
  projectType: string;
  city: string;
  isChangeOrder: boolean;
  salePrice: number;
  /** Fraction, e.g. 0.085. Null on a one-off custom amount, which has no rate. */
  commissionRate: number | null;
  totalCommission: number;
  paid: number;
  remaining: number;
  balanceClockStartedAt: string;
  balanceClockDays: number;
  balanceSettledAt: string;
};

const cents = (n: number) => Math.round(n * 100) / 100;

/**
 * How much of the total the contractor has paid.
 *
 * Collections are recorded on the house's ledger (adminNetPaidCommission is
 * "collected from the contractor"), and the up-front split is applied to both
 * ledgers in the same proportion, so the collected share of the house's net is
 * the share of the whole commission paid. Falls back to the rep ledger when
 * there is no house net to measure against.
 */
export function contractorPaidShare(c: ContractorPaymentSource['commission']): number {
  const share =
    c.adminNetCommission > 0
      ? c.adminNetPaidCommission / c.adminNetCommission
      : c.repEstimatedCommission > 0
        ? c.repPaidCommission / c.repEstimatedCommission
        : 0;
  if (c.balanceSettledAt) return 1;
  return Math.min(Math.max(Number.isFinite(share) ? share : 0, 0), 1);
}

export function toContractorPayment({ deal, commission }: ContractorPaymentSource): ContractorPayment {
  const total = cents(commission.adminTotalEstimatedCommission);
  const paid = cents(total * contractorPaidShare(commission));
  return {
    dealId: deal.id,
    homeownerName: deal.homeownerName,
    projectType: deal.projectType,
    city: deal.city,
    isChangeOrder: Boolean(deal.parentDealId),
    salePrice: deal.estimatedJobValue,
    commissionRate: commission.customPayout ? null : commission.adminTotalCommissionRate,
    totalCommission: total,
    paid,
    remaining: cents(Math.max(total - paid, 0)),
    balanceClockStartedAt: commission.balanceClockStartedAt,
    balanceClockDays: commission.balanceClockDays,
    balanceSettledAt: commission.balanceSettledAt,
  };
}
