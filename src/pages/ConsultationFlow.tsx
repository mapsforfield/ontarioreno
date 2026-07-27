import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, BookOpen, CalendarDays, Check, CheckCircle2, ChevronDown, Loader2, Lock, MapPin } from 'lucide-react';
import { testingModeEnabled } from '../../lib/app-config';
import { buildIcs, googleCalendarUrl, outlookCalendarUrl, type CalendarEvent } from '../../lib/calendar-links';

// Public homeowner journey — progressive, one decision per screen.
//
//   1  Address + ownership
//   2  Project type + timing
//   3  Funding explanation + contribution
//   4  Contact
//   →  qualified: calendar → confirm
//
// The backend is unchanged: the server still decides address state, municipality,
// scheduling area, program, routing outcome and which rep takes the booking. This
// file only changes how those steps are presented.

type Question = {
  key: string;
  label: string;
  help?: string;
  step: 1 | 2 | 3;
  options: Array<{ value: string; label: string }>;
};

type Program = {
  key: string;
  slug: string;
  areaLabel: string;
  enabled: boolean;
  displayAmountLabel: string;
  fundingHighlights: string[];
  programTerms: string[];
  whyFreeText: string;
  questions: Question[];
  visitMinutes: number;
  consultationMode: 'in_person' | 'phone';
  guideUrl: string;
  guideLabel: string;
};

type Outcome = 'DIRECT_CALENDAR' | 'MANUAL_REVIEW' | 'NURTURE' | 'DECLINE';
type Slot = { date: string; time: string };
type Phase = 'q1' | 'q2' | 'q3' | 'contact' | 'calendar' | 'result' | 'closed';

/** Plain-English routing reasons, shown in testing mode only. */
const REASON_TEXT: Record<string, string> = {
  NOT_PROPERTY_OWNER: 'Answered “No” to owning the property.',
  OUTSIDE_ONTARIO: 'The address resolved outside Ontario.',
  ADDRESS_UNVERIFIED: 'The address was not confirmed — no suggestion was selected, or it was missing a street number or postal code.',
  MUNICIPALITY_UNRECOGNISED: 'The municipality is not in the service-area map (only Hamilton is mapped today).',
  PROGRAM_NOT_ENABLED: 'We serve this area, but its program is not switched on yet.',
  OWNERSHIP_UNCERTAIN: 'Ownership was left as “It’s complicated”.',
  PROJECT_TYPE_UNCERTAIN: 'Project type was left as “Still deciding”.',
  PROJECT_TYPE_NOT_LISTED: 'That project type is not listed for this program.',
  CONTRIBUTION_UNCERTAIN: 'Remaining-cost question was left as “Not sure yet”.',
  WANTS_FINANCING: 'Wants to discuss financing (noted for the specialist — not a barrier).',
  EXPLORATORY_TIMELINE: 'Timeline is “Just exploring”.',
  ELIGIBLE_FOR_BOOKING: 'All checks passed.',
};

const inputCls =
  'w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1B3C6C] focus:ring-4 focus:ring-blue-100';

function fmtDate(d: string) {
  return new Date(`${d}T12:00:00`).toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' });
}
function fmtDateShort(d: string) {
  return new Date(`${d}T12:00:00`).toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' });
}
function fmtTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

