import { useMemo, useState } from 'react';
import { Mail, MapPin, Phone, Search, Star } from 'lucide-react';
import { usePortalData } from '../data/store';
import type { Client } from '../data/types';

// Contact details arrive ONLY on the contractor's own clients, flagged
// `isOwnJob` (server-side: lib/contractor-visibility.ts). Everyone else is a
// name and a project, as before.
type CxClient = Client & { isOwnJob?: boolean };

export default function ContractorClients() {
  const { clients } = usePortalData();
  const [query, setQuery] = useState('');
  const [onlyOwn, setOnlyOwn] = useState(false);
  const all = clients as CxClient[];
  const ownCount = all.filter((c) => c.isOwnJob).length;

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = [...all]
      .filter((c) => !onlyOwn || c.isOwnJob)
      // Own clients first: they're the ones with something to act on.
      .sort((a, b) => Number(Boolean(b.isOwnJob)) - Number(Boolean(a.isOwnJob)) || a.name.localeCompare(b.name));
    if (!q) return base;
    return base.filter((c) =>
      [c.name, (c.projectTypes ?? []).join(' '), c.isOwnJob ? c.city : '', c.isOwnJob ? c.phone : '']
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [all, query, onlyOwn]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#32639b]">Sales team</p>
          <h1 className="mt-1 text-2xl font-black tracking-[-0.02em] text-slate-950">Clients</h1>
        </div>
        {ownCount > 0 && (
          <div className="flex rounded-full border border-slate-200 bg-white p-0.5 shadow-sm">
            {[
              { label: `Everyone · ${all.length}`, value: false },
              { label: `Your clients · ${ownCount}`, value: true },
            ].map((o) => (
              <button
                key={o.label}
                type="button"
                onClick={() => setOnlyOwn(o.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-black transition ${onlyOwn === o.value ? 'bg-[#1B3C6C] text-white' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {o.value && <Star className="mr-1 inline h-3 w-3" fill="currentColor" />}
                {o.label}
              </button>
            ))}
          </div>
        )}
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
                <div key={c.id} className={`flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center ${c.isOwnJob ? 'bg-amber-50/50' : ''}`}>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-black text-slate-900">
                      <span className="truncate">{c.name}</span>
                      {c.isOwnJob && (
                        <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-amber-300 px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-wide text-amber-950">
                          <Star className="h-2.5 w-2.5" fill="currentColor" />
                          Your client
                        </span>
                      )}
                    </p>
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
        Read-only client roster.{ownCount > 0 ? ' Contact details are shown for your clients.' : ''}
      </p>
    </div>
  );
}
