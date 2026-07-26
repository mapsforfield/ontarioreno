import { LinkIcon } from 'lucide-react';

/**
 * Shown when a customer reschedule/cancel link carries no valid signature.
 *
 * Older confirmation emails contain unsigned links that authorized changes on
 * the appointment id alone. Those links no longer carry any authority, so the
 * homeowner is routed to a person instead of a form they cannot submit.
 */
export default function ConsultationLinkExpired({
  action,
  reference,
}: {
  action: 'reschedule' | 'cancel';
  reference: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f0f4f8] p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <LinkIcon className="h-8 w-8 text-amber-600" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          This link is no longer valid
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-600">
          For your security, links to {action} a consultation now expire. Your
          appointment has <span className="font-bold text-slate-800">not</span>{' '}
          been changed.
        </p>
        <p className="mt-4 text-base leading-relaxed text-slate-600">
          Please contact us and we&apos;ll take care of it for you — reply to your
          confirmation email, or write to{' '}
          <a
            href="mailto:info@ontarioreno.ca"
            className="font-bold text-[#1B3C6C] underline underline-offset-2"
          >
            info@ontarioreno.ca
          </a>
          .
        </p>
        <p className="mt-6 text-sm font-semibold text-slate-400">
          Reference {reference} · OntarioReno
        </p>
      </div>
    </div>
  );
}
