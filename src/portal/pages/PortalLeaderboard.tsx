import { BadgeDollarSign, BriefcaseBusiness, TrendingUp, Trophy } from 'lucide-react';
import { formatCurrency } from '../data/selectors';
import { usePortalData } from '../data/store';

export default function PortalLeaderboard() {
  const {
    calculateClosedVolume,
    calculatePipelineValue,
    calculateRepPendingCommission,
    calculateWonDeals,
    getDealsForRep,
    users,
  } = usePortalData();
  const reps = users
    .filter((user) => user.role === 'rep' && user.active)
    .map((rep) => {
      const openDeals = getDealsForRep(rep.id).filter((deal) =>
        [
          'new_lead',
          'appointment_booked',
          'quoted',
          'negotiating',
        ].includes(deal.status)
      ).length;

      return {
        id: rep.id,
        name: rep.name,
        closedVolume: calculateClosedVolume(rep.id),
        openDeals,
        pipelineValue: calculatePipelineValue(rep.id),
        pendingCommission: calculateRepPendingCommission(rep.id),
        wonDeals: calculateWonDeals(rep.id),
      };
    })
    .sort(
      (first, second) =>
        second.wonDeals - first.wonDeals ||
        second.closedVolume - first.closedVolume ||
        second.pendingCommission - first.pendingCommission ||
        second.pipelineValue - first.pipelineValue
    );
  const topWonDeals = Math.max(...reps.map((rep) => rep.wonDeals), 1);

  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#32639b]">
          Leaderboard
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.02em]">
          Rep Performance Rankings
        </h1>
      </header>

      <section className="rounded-[0.5rem] border border-white bg-white p-4 shadow-sm sm:p-5">
        <div className="space-y-3">
          {reps.length === 0 && (
            <div className="flex flex-col items-center rounded-[0.5rem] border border-dashed border-slate-200 bg-slate-50 py-12 text-center">
              <Trophy className="h-10 w-10 text-slate-200" />
              <p className="mt-3 text-sm font-bold text-slate-500">No reps yet</p>
              <p className="mt-1 text-xs text-slate-400">Add reps from the Admin panel to see their rankings here.</p>
            </div>
          )}
          {reps.map((rep, index) => (
            <article
              key={rep.id}
              className="rounded-[0.5rem] border border-slate-200 bg-[#fbfdff] p-4"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#071525] text-sm font-black text-white">
                    {index + 1}
                  </div>
                  <div>
                    <h2 className="text-lg font-black">{rep.name}</h2>
                    <p className="text-sm font-semibold text-slate-500">
                      Sales rep performance snapshot
                    </p>
                  </div>
                </div>
                <div className="sm:text-right">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-[#fff6df] px-3 py-1 text-xs font-black text-[#8a6418]">
                    <Trophy className="h-3.5 w-3.5" />
                    Won Deals {rep.wonDeals}
                  </div>
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-[0.5rem] border border-slate-200 bg-white p-3">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                    Won Deals
                  </p>
                  <p className="mt-2 text-2xl font-black text-slate-950">
                    {rep.wonDeals}
                  </p>
                </div>
                <div className="rounded-[0.5rem] border border-slate-200 bg-white p-3">
                  <div className="flex items-center gap-2 text-slate-500">
                    <BriefcaseBusiness className="h-4 w-4" />
                    <p className="text-xs font-bold uppercase tracking-[0.12em]">
                      Open Deals
                    </p>
                  </div>
                  <p className="mt-2 text-2xl font-black text-slate-950">
                    {rep.openDeals}
                  </p>
                </div>
                <div className="rounded-[0.5rem] border border-slate-200 bg-white p-3">
                  <div className="flex items-center gap-2 text-slate-500">
                    <TrendingUp className="h-4 w-4" />
                    <p className="text-xs font-bold uppercase tracking-[0.12em]">
                      Pipeline Value
                    </p>
                  </div>
                  <p className="mt-2 text-2xl font-black text-slate-950">
                    {formatCurrency(rep.pipelineValue)}
                  </p>
                </div>
                <div className="rounded-[0.5rem] border border-slate-200 bg-white p-3">
                  <div className="flex items-center gap-2 text-slate-500">
                    <BadgeDollarSign className="h-4 w-4" />
                    <p className="text-xs font-bold uppercase tracking-[0.12em]">
                      Pending Commission
                    </p>
                  </div>
                  <p className="mt-2 text-2xl font-black text-slate-950">
                    {formatCurrency(rep.pendingCommission)}
                  </p>
                </div>
              </div>
              <div className="mt-5">
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-400">Won deals vs. top performer</p>
                  <p className="text-xs font-bold text-slate-500">
                    {rep.wonDeals === 0 ? '—' : `${Math.round((rep.wonDeals / topWonDeals) * 100)}%`}
                  </p>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#1B3C6C] transition-all duration-500"
                    style={{ width: `${Math.max((rep.wonDeals / topWonDeals) * 100, 4)}%` }}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[0.5rem] border border-[#c9d9eb] bg-[#e8f1fb] p-5 text-[#17385f]">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-5 w-5" />
          <p className="text-sm font-bold">
            Ranked by won deals, then closed volume, pending commission, and pipeline value.
          </p>
        </div>
      </section>
    </div>
  );
}
