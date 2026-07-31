import {
  BadgeDollarSign,
  Building2,
  CalendarClock,
  CalendarDays,
  Check,
  HandCoins,
  Inbox,
  ListTodo,
  Plus,
  Trophy,
  TrendingUp,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePortalAuth } from '../auth';
import { formatCurrency } from '../data/selectors';
import { usePortalData } from '../data/store';
import { countUnworkedSubmissions } from '../data/submissions';
import { ConsultationStage } from '../data/types';
import { torontoToday } from '../lib/time';
import EarningPotentialCard from '../components/EarningPotentialCard';

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-CA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${iso}T00:00:00`));
}

function formatConsultationStage(stage: ConsultationStage) {
  return stage
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getDaysSince(value: string) {
  if (!value) return 0;
  return Math.floor((Date.now() - new Date(value).getTime()) / 86400000);
}

export default function PortalDashboard() {
  const navigate = useNavigate();
  const { currentUser } = usePortalAuth();

  // Reps on mobile land on the appointments view — that's where their day starts.
  // Only once per session so they can still visit the dashboard deliberately.
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'rep') return;
    if (window.innerWidth >= 768) return;
    if (sessionStorage.getItem('or-mobile-landed')) return;
    sessionStorage.setItem('or-mobile-landed', '1');
    navigate('/portal/appointments', { replace: true });
  }, [currentUser, navigate]);
  const {
    calculateOpenDealsForUser,
    calculatePipelineValueForUser,
    calculateVisiblePendingCommission,
    calculateVisibleWonDeals,
    contractors,
    deals,
    getVisibleAppointmentsForUser,
    getVisibleDealsForUser,
    leads,
    tasks,
    addTask,
    updateTask,
    users,
  } = usePortalData();
  const [quickTask, setQuickTask] = useState('');
  const myOpenTasks = currentUser
    ? tasks
        .filter((t) => t.userId === currentUser.id && !t.done)
        .sort((a, b) => (a.dueAt ?? '9999').localeCompare(b.dueAt ?? '9999'))
    : [];
  const submitQuickTask = async () => {
    const v = quickTask.trim();
    if (!v) return;
    setQuickTask('');
    await addTask(v, null);
  };
  const activeContractors = contractors.filter(
    (contractor) => contractor.contractorStatus === 'active'
  ).length;
  const openDeals = currentUser ? calculateOpenDealsForUser(currentUser) : 0;
  const pendingCommission = currentUser
    ? calculateVisiblePendingCommission(currentUser)
    : 0;
  const pipelineValue = currentUser ? calculatePipelineValueForUser(currentUser) : 0;
  const wonDeals = currentUser ? calculateVisibleWonDeals(currentUser) : 0;
  // Consultation submissions still awaiting first contact. Costs no extra
  // request: admins are not rep-scoped, so `leads` already holds them.
  // Definition is shared with the log's own filter — see data/submissions.ts.
  const unworkedSubmissions = countUnworkedSubmissions(leads);
  const visibleDeals = currentUser ? getVisibleDealsForUser(currentUser) : [];
  const financingRequiredDeals = visibleDeals.filter(
    (deal) => deal.financingRequired
  );
  const financingPipeline = financingRequiredDeals.reduce(
    (total, deal) => total + deal.estimatedJobValue,
    0
  );
  const visibleAppointments = currentUser
    ? getVisibleAppointmentsForUser(currentUser)
    : [];
  const today = torontoToday();
  const todayAppointments = visibleAppointments.filter(
    (appointment) => appointment.appointmentDate === today
  );
  const needsAttentionAppointments = visibleAppointments.filter(
    (appointment) =>
      (appointment.status === 'completed' && !appointment.outcomeSubmitted) ||
      (appointment.nextStep === 'follow_up_required' &&
        appointment.followUpDate &&
        appointment.followUpDate <= today) ||
      (['hot', 'warm'].includes(appointment.homeownerInterestLevel ?? '') &&
        appointment.nextStep === 'no_action') ||
      (appointment.appointmentDate < today && appointment.status !== 'completed') ||
      appointment.consultationStage === 'follow_up_required' ||
      (appointment.consultationStage === 'estimate_requested' &&
        getDaysSince(appointment.updatedAt) > 3) ||
      (appointment.consultationStage === 'contractor_review' &&
        getDaysSince(appointment.updatedAt) > 3) ||
      !appointment.assignedRepId
  );
  const upcomingAppointments = visibleAppointments
    .filter(
      (appointment) =>
        appointment.appointmentDate >= today &&
        ['confirmed', 'rescheduled', 'scheduled'].includes(appointment.status)
    )
    .sort((first, second) =>
      `${first.appointmentDate}T${first.appointmentTime}`.localeCompare(
        `${second.appointmentDate}T${second.appointmentTime}`
      )
    )
    .slice(0, 4);
  const [loadedAt] = useState(() =>
    new Intl.DateTimeFormat('en-CA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(new Date())
  );

  const getDealLabel = (dealId: string) => {
    const deal = deals.find((candidate) => candidate.id === dealId);
    return deal ? `${deal.homeownerName} / ${deal.projectType}` : 'Consultation';
  };
  const getRepName = (repId: string) =>
    repId ? users.find((user) => user.id === repId)?.name ?? repId : 'Unassigned Rep';

  // ── Unified "Today / needs attention" list (tasks, consults, follow-ups, stale deals) ──
  const fmtTime12 = (t?: string) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    if (isNaN(h)) return t;
    const p = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return m ? `${h12}:${String(m).padStart(2, '0')} ${p}` : `${h12} ${p}`;
  };
  type AgendaItem = { id: string; kind: 'task' | 'consult' | 'followup' | 'stale'; title: string; subtitle: string; href: string; state?: Record<string, unknown>; urgent: boolean; sort: string };
  const agendaItems: AgendaItem[] = (() => {
    const items: AgendaItem[] = [];
    myOpenTasks.forEach((t) => {
      const due = t.dueAt ? t.dueAt.slice(0, 10) : '';
      if (due && due <= today) {
        items.push({ id: `task-${t.id}`, kind: 'task', title: t.title, subtitle: due < today ? 'Task · overdue' : 'Task · due today', href: '/portal/tasks', urgent: due < today, sort: t.dueAt ?? '' });
      }
    });
    todayAppointments.forEach((a) => {
      items.push({ id: `consult-${a.id}`, kind: 'consult', title: a.customerName || a.title || 'Consultation', subtitle: [fmtTime12(a.appointmentTime), a.city || a.address].filter(Boolean).join(' · ') || 'Consultation today', href: '/portal/appointments', state: { openAppointmentId: a.id }, urgent: false, sort: a.appointmentTime ?? '00:00' });
    });
    visibleAppointments.forEach((a) => {
      if (a.appointmentDate === today) return; // already shown above
      if (a.followUpDate && a.followUpDate <= today && a.status !== 'cancelled' && !(a.status === 'completed' && a.outcomeSubmitted)) {
        items.push({ id: `fu-${a.id}`, kind: 'followup', title: a.customerName || a.title || 'Follow-up', subtitle: a.followUpDate < today ? 'Follow-up · overdue' : 'Follow-up · today', href: '/portal/appointments', state: { openAppointmentId: a.id }, urgent: a.followUpDate < today, sort: a.followUpDate });
      }
    });
    visibleDeals
      .filter((d) => !d.isHistorical && !['won', 'lost'].includes(d.status) && getDaysSince(d.updatedAt) > 14)
      .sort((x, y) => getDaysSince(y.updatedAt) - getDaysSince(x.updatedAt))
      .slice(0, 3)
      .forEach((d) => items.push({ id: `stale-${d.id}`, kind: 'stale', title: d.homeownerName || 'Deal', subtitle: `${getDaysSince(d.updatedAt)}d untouched · ${d.status.replace(/_/g, ' ')}`, href: '/portal/deals', state: { openDealId: d.id }, urgent: false, sort: 'zzz' }));
    return items.sort((a, b) => (a.urgent === b.urgent ? a.sort.localeCompare(b.sort) : a.urgent ? -1 : 1)).slice(0, 8);
  })();
  const agendaDot: Record<AgendaItem['kind'], string> = {
    task: 'bg-amber-400',
    consult: 'bg-[#1B3C6C]',
    followup: 'bg-sky-400',
    stale: 'bg-orange-400',
  };

  const summaryCards = [
    // Admin-only, matching the page it links to. Amber whenever the backlog is
    // non-zero — this is a queue with people waiting in it, not a statistic.
    ...(currentUser?.role === 'admin'
      ? [
          {
            label: 'Needs First Contact',
            value: String(unworkedSubmissions),
            detail: unworkedSubmissions > 0 ? 'Consultation submissions' : 'All caught up',
            icon: Inbox,
            href: '/portal/submissions',
            alert: unworkedSubmissions > 0,
          },
        ]
      : []),
    {
      label: 'Active Contractors',
      value: String(activeContractors),
      detail: 'Approved network',
      icon: Building2,
      href: '/portal/contractors',
    },
    {
      label: 'Open Deals',
      value: String(openDeals),
      detail: 'Visible pipeline',
      icon: HandCoins,
      href: '/portal/deals',
    },
    {
      label: 'Pending Commission',
      value: formatCurrency(pendingCommission),
      detail:
        currentUser?.role === 'admin'
          ? 'Admin net pending'
          : 'Your 5% rep commission',
      icon: BadgeDollarSign,
      href: '/portal/commissions',
    },
    {
      label: 'Pipeline Value',
      value: formatCurrency(pipelineValue),
      detail: 'Open deal value',
      icon: TrendingUp,
      href: '/portal/deals',
    },
    {
      label: 'Won Deals',
      value: String(wonDeals),
      detail: currentUser?.role === 'admin' ? 'Team closed wins' : 'Your closed wins',
      icon: Trophy,
      href: '/portal/deals',
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-[0.5rem] border border-white bg-[linear-gradient(135deg,#ffffff_0%,#f7fbff_55%,#ecf4fd_100%)] p-5 shadow-md sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#32639b]">
            Dashboard
          </p>
          <p className="text-xs font-semibold text-slate-400">
            Updated at {loadedAt}
          </p>
        </div>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.02em] text-slate-950 sm:text-4xl">
          Welcome back, {currentUser?.name}.
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          Your pipeline at a glance — tap any card to dive deeper.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            to="/portal/appointments"
            className="inline-flex items-center gap-2 rounded-full bg-[#1B3C6C] px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-[#153158]"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Schedule Consultation
          </Link>
        </div>
      </section>

      <EarningPotentialCard />

      <section className="rounded-[0.5rem] border border-white bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#32639b]">Today · Needs attention</p>
          {agendaItems.length > 0 && (
            <span className="rounded-full bg-[#e8f1fb] px-2.5 py-0.5 text-xs font-black text-[#1B3C6C]">{agendaItems.length}</span>
          )}
        </div>
        {agendaItems.length === 0 ? (
          <p className="mt-3 text-sm font-semibold text-slate-400">You’re all caught up — nothing due today. 🎉</p>
        ) : (
          <div className="mt-3 space-y-2">
            {agendaItems.map((it) => (
              <button
                key={it.id}
                type="button"
                onClick={() => navigate(it.href, it.state ? { state: it.state } : undefined)}
                className="flex w-full items-center gap-3 rounded-[0.5rem] border border-slate-100 bg-[#fbfdff] px-3 py-2.5 text-left transition hover:bg-[#f6faff]"
              >
                <span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${agendaDot[it.kind]}`} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-black text-slate-900">{it.title}</span>
                  <span className="block truncate text-xs font-semibold text-slate-400">{it.subtitle}</span>
                </span>
                {it.urgent && (
                  <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-[0.6rem] font-black text-red-600">URGENT</span>
                )}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {summaryCards.map((card) => (
          <Link
            key={card.label}
            to={card.href}
            className={`flex flex-col rounded-[0.5rem] border p-4 shadow-sm transition hover:shadow-md sm:p-5 ${
              'alert' in card && card.alert
                ? 'border-amber-200 bg-amber-50 hover:border-amber-300'
                : 'border-white bg-white hover:border-slate-200'
            }`}
          >
            {/* Label + icon share the top row; the value sits on its own line
                below so a large amount can never collide with the icon. */}
            <div className="flex items-start justify-between gap-2">
              <p className="min-h-[2rem] text-xs font-semibold leading-snug text-slate-500 sm:min-h-[2.5rem] sm:text-sm">
                {card.label}
              </p>
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.5rem] sm:h-11 sm:w-11 ${
                  'alert' in card && card.alert
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-[#e8f1fb] text-[#1B3C6C]'
                }`}
              >
                <card.icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
            <p
              className={`mt-1 text-2xl font-black tracking-[-0.02em] sm:text-3xl ${
                'alert' in card && card.alert ? 'text-amber-700' : ''
              }`}
            >
              {card.value}
            </p>
            <p className="mt-auto pt-3 text-xs font-medium text-slate-500 sm:pt-4 sm:text-sm">
              {card.detail}
            </p>
          </Link>
        ))}
      </section>

      {/* ── My Tasks widget ── */}
      <section className="rounded-[0.5rem] border border-white bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-[0.5rem] bg-[#e8f1fb] text-[#1B3C6C]">
              <ListTodo className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#32639b]">My To-Do</p>
              <h2 className="text-xl font-black tracking-[-0.02em]">
                {myOpenTasks.length} open task{myOpenTasks.length !== 1 ? 's' : ''}
              </h2>
            </div>
          </div>
          <Link to="/portal/tasks" className="text-sm font-bold text-[#1B3C6C] transition hover:underline">
            View all →
          </Link>
        </div>
        <div className="mt-3 flex gap-2">
          <input
            value={quickTask}
            onChange={(e) => setQuickTask(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submitQuickTask(); }}
            placeholder="Quick add a task…"
            className="flex-1 rounded-[0.5rem] border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-[#1B3C6C]"
          />
          <button
            type="button"
            onClick={submitQuickTask}
            disabled={!quickTask.trim()}
            className="inline-flex items-center justify-center gap-1.5 rounded-[0.5rem] bg-[#1B3C6C] px-3.5 py-2 text-sm font-bold text-white transition hover:bg-[#153158] disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
        {myOpenTasks.length > 0 && (
          <div className="mt-3 space-y-2">
            {myOpenTasks.slice(0, 5).map((task) => {
              const overdue = !!task.dueAt && new Date(task.dueAt.includes('T') ? task.dueAt : `${task.dueAt}T23:59:59`).getTime() < Date.now();
              return (
                <div key={task.id} className="flex items-center gap-3 rounded-[0.5rem] border border-slate-200 bg-[#fbfdff] px-3 py-2">
                  <button
                    type="button"
                    onClick={() => updateTask(task.id, { done: true })}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-slate-300 transition hover:border-emerald-500 hover:bg-emerald-500 hover:text-white"
                    aria-label="Mark done"
                  >
                    <Check className="h-3 w-3 opacity-0 hover:opacity-100" />
                  </button>
                  <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-800">{task.title}</span>
                  {task.dueAt && (
                    <span className={`inline-flex shrink-0 items-center gap-1 text-xs font-bold ${overdue ? 'text-red-500' : 'text-slate-400'}`}>
                      <CalendarClock className="h-3 w-3" />
                      {new Date(task.dueAt.slice(0, 10) + 'T12:00:00').toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              );
            })}
            {myOpenTasks.length > 5 && (
              <Link to="/portal/tasks" className="block pt-1 text-center text-xs font-bold text-slate-400 hover:text-[#1B3C6C]">
                +{myOpenTasks.length - 5} more
              </Link>
            )}
          </div>
        )}
      </section>

      <section className="rounded-[0.5rem] border border-white bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#32639b]">
              Financing
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.02em]">
              Financing pipeline
            </h2>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-[0.5rem] bg-[#e8f1fb] text-[#1B3C6C]">
            <BadgeDollarSign className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Link to="/portal/financing" className="block rounded-[0.5rem] border border-slate-200 bg-[#fbfdff] p-4 transition hover:border-slate-300 hover:shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
              Financing Pipeline
            </p>
            <p className="mt-2 text-3xl font-black">
              {formatCurrency(financingPipeline)}
            </p>
          </Link>
          <Link to="/portal/financing" className="block rounded-[0.5rem] border border-slate-200 bg-[#fbfdff] p-4 transition hover:border-slate-300 hover:shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
              Financing Required Deals
            </p>
            <p className="mt-2 text-3xl font-black">
              {financingRequiredDeals.length}
            </p>
          </Link>
        </div>
      </section>

      <section className="rounded-[0.5rem] border border-white bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#32639b]">
              Consultations
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.02em]">
              Consultation schedule
            </h2>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-[0.5rem] bg-[#e8f1fb] text-[#1B3C6C]">
            <CalendarDays className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[16rem_1fr]">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            <Link to="/portal/appointments" className="block rounded-[0.5rem] border border-slate-200 bg-[#fbfdff] p-4 transition hover:border-slate-300 hover:shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                Today's Consultations
              </p>
              <p className="mt-2 text-3xl font-black">
                {todayAppointments.length}
              </p>
            </Link>
            <Link to="/portal/appointments" className="block rounded-[0.5rem] border border-slate-200 bg-[#fbfdff] p-4 transition hover:border-slate-300 hover:shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                Upcoming Consultations
              </p>
              <p className="mt-2 text-3xl font-black">
                {upcomingAppointments.length}
              </p>
            </Link>
            <Link to="/portal/appointments" className="col-span-2 block rounded-[0.5rem] border border-amber-200 bg-amber-50 p-4 transition hover:border-amber-300 hover:shadow-sm lg:col-span-1">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-amber-800">
                Needs Attention
              </p>
              <p className="mt-2 text-3xl font-black">
                {needsAttentionAppointments.length}
              </p>
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((appointment) => (
                <button
                  key={appointment.id}
                  type="button"
                  onClick={() => navigate('/portal/appointments', { state: { openAppointmentId: appointment.id } })}
                  className="w-full rounded-[0.5rem] border border-slate-200 bg-[#fbfdff] p-3 text-left transition hover:border-slate-300 hover:shadow-sm"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-black text-slate-950">
                        {appointment.customerName ||
                          appointment.title ||
                          getDealLabel(appointment.dealId)}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {formatDate(appointment.appointmentDate)} ·{' '}
                        {appointment.appointmentTime || 'Time not set'}
                      </p>
                      <p className="mt-1 text-xs font-black uppercase text-[#32639b]">
                        {formatConsultationStage(appointment.consultationStage)}
                      </p>
                    </div>
                    <span className="w-fit rounded-full bg-[#e8f1fb] px-3 py-1 text-xs font-black text-[#1B3C6C]">
                      {currentUser?.role === 'admin'
                        ? getRepName(appointment.assignedRepId)
                        : appointment.status}
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <p className="rounded-[0.5rem] border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                No upcoming consultations yet.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
