import { BadgeDollarSign, Building2, MapPin, UsersRound } from 'lucide-react';
import { usePortalAuth } from '../auth';
import { getRecommendedContractors } from '../data/recommendations';
import {
  formatCurrency,
  formatDealStatus,
  formatFinancingStatus,
} from '../data/selectors';
import { usePortalData } from '../data/store';
import { Contractor, Deal } from '../data/types';

function DealCard({
  appointmentDate,
  assignedContractor,
  assignedRep,
  deal,
}: {
  appointmentDate?: string;
  assignedContractor: string;
  assignedRep: string;
  deal: Deal;
}) {
  return (
    <article className="rounded-[0.5rem] border border-slate-200 bg-[#fbfdff] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-950">
            {deal.homeownerName}
          </h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {deal.projectType} / {deal.city}
          </p>
        </div>
        <span className="w-fit rounded-full bg-[#e8f1fb] px-3 py-1 text-xs font-black text-[#1B3C6C]">
          {formatDealStatus(deal.status)}
        </span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
            Job Value
          </p>
          <p className="mt-1 font-black text-[#1B3C6C]">
            {formatCurrency(deal.estimatedJobValue)}
          </p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
            Assigned Rep
          </p>
          <p className="mt-1 font-black">{assignedRep}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
            Contractor
          </p>
          <p className="mt-1 font-black">{assignedContractor}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
            Appointment
          </p>
          <p className="mt-1 font-black">{appointmentDate ?? 'Not booked'}</p>
        </div>
      </div>
    </article>
  );
}

function ContractorCard({ contractor }: { contractor: Contractor }) {
  return (
    <article className="rounded-[0.5rem] border border-slate-200 bg-[#fbfdff] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-slate-950">
            {contractor.companyName}
          </h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {contractor.contactName}
          </p>
        </div>
        <span
          className={
            contractor.contractorStatus === 'active'
              ? 'rounded-full bg-[#edf7ef] px-3 py-1 text-xs font-black text-[#287247]'
              : 'rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500'
          }
        >
          {contractor.contractorStatus === 'active' ? 'Active' : 'Inactive'}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600">
          <MapPin className="h-3.5 w-3.5 text-[#32639b]" />
          {contractor.serviceAreas.join(', ') || 'Ontario'}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600">
          <Building2 className="h-3.5 w-3.5 text-[#32639b]" />
          {contractor.projectTypes.join(', ') || 'Renovation'}
        </span>
      </div>
    </article>
  );
}

