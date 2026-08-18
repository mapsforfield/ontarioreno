import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, BookOpen, CalendarDays, Check, CheckCircle2, ChevronDown, ChevronRight, Loader2, Lock, MapPin } from 'lucide-react';
import { testingModeEnabled } from '../../lib/app-config';
import { buildIcs, googleCalendarUrl, outlookCalendarUrl, type CalendarEvent } from '../../lib/calendar-links';
import { newEventId, trackCustom, trackEvent } from '../lib/pixel';
import { BASEMENT_FINANCING_OFFER } from '../lib/programClosures';

// Public homeowner journey — progressive, one decision per screen.
//
// The screens are driven by each question's `step`, so the order is the
// program's to decide, not this file's. Two shapes exist today:
//
//   addressPlacement 'first' (every grant flow)
//     1  Address + ownership
//     2  Project type + timing
//     3  Funding explanation + contribution
//     4  Contact
//
//   addressPlacement 'final' (the financing flows)
//     1  Project type + permit
//     2  Funding explanation + contribution
//     3  Address + ownership + contact, on one screen
//
// The address moved because it was the costliest question we had: a stranger who
// has just clicked an ad is asked for their home address before anything of
// value has been established, and the ones who push through it frequently pick a
// suggestion carrying no street number. Everything before it now earns it.
//
// An empty step is skipped rather than rendered blank, so a program can leave a
// step number unused without a dead screen appearing.
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

/** Mirrors lib/program-config.ts — shaped by the server, never built here. */
type FundingGuidance = {
  heading: string;
  lead: string;
  leadEmphasis: string;
  milestones: string[];
  highlight: string;
  closing: string;
  continueLabel: string;
};

type Program = {
  key: string;
  slug: string;
  areaLabel: string;
  enabled: boolean;
  /** Present only when the intake closed, as opposed to not having opened yet. */
  closure: { program: string; shortName: string; city: string; reason: string; sourceUrl: string; confirmedOn: string } | null;
  displayAmountLabel: string;
  fundingHighlights: string[];
  programTerms: string[];
  whyFreeText: string;
  fundingGuidance: FundingGuidance;
  questions: Question[];
  visitMinutes: number;
  consultationMode: 'in_person' | 'phone';
  pageTitle: string | null;
  fundingStepHeading: string | null;
  /** Where the address is asked. Absent on an older payload ⇒ 'first'. */
  addressPlacement?: 'first' | 'final';
  guideUrl: string;
  guideLabel: string;
  /** False until a Twilio adapter is configured — copy adapts rather than lying. */
  smsEnabled: boolean;
};

