import { useEffect, useRef, useState } from 'react';
import { CalendarClock, Check, MessageSquare, Phone, X, XCircle } from 'lucide-react';
import { usePortalAuth } from '../auth';
import { usePortalData } from '../data/store';
import { showToast } from '../lib/toast';
import { OPEN_REPLY_STATUSES } from '../../../lib/sms-reply-resolution';
import type { Appointment } from '../data/types';

/**
 * Homeowner texts that need a rep — top of Consultations.
 *
 * Every free-text reply to a booking is read and labelled server-side
 * (lib/sms-inbound.ts → lib/sms-reply-classify.ts), but NOTHING about the
 * booking changes until a rep taps one of these buttons. The label is a
 * suggestion; the homeowner's own words are always shown beside it, and every
 * button is available whatever the label says.
 */

export const REPLY_LABEL: Record<string, { label: string; tone: string }> = {
  cancel_requested: { label: 'Wants to cancel', tone: 'bg-red-100 text-red-700 ring-red-200' },
  reschedule_requested: { label: 'Wants to reschedule', tone: 'bg-amber-100 text-amber-800 ring-amber-200' },
  running_late: { label: 'Running late', tone: 'bg-sky-100 text-sky-800 ring-sky-200' },
  likely_confirmed: { label: 'Probably confirming', tone: 'bg-emerald-100 text-emerald-700 ring-emerald-200' },
  question: { label: 'Has a question', tone: 'bg-violet-100 text-violet-700 ring-violet-200' },
  needs_reading: { label: 'Needs reading', tone: 'bg-slate-200 text-slate-700 ring-slate-300' },
};

function fmtWhen(a: Appointment): string {
  if (!a.appointmentDate) return '';
  try {
    const d = new Date(`${a.appointmentDate}T12:00:00`).toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' });
    if (!a.appointmentTime) return d;
    const [h, m] = a.appointmentTime.split(':').map(Number);
    return `${d} · ${h % 12 || 12}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h >= 12 ? 'PM' : 'AM'}`;
  } catch {
    return a.appointmentDate;
  }
}

function fmtReceived(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Toronto' });
}

