import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePortalData } from '../data/store';
import { usePortalAuth } from '../auth';
import type { Appointment } from '../data/types';

// Appointments loaded for a contractor carry a server-added `repName`.
type CxAppt = Appointment & { repName?: string };

function fmt12(t?: string | null) {
  if (!t) return '';
  const [h, m] = String(t).split(':').map(Number);
  if (Number.isNaN(h)) return String(t);
  const period = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, '0')}` : ''}${period}`;
}

function toKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function statusColor(a: Appointment): { bg: string; light: boolean } {
  switch (a.status) {
    case 'completed': return { bg: 'bg-emerald-500', light: true };
    case 'no_show': return { bg: 'bg-black', light: true };
    case 'cancelled': return { bg: 'bg-slate-300', light: false };
    case 'rescheduled': return { bg: 'bg-amber-400', light: false };
    case 'confirmed': return { bg: 'bg-sky-500', light: true };
    default: return { bg: 'bg-[#32639b]', light: true };
  }
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ContractorCalendar() {
  const { currentUser } = usePortalAuth();
  const { appointments } = usePortalData();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const byDate = useMemo(() => {
    const m = new Map<string, CxAppt[]>();
    for (const a of appointments as CxAppt[]) {
      if (!a.appointmentDate) continue;
      const list = m.get(a.appointmentDate);
      if (list) list.push(a);
      else m.set(a.appointmentDate, [a]);
    }
    for (const list of m.values()) list.sort((x, y) => (x.appointmentTime || '').localeCompare(y.appointmentTime || ''));
    return m;
  }, [appointments]);

  const gridStart = useMemo(() => {
    const d = new Date(cursor);
    d.setDate(1 - cursor.getDay());
    return d;
  }, [cursor]);
  const days = useMemo(
    () => Array.from({ length: 42 }, (_, i) => { const d = new Date(gridStart); d.setDate(gridStart.getDate() + i); return d; }),
    [gridStart]
  );
  const todayKey = toKey(new Date());
  const monthLabel = cursor.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' });
  const shift = (n: number) => setCursor((c) => { const d = new Date(c); d.setMonth(c.getMonth() + n); return d; });

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#32639b]">
            {currentUser?.contractorName || 'Contractor'}
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-[-0.02em] text-slate-950">Consultation calendar</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => shift(-1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50" aria-label="Previous month"><ChevronLeft className="h-4 w-4" /></button>
          <button onClick={() => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); setCursor(d); }} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">Today</button>
          <button onClick={() => shift(1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50" aria-label="Next month"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="rounded-[0.9rem] border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-xl font-black tracking-[-0.02em]">{monthLabel}</h2>
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="px-2 py-1 text-[0.7rem] font-black uppercase tracking-wide text-slate-400">{d}</div>
          ))}
          {days.map((d) => {
            const key = toKey(d);
            const inMonth = d.getMonth() === cursor.getMonth();
            const appts = byDate.get(key) ?? [];
            return (
              <div key={key} className={`min-h-24 rounded-lg border p-1.5 ${inMonth ? 'border-slate-100 bg-white' : 'border-transparent bg-slate-50/60'}`}>
                <p className={`mb-1 text-xs font-bold ${key === todayKey ? 'text-[#1B3C6C]' : inMonth ? 'text-slate-500' : 'text-slate-300'}`}>
                  {key === todayKey ? `Today ${d.getDate()}` : d.getDate()}
                </p>
                <div className="space-y-1">
                  {appts.slice(0, 4).map((a) => {
                    const c = statusColor(a);
                    return (
                      <div key={a.id} className={`rounded ${c.bg} px-1.5 py-1`} title={`${fmt12(a.appointmentTime)} · ${a.customerName} · ${[a.city, a.projectType].filter(Boolean).join(' · ')}${a.repName ? ` · Rep: ${a.repName}` : ''}`}>
                        <p className={`truncate text-[0.6rem] font-bold ${c.light ? 'text-white/80' : 'text-slate-700'}`}>{fmt12(a.appointmentTime)}</p>
                        <p className={`truncate text-[0.68rem] font-black leading-tight ${c.light ? 'text-white' : 'text-slate-900'}`}>{a.customerName || 'Consultation'}</p>
                      </div>
                    );
                  })}
                  {appts.length > 4 && <p className="px-1 text-[0.6rem] font-bold text-slate-400">+{appts.length - 4} more</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-3 text-xs font-semibold text-slate-400">Read-only view of consultations assigned to {currentUser?.contractorName || 'your company'}.</p>
    </div>
  );
}
