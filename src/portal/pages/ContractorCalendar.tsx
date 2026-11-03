import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, X, Clock, User, Wrench, Phone, Mail, MapPin, Star, CalendarDays } from 'lucide-react';
import { usePortalData } from '../data/store';
import { torontoToday } from '../lib/time';
import type { Appointment } from '../data/types';
import { formatTimeOrWindow } from '../../../lib/arrival-window';

// Appointments loaded for a contractor carry a server-added `repName`. Contact
// fields (phone/email/address) are present ONLY on the contractor's own jobs,
// flagged `isOwnJob` — the server decides that (lib/contractor-visibility.ts)
// and strips them from everyone else's, so there is nothing to recover here.
type CxAppt = Appointment & { repName?: string; isOwnJob?: boolean };

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

function fromKey(key: string) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
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

// The colours were never explained on this page; a legend makes the grid read.
const LEGEND: Array<{ status: string; label: string }> = [
  { status: 'scheduled', label: 'Scheduled' },
  { status: 'confirmed', label: 'Confirmed' },
  { status: 'completed', label: 'Completed' },
  { status: 'rescheduled', label: 'Rescheduled' },
  { status: 'no_show', label: 'No-show' },
  { status: 'cancelled', label: 'Cancelled' },
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function StatusPill({ a }: { a: Appointment }) {
  const c = statusColor(a);
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-wide ${c.bg} ${c.light ? 'text-white' : 'text-slate-700'}`}>
      {STATUS_LABEL[a.status] ?? a.status}
    </span>
  );
}

function OwnBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-0.5 rounded-full bg-amber-300 font-black uppercase tracking-wide text-amber-950 ${
        compact ? 'px-1 py-px text-[0.5rem]' : 'px-2 py-0.5 text-[0.6rem]'
      }`}
      title="Your job"
    >
      <Star className={compact ? 'h-2 w-2' : 'h-2.5 w-2.5'} fill="currentColor" />
      {compact ? '' : 'Your job'}
    </span>
  );
}

function DetailRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-2.5">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[0.68rem] font-bold uppercase tracking-wide text-slate-400">{label}</p>
        <div className="mt-0.5 break-words text-sm font-semibold text-slate-800">{children}</div>
      </div>
    </div>
  );
}

