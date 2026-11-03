import { useMemo, useState } from 'react';
import { Mail, MapPin, Phone, Search } from 'lucide-react';
import { usePortalData } from '../data/store';
import type { Client } from '../data/types';

// Contact details arrive ONLY on the contractor's own clients (server-side:
// lib/contractor-visibility.ts). Everyone else is a name and a project, as
// before. Shown quietly — no badge, filter or ordering marks which are his.
type CxClient = Client & { isOwnJob?: boolean };

export default function ContractorClients() {
  const { clients } = usePortalData();
  const [query, setQuery] = useState('');
  const all = clients as CxClient[];

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = [...all].sort((a, b) => a.name.localeCompare(b.name));
    if (!q) return base;
    return base.filter((c) =>
      [c.name, (c.projectTypes ?? []).join(' '), c.isOwnJob ? c.city : '', c.isOwnJob ? c.phone : '']
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [all, query]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#32639b]">Sales team</p>
          <h1 className="mt-1 text-2xl font-black tracking-[-0.02em] text-slate-950">Clients</h1>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <label className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clients…"
            className="w-full border-0 p-0 text-sm outline-none placeholder:text-slate-400 focus:ring-0"
          />
          <span className="shrink-0 text-xs font-bold text-slate-400">{list.length}</span>
        </label>
        {list.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm font-semibold text-slate-400">No clients match.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {list.map((c) => {
              const address = [c.address, c.city, c.postalCode].filter(Boolean).join(', ');
              const tel = c.phone ? c.phone.replace(/[^+\d]/g, '') : '';
              return (
                <div key={c.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-black text-slate-900">{c.name}</p>
                    <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
                      {(c.projectTypes ?? []).join(', ') || '—'}
                      {c.isOwnJob && address ? ` · ${address}` : ''}
                    </p>
                    {c.isOwnJob && (c.phone || c.email) && (
                      <p className="mt-0.5 truncate text-xs font-semibold text-slate-600">
                        {[c.phone, c.email].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                  {c.isOwnJob && (
                    <div className="flex shrink-0 gap-2">
                      {tel && (
                        <a href={`tel:${tel}`} className="inline-flex items-center gap-1.5 rounded-xl bg-[#e8f1fb] px-3 py-2 text-xs font-black text-[#1B3C6C] active:scale-95">
                          <Phone className="h-4 w-4" /> Call
                        </a>
                      )}
                      {c.email && (
                        <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1.5 rounded-xl bg-[#e8f1fb] px-3 py-2 text-xs font-black text-[#1B3C6C] active:scale-95">
                          <Mail className="h-4 w-4" /> Email
                        </a>
                      )}
                      {address && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[#e8f1fb] px-3 py-2 text-xs font-black text-[#1B3C6C] active:scale-95"
                        >
                          <MapPin className="h-4 w-4" /> Map
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <p className="mt-3 text-xs font-semibold text-slate-400">
        Read-only client roster.
      </p>
    </div>
  );
}
