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
import { MessageSquare, Send, Trash2, User, AlertTriangle, RefreshCw } from 'lucide-react';

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
          onClick={() => void load()}
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
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

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