type Outcome = 'DIRECT_CALENDAR' | 'MANUAL_REVIEW' | 'NURTURE' | 'DECLINE';
type Slot = { date: string; time: string };
type Phase = 'q1' | 'q2' | 'q3' | 'funding' | 'contact' | 'calendar' | 'result' | 'closed';

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
  WANTS_FINANCING: 'Wants to discuss financing (noted for the specialist — not a barrier).',
  NEEDS_FUNDING_GUIDANCE: 'Answered “Not sure yet” on funding and read the guidance screen (noted for the specialist — not a barrier).',
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
  const [searchParams] = useSearchParams();

  /**
   * Where this homeowner came from, for attribution — `?src=sms`, or the usual
   * utm_* / fbclid an ad platform appends. Captured on first paint so it
   * survives the multi-step flow, and recorded on the lead.
   */
  const trafficSource = useMemo(() => {
    const src = searchParams.get('src');
    if (src) return src.slice(0, 60);
    const utm = searchParams.get('utm_source');
    const medium = searchParams.get('utm_medium');
    if (utm) return [utm, medium].filter(Boolean).join('/').slice(0, 60);
    if (searchParams.get('fbclid')) return 'meta';
    return '';
    // Read once — later steps must not lose it if the URL is cleaned up.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  // The one address the typed text could mean, offered for a yes/no when no
  // suggestion was picked. Tapping the dropdown remains the primary path; this
  // only catches the homeowner who did not realise the tap was required.
  const [candidate, setCandidate] = useState<{ placeId: string; description: string } | null>(null);
  const [checkingAddress, setCheckingAddress] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [contact, setContact] = useState({ name: '', phone: '', email: '' });
  const [termsOpen, setTermsOpen] = useState(false);

  const [leadRef, setLeadRef] = useState('');
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [reasons, setReasons] = useState<string[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  // Server's answer, never the browser's guess: whether this property is close
  // enough to drive to is a business rule, and the page only renders it.
  const [remote, setRemote] = useState(false);
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
        // Top of the funnel for this landing page. Custom rather than standard
        // so it can seed a retargeting audience without polluting Lead volume.
        if (p.enabled) trackCustom('ConsultationStart', { slug: p.slug });
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

  /**
   * Leaving step 1. If they picked a suggestion this is a plain advance.
   *
   * If they only typed, we ask the server what that text can mean and, when it
   * means exactly one address, show it for confirmation — a yes/no is something
   * anyone can do, whereas knowing that an unmentioned dropdown tap decides
   * whether you get a calendar is not. Anything else advances untouched and
   * lands in manual review exactly as before: the homeowner is never trapped on
   * this step, and a slow or failed lookup can only cost us the improvement, not
   * the submission.
   */
  const continueFromStep1 = async () => {
    if (placeId || candidate) { advancePast(1); return; }
    const q = addressText.trim();
    if (!q) return;
    // The list has done its job once they have moved on; leaving it open floats
    // it over the ownership choices and the confirmation card below.
    setSuggestions([]);
    setCheckingAddress(true);
    try {
      const r = await fetch(`/api/leads?flow=address_resolve&q=${encodeURIComponent(q)}`);
      const found = (await r.json())?.candidate ?? null;
      if (found?.placeId) return setCandidate(found);
    } catch {
      // Deliberately silent: this is an upgrade path, not a gate.
    } finally {
      setCheckingAddress(false);
    }
    advancePast(1);
  };

  const stepQuestions = (step: 1 | 2 | 3) => (program?.questions ?? []).filter((q) => q.step === step);
  const answered = (step: 1 | 2 | 3) => stepQuestions(step).every((q) => answers[q.key]);

  /** True when the address sits on the last screen rather than the first. */
  const addressLast = program?.addressPlacement === 'final';

  /**
   * The step carrying the funding explainer: wherever the contribution question
   * lives. Derived rather than hardcoded to step 3, so moving that question
   * between programs cannot separate it from the screen that explains it.
   */
  const fundingStep = (program?.questions ?? []).find((q) => q.key === 'contribution')?.step ?? 3;

  /**
   * Question steps this program actually uses, in order. A step with no
   * questions is skipped — an empty screen with a Continue button reads as a
   * bug and lengthens the progress bar for nothing.
   */
  const activeSteps = ([1, 2, 3] as const).filter(
    (s) => stepQuestions(s).length > 0 || (!addressLast && s === 1)
  );
  const lastStep = activeSteps[activeSteps.length - 1] ?? 3;

  /**
   * Funnel instrumentation.
   *
   * `ConsultationStart` (page load) and `Lead` (accepted submission) were the
   * only two events, which showed how many arrived and how many finished and
   * nothing whatsoever about where the rest went. One custom event per screen
   * completed turns that into an actual funnel in Ads Manager.
   *
   * Custom rather than standard events throughout: these must never be
   * mistaken for conversions or Meta will optimise toward people who browse
   * the form rather than people who book.
   */
  const trackedSteps = useRef(new Set<string>());
  const trackStep = (name: string, params?: Record<string, unknown>) => {
    // Once per session per screen. Going Back and forward again is the same
    // homeowner on the same visit, and counting it twice would overstate the
    // step and understate the drop to the next one.
    if (trackedSteps.current.has(name)) return;
    trackedSteps.current.add(name);
    trackCustom(name, { slug: program?.slug, ...params });
  };

  /** Advance to the next question step, or to contact when there are none left. */
  const goToStepAfter = (step: 1 | 2 | 3) => {
    trackStep(`ConsultationStep${step}`, {
      // What they chose on this screen, so a drop-off can be read against an
      // answer rather than only against a position in the flow.
      ...Object.fromEntries(stepQuestions(step).map((q) => [q.key, answers[q.key]])),
    });
    // "Not sure" earns the funding explainer before moving on. Checked BEFORE
    // the next step is resolved: on the grant flows the funding question is the
    // LAST one, so resolving first would skip the explainer entirely.
    if (step === fundingStep && answers.contribution === 'unsure') {
      setPhase('funding');
      return;
    }
    advancePast(step);
  };

  /** The screen after `step`, with no explainer in between. */
  const advancePast = (step: 1 | 2 | 3) => {
    // Also tracked here, not only in goToStepAfter: the address step advances
    // through its own confirmation path and would otherwise never be counted.
    // trackStep is idempotent, so the double call costs nothing.
    trackStep(`ConsultationStep${step}`, {
      ...Object.fromEntries(stepQuestions(step).map((q) => [q.key, answers[q.key]])),
    });
    const next = activeSteps.find((s) => s > step);
    if (next === undefined) {
      setPhase('contact');
      trackStep('ConsultationContactReached');
      return;
    }
    // When the address is asked last, the final question screen IS the contact
    // screen — reaching it is reaching the contact form.
    if (addressLast && next === lastStep) trackStep('ConsultationContactReached');
    setPhase(next === 1 ? 'q1' : next === 2 ? 'q2' : 'q3');
  };

  const submit = async (finalContact: typeof contact) => {
    if (!program) return;
    setBusy(true);
    setError('');
    // One id for both copies of this conversion — sent to the server, and
    // passed to the pixel below. See lib/meta-capi.ts.
    const eventId = newEventId();
    try {
      const r = await fetch('/api/leads?flow=submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          pageUrl: window.location.href,
          programSlug: program.slug,
          name: finalContact.name,
          phone: finalContact.phone,
          email: finalContact.email,
          placeId,
          // Sent so the server can make the same single-match attempt even if
          // the confirmation step never ran — a dropped request or a homeowner
          // who skipped past it must not silently cost the booking.
          addressText: addressText.trim(),
          sourceDetail: trafficSource,
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
      // The ad's conversion event: the homeowner is now a lead. Fired once the
      // server accepted the submission, so Meta never optimises toward a form
      // post that failed. The outcome is passed through so a campaign can be
      // read against qualified vs unqualified traffic.
      trackEvent(
        'Lead',
        { content_name: program.slug, content_category: 'consultation', status: j.outcome },
        eventId
      );
      if (j.offersCalendar) {
        const av = await (await fetch(`/api/leads?flow=availability&leadRef=${encodeURIComponent(j.leadRef)}`)).json();
        setSlots(av.slots ?? []);
        setRemote(av.remoteConsultation === true);
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
    const eventId = newEventId();
    try {
      const r = await fetch('/api/leads?flow=book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadRef,
          date: chosen.date,
          time: chosen.time,
          eventId,
          pageUrl: window.location.href,
        }),
      });
      const j = await r.json();
      if (r.status === 409 && j?.code === 'SLOT_UNAVAILABLE') {
        setError('That time was just taken. Please choose another.');
        setSlots(j.alternatives?.length ? j.alternatives : slots.filter((s) => s.time !== chosen.time));
        setChosen(null);
        return;
      }
      if (!r.ok) throw new Error(j?.error ?? 'We could not complete the booking.');
      // The server decides again at booking time; trust that over what the
      // availability call said, so the confirmation can never disagree with
      // the appointment that was actually written.
      setRemote(j.remoteConsultation === true);
      setBooking(j);
      setPhase('result');
      // Stronger than Lead — a booked consultation. Useful as the optimisation
      // event once the pixel has enough volume to learn on it.
      trackEvent(
        'Schedule',
        { content_name: program?.slug ?? '', content_category: 'consultation' },
        eventId
      );
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
    // A program that CLOSED and one that has not opened yet both stop here, but
    // they owe the reader different things. Someone who arrived from an ad for a
    // grant that has since run out needs to be told that plainly, and then given
    // somewhere to go — dead-ending them is what loses the lead we already paid
    // for. Where they go is the basement financing consultation rather than the
    // grants index: they came here to get a basement built, and an open offer
    // with no upfront cost answers that, where a list of other cities' programs
    // just restarts their search. The "not yet" wording below is unchanged for
    // programs like Simcoe.
    return (
      <Shell title={`${program.areaLabel} consultations`}>
        {program.closure ? (
          <div className="text-left">
            {/* Short, for the same reason as ProgramClosedNotice: the offer
                below is the useful part, and it has to be visible without a
                scroll. The official wording stays one tap away. */}
            <p className="font-bold text-slate-900">{program.closure.shortName} is closed.</p>
            <details className="group mt-2">
              <summary className="cursor-pointer list-none text-sm font-bold text-slate-500 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-700">
                Why it closed
              </summary>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {program.closure.program}: {program.closure.reason}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Confirmed {program.closure.confirmedOn} against the{' '}
                <a
                  href={program.closure.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-slate-700"
                >
                  City of {program.closure.city} program page
                </a>
                .
              </p>
            </details>
            {/* If the basement offer itself ever closes, this screen must not
                send someone back to the page they are standing on. */}
            {program.slug === 'basement' ? (
              <p className="mt-4 text-slate-600">
                We can still help you plan the build — reach out and we&apos;ll go through
                your options.
              </p>
            ) : (
              <>
                <div className="mt-4 rounded-xl bg-slate-50 p-4">
                  <p className="font-extrabold leading-snug text-slate-900">
                    {BASEMENT_FINANCING_OFFER.heading}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {BASEMENT_FINANCING_OFFER.shortBody}
                  </p>
                </div>
                <Link
                  to={BASEMENT_FINANCING_OFFER.href}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#1B3C6C] px-5 py-3 font-bold text-white transition hover:bg-[#16325a]"
                >
                  {BASEMENT_FINANCING_OFFER.ctaLabel} <ChevronRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>
        ) : (
          <p className="text-slate-600">We aren’t taking online bookings for {program.areaLabel} yet.</p>
        )}
      </Shell>
    );
  }

  // The funding explainer shares step 3's marker: it is the same step of the
  // journey, not a new one, and a progress bar that grows for reading a screen
  // makes the flow feel longer than it is.
  // Positions in the bar, derived from the steps this program actually uses so
  // a skipped step does not leave a segment that never fills. The funding
  // explainer shares its question's marker: it is the same step of the journey,
  // not a new one, and a bar that grows for reading a screen makes the flow feel
  // longer than it is.
  const stepPos = (s: 1 | 2 | 3) => activeSteps.indexOf(s) + 1;
  // Contact is its own position only when it is its own screen.
  const contactPos = addressLast ? activeSteps.length : activeSteps.length + 1;
  const totalSteps = contactPos + 1; // + the calendar
  const stepIndex = {
    q1: stepPos(1), q2: stepPos(2), q3: stepPos(3),
    funding: stepPos(fundingStep as 1 | 2 | 3),
    contact: contactPos,
    calendar: totalSteps, result: totalSteps, closed: 0,
  }[phase];

  // What the homeowner is actually booking — stated the same way on the calendar
  // and the confirmation so there is no ambiguity about who goes where.
  //
  // A property outside the drive radius overrides the program's own mode: the
  // grant or the financing is the same offer either way, but nobody is getting
  // in a van for it, and a homeowner told "a specialist will visit your
  // property" clears an afternoon for a doorbell that never rings.
  const meeting =
    remote
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
          booking ? (remote ? 'Your consultation is booked' : 'Your visit is booked')
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
                title: remote
                  ? `OntarioReno - ${program.areaLabel} Virtual Consultation`
                  : `OntarioReno - ${program.areaLabel} ADU Site Visit`,
                // A calendar entry with the property as its location reads as
                // "be here" — wrong for a call the specialist places.
                location: remote ? '' : booking.propertyAddress || addressText,
                description: remote
                  ? `${program.visitMinutes}-minute virtual consultation about ${booking.propertyAddress || addressText} with an OntarioReno specialist, by video or phone. Reference: ${booking.publicReference}`
                  : `${program.visitMinutes}-minute ${
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
                  ['Confirmation Sent:', program.smsEnabled
                    ? 'Check your SMS & email for booking details.'
                    : 'Check your email for booking details.'],
                  remote
                    ? ['Property Review:', 'Our team will perform a preliminary property assessment before the call.']
                    : ['Zoning Review:', 'Our team will perform a preliminary property assessment prior to arrival.'],
                  remote
                    // Says "around" deliberately. The specialist fits these
                    // between in-person visits, and promising a call to the
                    // minute is a promise the day will not always keep.
                    ? ['Virtual Consultation:', `A specialist will contact you around the scheduled time to go through ${booking.propertyAddress || addressText}.`]
                    : ['Site Visit:', `A specialist will arrive at ${booking.propertyAddress || addressText} at the scheduled time.`],
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
      <Shell title="Pick a time that suits you" step={stepIndex} totalSteps={totalSteps}>
        <p className="mb-2 text-sm font-bold text-[#1B3C6C]">{meeting.line}</p>
        {/* Said BEFORE they pick, not after they have booked. Someone choosing a
            time believing a specialist is driving out has been misled by the
            time the confirmation corrects them. */}
        {remote && (
          <p className="mb-5 rounded-xl border border-[#1B3C6C]/20 bg-[#e8f1fb] p-3 text-left text-sm text-slate-700">
            {meeting.detail}
          </p>
        )}
        {!remote && <div className="mb-5" />}
        {byDate.length === 0 && <p className="text-slate-600">No times are free right now — we’ll call to arrange one.</p>}
        {/* Every day, in one place — but scrolling inside its own frame rather
            than stretching the page. The card keeps a fixed height, so the
            confirm button stays in view instead of sitting two screens down. */}
        <div className="relative">
          <div className="max-h-[52vh] space-y-3 overflow-y-auto overscroll-contain pr-1 text-left sm:max-h-[26rem]">
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
          {/* Softens the cut-off edge so it reads as "more below", not as a
              list that happens to end mid-card. */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent" />
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
  // "Not sure yet" earns one extra screen — the funding explainer — before the
  // contact form. It is a read-and-continue step, never a second question.
  const needsFundingGuidance = answers.contribution === 'unsure';
  /** The screen before `step`, mirroring advancePast. */
  const stepBefore = (step: 1 | 2 | 3) => {
    const prior = [...activeSteps].reverse().find((s) => s < step);
    return prior === 1 ? 'q1' : prior === 2 ? 'q2' : 'q3';
  };
  const back = () => {
    if (phase === 'contact') return setPhase(needsFundingGuidance ? 'funding' : stepBefore(4 as 3));
    if (phase === 'funding') return setPhase(fundingStep === 1 ? 'q1' : fundingStep === 2 ? 'q2' : 'q3');
    if (phase === 'q3') return setPhase(needsFundingGuidance && fundingStep < 3 ? 'funding' : stepBefore(3));
    if (phase === 'q2') return setPhase(stepBefore(2));
    return setPhase('q1');
  };

  /**
   * The address field. One implementation, rendered either on the first screen
   * or the last — a second copy would be two things to keep in step, and the
   * Places wiring is the part that must not drift.
   */
  const addressField = (
    <div className="relative">
      <label className="mb-2 block text-sm font-bold text-slate-700">
        <MapPin className="mr-1 inline h-4 w-4 text-[#1B3C6C]" /> Property address
      </label>
      <input className={inputCls} value={addressText} autoComplete="off" placeholder="Start typing, then pick your address"
        onChange={(e) => { setAddressText(e.target.value); setPlaceId(''); setCandidate(null); }}
        // Suggestions are chosen on mousedown, which fires before blur, so
        // dismissing here cannot steal a pick the homeowner was making.
        onBlur={() => setSuggestions([])} />
      {placeId ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
          <Check className="h-3.5 w-3.5" /> Address confirmed
        </p>
      ) : addressText.trim().length > 2 ? (
        // Said here, at the point of failure, rather than four steps later
        // as an unexplained "a specialist will call you".
        <p className="mt-2 text-xs font-semibold text-amber-700">
          Pick your address from the list so we can check availability in your area.
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
  );

  /** Name, phone, email — the same three fields wherever the form ends. */
  const contactFields = (
    <>
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
    </>
  );

  const submitFooter = (
    <>
      {error && <ErrorNote>{error}</ErrorNote>}
      <PrimaryButton
        disabled={busy || !contact.name.trim() || !contact.phone.trim() || (addressLast && !addressText.trim())}
        type="submit"
      >
        {busy ? 'Checking availability…' : 'See available times'}
      </PrimaryButton>
      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
        <Lock className="h-3.5 w-3.5 shrink-0" />
        100% Free &amp; No-Obligation. Your information is kept strictly confidential.
      </p>
    </>
  );

  /** The funding explainer panel, shown on whichever step asks about paying. */
  const fundingPanel = (
    <>
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
      {/* The full program terms are no longer opened here. This screen decides
          whether to BOOK, not whether to sign, and the consultant walks the
          terms through in person before anything is signed. They remain in the
          program config and in the written quote — the qualifier that has to
          travel with the figure ("on approved credit") is in the first
          highlight above, on the same screen. */}
    </>
  );

  /**
   * The heading for the current screen. A question step takes its title from
   * its own content: the funding step from the program, the first question
   * otherwise — which is why moving the address off step 1 also moves "Let's
   * start with your property" off it.
   */
  const titleForStep = (step: 1 | 2 | 3): string => {
    if (step === fundingStep) {
      return program.fundingStepHeading ?? `How the ${program.areaLabel} funding works`;
    }
    if (step === 1 && !addressLast) return 'Let’s start with your property';
    if (addressLast && step === lastStep) return 'Where should we send your confirmation?';
    return stepQuestions(step)[0]?.label ?? 'A few quick questions';
  };
  const screenTitle =
    phase === 'funding'
      // The reassurance earns the page title here. Repeating it inside the card
      // under a functional heading gave the screen two titles and left the line
      // that matters at body weight.
      ? program.fundingGuidance.heading
      : phase === 'contact'
        ? 'Where should we send your confirmation?'
        : titleForStep(phase === 'q1' ? 1 : phase === 'q2' ? 2 : 3);

  /**
   * The last screen when the address is asked at the end: whatever questions
   * that step carries, then the address, then the contact details — one form,
   * one submit. Merged rather than left as two screens because it is the same
   * act (telling us who and where you are) and splitting it added a step to a
   * flow this change exists to shorten.
   */
  const mergedFinalScreen = (step: 1 | 2 | 3) => (
    <form className="space-y-5 text-left" onSubmit={(e) => { e.preventDefault(); void submit(contact); }}>
      {stepQuestions(step).map((q) => (
        <Choice key={q.key} question={q} value={answers[q.key]} onPick={(v) => setAnswers({ ...answers, [q.key]: v })} />
      ))}
      {addressField}
      {contactFields}
      {submitFooter}
    </form>
  );

  /** One question screen, plus the funding panel when this is that step. */
  const questionScreen = (step: 1 | 2 | 3) => (
    addressLast && step === lastStep ? mergedFinalScreen(step) :
    <div className="space-y-6 text-left">
      {step === fundingStep && fundingPanel}
      {step === 1 && !addressLast && addressField}
      {stepQuestions(step).map((q) => (
        <Choice key={q.key} question={q} value={answers[q.key]} onPick={(v) => setAnswers({ ...answers, [q.key]: v })} />
      ))}
      {step === 1 && !addressLast && candidate && (
        <div className="rounded-xl border border-[#1B3C6C]/25 bg-[#f6faff] p-4">
          <p className="text-sm font-semibold text-slate-700">Just to confirm — is this your property?</p>
          <p className="mt-1 text-base font-bold text-[#1B3C6C]">{candidate.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button"
              onClick={() => {
                skip.current = true;
                setAddressText(candidate.description);
                setPlaceId(candidate.placeId);
                setCandidate(null);
                setSuggestions([]);
                advancePast(1);
              }}
              className="rounded-lg bg-[#1B3C6C] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#16325a]">
              Yes, that’s it
            </button>
            <button type="button" onClick={() => setCandidate(null)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
              Let me fix it
            </button>
          </div>
        </div>
      )}
      <PrimaryButton
        disabled={
          !answered(step) ||
          (step === 1 && !addressLast && (!addressText.trim() || checkingAddress))
        }
        onClick={step === 1 && !addressLast ? continueFromStep1 : () => goToStepAfter(step)}
      >
        {step === 1 && !addressLast && checkingAddress ? 'Checking address…' : 'Continue'}
      </PrimaryButton>
    </div>
  );

  return (
    <Shell
      title={screenTitle}
      step={stepIndex}
      totalSteps={totalSteps}
      onBack={phase === 'q1' ? undefined : back}
    >
      <Helmet><title>{program.pageTitle ?? `${program.areaLabel} Secondary Suite Consultation | OntarioReno`}</title></Helmet>

      {phase === 'q1' && questionScreen(1)}

      {phase === 'q2' && questionScreen(2)}
      {phase === 'q3' && questionScreen(3)}

      {/* Funding guidance — shown only for "Not sure yet / Need guidance".
          One button, forward only: the homeowner is not being asked to judge
          whether they can fund the build. That is the consultant's job, in
          person, with the real numbers. */}
      {phase === 'funding' && (
        <div className="space-y-5 text-left">
          {/* The reassurance closes the paragraph in ordinary body type. Given its
              own line it read as a statement being made — isolation is emphasis at
              any size, and this line persuades by sounding matter-of-fact. It is
              nowrap so the two words that carry it can never split across lines. */}
          <p className="text-base leading-relaxed text-slate-700">
            {program.fundingGuidance.lead}{' '}
            <span className="whitespace-nowrap">{program.fundingGuidance.leadEmphasis}</span>
          </p>
          {/* Labels only, no figures. The last step is the emphasised one — the
              whole point of the strip is that the money sits at the end. Sized to
              keep every label on ONE line at card width: wrapped onto a second
              line it stops reading as a single sequence, which is all it does. */}
          {program.fundingGuidance.milestones.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1.5 rounded-xl border border-slate-200 px-3 py-3">
              {program.fundingGuidance.milestones.map((m, i, all) => (
                <span key={m} className="flex items-center gap-x-1">
                  <span
                    className={
                      i === all.length - 1
                        ? 'whitespace-nowrap text-[11px] font-bold uppercase leading-tight text-emerald-700'
                        : 'whitespace-nowrap text-[11px] font-semibold uppercase leading-tight text-slate-500'
                    }
                  >
                    {m}
                  </span>
                  {i < all.length - 1 && <ChevronRight className="h-3 w-3 shrink-0 text-slate-300" />}
                </span>
              ))}
            </div>
          )}
          {/* The screen's one focal point, in the same emerald the funding step
              uses for the grant amount — the solution should look like one. */}
          <p className="rounded-xl bg-emerald-50 px-4 py-3.5 text-base font-bold leading-relaxed text-emerald-800">
            {program.fundingGuidance.highlight}
          </p>
          <p className="text-sm leading-relaxed text-slate-500">{program.fundingGuidance.closing}</p>
          <PrimaryButton onClick={() => advancePast(fundingStep as 1 | 2 | 3)}>
            {program.fundingGuidance.continueLabel || 'Continue'}
          </PrimaryButton>
        </div>
      )}

      {/* Contact on its own screen — the shape the grant flows still use, where
          the address was already collected on step 1. */}
      {phase === 'contact' && (
        <form className="space-y-4 text-left" onSubmit={(e) => { e.preventDefault(); void submit(contact); }}>
          {contactFields}
          {submitFooter}
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

function Shell({ children, title, step, totalSteps = 5, onBack }: {
  children: React.ReactNode; title?: string; step?: number; totalSteps?: number; onBack?: () => void;
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
              {Array.from({ length: totalSteps }, (_, n) => n + 1).map((i) => (
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
