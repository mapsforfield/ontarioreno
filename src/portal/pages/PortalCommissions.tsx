import {
  BadgeDollarSign,
  Banknote,
  CircleDollarSign,
  HandCoins,
  TrendingUp,
} from 'lucide-react';
import { lazy, Suspense, useEffect, useState } from 'react';
import { usePortalAuth } from '../auth';
import {
  formatCurrency,
  formatDealStatus,
} from '../data/selectors';
import { usePortalData } from '../data/store';
import { showToast } from '../lib/toast';
import type { InvoiceData } from '../components/CommissionInvoice';
const InvoiceViewer = lazy(() => import('../components/InvoiceViewer'));
import { CommissionInvoiceRecord, CommissionPayoutStatus, Deal, DealStatus } from '../data/types';

const projectedStatuses = [
  'new_lead',
  'appointment_booked',
  'quoted',
  'negotiating',
  'won',
];

const openDealStatuses = ['new_lead', 'appointment_booked', 'quoted', 'negotiating'];

const statusFilterOptions: Array<{ label: string; value: DealStatus | 'all' }> = [
  { label: 'All statuses', value: 'all' },
  { label: 'Won', value: 'won' },
  { label: 'Negotiating', value: 'negotiating' },
  { label: 'Quoted', value: 'quoted' },
  { label: 'Appointment Booked', value: 'appointment_booked' },
  { label: 'New Lead', value: 'new_lead' },
  { label: 'Lost', value: 'lost' },
];

function calculateRepEstimatedCommission(deal: Deal) {
  if (deal.status === 'lost') return 0;
  return Math.round(deal.estimatedJobValue * 0.05);
}

