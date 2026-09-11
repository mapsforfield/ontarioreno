// The 45-day balance clock, as a control.
//
// One component so the Commissions table and the deal drawer cannot show a
// different countdown for the same deal — the rule itself lives in
// data/balanceClock.ts, and this is only its face.
//
// Deliberately quiet when no clock is running: a single "Start 45-day clock"
// link. Most deals are paid in one go and should not grow a countdown widget
// they will never use.

import { useState } from 'react';
import { AlarmClock, Check, X } from 'lucide-react';
import {
  balanceClock,
  DEFAULT_BALANCE_CLOCK_DAYS,
  formatDateKey,
  type BalanceClockFields,
  type BalanceClockStatus,
} from '../data/balanceClock';
import { torontoToday } from '../lib/time';

type ClockUpdates = Partial<BalanceClockFields>;

type Props = {
  commission: BalanceClockFields | undefined | null;
  /** Admins start, edit and settle the clock. Everyone else reads it. */
  canEdit: boolean;
  onChange: (updates: ClockUpdates) => void;
  /** `cell` fits the Commissions table; `panel` is the deal drawer block. */
  variant?: 'cell' | 'panel';
};

const tone: Record<BalanceClockStatus, string> = {
  running: 'border-slate-200 bg-slate-50 text-slate-600',
  due_soon: 'border-amber-200 bg-amber-50 text-amber-700',
  due: 'border-orange-200 bg-orange-50 text-orange-700',
  overdue: 'border-red-200 bg-red-50 text-red-700',
  settled: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

const label: Record<BalanceClockStatus, string> = {
  running: 'Balance clock',
  due_soon: 'Balance due soon',
  due: 'Balance due today',
  overdue: 'Balance overdue',
  settled: 'Balance settled',
};

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

  const commit = (updates: ClockUpdates) => {
    setDraftStart(null);
    onChange(updates);
  };

  if (draftStart !== null) {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <input
          type="date"
          value={draftStart}
          autoFocus
          onChange={(event) => setDraftStart(event.target.value)}
          className="rounded-[0.4rem] border border-slate-200 px-2 py-1 text-xs font-bold"
          title="The day the first (25% / 50%) payment was received"
        />
        <button
          type="button"
          title="Start the countdown from this date"
          onClick={() =>
            draftStart
              ? commit({
                  balanceClockStartedAt: draftStart,
                  balanceClockDays: commission?.balanceClockDays ?? DEFAULT_BALANCE_CLOCK_DAYS,
                  balanceSettledAt: '',
                })
              : setDraftStart(null)
          }
          className="rounded-[0.4rem] bg-[#1B3C6C] p-1 text-white transition hover:bg-[#153158]"
        >
          <Check className="h-3.5 w-3.5" />
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
    );
  }

  if (!clock.active) {
    if (!canEdit) return null;
    return (
      <button
        type="button"
        onClick={() => setDraftStart(today)}
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
          ? 'Due today'
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
      </p>
      {canEdit && (
        <div className="flex flex-wrap items-center gap-2 text-[0.6rem] font-black uppercase tracking-wide text-slate-400">
          <button
            type="button"
            onClick={() => setDraftStart(clock.startedOn)}
            className="transition hover:text-[#1B3C6C]"
          >
            Edit date
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
              title="The remainder has been received — stops the countdown"
              onClick={() => commit({ balanceSettledAt: today })}
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
