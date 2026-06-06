import { AlertCircle, CalendarDays, CheckCircle2, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';

type Step = 'choice' | 'reason' | 'success';

const CANCEL_REASONS = [
  'Schedule conflict',
  'Found another contractor',
  'Project on hold',
  'Budget constraints',
  'Already resolved the issue',
  'Other',
];

export default function ConsultationCancel() {
  const { id } = useParams<{ id: string }>();
  const [step, setStep] = useState<Step>('choice');
  const [selectedReason, setSelectedReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const refId = id
    ? `#${id.replace(/-/g, '').slice(-8).toUpperCase()}`
    : '#—';

  const effectiveReason =
    selectedReason === 'Other' ? otherReason.trim() : selectedReason;
  const canSubmit =
    selectedReason !== '' &&
    (selectedReason !== 'Other' || otherReason.trim().length > 0) &&
    !isLoading;

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !id) return;

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/customer-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'cancel',
          appointmentId: id,
          reason: effectiveReason,
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
        setIsLoading(false);
        return;
      }

      setStep('success');
    } catch {
      setErrorMsg('Network error. Please check your connection and try again.');
      setIsLoading(false);
    }
  };

  const header = (
    <div className="mb-6 text-center">
      <div className="mb-3 inline-flex items-center justify-center rounded-2xl bg-[#1B3C6C] px-5 py-2">
        <span className="text-sm font-bold tracking-widest text-white/80 uppercase">
          OntarioReno
        </span>
      </div>
      <h1 className="text-3xl font-black tracking-tight text-slate-900">
        Cancel Consultation
      </h1>
      <p className="mt-2 text-slate-500">Reference {refId}</p>
    </div>
  );

  if (step === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f4f8] p-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Cancellation received
          </h1>
          <p className="mt-3 text-base leading-relaxed text-slate-600">
            Your cancellation request for consultation{' '}
            <span className="font-bold text-slate-800">{refId}</span> has been
            received. Our team will update your appointment shortly.
          </p>
          <p className="mt-6 text-sm text-slate-400">
            Changed your mind?{' '}
            <a
              href={`/portal/consultation/${id}/reschedule`}
              className="font-semibold text-[#1B3C6C] underline-offset-2 hover:underline"
            >
              Request a reschedule instead
            </a>
          </p>
          <p className="mt-4 text-sm font-semibold text-slate-400">
            OntarioReno
          </p>
        </div>
      </div>
    );
  }

  if (step === 'choice') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f4f8] p-6">
        <div className="w-full max-w-lg">
          {header}
          <div className="rounded-2xl bg-white p-6 shadow-xl sm:p-8">
            <p className="mb-6 text-base text-slate-600">
              Before you cancel, would you prefer to reschedule instead? Our
              team can find a time that works better for you.
            </p>

            {/* Reschedule option */}
            <a
              href={`/portal/consultation/${id}/reschedule`}
              className="flex w-full items-start gap-4 rounded-xl border-2 border-[#1B3C6C] bg-[#f6faff] p-5 transition hover:bg-[#e8f1fb]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1B3C6C] text-white">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-bold text-[#1B3C6C]">
                  Reschedule instead
                </p>
                <p className="mt-0.5 text-sm text-slate-500">
                  Pick a new date and time — quick and easy.
                </p>
              </div>
            </a>

            {/* Cancel option */}
            <button
              type="button"
              onClick={() => setStep('reason')}
              className="mt-3 flex w-full items-start gap-4 rounded-xl border-2 border-slate-200 p-5 text-left transition hover:border-red-200 hover:bg-red-50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                <XCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-bold text-slate-800">
                  Cancel appointment
                </p>
                <p className="mt-0.5 text-sm text-slate-500">
                  We'll remove this consultation from our schedule.
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // step === 'reason'
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f0f4f8] p-6">
      <div className="w-full max-w-lg">
        {header}
        <form
          onSubmit={handleCancel}
          className="rounded-2xl bg-white p-6 shadow-xl sm:p-8"
        >
          <div className="mb-5 flex items-center gap-3 rounded-xl bg-amber-50 px-4 py-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
            <p className="text-sm font-semibold text-amber-800">
              This will cancel your consultation. This action cannot be undone.
            </p>
          </div>

          {/* Reason selector */}
          <div className="space-y-1.5">
            <p className="text-sm font-bold text-slate-700">
              Reason for cancellation
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {CANCEL_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-xl border-2 px-4 py-3 transition ${
                    selectedReason === reason
                      ? 'border-[#1B3C6C] bg-[#f6faff]'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={() => {
                      setSelectedReason(reason);
                      if (reason !== 'Other') setOtherReason('');
                    }}
                    className="accent-[#1B3C6C]"
                  />
                  <span className="text-sm font-semibold text-slate-700">
                    {reason}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Other reason free text */}
          {selectedReason === 'Other' && (
            <div className="mt-4 space-y-1.5">
              <label className="text-sm font-bold text-slate-700">
                Please describe
              </label>
              <textarea
                rows={3}
                required
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                placeholder="Tell us a bit more…"
                className="block w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-[#1B3C6C] focus:outline-none focus:ring-2 focus:ring-[#1B3C6C]/20"
              />
            </div>
          )}

          {/* Error */}
          {errorMsg && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {errorMsg}
            </p>
          )}

          {/* Actions */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setStep('choice')}
              className="flex-1 rounded-xl border border-slate-200 px-6 py-3.5 text-base font-bold text-slate-600 transition hover:bg-slate-50"
            >
              Go back
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 rounded-xl bg-red-600 px-6 py-3.5 text-base font-bold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? 'Cancelling…' : 'Confirm Cancellation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
