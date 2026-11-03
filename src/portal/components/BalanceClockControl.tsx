// The 45-day balance clock, as a control.
//
// One component so the Commissions table and the deal drawer cannot show a
// different countdown for the same deal — the rule itself lives in
// data/balanceClock.ts, and this is only its face.
//
// Deliberately quiet when no clock is running: a single "Start 45-day clock"
// link. Most deals are paid in one go and should not grow a countdown widget
// they will never use.
//
// Starting the clock also asks how much of the commission came in up front
// (25%, 50% or a custom %), and records that share against BOTH the rep's cut
// and the house's net in the same save. Before, the clock and the paid columns
// were filled in separately, so a half-paid deal sat at "0 paid" until someone
// remembered. Settling it marks both ledgers paid in full.

import { useState } from 'react';
import { AlarmClock, Check, X } from 'lucide-react';
import {
  balanceClock,
  DEFAULT_BALANCE_CLOCK_DAYS,
  formatDateKey,
  paidFraction,
  settledPaymentUpdates,
  upfrontPaymentUpdates,
  UPFRONT_PRESETS,
  type BalanceClockFields,
  type BalanceClockStatus,
} from '../data/balanceClock';
import { torontoToday } from '../lib/time';
import type { Commission } from '../data/types';

type ClockUpdates = Partial<
  BalanceClockFields & Pick<Commission, 'repPaidCommission' | 'adminNetPaidCommission'>
>;

type ClockCommission = BalanceClockFields &
  Partial<
    Pick<Commission, 'repEstimatedCommission' | 'repPaidCommission' | 'adminNetCommission'>
  >;

type Props = {
  commission: ClockCommission | undefined | null;
  /** Admins start, edit and settle the clock. Everyone else reads it. */
  canEdit: boolean;
  onChange: (updates: ClockUpdates) => void;
  /** `cell` fits the Commissions table; `panel` is the deal drawer block. */
  variant?: 'cell' | 'panel';
};

const tone: Record<BalanceClockStatus, string> = {
  running: 'border-slate-200 bg-slate-50 text-slate-600',
  due_soon: 'border-amber-200 bg-amber-50 text-amber-700',
  // Pay Day — solid green so it reads as the payoff, not as a warning.
  due: 'border-emerald-500 bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.55)]',
  overdue: 'border-red-200 bg-red-50 text-red-700',
  settled: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

const label: Record<BalanceClockStatus, string> = {
  running: 'Balance clock',
  due_soon: 'Balance due soon',
  due: 'Pay Day — balance due today',
  overdue: 'Balance overdue',
  settled: 'Balance settled',
};

const formatMoney = (amount: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 2 }).format(amount);