function metricCard(
  label: string,
  value: string,
  detail: string,
  Icon: typeof BadgeDollarSign
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

export default function PortalCommissions() {
  const { currentUser, isAdmin } = usePortalAuth();
  const {
    calculateAdminPaidRepCommission,
    calculateAdminPendingNetCommission,
    calculateAdminPendingRepCommission,
    calculateAdminProjectedCommission,
    calculatePipelineValue,
    calculateRepPaidCommission,
    calculateRepPendingCommission,
    calculateRepProjectedCommission,
    commissions,
    contractors,
    deals,
    defaultCommissionRate,
    getDealsForRep,
    listInvoices,
    setDefaultCommissionRate,
    updateCommission,
    users,
  } = usePortalData();
  const [rateInput, setRateInput] = useState(String(Math.round(defaultCommissionRate * 100)));
  const [rateSaved, setRateSaved] = useState(false);
  const [statusFilter, setStatusFilter] = useState<DealStatus | 'all'>('all');
  const [invoices, setInvoices] = useState<CommissionInvoiceRecord[]>([]);
  const [viewingInvoice, setViewingInvoice] = useState<InvoiceData | null>(null);

  const openInvoice = (inv: CommissionInvoiceRecord) => {
    if (!inv.snapshot) {
      showToast({ variant: 'default', message: 'No saved copy', description: 'This invoice predates re-view — open its deal to regenerate it.' });
      return;
    }
    try {
      setViewingInvoice(JSON.parse(inv.snapshot) as InvoiceData);
    } catch {
      showToast({ variant: 'error', message: 'Could not open this invoice.' });
    }
  };

  useEffect(() => {
    if (isAdmin) listInvoices().then(setInvoices).catch(() => {});
  }, [isAdmin, listInvoices]);

  if (!currentUser) return null;

  const reps = users.filter((user) => user.role === 'rep');
  const visibleDeals = isAdmin ? deals : getDealsForRep(currentUser.id);
  const visibleCommissions = isAdmin
    ? commissions
    : commissions.filter((commission) => commission.repId === currentUser.id);

  const getDeal = (dealId: string) =>
    deals.find((deal) => deal.id === dealId);
  const getContractorName = (deal: Deal | undefined) => {
    const contractor = contractors.find(
      (candidate) => candidate.id === deal?.assignedContractorId
    );

    return contractor?.companyName ?? 'Unassigned';
  };
  const getRepName = (repId: string) =>
    reps.find((rep) => rep.id === repId)?.name ?? repId;

  if (isAdmin) {
    const adminRows = visibleCommissions
      .map((commission) => ({
        commission,
        deal: getDeal(commission.dealId),
      }))
      .filter((row) => row.deal);

    // Filter rows by deal status, and recompute the summary totals so the
    // cards reflect exactly what's shown in the table below.
    const filteredRows = adminRows.filter(
      (row) => statusFilter === 'all' || row.deal!.status === statusFilter
    );

    const totals = filteredRows.reduce(
      (acc, { commission, deal }) => {
        if (!deal) return acc;
        acc.paidOut += commission.repPaidCommission;
        if (!deal.isHistorical && projectedStatuses.includes(deal.status)) {
          acc.projected += commission.adminTotalEstimatedCommission;
        }
        if (deal.status === 'won' && !deal.isHistorical && commission.payoutStatus !== 'paid') {
          acc.pendingRep += Math.max(
            commission.repEstimatedCommission - commission.repPaidCommission,
            0
          );
          acc.adminNetPending += commission.adminNetCommission;
        }
        return acc;
      },
      { projected: 0, pendingRep: 0, adminNetPending: 0, paidOut: 0 }
    );

    const filterLabel =
      statusFilterOptions.find((o) => o.value === statusFilter)?.label ?? 'All statuses';
    const isFiltered = statusFilter !== 'all';

    return (
      <div className="space-y-6">
        <header>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#32639b]">
            Commission Center
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.02em]">
            Admin payout visibility
          </h1>
        </header>

        {/* Status filter — drives both the cards and the table */}
        <section className="flex flex-wrap items-center gap-2 rounded-[0.5rem] border border-white bg-white p-3 shadow-sm">
          <span className="mr-1 text-xs font-black uppercase tracking-[0.12em] text-slate-400">Showing</span>
          {statusFilterOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStatusFilter(option.value)}
              className={
                statusFilter === option.value
                  ? 'rounded-full bg-[#1B3C6C] px-3.5 py-1.5 text-xs font-black text-white'
                  : 'rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-black text-slate-600 transition hover:text-[#1B3C6C]'
              }
            >
              {option.label}
            </button>
          ))}
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metricCard(
            'Total Pending Rep Commission',
            formatCurrency(totals.pendingRep),
            isFiltered ? `${filterLabel} · won deals still owed` : 'Won deals still owed',
            HandCoins
          )}
          {metricCard(
            'Total Admin Net Pending',
            formatCurrency(totals.adminNetPending),
            isFiltered ? `${filterLabel} · admin net on unpaid won` : 'Admin net on unpaid won deals',
            BadgeDollarSign
          )}
          {metricCard(
            'Total Projected Commission',
            formatCurrency(totals.projected),
            isFiltered ? `${filterLabel} deals only` : 'All active projected deals',
            TrendingUp
          )}
          {metricCard(
            'Paid Out to Reps',
            formatCurrency(totals.paidOut),
            isFiltered ? `${filterLabel} · recorded payouts` : 'Recorded rep payouts',
            Banknote
          )}
        </section>

        <section className="overflow-hidden rounded-[0.5rem] border border-white bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-4">
            <h2 className="text-lg font-black tracking-[-0.01em]">
              Commission table
              <span className="ml-2 text-sm font-bold text-slate-400">
                {filteredRows.length} {isFiltered ? filterLabel.toLowerCase() : ''} deal{filteredRows.length !== 1 ? 's' : ''}
              </span>
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-500">Default rate:</span>
              <div className="relative w-28">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={rateInput}
                  onChange={(e) => setRateInput(e.target.value)}
                  className="w-full rounded-[0.5rem] border border-slate-300 py-1.5 pl-3 pr-7 text-sm font-bold focus:border-[#32639b] focus:outline-none focus:ring-2 focus:ring-[#32639b]/20"
                />
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">%</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const val = parseFloat(rateInput);
                  if (isNaN(val) || val < 0 || val > 100) return;
                  const rate = val / 100;
                  setDefaultCommissionRate(rate);
                  // Update every commission row to the new rate
                  visibleCommissions.forEach((c) => {
                    const deal = getDeal(c.dealId);
                    if (!deal) return;
                    const newTotal = Math.round(deal.estimatedJobValue * rate);
                    const repEst = Math.round(deal.estimatedJobValue * 0.05);
                    updateCommission(c.id, {
                      adminTotalCommissionRate: rate,
                      adminTotalEstimatedCommission: newTotal,
                    }, currentUser ?? undefined);
                  });
                  setRateSaved(true);
                  setTimeout(() => setRateSaved(false), 3000);
                }}
                className="rounded-[0.5rem] bg-[#1B3C6C] px-3 py-1.5 text-sm font-bold text-white transition hover:bg-[#153158]"
              >
                Apply to All
              </button>
              {rateSaved && <span className="text-sm font-bold text-green-600">Saved!</span>}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[76rem] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Rep</th>
                  <th className="px-4 py-3">Deal</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Job Value</th>
                  <th className="px-4 py-3">Rep Commission</th>
                  <th className="px-4 py-3">Paid</th>
                  <th className="px-4 py-3">Payout</th>
                  <th className="px-4 py-3">Total Rate</th>
                  <th className="px-4 py-3">Total Commission</th>
                  <th className="px-4 py-3">Admin Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredRows.map(({ commission, deal }) => {
                  if (!deal) return null;
                  const repEstimatedCommission =
                    calculateRepEstimatedCommission(deal);
                  const remaining = Math.max(
                    repEstimatedCommission - commission.repPaidCommission,
                    0
                  );

                  return (
                    <tr key={commission.id} className="align-top">
                      <td className="px-4 py-4 font-bold text-slate-900">
                        {getRepName(commission.repId)}
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-black text-slate-950">
                          {deal.homeownerName}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {deal.projectType} - {getContractorName(deal)}
                        </p>
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-600">
                        {formatDealStatus(deal.status)}
                      </td>
                      <td className="px-4 py-4 font-black text-[#1B3C6C]">
                        {formatCurrency(deal.estimatedJobValue)}
                      </td>
                      <td className="px-4 py-4 font-black">
                        {formatCurrency(repEstimatedCommission)}
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          Remaining {formatCurrency(remaining)}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <input
                          type="number"
                          min={0}
                          value={commission.repPaidCommission}
                          onChange={(event) =>
                            updateCommission(commission.id, {
                              repPaidCommission:
                                Number(event.target.value) || 0,
                            }, currentUser)
                          }
                          className="w-28"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={commission.payoutStatus}
                          onChange={(event) =>
                            updateCommission(commission.id, {
                              payoutStatus: event.target
                                .value as CommissionPayoutStatus,
                            }, currentUser)
                          }
                        >
                          <option value="pending">Pending</option>
                          <option value="partial">Partial</option>
                          <option value="paid">Paid</option>
                        </select>
                      </td>
                      <td className="px-4 py-4">
                        <input
                          type="number"
                          min={0}
                          step={0.5}
                          value={commission.adminTotalCommissionRate * 100}
                          onChange={(event) =>
                            updateCommission(commission.id, {
                              adminTotalCommissionRate:
                                (Number(event.target.value) || 0) / 100,
                            }, currentUser)
                          }
                          className="w-24"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <input
                          type="number"
                          min={0}
                          value={commission.adminTotalEstimatedCommission}
                          onChange={(event) =>
                            updateCommission(commission.id, {
                              adminTotalEstimatedCommission:
                                Number(event.target.value) || 0,
                            }, currentUser)
                          }
                          className="w-32"
                        />
                      </td>
                      <td className="px-4 py-4 font-black text-slate-950">
                        {formatCurrency(
                          commission.adminTotalEstimatedCommission -
                            repEstimatedCommission
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {invoices.length > 0 && (
          <section className="overflow-hidden rounded-[0.5rem] border border-white bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#32639b]">Invoice History ({invoices.length})</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-500">Commission invoices you’ve sent, most recent first. Click a row to re-open it.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs font-black uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-2">Invoice</th>
                    <th className="px-4 py-2">Customer</th>
                    <th className="px-4 py-2">Contractor</th>
                    <th className="px-4 py-2 text-right">Net</th>
                    <th className="hidden px-4 py-2 sm:table-cell">Sent to</th>
                    <th className="px-4 py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr
                      key={inv.id}
                      onClick={() => openInvoice(inv)}
                      className="cursor-pointer border-b border-slate-50 transition hover:bg-[#f6faff]"
                    >
                      <td className="px-4 py-2 font-black text-slate-900">#{inv.invoiceNumber ?? '—'}</td>
                      <td className="px-4 py-2 font-semibold text-slate-700">{inv.customerName || '—'}</td>
                      <td className="px-4 py-2 font-semibold text-slate-700">{inv.contractorName || '—'}</td>
                      <td className="px-4 py-2 text-right font-black text-slate-900">
                        {formatCurrency(inv.netAmount)}
                        {inv.adjustmentsTotal !== 0 && (
                          <span className="ml-1 text-xs font-semibold text-slate-400">(adj {formatCurrency(inv.adjustmentsTotal)})</span>
                        )}
                      </td>
                      <td className="hidden px-4 py-2 font-semibold text-slate-500 sm:table-cell">{inv.sentTo || '—'}</td>
                      <td className="px-4 py-2 font-semibold text-slate-500">
                        {new Date(inv.createdAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {viewingInvoice && (
          <Suspense fallback={null}>
            <InvoiceViewer data={viewingInvoice} onClose={() => setViewingInvoice(null)} />
          </Suspense>
        )}
      </div>
    );
  }

  const repRows = visibleCommissions
    .map((commission) => ({
      commission,
      deal: visibleDeals.find((deal) => deal.id === commission.dealId),
    }))
    .filter((row) => row.deal);

  const repFilteredRows = repRows.filter(
    (row) => statusFilter === 'all' || row.deal!.status === statusFilter
  );
  const repIsFiltered = statusFilter !== 'all';
  const repFilterLabel =
    statusFilterOptions.find((o) => o.value === statusFilter)?.label ?? 'All statuses';

  // When filtered, recompute the cards from the visible rows; otherwise keep the
  // exact store totals so the default view is unchanged.
  const repTotals = repIsFiltered
    ? repFilteredRows.reduce(
        (acc, { commission, deal }) => {
          if (!deal) return acc;
          acc.paid += commission.repPaidCommission;
          if (!deal.isHistorical && projectedStatuses.includes(deal.status)) {
            acc.projected += commission.repEstimatedCommission;
          }
          if (deal.status === 'won' && !deal.isHistorical && commission.payoutStatus !== 'paid') {
            acc.pending += Math.max(commission.repEstimatedCommission - commission.repPaidCommission, 0);
          }
          if (!deal.isHistorical && openDealStatuses.includes(deal.status)) {
            acc.pipeline += deal.estimatedJobValue;
          }
          return acc;
        },
        { pending: 0, projected: 0, paid: 0, pipeline: 0 }
      )
    : {
        pending: calculateRepPendingCommission(currentUser.id),
        projected: calculateRepProjectedCommission(currentUser.id),
        paid: calculateRepPaidCommission(currentUser.id),
        pipeline: calculatePipelineValue(currentUser.id),
      };

  return (
    <div className="space-y-6">
      <header className="rounded-[0.5rem] border border-white bg-[linear-gradient(135deg,#ffffff_0%,#f7fbff_55%,#ecf4fd_100%)] p-5 shadow-md sm:p-7">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#32639b]">
          Commission Center
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.02em] text-slate-950 sm:text-4xl">
          Your commission scoreboard, {currentUser.name}.
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          Track projected payouts, won-deal commission, and rep payments from
          your local CRM pipeline.
        </p>
      </header>

      {/* Status filter — drives both the cards and the deal list */}
      <section className="flex flex-wrap items-center gap-2 rounded-[0.5rem] border border-white bg-white p-3 shadow-sm">
        <span className="mr-1 text-xs font-black uppercase tracking-[0.12em] text-slate-400">Showing</span>
        {statusFilterOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setStatusFilter(option.value)}
            className={
              statusFilter === option.value
                ? 'rounded-full bg-[#1B3C6C] px-3.5 py-1.5 text-xs font-black text-white'
                : 'rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-black text-slate-600 transition hover:text-[#1B3C6C]'
            }
          >
            {option.label}
          </button>
        ))}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCard(
          'Pending Commission',
          formatCurrency(repTotals.pending),
          repIsFiltered ? `${repFilterLabel} · unpaid won deals` : 'Unpaid or partial won deals',
          HandCoins
        )}
        {metricCard(
          'Projected Commission',
          formatCurrency(repTotals.projected),
          repIsFiltered ? `${repFilterLabel} deals at 5%` : 'Active deals at 5%',
          TrendingUp
        )}
        {metricCard(
          'Paid Commission',
          formatCurrency(repTotals.paid),
          repIsFiltered ? `${repFilterLabel} · recorded payouts` : 'Recorded payouts',
          Banknote
        )}
        {metricCard(
          'Pipeline Value',
          formatCurrency(repTotals.pipeline),
          'Open renovation deal value',
          CircleDollarSign
        )}
      </section>

      <section className="rounded-[0.5rem] border border-white bg-white p-4 shadow-sm sm:p-5">
        <div className="border-b border-slate-200 pb-4">
          <h2 className="text-lg font-black tracking-[-0.01em]">
            Commission by Deal
            <span className="ml-2 text-sm font-bold text-slate-400">
              {repFilteredRows.length} {repIsFiltered ? repFilterLabel.toLowerCase() : ''} deal{repFilteredRows.length !== 1 ? 's' : ''}
            </span>
          </h2>
        </div>
        {repFilteredRows.length === 0 ? (
          <p className="mt-4 rounded-[0.5rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">
            No {repIsFiltered ? repFilterLabel.toLowerCase() : ''} deals to show.
          </p>
        ) : (
        <div className="mt-4 grid gap-3">
          {repFilteredRows.map(({ commission, deal }) => {
            if (!deal) return null;
            const repEstimatedCommission = calculateRepEstimatedCommission(deal);
            const remaining = Math.max(
              repEstimatedCommission - commission.repPaidCommission,
              0
            );

            return (
              <article
                key={commission.id}
                className="rounded-[0.5rem] border border-slate-200 bg-[#fbfdff] p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-black text-slate-950">
                      {deal.homeownerName}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {deal.projectType} - {formatDealStatus(deal.status)}
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      Contractor: {getContractorName(deal)}
                    </p>
                  </div>
                  <div className="rounded-[0.5rem] bg-[#e8f1fb] px-4 py-3 text-[#1B3C6C]">
                    <p className="text-xs font-bold uppercase tracking-[0.12em]">
                      Rep estimated commission
                    </p>
                    <p className="mt-1 text-2xl font-black">
                      {formatCurrency(repEstimatedCommission)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                      Estimated job value
                    </p>
                    <p className="mt-1 font-black">
                      {formatCurrency(deal.estimatedJobValue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                      Paid amount
                    </p>
                    <p className="mt-1 font-black">
                      {formatCurrency(commission.repPaidCommission)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                      Remaining payout
                    </p>
                    <p className="mt-1 font-black">
                      {formatCurrency(remaining)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                      Payout status
                    </p>
                    <p className="mt-1 font-black capitalize">
                      {commission.payoutStatus}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                      Deal status
                    </p>
                    <p className="mt-1 font-black">
                      {formatDealStatus(deal.status)}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        )}
      </section>
    </div>
  );
}
