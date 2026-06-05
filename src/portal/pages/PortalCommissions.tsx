import {
  BadgeDollarSign,
  Banknote,
  CircleDollarSign,
  HandCoins,
  TrendingUp,
} from 'lucide-react';
import { usePortalAuth } from '../auth';
import {
  formatCurrency,
  formatDealStatus,
} from '../data/selectors';
import { usePortalData } from '../data/store';
import { CommissionPayoutStatus, Deal } from '../data/types';

const projectedStatuses = [
  'new_lead',
  'contacted',
  'appointment_booked',
  'quoted',
  'negotiating',
  'won',
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
    getDealsForRep,
    updateCommission,
    users,
  } = usePortalData();

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

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metricCard(
            'Total Pending Rep Commission',
            formatCurrency(calculateAdminPendingRepCommission()),
            'Won deals still owed',
            HandCoins
          )}
          {metricCard(
            'Total Admin Net Pending',
            formatCurrency(calculateAdminPendingNetCommission()),
            'Admin net on unpaid won deals',
            BadgeDollarSign
          )}
          {metricCard(
            'Total Projected Commission',
            formatCurrency(calculateAdminProjectedCommission()),
            'All active projected deals',
            TrendingUp
          )}
          {metricCard(
            'Paid Out to Reps',
            formatCurrency(calculateAdminPaidRepCommission()),
            'Recorded rep payouts',
            Banknote
          )}
        </section>

        <section className="overflow-hidden rounded-[0.5rem] border border-white bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4">
            <h2 className="text-lg font-black tracking-[-0.01em]">
              Commission table
            </h2>
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
                {adminRows.map(({ commission, deal }) => {
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
                            })
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
                            })
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
                            })
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
                            })
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
      </div>
    );
  }

  const repRows = visibleCommissions
    .map((commission) => ({
      commission,
      deal: visibleDeals.find((deal) => deal.id === commission.dealId),
    }))
    .filter((row) => row.deal);

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

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCard(
          'Pending Commission',
          formatCurrency(calculateRepPendingCommission(currentUser.id)),
          'Unpaid or partial won deals',
          HandCoins
        )}
        {metricCard(
          'Projected Commission',
          formatCurrency(calculateRepProjectedCommission(currentUser.id)),
          'Active deals at 5%',
          TrendingUp
        )}
        {metricCard(
          'Paid Commission',
          formatCurrency(calculateRepPaidCommission(currentUser.id)),
          'Recorded payouts',
          Banknote
        )}
        {metricCard(
          'Pipeline Value',
          formatCurrency(calculatePipelineValue(currentUser.id)),
          'Open renovation deal value',
          CircleDollarSign
        )}
      </section>

      <section className="rounded-[0.5rem] border border-white bg-white p-4 shadow-sm sm:p-5">
        <div className="border-b border-slate-200 pb-4">
          <h2 className="text-lg font-black tracking-[-0.01em]">
            Commission by Deal
          </h2>
        </div>
        <div className="mt-4 grid gap-3">
          {repRows.map(({ commission, deal }) => {
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
      </section>
    </div>
  );
}
