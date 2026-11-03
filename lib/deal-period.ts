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

/** `day:YYYY-MM-DD` is one specific day, picked from the calendar — so
 *  "yesterday" (or any day) doesn't need a button of its own. */
export type BoardPeriod =
  | 'all'
  | 'today'
  | 'month'
  | 'last_month'
  | 'quarter'
  | 'year'
  | `day:${string}`;

const DAY_PERIOD = /^day:(\d{4})-(\d{2})-(\d{2})$/;

/** The period for one calendar day. */
export function dayPeriod(dateKey: string): BoardPeriod {
  return `day:${dateKey}`;
}

/** YYYY-MM-DD of a day period, or null for any other period. */
export function periodDay(period: BoardPeriod): string | null {
  return DAY_PERIOD.test(period) ? period.slice(4) : null;
}

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
  const day = DAY_PERIOD.exec(period);
  if (day) {
    const [, dy, dm, dd] = day.map(Number);
    return [new Date(dy, dm - 1, dd), new Date(dy, dm - 1, dd + 1)];
  }
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (period) {
    case 'all':
      return null;
    case 'today':
      return [new Date(y, m, now.getDate()), new Date(y, m, now.getDate() + 1)];
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
    default:
      return null;
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
  if (period === 'today') {
    return `Today · ${new Intl.DateTimeFormat('en-CA', { month: 'long', day: 'numeric' }).format(start)}`;
  }
  if (periodDay(period)) {
    const dayName = new Intl.DateTimeFormat('en-CA', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' }).format(start);
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (start.getTime() === yesterday.getTime()) return `Yesterday · ${dayName}`;
    if (start.getTime() === today.getTime()) return `Today · ${dayName}`;
    return dayName;
  }
  if (period === 'month' || period === 'last_month') {
    return new Intl.DateTimeFormat('en-CA', { month: 'long', year: 'numeric' }).format(start);
  }
  if (period === 'quarter') return `Q${Math.floor(start.getMonth() / 3) + 1} ${start.getFullYear()}`;
  return String(start.getFullYear());
}