export default function RepliesBox({
  appointments,
  getRepName,
  onReschedule,
  highlightId,
}: {
  /** Already scoped to what this user may see. */
  appointments: Appointment[];
  getRepName: (id: string | null | undefined) => string;
  onReschedule: (appointment: Appointment) => void;
  highlightId?: string | null;
}) {
  const { currentUser, isAdmin } = usePortalAuth();
  const { updateAppointment } = usePortalData();
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const boxRef = useRef<HTMLElement | null>(null);

  const open = appointments
    .filter((a) => OPEN_REPLY_STATUSES.has(a.smsReplyStatus ?? ''))
    // An outcome is the job of whoever is in the house; so is this. Admin sees all.
    .filter((a) => isAdmin || a.assignedRepId === currentUser?.id)
    .sort((x, y) => (y.smsReplyAt ?? '').localeCompare(x.smsReplyAt ?? ''));

  useEffect(() => {
    if (highlightId && open.some((a) => a.id === highlightId)) {
      boxRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightId, open.length]);

  if (!currentUser || open.length === 0) return null;

  const clear = (a: Appointment, extra: Partial<Appointment> = {}, message?: string) => {
    updateAppointment(a.id, { ...extra, smsReplyStatus: '' }, currentUser);
    if (message) showToast({ variant: 'success', message });
  };

  return (
    <section ref={boxRef} className="scroll-mt-24 rounded-[0.6rem] border border-amber-200 bg-amber-50/60 p-3 shadow-sm sm:p-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-amber-700" />
        <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-800">
          Homeowner replies · {open.length}
        </p>
      </div>
      <p className="mt-1 text-xs font-semibold text-amber-900/70">
        Nothing has been changed — each booking stays as it is until you tap.
      </p>
      <div className="mt-3 space-y-2">
        {open.map((a) => {
          const meta = REPLY_LABEL[a.smsReplyStatus ?? ''] ?? REPLY_LABEL.needs_reading;
          const digits = (a.phone || '').replace(/[^\d+]/g, '');
          const isCancel = a.smsReplyStatus === 'cancel_requested';
          return (
            <article
              key={a.id}
              className={`rounded-[0.5rem] border bg-white p-3 ${
                highlightId === a.id ? 'border-[#1B3C6C] ring-2 ring-[#1B3C6C]/20' : 'border-white'
              }`}
            >
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className={`rounded-full px-2 py-0.5 text-[0.62rem] font-black uppercase tracking-wide ring-1 ${meta.tone}`}>
                  {meta.label}
                </span>
                <span className="text-sm font-black text-slate-900">{a.customerName || 'Homeowner'}</span>
                <span className="text-xs font-semibold text-slate-500">{fmtWhen(a)}</span>
                {isAdmin && <span className="text-xs font-semibold text-slate-400">· {getRepName(a.assignedRepId)}</span>}
              </div>
              <p className="mt-2 rounded-[0.4rem] bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800">
                “{a.smsReplyBody || '…'}”
                <span className="ml-2 text-[0.65rem] font-semibold text-slate-400">{fmtReceived(a.smsReplyAt)}</span>
              </p>

              {confirmCancelId === a.id ? (
                <div className="mt-2 flex flex-wrap items-center gap-2 rounded-[0.4rem] border border-red-200 bg-red-50 px-3 py-2">
                  <span className="text-xs font-bold text-red-800">Cancel this visit? Reminders stop; the homeowner is not texted.</span>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmCancelId(null);
                      clear(a, { status: 'cancelled' }, `Cancelled — ${a.customerName || 'visit'}`);
                    }}
                    className="rounded-[0.4rem] bg-red-600 px-3 py-1.5 text-xs font-black text-white"
                  >
                    Yes, cancel it
                  </button>
                  <button type="button" onClick={() => setConfirmCancelId(null)} className="px-2 py-1.5 text-xs font-bold text-slate-500">
                    Keep it
                  </button>
                </div>
              ) : (
                <div className="mt-2 grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap">
                  <button
                    type="button"
                    onClick={() => setConfirmCancelId(a.id)}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-[0.4rem] px-3 py-2 text-xs font-black ${
                      isCancel ? 'bg-red-600 text-white' : 'border border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <XCircle className="h-3.5 w-3.5" /> Cancel visit
                  </button>
                  <button
                    type="button"
                    onClick={() => onReschedule(a)}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-[0.4rem] px-3 py-2 text-xs font-black ${
                      a.smsReplyStatus === 'reschedule_requested' ? 'bg-amber-600 text-white' : 'border border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <CalendarClock className="h-3.5 w-3.5" /> Reschedule
                  </button>
                  <button
                    type="button"
                    onClick={() => clear(a, a.status === 'confirmed' ? {} : { status: 'confirmed' }, 'Marked confirmed')}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-[0.4rem] px-3 py-2 text-xs font-black ${
                      a.smsReplyStatus === 'likely_confirmed' ? 'bg-emerald-600 text-white' : 'border border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" /> Mark confirmed
                  </button>
                  {digits ? (
                    <a
                      href={`tel:${digits}`}
                      className="inline-flex items-center justify-center gap-1.5 rounded-[0.4rem] border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700"
                    >
                      <Phone className="h-3.5 w-3.5" /> Call
                    </a>
                  ) : (
                    <span />
                  )}
                  <button
                    type="button"
                    onClick={() => clear(a, {}, 'Reply marked as handled')}
                    className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-[0.4rem] px-3 py-2 text-xs font-bold text-slate-500 sm:col-span-1"
                  >
                    <X className="h-3.5 w-3.5" /> Handled — no change
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
