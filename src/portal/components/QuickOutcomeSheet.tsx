import { useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, Clock, FileText, Trophy, UserX, X, XCircle } from 'lucide-react';
import { usePortalAuth } from '../auth';
import { usePortalData } from '../data/store';
import { addDays } from '../data/balanceClock';
import { torontoToday } from '../lib/time';
import { showToast } from '../lib/toast';
import { LostReasonChips } from './LostReasonPicker';
import { lostReasonLabel, type LostReasonKey } from '../../../lib/lost-reasons';
import type { Appointment, ConsultationNextStep, ConsultationStage, ConsultationInterestLevel } from '../data/types';

/**
 * The 30-second visit outcome. Opened from the "How did it go?" push, from the
 * Attention list, and from any past visit that has no outcome yet.
 *
 * It writes exactly the fields the full Outcome tab writes (same names, same
 * meaning), so the two can never disagree; the store then syncs value,
 * financing, won/lost and the follow-up date onto the linked deal the same way
 * it does for the long form. The full Outcome tab is untouched and still there
 * for anything this does not cover (recommended contractor, close probability,
 * objections).
 */

type Result = 'quote' | 'thinking' | 'sold' | 'lost' | 'no_show';

const RESULTS: Array<{
  key: Result;
  label: string;
  hint: string;
  icon: typeof FileText;
  tone: string;
}> = [
  { key: 'quote', label: 'Wants a quote', hint: 'Estimate to send', icon: FileText, tone: 'border-sky-300 bg-sky-50 text-sky-900' },
  { key: 'thinking', label: 'Thinking it over', hint: 'Follow up later', icon: Clock, tone: 'border-amber-300 bg-amber-50 text-amber-900' },
  { key: 'sold', label: 'Sold', hint: 'They said yes', icon: Trophy, tone: 'border-emerald-400 bg-emerald-50 text-emerald-900' },
  { key: 'lost', label: 'Not interested', hint: 'Mark as lost', icon: XCircle, tone: 'border-slate-400 bg-slate-100 text-slate-900' },
  { key: 'no_show', label: 'No-show', hint: "Visit didn't happen", icon: UserX, tone: 'border-rose-300 bg-rose-50 text-rose-900' },
];

const NEXT_STEP: Record<Exclude<Result, 'no_show'>, { nextStep: ConsultationNextStep; stage: ConsultationStage }> = {
  quote: { nextStep: 'estimate_required', stage: 'estimate_requested' },
  thinking: { nextStep: 'follow_up_required', stage: 'follow_up_required' },
  sold: { nextStep: 'won', stage: 'won' },
  lost: { nextStep: 'lost', stage: 'lost' },
};

const FOLLOW_UPS = [
  { label: 'Tomorrow', days: 1 },
  { label: '3 days', days: 3 },
  { label: '1 week', days: 7 },
  { label: '2 weeks', days: 14 },
];

function resultFrom(a: Appointment): Result | null {
  if (a.status === 'no_show') return 'no_show';
  if (!a.outcomeSubmitted) return null;
  switch (a.nextStep) {
    case 'estimate_required':
    case 'contractor_review':
      return 'quote';
    case 'follow_up_required':
      return 'thinking';
    case 'won':
      return 'sold';
    case 'lost':
      return 'lost';
    default:
      return null;
  }
}

