// The 45-day balance clock.
//
// Some deals — the Galaxy ones — are paid in two parts: 25% or 50% of the
// commission up front, and the remainder a fixed number of days later. The
// only thing recorded is the day the FIRST payment landed. The due date, the
// days remaining and the urgency are all derived from that, every time they
// are read, so nothing here can go stale between renders or overnight.
//
// The rule lives in one file because three places read it — the Commissions
// table, the deal drawer, and the dashboard's "needs attention" list — and a
// countdown that says 3 days on one screen and 4 on another is a countdown
// nobody trusts. Same reasoning as needsAttention.ts.
//
// Most deals have no clock. A blank `balanceClockStartedAt` means exactly
// that, and every function here returns the inactive state for it.

import type { Commission, Deal } from './types.js';

/** Default term. Stored per-commission so a different deal can differ. */
export const DEFAULT_BALANCE_CLOCK_DAYS = 45;

/** How close to the due date counts as "coming up" rather than just running. */
export const BALANCE_CLOCK_DUE_SOON_DAYS = 7;

export type BalanceClockStatus =
  /** Running, with more than a week to go. */
  | 'running'
  /** Inside the last week. */
  | 'due_soon'
  /** Day 45 has arrived — this is the day the remainder is owed. */
  | 'due'
  /** Day 45 has passed and nothing was recorded as settled. */
  | 'overdue'
  /** The remainder was collected. The countdown stops here. */
  | 'settled';

export type BalanceClock = {
  /** False when this deal has no clock — the normal case. */
  active: boolean;
  /** YYYY-MM-DD the first payment landed. */
  startedOn: string;
  /** YYYY-MM-DD the remainder is due. */
  dueOn: string;
  /** Term used, in days. */
  days: number;
  /** Negative once overdue. Zero on the due date itself. */
  daysRemaining: number;
  status: BalanceClockStatus;
  /** YYYY-MM-DD the remainder was collected, or ''. */
  settledOn: string;
};

const INACTIVE: BalanceClock = {
  active: false,
  startedOn: '',
  dueOn: '',
  days: DEFAULT_BALANCE_CLOCK_DAYS,
  daysRemaining: 0,
  status: 'running',
  settledOn: '',
};

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** Calendar-day arithmetic on a YYYY-MM-DD key, done in UTC so DST can't
 *  shift a date by a day. These are calendar days, never instants. */
export function addDays(dateKey: string, days: number): string {
  if (!DATE_KEY.test(dateKey)) return '';
  const at = new Date(`${dateKey}T00:00:00Z`);
  at.setUTCDate(at.getUTCDate() + days);
  return at.toISOString().slice(0, 10);
}

/** Whole calendar days from `from` to `to`; negative when `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  if (!DATE_KEY.test(from) || !DATE_KEY.test(to)) return 0;
  return Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000
  );
}

/** The fields the rule actually reads — so callers can pass a draft. */
export type BalanceClockFields = Pick<
  Commission,
  'balanceClockStartedAt' | 'balanceClockDays' | 'balanceSettledAt'
>;

/**
 * Resolve a commission's clock as of `today` (Toronto YYYY-MM-DD).
 *
 * A settled clock reports 'settled' whatever the dates say — the remainder is
 * in, so it stops asking. That is the only status that outranks the calendar.
 */
export function balanceClock(
  commission: BalanceClockFields | undefined | null,
  today: string
): BalanceClock {
  const startedOn = commission?.balanceClockStartedAt ?? '';
  if (!DATE_KEY.test(startedOn)) return INACTIVE;

  const days = commission?.balanceClockDays ?? DEFAULT_BALANCE_CLOCK_DAYS;
  const dueOn = addDays(startedOn, days);
  const settledOn = commission?.balanceSettledAt ?? '';
  const daysRemaining = daysBetween(today, dueOn);

  const status: BalanceClockStatus = settledOn
    ? 'settled'
    : daysRemaining < 0
      ? 'overdue'
      : daysRemaining === 0
        ? 'due'
        : daysRemaining <= BALANCE_CLOCK_DUE_SOON_DAYS
          ? 'due_soon'
          : 'running';

  return { active: true, startedOn, dueOn, days, daysRemaining, status, settledOn };
}

/**
 * Does this clock belong on the dashboard's needs-attention list?
 *
 * Only from the due date onward. A clock with three weeks left is information,
 * not a task, and putting it in the same list as an overdue follow-up is how a
 * list stops being read. Same restraint as the tiered chips on the dashboard.
 */
export function balanceClockNeedsAttention(clock: BalanceClock): boolean {
  return clock.active && (clock.status === 'due' || clock.status === 'overdue');
}

/** "Due Oct 11 · 30 days left" — the one-line summary, shared by all readers. */
export function formatBalanceClock(clock: BalanceClock): string {
  if (!clock.active) return '';
  const due = formatDateKey(clock.dueOn);
  switch (clock.status) {
    case 'settled':
      return `Settled ${formatDateKey(clock.settledOn)}`;
    case 'overdue':
      return `Balance overdue — was due ${due} (${Math.abs(clock.daysRemaining)}d ago)`;
    case 'due':
      return `Balance due today (${due})`;
    default:
      return `Balance due ${due} · ${clock.daysRemaining}d left`;
  }
}

