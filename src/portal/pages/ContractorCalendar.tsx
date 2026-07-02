import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, X, Clock, User, Wrench, CalendarDays } from 'lucide-react';
import { usePortalData } from '../data/store';
import { torontoToday } from '../lib/time';
import type { Appointment } from '../data/types';

// Appointments loaded for a contractor carry a server-added `repName`.
// Contact fields (phone/email/address) and contractor attribution are stripped
// server-side, so they are simply absent here.
type CxAppt = Appointment & { repName?: string };

function fmt12(t?: string | null) {
  if (!t) return '';
  const [h, m] = String(t).split(':').map(Number);
  if (Number.isNaN(h)) return String(t);
  const period = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, '0')}` : ''} ${period}`;
}

function toKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtLongDate(dateStr?: string | null) {
  if (!dateStr) return '';
  const [y, m, d] = String(dateStr).split('-').map(Number);
  if (!y || !m || !d) return String(dateStr);
  return new Date(y, m - 1, d).toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Scheduled',
  confirmed: 'Confirmed',
  completed: 'Completed',
  rescheduled: 'Rescheduled',
  cancelled: 'Cancelled',
  no_show: 'No-show',
};

const TYPE_LABEL: Record<string, string> = {
  home_visit: 'Home visit',
  phone_consultation: 'Phone consultation',
  video_consultation: 'Video consultation',
  showroom_visit: 'Showroom visit',
  supplier_meeting: 'Supplier meeting',
  site_check: 'Site check',
  custom_event: 'Event',
};

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

function StatusPill({ a }: { a: Appointment }) {
  const c = statusColor(a);
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-wide ${c.bg} ${c.light ? 'text-white' : 'text-slate-700'}`}>
      {STATUS_LABEL[a.status] ?? a.status}
    </span>
  );
}

function DetailRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-2.5">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[0.68rem] font-bold uppercase tracking-wide text-slate-400">{label}</p>
        <div className="mt-0.5 text-sm font-semibold text-slate-800 break-words">{children}</div>
      </div>
    </div>
  );
}

function AppointmentDetail({ appt, onClose }: { appt: CxAppt; onClose: () => void }) {
  const c = statusColor(appt);
  const timeLabel = [fmt12(appt.appointmentTime), appt.durationMinutes ? `${appt.durationMinutes} min` : '']
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <div className={`${c.bg} px-5 py-4`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className={`text-[0.68rem] font-bold uppercase tracking-wide ${c.light ? 'text-white/70' : 'text-slate-700/70'}`}>
                {STATUS_LABEL[appt.status] ?? appt.status}
              </p>
              <h2 className={`mt-0.5 truncate text-lg font-black tracking-[-0.01em] ${c.light ? 'text-white' : 'text-slate-900'}`}>
                {appt.customerName || 'Consultation'}
              </h2>
              <p className={`mt-0.5 text-sm font-semibold ${c.light ? 'text-white/85' : 'text-slate-700'}`}>
                {fmtLongDate(appt.appointmentDate)}
              </p>
            </div>
            <button
              onClick={onClose}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${c.light ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-slate-900/10 text-slate-700 hover:bg-slate-900/20'}`}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-100 overflow-y-auto px-5 py-2">
          {timeLabel && (
            <DetailRow icon={<Clock className="h-4 w-4" />} label="When">
              {timeLabel}
              {appt.appointmentType && TYPE_LABEL[appt.appointmentType] ? (
                <span className="ml-1.5 text-slate-400">· {TYPE_LABEL[appt.appointmentType]}</span>
              ) : null}
            </DetailRow>
          )}

          {appt.projectType && (
            <DetailRow icon={<Wrench className="h-4 w-4" />} label="Project">
              {appt.projectType}
            </DetailRow>
          )}

          {appt.repName && (
            <DetailRow icon={<User className="h-4 w-4" />} label="OntarioReno rep">
              {appt.repName}
            </DetailRow>
          )}
        </div>
      </div>
    </div>
  );
}