export default function QuickOutcomeSheet({
  appointment,
  onClose,
  onOpenFullForm,
}: {
  appointment: Appointment;
  onClose: () => void;
  /** Opens the existing full appointment panel for everything else. */
  onOpenFullForm?: () => void;
}) {
  const { currentUser } = usePortalAuth();
  const { updateAppointment, updateDeal, deals } = usePortalData();
  const deal = useMemo(
    () => (appointment.dealId ? deals.find((d) => d.id === appointment.dealId) : undefined),
    [deals, appointment.dealId]
  );

  const today = torontoToday();
  const [result, setResult] = useState<Result | null>(() => resultFrom(appointment));
  const [value, setValue] = useState(() => {
    const v = appointment.estimatedProjectValue || deal?.estimatedJobValue || 0;
    return v > 0 ? String(Math.round(v)) : '';
  });
  const [followUp, setFollowUp] = useState(() => appointment.followUpDate || addDays(today, 3));
  const [financing, setFinancing] = useState<'yes' | 'no' | 'unknown'>(() =>
    appointment.financingNeeded === true ? 'yes' : appointment.financingNeeded === false ? 'no' : 'unknown'
  );
  const [interest, setInterest] = useState<ConsultationInterestLevel | ''>(() =>
    (appointment.homeownerInterestLevel as ConsultationInterestLevel | null) ?? ''
  );
  const [lostReason, setLostReason] = useState<LostReasonKey | null>(
    () => (appointment.lostReason as LostReasonKey | null) ?? null
  );
  const [note, setNote] = useState(appointment.outcomeNotes ?? '');
  const [saving, setSaving] = useState(false);

  const needsFollowUp = result === 'quote' || result === 'thinking';
  const showValue = result === 'quote' || result === 'thinking' || result === 'sold';
  const canSave = !!result && !saving;

  const save = () => {
    if (!result || !currentUser) return;
    setSaving(true);
    const now = new Date().toISOString();

    if (result === 'no_show') {
      updateAppointment(appointment.id, { status: 'no_show' }, currentUser);
      showToast({ variant: 'success', message: 'Marked as a no-show' });
      onClose();
      return;
    }

    const step = NEXT_STEP[result];
    const estimatedProjectValue = Number(value.replace(/[^0-9.]/g, '')) || 0;
    const financingNeeded = financing === 'unknown' ? null : financing === 'yes';
    updateAppointment(
      appointment.id,
      {
        status: 'completed',
        consultationStage: step.stage,
        nextStep: step.nextStep,
        estimatedProjectValue: showValue ? estimatedProjectValue : appointment.estimatedProjectValue,
        financingNeeded,
        homeownerInterestLevel:
          result === 'lost' ? 'not_interested' : interest || appointment.homeownerInterestLevel || null,
        followUpDate: needsFollowUp ? followUp : '',
        outcomeNotes: note.trim(),
        lostReason: result === 'lost' ? lostReason : null,
        outcomeSubmitted: true,
        outcomeSubmittedAt: appointment.outcomeSubmittedAt || now,
        outcomeSubmittedByUserId: appointment.outcomeSubmittedByUserId || currentUser.id,
      },
      currentUser
    );

    // The store already carries value, financing, won/lost and a "follow up"
    // date across to the linked deal. Two things it does not: the lost reason,
    // and the follow-up date when the next step is a quote.
    if (deal) {
      const extra: Parameters<typeof updateDeal>[1] = {};
      if (result === 'lost') {
        extra.lostReason = lostReason;
        extra.lostReasonNote = note.trim();
      }
      if (result === 'quote' && followUp) extra.nextFollowUpDate = followUp;
      if (Object.keys(extra).length > 0) updateDeal(deal.id, extra, currentUser);
    }

    showToast({
      variant: 'success',
      message: 'Outcome saved',
      description:
        result === 'lost'
          ? `Lost — ${lostReasonLabel(lostReason)}`
          : needsFollowUp
          ? `Follow-up set for ${followUp}`
          : deal
          ? 'Linked deal updated.'
          : undefined,
    });
    onClose();
  };

  const when = [appointment.appointmentDate, appointment.appointmentTime].filter(Boolean).join(' · ');

  return (
    <div className="fixed inset-0 z-[140] flex items-end justify-center bg-slate-950/45 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        className="portal-sheet flex max-h-[94dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[1.1rem] bg-white shadow-2xl sm:rounded-[0.8rem]"
        role="dialog"
        aria-modal="true"
        aria-label="Log the visit outcome"
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-slate-200 sm:hidden" aria-hidden="true" />
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 pb-3 pt-3">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#32639b]">How did it go?</p>
            <h2 className="mt-0.5 truncate text-xl font-black tracking-[-0.01em] text-slate-950">
              {appointment.customerName || appointment.title || 'Consultation'}
            </h2>
            <p className="truncate text-xs font-semibold text-slate-500">
              {[when, appointment.city].filter(Boolean).join(' · ')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-4">
          <div className="grid grid-cols-2 gap-2">
            {RESULTS.map((r) => {
              const Icon = r.icon;
              const active = result === r.key;
              return (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setResult(r.key)}
                  className={`flex min-h-[4.25rem] flex-col items-start justify-center gap-0.5 rounded-[0.7rem] border-2 px-3 py-2 text-left transition ${
                    active ? r.tone : 'border-slate-200 bg-white text-slate-700'
                  } ${r.key === 'no_show' ? 'col-span-2 min-h-12 flex-row items-center gap-2' : ''}`}
                  aria-pressed={active}
                >
                  <span className="flex items-center gap-2 text-sm font-black">
                    <Icon className="h-4 w-4 shrink-0" />
                    {r.label}
                    {active && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                  </span>
                  <span className="text-[0.7rem] font-semibold opacity-70">{r.hint}</span>
                </button>
              );
            })}
          </div>

          {result === 'lost' && (
            <section>
              <p className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-slate-500">Why not?</p>
              <LostReasonChips value={lostReason} onChange={setLostReason} />
            </section>
          )}

          {showValue && (
            <section>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-500" htmlFor="qo-value">
                Rough job value
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">$</span>
                <input
                  id="qo-value"
                  inputMode="numeric"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="75000"
                  className="pl-8 font-black"
                />
              </div>
            </section>
          )}

          {needsFollowUp && (
            <section>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                <CalendarClock className="h-3.5 w-3.5" /> Follow up
              </p>
              <div className="flex flex-wrap gap-2">
                {FOLLOW_UPS.map((f) => {
                  const date = addDays(today, f.days);
                  return (
                    <button
                      key={f.days}
                      type="button"
                      onClick={() => setFollowUp(date)}
                      className={`rounded-full border px-3.5 py-2 text-sm font-bold ${
                        followUp === date ? 'border-[#1B3C6C] bg-[#1B3C6C] text-white' : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
              <input
                type="date"
                value={followUp}
                min={today}
                onChange={(e) => setFollowUp(e.target.value)}
                className="mt-2"
                aria-label="Follow-up date"
              />
            </section>
          )}

          {result && result !== 'no_show' && (
            <section className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-slate-500">Financing?</p>
                <div className="flex gap-1.5">
                  {([['yes', 'Yes'], ['no', 'No'], ['unknown', 'Not sure']] as const).map(([v, l]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setFinancing(v)}
                      className={`flex-1 rounded-[0.5rem] border px-2 py-2 text-sm font-bold ${
                        financing === v ? 'border-[#1B3C6C] bg-[#e8f1fb] text-[#1B3C6C]' : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              {result !== 'lost' && (
                <div>
                  <p className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-slate-500">How keen?</p>
                  <div className="flex gap-1.5">
                    {([['hot', 'Hot'], ['warm', 'Warm'], ['cold', 'Cold']] as const).map(([v, l]) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setInterest(interest === v ? '' : v)}
                        className={`flex-1 rounded-[0.5rem] border px-2 py-2 text-sm font-bold ${
                          interest === v ? 'border-[#1B3C6C] bg-[#e8f1fb] text-[#1B3C6C]' : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {result && result !== 'no_show' && (
            <section>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-500" htmlFor="qo-note">
                Quick note <span className="font-semibold normal-case tracking-normal text-slate-400">(optional)</span>
              </label>
              <textarea
                id="qo-note"
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. wants a separate entrance, wife decides"
              />
            </section>
          )}

          {onOpenFullForm && (
            <button
              type="button"
              onClick={onOpenFullForm}
              className="text-xs font-bold text-[#32639b] underline-offset-2 hover:underline"
            >
              Open the full consultation instead
            </button>
          )}
        </div>

        <div
          className="border-t border-slate-100 bg-white px-5 pt-3"
          style={{ paddingBottom: 'max(0.9rem, env(safe-area-inset-bottom, 0px))' }}
        >
          <button
            type="button"
            disabled={!canSave || (result === 'lost' && !lostReason)}
            onClick={save}
            className="w-full rounded-[0.7rem] bg-[#1B3C6C] px-4 py-3.5 text-base font-black text-white shadow-sm transition disabled:opacity-40"
          >
            {!result ? 'Pick how it went' : result === 'lost' && !lostReason ? 'Pick a reason' : 'Save outcome'}
          </button>
        </div>
      </div>
    </div>
  );
}
