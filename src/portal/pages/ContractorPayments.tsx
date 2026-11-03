// The contractor's payments dashboard (PJ at Galaxy).
//
// Every job paid in two parts, with its 45-day countdown and the FULL amounts:
// total commission, paid so far, and the balance due. He knows the rate, and
// he is the one paying, so nothing is hidden here except how the total divides
// between the rep and the house — which the server never sends.

import { AlarmClock, CheckCircle2, CircleAlert, CircleDollarSign, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDateKey, type BalanceClockStatus } from '../data/balanceClock';
import { money, useContractorPayments } from '../data/contractorPayments';

const tone: Record<BalanceClockStatus, string> = {
  running: 'bg-slate-100 text-slate-700',
  due_soon: 'bg-amber-100 text-amber-800',
  due: 'bg-emerald-500 text-white',
  overdue: 'bg-red-600 text-white',
  settled: 'bg-emerald-100 text-emerald-700',
};

const bar: Record<BalanceClockStatus, string> = {
  running: 'bg-[#1B3C6C]',
  due_soon: 'bg-amber-400',
  due: 'bg-emerald-500',
  overdue: 'bg-red-500',
  settled: 'bg-emerald-400',
};

function Stat({ label, value, detail, Icon }: { label: string; value: string; detail: string; Icon: typeof Wallet }) {
  return (
    <article className="rounded-[0.5rem] border border-white bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-black tracking-[-0.02em] text-slate-950">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-[0.5rem] bg-[#e8f1fb] text-[#1B3C6C]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 text-sm font-medium text-slate-500">{detail}</p>
    </article>
  );
}

/**
 * The balances themselves. `compact` is the dashboard version: cards and open
 * balances only, with a link through to the full page.
 */
export function PaymentsOverview({ compact = false }: { compact?: boolean }) {
  const { status, rows } = useContractorPayments(true);
  if (status === 'error') {
    return (
      <div className="flex items-start gap-3 rounded-[0.5rem] border border-amber-300 bg-amber-50 p-4">
        <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        <div>
          <p className="text-sm font-black text-amber-900">Payments couldn't be loaded right now.</p>
          <p className="mt-0.5 text-sm font-semibold text-amber-800">
            This is a loading problem, not a sign that nothing is owed. Refresh the page to try again.
          </p>
        </div>
      </div>
    );
  }
  const open = (rows ?? []).filter((r) => r.clock.status !== 'settled');
  const dueNow = open.filter((r) => r.clock.status === 'due' || r.clock.status === 'overdue');
  const upcoming = open.filter((r) => r.clock.status === 'running' || r.clock.status === 'due_soon');
  const settled = (rows ?? []).filter((r) => r.clock.status === 'settled');
  const sum = (list: typeof open) => list.reduce((s, r) => s + r.remaining, 0);

  return (
    <div className="space-y-4">
      <section className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <Stat label="Due now" value={money(sum(dueNow))} detail={`${dueNow.length} balance${dueNow.length !== 1 ? 's' : ''} due or overdue`} Icon={AlarmClock} />
        <Stat label="Coming up" value={money(sum(upcoming))} detail={`${upcoming.length} balance${upcoming.length !== 1 ? 's' : ''} on the clock`} Icon={CircleDollarSign} />
        <Stat label="Outstanding in total" value={money(sum(open))} detail="Everything still owed on these jobs" Icon={Wallet} />
      </section>

      <section className="overflow-hidden rounded-[0.5rem] border border-white bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <h2 className="text-lg font-black tracking-[-0.01em]">45-day balances</h2>
          {compact && (
            <Link to="/portal/cx-payments" className="text-sm font-black text-[#32639b] hover:underline">
              All payments →
            </Link>
          )}
        </div>
        {rows === null ? (
          <p className="p-6 text-sm font-semibold text-slate-400">Loading…</p>
        ) : open.length === 0 ? (
          <p className="p-6 text-sm font-semibold text-slate-500">Nothing outstanding. All balances are settled.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {open.map((r) => {
              const elapsed = Math.min(Math.max(r.clock.days - r.clock.daysRemaining, 0), r.clock.days);
              const pct = r.clock.days > 0 ? Math.round((elapsed / r.clock.days) * 100) : 100;
              return (
                <div key={r.dealId} className={`grid gap-3 px-4 py-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.6fr)_minmax(0,1.4fr)] md:items-center ${r.clock.status === 'overdue' ? 'bg-red-50' : r.clock.status === 'due' ? 'bg-emerald-50' : ''}`}>
                  <div className="min-w-0">
                    <p className="truncate font-black text-slate-950">
                      {r.homeownerName}
                      {r.isChangeOrder && (
                        <span className="ml-2 rounded-full bg-violet-100 px-2 py-0.5 align-middle text-[0.6rem] font-black uppercase tracking-wide text-violet-700">Change order</span>
                      )}
                    </p>
                    <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
                      {[r.city, r.projectType].filter(Boolean).join(' · ')} · sale {money(r.salePrice)}
                      {r.commissionRate !== null && ` · ${Number((r.commissionRate * 100).toFixed(2))}%`}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                      <span>Paid {formatDateKey(r.clock.startedOn)}</span>
                      <span>Due {formatDateKey(r.clock.dueOn)}</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-200">
                      <div className={`h-full rounded-full ${bar[r.clock.status]}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-black ${tone[r.clock.status]}`}>
                      {r.clock.status === 'overdue'
                        ? `${Math.abs(r.clock.daysRemaining)} days overdue`
                        : r.clock.status === 'due'
                          ? 'Due today'
                          : `${r.clock.daysRemaining} days left`}
                    </span>
                  </div>
                  <div className="md:text-right">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Balance due</p>
                    <p className="text-2xl font-black text-slate-950">{money(r.remaining)}</p>
                    <p className="text-xs font-semibold text-slate-500">
                      of {money(r.totalCommission)} total · {money(r.paid)} paid
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {!compact && settled.length > 0 && (
        <section className="overflow-hidden rounded-[0.5rem] border border-white bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-lg font-black tracking-[-0.01em]">Settled</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {settled.map((r) => (
              <div key={r.dealId} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <span className="font-black text-slate-800">
                  {r.homeownerName} <span className="font-semibold text-slate-500">· {r.projectType}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  {money(r.totalCommission)} paid in full · {formatDateKey(r.clock.settledOn)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function ContractorPayments() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#32639b]">Payments</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.02em]">Commission balances</h1>
        <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-500">
          Jobs paid in two parts. The balance on each is due 45 days after the first payment.
        </p>
      </header>
      <PaymentsOverview />
    </div>
  );
}
