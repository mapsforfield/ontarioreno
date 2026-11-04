import type { Deal, DealStatus } from './types';

/**
 * What a rep should do first, worked out from the deal alone.
 *
 * A deal with a follow-up booked in the future is not flagged however quiet it
 * has been: the rep already has a plan for it, and a list that nags about
 * planned work stops being read. Setting a follow-up is therefore always a way
 * to clear a deal from "Needs you".
 */
export type DealAttention = {
  level: 'urgent' | 'soon';
  reason: string;
  rank: number;
};

export type DealSort = 'attention' | 'newest' | 'value' | 'name';

const OPEN_STATUSES: DealStatus[] = ['new_lead', 'appointment_booked', 'quoted', 'negotiating'];
const DAY_MS = 86_400_000;

function days(count: number) {
  return `${count} day${count === 1 ? '' : 's'}`;
}

/** Whole calendar days from one yyyy-mm-dd to another. Noon UTC sidesteps DST. */
function daysBetween(fromIso: string, toIso: string) {
  const from = Date.parse(`${fromIso}T12:00:00Z`);
  const to = Date.parse(`${toIso}T12:00:00Z`);
  return Math.round((to - from) / DAY_MS);
}

export function getDealAttention(deal: Deal, today: string, nowMs: number): DealAttention | null {
  if (!OPEN_STATUSES.includes(deal.status) || deal.isHistorical) return null;

  if (deal.nextFollowUpDate) {
    const late = daysBetween(deal.nextFollowUpDate, today);
    if (late > 0) {
      return { level: 'urgent', reason: `Follow-up ${days(late)} overdue`, rank: 100 + Math.min(late, 50) };
    }
    if (late === 0) return { level: 'urgent', reason: 'Follow-up due today', rank: 80 };
    return null;
  }

  const idle = Math.floor((nowMs - new Date(deal.updatedAt).getTime()) / DAY_MS);
  if (idle >= 30) return { level: 'urgent', reason: `No update in ${days(idle)}`, rank: 60 };
  if (deal.status === 'new_lead' && idle >= 2) {
    return { level: 'soon', reason: `New lead waiting ${days(idle)}`, rank: 50 };
  }
  if (idle >= 14) return { level: 'soon', reason: `No update in ${days(idle)}`, rank: 40 };
  return null;
}

export function sortDeals(deals: Deal[], sort: DealSort, today: string, nowMs: number): Deal[] {
  const recent = (a: Deal, b: Deal) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  const rank = (deal: Deal) => getDealAttention(deal, today, nowMs)?.rank ?? 0;

  return [...deals].sort((a, b) => {
    if (sort === 'value') return b.estimatedJobValue - a.estimatedJobValue || recent(a, b);
    if (sort === 'name') return a.homeownerName.localeCompare(b.homeownerName);
    if (sort === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return rank(b) - rank(a) || recent(a, b);
  });
}

/** yyyy-mm-dd, a number of days after another yyyy-mm-dd. */
export function addDaysIso(iso: string, count: number) {
  return new Date(Date.parse(`${iso}T12:00:00Z`) + count * DAY_MS).toISOString().slice(0, 10);
}
