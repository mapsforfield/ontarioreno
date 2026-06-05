import { BadgeDollarSign, BriefcaseBusiness, TrendingUp, Trophy } from 'lucide-react';
import { formatCurrency } from '../data/selectors';
import { usePortalData } from '../data/store';

export default function PortalLeaderboard() {
  const {
    calculateBrokerScore,
    calculatePipelineValue,
    calculateRepPendingCommission,
    getDealsForRep,
    users,
  } = usePortalData();
  const reps = users
    .filter((user) => user.role === 'rep' && user.active)
    .map((rep) => {
      const openDeals = getDealsForRep(rep.id).filter((deal) =>
        [
          'new_lead',
          'contacted',
          'appointment_booked',
          'quoted',
          'negotiating',
        ].includes(deal.status)
      ).length;

      return {
        id: rep.id,
        name: rep.name,
        brokerScore: calculateBrokerScore(rep.id),
        openDeals,
        pipelineValue: formatCurrency(calculatePipelineValue(rep.id)),
        pendingCommission: formatCurrency(
          calculateRepPendingCommission(rep.id)
        ),
      };
    })
    .sort((first, second) => second.brokerScore - first.brokerScore);

  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#32639b]">
          Leaderboard
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.02em]">
          Rep performance placeholders
        </h1>
      </header>

      <section className="rounded-[0.5rem] border border-white bg-white p-4 shadow-sm sm:p-5">
        <div className="space-y-3">
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
                    Broker Score {rep.brokerScore}
                  </div>
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-[0.5rem] border border-slate-200 bg-white p-3">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                    Broker Score
                  </p>
                  <p className="mt-2 text-2xl font-black text-slate-950">
                    {rep.brokerScore}
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
                    {rep.pipelineValue}
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
                    {rep.pendingCommission}
                  </p>
                </div>
              </div>
              <div className="mt-5 h-2 rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[#1B3C6C]"
                  style={{ width: `${rep.brokerScore}%` }}
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[0.5rem] border border-[#c9d9eb] bg-[#e8f1fb] p-5 text-[#17385f]">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-5 w-5" />
          <p className="text-sm font-bold">
            Commission-weighted scoring can be connected in a later phase.
          </p>
        </div>
      </section>
    </div>
  );
}
