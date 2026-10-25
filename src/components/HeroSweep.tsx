import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Full-bleed before/after hero: one real basement, unfinished on the left of
 * the seam and finished on the right, spanning the whole hero edge to edge.
 * From `sm` up the copy (children) sits over the unfinished side under a warm
 * vignette.
 *
 * On phones the copy sits BELOW the photograph instead, on the hero's own dark
 * ground. Laid over a 375px-wide photo, the headline ran into the Unfinished /
 * Finished labels and the handle sat on the text — the copy is taller than a
 * phone hero can hold once the service picker is in it, and the comparison is
 * the one thing in the hero that must not be covered. The photo is 16:9 there,
 * a light crop of its own 3:2: the full 3:2 pushed the service picker's first
 * row just under the fold on a 667px-tall phone.
 *
 * Moving the seam:
 *  - drag anywhere on the photograph (not on the copy, so the CTAs stay
 *    plain buttons), or the handle itself;
 *  - arrow keys, through a visually hidden range input that owns focus;
 *  - on load it holds at the resting split for 0.8s (so both rooms register),
 *    then glides once left, right and home over 3.6s with a weighted ease,
 *    the handle pulsing "drag me" while it does. Driven by
 *    requestAnimationFrame, not a CSS transition, so the first touch, click,
 *    wheel, key or pointer near the seam stops it on that exact frame and
 *    the visitor has the seam. Skipped entirely under reduced motion.
 * touch-action: pan-y keeps vertical swipes scrolling the page on phones;
 * only a sideways drag moves the seam.
 *
 * The financial line on the finished side uses the site's own figures:
 * /costs' basement row and the basement program's "from $399/month"
 * (lib/program-config.ts), always with "on approved credit". The photo pair
 * is the one /basements already uses, captioned the same neutral way.
 */
/** Resting split. Phones sit at 50; desktop a touch right of centre so the
 *  seam clears the end of the headline. */
const restFor = () => (window.matchMedia('(min-width: 1024px)').matches ? 56 : 50);

/** CSS cubic-bezier(x1, y1, x2, y2) as a function of progress 0–1. */
function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const curve = (a: number, b: number, t: number) =>
    3 * a * t * (1 - t) ** 2 + 3 * b * t ** 2 * (1 - t) + t ** 3;
  return (x: number) => {
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 24; i += 1) {
      const mid = (lo + hi) / 2;
      if (curve(x1, x2, mid) < x) lo = mid;
      else hi = mid;
    }
    return curve(y1, y2, (lo + hi) / 2);
  };
}
const EASE = cubicBezier(0.4, 0, 0.2, 1);
const HOLD_MS = 800;
// Three legs: rest → left → right → rest, sharing 3.6s by distance travelled.
const LEGS: [number, number][] = [
  [0, -20],
  [-20, 14],
  [14, 0],
];
const SWEEP_MS = 3600;

