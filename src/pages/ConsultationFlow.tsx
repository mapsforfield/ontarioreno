import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { CalendarDays, CheckCircle2, ChevronDown, Loader2, MapPin, ShieldCheck } from 'lucide-react';

// Public homeowner journey. No account, no login, no portal.
// Every decision — address state, scheduling area, program, routing outcome,
// representative assignment — is made on the server. This page only collects
// answers and a chosen time.

type Question = { key: string; label: string; options: Array<{ value: string; label: string }> };

type Program = {
  key: string;
  version: number;
  slug: string;
  areaLabel: string;
  enabled: boolean;
  displayAmountLabel: string;
  programTerms: string[];
  whyFreeText: string;
  questions: Question[];
  visitMinutes: number;
};

type Outcome = 'DIRECT_CALENDAR' | 'MANUAL_REVIEW' | 'NURTURE' | 'DECLINE';
type Slot = { date: string; time: string };
type Step = 'form' | 'calendar' | 'done' | 'closed';

const field =
  'w-full rounded-[0.78rem] border border-slate-300/85 bg-white px-4 py-[0.92rem] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#2b5a96] focus:ring-4 focus:ring-blue-100/80';
const label = 'block text-sm font-semibold tracking-[-0.012em] text-slate-700 mb-2';

function fmtDate(d: string) {
  return new Date(`${d}T12:00:00`).toLocaleDateString('en-CA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}
function fmtTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

export default function ConsultationFlow() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? 'hamilton';

  const [program, setProgram] = useState<Program | null>(null);
  const [step, setStep] = useState<Step>('form');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [contact, setContact] = useState({ name: '', phone: '', email: '' });
  const [addressText, setAddressText] = useState('');
  const [placeId, setPlaceId] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{ placeId: string; description: string }>>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);

  const [leadRef, setLeadRef] = useState('');
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [chosen, setChosen] = useState<Slot | null>(null);
  const [booking, setBooking] = useState<{ publicReference: string; date: string; time: string } | null>(null);

  const suggestTimer = useRef<number | undefined>(undefined);
  const skipSuggest = useRef(false);

  useEffect(() => {
    fetch(`/api/leads?flow=program&slug=${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((p: Program) => {
        setProgram(p);
        if (!p.enabled) setStep('closed');
      })
      .catch(() => setError('This page is unavailable right now.'));
  }, [slug]);

  // Address autocomplete — the server resolves the municipality and program.
  useEffect(() => {
    if (skipSuggest.current) {
      skipSuggest.current = false;
      return;
    }
    const q = addressText.trim();
    if (q.length < 3) {
      setSuggestions([]);
      return;
    }
    window.clearTimeout(suggestTimer.current);
    suggestTimer.current = window.setTimeout(async () => {
      try {
        const r = await fetch(`/api/leads?flow=address_suggest&q=${encodeURIComponent(q)}`);
        const j = await r.json();
        setSuggestions(j.suggestions ?? []);
      } catch {
        setSuggestions([]);
      }
    }, 250);
    return () => window.clearTimeout(suggestTimer.current);
  }, [addressText]);

  const canSubmit = useMemo(() => {
    if (!program || busy) return false;
    if (!contact.name.trim()) return false;
    if (!contact.phone.trim() && !contact.email.trim()) return false;
    if (!consent) return false;
    return program.questions.every((q) => answers[q.key]);
  }, [program, busy, contact, consent, answers]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !program) return;
    setBusy(true);
    setError('');
    try {
      const r = await fetch('/api/leads?flow=submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programSlug: program.slug,
          name: contact.name,
          phone: contact.phone,
          email: contact.email,
          placeId,
          notes: addressText.trim() && !placeId ? `Typed address: ${addressText.trim()}` : '',
          answers,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error ?? 'Something went wrong.');
      setLeadRef(j.leadRef);
      setOutcome(j.outcome);
      if (j.offersCalendar) {
        const a = await fetch(`/api/leads?flow=availability&leadRef=${encodeURIComponent(j.leadRef)}`);
        const av = await a.json();
        setSlots(av.slots ?? []);
        setStep('calendar');
      } else {
        setStep('done');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const book = async () => {
    if (!chosen || busy) return;
    setBusy(true);
    setError('');
    try {
      const r = await fetch('/api/leads?flow=book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadRef, date: chosen.date, time: chosen.time }),
      });
      const j = await r.json();
      if (r.status === 409 && j?.code === 'SLOT_UNAVAILABLE') {
        setError('That time was just taken. Please choose another.');
        setSlots(j.alternatives?.length ? j.alternatives : slots.filter((s) => s.time !== chosen.time));
        setChosen(null);
        return;
      }
      if (!r.ok) throw new Error(j?.error ?? 'We could not complete the booking.');
      setBooking(j);
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not complete the booking.');
    } finally {
      setBusy(false);
    }
  };

  const byDate = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const s of slots) map.set(s.date, [...(map.get(s.date) ?? []), s.time]);
    return [...map.entries()];
  }, [slots]);

  if (error && !program) {
    return <Shell><p className="text-slate-600">{error}</p></Shell>;
  }
  if (!program) {
    return (
      <Shell>
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#1B3C6C]" />
      </Shell>
    );
  }

  if (step === 'closed') {
    return (
      <Shell title={`${program.areaLabel} consultations`}>
        <p className="text-slate-600">
          We aren’t taking online bookings for {program.areaLabel} yet. Please check back soon.
        </p>
      </Shell>
    );
  }

  // ── Confirmation / non-calendar outcomes ──
  if (step === 'done') {
    return (
      <Shell title={booking ? 'Your consultation is booked' : 'Thanks — we’ve got your details'}>
        {booking ? (
          <>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-7 w-7 text-green-600" />
            </div>
            <p className="text-lg font-bold text-slate-900">
              {fmtDate(booking.date)} at {fmtTime(booking.time)}
            </p>
            <p className="mt-2 text-slate-600">
              A specialist will visit your property. The visit takes about {program.visitMinutes} minutes.
            </p>
            <p className="mt-4 text-sm font-semibold text-slate-500">
              Reference {booking.publicReference}
            </p>
            <p className="mt-4 text-sm text-slate-500">
              We’ll send a confirmation with the details. If anything changes, reply to that message
              and we’ll sort it out.
            </p>
          </>
        ) : (
          <p className="text-slate-600">
            {outcome === 'DECLINE'
              ? 'Based on what you’ve told us, this program isn’t the right fit. Thanks for taking the time.'
              : outcome === 'NURTURE'
                ? 'Thanks — we’ll follow up when you’re closer to starting.'
                : 'Thanks — a specialist will review your details and call you shortly.'}
          </p>
        )}
      </Shell>
    );
  }

  // ── Calendar ──
  if (step === 'calendar') {
    return (
      <Shell title="Choose a time">
        <p className="mb-6 text-slate-600">
          Visits take about {program.visitMinutes} minutes. Pick whatever suits you — we’ll assign the
          right specialist.
        </p>
        {byDate.length === 0 && (
          <p className="text-slate-600">
            No times are available right now. We’ll call you to arrange one instead.
          </p>
        )}
        <div className="space-y-4 text-left">
          {byDate.map(([date, times]) => (
            <div key={date} className="rounded-xl border border-slate-200 p-4">
              <p className="mb-3 text-sm font-black text-slate-800">{fmtDate(date)}</p>
              <div className="flex flex-wrap gap-2">
                {times.map((time) => {
                  const active = chosen?.date === date && chosen?.time === time;
                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setChosen({ date, time })}
                      className={`rounded-lg border px-4 py-2 text-sm font-bold transition ${
                        active
                          ? 'border-[#1B3C6C] bg-[#1B3C6C] text-white'
                          : 'border-slate-200 text-slate-700 hover:border-[#1B3C6C]'
                      }`}
                    >
                      {fmtTime(time)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
        <button
          type="button"
          disabled={!chosen || busy}
          onClick={book}
          className="mt-6 w-full rounded-[0.8rem] bg-[#1B3C6C] py-[0.95rem] font-semibold text-white transition hover:bg-[#153158] disabled:opacity-50"
        >
          {busy ? 'Booking…' : 'Confirm this time'}
        </button>
      </Shell>
    );
  }

  // ── Qualification form ──
  return (
    <Shell title={`${program.areaLabel} secondary suite review`} wide>
      <Helmet>
        <title>{`${program.areaLabel} Secondary Suite Consultation | OntarioReno`}</title>
      </Helmet>

      {program.displayAmountLabel && (
        <p className="mb-6 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800">
          <ShieldCheck className="h-4 w-4" /> {program.areaLabel} funding — {program.displayAmountLabel}
        </p>
      )}

      <form onSubmit={submit} className="space-y-5 text-left">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>Your name</label>
            <input className={field} value={contact.name} required
              onChange={(e) => setContact({ ...contact, name: e.target.value })} />
          </div>
          <div>
            <label className={label}>Phone</label>
            <input className={field} type="tel" value={contact.phone} inputMode="tel"
              onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
          </div>
        </div>
        <div>
          <label className={label}>Email</label>
          <input className={field} type="email" value={contact.email}
            onChange={(e) => setContact({ ...contact, email: e.target.value })} />
        </div>

        <div className="relative">
          <label className={label}>
            <MapPin className="mr-1 inline h-4 w-4 text-[#1B3C6C]" />
            Property address
          </label>
          <input className={field} value={addressText} autoComplete="off" placeholder="Start typing your address"
            onChange={(e) => { setAddressText(e.target.value); setPlaceId(''); }} />
          {suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
              {suggestions.map((s) => (
                <button key={s.placeId} type="button"
                  onMouseDown={() => {
                    skipSuggest.current = true;
                    setAddressText(s.description);
                    setPlaceId(s.placeId);
                    setSuggestions([]);
                  }}
                  className="block w-full px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-[#f6faff]">
                  {s.description}
                </button>
              ))}
            </div>
          )}
        </div>

        {program.questions.map((q) => (
          <div key={q.key}>
            <label className={label}>{q.label}</label>
            <select className={field} required value={answers[q.key] ?? ''}
              onChange={(e) => setAnswers({ ...answers, [q.key]: e.target.value })}>
              <option value="">Select…</option>
              {q.options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        ))}

        {program.programTerms.length > 0 && (
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">
              How the {program.areaLabel} funding works
            </p>
            <ul className="space-y-1.5 text-sm leading-relaxed text-slate-600">
              {program.programTerms.map((t) => <li key={t}>• {t}</li>)}
            </ul>
          </div>
        )}

        <div className="rounded-xl border border-slate-200">
          <button type="button" onClick={() => setWhyOpen((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-bold text-slate-700">
            Why is the initial review free?
            <ChevronDown className={`h-4 w-4 transition ${whyOpen ? 'rotate-180' : ''}`} />
          </button>
          {whyOpen && (
            <p className="px-4 pb-4 text-sm leading-relaxed text-slate-600">{program.whyFreeText}</p>
          )}
        </div>

        <label className="flex items-start gap-3 text-sm text-slate-600">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 h-4 w-4" />
          <span>I agree to be contacted about this project by phone, text and email.</span>
        </label>

        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}

        <button type="submit" disabled={!canSubmit}
          className="w-full rounded-[0.8rem] bg-[#1B3C6C] py-[0.95rem] font-semibold text-white transition hover:bg-[#153158] disabled:opacity-50">
          {busy ? 'Checking…' : 'See available times'}
        </button>
        <p className="flex items-center justify-center gap-2 text-center text-xs text-slate-400">
          <CalendarDays className="h-3.5 w-3.5" /> Free, no-obligation review
        </p>
      </form>
    </Shell>
  );
}

function Shell({ children, title, wide }: { children: React.ReactNode; title?: string; wide?: boolean }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f0f4f8] px-4 py-10">
      <div className={`w-full ${wide ? 'max-w-2xl' : 'max-w-lg'}`}>
        <div className="mb-6 text-center">
          <div className="mb-3 inline-flex items-center justify-center rounded-2xl bg-[#1B3C6C] px-5 py-2">
            <span className="text-sm font-bold uppercase tracking-widest text-white/80">OntarioReno</span>
          </div>
          {title && <h1 className="text-3xl font-black tracking-tight text-slate-900">{title}</h1>}
        </div>
        <div className="rounded-2xl bg-white p-6 text-center shadow-xl sm:p-8">{children}</div>
      </div>
    </div>
  );
}
