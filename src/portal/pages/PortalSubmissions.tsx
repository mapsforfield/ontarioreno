// ─── Submissions log ──────────────────────────────────────────────────────────
// Every consultation-flow submission ever received, and a worklist for clearing
// them. Built because the flow announced nothing but bookings: manual-review,
// nurture, decline and abandoned-calendar leads were captured in silence and
// appeared on no screen.
//
// The governing rule here is that NOTHING is hidden. There is no archive, no
// auto-hide, no "resolved" state that removes a row. Filters are view-state
// only and always return to the complete set. A trashed or already-booked
// submission still appears, flagged — those are precisely the rows the other
// lead endpoints drop.

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
import { useEffect, useMemo, useState } from 'react';
import { usePortalData } from '../data/store';
import { showToast } from '../lib/toast';
import { countUnworkedSubmissions, isUnworkedSubmission } from '../data/submissions';
import { programByKey, readableAnswers } from '../../../lib/program-config';
import type { Lead, RoutingOutcome, SubmissionAppointment } from '../data/types';

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
  const { fetchSubmissions, markSubmissionContacted } = usePortalData();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [appointments, setAppointments] = useState<SubmissionAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [outcomeFilter, setOutcomeFilter] = useState<OutcomeFilter>('ALL');
  const [unworkedOnly, setUnworkedOnly] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
      if (outcomeFilter !== 'ALL' && lead.routingOutcome !== outcomeFilter) return false;
      // Same predicate as the dashboard badge, so the number you clicked and
      // the rows you land on always agree.
      if (unworkedOnly && !isUnworkedSubmission(lead)) return false;
      if (!q) return true;
      return [lead.name, lead.phone, lead.email, lead.address, lead.city, lead.resolvedMunicipality]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q));
    });
  }, [leads, outcomeFilter, unworkedOnly, query]);

  const selected = selectedId ? leads.find((l) => l.id === selectedId) ?? null : null;

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
        <Stat label="Total" value={String(leads.length)} />
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
          const active = outcomeFilter === f.key;
          const count =
            f.key === 'ALL' ? leads.length : leads.filter((l) => l.routingOutcome === f.key).length;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setOutcomeFilter(f.key)}
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
        <div className="relative ml-auto min-w-[14rem] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, phone, email, address"
            className="w-full rounded-[0.5rem] border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-[#32639b]"
          />
        </div>
      </div>

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
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Address</th>
                  <th className="px-4 py-3">Municipality</th>
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
                  return (
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedId(lead.id)}
                      className="cursor-pointer border-b border-slate-50 hover:bg-slate-50/60"
                    >
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

      {selected ? (
        <SubmissionDrawer
          lead={selected}
          appointment={selected.appointmentId ? appointmentById.get(selected.appointmentId) : undefined}
          onClose={() => setSelectedId(null)}
          onApply={applyContacted}
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

// ─── Detail drawer ────────────────────────────────────────────────────────────

function SubmissionDrawer({
  lead,
  appointment,
  onClose,
  onApply,
}: {
  lead: Lead;
  appointment?: SubmissionAppointment;
  onClose: () => void;
  onApply: (lead: Lead, contacted: boolean, note: string) => Promise<void>;
}) {
  const [note, setNote] = useState(lead.submissionOutcomeNote ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const contacted = Boolean(lead.submissionContactedAt);

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

          <Section title="Contact">
            <Field label="Phone" icon={Phone}>{lead.phone || <NotRecorded />}</Field>
            <Field label="Email" icon={Mail}>{lead.email || <NotRecorded />}</Field>
            <Field label="Address" icon={MapPin}>{lead.address || <NotRecorded />}</Field>
            <Field label="Address state">
              {lead.addressState ? ADDRESS_STATE_LABEL[lead.addressState] ?? lead.addressState : <NotRecorded />}
            </Field>
            <Field label="Municipality">{lead.resolvedMunicipality || <NotRecorded />}</Field>
            <Field label="Address cause">
              {cause ? humanCause(cause) : <NotRecorded />}
            </Field>
          </Section>

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
