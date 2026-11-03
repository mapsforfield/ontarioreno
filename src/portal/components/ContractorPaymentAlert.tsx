// The loud reminder a contractor gets when a 45-day balance comes due.
//
// He is the person every one of these payments depends on, so this does not
// whisper: a pop-up the first time he opens the portal in a session while a
// balance is due or overdue, and a red banner on every page of his portal for
// as long as it stays unpaid. Inside the last week it is an amber heads-up
// instead — information, not an alarm.
//
// Dismissing the pop-up is remembered for this browser tab only, keyed on the
// balances that are due — so a NEW balance coming due brings it back.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlarmClock, X } from 'lucide-react';
import { formatDateKey } from '../data/balanceClock';
import { money, useContractorPayments } from '../data/contractorPayments';

export default function ContractorPaymentAlert() {
  const navigate = useNavigate();
  const { rows } = useContractorPayments(true);
  const due = (rows ?? []).filter((r) => r.clock.status === 'due' || r.clock.status === 'overdue');
  const soon = (rows ?? []).filter((r) => r.clock.status === 'due_soon');
  const dueKey = `or-cx-due-seen:${due.map((r) => `${r.dealId}@${r.clock.dueOn}`).join(',')}`;
  const [dismissed, setDismissed] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('or-cx-due-dismissed');
    } catch {
      return null;
    }
  });
  if (!rows) return null;

  const dueTotal = due.reduce((s, r) => s + r.remaining, 0);
  const soonTotal = soon.reduce((s, r) => s + r.remaining, 0);
  const overdue = due.some((r) => r.clock.status === 'overdue');
  const showPopup = due.length > 0 && dismissed !== dueKey;

  const dismiss = () => {
    setDismissed(dueKey);
    try {
      sessionStorage.setItem('or-cx-due-dismissed', dueKey);
    } catch {
      /* the pop-up just returns next load */
    }
  };
  const goToPayments = () => {
    dismiss();
    navigate('/portal/cx-payments');
  };

  return (
    <>
      {due.length > 0 && (
        <button
          type="button"
          onClick={goToPayments}
          className={`mb-4 flex w-full items-center gap-3 rounded-[0.5rem] border-2 px-4 py-3 text-left ${
            overdue ? 'border-red-400 bg-red-50' : 'border-emerald-400 bg-emerald-50'
          }`}
        >
          <AlarmClock className={`h-5 w-5 shrink-0 ${overdue ? 'text-red-600' : 'text-emerald-700'}`} />
          <span className={`min-w-0 flex-1 text-sm font-black ${overdue ? 'text-red-900' : 'text-emerald-900'}`}>
            {overdue ? 'Payment overdue' : 'Payment due today'}: {money(dueTotal)} on {due.length} job{due.length !== 1 ? 's' : ''}
            <span className="ml-1 font-semibold">— tap to see the details</span>
          </span>
        </button>
      )}
      {due.length === 0 && soon.length > 0 && (
        <button
          type="button"
          onClick={goToPayments}
          className="mb-4 flex w-full items-center gap-3 rounded-[0.5rem] border border-amber-300 bg-amber-50 px-4 py-3 text-left"
        >
          <AlarmClock className="h-5 w-5 shrink-0 text-amber-700" />
          <span className="min-w-0 flex-1 text-sm font-black text-amber-900">
            Coming up: {money(soonTotal)} due {soon.length === 1 ? `on ${formatDateKey(soon[0].clock.dueOn)}` : `on ${soon.length} jobs this week`}
          </span>
        </button>
      )}

      {showPopup && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="w-full max-w-md overflow-hidden rounded-[0.75rem] bg-white shadow-2xl">
            <div className={`flex items-start justify-between gap-3 px-5 py-4 ${overdue ? 'bg-red-600' : 'bg-emerald-600'} text-white`}>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 animate-pulse items-center justify-center rounded-full bg-white/20">
                  <AlarmClock className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] opacity-90">
                    {overdue ? 'Payment overdue' : 'Payment due today'}
                  </p>
                  <p className="text-2xl font-black">{money(dueTotal)}</p>
                </div>
              </div>
              <button type="button" onClick={dismiss} aria-label="Close" className="rounded-full p-1 hover:bg-white/20">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-2 px-5 py-4">
              {due.map((r) => (
                <div key={r.dealId} className="flex items-start justify-between gap-3 rounded-[0.5rem] border border-slate-200 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-900">{r.homeownerName}</p>
                    <p className="text-xs font-semibold text-slate-500">
                      {r.clock.status === 'overdue'
                        ? `${Math.abs(r.clock.daysRemaining)} days overdue · was due ${formatDateKey(r.clock.dueOn)}`
                        : `Due today · ${formatDateKey(r.clock.dueOn)}`}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-black text-slate-900">{money(r.remaining)}</p>
                </div>
              ))}
              <p className="pt-1 text-xs font-semibold text-slate-500">
                The balance of the commission, {due[0]?.clock.days ?? 45} days after the first payment.
              </p>
            </div>
            <div className="flex gap-2 border-t border-slate-100 px-5 py-3">
              <button
                type="button"
                onClick={goToPayments}
                className="flex-1 rounded-[0.5rem] bg-[#1B3C6C] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[#153158]"
              >
                View payments
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="rounded-[0.5rem] border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