/** Mobile-friendly full-width consultation card (agenda view). */
function AgendaCard({ a, onOpen }: { a: CxAppt; onOpen: () => void }) {
  const c = statusColor(a);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-stretch gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition active:scale-[0.99]"
    >
      <span className={`w-1.5 shrink-0 rounded-full ${c.bg}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-black text-slate-900">{fmt12(a.appointmentTime) || 'Time TBD'}</span>
          <StatusPill a={a} />
        </div>
        <p className="mt-1 truncate text-[0.95rem] font-bold text-slate-900">{a.customerName || 'Consultation'}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs font-semibold text-slate-500">
          {a.projectType && <span className="truncate">{a.projectType}</span>}
          {a.projectType && a.repName && <span className="text-slate-300">·</span>}
          {a.repName && <span className="truncate text-slate-400">{a.repName}</span>}
        </div>
      </div>
    </button>
  );
}

export default function ContractorCalendar() {
  const { appointments } = usePortalData();
  const [cursor, setCursor] = useState(() => {
    // Based on Ontario's date, not the viewer's device clock.
    const [y, m, day] = torontoToday().split('-').map(Number);
    const d = new Date(y, m - 1, 1);
    // Early in the month the current-month grid is mostly empty, while the
    // previous month's grid still trails into the first ~11 days of this month.
    // Land on the previous month until the 12th so the view isn't blank on arrival.
    if (day < 12) d.setMonth(d.getMonth() - 1);
    return d;
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  const selected = useMemo(
    () => (selectedId ? (appointments as CxAppt[]).find((a) => a.id === selectedId) ?? null : null),
    [selectedId, appointments]
  );

  const gridStart = useMemo(() => {
    const d = new Date(cursor);
    d.setDate(1 - cursor.getDay());
    return d;
  }, [cursor]);
  const days = useMemo(
    () => Array.from({ length: 42 }, (_, i) => { const d = new Date(gridStart); d.setDate(gridStart.getDate() + i); return d; }),
    [gridStart]
  );

  const monthPrefix = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
  // Agenda (mobile): this month's days that have consultations, in date order.
  const agenda = useMemo(() => {
    return [...byDate.keys()]
      .filter((k) => k.startsWith(monthPrefix))
      .sort()
      .map((k) => ({ key: k, items: byDate.get(k)! }));
  }, [byDate, monthPrefix]);

  const todayKey = torontoToday();
  const monthLabel = cursor.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' });
  const shift = (n: number) => setCursor((c) => { const d = new Date(c); d.setMonth(c.getMonth() + n); return d; });
  const goToday = () => { const [y, m] = torontoToday().split('-').map(Number); setCursor(new Date(y, m - 1, 1)); };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#32639b]">Sales team</p>
          <h1 className="mt-1 text-2xl font-black tracking-[-0.02em] text-slate-950">Consultation calendar</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => shift(-1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50" aria-label="Previous month"><ChevronLeft className="h-4 w-4" /></button>
          <button onClick={goToday} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">Today</button>
          <button onClick={() => shift(1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50" aria-label="Next month"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>

      {/* ── Desktop / tablet: month grid ────────────────────────────────── */}
      <div className="hidden rounded-[0.9rem] border border-slate-200 bg-white p-4 shadow-sm sm:block">
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
                      <button
                        type="button"
                        key={a.id}
                        onClick={() => setSelectedId(a.id)}
                        className={`w-full rounded ${c.bg} px-1.5 py-1 text-left transition hover:brightness-110 hover:ring-2 hover:ring-slate-900/10 focus:outline-none focus:ring-2 focus:ring-[#1B3C6C]/40`}
                        title={`${fmt12(a.appointmentTime)} · ${a.customerName}${a.projectType ? ` · ${a.projectType}` : ''}${a.repName ? ` · Rep: ${a.repName}` : ''}`}
                      >
                        <p className={`truncate text-[0.6rem] font-bold ${c.light ? 'text-white/80' : 'text-slate-700'}`}>{fmt12(a.appointmentTime)}</p>
                        <p className={`truncate text-[0.68rem] font-black leading-tight ${c.light ? 'text-white' : 'text-slate-900'}`}>{a.customerName || 'Consultation'}</p>
                      </button>
                    );
                  })}
                  {appts.length > 4 && <p className="px-1 text-[0.6rem] font-bold text-slate-400">+{appts.length - 4} more</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Mobile: agenda list ─────────────────────────────────────────── */}
      <div className="sm:hidden">
        <h2 className="mb-3 text-lg font-black tracking-[-0.02em]">{monthLabel}</h2>
        {agenda.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 px-6 py-12 text-center">
            <CalendarDays className="mb-3 h-8 w-8 text-slate-300" />
            <p className="text-sm font-bold text-slate-500">No consultations in {monthLabel}.</p>
            <p className="mt-1 text-xs font-semibold text-slate-400">Use the arrows above to change month.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {agenda.map(({ key, items }) => {
              const [y, m, d] = key.split('-').map(Number);
              const isToday = key === todayKey;
              const heading = new Date(y, m - 1, d).toLocaleDateString('en-CA', { weekday: 'long', month: 'short', day: 'numeric' });
              return (
                <div key={key}>
                  <div className="mb-2 flex items-center gap-2 px-0.5">
                    <span className={`text-sm font-black ${isToday ? 'text-[#1B3C6C]' : 'text-slate-800'}`}>{heading}</span>
                    {isToday && <span className="rounded-full bg-[#1B3C6C] px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-wide text-white">Today</span>}
                    <span className="ml-auto text-xs font-bold text-slate-400">{items.length}</span>
                  </div>
                  <div className="space-y-2">
                    {items.map((a) => <AgendaCard key={a.id} a={a} onOpen={() => setSelectedId(a.id)} />)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="mt-4 text-xs font-semibold text-slate-400">Read-only view of the sales team's consultation schedule. Tap a consultation for details.</p>

      {selected && <AppointmentDetail appt={selected} onClose={() => setSelectedId(null)} />}
    </div>
  );
}
