import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Check, ChevronRight, Clock, MapPin, RotateCw } from 'lucide-react';

/**
 * A self-running preview of the real /consultation booking flow.
 *
 * WHY THIS EXISTS. The consultation is the homepage's actual conversion, and
 * the objection it loses people to is not price — it is "how long is this
 * going to take, and who is going to call me." Describing the flow in prose
 * does not answer that; showing it does. So the homepage plays the booking
 * back at the reader before asking them to start it.
 *
 * WHAT IT IS NOT. This is a REPLICA, not the live flow embedded. It makes no
 * network call, reads no availability, and cannot book anything. That is a
 * deliberate trade: a real embed on the homepage would mean a slot query on
 * every pageview, and a homepage section that can fail to load, show "no
 * times are free right now", or race Turnstile. The replica always plays.
 *
 * THE COST OF THAT TRADE is drift: if BasementBookingFlow changes its steps
 * or its copy, this keeps showing the old ones. The strings and Tailwind
 * classes below are deliberately copied from
 * src/pages/consultation/BasementBookingFlow.tsx rather than reinvented, so a
 * diff between the two files is readable when that day comes. The step titles
 * and the four-step count are the parts most worth checking.
 *
 * The dates are generated from today at render, so the strip never shows a
 * stale weekend the way a screenshot would.
 */

/* Copied from BasementBookingFlow's `title` map — steps 1-3, plus the
   confirmation the real flow only reaches after a live submission. */
const STEP_TITLES = [
  'Pick a time that suits you',
  'What are you planning?',
  'Lock it in',
  'Your visit is booked',
];

/* Mirrors the left-hand caption list to the screen. These are the homeowner's
   words for each step, not the component's phase names. */
const STEP_CAPTIONS = [
  'Pick a day and time that suits you',
  'Tell us what you’re planning',
  'Lock it in — name, mobile, address',
  'Confirmed by text, usually within the hour',
];

const TOTAL_STEPS = 4;

/* The day the demo books, as an index into the generated strip. Not 0: moving
   the cursor to a day that is ALREADY selected would read as a dead click. */
const PICK_DAY = 1;
const PICK_TIME = '2:00 PM';

/* Per-day remaining counts. <= 3 turns amber, matching the `scarce` rule in
   BasementBookingFlow. Fixed rather than random so the section doesn't
   re-render into a different story on every mount. */
const SEATS_LEFT = [4, 5, 3, 5, 2, 5, 4];

const SLOTS: { time: string; free: boolean }[] = [
  { time: '10:00 AM', free: false },
  { time: '12:00 PM', free: true },
  { time: '2:00 PM', free: true },
  { time: '4:00 PM', free: true },
];

/* The three options from the basement program's project question. */
const OPTIONS = [
  'Finish an unfinished basement',
  'Renovate an existing basement',
  'Garden Suite / Laneway ADU',
];

const FIELDS = [
  { label: 'Your name', value: 'Sarah Whitfield' },
  { label: 'Mobile number', value: '(416) 555-0142' },
  { label: 'Property address', value: '88 Maple Grove Dr, Oakville' },
];

type Cursor = { x: number; y: number; shown: boolean };

