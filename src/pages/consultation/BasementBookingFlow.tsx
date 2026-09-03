import { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Lock,
  MapPin,
  X,
} from 'lucide-react';
import { newEventId, trackCustom, trackEvent } from '../../lib/pixel';
import { nearestSlots } from '../../../lib/slot-suggestions';
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
//   3  Name, mobile, address       the least we need to hold the slot
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
  const [prepIndex, setPrepIndex] = useState(0);
  const [contact, setContact] = useState({ name: '', phone: '' });

  const [addressText, setAddressText] = useState('');
  const [placeId, setPlaceId] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{ placeId: string; description: string }>>([]);

  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotGrid, setSlotGrid] = useState<{ startTimes: string[]; earliestWall: string } | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [day, setDay] = useState('');
  // A date chosen from the full-month view that sits past the seven days the
  // row shows on its own. The server offers a fortnight (bookingHorizonDays),
  // and the row used to render the first seven and drop the rest — so a
  // homeowner who could not do this week saw no way to look past it and had
  // nothing to do but leave.
  const [pickedFar, setPickedFar] = useState('');
  const [monthOpen, setMonthOpen] = useState(false);
  /** Which month the full view is showing, as 'YYYY-MM'. */
  const [monthCursor, setMonthCursor] = useState('');
  const [chosen, setChosen] = useState<Slot | null>(null);
  /**
   * The address-aware re-check, run on the details screen.
   *
   * 'idle'     nothing to check yet — no address, or no time chosen
   * 'checking' in flight; Confirm waits rather than booking on a stale answer
   * 'ok'       the chosen time survived the real check, or could not be located
   * 'moved'    it did not, and `swaps` holds the nearest times that did
   */
  const [recheck, setRecheck] = useState<'idle' | 'checking' | 'ok' | 'moved'>('idle');
  const [swaps, setSwaps] = useState<Slot[]>([]);
  /** True once a swap has been taken, so the chip can say what happened. */
  const [swapped, setSwapped] = useState(false);
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
      .then((payload: { slots?: Slot[]; slotGrid?: { startTimes: string[]; earliestWall: string } }) => {
        if (!live) return;
        setSlots(payload.slots ?? []);
        setSlotGrid(payload.slotGrid ?? null);
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

  /**
   * ── The address-aware re-check ──
   *
   * The calendar on screen 1 is computed before anyone has said where they
   * live, so it cannot apply the same-day travel rules and shows the widest
   * possible list. That was being read as a promise: a homeowner picked a time,
   * spent two more screens on it, and was told at the final press that the slot
   * had "just been taken" — when nothing had been taken. It was never reachable
   * from their property, and on a busy day neither was anything else.
   *
   * So the moment the address is known — one screen BEFORE the booking — we ask
   * again with it. A time that survives costs the homeowner nothing and they
   * never learn this ran. A time that does not is swapped here, with the
   * nearest real times one tap away, while they still have everything else
   * filled in.
   *
   * The answer is cached against the address so taking a suggestion re-validates
   * locally instead of spending another address lookup.
   */
  const locatedFor = useRef<{ key: string; slots: Slot[] } | null>(null);
  const recheckTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (phase !== 'lock' || !chosen) return;
    const typed = addressText.trim();
    // Not enough to look up yet. Confirm stays enabled: an address we cannot
    // check is not an address we refuse to book.
    if (!placeId && typed.length < 6) {
      setRecheck('idle');
      return;
    }
    const key = placeId || typed.toLowerCase();

    // Already answered for this address — validate the pick against it without
    // another round trip.
    const cached = locatedFor.current;
    if (cached && cached.key === key) {
      const free = cached.slots.some((s) => s.date === chosen.date && s.time === chosen.time);
      setSwaps(free ? [] : nearestSlots(cached.slots, chosen));
      setRecheck(free ? 'ok' : 'moved');
      return;
    }

    let live = true;
    setRecheck('checking');
    // A picked suggestion is final, so check it at once. Typed text is still
    // being edited, so wait for the typing to stop.
    const delay = placeId ? 0 : 700;
    window.clearTimeout(recheckTimer.current);
    recheckTimer.current = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ flow: 'availability_preview', slug: program.slug });
        if (placeId) params.set('placeId', placeId);
        if (typed) params.set('address', typed);
        const r = await fetch(`/api/leads?${params.toString()}`);
        if (!r.ok) throw new Error(String(r.status));
        const payload: { slots?: Slot[]; located?: boolean; slotGrid?: typeof slotGrid } =
          await r.json();
        if (!live) return;
        // Nothing could be resolved from what they typed, so this answer is no
        // better than the one we already had. Say nothing and let them book.
        if (!payload.located) {
          setRecheck('ok');
          return;
        }
        const real = payload.slots ?? [];
        locatedFor.current = { key, slots: real };
        // The calendar behind them is now the true one, so going Back shows
        // what can actually be booked rather than the wider guess.
        setSlots(real);
        if (payload.slotGrid) setSlotGrid(payload.slotGrid);
        const free = real.some((s) => s.date === chosen.date && s.time === chosen.time);
        setSwaps(free ? [] : nearestSlots(real, chosen));
        setRecheck(free ? 'ok' : 'moved');
        if (!free) trackStep('ConsultationSlotRecheckMoved');
      } catch {
        // Our check failed, not their booking. Fall through to Confirm, which
        // still re-checks server-side and handles a 409 properly.
        if (live) setRecheck('ok');
      }
    }, delay);

    return () => {
      live = false;
      window.clearTimeout(recheckTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, placeId, addressText, chosen?.date, chosen?.time, program.slug]);

  /** Take one of the offered times, in place, without leaving the screen. */
  const takeSwap = (slot: Slot) => {
    setChosen(slot);
    setDay(slot.date);
    setSwaps([]);
    setSwapped(true);
    setRecheck('ok');
    setError('');
    trackCustom('ConsultationSlotSwapped', { slug: program.slug });
  };

  /** Every open day in order, each with its remaining times. */
  const days = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const s of slots) map.set(s.date, [...(map.get(s.date) ?? []), s.time]);
    return [...map.entries()];
  }, [slots]);

  /**
   * The row: the next seven open days, plus a picked one from further out.
   *
   * Seven is what fits before the row stops being scannable. The rest of the
   * booking window is not paged behind an arrow — it is behind the card at the
   * end of the row, which opens the month. A date chosen there is appended
   * here, so it lands exactly where every other day sits and the reader carries
   * on with the times underneath as normal.
   */
  const DAYS_IN_ROW = 7;
  const rowDays = useMemo(() => {
    const head = days.slice(0, DAYS_IN_ROW);
    if (!pickedFar || head.some(([d]) => d === pickedFar)) return head;
    const far = days.find(([d]) => d === pickedFar);
    return far ? [...head, far] : head;
  }, [days, pickedFar]);

  /** True when there is anything past the seven the row already shows. */
  const hasMoreDates = days.length > DAYS_IN_ROW;

  /**
   * Choose a day, from the row or from the month.
   *
   * Clears the chosen TIME. A time belongs to the day it was picked on; keeping
   * it across a day change left the row highlighting one date while the button
   * underneath still offered to book another — which is a booking for a day the
   * homeowner was no longer looking at.
   */
  const selectDay = (date: string) => {
    setDay(date);
    setChosen(null);
    setError('');
  };

  // ── The full-month view ──
  //
  // Only ever a way to reach a date the row does not show. It offers exactly
  // what the row offers — the days the server said are open — so a date that
  // looks tappable here is a date that can actually be booked, and one that is
  // greyed out is genuinely full or outside the booking window. A month picker
  // that accepts a date we cannot honour is worse than no month picker.

  /** Open dates as a set, for the grid to test each cell against. */
  const openDates = useMemo(() => new Set(days.map(([d]) => d)), [days]);

  /** The months the booking window touches, in order, as 'YYYY-MM'. */
  const monthsWithDays = useMemo(() => {
    const seen: string[] = [];
    for (const [date] of days) {
      const m = date.slice(0, 7);
      if (!seen.includes(m)) seen.push(m);
    }
    return seen;
  }, [days]);

  const monthIndex = monthsWithDays.indexOf(monthCursor);

  /**
   * The cells of `monthCursor`, padded so the 1st lands under its weekday.
   * A null is a blank leading cell, not a date.
   */
  const monthCells = useMemo(() => {
    if (!monthCursor) return [];
    const year = Number(monthCursor.slice(0, 4));
    const month = Number(monthCursor.slice(5, 7));
    // Day 0 of the NEXT month is the last day of this one.
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const leading = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
    const cells: Array<string | null> = Array.from({ length: leading }, () => null);
    for (let d = 1; d <= daysInMonth; d += 1) {
      cells.push(`${monthCursor}-${String(d).padStart(2, '0')}`);
    }
    return cells;
  }, [monthCursor]);

  const openMonthView = () => {
    // Open on the month holding the first date the row does not already show —
    // the reader tapped this because they want to look further out, so starting
    // them on the week they just rejected would waste the tap.
    const firstBeyond = days[DAYS_IN_ROW]?.[0] ?? days[0]?.[0] ?? '';
    setMonthCursor(firstBeyond.slice(0, 7));
    setMonthOpen(true);
    trackStep('ConsultationCalendarMonthOpened');
  };

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

  const freeForDay = days.find(([d]) => d === day)?.[1] ?? [];

  /**
   * Every start we could offer on the selected day, free or not.
   *
   * Drawing only the free ones made a fully-booked afternoon look like a day
   * that ends at noon — a homeowner reads two times and assumes those are our
   * hours, rather than seeing that the rest went to somebody else. A taken slot
   * is worth more on the screen than off it.
   *
   * Starts below the lead-time floor are left out rather than marked taken.
   * They are in the past or too soon to book; calling them taken would overstate
   * how busy we are, which is a claim we do not get to make.
   *
   * Falls back to the free list alone if the server sent no grid, so an older
   * payload renders exactly as it did before rather than an empty day.
   */
  const timesForDay: Array<{ time: string; free: boolean }> = slotGrid
    ? slotGrid.startTimes
        .filter((time) => `${day}T${time}` >= slotGrid.earliestWall)
        .map((time) => ({ time, free: freeForDay.includes(time) }))
    : freeForDay.map((time) => ({ time, free: true }));

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
          // The ref from an earlier press, when there was one.
          //
          // This screen is reachable a second time by design: a slot that goes
          // while the homeowner is typing sends them back to the times with the
          // 409 handler below, and Confirm runs this whole function again. The
          // lead was already created on the first press, so without this the
          // second press created another one — which is how one homeowner ended
          // up as four rows in the Submissions log, three of them with no
          // appointment for a rep to chase.
          leadRef,
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
      // Held for the retry path above, and used immediately below for the
      // booking — state is not readable this soon after setting it.
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
        // The re-check above should have caught this already, so reaching here
        // means either a genuine race with another homeowner or an address we
        // could not resolve until submit did it. Either way the honest list is
        // the LEAD-KEYED one, which now exists — the old fallback filtered the
        // unlocated preview instead, and handed the homeowner a fresh set of
        // times that could fail for exactly the same reason, over and over.
        //
        // `alternatives` from the 409 is same-day only, so it is used as a
        // backstop rather than the answer.
        let real: Slot[] = [];
        try {
          const av = await fetch(
            `/api/leads?flow=availability&leadRef=${encodeURIComponent(submitted.leadRef)}`
          );
          if (av.ok) real = ((await av.json()).slots ?? []) as Slot[];
        } catch {
          // Falls through to the alternatives below.
        }
        if (real.length === 0) real = (booked.alternatives ?? []) as Slot[];

        setSlots(real);
        locatedFor.current = null;
        if (real.length > 0) {
          // Stay put and offer the swap, exactly as the earlier check does.
          // Sending them back to the calendar was a screen change charged for
          // something they did nothing wrong to cause.
          setSwaps(nearestSlots(real, chosen));
          setRecheck('moved');
          return;
        }
        setChosen(null);
        setPhase('time');
        setError('That time has just gone. Please choose another.');
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

  const prepQuestion = program.prepQuestions[prepIndex];

  /**
   * Record one prep answer and move on, saving after the last.
   *
   * Advancing on the tap rather than behind a Save button is the same gesture
   * the project-type screen uses, and it is what lets each question be shown at
   * full size without the card running off the bottom of a phone.
   */
  const answerPrep = (key: string, value: string) => {
    const next = { ...prep, [key]: value };
    setPrep(next);
    if (prepIndex + 1 < program.prepQuestions.length) {
      window.setTimeout(() => setPrepIndex((i) => i + 1), 180);
      return;
    }
    window.setTimeout(() => void savePrep(next), 180);
  };

  /**
   * The prep answers. Best-effort by design: the booking is already committed,
   * so a failure here is not something to show the homeowner — they would read
   * it as their appointment having failed.
   */
  const savePrep = async (answers: Record<string, string> = prep) => {
    setBusy(true);
    try {
      await fetch('/api/leads?flow=prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadRef, programSlug: program.slug, answers }),
      });
    } catch {
      // Deliberately silent.
    } finally {
      setBusy(false);
      trackStep('ConsultationPrepSaved', { answered: Object.keys(answers).length });
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
    <Shell
      title={title}
      step={stepIndex}
      totalSteps={TOTAL_STEPS}
      onBack={back}
      // The calendar screen only. It is the one someone lands on, and the
      // before/after is what makes the offer concrete before they have read a
      // word. On the later screens the same photo would just be height between
      // a homeowner and the field they are filling in.
      banner={
        phase === 'time'
          ? { src: '/images/banner.webp', alt: 'A basement mid-renovation: bare insulation on one side, finished living space on the other' }
          : undefined
      }
    >
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
                  {rowDays.map(([date, times]) => {
                    const on = date === day;
                    const scarce = times.length <= 3;
                    return (
                      <button
                        key={date}
                        type="button"
                        onClick={() => selectDay(date)}
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

                  {/* The way to every other date, sitting in the row as one
                      more card. It is the same shape and the same size as a
                      day, because it does the same job — it is where you go to
                      choose when. An arrow bolted underneath read as chrome;
                      this reads as the next thing along. */}
                  {hasMoreDates && (
                    <button
                      type="button"
                      onClick={openMonthView}
                      className="flex w-[5.25rem] shrink-0 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[#1B3C6C]/40 bg-[#f6faff] px-2 py-2.5 text-center text-[#1B3C6C] transition hover:border-[#1B3C6C]"
                    >
                      <CalendarDays className="h-5 w-5" />
                      <span className="text-[10px] font-black uppercase leading-tight tracking-wide">
                        See full calendar
                      </span>
                    </button>
                  )}
                </div>
                <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent" />
              </div>

              {/* The month, in place of the times.
                  It replaces them rather than floating over them: this is a
                  detour to choose a day, and leaving a half-visible list of the
                  old day's times underneath invites somebody to tap one. */}
              {monthOpen ? (
                <div className="rounded-xl border-2 border-slate-200 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setMonthCursor(monthsWithDays[monthIndex - 1])}
                      disabled={monthIndex <= 0}
                      aria-label="Previous month"
                      className="rounded-lg p-1.5 text-[#1B3C6C] transition hover:bg-[#f2f7ff] disabled:invisible"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <p className="text-sm font-black text-slate-800">
                      {new Date(`${monthCursor}-01T12:00:00`).toLocaleDateString('en-CA', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                    <button
                      type="button"
                      onClick={() => setMonthCursor(monthsWithDays[monthIndex + 1])}
                      disabled={monthIndex < 0 || monthIndex >= monthsWithDays.length - 1}
                      aria-label="Next month"
                      className="rounded-lg p-1.5 text-[#1B3C6C] transition hover:bg-[#f2f7ff] disabled:invisible"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="mb-1 grid grid-cols-7 gap-1">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                      <span
                        key={`${d}${i}`}
                        className="text-center text-[11px] font-bold uppercase text-slate-400"
                      >
                        {d}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {monthCells.map((date, i) => {
                      if (!date) return <span key={`pad${i}`} />;
                      const open = openDates.has(date);
                      return (
                        <button
                          key={date}
                          type="button"
                          disabled={!open}
                          onClick={() => {
                            selectDay(date);
                            // Only remembered when it is a date the row would
                            // not have shown anyway — otherwise the row would
                            // carry a duplicate of a card already in it.
                            setPickedFar(days.slice(0, DAYS_IN_ROW).some(([d]) => d === date) ? '' : date);
                            setMonthOpen(false);
                          }}
                          className={`aspect-square rounded-lg border-2 text-sm font-bold transition ${
                            open
                              ? date === day
                                ? 'border-[#1B3C6C] bg-[#1B3C6C] text-white'
                                : 'border-[#1B3C6C]/30 bg-white text-[#1B3C6C] hover:border-[#1B3C6C]'
                              : 'cursor-not-allowed border-transparent text-slate-300'
                          }`}
                        >
                          {Number(date.slice(8))}
                        </button>
                      );
                    })}
                  </div>

                  <p className="mt-2 text-center text-[11px] leading-relaxed text-slate-500">
                    Dates in blue have times open.
                  </p>
                  <button
                    type="button"
                    onClick={() => setMonthOpen(false)}
                    className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-bold text-slate-500 transition hover:text-slate-700"
                  >
                    <X className="h-4 w-4" /> Close
                  </button>
                </div>
              ) : (
              <div className="grid grid-cols-2 gap-2">
                {timesForDay.map(({ time, free }) => {
                  const on = chosen?.date === day && chosen?.time === time;
                  return (
                    <button
                      key={time}
                      type="button"
                      disabled={!free}
                      onClick={() => setChosen({ date: day, time })}
                      className={`rounded-lg border-2 px-3 py-3 text-sm font-bold transition ${
                        !free
                          ? 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400'
                          : on
                            ? 'border-[#1B3C6C] bg-[#1B3C6C] text-white'
                            : 'border-slate-200 text-slate-700 hover:border-[#1B3C6C]'
                      }`}
                    >
                      <span className={free ? '' : 'line-through decoration-slate-300'}>
                        {fmtTime(time)}
                      </span>
                      {!free && (
                        <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Taken
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              )}
            </>
          )}

          {error && <ErrorNote>{error}</ErrorNote>}
          {/* Hidden while the month is open. There is no time chosen during a
              detour to pick a day, so the button could only say "Choose a
              time" — an instruction the screen is not currently offering. */}
          {!monthOpen && (
            <PrimaryButton disabled={!chosen} onClick={goToProject}>
              {chosen ? `Continue with ${fmtTime(chosen.time)}` : 'Choose a time'}
            </PrimaryButton>
          )}
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

      {/* ── 3. Name, mobile and address — the least we need to hold the slot ── */}
      {phase === 'lock' && (
        <form
          className="space-y-5 text-left"
          onSubmit={(e) => {
            e.preventDefault();
            void confirm();
          }}
        >
          {/* The slot they are holding — and, when the address ruled it out,
              the swap. Deliberately in the same place on the screen and in the
              same shape: the homeowner reads one line about their appointment,
              which either confirms or offers, and never a red error about a
              step they completed correctly. */}
          {chosen && recheck !== 'moved' && (
            <p className="rounded-xl bg-[#f2f7ff] px-4 py-3 text-sm font-bold text-[#1B3C6C]">
              {fmtDate(chosen.date)} at {fmtTime(chosen.time)}
              {swapped && (
                <span className="mt-1 block text-xs font-semibold text-emerald-700">
                  <Check className="mr-1 inline h-3.5 w-3.5" />
                  Updated for your address
                </span>
              )}
              {recheck === 'checking' && (
                <span className="mt-1 block text-xs font-semibold text-slate-500">
                  <Loader2 className="mr-1 inline h-3.5 w-3.5 animate-spin" />
                  Checking this time for your address…
                </span>
              )}
            </p>
          )}

          {chosen && recheck === 'moved' && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
              <p className="text-sm font-bold text-slate-900">
                {fmtTime(chosen.time)} on {dayPart(chosen.date, { weekday: 'long' })} is already
                taken near you
              </p>
              {swaps.length > 0 ? (
                <>
                  {/* One tap and they are back on track. No screen change, no
                      re-entry, no scrolling to find the calendar again — the
                      nearest times to what they already asked for, in the place
                      they are already looking. */}
                  <p className="mt-1 text-xs font-semibold text-slate-600">
                    Closest times we can get to you — tap one to keep your booking:
                  </p>
                  <div className="mt-3 grid gap-2">
                    {swaps.map((s) => (
                      <button
                        key={`${s.date}T${s.time}`}
                        type="button"
                        onClick={() => takeSwap(s)}
                        className="flex w-full items-center justify-between rounded-xl border-2 border-[#1B3C6C] bg-white px-4 py-3 text-left text-sm font-bold text-[#1B3C6C] transition hover:bg-[#f2f7ff]"
                      >
                        <span>
                          {dayPart(s.date, { weekday: 'long', month: 'short', day: 'numeric' })} at{' '}
                          {fmtTime(s.time)}
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0" />
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <p className="mt-1 text-xs font-semibold text-slate-600">
                  Pick another time and we will hold it for you.
                </p>
              )}
              <button
                type="button"
                onClick={() => {
                  setChosen(null);
                  setRecheck('idle');
                  setSwaps([]);
                  setPhase('time');
                }}
                className="mt-3 text-xs font-bold text-[#1B3C6C] underline"
              >
                See all available times
              </button>
            </div>
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

          {/* Required — but the DROPDOWN is not.
              These are two different things and the difference is the whole
              point. We need an address: nobody prices a basement without
              knowing which one, and a rep cannot plan a day around a blank.
              What we do not need is for the homeowner to realise that tapping a
              Google suggestion is what makes the button work. Most of these
              readers are in their forties and fifties on a phone from an SMS
              link, and the ones who type their address their own way are not
              the ones we can afford to lose.
              So: the field must be filled in, and anything typed counts. The
              server resolves what it can, and an address it cannot parse flags
              the lead for a rep rather than throwing away a booking somebody
              has already chosen a time for. */}
          <div className="relative">
            <label className="mb-2 block text-sm font-bold text-slate-700">
              <MapPin className="mr-1 inline h-4 w-4 text-[#1B3C6C]" /> Property address
            </label>
            <input
              className={inputCls}
              required
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
          {/* Blocked only while a time is known to be gone, or while the check
              that would tell us is still running. Every other state books —
              an address we could not resolve, a check that errored, no address
              lookup at all. The server re-checks regardless; this button must
              never be the reason a real booking is refused. */}
          <PrimaryButton
            disabled={
              busy ||
              recheck === 'checking' ||
              recheck === 'moved' ||
              !contact.name.trim() ||
              !phoneOk(contact.phone) ||
              !addressText.trim()
            }
            type="submit"
          >
            {busy
              ? 'Confirming…'
              : recheck === 'checking'
                ? 'Checking your time…'
                : recheck === 'moved'
                  ? 'Pick a time above'
                  : 'Confirm my consultation'}
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
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <p className="text-xl font-black text-slate-900">{fmtDate(booking.date)}</p>
          <p className="text-lg font-bold text-[#1B3C6C]">{fmtTime(booking.time)}</p>
          <p className="mt-2 text-sm font-bold uppercase tracking-wide text-slate-500">{meeting.line}</p>
          {/* Only when it changes what the homeowner should expect.
              "A specialist will visit your property" says nothing the line
              directly above it has not already said in capitals, and it cost
              the two prep questions their place on the screen. The REMOTE
              wording is the opposite case — that this one is by video or phone
              is exactly what someone would otherwise get wrong, so it stays. */}
          {remote && <p className="mt-3 text-slate-600">{meeting.detail}</p>}
          <div className="mt-3 space-y-0.5 text-sm text-slate-500">
            <p className="font-bold text-slate-700">{projectLabel}</p>
            <p>We’ll text {contact.phone}</p>
            {/* The reference matters when they need to quote it back to us,
                which is never in the next ten seconds. It belongs on the screen
                they finish on, not in front of the questions. */}
            {phase === 'done' && <p className="font-semibold">Reference {booking.publicReference}</p>}
          </div>

          {/* Held back until the prep is done or skipped.
              It is a useful button and a big one, and sitting between the
              confirmation and the two questions it pushed those questions off
              the bottom of a phone — where a question nobody scrolls to is a
              question nobody answers. Nothing is lost: adding the visit to a
              calendar is a finishing action, and it is on the screen that
              finishes. */}
          {phase === 'done' && (
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
          )}

          {/* One question at a time.
              Both of them on screen at once made this card twice the height of
              every other card in the flow, and the fix I reached for first —
              half-width options at smaller type — traded a long screen for an
              unreadable one. These readers are mostly in their forties and
              fifties on a phone; shrinking the text is the one thing not
              available to us.
              So the block shows a single question at full size and advances on
              the tap, exactly as the project-type screen does. Same touch
              targets as the rest of the flow, a third of the height, and no
              Save button to reach: answering the last one saves. */}
          {phase === 'booked' && prepQuestion && (
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70 p-5 text-left">
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <p className="text-sm font-black text-slate-800">One quick thing</p>
                <p className="shrink-0 text-xs font-bold text-slate-400">
                  {prepIndex + 1} of {program.prepQuestions.length}
                </p>
              </div>
              <p className="mb-4 text-xs leading-relaxed text-slate-500">
                Optional — it just helps your consultant arrive prepared.
              </p>

              <Choice
                question={prepQuestion}
                value={prep[prepQuestion.key]}
                onPick={(v) => answerPrep(prepQuestion.key, v)}
              />

              {/* The financing detail lives here and nowhere earlier: helper
                  text under the question it belongs to, on a screen where the
                  visit is already secured — not a pitch standing between
                  somebody and the calendar. */}
              {prepQuestion.key === 'contribution' && program.displayAmountLabel && (
                <p className="mt-2.5 text-xs leading-relaxed text-slate-500">
                  Monthly plans {program.displayAmountLabel}, nothing upfront, and 6 months with no
                  payments and no interest — on approved credit.
                </p>
              )}

              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  trackStep('ConsultationPrepSkipped', { answered: Object.keys(prep).length });
                  // Anything already answered is still worth having. Skipping
                  // means "stop asking", not "throw away what I told you".
                  if (Object.keys(prep).length > 0) void savePrep();
                  else setPhase('done');
                }}
                className="mt-3 w-full rounded-xl py-3 text-sm font-bold text-slate-500 transition hover:text-slate-700 disabled:opacity-50"
              >
                {busy ? 'Saving…' : 'Skip — I’m all set'}
              </button>
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