export default function BalanceClockControl({
  commission,
  canEdit,
  onChange,
  variant = 'cell',
}: Props) {
  const today = torontoToday();
  const clock = balanceClock(commission, today);
  // Only open while the admin is picking a start date. Defaults to today, but
  // is editable because the payment usually landed before anyone got round to
  // recording it — the Melo deal was two weeks old when this shipped.
  const [draftStart, setDraftStart] = useState<string | null>(null);
  // Share of the commission paid up front, as a whole-number percent string so
  // the custom box can hold a half-typed value. Defaults to 50% (Galaxy's
  // current terms), or to whatever is already recorded when editing.
  const [draftPercent, setDraftPercent] = useState('50');
  // The admin's net is only on an admin's client; without it the split can't
  // be applied to both ledgers, so the picker isn't offered at all.
  const canRecordSplit =
    canEdit && commission?.repEstimatedCommission != null && commission?.adminNetCommission != null;
  const ledger = {
    repEstimatedCommission: commission?.repEstimatedCommission ?? 0,
    adminNetCommission: commission?.adminNetCommission ?? 0,
  };
  const recordedPercent = Math.round(
    paidFraction({
      repEstimatedCommission: ledger.repEstimatedCommission,
      repPaidCommission: commission?.repPaidCommission ?? 0,
    }) * 100
  );

  const commit = (updates: ClockUpdates) => {
    setDraftStart(null);
    onChange(updates);
  };

  const openDraft = (start: string, percent: number) => {
    setDraftPercent(String(percent));
    setDraftStart(start);
  };

  if (draftStart !== null) {
    const percent = Number(draftPercent);
    const percentValid =
      draftPercent !== '' && Number.isFinite(percent) && percent >= 0 && percent <= 100;
    const isPreset = UPFRONT_PRESETS.some((p) => Math.round(p * 100) === percent);
    const amounts =
      canRecordSplit && percentValid ? upfrontPaymentUpdates(ledger, percent / 100) : null;
    return (
      <div className="space-y-2 rounded-[0.5rem] border border-[#d6e4f5] bg-white p-2.5 shadow-sm">
        <label className="block text-[0.6rem] font-black uppercase tracking-wide text-slate-500">
          First payment received on
          <input
            type="date"
            value={draftStart}
            autoFocus
            onChange={(event) => setDraftStart(event.target.value)}
            className="mt-1 block rounded-[0.4rem] border border-slate-200 px-2 py-1 text-xs font-bold normal-case tracking-normal text-slate-800"
            title="The day the first payment was received"
          />
        </label>
        {canRecordSplit && (
          <div>
            <p className="text-[0.6rem] font-black uppercase tracking-wide text-slate-500">
              How much was paid?
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {UPFRONT_PRESETS.map((preset) => {
                const value = Math.round(preset * 100);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDraftPercent(String(value))}
                    className={
                      percent === value
                        ? 'rounded-full bg-[#1B3C6C] px-3 py-1 text-xs font-black text-white'
                        : 'rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-600 transition hover:text-[#1B3C6C]'
                    }
                  >
                    {value}%
                  </button>
                );
              })}
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-black ${
                  !isPreset ? 'border-[#1B3C6C] text-[#1B3C6C]' : 'border-slate-200 text-slate-500'
                }`}
              >
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={isPreset ? '' : draftPercent}
                  placeholder="Custom"
                  onChange={(event) => setDraftPercent(event.target.value)}
                  className="w-14 border-0 bg-transparent p-0 text-xs font-black focus:outline-none focus:ring-0"
                  aria-label="Custom percent paid"
                />
                %
              </span>
            </div>
            {amounts && (
              <p className="mt-1.5 text-[0.68rem] font-semibold leading-4 text-slate-500">
                Rep paid{' '}
                <span className="font-black text-slate-800">
                  {formatMoney(amounts.repPaidCommission)}
                </span>
                {' · '}you received{' '}
                <span className="font-black text-slate-800">
                  {formatMoney(amounts.adminNetPaidCommission)}
                </span>
              </p>
            )}
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={!draftStart || (canRecordSplit && !percentValid)}
            onClick={() =>
              commit({
                balanceClockStartedAt: draftStart,
                balanceClockDays: commission?.balanceClockDays ?? DEFAULT_BALANCE_CLOCK_DAYS,
                balanceSettledAt: '',
                ...(amounts ?? {}),
              })
            }
            className="inline-flex items-center gap-1 rounded-[0.4rem] bg-[#1B3C6C] px-2.5 py-1 text-xs font-black text-white transition hover:bg-[#153158] disabled:opacity-40"
          >
            <Check className="h-3.5 w-3.5" />
            {clock.active ? 'Save' : 'Start clock'}
          </button>
          <button
            type="button"
            title="Cancel"
            onClick={() => setDraftStart(null)}
            className="rounded-[0.4rem] border border-slate-200 p-1 text-slate-400 transition hover:text-slate-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  if (!clock.active) {
    if (!canEdit) return null;
    return (
      <button
        type="button"
        onClick={() =>
          openDraft(today, recordedPercent > 0 && recordedPercent < 100 ? recordedPercent : 50)
        }
        title="For deals paid in two parts — records the day the first payment landed"
        className="inline-flex items-center gap-1 text-[0.6rem] font-black uppercase tracking-wide text-slate-400 transition hover:text-[#1B3C6C]"
      >
        <AlarmClock className="h-3 w-3" />
        Start {DEFAULT_BALANCE_CLOCK_DAYS}-day clock
      </button>
    );
  }

  const countdown =
    clock.status === 'settled'
      ? `Settled ${formatDateKey(clock.settledOn)}`
      : clock.status === 'overdue'
        ? `${Math.abs(clock.daysRemaining)}d overdue`
        : clock.status === 'due'
          ? '💰 Pay Day'
          : `${clock.daysRemaining}d left`;

  return (
    <div className={variant === 'panel' ? 'space-y-2' : 'space-y-1'}>
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-black ${tone[clock.status]}`}
        title={`${clock.days}-day term · started ${formatDateKey(clock.startedOn)}`}
      >
        <AlarmClock className="h-3.5 w-3.5" />
        {countdown}
      </span>
      <p className="text-[0.68rem] font-semibold leading-4 text-slate-500">
        {label[clock.status]} · paid {formatDateKey(clock.startedOn)} → due{' '}
        {formatDateKey(clock.dueOn)}
        {clock.status !== 'settled' && recordedPercent > 0 && recordedPercent < 100 && (
          <> · {recordedPercent}% paid so far</>
        )}
      </p>
      {canEdit && (
        <div className="flex flex-wrap items-center gap-2 text-[0.6rem] font-black uppercase tracking-wide text-slate-400">
          <button
            type="button"
            onClick={() => openDraft(clock.startedOn, recordedPercent)}
            className="transition hover:text-[#1B3C6C]"
          >
            {canRecordSplit ? 'Edit date / %' : 'Edit date'}
          </button>
          {clock.status === 'settled' ? (
            <button
              type="button"
              onClick={() => commit({ balanceSettledAt: '' })}
              className="transition hover:text-[#1B3C6C]"
            >
              Reopen
            </button>
          ) : (
            <button
              type="button"
              title="The remainder has been received: stops the countdown and marks both ledgers paid in full"
              onClick={() =>
                commit({
                  balanceSettledAt: today,
                  ...(canRecordSplit ? settledPaymentUpdates(ledger) : {}),
                })
              }
              className="transition hover:text-emerald-600"
            >
              Mark settled
            </button>
          )}
          <button
            type="button"
            title="Remove the clock from this deal entirely"
            onClick={() => commit({ balanceClockStartedAt: '', balanceSettledAt: '' })}
            className="transition hover:text-red-600"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
