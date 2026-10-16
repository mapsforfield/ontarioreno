/**
 * Board-wide period view for the Deals page ("show me everything from this
 * month"). Admin only.
 *
 * Each deal is placed on the one date that means "this happened in the period"
 * for its stage:
 *   - won  → the win date (lib/deal-won-date.ts), never updatedAt
 *   - lost → updatedAt, the closest thing to a loss date we store
 *   - open → createdAt, i.e. the lead came in during the period
 *
 * Open deals deliberately do NOT use updatedAt: that moves on every edit, so a
 * note typed today would pull an August lead into October's view.
 *
 * Pre-portal imports carry no real dates and are excluded from every period
 * except 'all' — same rule as the Won/Lost column toggles.
 */
import { dealWonDate } from './deal-won-date.ts';

export type BoardPeriod = 'all' | 'month' | 'last_month' | 'quarter' | 'year';

export type DealPeriodFields = {
  status: string;
  wonAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  isHistorical?: boolean;
};

export function dealPeriodDate(deal: DealPeriodFields): Date {
  if (deal.status === 'won') return dealWonDate(deal) ?? new Date(deal.updatedAt);
  if (deal.status === 'lost') return new Date(deal.updatedAt);
  return new Date(deal.createdAt);
}

/** [start, end) of the period in local time, or null for 'all'. */
export function periodBounds(period: BoardPeriod, now = new Date()): [Date, Date] | null {
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (period) {
    case 'all':
      return null;
    case 'month':
      return [new Date(y, m, 1), new Date(y, m + 1, 1)];
    case 'last_month':
      return [new Date(y, m - 1, 1), new Date(y, m, 1)];
    case 'quarter': {
      const q = Math.floor(m / 3) * 3;
      return [new Date(y, q, 1), new Date(y, q + 3, 1)];
    }
    case 'year':
      return [new Date(y, 0, 1), new Date(y + 1, 0, 1)];
  }
}

export function isDealInPeriod(deal: DealPeriodFields, period: BoardPeriod, now = new Date()): boolean {
  const bounds = periodBounds(period, now);
  if (!bounds) return true;
  if (deal.isHistorical) return false;
  const placed = dealPeriodDate(deal).getTime();
  return placed >= bounds[0].getTime() && placed < bounds[1].getTime();
}

/** Human label for the period, e.g. "October 2026", "Q4 2026". */
export function periodLabel(period: BoardPeriod, now = new Date()): string {
  const bounds = periodBounds(period, now);
  if (!bounds) return 'All time';
  const [start] = bounds;
  if (period === 'month' || period === 'last_month') {
    return new Intl.DateTimeFormat('en-CA', { month: 'long', year: 'numeric' }).format(start);
  }
  if (period === 'quarter') return `Q${Math.floor(start.getMonth() / 3) + 1} ${start.getFullYear()}`;
  return String(start.getFullYear());
}