export default function PortalFinancing() {
  const { currentUser, isAdmin } = usePortalAuth();
  const {
    appointments,
    contractors,
    getVisibleDealsForUser,
    users,
  } = usePortalData();

  if (!currentUser) return null;

  const visibleDeals = getVisibleDealsForUser(currentUser);
  const visibleContractors = isAdmin
    ? contractors
    : contractors.filter((contractor) => contractor.contractorStatus === 'active');
  const financingRequiredDeals = visibleDeals.filter(
    (deal) => deal.financingRequired
  );
  const cashDeals = visibleDeals.filter((deal) => !deal.financingRequired);
  const financingPipeline = financingRequiredDeals.reduce(
    (total, deal) => total + deal.estimatedJobValue,
    0
  );
  const cashPipeline = cashDeals.reduce(
    (total, deal) => total + deal.estimatedJobValue,
    0
  );
  const financingAvailableContractors = visibleContractors.filter(
    (contractor) => contractor.financingStatus === 'financing_available'
  );
  const pendingFinancingContractors = visibleContractors.filter(
    (contractor) => contractor.financingStatus === 'pending_financing'
  );
  const cashOnlyContractors = visibleContractors.filter(
    (contractor) => contractor.financingStatus === 'cash_only'
  );
  const getRepName = (repId: string) =>
    users.find((user) => user.id === repId)?.name ?? repId;
  const getContractorName = (contractorId: string | null) =>
    contractors.find((contractor) => contractor.id === contractorId)
      ?.companyName ?? 'Unassigned';
  const getAppointmentDate = (dealId: string) =>
    appointments.find((appointment) => appointment.dealId === dealId)
      ?.appointmentDate;

  const metrics = [
    {
      label: 'Financing Required Deals',
      value: String(financingRequiredDeals.length),
      icon: BadgeDollarSign,
    },
    {
      label: 'Cash / Non-Financing Deals',
      value: String(cashDeals.length),
      icon: BadgeDollarSign,
    },
    {
      label: 'Financing Pipeline Value',
      value: formatCurrency(financingPipeline),
      icon: BadgeDollarSign,
    },
    {
      label: 'Cash Pipeline Value',
      value: formatCurrency(cashPipeline),
      icon: BadgeDollarSign,
    },
    {
      label: 'Financing-Enabled Contractors',
      value: String(financingAvailableContractors.length),
      icon: UsersRound,
    },
    {
      label: 'Pending-Financing Contractors',
      value: String(pendingFinancingContractors.length),
      icon: UsersRound,
    },
    {
      label: 'Cash-Only Contractors',
      value: String(cashOnlyContractors.length),
      icon: UsersRound,
    },
  ];

  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#32639b]">
          Financing Dashboard
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.02em]">
          Financing pipeline workspace
        </h1>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className="rounded-[0.5rem] border border-white bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  {metric.label}
                </p>
                <p className="mt-3 text-2xl font-black tracking-[-0.02em]">
                  {metric.value}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-[0.5rem] bg-[#e8f1fb] text-[#1B3C6C]">
                <metric.icon className="h-5 w-5" />
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        {[
          ['Financing Required', financingRequiredDeals],
          ['Cash / Financing Not Required', cashDeals],
        ].map(([label, deals]) => (
          <article
            key={label as string}
            className="rounded-[0.5rem] border border-white bg-white p-4 shadow-sm sm:p-5"
          >
            <h2 className="text-xl font-black tracking-[-0.01em]">
              {label as string}
            </h2>
            <div className="mt-4 space-y-3">
              {(deals as Deal[]).length > 0 ? (
                (deals as Deal[]).map((deal) => (
                  <DealCard
                    key={deal.id}
                    appointmentDate={getAppointmentDate(deal.id)}
                    assignedContractor={getContractorName(
                      deal.assignedContractorId
                    )}
                    assignedRep={getRepName(deal.assignedRepId)}
                    deal={deal}
                  />
                ))
              ) : (
                <p className="rounded-[0.5rem] border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                  No deals in this group.
                </p>
              )}
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-[0.5rem] border border-white bg-white p-4 shadow-sm sm:p-5">
        <div className="border-b border-slate-200 pb-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#32639b]">
            Financing Fit Helper
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.02em]">
            Possible contractor fits
          </h2>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {financingRequiredDeals.map((deal) => {
            const fits = getRecommendedContractors(
              deal,
              visibleContractors
            ).filter(
              (recommendation) =>
                recommendation.contractor.financingStatus ===
                'financing_available'
            );

            return (
              <article
                key={deal.id}
                className="rounded-[0.5rem] border border-slate-200 bg-[#fbfdff] p-4"
              >
                <h3 className="text-lg font-black text-slate-950">
                  {deal.homeownerName} / {deal.projectType}
                </h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {deal.city} / {formatCurrency(deal.estimatedJobValue)}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {fits.length > 0 ? (
                    fits.map((recommendation) => (
                      <span
                        key={recommendation.contractor.id}
                        className="rounded-full bg-[#edf7ef] px-3 py-1 text-xs font-black text-[#287247]"
                      >
                        {recommendation.contractor.companyName} /{' '}
                        {recommendation.label}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                      No financing-enabled active contractors available
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        {[
          ['Financing Available', financingAvailableContractors],
          ['Pending Financing', pendingFinancingContractors],
          ['Cash Only', cashOnlyContractors],
        ].map(([label, group]) => (
          <article
            key={label as string}
            className="rounded-[0.5rem] border border-white bg-white p-4 shadow-sm sm:p-5"
          >
            <h2 className="text-xl font-black tracking-[-0.01em]">
              {label as string}
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {(group as Contractor[])[0]
                ? formatFinancingStatus((group as Contractor[])[0].financingStatus)
                : 'No contractors'}
            </p>
            <div className="mt-4 space-y-3">
              {(group as Contractor[]).length > 0 ? (
                (group as Contractor[]).map((contractor) => (
                  <ContractorCard key={contractor.id} contractor={contractor} />
                ))
              ) : (
                <p className="rounded-[0.5rem] border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                  No contractors in this group.
                </p>
              )}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