function AppointmentDetail({ appt, onClose }: { appt: CxAppt; onClose: () => void }) {
  const c = statusColor(appt);
  const timeLabel = [appt.appointmentTime ? formatTimeOrWindow(appt.appointmentTime, appt.arrivalWindowMinutes, fmt12) : '', appt.durationMinutes ? `${appt.durationMinutes} min` : '']
    .filter(Boolean)
    .join(' · ');
  const fullAddress = [appt.address, appt.city, appt.postalCode].filter(Boolean).join(', ');
  const tel = appt.phone ? appt.phone.replace(/[^+\d]/g, '') : '';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <div className={`${c.bg} px-5 py-4`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className={`text-[0.68rem] font-bold uppercase tracking-wide ${c.light ? 'text-white/70' : 'text-slate-700/70'}`}>
                  {STATUS_LABEL[appt.status] ?? appt.status}
                </p>
                {appt.isOwnJob && <OwnBadge />}
              </div>
              <h2 className={`mt-0.5 truncate text-lg font-black tracking-[-0.01em] ${c.light ? 'text-white' : 'text-slate-900'}`}>
                {appt.customerName || 'Consultation'}
              </h2>
              <p className={`mt-0.5 text-sm font-semibold ${c.light ? 'text-white/85' : 'text-slate-700'}`}>
                {fmtLongDate(appt.appointmentDate)}
              </p>
            </div>
            <button
              onClick={onClose}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${c.light ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-slate-900/10 text-slate-700 hover:bg-slate-900/20'}`}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* One-tap contact, on the contractor's own jobs only. */}
        {appt.isOwnJob && (tel || appt.email || fullAddress) && (
          <div className="grid grid-cols-3 gap-2 border-b border-slate-100 px-5 py-3">
            {[
              { href: tel ? `tel:${tel}` : '', label: 'Call', Icon: Phone },
              { href: appt.email ? `mailto:${appt.email}` : '', label: 'Email', Icon: Mail },
              { href: fullAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}` : '', label: 'Map', Icon: MapPin },
            ].map(({ href, label, Icon }) =>
              href ? (
                <a
                  key={label}
                  href={href}
                  target={label === 'Map' ? '_blank' : undefined}
                  rel="noreferrer"
                  className="flex flex-col items-center gap-1 rounded-xl bg-[#e8f1fb] py-2.5 text-xs font-black text-[#1B3C6C] transition active:scale-95 hover:bg-[#dbe8f7]"
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </a>
              ) : (
                <span key={label} className="flex flex-col items-center gap-1 rounded-xl bg-slate-50 py-2.5 text-xs font-black text-slate-300">
                  <Icon className="h-5 w-5" />
                  {label}
                </span>
              )
            )}
          </div>
        )}

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

          {appt.isOwnJob && appt.phone && (
            <DetailRow icon={<Phone className="h-4 w-4" />} label="Phone">
              <a href={`tel:${tel}`} className="text-[#1B3C6C] underline-offset-2 hover:underline">{appt.phone}</a>
            </DetailRow>
          )}
          {appt.isOwnJob && appt.email && (
            <DetailRow icon={<Mail className="h-4 w-4" />} label="Email">
              <a href={`mailto:${appt.email}`} className="text-[#1B3C6C] underline-offset-2 hover:underline">{appt.email}</a>
            </DetailRow>
          )}
          {appt.isOwnJob && fullAddress && (
            <DetailRow icon={<MapPin className="h-4 w-4" />} label="Address">
              {fullAddress}
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

/** Full-width consultation card — the mobile day list and the desktop day panel. */
function AgendaCard({ a, onOpen }: { a: CxAppt; onOpen: () => void }) {
  const c = statusColor(a);
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex w-full items-stretch gap-3 rounded-xl border bg-white p-3 text-left shadow-sm transition active:scale-[0.99] hover:shadow-md ${
        a.isOwnJob ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'
      }`}
    >
      <span className={`w-1.5 shrink-0 rounded-full ${c.bg}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-black text-slate-900">{fmt12(a.appointmentTime) || 'Time TBD'}</span>
          <span className="flex items-center gap-1.5">
            {a.isOwnJob && <OwnBadge />}
            <StatusPill a={a} />
          </span>
        </div>
        <p className="mt-1 truncate text-[0.95rem] font-bold text-slate-900">{a.customerName || 'Consultation'}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs font-semibold text-slate-500">
          {a.projectType && <span className="truncate">{a.projectType}</span>}
          {a.isOwnJob && a.city && <span className="truncate">· {a.city}</span>}
          {a.repName && <span className="truncate text-slate-400">· {a.repName}</span>}
        </div>
      </div>
    </button>
  );
}

export default function ContractorCalendar() {
  const { appointments } = usePortalData();
  const todayKey = torontoToday();
  // Opens on the current month, so today is always on screen. (It used to
  // open on the previous month until the 12th; with today now highlighted,
  // the month you are in is the one to land on.)
  const [cursor, setCursor] = useState(() => {
    const [y, m] = todayKey.split('-').map(Number);
    return new Date(y, m - 1, 1);
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  // Desktop: the day panel opened from a cell's "+N more" or its date.
  const [dayPanel, setDayPanel] = useState<string | null>(null);
  const [onlyOwn, setOnlyOwn] = useState(false);

  const all = appointments as CxAppt[];
  const hasOwn = all.some((a) => a.isOwnJob);
  const visible = onlyOwn ? all.filter((a) => a.isOwnJob) : all;

  const byDate = useMemo(() => {
    const m = new Map<string, CxAppt[]>();
    for (const a of visible) {
      if (!a.appointmentDate) continue;
      const list = m.get(a.appointmentDate);
      if (list) list.push(a);
      else m.set(a.appointmentDate, [a]);
    }
    for (const list of m.values()) list.sort((x, y) => (x.appointmentTime || '').localeCompare(y.appointmentTime || ''));
    return m;
  }, [visible]);

  const selected = useMemo(() => (selectedId ? all.find((a) => a.id === selectedId) ?? null : null), [selectedId, all]);

  const gridStart = useMemo(() => {
    const d = new Date(cursor);
    d.setDate(1 - cursor.getDay());
    return d;
  }, [cursor]);
  // Only as many weeks as the month needs (5 or 6), not always 42 cells.
  const weeks = Math.ceil((cursor.getDay() + new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()) / 7);
  const days = useMemo(
    () => Array.from({ length: weeks * 7 }, (_, i) => { const d = new Date(gridStart); d.setDate(gridStart.getDate() + i); return d; }),
    [gridStart, weeks]
  );

  const monthPrefix = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
  const monthLabel = cursor.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' });

  // Busyness at a glance: today, this week (Sun–Sat), this month.
  const counts = useMemo(() => {
    const today = fromKey(todayKey);
    const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 7);
    const live = visible.filter((a) => a.status !== 'cancelled');
    return {
      today: live.filter((a) => a.appointmentDate === todayKey).length,
      week: live.filter((a) => { const d = a.appointmentDate ? fromKey(a.appointmentDate) : null; return d && d >= weekStart && d < weekEnd; }).length,
      month: live.filter((a) => a.appointmentDate?.startsWith(monthPrefix)).length,
    };
  }, [visible, todayKey, monthPrefix]);

  // Which day the mobile day list shows: the tapped day (if in view), else
  // today (if in this month), else the first day with a consultation, else the 1st.
  const effectiveDay = useMemo(() => {
    if (selectedDay && selectedDay.startsWith(monthPrefix)) return selectedDay;
    if (todayKey.startsWith(monthPrefix)) return todayKey;
    const firstWithAppt = [...byDate.keys()].filter((k) => k.startsWith(monthPrefix)).sort()[0];
    return firstWithAppt ?? `${monthPrefix}-01`;
  }, [selectedDay, monthPrefix, todayKey, byDate]);

  const selItems = byDate.get(effectiveDay) ?? [];
  const selHeading = fromKey(effectiveDay).toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' });

  const shift = (n: number) => setCursor((c) => { const d = new Date(c); d.setMonth(c.getMonth() + n); return d; });
  const goToday = () => {
    const [y, m] = todayKey.split('-').map(Number);
    setCursor(new Date(y, m - 1, 1));
    setSelectedDay(todayKey);
  };
  const selectDay = (d: Date) => {
    setSelectedDay(toKey(d));
    // Tapping a trailing/leading day from an adjacent month follows it into view.
    if (d.getMonth() !== cursor.getMonth() || d.getFullYear() !== cursor.getFullYear()) {
      setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  };
  const viewingThisMonth = todayKey.startsWith(monthPrefix);

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#32639b]">Sales team</p>
          <h1 className="mt-1 text-2xl font-black tracking-[-0.02em] text-slate-950">Consultation calendar</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => shift(-1)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50" aria-label="Previous month"><ChevronLeft className="h-4 w-4" /></button>
          <button
            onClick={goToday}
            className={`rounded-xl px-4 py-2.5 text-sm font-black shadow-sm transition ${viewingThisMonth ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50' : 'bg-[#1B3C6C] text-white hover:bg-[#153158]'}`}
          >
            Today
          </button>
          <button onClick={() => shift(1)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50" aria-label="Next month"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>

      {/* ── Busyness strip ─────────────────────────────────────────────── */}
      <div className="mb-4 grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { label: 'Today', value: counts.today, accent: true },
          { label: 'This week', value: counts.week },
          { label: monthLabel.split(' ')[0], value: counts.month },
        ].map((s) => (
          <div
            key={s.label}
            className={`rounded-xl border px-3 py-2.5 shadow-sm sm:px-4 sm:py-3 ${s.accent ? 'border-[#1B3C6C] bg-[#1B3C6C] text-white' : 'border-slate-200 bg-white text-slate-900'}`}
          >
            <p className={`text-[0.62rem] font-black uppercase tracking-[0.12em] ${s.accent ? 'text-white/70' : 'text-slate-400'}`}>{s.label}</p>
            <p className="mt-0.5 text-2xl font-black leading-none sm:text-3xl">{s.value}</p>
            <p className={`mt-1 text-[0.65rem] font-semibold ${s.accent ? 'text-white/70' : 'text-slate-400'}`}>consultation{s.value === 1 ? '' : 's'}</p>
          </div>
        ))}
      </div>

      {/* ── Filter + legend ────────────────────────────────────────────── */}
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        {hasOwn && (
          <div className="flex rounded-full border border-slate-200 bg-white p-0.5 shadow-sm">
            {[
              { label: 'Everyone', value: false },
              { label: 'Your jobs', value: true },
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
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {LEGEND.map((l) => (
            <span key={l.status} className="inline-flex items-center gap-1.5 text-[0.68rem] font-bold text-slate-500">
              <span className={`h-2.5 w-2.5 rounded-full ${statusColor({ status: l.status } as Appointment).bg}`} />
              {l.label}
            </span>
          ))}
          {hasOwn && (
            <span className="inline-flex items-center gap-1.5 text-[0.68rem] font-bold text-slate-500">
              <OwnBadge compact /> Your job
            </span>
          )}
        </div>
      </div>

      {/* ── Desktop / tablet: month grid ───────────────────────────────── */}
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:block">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h2 className="text-xl font-black tracking-[-0.02em]">{monthLabel}</h2>
          {viewingThisMonth && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500">
              <CalendarDays className="h-3.5 w-3.5 text-[#1B3C6C]" />
              Today is {fromKey(todayKey).toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
          )}
        </div>
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
          {WEEKDAYS.map((d, i) => (
            <div key={d} className={`px-3 py-2 text-[0.7rem] font-black uppercase tracking-wide ${viewingThisMonth && i === fromKey(todayKey).getDay() ? 'text-[#1B3C6C]' : 'text-slate-400'}`}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d, i) => {
            const key = toKey(d);
            const inMonth = d.getMonth() === cursor.getMonth();
            const isToday = key === todayKey;
            const isPast = key < todayKey;
            const appts = byDate.get(key) ?? [];
            const shown = appts.slice(0, 4);
            return (
              <div
                key={key}
                className={`relative min-h-[8.5rem] border-slate-100 p-1.5 ${i % 7 !== 6 ? 'border-r' : ''} ${i < days.length - 7 ? 'border-b' : ''} ${
                  isToday
                    ? 'z-10 bg-[#eef5ff] ring-2 ring-inset ring-[#1B3C6C]'
                    : !inMonth
                      ? 'bg-slate-50/70'
                      : 'bg-white'
                }`}
              >
                <button
                  type="button"
                  onClick={() => appts.length && setDayPanel(key)}
                  className="mb-1 flex w-full items-center justify-between px-0.5"
                >
                  {isToday ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1B3C6C] text-xs font-black text-white">{d.getDate()}</span>
                      <span className="text-[0.62rem] font-black uppercase tracking-wide text-[#1B3C6C]">Today</span>
                    </span>
                  ) : (
                    <span className={`text-xs font-bold ${inMonth ? (isPast ? 'text-slate-400' : 'text-slate-700') : 'text-slate-300'}`}>{d.getDate()}</span>
                  )}
                  {appts.length > 0 && (
                    <span className="text-[0.6rem] font-black text-slate-400">{appts.length}</span>
                  )}
                </button>
                <div className={`space-y-1 ${isPast && !isToday ? 'opacity-80' : ''}`}>
                  {shown.map((a) => {
                    const c = statusColor(a);
                    return (
                      <button
                        type="button"
                        key={a.id}
                        onClick={() => setSelectedId(a.id)}
                        className={`relative w-full rounded-md ${c.bg} px-1.5 py-1 text-left transition hover:brightness-110 hover:ring-2 hover:ring-slate-900/10 focus:outline-none focus:ring-2 focus:ring-[#1B3C6C]/40 ${a.isOwnJob ? 'ring-2 ring-amber-300' : ''}`}
                        title={`${fmt12(a.appointmentTime)} · ${a.customerName}${a.projectType ? ` · ${a.projectType}` : ''}${a.repName ? ` · Rep: ${a.repName}` : ''}`}
                      >
                        <span className="flex items-center justify-between gap-1">
                          <span className={`truncate text-[0.6rem] font-bold ${c.light ? 'text-white/80' : 'text-slate-700'}`}>{fmt12(a.appointmentTime)}</span>
                          {a.isOwnJob && <OwnBadge compact />}
                        </span>
                        <p className={`truncate text-[0.7rem] font-black leading-tight ${c.light ? 'text-white' : 'text-slate-900'}`}>{a.customerName || 'Consultation'}</p>
                      </button>
                    );
                  })}
                  {appts.length > shown.length && (
                    <button
                      type="button"
                      onClick={() => setDayPanel(key)}
                      className="w-full rounded-md px-1 py-0.5 text-left text-[0.65rem] font-black text-[#32639b] hover:bg-[#e8f1fb]"
                    >
                      +{appts.length - shown.length} more
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Mobile: tap-a-day month calendar with dots ─────────────────── */}
      <div className="sm:hidden">
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <h2 className="mb-2 px-1 text-base font-black tracking-[-0.02em]">{monthLabel}</h2>
          <div className="grid grid-cols-7">
            {WEEKDAYS_SHORT.map((d, i) => (
              <div key={`${d}${i}`} className="pb-1 text-center text-[0.62rem] font-black uppercase tracking-wide text-slate-400">{d}</div>
            ))}
            {days.map((d) => {
              const key = toKey(d);
              const inMonth = d.getMonth() === cursor.getMonth();
              const appts = byDate.get(key) ?? [];
              const isToday = key === todayKey;
              const isSel = key === effectiveDay;
              const own = appts.some((a) => a.isOwnJob);
              return (
                <div key={key} className="flex justify-center py-0.5">
                  <button
                    type="button"
                    onClick={() => selectDay(d)}
                    className={`relative flex h-12 w-11 flex-col items-center justify-center rounded-2xl transition
                      ${isSel ? 'bg-[#1B3C6C] text-white shadow-md' : isToday ? 'bg-[#e8f1fb] text-[#1B3C6C] ring-2 ring-[#1B3C6C]' : inMonth ? 'text-slate-700 active:bg-slate-100' : 'text-slate-300 active:bg-slate-100'}`}
                    aria-label={`${d.getDate()}${isToday ? ', today' : ''} — ${appts.length} consultation${appts.length === 1 ? '' : 's'}`}
                  >
                    <span className={`text-sm leading-none ${isToday || isSel ? 'font-black' : 'font-bold'}`}>{d.getDate()}</span>
                    <span className="mt-1 flex h-1.5 items-center justify-center gap-0.5">
                      {appts.slice(0, 3).map((a) => (
                        <span key={a.id} className={`h-1.5 w-1.5 rounded-full ${isSel ? 'bg-white' : statusColor(a).bg}`} />
                      ))}
                    </span>
                    {own && !isSel && <Star className="absolute right-0.5 top-0.5 h-2.5 w-2.5 text-amber-400" fill="currentColor" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected day's consultations */}
        <div className="mt-4">
          <div className="mb-2 flex items-center gap-2 px-0.5">
            <span className={`text-sm font-black ${effectiveDay === todayKey ? 'text-[#1B3C6C]' : 'text-slate-800'}`}>{selHeading}</span>
            {effectiveDay === todayKey && <span className="rounded-full bg-[#1B3C6C] px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-wide text-white">Today</span>}
            <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs font-black text-slate-500">{selItems.length}</span>
          </div>
          {selItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 px-4 py-8 text-center text-sm font-semibold text-slate-400">
              No consultations on this day.
            </div>
          ) : (
            <div className="space-y-2">
              {selItems.map((a) => <AgendaCard key={a.id} a={a} onOpen={() => setSelectedId(a.id)} />)}
            </div>
          )}
        </div>
      </div>

      <p className="mt-4 text-xs font-semibold text-slate-400">
        Read-only view of the sales team's consultation schedule.{hasOwn ? ' Contact details are shown on your jobs.' : ''}
      </p>

      {/* Desktop day panel: every consultation on one day. */}
      {dayPanel && (
        <div className="fixed inset-0 z-40 hidden items-center justify-center p-4 sm:flex" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDayPanel(null)} />
          <div className="relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-[0.68rem] font-black uppercase tracking-wide text-slate-400">
                  {(byDate.get(dayPanel) ?? []).length} consultations
                </p>
                <h2 className="text-lg font-black">
                  {fmtLongDate(dayPanel)}
                  {dayPanel === todayKey && <span className="ml-2 rounded-full bg-[#1B3C6C] px-2 py-0.5 align-middle text-[0.6rem] font-black uppercase text-white">Today</span>}
                </h2>
              </div>
              <button onClick={() => setDayPanel(null)} className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2 overflow-y-auto p-4">
              {(byDate.get(dayPanel) ?? []).map((a) => (
                <AgendaCard key={a.id} a={a} onOpen={() => setSelectedId(a.id)} />
              ))}
            </div>
          </div>
        </div>
      )}

      {selected && <AppointmentDetail appt={selected} onClose={() => setSelectedId(null)} />}
    </div>
  );
}
