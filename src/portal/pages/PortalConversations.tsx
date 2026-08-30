/**
 * Conversations — text threads with leads who have not booked yet.
 *
 * The approval desk for phase 1. A lead replies to the opening text, the
 * classifier reads it, and the state machine picks one of Michael's templates
 * — but nothing is sent. The draft lands here, and clicking Send is what turns
 * it into a text.
 *
 * Two things this page must always make obvious, because getting either wrong
 * costs a real prospect:
 *
 *   1. Which drafts are WAITING. A draft nobody notices is the same as the
 *      silence this feature was built to fix.
 *   2. That an EMPTY draft means the automation declined to guess. Those are
 *      the interesting ones — the classifier was unsure, or the homeowner said
 *      something no template covers — and they need Michael's own words rather
 *      than a click.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  MessageSquare,
  Send,
  Trash2,
  User,
  AlertTriangle,
  RefreshCw,
  CalendarCheck,
} from 'lucide-react';

type ConversationMessage = {
  id: string;
  direction: 'in' | 'out';
  body: string;
  state: string;
  templateId: string;
  intent: string;
  confident: boolean;
  escalationReason: string;
  createdAt: string;
};

type Conversation = {
  id: string;
  leadId: string;
  lead: { id: string; name: string; phone: string; city: string; address: string } | null;
  phase: string;
  needsHumanReason: string;
  offeredSlots: Array<{ date: string; time: string }>;
  updatedAt: string;
  messages: ConversationMessage[];
};

/** Plain-language phase labels. The stored values are for code, not for reading. */
const PHASE_LABEL: Record<string, string> = {
  opened: 'Waiting on their first reply',
  awaiting_time_choice: 'Offered times, waiting on a pick',
  awaiting_address: 'Waiting on the address',
  booked: 'Booked',
  closed: 'Closed — not interested',
  needs_human: 'Needs you',
};

/** Why the automation stopped. Written for the person reading it, not the log. */
const REASON_LABEL: Record<string, string> = {
  NOT_CONFIDENT: 'Not sure what they meant',
  INTENT_DOES_NOT_FIT_PHASE: "Understood them, but it doesn't answer what we asked",
  NEEDS_A_PERSON: 'Needs a person',
  ALREADY_WITH_A_HUMAN: 'You already have this one',
  NO_SLOTS_AVAILABLE: 'Nothing open to offer them',
};

/** Why the calendar came back empty, in the words a rep needs. */
const SLOT_BLOCK_LABEL: Record<string, string> = {
  NO_AREA: 'No scheduling area on this lead — add the address first.',
  NO_REPS: 'No rep covers this area.',
  PROGRAM_CLOSED: 'That program has closed.',
  PROGRAM_NOT_OPEN: 'That program is not open yet.',
};

