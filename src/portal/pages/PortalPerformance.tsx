import {
  CalendarCheck,
  HandCoins,
  Send,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import { usePortalAuth } from '../auth';
import { formatCurrency } from '../data/selectors';
import { usePortalData } from '../data/store';
import { Appointment, Commission, Deal, ProposalHistory, User } from '../data/types';

type DateRange = 'all_time' | 'this_month' | 'last_30_days';

const openDealStatuses = [
  'new_lead',
  'contacted',
  'appointment_booked',
  'quoted',
  'negotiating',
];

const dateFilters: Array<{ label: string; value: DateRange }> = [
  { label: 'All Time', value: 'all_time' },
  { label: 'This Month', value: 'this_month' },
  { label: 'Last 30 Days', value: 'last_30_days' },
];

function isInDateRange(value: string | undefined, range: DateRange) {
  if (range === 'all_time' || !value) return true;

  const date = new Date(value.includes('T') ? value : `${value}T00:00:00`);
  const now = new Date();

  if (range === 'this_month') {
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth()
    );
  }

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  return date >= thirtyDaysAgo;
}

function calculateRepEstimatedCommission(deal: Deal) {
  if (deal.status === 'lost') return 0;
  return Math.round(deal.estimatedJobValue * 0.05);
}

function metricCard(
  label: string,
  value: string,
  detail: string,
  Icon: typeof Target
) {
  return (
    <article className="rounded-[0.5rem] border border-white bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-black tracking-[-0.02em] text-slate-950">
            {value}
          </p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-[0.5rem] bg-[#e8f1fb] text-[#1B3C6C]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 text-sm font-medium text-slate-500">{detail}</p>
    </article>
  );
}

function buildRepPerformance({
  appointments,
  commissions,
  deals,
  proposals,
  range,
  rep,
}: {
  appointments: Appointment[];
  commissions: Commission[];
  deals: Deal[];
  proposals: ProposalHistory[];
  range: DateRange;
  rep: User;
}) {
  const repDeals = deals.filter(
    (deal) =>
      deal.assignedRepId === rep.id && isInDateRange(deal.createdAt, range)
  );
  const repAppointments = appointments.filter(
    (appointment) =>
      appointment.assignedRepId === rep.id &&
      isInDateRange(appointment.appointmentDate, range)
  );
  const repProposals = proposals.filter(
    (proposal) =>
      proposal.sentByUserId === rep.id && isInDateRange(proposal.sentAt, range)
  );
  const repCommissions = commissions.filter((commission) => {
    const deal = deals.find((candidate) => candidate.id === commission.dealId);
    return (
      commission.repId === rep.id &&
      Boolean(deal && isInDateRange(deal.updatedAt, range))
    );
  });
  const openDeals = repDeals.filter((deal) =>
    openDealStatuses.includes(deal.status)
  );
  const wonDeals = repDeals.filter((deal) => deal.status === 'won');
  const lostDeals = repDeals.filter((deal) => deal.status === 'lost');
  const closedDeals = wonDeals.length + lostDeals.length;
  const closedVolume = wonDeals.reduce(
    (total, deal) => total + deal.estimatedJobValue,
    0
  );
  const pendingCommission = repCommissions.reduce((total, commission) => {
    const deal = deals.find((candidate) => candidate.id === commission.dealId);
    const estimated = deal
      ? calculateRepEstimatedCommission(deal)
      : commission.repEstimatedCommission;
    return (
      total +
      (deal?.status === 'won' && commission.payoutStatus !== 'paid'
        ? Math.max(estimated - commission.repPaidCommission, 0)
        : 0)
    );
  }, 0);
  const completedConsultations = repAppointments.filter(
    (appointment) => appointment.status === 'completed'
  );
  const outcomesSubmitted = repAppointments.filter(
    (appointment) => appointment.outcomeSubmitted
  );
  const outcomePipelineValue = repAppointments.reduce(
    (total, appointment) => total + (appointment.estimatedProjectValue || 0),
    0
  );

  return {
    appointmentsAssigned: repAppointments.length,
    appointmentsCompleted: completedConsultations.length,
    contractorReviewConsultations: repAppointments.filter(
      (appointment) => appointment.consultationStage === 'contractor_review'
    ).length,
    closedVolume,
    lostDeals: lostDeals.length,
    noShows: repAppointments.filter(
      (appointment) => appointment.status === 'no_show'
    ).length,
    openDeals: openDeals.length,
    paidCommission: repCommissions.reduce(
      (total, commission) => total + commission.repPaidCommission,
      0
    ),
    pendingCommission,
    pipelineValue: openDeals.reduce(
      (total, deal) => total + deal.estimatedJobValue,
      0
    ),
    proposalsSent: repProposals.length,
    rep,
    followUpRequiredConsultations: repAppointments.filter(
      (appointment) =>
        appointment.consultationStage === 'follow_up_required' ||
        appointment.nextStep === 'follow_up_required'
    ).length,
    hotLeads: repAppointments.filter(
      (appointment) => appointment.homeownerInterestLevel === 'hot'
    ).length,
    outcomeCompletionRate:
      completedConsultations.length > 0
        ? Math.round((outcomesSubmitted.length / completedConsultations.length) * 100)
        : 0,
    outcomePipelineValue,
    outcomesSubmitted: outcomesSubmitted.length,
    warmLeads: repAppointments.filter(
      (appointment) => appointment.homeownerInterestLevel === 'warm'
    ).length,
    winRate: closedDeals > 0 ? Math.round((wonDeals.length / closedDeals) * 100) : 0,
    wonDeals: wonDeals.length,
  };
}

export default function PortalPerformance() {
  const { currentUser, isAdmin } = usePortalAuth();
  const {
    appointments,
    commissions,
    deals,
    proposals,
    users,
  } = usePortalData();
  const [dateRange, setDateRange] = useState<DateRange>('all_time');

  if (!currentUser) return null;

  const visibleReps = isAdmin
    ? users.filter((user) => user.role === 'rep')
    : users.filter((user) => user.id === currentUser.id);
  const repPerformance = visibleReps
    .map((rep) =>
      buildRepPerformance({
        appointments,
        commissions,
        deals,
        proposals,
        range: dateRange,
        rep,
      })
    )
    .sort(
      (first, second) =>
        second.wonDeals - first.wonDeals ||
        second.closedVolume - first.closedVolume ||
        second.pendingCommission - first.pendingCommission ||
        second.pipelineValue - first.pipelineValue
    );
  const primary = repPerformance[0];

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#32639b]">
            Performance
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.02em]">
            {isAdmin ? 'Rep performance dashboard' : 'My performance dashboard'}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {dateFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setDateRange(filter.value)}
              className={
                dateRange === filter.value
                  ? 'rounded-full bg-[#1B3C6C] px-4 py-2 text-sm font-black text-white'
                  : 'rounded-full border border-white bg-white px-4 py-2 text-sm font-black text-slate-600 shadow-sm transition hover:text-[#1B3C6C]'
              }
            >
              {filter.label}
            </button>
          ))}
        </div>
      </header>

      {!isAdmin && !primary && (
        <div className="flex flex-col items-center rounded-[0.5rem] border border-dashed border-slate-200 bg-white py-14 text-center">
          <Target className="h-10 w-10 text-slate-200" />
          <p className="mt-3 text-sm font-bold text-slate-500">No performance data yet</p>
          <p className="mt-1 text-xs text-slate-400">Your stats will appear here once you have deals and consultations.</p>
        </div>
      )}

      {!isAdmin && primary && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {metricCard('My Open Deals', String(primary.openDeals), 'Pipeline Health', Target)}
            {metricCard('My Pipeline Value', formatCurrency(primary.pipelineValue), 'Pipeline Health', TrendingUp)}
            {metricCard('My Consultations', String(primary.appointmentsAssigned), 'Consultation Activity', CalendarCheck)}
            {metricCard('My Proposals Sent', String(primary.proposalsSent), 'Proposal Activity', Send)}
            {metricCard('My Won Deals', String(primary.wonDeals), 'Performance Snapshot', Target)}
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <article className="rounded-[0.5rem] border border-white bg-white p-5 shadow-sm">
              <h2 className="text-xl font-black tracking-[-0.01em]">Consultation Activity</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {metricCard('My Completed Consultations', String(primary.appointmentsCompleted), 'Completed consultations', CalendarCheck)}
                {metricCard('Outcomes Submitted', String(primary.outcomesSubmitted), `${primary.outcomeCompletionRate}% completion`, CalendarCheck)}
                {metricCard('No-Shows', String(primary.noShows), 'Follow-through watch', CalendarCheck)}
                {metricCard('Needs Follow-Up', String(primary.followUpRequiredConsultations), 'Lifecycle stage', CalendarCheck)}
                {metricCard('Contractor Review', String(primary.contractorReviewConsultations), 'Lifecycle stage', CalendarCheck)}
                {metricCard('Hot Leads', String(primary.hotLeads), 'Outcome reports', CalendarCheck)}
                {metricCard('Warm Leads', String(primary.warmLeads), 'Outcome reports', CalendarCheck)}
                {metricCard('Outcome Pipeline', formatCurrency(primary.outcomePipelineValue), 'Estimated from reports', CalendarCheck)}
              </div>
            </article>
            <article className="rounded-[0.5rem] border border-white bg-white p-5 shadow-sm">
              <h2 className="text-xl font-black tracking-[-0.01em]">Pipeline Health</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {metricCard('My Won Deals', String(primary.wonDeals), 'Closed wins', Target)}
                {metricCard('My Lost Deals', String(primary.lostDeals), `Win Rate ${primary.winRate}%`, Target)}
              </div>
            </article>
            <article className="rounded-[0.5rem] border border-white bg-white p-5 shadow-sm">
              <h2 className="text-xl font-black tracking-[-0.01em]">Commission Progress</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {metricCard('My Pending Commission', formatCurrency(primary.pendingCommission), 'Won unpaid deals', HandCoins)}
                {metricCard('My Paid Commission', formatCurrency(primary.paidCommission), 'Recorded payouts', HandCoins)}
              </div>
            </article>
          </section>
        </>
      )}

      {isAdmin && repPerformance.length === 0 && (
        <div className="flex flex-col items-center rounded-[0.5rem] border border-dashed border-slate-200 bg-white py-14 text-center">
          <Target className="h-10 w-10 text-slate-200" />
          <p className="mt-3 text-sm font-bold text-slate-500">No reps to show</p>
          <p className="mt-1 text-xs text-slate-400">Add reps from the Admin panel to track their performance here.</p>
        </div>
      )}

      {isAdmin && repPerformance.length > 0 && (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {repPerformance.map((rep) => (
              <article
                key={rep.rep.id}
                className="rounded-[0.5rem] border border-white bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black tracking-[-0.01em]">
                      {rep.rep.name}
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      Performance Snapshot
                    </p>
                  </div>
                  <span className="rounded-full bg-[#fff6df] px-3 py-1 text-xs font-black text-[#8a6418]">
                    Won Deals {rep.wonDeals}
                  </span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Open Deals</p>
                    <p className="mt-1 text-xl font-black">{rep.openDeals}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Pipeline</p>
                    <p className="mt-1 text-xl font-black">{formatCurrency(rep.pipelineValue)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Completed</p>
                    <p className="mt-1 text-xl font-black">{rep.appointmentsCompleted}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Closed Volume</p>
                    <p className="mt-1 text-xl font-black">{formatCurrency(rep.closedVolume)}</p>
                  </div>
                </div>
              </article>
            ))}
          </section>

          <section className="overflow-hidden rounded-[0.5rem] border border-white bg-white shadow-sm">
            <div className="border-b border-slate-200 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#32639b]">
                Rep Comparison
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.02em]">
                Productivity and follow-through
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[62rem] w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Rep</th>
                    <th className="px-4 py-3">Pipeline Value</th>
                    <th className="px-4 py-3">Consultations Completed</th>
                    <th className="px-4 py-3">Proposals Sent</th>
                    <th className="px-4 py-3">Won Deals</th>
                    <th className="px-4 py-3">Pending Commission</th>
                    <th className="px-4 py-3">Closed Volume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {repPerformance.map((rep) => (
                    <tr key={rep.rep.id}>
                      <td className="px-4 py-4 font-black text-slate-950">{rep.rep.name}</td>
                      <td className="px-4 py-4 font-bold text-[#1B3C6C]">{formatCurrency(rep.pipelineValue)}</td>
                      <td className="px-4 py-4 font-semibold">{rep.appointmentsCompleted}</td>
                      <td className="px-4 py-4 font-semibold">{rep.proposalsSent}</td>
                      <td className="px-4 py-4 font-semibold">{rep.wonDeals}</td>
                      <td className="px-4 py-4 font-bold">{formatCurrency(rep.pendingCommission)}</td>
                      <td className="px-4 py-4 font-black">{formatCurrency(rep.closedVolume)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