export function HeroSweep({ children }: { children: ReactNode }) {
  const [split, setSplit] = useState(50);
  const [autoplay, setAutoplay] = useState(false);
  const [dragging, setDragging] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const splitRef = useRef(50);
  const stopRef = useRef<() => void>(() => {});

  const apply = (value: number) => {
    splitRef.current = value;
    setSplit(value);
  };

  useEffect(() => {
    const rest = restFor();
    apply(rest);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;
    let stopped = false;
    const total = LEGS.reduce((sum, [from, to]) => sum + Math.abs(to - from), 0);

    const stop = () => {
      if (stopped) return;
      stopped = true;
      window.clearTimeout(holdTimer);
      cancelAnimationFrame(frame);
      setAutoplay(false);
      window.removeEventListener('wheel', stop);
      window.removeEventListener('touchstart', stop);
      window.removeEventListener('keydown', stop);
    };
    stopRef.current = stop;
    window.addEventListener('wheel', stop, { passive: true });
    window.addEventListener('touchstart', stop, { passive: true });
    window.addEventListener('keydown', stop);

    const holdTimer = window.setTimeout(() => {
      if (stopped) return;
      setAutoplay(true);
      const started = performance.now();
      const tick = (now: number) => {
        if (stopped) return;
        let distance = ((now - started) / SWEEP_MS) * total;
        for (const [from, to] of LEGS) {
          const leg = Math.abs(to - from);
          if (distance <= leg) {
            apply(rest + from + (to - from) * EASE(distance / leg));
            frame = requestAnimationFrame(tick);
            return;
          }
          distance -= leg;
        }
        apply(rest);
        stop();
      };
      frame = requestAnimationFrame(tick);
    }, HOLD_MS);

    return stop;
  }, []);

  const moveTo = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const bounds = canvas.getBoundingClientRect();
    apply(Math.min(97, Math.max(3, ((clientX - bounds.left) / bounds.width) * 100)));
  };

  return (
    <section className="relative isolate overflow-clip bg-[#14100C] text-white">
      <div
        ref={canvasRef}
        className={`relative aspect-[16/9] touch-pan-y select-none sm:aspect-auto sm:h-[calc(100svh-4.75rem)] sm:min-h-[600px] sm:max-h-[880px] ${dragging ? 'cursor-grabbing' : 'cursor-ew-resize'}`}
        onPointerDown={(event) => {
          if ((event.target as HTMLElement).closest('[data-hero-copy]')) return;
          stopRef.current();
          try {
            event.currentTarget.setPointerCapture(event.pointerId);
          } catch {
            // Capture is a nicety (keeps the drag if the pointer leaves the
            // hero); never let it stop the drag starting.
          }
          setDragging(true);
          moveTo(event.clientX);
        }}
        onPointerMove={(event) => {
          if (dragging) {
            moveTo(event.clientX);
            return;
          }
          // A pointer that comes near the seam takes it over.
          if (autoplay) {
            const bounds = event.currentTarget.getBoundingClientRect();
            const seamX = bounds.left + (splitRef.current / 100) * bounds.width;
            if (Math.abs(event.clientX - seamX) < 80) stopRef.current();
          }
        }}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
      >
        {/* Finished room: the full canvas. */}
        <img
          src="/images/hero/basement-after-1920.webp"
          srcSet="/images/hero/basement-after-800.webp 800w, /images/hero/basement-after-1400.webp 1400w, /images/hero/basement-after-1920.webp 1920w"
          sizes="100vw"
          alt="The same basement finished: carpeted living room, dining area and recessed lighting"
          width={1920}
          height={1280}
          fetchPriority="high"
          decoding="async"
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Unfinished room: clipped to the left of the seam. */}
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
        >
          <img
            src="/images/hero/basement-before-1920.webp"
            srcSet="/images/hero/basement-before-800.webp 800w, /images/hero/basement-before-1400.webp 1400w, /images/hero/basement-before-1920.webp 1920w"
            sizes="100vw"
            alt="An unfinished Ontario basement: exposed joists, framed and insulated walls, concrete floor"
            width={1920}
            height={1280}
            fetchPriority="high"
            decoding="async"
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>

        {/* Vignette: warm and dark where the copy sits — left on desktop,
            bottom on tablets — clear over the finished room. On phones the
            copy is below the photo, so only the bottom edge darkens, enough
            to run the photo into the dark ground under it without a seam. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,rgba(20,16,12,0.9)_0%,rgba(20,16,12,0)_28%)] sm:bg-[linear-gradient(0deg,rgba(14,10,7,0.96)_0%,rgba(14,10,7,0.9)_42%,rgba(14,10,7,0.55)_58%,rgba(14,10,7,0.1)_75%,rgba(14,10,7,0.3)_100%)] lg:bg-[linear-gradient(90deg,rgba(14,10,7,0.9)_0%,rgba(14,10,7,0.78)_30%,rgba(14,10,7,0.25)_52%,rgba(14,10,7,0)_70%)]" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[rgba(14,10,7,0.45)] to-transparent" />

        {/* Keyboard + screen readers. Visually hidden; the handle shows focus. */}
        <input
          type="range"
          min={3}
          max={97}
          value={Math.round(split)}
          onFocus={() => stopRef.current()}
          onChange={(event) => {
            stopRef.current();
            apply(Number(event.target.value));
          }}
          aria-label="Compare the basement unfinished and finished"
          className="peer sr-only"
        />

        {/* The seam */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 z-10"
          style={{ left: `${split}%` }}
        >
          {/* On tablets the copy spans both sides, so the line fades out before
              it reaches the text. On desktop, and on phones (copy below the
              photo), it runs the full height. */}
          <div className="absolute inset-y-0 w-px -translate-x-1/2 bg-white/80 shadow-[0_0_18px_rgba(255,255,255,0.45)] sm:[mask-image:linear-gradient(180deg,black_0%,black_40%,transparent_55%)] lg:[mask-image:none]" />
          <span className="absolute left-0 top-6 -translate-x-[calc(100%+10px)] whitespace-nowrap rounded-full bg-black/40 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-white/85 backdrop-blur-sm">
            Unfinished
          </span>
          <span className="absolute left-0 top-6 translate-x-[10px] whitespace-nowrap rounded-full bg-white/80 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[#14100C] backdrop-blur-sm">
            Finished
          </span>
          <div className={`hero-sweep-handle ${autoplay ? 'hero-sweep-pulse' : ''} absolute left-0 top-[55%] flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/20 shadow-[0_12px_30px_rgba(0,0,0,0.35)] sm:top-[22%] lg:top-1/2`}>
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l-6 6 6 6M15 6l6 6-6 6" />
            </svg>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-0 z-10 opacity-0 ring-2 ring-inset ring-white/70 peer-focus-visible:opacity-100" />

        {/* What the finished side costs, on the finished side — and only while
            that side is wide enough to hold it, so it never labels raw framing. */}
        <p
          className={`pointer-events-none absolute bottom-6 right-6 z-10 hidden max-w-[19rem] rounded-2xl bg-black/45 px-4 py-3 text-xs leading-5 text-white/85 backdrop-blur-md transition-opacity duration-300 lg:block ${split > 68 ? 'opacity-0' : 'opacity-100'}`}
        >
          <span className="block text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-white/60">
            Finished basement
          </span>
          <span className="mt-1 block text-sm font-semibold text-white">Typically $50,000 – $70,000</span>
          From $399/month, nothing upfront, no lien. On approved credit.
        </p>
      </div>

      {/* Copy. A sibling of the photograph, not inside it: on phones it flows
          below the photo; from `sm` up it is laid over the photo, which is
          what this section's `relative` is for. Pointer events pass through
          the overlay to the photo, so the drag still works around the copy.

          On desktop it is centred in the space BELOW the Unfinished /
          Finished labels (lg:pt-14), not in the whole hero — centred in the
          whole hero, a 720px-tall laptop put the eyebrow on the labels. */}
      <div className="relative z-20 sm:pointer-events-none sm:absolute sm:inset-0 sm:flex sm:items-end lg:items-center lg:pt-14">
        <div className="mx-auto w-full max-w-6xl px-4 pb-8 pt-4 sm:px-6 sm:pb-8 sm:pt-0 lg:px-8 lg:pb-0">
          <div data-hero-copy className="max-w-xl cursor-auto select-text sm:pointer-events-auto">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
