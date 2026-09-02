// The finance application on a client's profile.
//
// A finance application is stored per consultation, which is right — the
// numbers a lender saw belong to the application they saw them on. But a rep
// looking a customer up in Clients had no way to see any of it without
// remembering which consultation it was filled in on. This reads the client's
// consultations newest-first and shows the most recent application found, with
// a link straight to the consultation that owns it.
//
// Read-only on purpose. Editing happens on the consultation, so there is only
// ever one place a change can be made.

import { ArrowUpRight, Loader2, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortalData } from '../data/store';
import type { Appointment, FinancePayload } from '../data/types';

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  submitted: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-700',
  declined: 'bg-red-100 text-red-700',
};

function statusPill(status: string | undefined) {
  const key = status ?? 'draft';
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[0.62rem] font-black uppercase tracking-[0.08em] ${STATUS_STYLES[key] ?? STATUS_STYLES.draft}`}>
      {key}
    </span>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null;
  return (
    <div className="flex items-start justify-between gap-3 py-1">
      <span className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400">{label}</span>
      <span className="text-right text-sm font-bold text-slate-800">{value}</span>
    </div>
  );
}

export default function ClientFinanceCard({ appointments }: { appointments: Appointment[] }) {
  const { getFinance } = usePortalData();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [found, setFound] = useState<{ payload: FinancePayload; appointment: Appointment } | null>(null);

  // Newest consultation first, so the most recent application wins.
  const ordered = [...appointments].sort((a, b) =>
    `${b.appointmentDate}T${b.appointmentTime}`.localeCompare(`${a.appointmentDate}T${a.appointmentTime}`)
  );
  const key = ordered.map((a) => a.id).join(',');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setFound(null);
      for (const apt of ordered.slice(0, 8)) {
        const r = await getFinance(apt.id).catch(() => null);
        if (cancelled) return;
        if (r?.payload) {
          setFound({ payload: r.payload, appointment: apt });
          break;
        }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (loading) {
    return (
      <section className="rounded-[0.5rem] border border-slate-200 bg-white p-4">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Finance</p>
        <div className="flex items-center justify-center py-4 text-slate-300"><Loader2 className="h-5 w-5 animate-spin" /></div>
      </section>
    );
  }

  if (!found) {
    return (
      <section className="rounded-[0.5rem] border border-dashed border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Finance</p>
        <p className="mt-2 text-sm font-bold text-slate-400">No finance application yet</p>
        <p className="mt-0.5 text-xs font-semibold text-slate-400">
          Fill one in on a consultation&apos;s Finance tab and it will show here.
        </p>
      </section>
    );
  }

  const { payload, appointment } = found;
  const co = payload.coBorrower;
  const name = [payload.firstName, payload.middleName, payload.lastName].filter(Boolean).join(' ');

  return (
    <section className="rounded-[0.5rem] border border-[#c9d9eb] bg-[#f6faff] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-[#32639b]">
          <Wallet className="h-3.5 w-3.5" /> Finance
        </p>
        {statusPill(payload.status)}
      </div>
      <p className="mt-1 text-xs font-semibold text-slate-500">
        From the consultation on {appointment.appointmentDate}
      </p>

      <div className="mt-3 divide-y divide-slate-200 rounded-[0.5rem] border border-slate-200 bg-white px-3 py-1">
        <Row label="Applicant" value={name} />
        <Row label="Income" value={payload.incomeWithTaxes ?? ''} />
        <Row label="Employer" value={payload.employer ?? ''} />
        <Row label="Position" value={payload.employmentPosition ?? ''} />
        <Row
          label="Housing"
          value={payload.housingStatus === 'own' ? 'Owns (mortgage)' : payload.housingStatus === 'rent' ? 'Rents' : ''}
        />
      </div>

      {co?.enabled && (
        <div className="mt-3 rounded-[0.5rem] border border-slate-200 bg-white px-3 py-1">
          <div className="flex items-center justify-between gap-2 py-1.5">
            <span className="text-xs font-black uppercase tracking-[0.08em] text-slate-500">Co-borrower</span>
            {statusPill(co.status)}
          </div>
          <div className="divide-y divide-slate-200">
            <Row label="Name" value={co.name} />
            <Row label="Relationship" value={co.relationship} />
            <Row label="Income" value={co.incomeWithTaxes} />
            <Row label="Employer" value={co.employer} />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() =>
          navigate('/portal/appointments', {
            state: { openAppointmentId: appointment.id, panelTab: 'finance' },
          })
        }
        className="mt-3 inline-flex items-center gap-1.5 rounded-[0.5rem] border border-[#b8c9dd] bg-white px-3 py-2 text-xs font-bold text-[#1B3C6C] transition hover:bg-[#e8f1fb]"
      >
        Open in the consultation <ArrowUpRight className="h-3.5 w-3.5" />
      </button>
    </section>
  );
}
