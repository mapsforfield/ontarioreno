import { BriefcaseBusiness, CalendarDays, Search, UserRound, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortalAuth } from '../auth';
import { usePortalData } from '../data/store';

type Result = {
  kind: 'client' | 'deal' | 'consultation';
  id: string;
  title: string;
  subtitle: string;
};

/**
 * Portal-wide quick search (Cmd/Ctrl+K or "/"). Searches clients, deals and
 * consultations and jumps to the record. Read-only / navigation only.
 */
export default function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { clients, deals, getVisibleAppointmentsForUser } = usePortalData();
  const { currentUser } = usePortalAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ('');
      // focus after the modal paints
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const results = useMemo<Result[]>(() => {
    const term = q.trim().toLowerCase();
    if (term.length < 2) return [];
    const digits = term.replace(/\D/g, '');
    const matchText = (...vals: Array<string | null | undefined>) =>
      vals.some((v) => (v ?? '').toLowerCase().includes(term));
    const matchPhone = (p: string | null | undefined) =>
      digits.length >= 3 && (p ?? '').replace(/\D/g, '').includes(digits);

    const clientHits: Result[] = clients
      .filter((c) => matchText(c.name, c.email, c.city, c.address) || matchPhone(c.phone))
      .slice(0, 6)
      .map((c) => ({ kind: 'client', id: c.id, title: c.name, subtitle: [c.phone, c.city].filter(Boolean).join(' · ') || 'Client' }));

    const dealHits: Result[] = deals
      .filter((d) => matchText(d.homeownerName, d.projectType, d.city, d.address) || matchPhone(d.phone))
      .slice(0, 6)
      .map((d) => ({ kind: 'deal', id: d.id, title: d.homeownerName || 'Deal', subtitle: [d.projectType, d.city].filter(Boolean).join(' · ') || 'Deal' }));

    const appts = currentUser ? getVisibleAppointmentsForUser(currentUser) : [];
    const consultHits: Result[] = appts
      .filter((a) => matchText(a.customerName, a.title, a.projectType, a.city, a.address) || matchPhone(a.phone))
      .slice(0, 6)
      .map((a) => ({ kind: 'consultation', id: a.id, title: a.customerName || a.title || 'Consultation', subtitle: [a.appointmentDate, a.city].filter(Boolean).join(' · ') || 'Consultation' }));

    return [...clientHits, ...dealHits, ...consultHits];
  }, [q, clients, deals, currentUser, getVisibleAppointmentsForUser]);

  const go = (r: Result) => {
    onClose();
    if (r.kind === 'client') navigate('/portal/clients', { state: { openClientId: r.id } });
    else if (r.kind === 'deal') navigate('/portal/deals', { state: { openDealId: r.id } });
    else navigate('/portal/appointments', { state: { openAppointmentId: r.id } });
  };

  if (!open) return null;

  const icon = (kind: Result['kind']) =>
    kind === 'client' ? <UserRound className="h-4 w-4" /> : kind === 'deal' ? <BriefcaseBusiness className="h-4 w-4" /> : <CalendarDays className="h-4 w-4" />;
  const kindLabel = (kind: Result['kind']) => (kind === 'client' ? 'Client' : kind === 'deal' ? 'Deal' : 'Consultation');

  return (
    <div
      className="fixed inset-0 z-[130] flex items-start justify-center bg-slate-950/45 p-4 pt-[12vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-[0.6rem] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.3)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'Enter' && results[0]) go(results[0]);
            }}
            placeholder="Search clients, deals, consultations…"
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
          />
          <button type="button" onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[55vh] overflow-y-auto p-1.5">
          {q.trim().length < 2 ? (
            <p className="px-3 py-6 text-center text-sm font-semibold text-slate-400">Type at least 2 characters to search.</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm font-semibold text-slate-400">No matches found.</p>
          ) : (
            results.map((r) => (
              <button
                key={`${r.kind}-${r.id}`}
                type="button"
                onClick={() => go(r)}
                className="flex w-full items-center gap-3 rounded-[0.5rem] px-3 py-2.5 text-left hover:bg-[#f6faff]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.5rem] bg-[#e8f1fb] text-[#1B3C6C]">
                  {icon(r.kind)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-black text-slate-900">{r.title}</span>
                  <span className="block truncate text-xs font-semibold text-slate-400">{r.subtitle}</span>
                </span>
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-wide text-slate-500">
                  {kindLabel(r.kind)}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
