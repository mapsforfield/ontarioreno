// Change orders, and the check that every won sale has actually been invoiced.
//
// A change order is an add-on sold after the original job: a $678 closet colour
// change on a $78,535 basement. It used to be entered as a second, unlinked deal
// for the same homeowner. Nothing tied it to the job, nothing noticed it had
// never been invoiced, and on the Melo job it wasn't, for over two months.
//
// It stays its own Deal (see Deal.parentDealId in prisma/schema.prisma for why
// it is not folded into the original's value), linked by parentDealId. Two
// rules follow:
//
// 1. A change order is not another job. It must not count as a second won deal
//    on the leaderboard, in close rate, or in the board's won/lost counts. Its
//    VALUE is real sales and still counts in volume and earnings.
// 2. Every won sale must have been invoiced to the contractor, at its current
//    value. invoiceCheck() answers that for one deal, from the invoice ledger.

export type ChangeOrderFields = { parentDealId?: string | null };

export function isChangeOrder(deal: ChangeOrderFields): boolean {
  return Boolean(deal.parentDealId);
}

/** Deals that count as a job in their own right. Use for COUNTS, never sums. */
export function countableJobs<T extends ChangeOrderFields>(deals: T[]): T[] {
  return deals.filter((deal) => !isChangeOrder(deal));
}

/** The change orders hanging off one deal, oldest first. */
export function changeOrdersOf<T extends ChangeOrderFields & { id: string; createdAt?: string }>(
  deals: T[],
  parentId: string
): T[] {
  return deals
    .filter((deal) => deal.parentDealId === parentId)
    .sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? ''));
}

// ─── Linking an existing deal ────────────────────────────────────────────────

type LinkDeal = ChangeOrderFields & { id: string; status: string };

/**
 * Why `childId` may not become a change order of `parentId`, or null if it may.
 * One level only: an add-on to an add-on is an add-on to the original job.
 */
export function linkProblem(
  child: LinkDeal | undefined,
  parent: LinkDeal | undefined,
  hasChildren: boolean
): string | null {
  if (!child || !parent) return 'Deal not found.';
  if (child.id === parent.id) return 'A deal cannot be a change order of itself.';
  if (isChangeOrder(parent)) return 'Pick the original job, not another change order.';
  if (hasChildren) return 'This deal has its own change orders, so it is an original job.';
  return null;
}

// ─── Has it been invoiced? ───────────────────────────────────────────────────

export type InvoiceLedgerRow = {
  dealId: string | null;
  salesPrice: number;
  createdAt: string;
  invoiceNumber?: number | null;
};

export type InvoiceCheckDeal = {
  id: string;
  status: string;
  isHistorical?: boolean;
  estimatedJobValue: number;
  /** Set when an invoice was generated before the ledger kept a copy. */
  invoiceNumber?: number | null;
};

export type InvoiceCheck =
  | { state: 'ok' }
  /** Won, and no invoice to the contractor exists for it. */
  | { state: 'never_invoiced' }
  /** The last invoice was for a different sales price than the deal shows now. */
  | { state: 'mismatch'; invoicedPrice: number; invoiceNumber: number | null }
  /** Not a won, post-portal sale — nothing to invoice. */
  | { state: 'not_applicable' };

/**
 * Has this won deal been invoiced, at the value it shows now?
 *
 * Historical deals are out: they were billed before the portal existed. A
 * deal that carries an invoice number but has no ledger row was invoiced
 * before the ledger kept copies — it counts as invoiced, and with no price to
 * compare it can't be called a mismatch.
 */
export function invoiceCheck(deal: InvoiceCheckDeal, ledger: InvoiceLedgerRow[]): InvoiceCheck {
  if (deal.status !== 'won' || deal.isHistorical) return { state: 'not_applicable' };
  const rows = ledger
    .filter((row) => row.dealId === deal.id)
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
  const latest = rows[rows.length - 1];
  if (!latest) return deal.invoiceNumber ? { state: 'ok' } : { state: 'never_invoiced' };
  if (Math.abs((latest.salesPrice ?? 0) - deal.estimatedJobValue) > 1) {
    return {
      state: 'mismatch',
      invoicedPrice: latest.salesPrice,
      invoiceNumber: latest.invoiceNumber ?? null,
    };
  }
  return { state: 'ok' };
}

// ─── Same homeowner? ─────────────────────────────────────────────────────────

export type HomeownerFields = {
  clientId?: string | null;
  homeownerName: string;
  phone?: string;
  email?: string;
};

const digits = (phone?: string) => (phone ?? '').replace(/\D/g, '').slice(-10);

/**
 * Is this plausibly the same homeowner? Used only to SUGGEST a link, never to
 * make one. The Melo family has two separate jobs under one phone number
 * (Flamborough and the Mississauga basement), so a match is a question for a
 * human, not an answer.
 */
export function sameHomeowner(a: HomeownerFields, b: HomeownerFields): boolean {
  if (a.clientId && b.clientId && a.clientId === b.clientId) return true;
  const pa = digits(a.phone);
  if (pa.length === 10 && pa === digits(b.phone)) return true;
  const ea = (a.email ?? '').trim().toLowerCase();
  if (ea && ea === (b.email ?? '').trim().toLowerCase()) return true;
  const na = a.homeownerName.trim().toLowerCase().replace(/\s+/g, ' ');
  return na.length > 2 && na === b.homeownerName.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** A contractor commission invoice, as opposed to a client invoice sharing the
 *  same ledger (Portal → Invoices), which bills the homeowner, not PJ. */
export function isContractorInvoice(row: { snapshot?: string | null }): boolean {
  if (!row.snapshot) return true; // predates snapshots: commission by definition
  try {
    return (JSON.parse(row.snapshot) as { kind?: string })?.kind !== 'client';
  } catch {
    return true;
  }
}
