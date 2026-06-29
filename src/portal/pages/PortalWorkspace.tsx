import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  CalendarPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  FileText,
  MapPin,
  MoreHorizontal,
  MessageSquarePlus,
  Phone,
  PhoneCall,
  SkipForward,
  Sparkles,
  TimerReset,
  Trash2,
  Upload,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { usePortalAuth } from '../auth';
import { usePortalData } from '../data/store';
import { showToast } from '../lib/toast';
import { cn } from '../../lib/utils';
import type {
  Appointment,
  CallOutcome,
  Client,
  Interaction,
  Lead,
  LeadImportResult,
  LeadImportRow,
} from '../data/types';

// ─── Outcome buttons ──────────────────────────────────────────────────────────
type Tone = 'neutral' | 'good' | 'bad' | 'warn';
type OutcomeAction = { value: CallOutcome; label: string; shortLabel?: string; tone: Tone };
const NO_CONTACT_OUTCOMES: OutcomeAction[] = [
  { value: 'no_answer', label: 'No answer', tone: 'neutral' },
  { value: 'voicemail', label: 'Left voicemail', tone: 'neutral' },
];
const TALKED_OUTCOMES: OutcomeAction[] = [
  { value: 'callback_scheduled', label: 'Schedule callback', shortLabel: 'Callback', tone: 'warn' },
  { value: 'not_interested', label: 'Not interested', tone: 'bad' },
];
const BAD_LEAD_OUTCOMES: OutcomeAction[] = [
  { value: 'wrong_number', label: 'Wrong number', tone: 'bad' },
  { value: 'not_qualified', label: 'Not qualified', tone: 'bad' },
  { value: 'duplicate', label: 'Duplicate', tone: 'bad' },
];
const SECONDARY_OUTCOMES: OutcomeAction[] = [
  { value: 'needs_follow_up', label: 'Needs follow-up', tone: 'warn' },
  { value: 'already_booked', label: 'Already booked', tone: 'good' },
];
const OUTCOMES = [
  ...NO_CONTACT_OUTCOMES,
  ...TALKED_OUTCOMES,
  ...BAD_LEAD_OUTCOMES,
  ...SECONDARY_OUTCOMES,
];