/** "Oct 11, 2026" from a YYYY-MM-DD key, without touching local time. */
export function formatDateKey(dateKey: string): string {
  if (!DATE_KEY.test(dateKey)) return '';
  return new Intl.DateTimeFormat('en-CA', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(new Date(`${dateKey}T00:00:00Z`));
}

// ─── The dashboard's pending list ────────────────────────────────────────────

export type PendingBalanceClock = {
  commission: Commission;
  deal: Deal;
  clock: BalanceClock;
  /**
   * What is still owed on this deal — or NULL when the viewer must not see it.
   *
   * This is the whole reason the list is built here rather than inline in the
   * dashboard. The admin's net is total commission minus the rep's 5%, so a rep
   * shown that figure can add their own cut and recover the total rate and the
   * house's margin from it. On the first live deal that was $2,748 next to a
   * rep's own $3,927 — 8.5% and the split, in one glance.
   *
   * So the amount is decided by role, once, in a function with a test on it,
   * and the dashboard renders whatever it is handed. A rep gets null and no
   * money column at all; their own payout ledger lives on the Commissions page
   * where it is labelled as theirs, not beside a due date that belongs to the
   * contractor's payment term.
   */
  outstanding: number | null;
};

/**
 * Deals still waiting on their second payment, soonest due first.
 *
 * `deals` is expected to be already scoped to the viewer (getVisibleDealsForUser),
 * so a rep's list is their own deals; a commission whose deal isn't in that list
 * is dropped entirely. Settled clocks drop off too — they aren't pending.
 */
export function pendingBalanceClocks(
  commissions: Commission[],
  deals: Deal[],
  today: string,
  { canSeeAmounts }: { canSeeAmounts: boolean }
): PendingBalanceClock[] {
  const dealsById = new Map(deals.map((deal) => [deal.id, deal]));
  return commissions
    .map((commission) => {
      const deal = dealsById.get(commission.dealId);
      if (!deal) return null;
      const clock = balanceClock(commission, today);
      if (!clock.active || clock.status === 'settled') return null;
      return {
        clock,
        commission,
        deal,
        outstanding: canSeeAmounts
          ? Math.max((commission.adminNetCommission ?? 0) - (commission.adminNetPaidCommission ?? 0), 0)
          : null,
      };
    })
    .filter((row): row is PendingBalanceClock => row !== null)
    .sort((a, b) => a.clock.dueOn.localeCompare(b.clock.dueOn));
}

/** Total still outstanding across the list. Zero when amounts are withheld. */
export function pendingBalanceClockTotal(rows: PendingBalanceClock[]): number {
  return rows.reduce((sum, row) => sum + (row.outstanding ?? 0), 0);
}

// ─── Recording the up-front payment ──────────────────────────────────────────

/** The splits offered when a clock starts. Galaxy paid 25% first; since the
 *  autumn of 2026 they pay 50%. Anything else is typed in as a custom %. */
export const UPFRONT_PRESETS = [0.25, 0.5] as const;

/** The two amounts a split is applied to: the rep's cut and the house's net. */
export type PaymentLedger = Pick<Commission, 'repEstimatedCommission' | 'adminNetCommission'>;

const toCents = (amount: number) => Math.round(amount * 100) / 100;

/**
 * What "X% of the commission has been paid" means for each ledger.
 *
 * The contractor pays a share of the whole commission, and that share applies
 * equally to both sides of it: on a 50% payment the rep has been paid half of
 * their 5% and the house has collected half of its net. Recording it as one
 * fraction — rather than two numbers typed by hand — is what keeps the rep's
 * column and the admin's column from drifting apart, which is how the Galaxy
 * deals came to show 0 paid with half the money already in.
 *
 * Admin-only by construction: it needs the admin's net, which a rep's client
 * never holds (see withoutAdminLedger in store.tsx).
 */
export function upfrontPaymentUpdates(
  ledger: PaymentLedger,
  fraction: number
): Pick<Commission, 'repPaidCommission' | 'adminNetPaidCommission'> {
  const share = Math.min(Math.max(Number.isFinite(fraction) ? fraction : 0, 0), 1);
  return {
    repPaidCommission: toCents(Math.max(ledger.repEstimatedCommission, 0) * share),
    adminNetPaidCommission: toCents(Math.max(ledger.adminNetCommission ?? 0, 0) * share),
  };
}

/** Settling the clock means the remainder is in: both ledgers paid in full. */
export function settledPaymentUpdates(
  ledger: PaymentLedger
): Pick<Commission, 'repPaidCommission' | 'adminNetPaidCommission'> {
  return upfrontPaymentUpdates(ledger, 1);
}

/**
 * The share of the commission recorded as paid so far, from the rep's ledger
 * (the one every viewer has). 0.5 for a half-paid deal; 0 when nothing is owed.
 */
export function paidFraction(
  commission: Pick<Commission, 'repEstimatedCommission' | 'repPaidCommission'>
): number {
  const owed = commission.repEstimatedCommission;
  if (!(owed > 0)) return 0;
  return Math.min(Math.max(commission.repPaidCommission / owed, 0), 1);
}
