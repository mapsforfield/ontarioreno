import {
  BadgeDollarSign,
  Building2,
  Gauge,
  HandCoins,
  TrendingUp,
} from 'lucide-react';
import { usePortalAuth } from '../auth';
import { formatCurrency } from '../data/selectors';
import { usePortalData } from '../data/store';

export default function PortalDashboard() {
  const { currentUser } = usePortalAuth();
  const {
    calculateOpenDealsForUser,
    calculatePipelineValueForUser,
    calculateVisibleBrokerScore,
    calculateVisiblePendingCommission,
    contractors,
  } = usePortalData();
  const activeContractors = contractors.filter(
    (contractor) => contractor.contractorStatus === 'active'
  ).length;
  const openDeals = currentUser ? calculateOpenDealsForUser(currentUser) : 0;
  const pendingCommission = currentUser
    ? calculateVisiblePendingCommission(currentUser)
    : 0;
  const pipelineValue = currentUser ? calculatePipelineValueForUser(currentUser) : 0;
  const brokerScore = currentUser ? calculateVisibleBrokerScore(currentUser) : 0;

  const summaryCards = [
    {
      label: 'Active Contractors',
      value: String(activeContractors),
      detail: 'Approved network',
      icon: Building2,
    },
    {
      label: 'Open Deals',
      value: String(openDeals),
      detail: 'Visible pipeline',
      icon: HandCoins,
    },
    {
      label: 'Pending Commission',
      value: formatCurrency(pendingCommission),
      detail:
        currentUser?.role === 'admin'
          ? 'Admin net pending'
          : 'Your 5% rep commission',
      icon: BadgeDollarSign,
    },
    {
      label: 'Pipeline Value',
      value: formatCurrency(pipelineValue),
      detail: 'Open deal value',
      icon: TrendingUp,
    },
    {
      label: 'Broker Score',
      value: String(brokerScore),
      detail: currentUser?.role === 'admin' ? 'Team average' : 'Your score',
      icon: Gauge,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-[0.5rem] border border-white bg-[linear-gradient(135deg,#ffffff_0%,#f7fbff_55%,#ecf4fd_100%)] p-5 shadow-md sm:p-7">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#32639b]">
          Dashboard
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.02em] text-slate-950 sm:text-4xl">
          Welcome back, {currentUser?.name}.
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          Your secure OntarioReno sales workspace is ready for the next build
          phase.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map((card) => (
          <article
            key={card.label}
            className="rounded-[0.5rem] border border-white bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  {card.label}
                </p>
                <p className="mt-3 text-3xl font-black tracking-[-0.02em]">
                  {card.value}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-[0.5rem] bg-[#e8f1fb] text-[#1B3C6C]">
                <card.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-sm font-medium text-slate-500">
              {card.detail}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
