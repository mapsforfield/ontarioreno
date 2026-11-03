// The commission ledger's derived fields, kept consistent on the server.
//
// A Commission row stores the total rate AND the amounts derived from it
// (total, rep cut, net). The portal used to PATCH only the field that changed,
// so editing the rate from 10% to 8.5% saved the rate and left the total and
// the net at 10% on the server. The portal re-derives on load and hid it; the
// 9am Pay Day push and anything else reading the row did not.
//
// Two defaults also wrote 10% where 8.5% was meant: deal creation stored a
// hard-coded 0.1 as the RATE beside a total computed at the contractor's 8.5%,
// and the portal then recomputed the total from that 0.1. Every new deal read
// 10% in the Commission Center. One constant now, used by every fallback.

/** The total rate charged to a contractor when nothing more specific is known.
 *  Every contractor on file is at 8.5%; a contractor's own rate wins. */
export const DEFAULT_TOTAL_COMMISSION_RATE = 0.085;

/** The rep's share of the job. */
export const REP_COMMISSION_RATE = 0.05;

type LedgerDeal = { estimatedJobValue: number; financeFeePercent?: number | null };

type LedgerRow = {
  adminTotalCommissionRate: number;
  adminTotalEstimatedCommission: number;
  repEstimatedCommission: number;
  repPaidCommission: number;
  adminNetPaidCommission: number;
  customPayout: boolean;
};

export type LedgerUpdate = Partial<LedgerRow> & Record<string, unknown>;

/** Job value less any promotional finance fee. Mirrors commissionableValue in
 *  the portal store. */
export function commissionBase(deal: LedgerDeal): number {
  const fee = Math.max(0, Math.min(Number(deal.financeFeePercent) || 0, 100));
  return Math.round(deal.estimatedJobValue * (1 - fee / 100));
}

/**
 * Merge a partial update into a commission row and return the full set of
 * derived fields to write alongside it.
 *
 * - A standard (non-custom) row derives its rep cut and total from the job
 *   value and rate. A total typed in by hand on this same update is respected.
 * - A custom row keeps its hand-entered rep cut and total.
 * - Net is always total − rep, and each paid amount is clamped to what is owed.
 */
export function reconcileLedger(
  existing: LedgerRow,
  update: LedgerUpdate,
  deal: LedgerDeal
): Pick<
  LedgerRow & { adminNetCommission: number; payoutStatus: string },
  | 'adminTotalCommissionRate'
  | 'adminTotalEstimatedCommission'
  | 'repEstimatedCommission'
  | 'adminNetCommission'
  | 'repPaidCommission'
  | 'adminNetPaidCommission'
  | 'payoutStatus'
> {
  const customPayout = update.customPayout ?? existing.customPayout;
  const rate = numberOr(update.adminTotalCommissionRate, existing.adminTotalCommissionRate);
  const base = commissionBase(deal);

  const repEstimatedCommission = customPayout
    ? Math.round(numberOr(update.repEstimatedCommission, existing.repEstimatedCommission))
    : Math.round(base * REP_COMMISSION_RATE);
  const adminTotalEstimatedCommission = customPayout
    ? Math.round(numberOr(update.adminTotalEstimatedCommission, existing.adminTotalEstimatedCommission))
    : update.adminTotalEstimatedCommission != null
      ? Math.round(Number(update.adminTotalEstimatedCommission))
      : Math.round(base * rate);
  const adminNetCommission = adminTotalEstimatedCommission - repEstimatedCommission;

  const repPaidCommission = clamp(
    numberOr(update.repPaidCommission, existing.repPaidCommission),
    repEstimatedCommission
  );
  const adminNetPaidCommission = clamp(
    numberOr(update.adminNetPaidCommission, existing.adminNetPaidCommission),
    adminNetCommission
  );
  const payoutStatus =
    repPaidCommission <= 0 ? 'pending' : repPaidCommission >= repEstimatedCommission ? 'paid' : 'partial';

  return {
    adminTotalCommissionRate: rate,
    adminTotalEstimatedCommission,
    repEstimatedCommission,
    adminNetCommission,
    repPaidCommission,
    adminNetPaidCommission,
    payoutStatus,
  };
}

function numberOr(value: unknown, fallback: number): number {
  const n = Number(value);
  return value != null && Number.isFinite(n) ? n : fallback;
}

function clamp(paid: number, owed: number): number {
  return Math.min(Math.max(paid, 0), Math.max(owed, 0));
}
