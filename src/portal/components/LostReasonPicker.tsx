import { useState } from 'react';
import { X } from 'lucide-react';
import { LOST_REASONS, type LostReasonKey } from '../../../lib/lost-reasons';

/**
 * One-tap "why did we lose it?" — big chips, optional note. Used inline in the
 * 30-second outcome sheet and as a dialog when a deal is moved to Lost.
 */
export function LostReasonChips({
  value,
  onChange,
}: {
  value: LostReasonKey | null;
  onChange: (next: LostReasonKey) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {LOST_REASONS.map((r) => (
        <button
          key={r.key}
          type="button"
          onClick={() => onChange(r.key)}
          className={`min-h-11 rounded-[0.6rem] border px-3 py-2 text-left text-sm font-bold transition ${
            value === r.key
              ? 'border-slate-800 bg-slate-800 text-white'
              : 'border-slate-200 bg-white text-slate-700 active:bg-slate-50'
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Asked whenever a deal moves to Lost. Never blocks the move: "Skip" still
 * marks it lost, just without a reason (the summary counts those separately).
 */
export default function LostReasonDialog({
  dealName,
  onConfirm,
  onCancel,
}: {
  dealName: string;
  onConfirm: (reason: LostReasonKey | null, note: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState<LostReasonKey | null>(null);
  const [note, setNote] = useState('');

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center bg-slate-950/45 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        className="portal-sheet w-full max-w-md rounded-t-[1.1rem] bg-white p-5 shadow-2xl sm:rounded-[0.8rem]"
        style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom, 0px))' }}
        role="dialog"
        aria-modal="true"
        aria-label="Why was this deal lost?"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Marking as lost</p>
            <h2 className="mt-1 text-xl font-black tracking-[-0.01em] text-slate-950">Why did {dealName || 'they'} say no?</h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500"
            aria-label="Cancel — keep the deal where it was"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4">
          <LostReasonChips value={reason} onChange={setReason} />
        </div>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Anything else? (optional)"
          className="mt-3"
        />
        <div className="mt-4 grid grid-cols-[auto_1fr] gap-2">
          <button
            type="button"
            onClick={() => onConfirm(null, '')}
            className="rounded-[0.6rem] border border-slate-200 px-4 py-3 text-sm font-bold text-slate-500"
          >
            Skip
          </button>
          <button
            type="button"
            disabled={!reason}
            onClick={() => onConfirm(reason, note.trim())}
            className="rounded-[0.6rem] bg-[#1B3C6C] px-4 py-3 text-sm font-black text-white disabled:opacity-40"
          >
            Mark as lost
          </button>
        </div>
      </div>
    </div>
  );
}
