import { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Check, CheckCircle2, ChevronRight, Loader2, Lock, MapPin } from 'lucide-react';
import { newEventId, trackCustom, trackEvent } from '../../lib/pixel';
import {
  AddToCalendar,
  Choice,
  ErrorNote,
  PrimaryButton,
  Shell,
  fmtDate,
  fmtTime,
  inputCls,
  type Question,
} from './shell';

// ─── The calendar-early booking flow ──────────────────────────────────────────
//
// One program uses this today (/consultation/basement, bookingFlow
// 'calendar_early'). Everything else still runs ConsultationFlow's original
// order and is untouched by this file.
//
// The order, and why:
//
//   1  Pick a time                the calendar, on arrival, asking nothing
//   2  What are you planning?     one tap, auto-advances
//   3  Name + mobile              the least we need to hold the slot
//   4  Booked — then optional prep
//
// The old order asked project type, permit, a financing pitch with a monthly
// payment on it, and a full contact form, and only then showed a single open
// time. Every screen before the calendar is a toll charged before anything of
// value has been offered, and the financing screen charged it to exactly the
// people most likely to balk — someone paying cash, and someone who does not
// want to discuss credit with a website.
//
// So the calendar is now the LANDING screen: open times are the whole offer,
// and they are visible before this page asks a single question. The project
// type still has to be asked before the lead is written — it is what routing
// decides on — so it sits between the calendar and the contact fields, one tap
// from someone who has already chosen when they want us there.
//
// The two questions that used to sit in front of the calendar are not lost:
// they are asked on the confirmation screen, after the slot is held, where
// skipping them costs us the answer and not the booking. See prepQuestions in
// lib/program-config.ts.
//
// The booking backend is unchanged — flow=submit then flow=book, exactly as
// before. What changed is when the homeowner is asked, not what we do with it.

type Slot = { date: string; time: string };
type Phase = 'time' | 'project' | 'lock' | 'booked' | 'done' | 'no_calendar';

export type BasementProgram = {
  key: string;
  slug: string;
  areaLabel: string;
  visitMinutes: number;
  consultationMode: 'in_person' | 'phone';
  questions: Question[];
  prepQuestions: Question[];
  pageTitle: string | null;
  displayAmountLabel: string;
  smsEnabled: boolean;
};

/** Four segments: time, project, details, booked. */
const TOTAL_STEPS = 4;

/**
 * A mobile number we can actually text, judged the way a homeowner types one.
 *
 * Digits only, ten or more — which accepts "(416) 555-0134", "416-555-0134" and
 * a leading 1. Deliberately not a strict format: the number is verified by a
 * text arriving, and a regex that rejects a real number costs a booking.
 */
const phoneOk = (v: string) => v.replace(/\D/g, '').length >= 10;

