// ─── Submissions log ──────────────────────────────────────────────────────────
// Every consultation-flow submission ever received, and a worklist for clearing
// them. Built because the flow announced nothing but bookings: manual-review,
// nurture, decline and abandoned-calendar leads were captured in silence and
// appeared on no screen.
//
// The governing rule here is that nothing is hidden WITHOUT BEING ASKED FOR.
// There is no archive, no auto-hide, no "resolved" state that removes a row,
// and an already-booked submission still appears, flagged — those are precisely
// the rows the other lead endpoints drop.
//
// Deleted submissions are the single exception, and only since deleting stopped
// being permanent: they sit in their own counted tab rather than mixed into the
// working list. Nothing is destroyed to get them there, and the tab is always
// one click away, so the complete set remains reachable.

import {
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Circle,
  Inbox,
  Mail,
  MapPin,
  Phone,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { usePortalData } from '../data/store';
import { showToast } from '../lib/toast';
import { countUnworkedSubmissions, isUnworkedSubmission } from '../data/submissions';
import { programByKey, readableAnswers } from '../../../lib/program-config';
import type { Lead, RoutingOutcome, SubmissionAppointment } from '../data/types';
import type { SlotBlock } from '../../../lib/lead-slots';
import { BASEMENT_FINANCING_OFFER } from '../../lib/programClosures';

// ─── Display helpers ──────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${formatDate(iso)}, ${d.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' })}`;
}

const OUTCOME_LABEL: Record<string, string> = {
  DIRECT_CALENDAR: 'Direct calendar',
  MANUAL_REVIEW: 'Manual review',
  NURTURE: 'Nurture',
  DECLINE: 'Declined',
};

const OUTCOME_STYLE: Record<string, string> = {
  DIRECT_CALENDAR: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  MANUAL_REVIEW: 'bg-amber-50 text-amber-700 border-amber-200',
  NURTURE: 'bg-sky-50 text-sky-700 border-sky-200',
  DECLINE: 'bg-slate-100 text-slate-600 border-slate-200',
};

const ADDRESS_STATE_LABEL: Record<string, string> = {
  ADDRESS_VERIFIED: 'Verified',
  ADDRESS_INFERRED: 'Confirmed from typed text',
  ADDRESS_UNVERIFIED: 'Unverified',
  ADDRESS_OUTSIDE_SERVICE_AREA: 'Outside Ontario',
};

/**
 * A value we never recorded is not a value.
 *
 * addressResolutionCause is '' on every lead submitted before the column
 * existed, and routingOutcome is null on anything captured before routing was
 * persisted. Rendering either as a real value would invent data — these read as
 * muted "not recorded" instead, and are never dressed up as a finding.
 */
function NotRecorded() {
  return <span className="italic text-slate-400">not recorded</span>;
}

/**
 * What `sourceDetail` actually tells you about where a submission came from.
 *
 * The flow captures `?src=` first, then `utm_source[/utm_medium]`, then a bare
 * `fbclid` as 'meta' — and when none of those are present the API falls back to
 * the program's own slug. That fallback is the subtlety this exists for: a row
 * reading "basement" did NOT come from a campaign called basement, it came from
 * an untagged visit to the basement page. Rendering the two identically would
 * quietly credit organic traffic to whichever ad happens to share the name.
 *
 * So a value that merely echoes the lead's own program is reported as untagged,
 * and only a value the URL actually carried is shown as a campaign.
 */
function trafficSource(lead: Lead): { label: string; tagged: boolean } {
  const detail = (lead.sourceDetail ?? '').trim();
  if (!detail) return { label: '', tagged: false };
  const programSlug = programByKey(lead.programKey)?.slug ?? '';
  if (programSlug && detail.toLowerCase() === programSlug.toLowerCase()) {
    return { label: detail, tagged: false };
  }
  return { label: detail, tagged: true };
}

/**
 * Slot date and time, written the way the homeowner sees them in the booking
 * flow. A rep reading a time aloud on a call should not have to convert it.
 */