export default function ConsultationFlow() {
  const slug = useParams<{ slug: string }>().slug ?? 'hamilton';

  // Hidden on the live domain, visible on previews and locally — see
  // lib/app-config.ts. Not query-string overridable, so a visitor on the real
  // site can never switch it on.
  const debug = useMemo(
    () => testingModeEnabled(typeof window === 'undefined' ? null : window.location.hostname),
    []
  );

  const [program, setProgram] = useState<Program | null>(null);
  const [phase, setPhase] = useState<Phase>('q1');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [addressText, setAddressText] = useState('');
  const [placeId, setPlaceId] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{ placeId: string; description: string }>>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [contact, setContact] = useState({ name: '', phone: '', email: '' });
  const [termsOpen, setTermsOpen] = useState(false);

  const [leadRef, setLeadRef] = useState('');
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [reasons, setReasons] = useState<string[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [chosen, setChosen] = useState<Slot | null>(null);
  const [booking, setBooking] = useState<
    { publicReference: string; date: string; time: string; propertyAddress?: string } | null
  >(null);

  const timer = useRef<number | undefined>(undefined);
  const skip = useRef(false);

  useEffect(() => {
    fetch(`/api/leads?flow=program&slug=${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((p: Program) => {
        setProgram(p);
        if (!p.enabled) setPhase('closed');
      })
      .catch(() => setError('This page is unavailable right now.'));
  }, [slug]);

  useEffect(() => {
    if (skip.current) { skip.current = false; return; }
    const q = addressText.trim();
    if (q.length < 3) { setSuggestions([]); return; }
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      try {
        const r = await fetch(`/api/leads?flow=address_suggest&q=${encodeURIComponent(q)}`);
        setSuggestions((await r.json()).suggestions ?? []);
      } catch { setSuggestions([]); }
    }, 250);
    return () => window.clearTimeout(timer.current);
  }, [addressText]);

  const stepQuestions = (step: 1 | 2 | 3) => (program?.questions ?? []).filter((q) => q.step === step);
  const answered = (step: 1 | 2 | 3) => stepQuestions(step).every((q) => answers[q.key]);

  const submit = async (finalContact: typeof contact) => {
    if (!program) return;
    setBusy(true);
    setError('');
    try {
      const r = await fetch('/api/leads?flow=submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programSlug: program.slug,
          name: finalContact.name,
          phone: finalContact.phone,
          email: finalContact.email,
          placeId,
          notes: !placeId && addressText.trim() ? `Typed address (not confirmed): ${addressText.trim()}` : '',
          answers,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error ?? 'Something went wrong.');
      setLeadRef(j.leadRef);
      setOutcome(j.outcome);
      setReasons(j.reasons ?? []);
      // Always recorded, panel or no panel — so a routing result can be diagnosed
      // from devtools even on the live site, where the panel is hidden.
      console.info('[consultation] routing', { outcome: j.outcome, reasons: j.reasons });
      if (j.offersCalendar) {
        const av = await (await fetch(`/api/leads?flow=availability&leadRef=${encodeURIComponent(j.leadRef)}`)).json();
        setSlots(av.slots ?? []);
        setPhase('calendar');
      } else {
        setPhase('result');
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
      setPhase('result');
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

  if (error && !program) return <Shell><p className="text-slate-600">{error}</p></Shell>;
  if (!program) return <Shell><Loader2 className="mx-auto h-6 w-6 animate-spin text-[#1B3C6C]" /></Shell>;

  if (phase === 'closed') {
    return (
      <Shell title={`${program.areaLabel} consultations`}>
        <p className="text-slate-600">We aren’t taking online bookings for {program.areaLabel} yet.</p>
      </Shell>
    );
  }

  const stepIndex = { q1: 1, q2: 2, q3: 3, contact: 4, calendar: 5, result: 5, closed: 0 }[phase];

  // What the homeowner is actually booking — stated the same way on the calendar
  // and the confirmation so there is no ambiguity about who goes where.
  const meeting =
    program.consultationMode === 'phone'
      ? {
          line: `Initial Consultation Call · ${program.visitMinutes} minutes`,
          detail: 'A specialist will call you at your scheduled time.',
        }
      : {
          line: `In-Person Site Visit · ${program.visitMinutes} minutes`,
          detail: 'A specialist will visit your property.',
        };

  const debugPanel = debug && reasons.length > 0 && (
    <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-left">
      <p className="text-xs font-black uppercase tracking-wider text-amber-800">Testing mode — routing detail</p>
      <p className="mt-1 text-sm font-bold text-amber-900">Outcome: {outcome}</p>
      <ul className="mt-2 space-y-1 text-sm text-amber-900">
        {reasons.map((r) => (
          <li key={r}>• <span className="font-mono text-xs">{r}</span> — {REASON_TEXT[r] ?? 'No description.'}</li>
        ))}
      </ul>
    </div>
  );

  // ── Result: booked, or a non-calendar outcome ──
  if (phase === 'result') {
    return (
      <Shell
        title={
          booking ? 'Your visit is booked'
            : outcome === 'NURTURE' ? 'Info package sent'
              : 'Thanks — we have your details'
        }
      >
        {booking ? (
          <>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-7 w-7 text-green-600" />
            </div>
            <p className="text-xl font-black text-slate-900">{fmtDate(booking.date)}</p>
            <p className="text-lg font-bold text-[#1B3C6C]">{fmtTime(booking.time)}</p>
            <p className="mt-2 text-sm font-bold uppercase tracking-wide text-slate-500">{meeting.line}</p>
            <p className="mt-3 text-slate-600">{meeting.detail}</p>
            <p className="mt-4 text-sm font-semibold text-slate-500">Reference {booking.publicReference}</p>

            <AddToCalendar
              event={{
                title: `OntarioReno - ${program.areaLabel} ADU Site Visit`,
                location: booking.propertyAddress || addressText,
                description: `${program.visitMinutes}-minute ${
                  program.consultationMode === 'phone' ? 'consultation call' : 'in-person'
                } ADU grant & property assessment with an OntarioReno specialist. Reference: ${booking.publicReference}`,
                date: booking.date,
                time: booking.time,
                durationMinutes: program.visitMinutes,
              }}
              uid={booking.publicReference}
            />

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/70 p-5 text-left">
              <p className="mb-3 text-sm font-black text-slate-800">What happens next?</p>
              <ul className="space-y-3">
                {[
                  ['Confirmation Sent:', 'Check your SMS & email for booking details.'],
                  ['Zoning Review:', 'Our team will perform a preliminary property assessment prior to arrival.'],
                  ['Site Visit:', `A specialist will arrive at ${booking.propertyAddress || addressText} at the scheduled time.`],
                ].map(([bold, rest]) => (
                  <li key={bold} className="flex gap-2.5 text-sm leading-relaxed text-slate-600">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span><span className="font-bold text-slate-800">{bold}</span> {rest}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : outcome === 'NURTURE' ? (
          // Exploratory leads get the guide, not a 45-minute live slot.
          <>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#e8f1fb]">
              <BookOpen className="h-7 w-7 text-[#1B3C6C]" />
            </div>
            <p className="text-slate-600">
              We’ve sent the {program.areaLabel} grant guide to your email — what qualifies,
              realistic costs, and how the permit process works.
            </p>
            {program.guideUrl && (
              <a href={program.guideUrl}
                className="mt-5 block w-full rounded-xl bg-[#1B3C6C] py-4 text-base font-bold text-white transition hover:bg-[#153158]">
                Read the {program.guideLabel}
              </a>
            )}
            <p className="mt-4 text-sm text-slate-500">
              We’ll check in when you’re closer to starting — no pressure, and you can book a
              consultation any time.
            </p>
          </>
        ) : (
          <p className="text-slate-600">
            {outcome === 'DECLINE'
              ? 'Based on your answers this program isn’t the right fit. Thanks for your time.'
              : 'A specialist will review your details and call you shortly.'}
          </p>
        )}
        {debugPanel}
      </Shell>
    );
  }

  // ── Calendar ──
  if (phase === 'calendar') {
    return (
      <Shell title="Pick a time that suits you" step={stepIndex}>
        <p className="mb-5 text-sm font-bold text-[#1B3C6C]">{meeting.line}</p>
        {byDate.length === 0 && <p className="text-slate-600">No times are free right now — we’ll call to arrange one.</p>}
        <div className="space-y-3 text-left">
          {byDate.slice(0, 8).map(([date, times]) => (
            <div key={date} className="rounded-xl border border-slate-200 p-4">
              <p className="mb-3 text-sm font-black text-slate-800">{fmtDateShort(date)}</p>
              <div className="flex flex-wrap gap-2">
                {times.map((time) => {
                  const on = chosen?.date === date && chosen?.time === time;
                  return (
                    <button key={time} type="button" onClick={() => setChosen({ date, time })}
                      className={`rounded-lg border-2 px-4 py-2 text-sm font-bold transition ${
                        on ? 'border-[#1B3C6C] bg-[#1B3C6C] text-white' : 'border-slate-200 text-slate-700 hover:border-[#1B3C6C]'
                      }`}>
                      {fmtTime(time)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        {error && <ErrorNote>{error}</ErrorNote>}
        <PrimaryButton disabled={!chosen || busy} onClick={book}>
          {busy ? 'Booking…' : chosen ? `Confirm ${fmtTime(chosen.time)}` : 'Choose a time'}
        </PrimaryButton>
        {debugPanel}
      </Shell>
    );
  }

  // ── Progressive question steps ──
  const back = () => setPhase(phase === 'contact' ? 'q3' : phase === 'q3' ? 'q2' : 'q1');

  return (
    <Shell
      title={
        phase === 'q1' ? 'Let’s start with your property'
          : phase === 'q2' ? 'What are you planning?'
            : phase === 'q3' ? `How the ${program.areaLabel} funding works`
              : 'Where should we send your confirmation?'
      }
      step={stepIndex}
      onBack={phase === 'q1' ? undefined : back}
    >
      <Helmet><title>{`${program.areaLabel} Secondary Suite Consultation | OntarioReno`}</title></Helmet>

      {/* Step 1 — address + ownership */}
      {phase === 'q1' && (
        <div className="space-y-6 text-left">
          <div className="relative">
            <label className="mb-2 block text-sm font-bold text-slate-700">
              <MapPin className="mr-1 inline h-4 w-4 text-[#1B3C6C]" /> Property address
            </label>
            <input className={inputCls} value={addressText} autoComplete="off" placeholder="Start typing, then pick your address"
              onChange={(e) => { setAddressText(e.target.value); setPlaceId(''); }} />
            {placeId ? (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <Check className="h-3.5 w-3.5" /> Address confirmed
              </p>
            ) : addressText.trim().length > 2 ? (
              // Said here, at the point of failure, rather than four steps later
              // as an unexplained "a specialist will call you".
              <p className="mt-2 text-xs font-semibold text-amber-700">
                Pick your address from the list so we can check availability in your area.
                Otherwise we’ll need to call you to confirm it.
              </p>
            ) : null}
            {suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                {suggestions.map((s) => (
                  <button key={s.placeId} type="button"
                    onMouseDown={() => { skip.current = true; setAddressText(s.description); setPlaceId(s.placeId); setSuggestions([]); }}
                    className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-[#f6faff]">
                    {s.description}
                  </button>
                ))}
              </div>
            )}
          </div>
          {stepQuestions(1).map((q) => (
            <Choice key={q.key} question={q} value={answers[q.key]} onPick={(v) => setAnswers({ ...answers, [q.key]: v })} />
          ))}
          <PrimaryButton disabled={!addressText.trim() || !answered(1)} onClick={() => setPhase('q2')}>Continue</PrimaryButton>
        </div>
      )}

      {/* Step 2 — project + timing */}
      {phase === 'q2' && (
        <div className="space-y-6 text-left">
          {stepQuestions(2).map((q) => (
            <Choice key={q.key} question={q} value={answers[q.key]} onPick={(v) => setAnswers({ ...answers, [q.key]: v })} />
          ))}
          <PrimaryButton disabled={!answered(2)} onClick={() => setPhase('q3')}>Continue</PrimaryButton>
        </div>
      )}

      {/* Step 3 — funding + contribution */}
      {phase === 'q3' && (
        <div className="space-y-6 text-left">
          {program.displayAmountLabel && (
            <p className="rounded-xl bg-emerald-50 px-4 py-3 text-center text-base font-bold text-emerald-800">
              {program.displayAmountLabel}
            </p>
          )}
          <ul className="space-y-2">
            {program.fundingHighlights.map((h) => (
              <li key={h} className="flex gap-2.5 text-sm leading-relaxed text-slate-700">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {h}
              </li>
            ))}
          </ul>
          <Disclosure
            open={termsOpen}
            onToggle={() => setTermsOpen((v) => !v)}
            label="Full program terms"
            id="full-program-terms"
            scrollOnMobile
          >
            <ul className="space-y-1.5">{program.programTerms.map((t) => <li key={t}>• {t}</li>)}</ul>
          </Disclosure>
          {stepQuestions(3).map((q) => (
            <Choice key={q.key} question={q} value={answers[q.key]} onPick={(v) => setAnswers({ ...answers, [q.key]: v })} />
          ))}
          <PrimaryButton disabled={!answered(3)} onClick={() => setPhase('contact')}>Continue</PrimaryButton>
        </div>
      )}

      {/* Step 4 — contact, then straight to the calendar */}
      {phase === 'contact' && (
        <form className="space-y-4 text-left" onSubmit={(e) => { e.preventDefault(); void submit(contact); }}>
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Your name</label>
            <input className={inputCls} required value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Mobile number</label>
            <input className={inputCls} type="tel" inputMode="tel" required value={contact.phone}
              onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Email <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input className={inputCls} type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} />
          </div>
          {error && <ErrorNote>{error}</ErrorNote>}
          <PrimaryButton disabled={busy || !contact.name.trim() || !contact.phone.trim()} type="submit">
            {busy ? 'Checking availability…' : 'See available times'}
          </PrimaryButton>
          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
            <Lock className="h-3.5 w-3.5 shrink-0" />
            100% Free &amp; No-Obligation. Your information is kept strictly confidential.
          </p>
        </form>
      )}
      {debugPanel}
    </Shell>
  );
}

// ─── Presentational pieces ────────────────────────────────────────────────────

function AddToCalendar({ event, uid }: { event: CalendarEvent; uid: string }) {
  const [open, setOpen] = useState(false);

  const downloadIcs = () => {
    // Apple Calendar and desktop Outlook both consume .ics; a blob download
    // avoids needing any server round-trip for the file.
    const blob = new Blob([buildIcs(event, uid)], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ontarioreno-${uid}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  const item = 'block w-full px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-[#f6faff]';

  return (
    <div className="relative mt-5">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#1B3C6C] px-4 py-3 text-sm font-bold text-[#1B3C6C] transition hover:bg-[#f2f7ff]">
        <CalendarDays className="h-4 w-4" /> Add to Calendar
        <ChevronDown className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 z-30 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-lg">
          <a className={item} href={googleCalendarUrl(event)} target="_blank" rel="noopener noreferrer"
            onClick={() => setOpen(false)}>
            Google Calendar
          </a>
          <button type="button" className={item} onClick={downloadIcs}>Apple Calendar (.ics)</button>
          <a className={item} href={outlookCalendarUrl(event)} target="_blank" rel="noopener noreferrer"
            onClick={() => setOpen(false)}>
            Outlook (web)
          </a>
          <button type="button" className={item} onClick={downloadIcs}>Download .ics</button>
        </div>
      )}
    </div>
  );
}

function Choice({ question, value, onPick }: { question: Question; value?: string; onPick: (v: string) => void }) {
  return (
    <div>
      <p className="mb-1 text-sm font-bold text-slate-700">{question.label}</p>
      {question.help && <p className="mb-3 text-xs leading-relaxed text-slate-500">{question.help}</p>}
      <div className="grid gap-2">
        {question.options.map((o) => {
          const on = value === o.value;
          return (
            <button key={o.value} type="button" onClick={() => onPick(o.value)}
              className={`flex items-center justify-between rounded-xl border-2 px-4 py-3.5 text-left text-sm font-bold transition ${
                on ? 'border-[#1B3C6C] bg-[#f2f7ff] text-[#1B3C6C]' : 'border-slate-200 text-slate-700 hover:border-slate-300'
              }`}>
              {o.label}
              {on && <Check className="h-4 w-4" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Disclosure({
  open,
  onToggle,
  label,
  id,
  scrollOnMobile,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  label: string;
  id?: string;
  /**
   * Cap the panel and scroll it internally on phones. Without this, expanding a
   * long panel pushes the question and the Continue button below the fold, which
   * reads as a dead end. Tailwind is mobile-first, so the cap applies below the
   * `md` breakpoint (768px) and is removed at and above it.
   */
  scrollOnMobile?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={id}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-bold text-slate-700"
      >
        {label}
        <ChevronDown className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          id={id}
          className={`px-4 pb-4 text-sm leading-relaxed text-slate-600 ${
            scrollOnMobile
              ? 'scroll-subtle max-h-[190px] overflow-y-auto md:max-h-none md:overflow-visible'
              : ''
          }`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function PrimaryButton({ children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest}
      className="w-full rounded-xl bg-[#1B3C6C] py-4 text-base font-bold text-white transition hover:bg-[#153158] disabled:cursor-not-allowed disabled:opacity-40">
      {children}
    </button>
  );
}

function ErrorNote({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{children}</p>;
}

function Shell({ children, title, step, onBack }: {
  children: React.ReactNode; title?: string; step?: number; onBack?: () => void;
}) {
  return (
    <div className="flex min-h-screen justify-center bg-[#f0f4f8] px-4 py-8 sm:items-center sm:py-12">
      <div className="w-full max-w-md">
        <div className="mb-5 text-center">
          <div className="mb-4 inline-flex items-center justify-center rounded-2xl bg-[#1B3C6C] px-5 py-2">
            <span className="text-xs font-bold uppercase tracking-widest text-white/80">OntarioReno</span>
          </div>
          {step ? (
            <div className="mx-auto mb-5 flex max-w-[220px] gap-1.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-[#1B3C6C]' : 'bg-slate-200'}`} />
              ))}
            </div>
          ) : null}
          {title && <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{title}</h1>}
        </div>
        <div className="relative rounded-2xl bg-white p-6 text-center shadow-xl sm:p-7">
          {onBack && (
            <button type="button" onClick={onBack}
              className="absolute left-4 top-4 flex items-center gap-1 text-xs font-bold text-slate-400 transition hover:text-slate-700">
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
          )}
          {onBack && <div className="h-4" />}
          {children}
        </div>
        <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
          <CalendarDays className="h-3.5 w-3.5" /> Free consultation · about 45 minutes
        </p>
      </div>
    </div>
  );
}
