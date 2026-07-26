import { CalendarDays, CheckCircle2, Clock } from 'lucide-react';
import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { torontoToday } from '../lib/time';
import ConsultationLinkExpired, { ConsultationLinkChecking } from '../components/ConsultationLinkExpired';
import { useCustomerLinkCheck } from '../lib/customerLinks';

/** Generate half-hour time slots from 8:00 AM to 7:00 PM. */
function buildTimeSlots(): Array<{ label: string; value: string }> {
  const slots: Array<{ label: string; value: string }> = [];
  for (let h = 8; h <= 19; h++) {
    for (const m of [0, 30]) {
      if (h === 19 && m === 30) break;
      const period = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      const label = `${h12}:${String(m).padStart(2, '0')} ${period}`;
      const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      slots.push({ label, value });
    }
  }
  return slots;
}

const TIME_SLOTS = buildTimeSlots();

/** Today's date (Ontario time), used as the min attribute on the date picker. */
function todayISO(): string {
  return torontoToday();
}

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function ConsultationReschedule() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('t') ?? '';
  // The browser cannot verify a token — the signing secret is server-side only.
  // The presence of `t` proves nothing, so the server checks signature, expiry,
  // appointment id and action purpose before any control here is rendered.
  const linkState = useCustomerLinkCheck(id, 'reschedule', token);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const refId = id
    ? `#${id.replace(/-/g, '').slice(-8).toUpperCase()}`
    : '#—';

  const canSubmit = date.trim() && time.trim() && status !== 'loading';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !id) return;

    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/customer-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'reschedule',
          appointmentId: id,
          token,
          preferredDate: date,
          preferredTime: time,
          notes: notes.trim() || undefined,
        }),
      });

      const data: unknown = await res.json();

      if (!res.ok) {
        const msg =
          data &&
          typeof data === 'object' &&
          'error' in data &&
          typeof (data as { error: unknown }).error === 'string'
            ? (data as { error: string }).error
            : 'Something went wrong. Please try again.';
        setErrorMsg(msg);
        setStatus('error');
        return;
      }

      setStatus('success');
    } catch {
      setErrorMsg('Network error. Please check your connection and try again.');
      setStatus('error');
    }
  };

  if (linkState.status === 'checking') {
    return <ConsultationLinkChecking />;
  }
  if (linkState.status === 'invalid') {
    return <ConsultationLinkExpired action="reschedule" reference={refId} />;
  }

  if (status === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f4f8] p-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Request received
          </h1>
          <p className="mt-3 text-base leading-relaxed text-slate-600">
            We've received your reschedule request for consultation{' '}
            <span className="font-bold text-slate-800">{refId}</span>. Our
            team will confirm your new appointment time shortly.
          </p>
          <p className="mt-4 text-sm font-semibold text-slate-400">
            OntarioReno
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f0f4f8] p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mb-3 inline-flex items-center justify-center rounded-2xl bg-[#1B3C6C] px-5 py-2">
            <span className="text-sm font-bold tracking-widest text-white/80 uppercase">
              OntarioReno
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            Reschedule Consultation
          </h1>
          <p className="mt-2 text-slate-500">
            Reference {refId} · Tell us when works best and we'll confirm.
          </p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-white p-6 shadow-xl sm:p-8"
        >
          {/* Date */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <CalendarDays className="h-4 w-4 text-[#1B3C6C]" />
              Preferred date
            </label>
            <input
              type="date"
              required
              min={todayISO()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold text-slate-900 focus:border-[#1B3C6C] focus:outline-none focus:ring-2 focus:ring-[#1B3C6C]/20"
            />
          </div>

          {/* Time */}
          <div className="mt-5 space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <Clock className="h-4 w-4 text-[#1B3C6C]" />
              Preferred time
            </label>
            <select
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold text-slate-900 focus:border-[#1B3C6C] focus:outline-none focus:ring-2 focus:ring-[#1B3C6C]/20"
            >
              <option value="">Select a time</option>
              {/* Submit the 24-hour value, not the display label — the API
                  stores this straight into Appointment.appointmentTime, which
                  every downstream reader parses as "HH:MM". */}
              {TIME_SLOTS.map((slot) => (
                <option key={slot.value} value={slot.value}>
                  {slot.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="mt-5 space-y-1.5">
            <label className="text-sm font-bold text-slate-700">
              Additional notes{' '}
              <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any preferences or context for the team…"
              className="block w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-[#1B3C6C] focus:outline-none focus:ring-2 focus:ring-[#1B3C6C]/20"
            />
          </div>

          {/* Error */}
          {status === 'error' && errorMsg && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {errorMsg}
            </p>
          )}

          {/* Actions */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 rounded-xl bg-[#1B3C6C] px-6 py-3.5 text-base font-bold text-white shadow-sm transition hover:bg-[#153158] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === 'loading' ? 'Sending…' : 'Request Reschedule'}
            </button>
            <a
              href={`/portal/consultation/${id}/cancel?t=${encodeURIComponent(linkState.siblingToken)}`}
              className="flex-1 rounded-xl border border-slate-200 px-6 py-3.5 text-center text-base font-bold text-slate-600 transition hover:bg-slate-50"
            >
              Cancel instead
            </a>
          </div>

          <p className="mt-5 text-center text-xs text-slate-400">
            Your request will be reviewed by our team. You'll receive a
            confirmation once the appointment is updated.
          </p>
        </form>
      </div>
    </div>
  );
}