export default function BookingFlowDemo() {
  const screenRef = useRef<HTMLDivElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);

  /* Click targets the fake cursor travels to. */
  const dayRefs = useRef<(HTMLDivElement | null)[]>([]);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const optRefs = useRef<(HTMLDivElement | null)[]>([]);
  const fieldRefs = useRef<(HTMLDivElement | null)[]>([]);
  const ctaRef = useRef<HTMLDivElement | null>(null);
  const confirmRef = useRef<HTMLDivElement | null>(null);

  const [step, setStep] = useState(0);
  const [day, setDay] = useState(0);
  const [slot, setSlot] = useState<string | null>(null);
  const [opt, setOpt] = useState<number | null>(null);
  const [typed, setTyped] = useState(['', '', '']);
  const [focused, setFocused] = useState<number | null>(null);
  const [cursor, setCursor] = useState<Cursor>({ x: -80, y: -80, shown: false });
  const [clicks, setClicks] = useState(0);
  const [pressed, setPressed] = useState<string | null>(null);

  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* The next seven days, generated at mount. */
  const [days] = useState(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i + 1);
      return d;
    });
  });

  const picked = days[PICK_DAY];
  const part = (d: Date, o: Intl.DateTimeFormatOptions) =>
    d.toLocaleDateString('en-CA', o);

  const recapLine = `${part(picked, { weekday: 'long' })}, ${part(picked, {
    month: 'long',
    day: 'numeric',
  })} at ${PICK_TIME}`;
  const ticketLine = `${part(picked, { weekday: 'short' })}, ${part(picked, {
    month: 'short',
    day: 'numeric',
  })} · ${PICK_TIME}`;

  /* ── the timeline ────────────────────────────────────────────────────
     One list of pending timers so a pause, a replay or an unmount can
     cancel the whole run in one call. Leaving these running after unmount
     is the classic way a looping demo leaks setState-after-unmount. */
  const timers = useRef<number[]>([]);
  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, []);
  const after = useCallback((ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  const moveTo = useCallback((el: HTMLElement | null) => {
    const screen = screenRef.current;
    if (!el || !screen) return;
    const a = el.getBoundingClientRect();
    const b = screen.getBoundingClientRect();
    setCursor({
      x: a.left - b.left + a.width / 2,
      y: a.top - b.top + a.height / 2,
      shown: true,
    });
  }, []);

  const click = useCallback(() => setClicks((n) => n + 1), []);

  const press = useCallback(
    (id: string) => {
      setPressed(id);
      after(150, () => setPressed(null));
    },
    [after],
  );

  /* Types one field a character at a time, with enough jitter in the
     interval that it doesn't read as a marquee. */
  const type = useCallback(
    (index: number, done: () => void) => {
      setFocused(index);
      const full = FIELDS[index].value;
      let i = 0;
      const tick = () => {
        if (i > full.length) {
          setFocused(null);
          done();
          return;
        }
        const n = i;
        setTyped((prev) => {
          const next = [...prev];
          next[index] = full.slice(0, n);
          return next;
        });
        i += 1;
        after(34 + Math.random() * 28, tick);
      };
      tick();
    },
    [after],
  );

  const reset = useCallback(() => {
    clearTimers();
    setStep(0);
    setDay(0);
    setSlot(null);
    setOpt(null);
    setTyped(['', '', '']);
    setFocused(null);
    setPressed(null);
    setCursor({ x: -80, y: -80, shown: false });
  }, [clearTimers]);

  const run = useCallback(() => {
    reset();

    /* 1 — the day */
    after(900, () => moveTo(dayRefs.current[PICK_DAY]));
    after(1560, () => {
      click();
      setDay(PICK_DAY);
    });

    /* 2 — the time */
    after(2200, () => moveTo(slotRefs.current[2]));
    after(2860, () => {
      click();
      setSlot(PICK_TIME);
    });

    /* 3 — continue */
    after(3600, () => moveTo(ctaRef.current));
    after(4260, () => {
      click();
      press('cta');
    });
    after(4460, () => setStep(1));

    /* 4 — project type. The 180ms hold before advancing is the same pause
       the real flow uses, for the same reason: a tap that selects and
       navigates at once reads as the page jumping on its own. */
    after(5300, () => moveTo(optRefs.current[0]));
    after(5960, () => {
      click();
      setOpt(0);
    });
    after(6500, () => setStep(2));

    /* 5 — the form, then the confirmation */
    after(7200, () => {
      moveTo(fieldRefs.current[0]);
      after(560, () => {
        click();
        type(0, () => {
          moveTo(fieldRefs.current[1]);
          after(560, () => {
            click();
            type(1, () => {
              moveTo(fieldRefs.current[2]);
              after(560, () => {
                click();
                type(2, () => {
                  after(420, () => moveTo(confirmRef.current));
                  after(1040, () => {
                    click();
                    press('confirm');
                  });
                  after(1300, () => {
                    setStep(3);
                    setCursor((c) => ({ ...c, shown: false }));
                  });
                  /* Hold the confirmation long enough to be read, then loop. */
                  after(5200, run);
                });
              });
            });
          });
        });
      });
    });
  }, [after, click, moveTo, press, reset, type]);

  /* The finished state, for anyone who asked not to see motion. */
  const showStatic = useCallback(() => {
    clearTimers();
    setDay(PICK_DAY);
    setSlot(PICK_TIME);
    setOpt(0);
    setTyped(FIELDS.map((f) => f.value));
    setStep(3);
    setCursor({ x: -80, y: -80, shown: false });
  }, [clearTimers]);

  /* Only run while the section is actually on screen and the tab is
     visible — this sits on the homepage, and a loop that keeps ticking
     while someone reads the FAQ is pure battery drain. */
  useEffect(() => {
    if (reduced) {
      showStatic();
      return;
    }
    const node = sectionRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      run();
      return clearTimers;
    }

    let running = false;
    const start = () => {
      if (running || document.hidden) return;
      running = true;
      run();
    };
    const stop = () => {
      running = false;
      clearTimers();
    };

    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => (e.isIntersecting ? start() : stop())),
      { threshold: 0.25 },
    );
    io.observe(node);

    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      clearTimers();
    };
  }, [clearTimers, reduced, run, showStatic]);

  const onReplay = () => (reduced ? showStatic() : run());

  return (
    <section
      ref={sectionRef}
      className="border-b border-slate-100 bg-slate-50 py-16 lg:py-20"
      aria-labelledby="booking-demo-heading"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-16 lg:px-8">
        {/* ── the claim ── */}
        <div>
          <p className="mb-4 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#1B3C6C]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
            Booking is open
          </p>

          <h2
            id="booking-demo-heading"
            className="text-3xl font-black leading-[1.08] tracking-[-0.03em] text-slate-900 sm:text-4xl"
          >
            Three taps to a free site visit.
          </h2>

          <p className="mt-4 max-w-[46ch] text-base leading-7 text-slate-600">
            No callbacks, no phone tag, no sales pitch to sit through. Pick the time that
            works, tell us what you’re planning, and we’ll confirm by text.
          </p>

          {/* The captions are numbered because the booking genuinely is a
              sequence — the numbers carry the "how many steps is this"
              answer the section exists to give. */}
          <ol className="mt-8 flex flex-col gap-0.5">
            {STEP_CAPTIONS.map((caption, i) => {
              const on = i === step;
              const done = i < step;
              return (
                <li
                  key={caption}
                  className={`flex items-start gap-3 rounded-lg py-2 pl-2 pr-3 transition-colors duration-500 ${
                    on ? 'bg-[#f2f7ff] text-slate-900' : 'text-slate-500'
                  }`}
                >
                  <span
                    className={`mt-px grid h-5 w-5 shrink-0 place-items-center rounded-md border text-[11px] font-bold transition-colors duration-500 ${
                      on
                        ? 'border-[#1B3C6C] bg-[#1B3C6C] text-white'
                        : done
                          ? 'border-emerald-500/40 text-emerald-600'
                          : 'border-slate-200 text-slate-400'
                    }`}
                  >
                    {done ? <Check className="h-3 w-3" /> : i + 1}
                  </span>
                  <span className={`text-sm leading-6 ${on ? 'font-semibold' : ''}`}>
                    {caption}
                  </span>
                </li>
              );
            })}
          </ol>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/consultation"
              className="inline-flex items-center gap-2 rounded-xl bg-[#1B3C6C] px-6 py-3.5 text-base font-bold text-white shadow-[0_10px_22px_rgba(27,60,108,0.26)] transition hover:bg-[#153158]"
            >
              Book your free consultation
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={onReplay}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-[#1B3C6C] hover:text-[#1B3C6C]"
            >
              <RotateCw className="h-3.5 w-3.5" />
              Replay
            </button>
          </div>
        </div>

        {/* ── the screen ── */}
        <div className="relative mx-auto w-full max-w-[23.5rem] justify-self-center">
          <div className="relative overflow-hidden rounded-[2.125rem] bg-slate-900 p-2.5 shadow-[0_2px_6px_rgba(15,23,42,0.12),0_24px_56px_rgba(15,23,42,0.2)]">
            <div
              ref={screenRef}
              role="img"
              aria-label="A preview of the OntarioReno consultation booking: choosing a day and time, choosing a project type, entering contact details, and a confirmed visit."
              className="relative aspect-[360/700] max-w-full overflow-hidden rounded-[1.625rem] bg-white"
            >
              {/* The same photo the real calendar screen opens on. */}
              <div className="relative h-[31%] overflow-hidden bg-[#1B3C6C]">
                <img
                  src="/images/banner.webp"
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,26,46,0.55)_0%,rgba(27,60,108,0.78)_60%,rgba(27,60,108,0.92)_100%)]" />

                <div className="relative flex h-full flex-col justify-end px-5 pb-4">
                  <img
                    src="/logo-white.png"
                    alt="OntarioReno"
                    className="mx-auto mb-3 mt-auto h-7 w-auto drop-shadow-lg"
                  />
                  <div className="mx-auto mb-3 flex w-full max-w-[220px] gap-1.5">
                    {Array.from({ length: TOTAL_STEPS }, (_, n) => n).map((i) => (
                      <span
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${
                          i <= step ? 'bg-white' : 'bg-white/30'
                        }`}
                      />
                    ))}
                  </div>
                  <h3 className="text-center text-xl font-black tracking-tight text-white drop-shadow-sm">
                    {STEP_TITLES[step]}
                  </h3>
                </div>
              </div>

              {/* All four screens stay mounted and cross-fade: the cursor
                  measures its targets off live layout, so they need boxes
                  even while they're the screen you can't see. */}
              <div className="relative h-[69%]">
                {/* 1 — the calendar */}
                <Screen on={step === 0}>
                  <p className="text-sm font-bold text-[#1B3C6C]">
                    In-Person Site Visit · 45 minutes
                  </p>

                  <div className="mt-4 flex gap-2 overflow-hidden">
                    {days.map((d, i) => {
                      const on = i === day;
                      const scarce = SEATS_LEFT[i] <= 3;
                      return (
                        <div
                          key={d.toISOString()}
                          ref={(el) => {
                            dayRefs.current[i] = el;
                          }}
                          className={`w-[4.25rem] shrink-0 rounded-xl border-2 px-2 py-2 text-center transition duration-300 ${
                            on
                              ? '-translate-y-px border-[#1B3C6C] bg-[#1B3C6C] text-white'
                              : 'border-slate-200 bg-white text-slate-700'
                          }`}
                        >
                          <span className="block text-[10px] font-bold uppercase tracking-wide opacity-80">
                            {part(d, { weekday: 'short' })}
                          </span>
                          <span className="block text-lg font-black leading-tight tabular-nums">
                            {part(d, { day: 'numeric' })}
                          </span>
                          <span className="block text-[10px] font-bold uppercase tracking-wide opacity-80">
                            {part(d, { month: 'short' })}
                          </span>
                          <span
                            className={`mt-0.5 block text-[10px] font-bold ${
                              on ? 'text-white/80' : scarce ? 'text-amber-600' : 'text-slate-400'
                            }`}
                          >
                            {SEATS_LEFT[i]} left
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-[#1B3C6C]">
                    <CalendarDays className="h-3.5 w-3.5" />
                    See full calendar
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {SLOTS.map((s, i) => {
                      const on = slot === s.time;
                      return (
                        <div
                          key={s.time}
                          ref={(el) => {
                            slotRefs.current[i] = el;
                          }}
                          className={`rounded-lg border-2 px-3 py-3 text-center text-sm font-bold transition duration-300 ${
                            !s.free
                              ? 'border-slate-100 bg-slate-50 text-slate-400'
                              : on
                                ? '-translate-y-px border-[#1B3C6C] bg-[#1B3C6C] text-white'
                                : 'border-slate-200 text-slate-700'
                          }`}
                        >
                          <span className={s.free ? '' : 'line-through decoration-slate-300'}>
                            {s.time}
                          </span>
                          {!s.free && (
                            <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-wide text-slate-400">
                              Taken
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div
                    ref={ctaRef}
                    className={`mt-auto rounded-xl py-3.5 text-center text-sm font-bold text-white transition duration-300 ${
                      slot ? 'bg-[#1B3C6C]' : 'bg-slate-300'
                    } ${pressed === 'cta' ? 'scale-[0.97]' : ''}`}
                  >
                    {slot ? `Continue with ${slot}` : 'Choose a time'}
                  </div>
                  <p className="mt-2 text-center text-[10px] text-slate-500">
                    Free consultation · about 45 minutes
                  </p>
                </Screen>

                {/* 2 — project type */}
                <Screen on={step === 1}>
                  <div className="grid gap-2">
                    {OPTIONS.map((label, i) => {
                      const on = opt === i;
                      return (
                        <div
                          key={label}
                          ref={(el) => {
                            optRefs.current[i] = el;
                          }}
                          className={`flex items-center justify-between rounded-xl border-2 px-4 py-4 text-left text-sm font-bold transition duration-300 ${
                            on
                              ? 'border-[#1B3C6C] bg-[#f2f7ff] text-[#1B3C6C]'
                              : 'border-slate-200 text-slate-700'
                          }`}
                        >
                          {label}
                          {on ? (
                            <Check className="h-4 w-4 shrink-0" />
                          ) : (
                            <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-auto text-center text-xs text-slate-500">
                    Last question before we hold your time.
                  </p>
                </Screen>

                {/* 3 — the details */}
                <Screen on={step === 2}>
                  <p className="flex items-center gap-2 rounded-xl bg-[#f2f7ff] px-4 py-3 text-sm font-bold text-[#1B3C6C]">
                    <Clock className="h-4 w-4 shrink-0" />
                    {recapLine}
                  </p>

                  <div className="mt-3 flex flex-col gap-2">
                    {FIELDS.map((f, i) => {
                      const val = typed[i];
                      const isFocus = focused === i;
                      return (
                        <div
                          key={f.label}
                          ref={(el) => {
                            fieldRefs.current[i] = el;
                          }}
                          className={`flex min-h-[2.75rem] items-center rounded-xl border px-4 py-3 text-[13px] transition ${
                            isFocus
                              ? 'border-[#1B3C6C] ring-[3px] ring-[#1B3C6C]/12'
                              : 'border-slate-200'
                          } ${val ? 'font-semibold text-slate-900' : 'text-slate-400'}`}
                        >
                          {i === 2 && !val && <MapPin className="mr-1.5 h-4 w-4 text-[#1B3C6C]" />}
                          <span className="truncate">{val || f.label}</span>
                          {isFocus && (
                            <span className="ml-px inline-block h-4 w-px animate-pulse bg-[#1B3C6C]" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div
                    ref={confirmRef}
                    className={`mt-auto rounded-xl bg-[#1B3C6C] py-3.5 text-center text-sm font-bold text-white transition duration-300 ${
                      pressed === 'confirm' ? 'scale-[0.97]' : ''
                    }`}
                  >
                    Confirm my consultation
                  </div>
                  <p className="mt-2 text-center text-[10px] text-slate-500">
                    100% free &amp; confidential. Reply STOP anytime.
                  </p>
                </Screen>

                {/* 4 — booked */}
                <Screen on={step === 3}>
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-emerald-50">
                      <Check className="h-7 w-7 text-emerald-600" strokeWidth={3} />
                    </div>
                    <h4 className="text-xl font-black tracking-tight text-slate-900">
                      You’re booked
                    </h4>
                    <p className="mt-1.5 text-[13px] text-slate-500">
                      We’ve texted the details to your mobile.
                    </p>

                    <dl className="mt-5 w-full rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-left">
                      <Row label="When" value={ticketLine} />
                      <Row label="Visit" value="In-person site visit" />
                      <Row label="Project" value="Unfinished basement" />
                    </dl>
                  </div>
                </Screen>
              </div>

              {/* The pointer. Decorative — the screen's aria-label already
                  describes what the sequence shows. */}
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute left-0 top-0 z-20 transition-[transform,opacity] duration-[620ms] ease-[cubic-bezier(.33,.1,.24,1)] ${
                  cursor.shown ? 'opacity-100' : 'opacity-0'
                }`}
                style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }}
              >
                <span
                  key={clicks}
                  className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-[#1B3C6C] motion-safe:animate-[ping_0.5s_ease-out_1]"
                  style={{ opacity: clicks ? undefined : 0 }}
                />
                <svg
                  viewBox="0 0 19 19"
                  className="relative h-[19px] w-[19px] drop-shadow-[0_2px_4px_rgba(15,23,42,0.3)]"
                >
                  <path
                    d="M2 1.5l13.2 6.6-5.8 1.5-2.4 5.6z"
                    fill="#0f172a"
                    stroke="#fff"
                    strokeWidth="1.3"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** One cross-fading screen inside the phone. */
function Screen({ on, children }: { on: boolean; children: React.ReactNode }) {
  return (
    <div
      aria-hidden={!on}
      className={`absolute inset-0 flex flex-col px-5 pb-4 pt-4 transition duration-300 ${
        on ? 'opacity-100' : 'pointer-events-none translate-y-2 opacity-0'
      }`}
    >
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="text-right text-xs font-bold text-slate-900">{value}</dd>
    </div>
  );
}