const toneClasses: Record<Tone, string> = {
  neutral: 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
  good: 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100',
  bad: 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100',
  warn: 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function telHref(phone: string) {
  const safe = phone.replace(/[^+\d]/g, '');
  return safe ? `tel:${safe}` : null;
}

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-CA', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function fmtClock(time: string | null | undefined): string {
  if (!time) return 'TBD';
  const [h, m] = String(time).split(':').map(Number);
  if (Number.isNaN(h)) return String(time);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m || 0).padStart(2, '0')} ${period}`;
}

function startOfLocalDate(offsetDays: number) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dateInputValue(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function leadUrgency(lead: Lead) {
  const now = Date.now();
  if (lead.callbackAt) {
    const callback = new Date(lead.callbackAt).getTime();
    if (!Number.isNaN(callback) && callback <= now) return 'Callback due now';
  }
  if (lead.attemptCount === 0) return `Fresh lead - submitted ${timeAgo(lead.submittedAt)}`;
  if (lead.lastContactedAt) return `Attempt ${lead.attemptCount + 1} - last touch ${timeAgo(lead.lastContactedAt)}`;
  return `Attempt ${lead.attemptCount + 1}`;
}

function callReason(lead: Lead) {
  const signals = [
    lead.projectType,
    lead.city,
    lead.budget ? `${lead.budget} budget` : '',
    lead.financingInterest ? 'financing interest' : '',
  ].filter(Boolean);
  if (signals.length > 0) return signals.join(' - ');
  if (lead.sourceDetail) return lead.sourceDetail;
  return 'Needs qualification';
}

function leadToClient(lead: Lead): Client {
  return {
    id: lead.id, // used only as the appointment prefill nav guard key
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    address: lead.address,
    city: lead.city,
    postalCode: lead.postalCode,
    projectTypes: lead.projectType ? [lead.projectType] : [],
    internalNotes: lead.notes,
    source: 'lead',
    householdId: null,
    createdByUserId: '',
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
  };
}

const statusLabel: Record<string, string> = {
  new: 'New',
  attempting: 'Attempting',
  callback_scheduled: 'Callback set',
  booked: 'Booked',
  qualified: 'Qualified',
  won: 'Won',
  lost: 'Lost',
  dead: 'Dead',
  duplicate: 'Duplicate',
};

const outcomeLabel: Record<string, string> = Object.fromEntries(
  OUTCOMES.map((o) => [o.value, o.label])
);

// ─── Existing-client detection ────────────────────────────────────────────────
// Cross-references a queue lead against the Clients list by phone (last 10
// digits), email, or name. A match usually means the person was dealt with /
// booked before and slipped past the import — flag it so it can be marked.
type ClientMatchField = 'phone' | 'email' | 'name';
type ClientMatch = { clientId: string; clientName: string; fields: ClientMatchField[] };
type ClientIndex = {
  byPhone: Map<string, Client>;
  byEmail: Map<string, Client>;
  byName: Map<string, Client>;
};

const phoneKey = (v: string | null | undefined) => {
  const d = String(v ?? '').replace(/\D/g, '');
  return d.length >= 10 ? d.slice(-10) : '';
};
const emailKey = (v: string | null | undefined) => String(v ?? '').trim().toLowerCase();
const nameKey = (v: string | null | undefined) =>
  String(v ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

function buildClientIndex(clients: Client[]): ClientIndex {
  const byPhone = new Map<string, Client>();
  const byEmail = new Map<string, Client>();
  const byName = new Map<string, Client>();
  for (const c of clients) {
    if (c.deletedAt) continue;
    const p = phoneKey(c.phone);
    if (p && !byPhone.has(p)) byPhone.set(p, c);
    const e = emailKey(c.email);
    if (e && !byEmail.has(e)) byEmail.set(e, c);
    const n = nameKey(c.name);
    if (n && !byName.has(n)) byName.set(n, c);
  }
  return { byPhone, byEmail, byName };
}

function matchLeadToClient(lead: Lead, index: ClientIndex): ClientMatch | null {
  const fields: ClientMatchField[] = [];
  let client: Client | undefined;
  const p = phoneKey(lead.phone);
  if (p && index.byPhone.has(p)) { client = index.byPhone.get(p); fields.push('phone'); }
  const e = emailKey(lead.email);
  if (e && index.byEmail.has(e)) { client = client ?? index.byEmail.get(e); fields.push('email'); }
  const n = nameKey(lead.name);
  if (n && index.byName.has(n)) { client = client ?? index.byName.get(n); fields.push('name'); }
  if (!client) return null;
  return { clientId: client.id, clientName: client.name, fields };
}

// ─── Timeline ─────────────────────────────────────────────────────────────────
function LeadTimeline({ lead }: { lead: Lead }) {
  const entries = useMemo(() => {
    const items: Array<{ id: string; when: string; title: string; sub: string }> = [];
    for (const i of lead.interactions ?? []) {
      const title =
        i.channel === 'call'
          ? `Call — ${i.outcome ? outcomeLabel[i.outcome] ?? i.outcome : 'logged'}`
          : i.channel === 'note'
            ? 'Note'
            : i.channel === 'system'
              ? 'System'
              : i.channel;
      items.push({ id: i.id, when: i.occurredAt, title, sub: i.body });
    }
    items.push({
      id: `submitted-${lead.id}`,
      when: lead.submittedAt,
      title: 'Lead submitted',
      sub: `${lead.source}${lead.sourceDetail ? ` · ${lead.sourceDetail}` : ''}`,
    });
    return items.sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime());
  }, [lead]);

  return (
    <div className="flex flex-col gap-3">
      {entries.map((e) => (
        <div key={e.id} className="flex gap-3">
          <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#1B3C6C]" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800">{e.title}</p>
            {e.sub && <p className="text-sm text-slate-600 break-words">{e.sub}</p>}
            <p className="text-xs font-semibold text-slate-400">{fmtDateTime(e.when)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Customer card + call controls ────────────────────────────────────────────
function CustomerCard({
  lead,
  index,
  total,
  clientMatch,
  onPrev,
  onNext,
  onSkip,
}: {
  lead: Lead;
  index: number;
  total: number;
  clientMatch: ClientMatch | null;
  onPrev: () => void;
  onNext: () => void;
  onSkip: () => void;
}) {
  const navigate = useNavigate();
  const { logInteraction, scheduleCallback, updateLead } = usePortalData();

  const [callNote, setCallNote] = useState('');
  const [copied, setCopied] = useState(false);
  const [showCallback, setShowCallback] = useState(false);
  const [cbDate, setCbDate] = useState('');
  const [cbTime, setCbTime] = useState('10:00');
  const [showMoreOutcomes, setShowMoreOutcomes] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    setCallNote('');
    setShowCallback(false);
    setCbDate('');
    setCbTime('10:00');
    setShowMoreOutcomes(false);
    setShowNote(false);
    setNoteText('');
  }, [lead.id]);

  const tel = telHref(lead.phone);
  const callbackDue =
    lead.callbackAt && new Date(lead.callbackAt).getTime() <= Date.now()
      ? fmtDateTime(lead.callbackAt)
      : '';
  const lastTouch = lead.lastContactedAt ? timeAgo(lead.lastContactedAt) : '';
  const reason = callReason(lead);
  const urgency = leadUrgency(lead);
  const quickCallback = (days: number, time: string) => {
    setCbDate(dateInputValue(startOfLocalDate(days)));
    setCbTime(time);
    setShowCallback(true);
  };

  const handleOutcome = async (outcome: CallOutcome) => {
    if (outcome === 'callback_scheduled') {
      setShowCallback(true);
      return;
    }
    await logInteraction(lead.id, { channel: 'call', outcome, body: callNote.trim() });
    showToast({ message: `Logged: ${outcomeLabel[outcome]}`, variant: 'success' });
    onNext();
  };

  const handleSaveCallback = async () => {
    if (!cbDate) return;
    const callbackAt = new Date(`${cbDate}T${cbTime || '10:00'}`).toISOString();
    await scheduleCallback(lead.id, callbackAt, callNote.trim());
    showToast({ message: 'Callback scheduled', variant: 'success' });
    setShowCallback(false);
    onNext();
  };

  const handleSaveNote = async () => {
    if (!noteText.trim()) return;
    await logInteraction(lead.id, { channel: 'note', body: noteText.trim() });
    setNoteText('');
    setShowNote(false);
    showToast({ message: 'Note added', variant: 'success' });
  };

  const handleBook = () => {
    // Optimistically take it out of the queue; the booking flow confirms server-side.
    updateLead(lead.id, { status: 'booked' });
    navigate('/portal/appointments', {
      state: { prefillClient: leadToClient(lead), fromLeadId: lead.id },
    });
  };

  const copyPhone = async () => {
    try {
      await navigator.clipboard.writeText(lead.phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      showToast({ message: 'Could not copy', variant: 'error' });
    }
  };

  const detail = (label: string, value: string, className = '') =>
    value ? (
      <div className={className}>
        <p className="text-[0.7rem] font-bold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-slate-800 break-words">{value}</p>
      </div>
    ) : null;

  const outcomeButton = (o: OutcomeAction, className = '') => (
    <button
      key={o.value}
      onClick={() => handleOutcome(o.value)}
      className={cn('min-h-11 rounded-[0.65rem] border px-3 py-2 text-sm font-black transition', toneClasses[o.tone], className)}
    >
      {o.shortLabel ?? o.label}
    </button>
  );

  return (
    <div className="overflow-hidden rounded-[0.9rem] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-500 ring-1 ring-slate-200">
              {index + 1} of {total}
            </span>
            <span className="rounded-full bg-[#e8f1fb] px-2.5 py-1 text-xs font-black text-[#1B3C6C]">
              {statusLabel[lead.status] ?? lead.status}
            </span>
            {callbackDue && (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-800">
                Callback due {callbackDue}
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button onClick={onPrev} disabled={index <= 0} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40" aria-label="Previous lead">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={onNext} disabled={index >= total - 1} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40" aria-label="Next lead">
              <ChevronRight className="h-4 w-4" />
            </button>
            <button onClick={onSkip} className="ml-1 inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50">
              <SkipForward className="h-4 w-4" /> Skip
            </button>
          </div>
        </div>
      </div>

      <div className="p-5">
        {clientMatch && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-[0.8rem] border border-amber-300 bg-amber-50 px-4 py-3">
            <div className="flex items-start gap-2">
              <UserCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <div>
                <p className="text-sm font-black text-amber-900">Already in your Clients list</p>
                <p className="text-xs font-semibold text-amber-800">
                  Matched on {clientMatch.fields.join(' & ')} — they may have been booked before. If so, mark this lead &ldquo;Already booked&rdquo; or &ldquo;Duplicate&rdquo;.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/portal/clients', { state: { openClientId: clientMatch.clientId } })}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-bold text-amber-900 transition hover:bg-amber-100"
            >
              View client
            </button>
          </div>
        )}
        <div className="rounded-[0.9rem] border border-[#d8e5f4] bg-[#f7fbff] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.16em] text-[#32639b]">
                <Sparkles className="h-3.5 w-3.5" /> Current call
              </p>
              <h2 className="mt-2 text-4xl font-black tracking-[-0.02em] text-slate-950 sm:text-5xl">
                {lead.name}
              </h2>
              <p className="mt-2 text-lg font-bold text-slate-700">{reason}</p>
            </div>
            <div className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-[#1B3C6C] ring-1 ring-[#c9dbef]">
              {urgency}
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">Phone</p>
              <p className="mt-0.5 truncate text-3xl font-black text-slate-950">{lead.phone || 'No phone number'}</p>
            </div>
            <div className="flex flex-wrap gap-2 md:justify-end">
            {lead.phone && (
              <button onClick={copyPhone} className="inline-flex items-center gap-1.5 rounded-[0.7rem] border border-slate-300 px-3 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}
            </div>
          </div>

          <div className="mt-4">
          {tel ? (
            <a href={tel} className="flex w-full items-center justify-center gap-3 rounded-[0.85rem] bg-[#1B3C6C] px-5 py-5 text-xl font-black text-white shadow-sm transition hover:bg-[#153158]">
              <PhoneCall className="h-6 w-6" /> Call now
            </a>
          ) : (
            <span className="flex w-full items-center justify-center gap-3 rounded-[0.85rem] border border-slate-200 px-5 py-5 text-xl font-black text-slate-400">
              <Phone className="h-5 w-5" /> No phone number
            </span>
          )}
          </div>
        </div>

        <details className="mt-4 rounded-[0.8rem] border border-slate-200 bg-white">
          <summary className="cursor-pointer px-4 py-3 text-sm font-black text-slate-600 marker:text-slate-400">
            Lead details
          </summary>
          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 px-4 py-4 sm:grid-cols-4">
          {detail('Email', lead.email)}
          {detail('Budget', lead.budget)}
          {detail(
            'Financing',
            lead.financingInterest == null ? '' : lead.financingInterest ? 'Interested' : 'No'
          )}
          {detail('Attempts', `${lead.attemptCount}${lastTouch ? ` - last ${lastTouch}` : ''}`)}
          {detail('Source', [lead.source, lead.sourceDetail].filter(Boolean).join(' - '), 'sm:col-span-2')}
          {detail('Submitted', fmtDateTime(lead.submittedAt))}
          {lead.address && (
            <div className="col-span-2 sm:col-span-4">
              <p className="text-[0.7rem] font-bold uppercase tracking-wide text-slate-400">Address</p>
              <p className="flex items-center gap-1 text-sm font-semibold text-slate-800">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                {[lead.address, lead.city, lead.postalCode].filter(Boolean).join(', ')}
              </p>
            </div>
          )}
          </div>
        </details>

        {lead.notes && (
          <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3">
            <p className="text-[0.7rem] font-bold uppercase tracking-wide text-slate-400">Lead notes</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{lead.notes}</p>
          </div>
        )}

        <div className="mt-5 rounded-[0.85rem] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">What happened?</p>
              <p className="text-sm font-semibold text-slate-600">Disposition</p>
            </div>
            <button onClick={() => setShowNote((v) => !v)} className="inline-flex items-center gap-2 rounded-[0.6rem] border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
              <MessageSquarePlus className="h-4 w-4" /> Add note
            </button>
          </div>

          <textarea
            value={callNote}
            onChange={(e) => setCallNote(e.target.value)}
            placeholder="Quick call note (optional)"
            rows={2}
            className="mt-3 w-full rounded-[0.7rem] border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#2b5a96] focus:ring-2 focus:ring-blue-100"
          />

          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            <div className="rounded-[0.75rem] border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">No contact</p>
              <div className="mt-2 grid gap-2">
                {NO_CONTACT_OUTCOMES.map((o) => outcomeButton(o, 'bg-white'))}
              </div>
            </div>
            <div className="rounded-[0.75rem] border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Talked</p>
              <div className="mt-2 grid gap-2">
                <button onClick={handleBook} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[0.65rem] bg-emerald-600 px-3 py-2 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700">
                  <CalendarPlus className="h-4 w-4" /> Book appointment
                </button>
                {TALKED_OUTCOMES.map((o) => outcomeButton(o, o.value === 'not_interested' ? 'bg-white' : ''))}
              </div>
            </div>
            <div className="rounded-[0.75rem] border border-red-200 bg-red-50 p-3">
              <p className="text-xs font-black uppercase tracking-wide text-red-700">Bad lead</p>
              <div className="mt-2 grid gap-2">
                {BAD_LEAD_OUTCOMES.map((o) => outcomeButton(o))}
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowMoreOutcomes((v) => !v)}
            className="mt-2 inline-flex items-center gap-1.5 rounded-[0.6rem] px-2 py-1.5 text-sm font-bold text-slate-500 transition hover:bg-white hover:text-slate-700"
          >
            <MoreHorizontal className="h-4 w-4" /> More outcomes
          </button>
          {showMoreOutcomes && (
            <div className="mt-2 flex flex-wrap gap-2">
              {SECONDARY_OUTCOMES.map((o) => (
                <button
                  key={o.value}
                  onClick={() => handleOutcome(o.value)}
                  className={cn('rounded-[0.6rem] border px-3 py-2 text-sm font-bold transition', toneClasses[o.tone])}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}

          {showCallback && (
            <div className="mt-3 flex flex-wrap items-end gap-2 rounded-[0.7rem] border border-amber-200 bg-amber-50 p-3">
              <div className="basis-full">
                <p className="text-xs font-black uppercase tracking-wide text-amber-900">Callback time</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" onClick={() => quickCallback(0, '16:00')} className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-black text-amber-900 hover:bg-amber-100">Later today</button>
                  <button type="button" onClick={() => quickCallback(1, '10:00')} className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-black text-amber-900 hover:bg-amber-100">Tomorrow AM</button>
                  <button type="button" onClick={() => quickCallback(7, '10:00')} className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-black text-amber-900 hover:bg-amber-100">Next week</button>
                </div>
              </div>
              <label className="text-xs font-bold text-amber-900">
                Date
                <input type="date" value={cbDate} onChange={(e) => setCbDate(e.target.value)} className="mt-1 block rounded-lg border border-amber-300 px-2 py-1.5 text-sm" />
              </label>
              <label className="text-xs font-bold text-amber-900">
                Time
                <input type="time" value={cbTime} onChange={(e) => setCbTime(e.target.value)} className="mt-1 block rounded-lg border border-amber-300 px-2 py-1.5 text-sm" />
              </label>
              <button onClick={handleSaveCallback} disabled={!cbDate} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">
                <Clock className="h-4 w-4" /> Set callback
              </button>
              <button onClick={() => setShowCallback(false)} className="rounded-lg px-2 py-2 text-sm font-bold text-amber-800">Cancel</button>
            </div>
          )}
        </div>

        {showNote && (
          <div className="mt-3 flex flex-col gap-2 rounded-[0.7rem] border border-slate-200 bg-slate-50 p-3">
            <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={2} placeholder="Add a note to this lead's timeline" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#2b5a96] focus:ring-2 focus:ring-blue-100" />
            <div className="flex gap-2">
              <button onClick={handleSaveNote} disabled={!noteText.trim()} className="rounded-lg bg-[#1B3C6C] px-3 py-2 text-sm font-bold text-white disabled:opacity-50">Save note</button>
              <button onClick={() => setShowNote(false)} className="rounded-lg px-3 py-2 text-sm font-bold text-slate-600">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
// ─── Import modal (admin) ─────────────────────────────────────────────────────
const IMPORT_COLUMNS = [
  'name', 'phone', 'email', 'city', 'address', 'postalCode',
  'projectType', 'budget', 'financingInterest', 'source', 'submittedAt', 'importStatus', 'notes',
];

type ImportSourceChoice = 'auto' | 'meta' | 'website_intake';

const FIELD_ALIASES: Record<keyof Omit<LeadImportRow, 'extraAnswers' | 'importSource'>, string[]> = {
  name: ['name', 'fullname', 'customername', 'contactname', 'leadname', 'firstname', 'firstandlastname'],
  phone: ['phone', 'phonenumber', 'mobile', 'mobilephone', 'contactphone', 'telephone', 'tel'],
  email: ['email', 'emailaddress', 'contactemail'],
  city: ['city', 'town', 'municipality'],
  address: ['address', 'streetaddress', 'projectaddress', 'homeaddress', 'propertyaddress'],
  postalCode: ['postalcode', 'postcode', 'zip', 'zipcode'],
  projectType: ['projecttype', 'project', 'servicetype', 'service', 'renovationtype', 'typeofproject'],
  budget: ['budget', 'projectbudget', 'estimatedbudget', 'budgetrange'],
  financingInterest: ['financinginterest', 'financing', 'needfinancing', 'financingneeded', 'interestedinfinancing'],
  source: ['source', 'leadsource'],
  sourceDetail: ['sourcedetail', 'campaign', 'campaignname', 'formname', 'adname'],
  submittedAt: ['submittedat', 'submitted', 'createdat', 'timestamp', 'date', 'submissiondate'],
  notes: ['notes', 'note', 'comments', 'message', 'details'],
  externalId: ['externalid', 'metaleadid', 'leadid', 'id'],
  importStatus: ['importstatus', 'status', 'leadstatus', 'disposition'],
};

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function canonicalField(header: string): keyof Omit<LeadImportRow, 'extraAnswers' | 'importSource'> | null {
  const normalized = normalizeHeader(header);
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    if (aliases.includes(normalized)) return field as keyof Omit<LeadImportRow, 'extraAnswers' | 'importSource'>;
  }
  return null;
}

function parseBooleanLike(value: string): boolean | null {
  const v = value.trim().toLowerCase();
  if (['yes', 'true', 'y', '1', 'interested', 'needed'].includes(v)) return true;
  if (['no', 'false', 'n', '0', 'not interested', 'none'].includes(v)) return false;
  return null;
}

function parseCsv(text: string, importSource: ImportSourceChoice): LeadImportRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];
  const delim = lines[0].includes('\t') ? '\t' : ',';
  const splitLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (ch === delim && !inQ) {
        out.push(cur); cur = '';
      } else cur += ch;
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };
  const rawHeader = splitLine(lines[0]);
  const header = rawHeader.map(canonicalField);
  const hasHeader = header.some(Boolean);
  const explicitImportStatusIndex = rawHeader.findIndex((h) => normalizeHeader(h) === 'importstatus');
  const colMap = hasHeader
    ? header.map((field, index) =>
        field === 'importStatus' && explicitImportStatusIndex >= 0 && index !== explicitImportStatusIndex
          ? null
          : field
      )
    : (IMPORT_COLUMNS as Array<keyof Omit<LeadImportRow, 'extraAnswers' | 'importSource'>>);
  const dataLines = hasHeader ? lines.slice(1) : lines;
  const rows: LeadImportRow[] = [];
  for (const line of dataLines) {
    const cells = splitLine(line);
    const row: Partial<LeadImportRow> = { importSource };
    const extraAnswers: Record<string, string> = {};
    cells.forEach((val, i) => {
      const key = colMap[i];
      if (key) {
        if (key === 'financingInterest') row[key] = parseBooleanLike(val);
        else row[key] = val;
      } else if (hasHeader && val) {
        const label = rawHeader[i] || `Column ${i + 1}`;
        extraAnswers[label] = val;
      }
    });
    if (!row.source && importSource === 'auto' && Object.keys(extraAnswers).length > 0) {
      row.source = 'website_intake';
    } else if (!row.source && importSource !== 'auto') {
      row.source = importSource === 'website_intake' ? 'website_intake' : 'meta';
    }
    if (Object.keys(extraAnswers).length > 0) row.extraAnswers = extraAnswers;
    const fallbackName = [extraAnswers['First Name'], extraAnswers['Last Name']].filter(Boolean).join(' ');
    if (!row.name && fallbackName) row.name = fallbackName;
    if (row.name || row.phone || row.email) rows.push(row as LeadImportRow);
  }
  return rows;
}

function ImportModal({ onClose }: { onClose: () => void }) {
  const { importLeads } = usePortalData();
  const [text, setText] = useState('');
  const [importSource, setImportSource] = useState<ImportSourceChoice>('auto');
  const [busy, setBusy] = useState(false);
  const [lastResult, setLastResult] = useState<LeadImportResult | null>(null);
  const rows = useMemo(() => parseCsv(text, importSource), [text, importSource]);

  const handleImport = async () => {
    if (rows.length === 0) return;
    setBusy(true);
    const result = await importLeads(rows);
    setBusy(false);
    if (result) {
      setLastResult(result);
      showToast({
        message: `${result.created} created, ${result.updated} updated${result.failed ? `, ${result.failed} failed` : ''}`,
        description: `${result.merged} richer merge(s), ${result.duplicates} duplicate(s), ${result.skipped} skipped`,
        variant: result.failed ? 'default' : 'success',
        duration: 8000,
      });
      if (result.failed === 0) onClose();
    } else {
      showToast({ message: 'Import failed', variant: 'error' });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="mt-10 w-full max-w-2xl rounded-[0.9rem] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-xl font-black tracking-[-0.02em]">Import leads</h2>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5">
          <div className="grid gap-3 sm:grid-cols-[14rem_minmax(0,1fr)]">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Source
              <select value={importSource} onChange={(e) => setImportSource(e.target.value as ImportSourceChoice)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold normal-case tracking-normal text-slate-700">
                <option value="auto">Auto detect</option>
                <option value="meta">Meta lead sheet</option>
                <option value="website_intake">Website intake sheet</option>
              </select>
            </label>
            <div className="text-sm text-slate-600">
              <p>
                Paste CSV or tab-separated rows from Meta or website intake sheets. Headers can use common names like
                <span className="font-semibold"> full name, phone number, email address, project, budget, financing, importStatus</span>.
              </p>
              <p className="mt-1">
                <code className="rounded bg-slate-100 px-1 text-xs">importStatus</code> is the source of truth: new, callback, booked, duplicate, not_interested.
                Cell colors are ignored; website-only answers are preserved in notes.
              </p>
            </div>
          </div>
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setLastResult(null);
            }}
            rows={10}
            placeholder={`full name,phone number,email address,city,project,budget,importStatus,preferred contact time\nJane Doe,416-555-1212,jane@example.com,Hamilton,Basement,$40k-60k,new,Evenings`}
            className="mt-3 w-full rounded-[0.7rem] border border-slate-300 px-3 py-2 font-mono text-sm outline-none focus:border-[#2b5a96] focus:ring-2 focus:ring-blue-100"
          />
          {lastResult && lastResult.failed > 0 && (
            <div className="mt-3 rounded-[0.7rem] border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <div className="font-bold">{lastResult.failed} row(s) failed and were skipped. The rest of the import continued.</div>
              <ul className="mt-1 space-y-1">
                {lastResult.failures.slice(0, 8).map((failure) => (
                  <li key={`${failure.row}-${failure.reason}`}>
                    Row {failure.row}{failure.name ? ` (${failure.name})` : ''}: {failure.reason}
                  </li>
                ))}
              </ul>
              {lastResult.failures.length > 8 && (
                <div className="mt-1 font-semibold">Showing 8 of {lastResult.failures.length} failed rows.</div>
              )}
            </div>
          )}
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-500">{rows.length} lead(s) detected</span>
            <div className="flex gap-2">
              <button onClick={onClose} className="rounded-[0.7rem] border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button onClick={handleImport} disabled={rows.length === 0 || busy} className="inline-flex items-center gap-2 rounded-[0.7rem] bg-[#1B3C6C] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
                <Upload className="h-4 w-4" /> {busy ? 'Importing…' : `Import ${rows.length}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Admin triage ─────────────────────────────────────────────────────────────
