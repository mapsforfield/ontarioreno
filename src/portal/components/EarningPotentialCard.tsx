import { useMemo, useState } from 'react';
import { Rocket, TrendingUp } from 'lucide-react';
import { usePortalAuth } from '../auth';
import { usePortalData } from '../data/store';
import { formatCurrency } from '../data/selectors';
import { torontoToday, torontoDateKey } from '../lib/time';

/**
 * "Earning Potential" — a motivational, math-backed card on the dashboard.
 * Rep mode: their 5% × average job value. Admin mode: your net (total rate − 5%)
 * × average job value across the whole team. Anchored on real averages, framed
 * as monthly + annual pace, with a live slider, milestone tiers, and a
 * this-month momentum nudge.
 */
export default function EarningPotentialCard() {
  const { currentUser, isAdmin } = usePortalAuth();
  const { deals, getVisibleDealsForUser, defaultCommissionRate } = usePortalData();

  const cfg = isAdmin
    ? { max: 24, def: 12, tiers: [6, 12, 18] }
    : { max: 8, def: 5, tiers: [3, 5, 7] };
  const [dealsPerMonth, setDealsPerMonth] = useState(cfg.def);

  const model = useMemo(() => {
    if (!currentUser) return null;
    const base = isAdmin ? deals : getVisibleDealsForUser(currentUser);
    const won = base.filter((d) => d.status === 'won');
    const teamWon = deals.filter((d) => d.status === 'won');
    const avgOf = (arr: typeof won) =>
      arr.length ? arr.reduce((s, d) => s + d.estimatedJobValue, 0) / arr.length : 0;
    // Real average job value → falls back to team, then a sensible default.
    const avgJob = avgOf(won) || avgOf(teamWon) || 85000;

    // Your net rate = total rate − rep's 5% (admin makes ~3.5% at an 8.5% total).
    const netRate = Math.max(defaultCommissionRate - 0.05, 0);
    const perDeal = isAdmin ? netRate * avgJob : 0.05 * avgJob;

    // This month's real closes (portal activity only, in Ontario time).
    const monthPrefix = torontoToday().slice(0, 7);
    const monthWon = base.filter(
      (d) =>
        d.status === 'won' &&
        !d.isHistorical &&
        torontoDateKey(new Date(d.updatedAt)).slice(0, 7) === monthPrefix
    );
    const monthCount = monthWon.length;
    const monthValue = monthWon.reduce((s, d) => s + d.estimatedJobValue, 0);
    const monthEarned = (isAdmin ? netRate : 0.05) * monthValue;

    return { perDeal, monthCount, monthEarned };
  }, [currentUser, isAdmin, deals, getVisibleDealsForUser, defaultCommissionRate]);

  if (!currentUser || !model) return null;
  const { perDeal, monthCount, monthEarned } = model;

  const monthly = perDeal * dealsPerMonth;
  const annual = monthly * 12;

  return (
    <section className="overflow-hidden rounded-[0.6rem] bg-[linear-gradient(135deg,#12294b_0%,#1B3C6C_45%,#2f5da0_100%)] p-5 text-white shadow-md sm:p-6">
      <div className="flex items-center gap-2">
        <Rocket className="h-4 w-4 text-amber-300" />
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/70">Earning Potential</p>
      </div>

      <h2 className="mt-2 max-w-2xl text-xl font-black leading-snug tracking-[-0.01em] sm:text-2xl">
        {isAdmin ? (
          <>If your team closes <span className="text-amber-300">{dealsPerMonth}</span> deals a month, your net is about <span className="text-amber-300">{formatCurrency(monthly)}</span>.</>
        ) : (
          <>Close <span className="text-amber-300">{dealsPerMonth}</span> deals a month and you&apos;d earn about <span className="text-amber-300">{formatCurrency(monthly)}</span>.</>
        )}
      </h2>

      {/* Big monthly + annual figures */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-[0.5rem] bg-white/10 px-4 py-3 backdrop-blur-sm">
          <p className="text-[0.65rem] font-bold uppercase tracking-wide text-white/60">Per month</p>
          <p className="mt-0.5 text-2xl font-black sm:text-3xl">{formatCurrency(monthly)}</p>
        </div>
        <div className="rounded-[0.5rem] bg-white/10 px-4 py-3 backdrop-blur-sm">
          <p className="flex items-center gap-1 text-[0.65rem] font-bold uppercase tracking-wide text-white/60">
            <TrendingUp className="h-3 w-3" /> At that pace / year
          </p>
          <p className="mt-0.5 text-2xl font-black text-amber-300 sm:text-3xl">{formatCurrency(annual)}</p>
        </div>
      </div>

      {/* Live slider */}
      <div className="mt-5">
        <div className="flex items-center justify-between text-xs font-bold text-white/70">
          <span>{isAdmin ? 'Team deals a month' : 'Deals you close a month'}</span>
          <span className="text-sm font-black text-white">{dealsPerMonth}</span>
        </div>
        <input
          type="range"
          min={1}
          max={cfg.max}
          value={dealsPerMonth}
          onChange={(e) => setDealsPerMonth(Number(e.target.value))}
          className="mt-2 w-full cursor-pointer accent-amber-300"
          aria-label="Deals per month"
        />
      </div>

      {/* Milestone tiers */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {cfg.tiers.map((n, i) => {
          const medal = ['🥉', '🥈', '🥇'][i] ?? '';
          const active = dealsPerMonth === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => setDealsPerMonth(n)}
              className={`rounded-[0.5rem] px-2 py-2 text-left transition ${active ? 'bg-white/25 ring-1 ring-white/40' : 'bg-white/10 hover:bg-white/15'}`}
            >
              <p className="text-[0.68rem] font-black text-white/80">{medal} {n} deals</p>
              <p className="mt-0.5 text-sm font-black">{formatCurrency(perDeal * n)}<span className="text-[0.6rem] font-bold text-white/60">/mo</span></p>
              <p className="text-[0.6rem] font-bold text-white/60">{formatCurrency(perDeal * n * 12)}/yr</p>
            </button>
          );
        })}
      </div>

      {/* This-month momentum */}
      <p className="mt-4 rounded-[0.5rem] bg-black/15 px-3 py-2.5 text-sm font-semibold text-white/90">
        {monthCount > 0 ? (
          <>
            {isAdmin ? 'Your team has' : "You've"} closed <span className="font-black text-white">{monthCount}</span> deal{monthCount !== 1 ? 's' : ''} ({formatCurrency(monthEarned)}) this month —{' '}
            <span className="font-black text-amber-300">one more</span> puts {isAdmin ? 'you' : 'you'} at {formatCurrency(monthEarned + perDeal)}.
          </>
        ) : (
          <>
            No closes yet this month — your first is worth about <span className="font-black text-amber-300">{formatCurrency(perDeal)}</span>. Let&apos;s get one on the board. 💪
          </>
        )}
      </p>
    </section>
  );
}