const dayPart = (date: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(`${date}T12:00:00`).toLocaleDateString('en-CA', opts);

export default function BasementBookingFlow({
  program,
  trafficSource,
}: {
  program: BasementProgram;
  trafficSource: string;
}) {
  const [phase, setPhase] = useState<Phase>('time');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [prep, setPrep] = useState<Record<string, string>>({});
  const [contact, setContact] = useState({ name: '', phone: '' });

  const [addressText, setAddressText] = useState('');
  const [placeId, setPlaceId] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{ placeId: string; description: string }>>([]);

  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [day, setDay] = useState('');
  const [chosen, setChosen] = useState<Slot | null>(null);
  const [remote, setRemote] = useState(false);
  const [booking, setBooking] = useState<
    { publicReference: string; date: string; time: string; propertyAddress?: string } | null
  >(null);
  const [leadRef, setLeadRef] = useState('');

  const timer = useRef<number | undefined>(undefined);
  const skipSuggest = useRef(false);

  const projectQuestion = program.questions.find((q) => q.key === 'projectType') ?? program.questions[0];

  // ── Funnel instrumentation ──
  // Same shape as ConsultationFlow's: custom events, once per screen per
  // session, so a screen revisited by going Back cannot overstate itself. Named
  // for the new screens rather than by number — a number that means a different
  // question than it did last month makes the funnel unreadable.
  const tracked = useRef(new Set<string>());
  const trackStep = (name: string, params?: Record<string, unknown>) => {
    if (tracked.current.has(name)) return;
    tracked.current.add(name);
    trackCustom(name, { slug: program.slug, ...params });
  };
  useEffect(() => {
    trackStep('ConsultationStepTime');
    // Once, on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * The calendar, fetched before there is a lead to key it on.
   *
   * This is the first screen, so the fetch is the page load. Everything below
   * waits on it, which is the one place in this flow where a spinner is honest:
   * there is nothing else to show, and nothing is being asked in the meantime.
   */
  useEffect(() => {
    let live = true;
    fetch(`/api/leads?flow=availability_preview&slug=${encodeURIComponent(program.slug)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((payload: { slots?: Slot[] }) => {
        if (live) setSlots(payload.slots ?? []);
      })
      .catch(() => {
        if (live) setSlots([]);
      })
      .finally(() => {
        if (live) setSlotsLoading(false);
      });
    return () => {
      live = false;
    };
  }, [program.slug]);

  /** Address autocomplete — the same debounce and the same endpoint as before. */
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
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      try {
        const r = await fetch(`/api/leads?flow=address_suggest&q=${encodeURIComponent(q)}`);
        setSuggestions((await r.json()).suggestions ?? []);
      } catch {
        setSuggestions([]);
      }
    }, 250);
    return () => window.clearTimeout(timer.current);
  }, [addressText]);

  /** Open days in order, each with its remaining times. */
  const days = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const s of slots) map.set(s.date, [...(map.get(s.date) ?? []), s.time]);
    return [...map.entries()].slice(0, 7);
  }, [slots]);

  /**
   * The soonest open day, selected the moment the times arrive.
   *
   * This is the bug the brief calls out: the first day rendered as selected
   * while the panel below it stayed empty until something was tapped, which
   * reads as a calendar that is broken rather than one that is waiting. The
   * opening state is now the first day active AND its times on screen.
   */
  useEffect(() => {
    if (days.length === 0) return;
    setDay((current) => (current && days.some(([d]) => d === current) ? current : days[0][0]));
  }, [days]);

  const timesForDay = days.find(([d]) => d === day)?.[1] ?? [];

  const goToProject = () => {
    setPhase('project');
    trackStep('ConsultationStepProject');
  };

  const goToLockIn = () => {
    setPhase('lock');
    trackStep('ConsultationStepLockIn');
  };

  /**
   * Hold the slot: create the lead, then book the chosen time.
   *
   * Two calls rather than one because they are the two the backend already has,
   * and neither is changed here. The homeowner sees one button.
   */
  const confirm = async () => {
    if (busy || !chosen) return;
    setBusy(true);
    setError('');
    const leadEventId = newEventId();
    try {
      const submitRes = await fetch('/api/leads?flow=submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: leadEventId,
          pageUrl: window.location.href,
          programSlug: program.slug,
          name: contact.name,
          phone: contact.phone,
          email: '',
          placeId,
          addressText: addressText.trim(),
          sourceDetail: trafficSource,
          notes:
            !placeId && addressText.trim()
              ? `Typed address (not confirmed): ${addressText.trim()}`
              : '',
          answers,
        }),
      });
      const submitted = await submitRes.json();
      if (!submitRes.ok) throw new Error(submitted?.error ?? 'Something went wrong.');
      setLeadRef(submitted.leadRef);
      trackEvent(
        'Lead',
        { content_name: program.slug, content_category: 'consultation', status: submitted.outcome },
        leadEventId
      );

      // Should not happen on this program — it books without a verified address
      // — but a homeowner who has already picked a time must never be dropped
      // silently if it ever does.
      if (!submitted.offersCalendar) {
        setPhase('no_calendar');
        return;
      }

      const bookEventId = newEventId();
      const bookRes = await fetch('/api/leads?flow=book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadRef: submitted.leadRef,
          date: chosen.date,
          time: chosen.time,
          eventId: bookEventId,
          pageUrl: window.location.href,
        }),
      });
      const booked = await bookRes.json();
      if (bookRes.status === 409 && booked?.code === 'SLOT_UNAVAILABLE') {
        // The preview calendar could not know about the property, so a slot can
        // legitimately disappear between choosing it and booking it. Send them
        // back to the times with the server's alternatives rather than to an
        // apology.
        setSlots(
          booked.alternatives?.length ? booked.alternatives : slots.filter((s) => s.time !== chosen.time)
        );
        setChosen(null);
        setPhase('time');
        setError('That time was just taken. Please choose another.');
        return;
      }
      if (!bookRes.ok) throw new Error(booked?.error ?? 'We could not complete the booking.');

      setRemote(booked.remoteConsultation === true);
      setBooking(booked);
      setPhase('booked');
      trackStep('ConsultationBooked');
      trackEvent('Schedule', { content_name: program.slug, content_category: 'consultation' }, bookEventId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  /**
   * The prep answers. Best-effort by design: the booking is already committed,
   * so a failure here is not something to show the homeowner — they would read
   * it as their appointment having failed.
   */
  const savePrep = async () => {
    setBusy(true);
    try {
      await fetch('/api/leads?flow=prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadRef, programSlug: program.slug, answers: prep }),
      });
    } catch {
      // Deliberately silent.
    } finally {
      setBusy(false);
      trackStep('ConsultationPrepSaved', { answered: Object.keys(prep).length });
      setPhase('done');
    }
  };

  const meeting = remote
    ? {
        line: `Virtual Consultation · ${program.visitMinutes} minutes`,
        detail:
          'Your city is outside our in-person visit area, so this one is done by video or phone. A specialist will contact you around your chosen time.',
      }
    : program.consultationMode === 'phone'
      ? {
          line: `Initial Consultation Call · ${program.visitMinutes} minutes`,
          detail: 'A specialist will call you at your scheduled time.',
        }
      : {
          line: `In-Person Site Visit · ${program.visitMinutes} minutes`,
          detail: 'A specialist will visit your property.',
        };

  const title = {
    time: 'Pick a time that suits you',
    project: 'What are you planning?',
    lock: 'Lock it in',
    booked: remote ? 'Your consultation is booked' : 'Your visit is booked',
    done: remote ? 'Your consultation is booked' : 'Your visit is booked',
    no_calendar: 'Thanks — we have your details',
  }[phase];

  const stepIndex = { time: 1, project: 2, lock: 3, booked: 4, done: 4, no_calendar: 4 }[phase];

  // No Back on the calendar: it is the first screen, and a Back button that
  // leaves the site is worse than none.
  const back =
    phase === 'project' ? () => setPhase('time') : phase === 'lock' ? () => setPhase('project') : undefined;

  const projectLabel =
    projectQuestion?.options.find((o) => o.value === answers.projectType)?.label ?? 'Basement project';

  return (
    <Shell title={title} step={stepIndex} totalSteps={TOTAL_STEPS} onBack={back}>
      <Helmet>
        <title>{program.pageTitle ?? `${program.areaLabel} Consultation | OntarioReno`}</title>
      </Helmet>

      {/* ── 1. The calendar — the screen this page opens on ── */}
      {phase === 'time' && (
        <div className="space-y-4 text-left">
          <p className="text-sm font-bold text-[#1B3C6C]">{meeting.line}</p>

          {slotsLoading ? (
            <div className="py-10 text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#1B3C6C]" />
            </div>
          ) : days.length === 0 ? (
            <p className="text-slate-600">
              No times are free right now — leave your details and we’ll call to arrange one.
            </p>
          ) : (
            <>
              {/* The day row scrolls sideways, and has to LOOK like it does. The
                  right-hand fade leaves the next day half-visible at the edge,
                  which is the only reliable signal on a phone that there is more
                  than what fits. */}
              <div className="relative -mx-1">
                <div className="scroll-subtle flex gap-2 overflow-x-auto px-1 pb-1 pr-8">
                  {days.map(([date, times]) => {
                    const on = date === day;
                    const scarce = times.length <= 3;
                    return (
                      <button
                        key={date}
                        type="button"
                        onClick={() => setDay(date)}
                        className={`w-[5.25rem] shrink-0 rounded-xl border-2 px-2 py-2.5 text-center transition ${
                          on
                            ? 'border-[#1B3C6C] bg-[#1B3C6C] text-white'
                            : 'border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        <span className="block text-[11px] font-bold uppercase tracking-wide opacity-80">
                          {dayPart(date, { weekday: 'short' })}
                        </span>
                        <span className="block text-lg font-black leading-tight">
                          {dayPart(date, { day: 'numeric' })}
                        </span>
                        <span className="block text-[11px] font-bold uppercase tracking-wide opacity-80">
                          {dayPart(date, { month: 'short' })}
                        </span>
                        <span
                          className={`mt-1 block text-[10px] font-bold ${
                            on ? 'text-white/80' : scarce ? 'text-amber-600' : 'text-slate-400'
                          }`}
                        >
                          {times.length} left
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {timesForDay.map((time) => {
                  const on = chosen?.date === day && chosen?.time === time;
                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setChosen({ date: day, time })}
                      className={`rounded-lg border-2 px-3 py-3 text-sm font-bold transition ${
                        on
                          ? 'border-[#1B3C6C] bg-[#1B3C6C] text-white'
                          : 'border-slate-200 text-slate-700 hover:border-[#1B3C6C]'
                      }`}
                    >
                      {fmtTime(time)}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {error && <ErrorNote>{error}</ErrorNote>}
          <PrimaryButton
            disabled={!chosen}
            onClick={() => {
              setError('');
              goToProject();
            }}
          >
            {chosen ? `Continue with ${fmtTime(chosen.time)}` : 'Choose a time'}
          </PrimaryButton>
        </div>
      )}

      {/* ── 2. Project type ── */}
      {phase === 'project' && projectQuestion && (
        <div className="space-y-4 text-left">
          <div className="grid gap-2">
            {projectQuestion.options.map((o) => {
              const on = answers.projectType === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    setAnswers({ ...answers, projectType: o.value });
                    // The pause is the point: a tap that both selects and
                    // navigates with no visible acknowledgement reads as the
                    // page having jumped on its own.
                    window.setTimeout(goToLockIn, 180);
                  }}
                  className={`flex items-center justify-between rounded-xl border-2 px-4 py-4 text-left text-sm font-bold transition ${
                    on
                      ? 'border-[#1B3C6C] bg-[#f2f7ff] text-[#1B3C6C]'
                      : 'border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {o.label}
                  {on ? <Check className="h-4 w-4" /> : <ChevronRight className="h-4 w-4 text-slate-300" />}
                </button>
              );
            })}
          </div>
          <p className="text-center text-xs text-slate-500">
            Last question before we hold your time.
          </p>
        </div>
      )}

      {/* ── 3. Name + mobile, address optional ── */}
      {phase === 'lock' && (
        <form
          className="space-y-5 text-left"
          onSubmit={(e) => {
            e.preventDefault();
            void confirm();
          }}
        >
          {chosen && (
            <p className="rounded-xl bg-[#f2f7ff] px-4 py-3 text-sm font-bold text-[#1B3C6C]">
              {fmtDate(chosen.date)} at {fmtTime(chosen.time)}
            </p>
          )}
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Your name</label>
            <input
              className={inputCls}
              required
              value={contact.name}
              onChange={(e) => setContact({ ...contact, name: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Mobile number</label>
            <input
              className={inputCls}
              type="tel"
              inputMode="tel"
              required
              value={contact.phone}
              onChange={(e) => setContact({ ...contact, phone: e.target.value })}
            />
          </div>

          {/* The address keeps its autocomplete for anyone who wants it, and
              accepts anything typed for everyone else. It does not gate this
              form: the server resolves what it can, and an address it cannot
              parse flags the lead for a rep rather than throwing away a booking
              somebody has already chosen a time for. */}
          <div className="relative">
            <label className="mb-2 block text-sm font-bold text-slate-700">
              <MapPin className="mr-1 inline h-4 w-4 text-[#1B3C6C]" /> Property address{' '}
              <span className="font-normal text-slate-400">(optional, helps us prep)</span>
            </label>
            <input
              className={inputCls}
              value={addressText}
              autoComplete="off"
              placeholder="Start typing — or write it however you like"
              onChange={(e) => {
                setAddressText(e.target.value);
                setPlaceId('');
              }}
              // Suggestions are chosen on mousedown, which fires before blur, so
              // dismissing here cannot steal a pick the homeowner was making.
              onBlur={() => setSuggestions([])}
            />
            {placeId && (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <Check className="h-3.5 w-3.5" /> Address confirmed
              </p>
            )}
            {suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                {suggestions.map((s) => (
                  <button
                    key={s.placeId}
                    type="button"
                    onMouseDown={() => {
                      skipSuggest.current = true;
                      setAddressText(s.description);
                      setPlaceId(s.placeId);
                      setSuggestions([]);
                    }}
                    className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-[#f6faff]"
                  >
                    {s.description}
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && <ErrorNote>{error}</ErrorNote>}
          <PrimaryButton disabled={busy || !contact.name.trim() || !phoneOk(contact.phone)} type="submit">
            {busy ? 'Confirming…' : 'Confirm my consultation'}
          </PrimaryButton>
          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
            <Lock className="h-3.5 w-3.5 shrink-0" />
            100% free &amp; confidential.{program.smsEnabled ? ' Reply STOP anytime.' : ''}
          </p>
        </form>
      )}

      {/* ── 4. Booked, then the optional prep ── */}
      {(phase === 'booked' || phase === 'done') && booking && (
        <>
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-7 w-7 text-green-600" />
          </div>
          <p className="text-xl font-black text-slate-900">{fmtDate(booking.date)}</p>
          <p className="text-lg font-bold text-[#1B3C6C]">{fmtTime(booking.time)}</p>
          <p className="mt-2 text-sm font-bold uppercase tracking-wide text-slate-500">{meeting.line}</p>
          <p className="mt-3 text-slate-600">{meeting.detail}</p>
          <div className="mt-4 space-y-0.5 text-sm text-slate-500">
            <p className="font-bold text-slate-700">{projectLabel}</p>
            <p>We’ll text {contact.phone}</p>
            <p className="font-semibold">Reference {booking.publicReference}</p>
          </div>

          <AddToCalendar
            event={{
              title: remote
                ? `OntarioReno - ${program.areaLabel} Virtual Consultation`
                : `OntarioReno - ${program.areaLabel} Consultation`,
              // A calendar entry with the property as its location reads as
              // "be here" — wrong for a call the specialist places.
              location: remote ? '' : booking.propertyAddress || addressText,
              description: `${program.visitMinutes}-minute consultation with an OntarioReno specialist. Reference: ${booking.publicReference}`,
              date: booking.date,
              time: booking.time,
              durationMinutes: program.visitMinutes,
            }}
            uid={booking.publicReference}
          />

          {phase === 'booked' && program.prepQuestions.length > 0 && (
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/70 p-5 text-left">
              <p className="text-sm font-black text-slate-800">Two optional questions</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Your visit is already booked. These just let your consultant arrive prepared — skip
                them if you’d rather.
              </p>
              <div className="mt-4 space-y-5">
                {program.prepQuestions.map((q) => (
                  <div key={q.key}>
                    <Choice
                      question={q}
                      value={prep[q.key]}
                      onPick={(v) => setPrep({ ...prep, [q.key]: v })}
                    />
                    {/* The financing detail lives here and nowhere earlier. It
                        is helper text under the question it belongs to, on a
                        screen where the visit is already secured — not a pitch
                        standing between somebody and the calendar. */}
                    {q.key === 'contribution' && program.displayAmountLabel && (
                      <p className="mt-2 text-xs leading-relaxed text-slate-500">
                        Monthly plans {program.displayAmountLabel}, no upfront cost, and 6 months with
                        no payments and no interest — on approved credit.
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-5 space-y-2">
                <PrimaryButton
                  disabled={busy || Object.keys(prep).length === 0}
                  onClick={() => void savePrep()}
                >
                  {busy ? 'Saving…' : 'Save & finish'}
                </PrimaryButton>
                <button
                  type="button"
                  onClick={() => {
                    trackStep('ConsultationPrepSkipped');
                    setPhase('done');
                  }}
                  className="w-full rounded-xl py-3 text-sm font-bold text-slate-500 transition hover:text-slate-700"
                >
                  Skip — I’m all set
                </button>
              </div>
            </div>
          )}

          {phase === 'done' && (
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/70 p-5 text-left">
              <p className="mb-3 text-sm font-black text-slate-800">What happens next?</p>
              <ul className="space-y-3">
                {[
                  [
                    'Confirmation sent:',
                    program.smsEnabled
                      ? 'Check your texts for the booking details.'
                      : 'We’ll be in touch with the booking details.',
                  ],
                  ['Before the visit:', 'Our team reviews your property so the consultant arrives prepared.'],
                  [
                    remote ? 'Your consultation:' : 'Your visit:',
                    remote
                      ? 'A specialist will contact you around the scheduled time.'
                      : 'A specialist will arrive at the scheduled time.',
                  ],
                ].map(([bold, rest]) => (
                  <li key={bold} className="flex gap-2.5 text-sm leading-relaxed text-slate-600">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>
                      <span className="font-bold text-slate-800">{bold}</span> {rest}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {phase === 'no_calendar' && (
        <p className="text-slate-600">A specialist will review your details and call you shortly.</p>
      )}
    </Shell>
  );
}