function TriageView() {
  const { getUnassignedLeads, assignLeads, deleteLeads, users } = usePortalData();
  const unassigned = getUnassignedLeads();
  const reps = useMemo(() => users.filter((u) => u.active), [users]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [repId, setRepId] = useState('');
  const [showImport, setShowImport] = useState(false);

  const toggle = (id: string) =>
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allChecked = unassigned.length > 0 && selected.size === unassigned.length;
  const toggleAll = () =>
    setSelected(allChecked ? new Set() : new Set(unassigned.map((l) => l.id)));

  const handleAssign = async () => {
    if (selected.size === 0 || !repId) return;
    const ids = Array.from(selected);
    await assignLeads(ids, repId);
    showToast({ message: `${ids.length} lead(s) assigned`, variant: 'success' });
    setSelected(new Set());
    setRepId('');
  };

  const handleDeleteSelected = async () => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    const confirmed = window.confirm(
      `Permanently delete ${ids.length} selected unassigned lead(s)? This clears them for reupload and cannot be undone.`
    );
    if (!confirmed) return;
    const deleted = await deleteLeads(ids);
    showToast({
      message: `${deleted || ids.length} lead(s) deleted`,
      description: 'You can reupload the corrected sheet now.',
      variant: 'success',
    });
    setSelected(new Set());
  };

  return (
    <div className="rounded-[0.9rem] border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-[#1B3C6C]" />
          <h2 className="text-lg font-black tracking-[-0.01em]">Unassigned leads ({unassigned.length})</h2>
        </div>
        <button onClick={() => setShowImport(true)} className="inline-flex items-center gap-2 rounded-[0.7rem] border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
          <Upload className="h-4 w-4" /> Import leads
        </button>
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-blue-50/60 px-5 py-3">
          <span className="text-sm font-bold text-[#1B3C6C]">{selected.size} selected</span>
          <select value={repId} onChange={(e) => setRepId(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Assign to rep…</option>
            {reps.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <button onClick={handleAssign} disabled={!repId} className="inline-flex items-center gap-1.5 rounded-lg bg-[#1B3C6C] px-3 py-2 text-sm font-bold text-white disabled:opacity-50">
            <UserPlus className="h-4 w-4" /> Assign
          </button>
          <button onClick={handleDeleteSelected} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-bold text-rose-700 hover:bg-rose-50">
            <Trash2 className="h-4 w-4" /> Delete selected
          </button>
        </div>
      )}

      {unassigned.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm font-semibold text-slate-400">No unassigned leads. Import some to get started.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 text-xs font-bold uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3"><input type="checkbox" checked={allChecked} onChange={toggleAll} /></th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {unassigned.map((l) => (
                <tr key={l.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                  <td className="px-4 py-3"><input type="checkbox" checked={selected.has(l.id)} onChange={() => toggle(l.id)} /></td>
                  <td className="px-4 py-3 font-bold text-slate-800">{l.name}</td>
                  <td className="px-4 py-3 text-slate-600">{l.phone || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{l.city || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{l.projectType || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{l.source}</td>
                  <td className="px-4 py-3 text-slate-500">{fmtDateTime(l.submittedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showImport && <ImportModal onClose={() => setShowImport(false)} />}
    </div>
  );
}

// ─── Queue rail ───────────────────────────────────────────────────────────────
function queueTag(lead: Lead, now: number): { label: string; className: string; accent: string } {
  const cbTime = lead.callbackAt ? new Date(lead.callbackAt).getTime() : null;
  // A scheduled callback (the customer asked for a specific time) outranks a plain
  // no-answer follow-up — give it a distinct amber tag + left accent, due or not.
  if (cbTime != null && cbTime <= now) {
    return { label: 'Callback due', className: 'bg-amber-500 text-white', accent: 'border-l-amber-500' };
  }
  if (cbTime != null || lead.status === 'callback_scheduled') {
    return { label: 'Callback', className: 'bg-amber-100 text-amber-800 ring-1 ring-amber-300', accent: 'border-l-amber-400' };
  }
  if (lead.attemptCount === 0 && lead.status === 'new') {
    return { label: 'new', className: 'bg-emerald-100 text-emerald-800', accent: 'border-l-emerald-400' };
  }
  return { label: 'follow-up', className: 'bg-slate-100 text-slate-600', accent: 'border-l-transparent' };
}

function QueueRail({
  queue,
  selectedId,
  onSelect,
  matches,
}: {
  queue: Lead[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  matches: Map<string, ClientMatch>;
}) {
  const now = Date.now();
  const counts = useMemo(() => {
    let callbacks = 0;
    let fresh = 0;
    let followUp = 0;
    for (const l of queue) {
      if (l.callbackAt && new Date(l.callbackAt).getTime() <= now) callbacks++;
      else if (l.attemptCount === 0 && l.status === 'new') fresh++;
      else followUp++;
    }
    return { callbacks, fresh, followUp };
  }, [queue, now]);

  return (
    <div className="rounded-[0.9rem] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-4">
        <p className="text-xs font-black uppercase tracking-wide text-slate-400">Next up</p>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-amber-50 px-2 py-2">
            <p className="text-lg font-black text-amber-800">{counts.callbacks}</p>
            <p className="text-[0.65rem] font-bold uppercase tracking-wide text-amber-700">Due</p>
          </div>
          <div className="rounded-lg bg-emerald-50 px-2 py-2">
            <p className="text-lg font-black text-emerald-800">{counts.fresh}</p>
            <p className="text-[0.65rem] font-bold uppercase tracking-wide text-emerald-700">New</p>
          </div>
          <div className="rounded-lg bg-slate-50 px-2 py-2">
            <p className="text-lg font-black text-slate-700">{counts.followUp}</p>
            <p className="text-[0.65rem] font-bold uppercase tracking-wide text-slate-500">Older</p>
          </div>
        </div>
      </div>
      <div className="max-h-[72vh] overflow-y-auto">
        {queue.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm font-semibold text-slate-400">Queue is empty.</p>
        ) : (
          queue.map((l, idx) => {
            const tag = queueTag(l, now);
            const selected = l.id === selectedId;
            return (
              <button
                key={l.id}
                onClick={() => onSelect(l.id)}
                className={cn(
                  'flex w-full flex-col items-start gap-1 border-b border-b-slate-100 border-l-4 px-4 py-3 text-left transition',
                  tag.accent,
                  selected ? 'bg-[#e8f1fb]' : 'hover:bg-slate-50'
                )}
              >
                <span className="flex w-full items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-sm font-black text-slate-800">
                    {selected ? 'Now: ' : `${idx + 1}. `}{l.name}
                  </span>
                  <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-black', tag.className)}>
                    {tag.label}
                  </span>
                </span>
                <span className="truncate text-xs font-semibold text-slate-500">
                  {[l.city, l.projectType].filter(Boolean).join(' - ') || 'No details'}
                </span>
                <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.65rem] font-semibold text-slate-400">
                  {matches.has(l.id) && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 font-bold text-amber-800"
                      title={`Already in Clients (matched on ${matches.get(l.id)!.fields.join(', ')})`}
                    >
                      <UserCheck className="h-3 w-3" /> in clients
                    </span>
                  )}
                  {l.callbackAt && <span><TimerReset className="mr-0.5 inline h-3 w-3" />{fmtDateTime(l.callbackAt)}</span>}
                  {l.lastContactedAt && <span>last {timeAgo(l.lastContactedAt)}</span>}
                  {l.attemptCount > 0 && <span>{l.attemptCount} attempt(s)</span>}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function ContextPanel({ lead }: { lead: Lead }) {
  const latest = lead.interactions?.[0];
  return (
    <div className="space-y-3">
      <div className="rounded-[0.9rem] border border-slate-200 bg-white/80 p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-[#1B3C6C]" />
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">Context</p>
        </div>
        <div className="mt-3 space-y-3 text-sm">
          <div>
            <p className="text-[0.7rem] font-bold uppercase tracking-wide text-slate-400">Latest touch</p>
            <p className="font-semibold text-slate-700">
              {latest ? `${fmtDateTime(latest.occurredAt)} - ${latest.outcome ? outcomeLabel[latest.outcome] ?? latest.outcome : latest.channel}` : 'No interactions yet'}
            </p>
          </div>
          <div>
            <p className="text-[0.7rem] font-bold uppercase tracking-wide text-slate-400">Contact</p>
            <p className="font-semibold text-slate-700">{lead.email || 'No email'}</p>
            <p className="text-slate-500">{[lead.address, lead.city, lead.postalCode].filter(Boolean).join(', ') || 'No address'}</p>
          </div>
          {lead.notes && (
            <details>
              <summary className="cursor-pointer text-[0.7rem] font-bold uppercase tracking-wide text-slate-400">Lead note</summary>
              <p className="mt-1 text-slate-600 whitespace-pre-wrap">{lead.notes}</p>
            </details>
          )}
          <details>
            <summary className="cursor-pointer text-[0.7rem] font-bold uppercase tracking-wide text-slate-400">Source</summary>
            <p className="mt-1 font-semibold text-slate-700">{[lead.source, lead.sourceDetail].filter(Boolean).join(' - ') || 'Unknown'}</p>
          </details>
        </div>
      </div>

      <details className="rounded-[0.9rem] border border-slate-200 bg-white/80 shadow-sm">
        <summary className="cursor-pointer px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-400 marker:text-slate-400">Timeline</summary>
        <div className="border-t border-slate-100 p-4">
          <LeadTimeline lead={lead} />
        </div>
      </details>
    </div>
  );
}

// ─── Availability peek (read-only agenda, next 2 weeks) ───────────────────────
const AVAIL_DAYS = 14;

function AvailabilityPanel({ onClose }: { onClose: () => void }) {
  const { appointments, users } = usePortalData();
  const [repId, setRepId] = useState('');
  const reps = useMemo(() => users.filter((u) => u.active), [users]);
  const repName = (id: string) => users.find((u) => u.id === id)?.name ?? 'Unassigned';

  const days = useMemo(() => {
    const active = appointments.filter(
      (a) => a.status !== 'cancelled' && (!repId || a.assignedRepId === repId)
    );
    const byDate = new Map<string, Appointment[]>();
    for (const a of active) {
      const list = byDate.get(a.appointmentDate);
      if (list) list.push(a);
      else byDate.set(a.appointmentDate, [a]);
    }
    const result: Array<{ key: string; date: Date; appts: Appointment[] }> = [];
    for (let i = 0; i < AVAIL_DAYS; i++) {
      const date = startOfLocalDate(i);
      const key = dateInputValue(date);
      const appts = (byDate.get(key) ?? []).slice().sort((x, y) =>
        (x.appointmentTime || '').localeCompare(y.appointmentTime || '')
      );
      result.push({ key, date, appts });
    }
    return result;
  }, [appointments, repId]);

  const heading = (date: Date, i: number) => {
    if (i === 0) return 'Today';
    if (i === 1) return 'Tomorrow';
    return date.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-slate-950/40 backdrop-blur-sm">
      <button type="button" className="flex-1" onClick={onClose} aria-label="Close availability" />
      <div className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#32639b]">Availability</p>
            <h2 className="mt-0.5 text-xl font-black tracking-[-0.02em]">Next 2 weeks</h2>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="border-b border-slate-100 px-5 py-3">
          <select
            value={repId}
            onChange={(e) => setRepId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
          >
            <option value="">All reps</option>
            {reps.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {days.map((day, i) => (
            <div key={day.key} className={cn('rounded-[0.7rem] border p-3', i === 0 ? 'border-[#1B3C6C]/30 bg-[#f3f8ff]' : 'border-slate-200 bg-white')}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-black text-slate-800">{heading(day.date, i)}</p>
                <span className={cn('rounded-full px-2 py-0.5 text-[0.65rem] font-black', day.appts.length === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600')}>
                  {day.appts.length === 0 ? 'Wide open' : `${day.appts.length} booked`}
                </span>
              </div>
              {day.appts.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {day.appts.map((a) => (
                    <div key={a.id} className="flex items-start gap-2">
                      <span className="mt-0.5 w-16 shrink-0 text-xs font-black tabular-nums text-[#1B3C6C]">{fmtClock(a.appointmentTime)}</span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-800">{a.customerName || a.title || 'Consultation'}</p>
                        <p className="truncate text-xs text-slate-500">
                          {[a.city, !repId ? repName(a.assignedRepId) : ''].filter(Boolean).join(' · ') || a.projectType || 'Consultation'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PortalWorkspace() {
  const { currentUser, isAdmin } = usePortalAuth();
  const { getLeadQueue, getInteractionsForLead, clients } = usePortalData();
  const [tab, setTab] = useState<'queue' | 'triage'>('queue');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [onlyMatches, setOnlyMatches] = useState(false);
  const [showAvailability, setShowAvailability] = useState(false);

  const queue = currentUser ? getLeadQueue(currentUser) : [];
  const queueKeyAll = queue.map((l) => l.id).join(',');

  // Flag queue leads that already exist in the Clients list (phone/email/name).
  const clientIndex = useMemo(() => buildClientIndex(clients), [clients]);
  const matchByLeadId = useMemo(() => {
    const m = new Map<string, ClientMatch>();
    for (const l of queue) {
      const match = matchLeadToClient(l, clientIndex);
      if (match) m.set(l.id, match);
    }
    return m;
  }, [queueKeyAll, clientIndex]); // eslint-disable-line react-hooks/exhaustive-deps
  const matchCount = matchByLeadId.size;

  // Optionally narrow the queue to just the existing-client matches.
  const displayedQueue = onlyMatches ? queue.filter((l) => matchByLeadId.has(l.id)) : queue;
  const queueKey = displayedQueue.map((l) => l.id).join(',');

  // Drop the filter automatically once every match has been worked through.
  useEffect(() => {
    if (onlyMatches && matchCount === 0) setOnlyMatches(false);
  }, [onlyMatches, matchCount]);

  // Keep the selection valid as the (filtered) queue changes.
  const selectedRef = useRef(selectedId);
  selectedRef.current = selectedId;
  useEffect(() => {
    const ids = queueKey ? queueKey.split(',') : [];
    if (ids.length === 0) {
      if (selectedRef.current !== null) setSelectedId(null);
    } else if (!selectedRef.current || !ids.includes(selectedRef.current)) {
      setSelectedId(ids[0]);
    }
  }, [queueKey]);

  // Callback engine: re-evaluate the queue on a timer so a scheduled callback
  // rises to the top the moment its time arrives (sortLeadQueue handles the
  // ordering), and nudge the rep with a toast when one comes due.
  const [nowTick, setNowTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setNowTick((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, []);
  const dueNotifiedRef = useRef<Set<string>>(new Set());
  const dueSeededRef = useRef(false);
  useEffect(() => {
    const now = Date.now();
    const dueIds = queue
      .filter((l) => l.callbackAt && new Date(l.callbackAt).getTime() <= now)
      .map((l) => l.id);
    if (!dueSeededRef.current) {
      // Seed silently on first load so we don't toast for callbacks already due.
      dueSeededRef.current = true;
      dueNotifiedRef.current = new Set(dueIds);
      return;
    }
    for (const id of dueIds) {
      if (dueNotifiedRef.current.has(id)) continue;
      dueNotifiedRef.current.add(id);
      const lead = queue.find((l) => l.id === id);
      showToast({
        message: `Callback due: ${lead?.name ?? 'lead'}`,
        description: 'Moved to the top of your queue.',
        duration: 10000,
      });
    }
    // Allow a re-alert if a callback is rescheduled forward and later comes due.
    for (const id of [...dueNotifiedRef.current]) {
      if (!dueIds.includes(id)) dueNotifiedRef.current.delete(id);
    }
  }, [nowTick, queueKeyAll]); // eslint-disable-line react-hooks/exhaustive-deps

  const index = displayedQueue.findIndex((l) => l.id === selectedId);
  const selectedLead = index >= 0 ? displayedQueue[index] : null;
  // Pull the freshest interactions onto the selected lead for the timeline.
  const selectedWithTimeline = selectedLead
    ? { ...selectedLead, interactions: getInteractionsForLead(selectedLead.id) }
    : null;

  const goNext = () => {
    if (displayedQueue.length === 0) return;
    const next = Math.min(index + 1, displayedQueue.length - 1);
    setSelectedId(displayedQueue[next]?.id ?? null);
  };
  const goPrev = () => {
    if (index > 0) setSelectedId(displayedQueue[index - 1].id);
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#32639b]">Sales Workspace</p>
          <h1 className="mt-1 text-2xl font-black tracking-[-0.02em] text-slate-950">Call flow</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {tab === 'queue' && (
            <button
              onClick={() => setShowAvailability(true)}
              title="Peek at the consultation calendar for the next 2 weeks without leaving the call"
              className="inline-flex items-center gap-2 rounded-[0.7rem] border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <CalendarDays className="h-4 w-4" />
              Availability
            </button>
          )}
          {tab === 'queue' && (
            <button
              onClick={() => setOnlyMatches((v) => !v)}
              disabled={matchCount === 0}
              title="Highlight leads already in your Clients list (matched by phone, email, or name) — likely booked before."
              className={cn(
                'inline-flex items-center gap-2 rounded-[0.7rem] border px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60',
                onlyMatches
                  ? 'border-amber-300 bg-amber-100 text-amber-900'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              )}
            >
              <UserCheck className="h-4 w-4" />
              {matchCount === 0
                ? 'No existing clients'
                : onlyMatches
                  ? `Showing ${matchCount} in clients`
                  : `Existing clients (${matchCount})`}
            </button>
          )}
          {isAdmin && (
            <div className="flex rounded-[0.7rem] border border-slate-200 bg-white p-1 shadow-sm">
              <button onClick={() => setTab('queue')} className={cn('rounded-[0.5rem] px-4 py-2 text-sm font-bold transition', tab === 'queue' ? 'bg-[#1B3C6C] text-white' : 'text-slate-600 hover:bg-slate-50')}>Call queue</button>
              <button onClick={() => setTab('triage')} className={cn('rounded-[0.5rem] px-4 py-2 text-sm font-bold transition', tab === 'triage' ? 'bg-[#1B3C6C] text-white' : 'text-slate-600 hover:bg-slate-50')}>Triage &amp; import</button>
            </div>
          )}
        </div>
      </div>

      {isAdmin && tab === 'triage' ? (
        <TriageView />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[18rem_minmax(0,1fr)_20rem]">
          <QueueRail queue={displayedQueue} selectedId={selectedId} onSelect={setSelectedId} matches={matchByLeadId} />
          {selectedWithTimeline ? (
            <>
              <CustomerCard
                lead={selectedWithTimeline}
                index={index}
                total={displayedQueue.length}
                clientMatch={matchByLeadId.get(selectedWithTimeline.id) ?? null}
                onPrev={goPrev}
                onNext={goNext}
                onSkip={goNext}
              />
              <ContextPanel lead={selectedWithTimeline} />
            </>
          ) : (
            <div className="xl:col-span-2 flex items-center justify-center rounded-[0.9rem] border border-dashed border-slate-300 bg-white p-12">
              <p className="text-center text-sm font-semibold text-slate-400">
                Your queue is empty.
                {isAdmin ? ' Import and assign leads from Triage.' : ' New leads will appear here once assigned.'}
              </p>
            </div>
          )}
        </div>
      )}

      {showAvailability && <AvailabilityPanel onClose={() => setShowAvailability(false)} />}
    </div>
  );
}
