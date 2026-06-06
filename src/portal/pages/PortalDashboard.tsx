import {
  BadgeDollarSign,
  Building2,
  CalendarDays,
  HandCoins,
  Trophy,
  TrendingUp,
} from 'lucide-react';
import { usePortalAuth } from '../auth';
import { formatCurrency } from '../data/selectors';
import { usePortalData } from '../data/store';
import { ConsultationStage } from '../data/types';

function formatConsultationStage(stage: ConsultationStage) {
  return stage
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getDaysSince(value: string) {
  if (!value) return 0;
  return Math.floor((Date.now() - new Date(value).getTime()) / 86400000);
}

export default function PortalDashboard() {
  const { currentUser } = usePortalAuth();
  const {
    calculateOpenDealsForUser,
    calculatePipelineValueForUser,
    calculateVisiblePendingCommission,
    calculateVisibleWonDeals,
    contractors,
    deals,
    getVisibleAppointmentsForUser,
    getVisibleDealsForUser,
    users,
  } = usePortalData();
  const activeContractors = contractors.filter(
    (contractor) => contractor.contractorStatus === 'active'
  ).length;
  const openDeals = currentUser ? calculateOpenDealsForUser(currentUser) : 0;
  const pendingCommission = currentUser
    ? calculateVisiblePendingCommission(currentUser)
    : 0;
  const pipelineValue = currentUser ? calculatePipelineValueForUser(currentUser) : 0;
  const wonDeals = currentUser ? calculateVisibleWonDeals(currentUser) : 0;
  const visibleDeals = currentUser ? getVisibleDealsForUser(currentUser) : [];
  const financingRequiredDeals = visibleDeals.filter(
    (deal) => deal.financingRequired
  );
  const financingPipeline = financingRequiredDeals.reduce(
    (total, deal) => total + deal.estimatedJobValue,
    0
  );
  const visibleAppointments = currentUser
    ? getVisibleAppointmentsForUser(currentUser)
    : [];
  const today = new Date().toISOString().slice(0, 10);
  const todayAppointments = visibleAppointments.filter(
    (appointment) => appointment.appointmentDate === today
  );
  const needsAttentionAppointments = visibleAppointments.filter(
    (appointment) =>
      (appointment.status === 'completed' && !appointment.outcomeSubmitted) ||
      (appointment.nextStep === 'follow_up_required' &&
        appointment.followUpDate &&
        appointment.followUpDate <= today) ||
      (['hot', 'warm'].includes(appointment.homeownerInterestLevel ?? '') &&
        appointment.nextStep === 'no_action') ||
      (appointment.appointmentDate < today && appointment.status !== 'completed') ||
      appointment.consultationStage === 'follow_up_required' ||
      (appointment.consultationStage === 'estimate_requested' &&
        getDaysSince(appointment.updatedAt) > 3) ||
      (appointment.consultationStage === 'contractor_review' &&
        getDaysSince(appointment.updatedAt) > 3) ||
      !appointment.assignedRepId ||
      !appointment.contractorId
  );
  const upcomingAppointments = visibleAppointments
    .filter(
      (appointment) =>
        appointment.appointmentDate >= today &&
        ['confirmed', 'rescheduled', 'scheduled'].includes(appointment.status)
    )
    .sort((first, second) =>
      `${first.appointmentDate}T${first.appointmentTime}`.localeCompare(
        `${second.appointmentDate}T${second.appointmentTime}`
      )
    )
    .slice(0, 4);
  const getDealLabel = (dealId: string) => {
    const deal = deals.find((candidate) => candidate.id === dealId);
    return deal ? `${deal.homeownerName} / ${deal.projectType}` : 'Consultation';
  };
  const getRepName = (repId: string) =>
    repId ? users.find((user) => user.id === repId)?.name ?? repId : 'Unassigned Rep';

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
      label: 'Won Deals',
      value: String(wonDeals),
      detail: currentUser?.role === 'admin' ? 'Team closed wins' : 'Your closed wins',
      icon: Trophy,
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

      <section className="rounded-[0.5rem] border border-white bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#32639b]">
              Financing
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.02em]">
              Financing pipeline
            </h2>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-[0.5rem] bg-[#e8f1fb] text-[#1B3C6C]">
            <BadgeDollarSign className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[0.5rem] border border-slate-200 bg-[#fbfdff] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
              Financing Pipeline
            </p>
            <p className="mt-2 text-3xl font-black">
              {formatCurrency(financingPipeline)}
            </p>
          </div>
          <div className="rounded-[0.5rem] border border-slate-200 bg-[#fbfdff] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
              Financing Required Deals
            </p>
            <p className="mt-2 text-3xl font-black">
              {financingRequiredDeals.length}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[0.5rem] border border-white bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#32639b]">
              Consultations
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.02em]">
              Consultation schedule
            </h2>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-[0.5rem] bg-[#e8f1fb] text-[#1B3C6C]">
            <CalendarDays className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[16rem_1fr]">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            <div className="rounded-[0.5rem] border border-slate-200 bg-[#fbfdff] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                Today's Consultations
              </p>
              <p className="mt-2 text-3xl font-black">
                {todayAppointments.length}
              </p>
            </div>
            <div className="rounded-[0.5rem] border border-slate-200 bg-[#fbfdff] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                Upcoming Consultations
              </p>
              <p className="mt-2 text-3xl font-black">
                {upcomingAppointments.length}
              </p>
            </div>
            <div className="col-span-2 rounded-[0.5rem] border border-amber-200 bg-amber-50 p-4 lg:col-span-1">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-amber-800">
                Needs Attention
              </p>
              <p className="mt-2 text-3xl font-black">
                {needsAttentionAppointments.length}
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((appointment) => (
                <article
                  key={appointment.id}
                  className="rounded-[0.5rem] border border-slate-200 bg-[#fbfdff] p-3"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-black text-slate-950">
                        {appointment.customerName ||
                          appointment.title ||
                          getDealLabel(appointment.dealId)}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {appointment.appointmentDate} /{' '}
                        {appointment.appointmentTime || 'Time not set'}
                      </p>
                      <p className="mt-1 text-xs font-black uppercase text-[#32639b]">
                        {formatConsultationStage(appointment.consultationStage)}
                      </p>
                    </div>
                    <span className="w-fit rounded-full bg-[#e8f1fb] px-3 py-1 text-xs font-black text-[#1B3C6C]">
                      {currentUser?.role === 'admin'
                        ? getRepName(appointment.assignedRepId)
                        : appointment.status}
                    </span>
                  </div>
                </article>
              ))
            ) : (
              <p className="rounded-[0.5rem] border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                No upcoming consultations yet.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
