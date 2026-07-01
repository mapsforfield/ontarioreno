import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { usePortalData } from '../data/store';

export default function ContractorClients() {
  const { clients } = usePortalData();
  const [query, setQuery] = useState('');

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = [...clients].sort((a, b) => a.name.localeCompare(b.name));
    if (!q) return base;
    return base.filter((c) =>
      [c.name, (c.projectTypes ?? []).join(' ')]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [clients, query]);

  return (
    <div>
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#32639b]">Sales team</p>
        <h1 className="mt-1 text-2xl font-black tracking-[-0.02em] text-slate-950">Clients</h1>
      </div>

      <div className="rounded-[0.9rem] border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clients…"
            className="w-full text-sm outline-none placeholder:text-slate-400"
          />
          <span className="shrink-0 text-xs font-bold text-slate-400">{list.length}</span>
        </div>
        {list.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm font-semibold text-slate-400">No clients yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-xs font-bold uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Project</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-bold text-slate-800">{c.name}</td>
                    <td className="px-4 py-3 text-slate-600">{(c.projectTypes ?? []).join(', ') || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="mt-3 text-xs font-semibold text-slate-400">Read-only client roster.</p>
    </div>
  );
}
