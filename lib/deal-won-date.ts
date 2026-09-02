/**
 * When a deal was won — and why that is not `updatedAt`.
 *
 * The WON column and the earnings figure on the dashboard both filter by month,
 * quarter and year. Both used to read `updatedAt`, which Prisma bumps on every
 * write: a note, a contractor assignment, a corrected phone number. So a deal
 * closed in March reappeared in September's WON column the moment anyone
 * touched it, and the dashboard told the rep they had closed it this month.
 *
 * A number that moves because someone tidied a record is worse than no number:
 * it is wrong in the direction that flatters, and it is wrong on the screen reps
 * are measured by.
 *
 * `wonAt` is written on the transition into 'won' and cleared on the way out.
 * `updatedAt` remains the fallback for deals won before the column existed —
 * those are the ones scripts/deal-won-date-backfill.ts recovers from the
 * activity log, and until it runs they behave exactly as they did before.
 */

export type DealWinFields = {
  status: string;
  wonAt?: string | Date | null;
  updatedAt: string | Date;
};

/**
 * The date a deal's win should be counted on, or null when it isn't won.
 *
 * Never falls back for a deal that is not won: a lost deal has no win date, and
 * returning its updatedAt would put it in a WON bucket the moment a caller
 * forgot to check the status first.
 */
export function dealWonDate(deal: DealWinFields): Date | null {
  if (deal.status !== 'won') return null;
  if (deal.wonAt) return new Date(deal.wonAt);
  return new Date(deal.updatedAt);
}

/** True when this deal's win falls inside the given YYYY-MM month. */
export function wonInMonth(deal: DealWinFields, monthPrefix: string, toDateKey: (d: Date) => string): boolean {
  const won = dealWonDate(deal);
  return !!won && toDateKey(won).slice(0, 7) === monthPrefix;
}

/**
 * Should `wonAt` change on this status write, and to what?
 *
 * Returns undefined to leave it alone — the common case, since most edits are
 * not status changes at all.
 *
 * Re-winning a deal that was moved to lost and back sets a NEW date rather than
 * restoring the old one: the deal was not won during the stretch it sat in lost,
 * and the date it actually closed is the later one.
 */
export function nextWonAt(previousStatus: string, nextStatus: string | undefined, now: Date): Date | null | undefined {
  if (nextStatus === undefined || nextStatus === previousStatus) return undefined;
  if (nextStatus === 'won') return now;
  if (previousStatus === 'won') return null; // moved back out of won
  return undefined;
}