function slotLabel(date: string, time: string): string {
  const d = new Date(`${date}T00:00:00`);
  if (!Number.isFinite(d.getTime())) return `${date} ${time}`;
  return `${d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} · ${time}`;
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function PortalConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editedBody, setEditedBody] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/leads?_resource=conversations', { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setConversations(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load conversations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = useMemo(
    () => conversations.find((c) => c.id === selectedId) ?? null,
    [conversations, selectedId]
  );

  /**
   * Pull anything that was texted from outside the portal into this thread.
   *
   * Scoped to ONE conversation on purpose: a sync is two Twilio reads per
   * thread, and doing all of them on every page load would be hundreds of
   * calls to answer a question about one lead. Runs when a thread is opened,
   * which is the moment its completeness actually matters.
   */
  const syncThread = useCallback(async (conversationId: string) => {
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _action: 'conversation_sync', conversationId }),
      });
      if (!res.ok) return 0;
      const data = (await res.json().catch(() => ({}))) as {
        imported?: number;
        repaired?: number;
      };
      // A restamped row changed nothing about WHICH messages are here, only
      // about their order — which is the thing the reader was complaining
      // about, so it has to trigger the reload too.
      return (data.imported ?? 0) + (data.repaired ?? 0);
    } catch {
      // Twilio being unreachable leaves the thread as it was. The rows the
      // portal wrote itself are still correct, just possibly incomplete.
      return 0;
    }
  }, []);

  // Opening a thread reconciles it, and reloads only if that changed anything.
  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    void (async () => {
      const imported = await syncThread(selectedId);
      if (imported > 0 && !cancelled) await load();
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId, syncThread, load]);

  /**
   * Booking straight from the thread.
   *
   * The times we OFFERED come first — a homeowner who said yes said yes to one
   * of those, and re-deriving from the calendar would show a different set than
   * the one they were actually shown. The calendar's other open times follow,
   * for the common case where the thread reached a person before any slot was
   * offered.
   *
   * This posts the same `book_lead` the lead page does. Nothing new can be
   * booked from here that could not be booked there; it is two clicks fewer.
   */
  const [openSlots, setOpenSlots] = useState<Array<{ date: string; time: string }>>([]);
  const [slotNote, setSlotNote] = useState('');
  const [slotBlock, setSlotBlock] = useState('');
  const [booked, setBooked] = useState('');

  const loadSlots = useCallback(async (leadId: string) => {
    try {
      const res = await fetch(
        `/api/leads?_resource=lead_slots&leadId=${encodeURIComponent(leadId)}`,
        { credentials: 'include' }
      );
      if (!res.ok) return;
      const data = (await res.json()) as {
        slots?: Array<{ date: string; time: string }>;
        blocked?: { reason: string };
      };
      setOpenSlots(data.slots ?? []);
      setSlotBlock(data.blocked?.reason ?? '');
      // Why there are none matters: a full calendar and a closed program are
      // different problems, and the rep should not go looking at the wrong one.
      setSlotNote(
        data.blocked ? SLOT_BLOCK_LABEL[data.blocked.reason] ?? 'No times available.' : ''
      );
    } catch {
      // Leave the panel empty rather than wrong. The lead page still books.
    }
  }, []);

  useEffect(() => {
    setBooked('');
    setSlotNote('');
    setSlotBlock('');
    setOpenSlots([]);
    if (!selected?.leadId || selected.phase === 'booked') return;
    void loadSlots(selected.leadId);
  }, [selected?.leadId, selected?.phase, loadSlots]);

  /**
   * The address the homeowner texted, taken off the thread.
   *
   * It is on the thread and nowhere else: the classifier reads `gave_address`
   * and the runner hands the booking to a person, but nothing ever writes the
   * text onto the lead. So the calendar had no scheduling area for a lead who
   * had already told us where they live, and the rep retyped it into another
   * page.
   *
   * Prefilled, never auto-saved. "168 wedtbridge avenue" is a real thing a
   * homeowner types, and the travel radius is measured on whatever this
   * resolves to — a rep confirming it is the point, not friction. Saving goes
   * through `set_lead_address`, the same Places resolution the public form
   * uses; nothing here trusts the typed string.
   */
  const textedAddress = useMemo(() => {
    const said = selected?.messages
      .filter((m) => m.direction === 'in' && m.intent === 'gave_address' && m.body.trim())
      .at(-1);
    return said?.body.trim() ?? '';
  }, [selected]);

  const [addressDraft, setAddressDraft] = useState('');
  useEffect(() => {
    setAddressDraft(textedAddress);
  }, [textedAddress, selected?.leadId]);

  const saveAddress = async () => {
    if (!selected?.leadId || !addressDraft.trim()) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _action: 'set_lead_address',
          leadId: selected.leadId,
          addressText: addressDraft.trim(),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      await loadSlots(selected.leadId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that address.');
    } finally {
      setBusy(false);
    }
  };

  /**
   * Book, then mark the thread booked so the automation stops.
   *
   * Notifications are ON, unlike the lead page's default. A booking made here
   * came out of a text conversation the homeowner is already having with us —
   * they are expecting the confirmation, and it is what carries the address,
   * the reference and the reminders.
   */
  const bookSlot = async (date: string, time: string) => {
    if (!selected) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _action: 'book_lead',
          leadId: selected.leadId,
          date,
          time,
          notify: true,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; publicReference?: string };
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      // The thread is over: leaving it live would let a later reply draft an
      // offer to someone who already has an appointment.
      await fetch('/api/leads', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _action: 'conversation_set_phase',
          conversationId: selected.id,
          phase: 'booked',
        }),
      }).catch(() => null);
      setBooked(data.publicReference ?? 'booked');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not book that time.');
    } finally {
      setBusy(false);
    }
  };

  /** The one draft awaiting a decision on the selected thread, if any. */
  const pendingDraft = useMemo(
    () => selected?.messages.filter((m) => m.state === 'pending_approval').at(-1) ?? null,
    [selected]
  );

  useEffect(() => {
    setEditedBody(pendingDraft?.body ?? '');
  }, [pendingDraft?.id, pendingDraft?.body]);

  const waiting = useMemo(
    () => conversations.filter((c) => c.messages.some((m) => m.state === 'pending_approval')),
    [conversations]
  );

  const act = async (action: string, payload: Record<string, unknown>) => {
    setBusy(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _action: action, ...payload }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That did not work.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-[#1B3C6C]" />
            Conversations
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Text threads with leads who haven&apos;t booked yet. Nothing sends until you send it.
          </p>
        </div>
        <button
          onClick={() => void (async () => {
            if (selectedId) await syncThread(selectedId);
            await load();
          })()}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </header>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {waiting.length > 0 && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-900">
          <strong>{waiting.length}</strong> {waiting.length === 1 ? 'thread is' : 'threads are'}{' '}
          waiting on you.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4">
        {/* ── The queue ── */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
          {loading && conversations.length === 0 && (
            <p className="p-4 text-sm text-slate-400">Loading…</p>
          )}
          {!loading && conversations.length === 0 && (
            <p className="p-4 text-sm text-slate-400">
              No conversations yet. One starts the first time a lead texts back.
            </p>
          )}
          <ul className="divide-y divide-slate-100 max-h-[70vh] overflow-y-auto">
            {conversations.map((c) => {
              const hasDraft = c.messages.some((m) => m.state === 'pending_approval');
              const lastInbound = c.messages.filter((m) => m.direction === 'in').at(-1);
              return (
                <li key={c.id}>
                  <button
                    onClick={() => setSelectedId(c.id)}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition ${
                      selectedId === c.id ? 'bg-slate-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm text-slate-900 truncate">
                        {c.lead?.name || 'Unknown lead'}
                      </span>
                      {hasDraft && (
                        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          Waiting
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{PHASE_LABEL[c.phase] ?? c.phase}</p>
                    {lastInbound && (
                      <p className="text-xs text-slate-400 mt-1 truncate">
                        &ldquo;{lastInbound.body}&rdquo; · {timeAgo(lastInbound.createdAt)}
                      </p>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* ── The thread ── */}
        <div className="border border-slate-200 rounded-xl bg-white p-4">
          {!selected && <p className="text-sm text-slate-400">Pick a conversation.</p>}

          {selected && (
            <>
              <div className="flex items-start justify-between gap-4 pb-3 mb-3 border-b border-slate-100">
                <div>
                  <p className="font-semibold text-slate-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    {selected.lead?.name || 'Unknown lead'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selected.lead?.phone}
                    {selected.lead?.city ? ` · ${selected.lead.city}` : ''}
                  </p>
                </div>
                <span className="text-xs text-slate-500">{PHASE_LABEL[selected.phase] ?? selected.phase}</span>
              </div>

              {/* Messages, oldest first. Discarded drafts stay visible: what we
                  decided NOT to say is part of the record. */}
              <div className="space-y-2 max-h-[45vh] overflow-y-auto mb-4">
                {selected.messages.map((m) => {
                  if (m.state === 'pending_approval') return null;
                  const mine = m.direction === 'out';
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                          mine
                            ? m.state === 'discarded'
                              ? 'bg-slate-100 text-slate-400 line-through'
                              : 'bg-[#1B3C6C] text-white'
                            : 'bg-slate-100 text-slate-900'
                        }`}
                      >
                        {m.body || <em className="opacity-60">(no message sent)</em>}
                        <div className={`text-[10px] mt-1 ${mine ? 'text-white/60' : 'text-slate-400'}`}>
                          {timeAgo(m.createdAt)}
                          {/* The classifier's read, kept visible so a wrong call
                              is findable rather than inferred from the reply. */}
                          {m.direction === 'in' && m.intent && (
                            <> · read as {m.intent}{m.confident ? '' : ' (unsure)'}</>
                          )}
                          {/* Sent from the Twilio dashboard rather than here.
                              Worth saying: the automation did not choose these
                              words and did not advance the thread for them. */}
                          {m.templateId === 'sent_outside_portal' && <> · sent outside the portal</>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Book it, from here ──
                  A confirmed time is the point of the whole thread, and making
                  Michael leave the conversation to place it is where the reply
                  he was about to send gets forgotten. */}
              {selected.phase !== 'booked' && (
                <div className="mb-3 border border-slate-200 rounded-xl p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-1.5">
                    <CalendarCheck className="w-3.5 h-3.5" />
                    Book a visit
                  </p>
                  {booked ? (
                    <p className="text-sm text-emerald-700">Booked · {booked}</p>
                  ) : (
                    <>
                      {selected.offeredSlots.length > 0 && (
                        <>
                          <p className="text-xs text-slate-500 mb-1.5">Times we offered them:</p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {selected.offeredSlots.map((slot) => (
                              <button
                                key={`offered-${slot.date}-${slot.time}`}
                                onClick={() => void bookSlot(slot.date, slot.time)}
                                disabled={busy}
                                className="px-3 py-1.5 text-sm rounded-lg bg-[#1B3C6C] text-white hover:opacity-90 disabled:opacity-50"
                              >
                                {slotLabel(slot.date, slot.time)}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                      {openSlots.length > 0 && (
                        <>
                          <p className="text-xs text-slate-500 mb-1.5">Other open times:</p>
                          <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                            {openSlots.slice(0, 12).map((slot) => (
                              <button
                                key={`open-${slot.date}-${slot.time}`}
                                onClick={() => void bookSlot(slot.date, slot.time)}
                                disabled={busy}
                                className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                              >
                                {slotLabel(slot.date, slot.time)}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                      {slotNote && <p className="text-xs text-amber-700">{slotNote}</p>}
                      {/* The address is already in the thread. Offering it here
                          is the difference between one click and retyping the
                          whole lead into the consultation form. */}
                      {slotBlock === 'NO_AREA' && (
                        <div className="mt-2">
                          <label className="block text-xs text-slate-500 mb-1">
                            {textedAddress
                              ? 'They texted this address — check it, then save:'
                              : 'Property address:'}
                          </label>
                          <div className="flex gap-2">
                            <input
                              value={addressDraft}
                              onChange={(e) => setAddressDraft(e.target.value)}
                              placeholder="123 Main St, Welland"
                              className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-200"
                            />
                            <button
                              onClick={() => void saveAddress()}
                              disabled={busy || !addressDraft.trim()}
                              className="px-3 py-1.5 text-sm rounded-lg bg-[#1B3C6C] text-white hover:opacity-90 disabled:opacity-50"
                            >
                              Save
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">
                            Saved through the same address check the public form uses. Times appear
                            here once it resolves.
                          </p>
                        </div>
                      )}
                      {!slotNote && openSlots.length === 0 && selected.offeredSlots.length === 0 && (
                        <p className="text-xs text-slate-400">No open times on the calendar.</p>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ── The draft ── */}
              {pendingDraft ? (
                <div className="border border-amber-200 bg-amber-50/60 rounded-xl p-3">
                  {pendingDraft.escalationReason ? (
                    <p className="text-sm font-semibold text-amber-900 flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      {REASON_LABEL[pendingDraft.escalationReason] ?? pendingDraft.escalationReason}
                      <span className="font-normal text-amber-800">— write your own reply.</span>
                    </p>
                  ) : (
                    <p className="text-xs font-bold uppercase tracking-wide text-amber-800 mb-2">
                      Draft reply · not sent
                    </p>
                  )}
                  <textarea
                    value={editedBody}
                    onChange={(e) => setEditedBody(e.target.value)}
                    rows={3}
                    placeholder="Type your reply…"
                    className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B3C6C]/30"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-slate-500">{editedBody.length} characters</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          void act('conversation_discard', { messageId: pendingDraft.id })
                        }
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Discard
                      </button>
                      <button
                        onClick={() =>
                          void act('conversation_send', {
                            messageId: pendingDraft.id,
                            body: editedBody,
                          })
                        }
                        disabled={busy || !editedBody.trim()}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-[#1B3C6C] text-white hover:bg-[#16325a] disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  Nothing waiting on this one.
                  {selected.phase === 'needs_human' && (
                    <>
                      {' '}
                      <button
                        onClick={() =>
                          void act('conversation_set_phase', {
                            conversationId: selected.id,
                            phase: 'awaiting_time_choice',
                          })
                        }
                        disabled={busy}
                        className="underline text-[#1B3C6C] disabled:opacity-50"
                      >
                        Hand it back to the automation
                      </button>
                    </>
                  )}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