function slotDate(d: string) {
  return new Date(`${d}T12:00:00`).toLocaleDateString('en-CA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}
function slotTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function humanCause(cause: string) {
  return cause
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((word, i) => (i === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(' ');
}

/** Provider failures are our fault, not the homeowner's — flagged differently. */
const PROVIDER_CAUSES = new Set([
  'PROVIDER_NOT_CONFIGURED',
  'PROVIDER_QUOTA_EXHAUSTED',
  'PROVIDER_ERROR',
]);

type OutcomeFilter = 'ALL' | RoutingOutcome;

const FILTERS: Array<{ key: OutcomeFilter; label: string }> = [
  { key: 'ALL', label: 'All' },
  { key: 'DIRECT_CALENDAR', label: 'Direct calendar' },
  { key: 'MANUAL_REVIEW', label: 'Manual review' },
  { key: 'NURTURE', label: 'Nurture' },
  { key: 'DECLINE', label: 'Declined' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PortalSubmissions() {
  const { fetchSubmissions, markSubmissionContacted, trashLeads, restoreLeads, purgeLeads } =
    usePortalData();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [appointments, setAppointments] = useState<SubmissionAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [outcomeFilter, setOutcomeFilter] = useState<OutcomeFilter>('ALL');
  const [unworkedOnly, setUnworkedOnly] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmPurge, setConfirmPurge] = useState(false);
  /** The Deleted view is a separate mode, not an outcome filter. */
  const [showDeleted, setShowDeleted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const payload = await fetchSubmissions();
      if (cancelled) return;
      // A failed fetch must never render as "no submissions" — on this screen
      // an empty state would read as an empty backlog, which is the exact
      // false reassurance the log exists to prevent.
      if (!payload) {
        setLoadFailed(true);
        setIsLoading(false);
        return;
      }
      setLeads(payload.leads);
      setAppointments(payload.appointments);
      setIsLoading(false);
    })().catch(() => {
      if (cancelled) return;
      setLoadFailed(true);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchSubmissions]);

  const appointmentById = useMemo(
    () => new Map(appointments.map((a) => [a.id, a])),
    [appointments]
  );

  const unworkedCount = useMemo(() => countUnworkedSubmissions(leads), [leads]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter((lead) => {
      // Deleted rows live in their own view. This is the one place the log
      // hides something, and only because the alternative — deleted leads mixed
      // into the working list — is what makes a delete feel unsafe to use.
      if (Boolean(lead.deletedAt) !== showDeleted) return false;
      if (outcomeFilter !== 'ALL' && lead.routingOutcome !== outcomeFilter) return false;
      // Same predicate as the dashboard badge, so the number you clicked and
      // the rows you land on always agree.
      if (unworkedOnly && !isUnworkedSubmission(lead)) return false;
      if (!q) return true;
      // sourceDetail is searchable so a campaign can be pulled up as a set —
      // typing "fb-basement-financing" is the fastest way to see what one ad
      // actually produced.
      return [lead.name, lead.phone, lead.email, lead.address, lead.city, lead.resolvedMunicipality, lead.sourceDetail]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q));
    });
  }, [leads, outcomeFilter, unworkedOnly, query, showDeleted]);

  const deletedCount = useMemo(() => leads.filter((l) => l.deletedAt).length, [leads]);

  const selected = selectedId ? leads.find((l) => l.id === selectedId) ?? null : null;

  // Selection is pruned to what is currently visible whenever the filters
  // change. Without this, narrowing the view would leave rows selected that you
  // can no longer see — and then "Move to trash" would act on them. You can
  // only ever act on rows in front of you.
  useEffect(() => {
    setSelectedIds((current) => {
      if (current.size === 0) return current;
      const visibleIds = new Set(visible.map((l) => l.id));
      const next = new Set([...current].filter((id) => visibleIds.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [visible]);

  const allVisibleSelected = visible.length > 0 && visible.every((l) => selectedIds.has(l.id));
  const someVisibleSelected = visible.some((l) => selectedIds.has(l.id));

  const toggleAllVisible = () => {
    setSelectedIds(allVisibleSelected ? new Set() : new Set(visible.map((l) => l.id)));
  };

  const toggleOne = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Recoverable. Deleting used to erase the row, so a misclick on the wrong
  // checkbox destroyed a lead with nothing to restore from. It now moves to the
  // Deleted view, where it can be brought back or removed for good.
  const handleDelete = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    setLeads((current) =>
      current.map((l) => (ids.includes(l.id) ? { ...l, deletedAt: new Date().toISOString() } : l))
    );
    setSelectedIds(new Set());
    setConfirmDelete(false);
    if (selectedId && ids.includes(selectedId)) setSelectedId(null);
    const ok = await trashLeads(ids);
    if (!ok) {
      setLeads((current) =>
        current.map((l) => (ids.includes(l.id) ? { ...l, deletedAt: null } : l))
      );
      showToast({ message: 'Could not delete. Please try again.', variant: 'error' });
      return;
    }
    showToast({
      message: `${ids.length} submission${ids.length === 1 ? '' : 's'} moved to Deleted.`,
    });
  };

  const handleRestore = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    setLeads((current) => current.map((l) => (ids.includes(l.id) ? { ...l, deletedAt: null } : l)));
    setSelectedIds(new Set());
    const ok = await restoreLeads(ids);
    if (!ok) {
      setLeads((current) =>
        current.map((l) =>
          ids.includes(l.id) ? { ...l, deletedAt: new Date().toISOString() } : l
        )
      );
      showToast({ message: 'Could not restore. Please try again.', variant: 'error' });
      return;
    }
    showToast({ message: `${ids.length} submission${ids.length === 1 ? '' : 's'} restored.` });
  };

  // The only irreversible path left, and it is reachable only from inside the
  // Deleted view — so nothing can be destroyed without first being deleted and
  // then deliberately sought out.
  const handlePurge = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    const removed = leads.filter((l) => ids.includes(l.id));
    setLeads((current) => current.filter((l) => !ids.includes(l.id)));
    setSelectedIds(new Set());
    setConfirmPurge(false);
    if (selectedId && ids.includes(selectedId)) setSelectedId(null);
    const ok = await purgeLeads(ids);
    if (!ok) {
      setLeads((current) =>
        [...current, ...removed].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
      );
      showToast({ message: 'Could not delete. Please try again.', variant: 'error' });
      return;
    }
    showToast({
      message: `${ids.length} submission${ids.length === 1 ? '' : 's'} permanently deleted.`,
    });
  };

  const applyContacted = async (lead: Lead, contacted: boolean, note: string) => {
    setLeads((current) =>
      current.map((l) =>
        l.id === lead.id
          ? {
              ...l,
              submissionContactedAt: contacted
                ? l.submissionContactedAt ?? new Date().toISOString()
                : null,
              submissionOutcomeNote: note,
            }
          : l
      )
    );
    const saved = await markSubmissionContacted(lead.id, contacted, note);
    if (saved) {
      setLeads((current) => current.map((l) => (l.id === lead.id ? saved : l)));
      showToast({ message: contacted ? 'Marked as contacted.' : 'Moved back to unworked.' });
    } else {
      showToast({ message: 'Could not save. Please try again.', variant: 'error' });
    }
  };

  return (
    <div className="space-y-4 pb-16 lg:pb-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#32639b]">
            Consultation flow
          </p>
          <h1 className="text-3xl font-black tracking-[-0.03em] text-slate-950">Submissions</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Every submission ever received, whatever it routed to. Nothing is hidden or archived.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-2">
        {/* Excludes deleted, which have their own counted tab — a Total that
            disagreed with the All tab beside it would just read as a bug. */}
        <Stat label="Total" value={String(leads.length - deletedCount)} />
        <Stat
          label="Needs contact"
          value={String(unworkedCount)}
          tone={unworkedCount > 0 ? 'warn' : undefined}
        />
        <Stat label="Showing" value={String(visible.length)} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => {
          const active = !showDeleted && outcomeFilter === f.key;
          // Counts describe the view you are in, so the number on a tab always
          // matches the rows it shows.
          const pool = leads.filter((l) => Boolean(l.deletedAt) === showDeleted);
          const count =
            f.key === 'ALL' ? pool.length : pool.filter((l) => l.routingOutcome === f.key).length;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => {
                setShowDeleted(false);
                setOutcomeFilter(f.key);
              }}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                active
                  ? 'border-[#1B3C6C] bg-[#1B3C6C] text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              {f.label} ({count})
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setUnworkedOnly((v) => !v)}
          className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
            unworkedOnly
              ? 'border-amber-500 bg-amber-500 text-white'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
          }`}
        >
          Needs contact only
        </button>
        {/* Deleted submissions, kept rather than erased so a wrong checkbox is
            a nuisance instead of a loss. */}
        <button
          type="button"
          onClick={() => {
            setShowDeleted((v) => !v);
            setSelectedIds(new Set());
            setSelectedId(null);
          }}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
            showDeleted
              ? 'border-slate-800 bg-slate-800 text-white'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
          }`}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Deleted ({deletedCount})
        </button>
        <div className="relative ml-auto min-w-[14rem] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, phone, email, address, source"
            className="w-full rounded-[0.5rem] border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-[#32639b]"
          />
        </div>
      </div>

      {/* Bulk actions — only present when something is selected */}
      {selectedIds.size > 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-[0.5rem] border border-[#1B3C6C]/20 bg-[#f2f7fd] px-4 py-3">
          <span className="text-sm font-black text-[#1B3C6C]">
            {selectedIds.size} selected
          </span>
          {/* Restore is the primary action in the Deleted view; permanent
              removal is available there but never the obvious button. */}
          {showDeleted ? (
            <>
              <button
                type="button"
                onClick={handleRestore}
                className="inline-flex items-center gap-1.5 rounded-[0.5rem] bg-[#1B3C6C] px-3 py-2 text-xs font-black text-white hover:opacity-90"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Restore {selectedIds.size}
              </button>
              <button
                type="button"
                onClick={() => setConfirmPurge(true)}
                className="inline-flex items-center gap-1.5 rounded-[0.5rem] border border-red-200 px-3 py-2 text-xs font-black text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete permanently
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-1.5 rounded-[0.5rem] bg-slate-900 px-3 py-2 text-xs font-black text-white hover:bg-slate-800"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete {selectedIds.size}
            </button>
          )}
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="text-xs font-bold text-slate-500 underline"
          >
            Clear selection
          </button>
        </div>
      ) : null}

      {/* Table */}
      <section className="rounded-[0.5rem] border border-white bg-white shadow-sm">
        {isLoading ? (
          <p className="px-4 py-16 text-center text-sm font-bold text-slate-400">
            Loading submissions…
          </p>
        ) : loadFailed ? (
          <div className="px-4 py-16 text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-amber-300" />
            <p className="mt-3 text-sm font-bold text-slate-500">
              Could not load submissions. Reload the page to try again.
            </p>
          </div>
        ) : visible.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <Inbox className="mx-auto h-10 w-10 text-slate-200" />
            <p className="mt-3 text-sm font-bold text-slate-400">
              {leads.length === 0
                ? 'No consultation submissions yet.'
                : 'No submissions match this filter. Choose All to see every row.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-xs font-bold uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label="Select all visible submissions"
                      checked={allVisibleSelected}
                      // Partial selection reads as a dash, so "some" never
                      // looks like "all" right before a bulk action.
                      ref={(el) => {
                        if (el) el.indeterminate = someVisibleSelected && !allVisibleSelected;
                      }}
                      onChange={toggleAllVisible}
                      className="h-4 w-4 cursor-pointer accent-[#1B3C6C]"
                    />
                  </th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Address</th>
                  <th className="px-4 py-3">Municipality</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Outcome</th>
                  <th className="px-4 py-3">Appointment</th>
                  <th className="px-4 py-3">Address cause</th>
                  <th className="px-4 py-3">Worked</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {visible.map((lead) => {
                  const appointment = lead.appointmentId
                    ? appointmentById.get(lead.appointmentId)
                    : undefined;
                  const cause = lead.addressResolutionCause ?? '';
                  const source = trafficSource(lead);
                  return (
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedId(lead.id)}
                      className={`cursor-pointer border-b border-slate-50 hover:bg-slate-50/60 ${
                        selectedIds.has(lead.id) ? 'bg-[#f2f7fd]' : ''
                      } ${lead.deletedAt ? 'opacity-60' : ''}`}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          aria-label={`Select ${lead.name}`}
                          checked={selectedIds.has(lead.id)}
                          onChange={() => toggleOne(lead.id)}
                          className="h-4 w-4 cursor-pointer accent-[#1B3C6C]"
                        />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {formatDate(lead.submittedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-900">{lead.name}</span>
                        {lead.deletedAt ? (
                          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[0.6rem] font-black text-slate-500">
                            TRASHED
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <div className="text-xs">{lead.phone || '—'}</div>
                        <div className="text-xs text-slate-400">{lead.email || '—'}</div>
                      </td>
                      <td className="max-w-[16rem] px-4 py-3 text-slate-600">
                        {/* Raw submitted text, with the verification state beside
                            it so partial data never reads as confirmed. */}
                        <div className="truncate text-xs">{lead.address || <NotRecorded />}</div>
                        <div className="text-[0.65rem] font-bold uppercase tracking-wide text-slate-400">
                          {lead.addressState ? ADDRESS_STATE_LABEL[lead.addressState] ?? lead.addressState : 'Unknown'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {lead.resolvedMunicipality || <NotRecorded />}
                      </td>
                      <td className="max-w-[12rem] px-4 py-3">
                        {source.label ? (
                          source.tagged ? (
                            <span
                              title={source.label}
                              className="inline-block max-w-full truncate rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[0.65rem] font-bold text-slate-700"
                            >
                              {source.label}
                            </span>
                          ) : (
                            // Untagged: the URL carried no campaign, so this is
                            // the program slug echoed back. Said plainly rather
                            // than shown as if an ad had produced it.
                            <span className="text-xs italic text-slate-400" title={`No campaign tag — landed on /consultation/${source.label}`}>
                              untagged
                            </span>
                          )
                        ) : (
                          <NotRecorded />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {lead.routingOutcome ? (
                          <span
                            className={`inline-block rounded-full border px-2 py-0.5 text-[0.6rem] font-black ${
                              OUTCOME_STYLE[lead.routingOutcome] ?? 'border-slate-200 bg-slate-100 text-slate-600'
                            }`}
                          >
                            {OUTCOME_LABEL[lead.routingOutcome] ?? lead.routingOutcome}
                          </span>
                        ) : (
                          <NotRecorded />
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {appointment ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                            <CalendarCheck className="h-3.5 w-3.5" />
                            {appointment.status}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {cause ? (
                          <span className={PROVIDER_CAUSES.has(cause) ? 'font-bold text-amber-700' : ''}>
                            {humanCause(cause)}
                          </span>
                        ) : (
                          <NotRecorded />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {/* Three states, matching the badge exactly: explicitly
                            marked, handled by booking, or genuinely waiting. */}
                        {lead.submissionContactedAt ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Contacted
                          </span>
                        ) : lead.appointmentId ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500">
                            <CalendarCheck className="h-3.5 w-3.5" /> Booked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700">
                            <Circle className="h-3.5 w-3.5" /> Needs contact
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ChevronRight className="ml-auto h-4 w-4 text-slate-300" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {confirmPurge ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[0.5rem] bg-white p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-[-0.02em] text-slate-950">
                  Permanently delete {selectedIds.size} submission
                  {selectedIds.size === 1 ? '' : 's'}?
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-600">
                  This cannot be undone. The submission and its full history are removed for good,
                  and cannot be restored afterwards.
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmPurge(false)}
                className="rounded-[0.5rem] border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePurge}
                className="rounded-[0.5rem] bg-red-600 px-4 py-2.5 text-sm font-black text-white hover:bg-red-700"
              >
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmDelete ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[0.5rem] bg-white p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-[-0.02em] text-slate-950">
                  Delete {selectedIds.size} submission{selectedIds.size === 1 ? '' : 's'}?
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-600">
                  They move to the Deleted tab, where you can restore them.
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-[0.5rem] border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-[0.5rem] bg-slate-900 px-4 py-2.5 text-sm font-black text-white hover:bg-slate-800"
              >
                Move to Deleted
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selected ? (
        <SubmissionDrawer
          lead={selected}
          appointment={selected.appointmentId ? appointmentById.get(selected.appointmentId) : undefined}
          onClose={() => setSelectedId(null)}
          onApply={applyContacted}
          onLeadUpdated={(updated) =>
            setLeads((current) => current.map((l) => (l.id === updated.id ? updated : l)))
          }
        />
      ) : null}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'warn' }) {
  return (
    <div
      className={`rounded-[0.5rem] border px-4 py-2.5 shadow-sm ${
        tone === 'warn' ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'
      }`}
    >
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className={`text-xl font-black ${tone === 'warn' ? 'text-amber-700' : 'text-slate-900'}`}>
        {value}
      </p>
    </div>
  );
}

/**
 * Why this lead has no times.
 *
 * The old copy said one thing — "check rep availability under Admin" — for
 * every empty result, including the case where availability was never computed
 * because the lead's program had closed. That sent reps to a calendar that was
 * fine while a homeowner waited on the phone. Each reason now says what it is,
 * and the closed case says what to offer instead.
 */
function NoSlotsReason({ blocked }: { blocked?: SlotBlock }) {
  if (blocked?.reason === 'PROGRAM_CLOSED') {
    return (
      <div className="space-y-2 px-4 py-3 text-sm text-slate-600">
        <p className="font-bold text-slate-800">
          {blocked.programName} has closed — this submission cannot be booked under it.
        </p>
        <p>
          Confirmed closed {blocked.confirmedOn}. The calendar was not consulted, so rep
          availability is not the problem and there is nothing to check under Admin.
        </p>
        <p>
          {BASEMENT_FINANCING_OFFER.shortBody} Send them to{' '}
          <span className="font-bold">{BASEMENT_FINANCING_OFFER.href}</span> to book against the
          open program.
        </p>
      </div>
    );
  }
  if (blocked?.reason === 'PROGRAM_NOT_OPEN') {
    return (
      <p className="px-4 py-3 text-sm text-slate-500">
        The {blocked.programName} program is not open for booking, so no times were computed.
      </p>
    );
  }
  if (blocked?.reason === 'NO_AREA') {
    return (
      <p className="px-4 py-3 text-sm text-slate-500">
        This submission never resolved to a service area, so no calendar applies. If you have the
        address now, add it under <span className="font-bold">Contact</span> above — the times
        appear once it resolves.
      </p>
    );
  }
  if (blocked?.reason === 'NO_REPS') {
    return (
      <p className="px-4 py-3 text-sm text-slate-500">
        No reps are set up to take bookings — add one under Admin.
      </p>
    );
  }
  // No block: the calendar really was consulted and really is full.
  return (
    <p className="px-4 py-3 text-sm text-slate-500">
      Every slot in the booking window is taken or blocked — check rep availability and days off
      under Admin.
    </p>
  );
}

/**
 * Give a submission the address the form never captured.
 *
 * A homeowner who picks a suggestion with no street number — a locality, a bare
 * road — resolves to INCOMPLETE_ADDRESS, and the address stored is the empty
 * string. No address means no scheduling area, which means no calendar, which
 * means the rep who phoned and got the real address had nowhere to put it and
 * no way to book. This is that missing input.
 *
 * Suggestions come from the flow's OWN endpoint, and the placeId is what gets
 * saved — the server re-resolves it through the same path a homeowner's address
 * takes. Free text alone is accepted only where the flow would accept it: when
 * it matches exactly one real address. We never guess an address a rep will be
 * driven to, and the coordinates the travel radius depends on always come from
 * the resolved place, never from anything typed here.
 */
function AddressFixer({
  lead,
  onSaved,
}: {
  lead: Lead;
  onSaved: (lead: Lead) => void;
}) {
  const { setLeadAddress } = usePortalData();
  const [text, setText] = useState(lead.address || '');
  const [placeId, setPlaceId] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{ placeId: string; description: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const skip = useRef(false);

  useEffect(() => {
    if (skip.current) { skip.current = false; return; }
    const q = text.trim();
    if (q.length < 3) { setSuggestions([]); return; }
    const timer = window.setTimeout(async () => {
      try {
        const r = await fetch(`/api/leads?flow=address_suggest&q=${encodeURIComponent(q)}`);
        const j = (await r.json()) as { suggestions?: Array<{ placeId: string; description: string }> };
        setSuggestions(j.suggestions ?? []);
      } catch {
        setSuggestions([]);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [text]);

  const save = async () => {
    setSaving(true);
    setError('');
    const result = await setLeadAddress(lead.id, { placeId, addressText: text.trim() });
    setSaving(false);
    if ('error' in result) {
      setError(result.error);
      return;
    }
    showToast({ message: 'Address saved. Times can be loaded now.', variant: 'success' });
    onSaved(result.lead);
  };

  return (
    <div className="space-y-2 rounded-[0.5rem] border border-slate-200 bg-slate-50/70 p-2.5">
      <div className="relative">
        <input
          value={text}
          onChange={(e) => { setText(e.target.value); setPlaceId(''); setError(''); }}
          placeholder="Start typing, then pick the address"
          autoComplete="off"
          className="w-full rounded-[0.4rem] border border-slate-200 px-2.5 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-[#1B3C6C]"
        />
        {suggestions.length > 0 ? (
          <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 divide-y divide-slate-100 overflow-y-auto rounded-[0.5rem] border border-slate-200 bg-white shadow-lg">
            {suggestions.map((s) => (
              <button
                key={s.placeId}
                type="button"
                onMouseDown={() => {
                  skip.current = true;
                  setText(s.description);
                  setPlaceId(s.placeId);
                  setSuggestions([]);
                }}
                className="block w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-[#f6faff]"
              >
                {s.description}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {placeId ? (
        <p className="flex items-center gap-1 text-[0.7rem] font-bold text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" /> Address picked
        </p>
      ) : (
        <p className="text-[0.7rem] font-semibold text-slate-400">
          Pick from the list where you can. A typed address is only accepted when it matches
          exactly one real address.
        </p>
      )}
      {error ? (
        <p className="text-[0.7rem] font-bold text-red-600">{error}</p>
      ) : null}
      <button
        type="button"
        onClick={save}
        disabled={saving || !text.trim()}
        className="rounded-[0.5rem] bg-[#1B3C6C] px-3 py-2 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {saving ? 'Checking address…' : 'Save address'}
      </button>
    </div>
  );
}

// ─── Detail drawer ────────────────────────────────────────────────────────────

function SubmissionDrawer({
  lead,
  appointment,
  onClose,
  onApply,
  onLeadUpdated,
}: {
  lead: Lead;
  appointment?: SubmissionAppointment;
  onClose: () => void;
  onApply: (lead: Lead, contacted: boolean, note: string) => Promise<void>;
  onLeadUpdated: (lead: Lead) => void;
}) {
  const [note, setNote] = useState(lead.submissionOutcomeNote ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const contacted = Boolean(lead.submissionContactedAt);

  const { fetchLeadSlots, bookLeadVisit } = usePortalData();
  const [editingAddress, setEditingAddress] = useState(false);
  const [slots, setSlots] = useState<Array<{ date: string; time: string }> | null>(null);
  const [blocked, setBlocked] = useState<SlotBlock | undefined>(undefined);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [picked, setPicked] = useState<{ date: string; time: string } | null>(null);
  const [notify, setNotify] = useState(false);
  const [booking, setBooking] = useState(false);
  const alreadyBooked = Boolean(lead.appointmentId || appointment);

  const loadSlots = async () => {
    setLoadingSlots(true);
    const payload = await fetchLeadSlots(lead.id);
    setSlots(payload.slots);
    setBlocked(payload.blocked);
    setLoadingSlots(false);
  };

  const confirmBooking = async () => {
    if (!picked) return;
    setBooking(true);
    const result = await bookLeadVisit(lead.id, picked.date, picked.time, notify);
    setBooking(false);
    if (!result) {
      showToast({
        message: 'That time is no longer free. Reload the times and try again.',
        variant: 'error',
      });
      setPicked(null);
      await loadSlots();
      return;
    }
    showToast({
      message: notify
        ? `Booked ${slotDate(result.date)} at ${slotTime(result.time)}. Confirmation sent.`
        : `Booked ${slotDate(result.date)} at ${slotTime(result.time)}. Nothing was sent to the homeowner.`,
      variant: 'success',
    });
    onClose();
  };

  useEffect(() => {
    setNote(lead.submissionOutcomeNote ?? '');
  }, [lead.id, lead.submissionOutcomeNote]);

  // Labels come from the program the lead was captured under, not a fixed set —
  // Hamilton and Simcoe ask different questions.
  const program = programByKey(lead.programKey);
  const answers = readableAnswers(program, lead.answersJson ?? null);
  const cause = lead.addressResolutionCause ?? '';

  const save = async (nextContacted: boolean) => {
    setIsSaving(true);
    await onApply(lead, nextContacted, note.trim());
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[95] bg-slate-950/45 backdrop-blur-sm" onClick={onClose}>
      <div
        className="ml-auto flex h-full w-full max-w-xl flex-col bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-slate-100 bg-white px-5 py-4">
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#32639b]">
              Submission · {formatDateTime(lead.submittedAt)}
            </p>
            <h2 className="text-xl font-black tracking-[-0.02em] text-slate-950">{lead.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[0.4rem] p-1.5 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {lead.deletedAt ? (
            <div className="flex items-center gap-2 rounded-[0.5rem] border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
              <Trash2 className="h-4 w-4" />
              This lead is in the trash. It is shown here because the log hides nothing.
            </div>
          ) : null}

          {PROVIDER_CAUSES.has(cause) ? (
            <div className="rounded-[0.5rem] border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
              <AlertTriangle className="mr-1 inline h-4 w-4" />
              This address went unverified because our address provider failed, not because of the
              address. The routing outcome may not reflect what this homeowner qualified for.
            </div>
          ) : null}

          {lead.addressState === 'ADDRESS_INFERRED' ? (
            <div className="rounded-[0.5rem] border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-800">
              <MapPin className="mr-1 inline h-4 w-4" />
              This homeowner typed their address rather than picking it from the list. It matched
              exactly one real address, so they were booked — worth a glance before the visit.
            </div>
          ) : null}

          <Section title="Contact">
            <Field label="Phone" icon={Phone}>{lead.phone || <NotRecorded />}</Field>
            <Field label="Email" icon={Mail}>{lead.email || <NotRecorded />}</Field>
            <Field label="Address" icon={MapPin}>
              <span className="inline-flex items-center gap-2">
                {lead.address || <NotRecorded />}
                {!lead.deletedAt ? (
                  <button
                    type="button"
                    onClick={() => setEditingAddress((v) => !v)}
                    className="text-[0.7rem] font-black text-[#1B3C6C] hover:underline"
                  >
                    {editingAddress ? 'Cancel' : lead.address ? 'Correct' : 'Add address'}
                  </button>
                ) : null}
              </span>
            </Field>
            {editingAddress ? (
              <div className="px-4 pb-3">
                <AddressFixer
                  lead={lead}
                  onSaved={(updated) => {
                    setEditingAddress(false);
                    // Drop any times already on screen: they were computed for
                    // the old area, and offering them against a new address
                    // would book a rep a drive nobody costed.
                    setSlots(null);
                    setBlocked(undefined);
                    setPicked(null);
                    onLeadUpdated(updated);
                  }}
                />
              </div>
            ) : null}
            <Field label="Address state">
              {lead.addressState ? ADDRESS_STATE_LABEL[lead.addressState] ?? lead.addressState : <NotRecorded />}
            </Field>
            <Field label="Municipality">{lead.resolvedMunicipality || <NotRecorded />}</Field>
            <Field label="Address cause">
              {cause ? humanCause(cause) : <NotRecorded />}
            </Field>
            {/* The exact string the URL carried, unabbreviated — the table
                truncates long campaign names and this is where you read the
                whole thing. */}
            <Field label="Source">
              {(() => {
                const source = trafficSource(lead);
                if (!source.label) return <NotRecorded />;
                if (!source.tagged) {
                  return (
                    <span className="italic text-slate-400">
                      untagged — landed on /consultation/{source.label} with no campaign tag
                    </span>
                  );
                }
                return <span className="font-mono text-xs font-bold">{source.label}</span>;
              })()}
            </Field>
          </Section>

          {/* What they typed, when nothing resolved from it. Held on the lead all
              along but never rendered, so a submission with no usable address
              looked like a homeowner who gave us nothing — when in fact they had
              often typed the address in full. */}
          {lead.notes ? (
            <Section title="Submitted notes">
              <p className="whitespace-pre-wrap px-4 py-3 text-sm font-semibold text-slate-700">
                {lead.notes}
              </p>
            </Section>
          ) : null}

          <Section title="Routing">
            <Field label="Outcome">
              {lead.routingOutcome ? OUTCOME_LABEL[lead.routingOutcome] ?? lead.routingOutcome : <NotRecorded />}
            </Field>
            <Field label="Reason codes">
              {lead.routingReasonCodes && lead.routingReasonCodes.length > 0 ? (
                <span className="flex flex-wrap gap-1">
                  {lead.routingReasonCodes.map((code) => (
                    <span
                      key={code}
                      className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.6rem] font-black text-slate-600"
                    >
                      {code}
                    </span>
                  ))}
                </span>
              ) : (
                <NotRecorded />
              )}
            </Field>
            <Field label="Appointment">
              {appointment
                ? `${appointment.status} · ${appointment.appointmentDate} ${appointment.appointmentTime}${
                    appointment.publicReference ? ` · ${appointment.publicReference}` : ''
                  }`
                : 'None booked'}
            </Field>
          </Section>

          {/* Book on their behalf.
              Offered for ANY unbooked lead, not just the ones routing cleared:
              the manual-review and nurture leads are precisely the ones a rep
              has since phoned and learned more about than a dropdown could say.
              The times come from the same availability the homeowner would have
              seen, so a booking made here cannot double-book a rep. */}
          {!alreadyBooked ? (
            <Section title="Book a visit">
              {slots === null ? (
                <div className="px-4 py-3">
                  <button
                    type="button"
                    onClick={loadSlots}
                    disabled={loadingSlots}
                    className="rounded-[0.5rem] bg-[#1B3C6C] px-4 py-2 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                  >
                    {loadingSlots ? 'Loading times…' : 'Show available times'}
                  </button>
                </div>
              ) : slots.length === 0 ? (
                <NoSlotsReason blocked={blocked} />
              ) : (
                <div className="space-y-3 px-4 py-3">
                  <div className="max-h-60 space-y-3 overflow-y-auto">
                    {Object.entries(
                      slots.reduce<Record<string, string[]>>((acc, s) => {
                        (acc[s.date] ??= []).push(s.time);
                        return acc;
                      }, {})
                    ).map(([date, times]) => (
                      <div key={date}>
                        <p className="mb-1.5 text-xs font-black text-slate-700">{slotDate(date)}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {times.map((time) => {
                            const on = picked?.date === date && picked?.time === time;
                            return (
                              <button
                                key={time}
                                type="button"
                                onClick={() => setPicked({ date, time })}
                                className={`rounded-[0.4rem] border px-2.5 py-1.5 text-xs font-bold transition ${
                                  on
                                    ? 'border-[#1B3C6C] bg-[#1B3C6C] text-white'
                                    : 'border-slate-200 text-slate-600 hover:border-[#1B3C6C]'
                                }`}
                              >
                                {slotTime(time)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Off by default: the rep is normally mid-call, and a text
                      the homeowner did not ask for costs money and may say
                      something the rep has not said yet. */}
                  <label className="flex items-start gap-2 text-xs font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={notify}
                      onChange={(e) => setNotify(e.target.checked)}
                      className="mt-0.5"
                    />
                    Send the homeowner the usual confirmation text and email
                  </label>

                  <button
                    type="button"
                    onClick={confirmBooking}
                    disabled={!picked || booking}
                    className="rounded-[0.5rem] bg-[#1B3C6C] px-4 py-2 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-40"
                  >
                    {booking
                      ? 'Booking…'
                      : picked
                        ? `Book ${slotDate(picked.date)} at ${slotTime(picked.time)}`
                        : 'Pick a time'}
                  </button>
                </div>
              )}
            </Section>
          ) : null}

          <Section title="Answers">
            {answers.length === 0 ? (
              <p className="text-sm text-slate-400">
                <NotRecorded />
              </p>
            ) : (
              answers.map((a) => (
                <Field key={a.key} label={a.questionLabel}>
                  {a.valueLabel || <span className="italic text-slate-400">not answered</span>}
                </Field>
              ))
            )}
            {lead.programKey && !program ? (
              <p className="pt-1 text-xs text-slate-400">
                Captured under program “{lead.programKey}”, which is no longer configured — answers
                are shown as stored.
              </p>
            ) : null}
          </Section>

          <Section title="Worklist">
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">
              Outcome notes
            </label>
            <textarea
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What happened when you contacted them?"
            />
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => save(true)}
                className="rounded-[0.5rem] bg-[#1B3C6C] px-4 py-2.5 text-sm font-black text-white disabled:opacity-60"
              >
                {contacted ? 'Save notes' : 'Mark contacted'}
              </button>
              {contacted ? (
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => save(false)}
                  className="rounded-[0.5rem] border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 disabled:opacity-60"
                >
                  Move back to unworked
                </button>
              ) : null}
            </div>
            {contacted ? (
              <p className="pt-1 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />
                Contacted {formatDateTime(lead.submissionContactedAt)}
              </p>
            ) : null}
          </Section>

          <Section title="Activity">
            {lead.interactions.length === 0 ? (
              <p className="text-sm text-slate-400">No activity logged.</p>
            ) : (
              <ul className="space-y-2">
                {lead.interactions.slice(0, 12).map((interaction) => (
                  <li key={interaction.id} className="rounded-[0.4rem] bg-slate-50 px-3 py-2">
                    <div className="flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-wide text-slate-400">
                      <ClipboardList className="h-3 w-3" />
                      {interaction.channel} · {formatDateTime(interaction.occurredAt)}
                    </div>
                    {interaction.body ? (
                      <p className="whitespace-pre-wrap pt-1 text-sm text-slate-700">
                        {interaction.body}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-slate-400">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon?: typeof Phone;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-50 pb-2 last:border-0">
      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
        {Icon ? <Icon className="h-3.5 w-3.5 text-slate-400" /> : null}
        {label}
      </span>
      <span className="text-right text-sm text-slate-800">{children}</span>
    </div>
  );
}
