import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type MarqueePhoto = { src: string; alt: string };

/**
 * A photo row that drifts continuously left, and never reaches an end.
 *
 * The row is rendered TWICE. When the scroll position passes the width of the
 * first copy it is rolled back by exactly that width — the second copy is
 * already showing identical pixels at that point, so the jump is invisible and
 * the loop has no seam. That is why the duplicate set is `aria-hidden`: it is
 * the same photographs again, and a screen reader announcing all sixteen would
 * be describing a rendering trick rather than the work.
 *
 * Driven by requestAnimationFrame against elapsed time, not by a CSS keyframe
 * animation. A keyframe cannot be interrupted mid-flight by a person grabbing
 * the row and swiping it, and this row has to stay draggable, arrow-driven and
 * wheel-scrollable — the drift is decoration on top of a real scroller, never
 * a replacement for one.
 *
 * It stops whenever a person is using it: pointer over the row, focus inside
 * it, mid-drag, or the tab hidden. And it never starts at all under
 * prefers-reduced-motion, where a permanently moving element is exactly what
 * the setting exists to prevent.
 */
export function PhotoMarquee({
  photos,
  speed = 22,
}: {
  photos: MarqueePhoto[];
  /** Pixels per second. Slow enough to read as drift, not as a slideshow. */
  speed?: number;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    let last = performance.now();
    /* Sub-pixel remainder. scrollLeft rounds, so without carrying the
       fraction a slow drift quantises into a visible stutter. */
    let carry = 0;

    const frame = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;

      if (!paused && !document.hidden) {
        const half = el.scrollWidth / 2;
        carry += speed * dt;
        const whole = Math.floor(carry);
        if (whole > 0) {
          carry -= whole;
          el.scrollLeft += whole;
          // Seamless roll-back: the second copy is showing the same pixels.
          if (el.scrollLeft >= half) el.scrollLeft -= half;
        }
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [paused, speed]);

  const nudge = (direction: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const tile = el.firstElementChild as HTMLElement | null;
    const step = (tile ? tile.offsetWidth + 20 : 320) * direction;
    const half = el.scrollWidth / 2;
    let next = el.scrollLeft + step;
    if (next < 0) next += half;
    if (next >= half) next -= half;
    el.scrollLeft = next;
  };

  // Rendered twice; the duplicate is hidden from assistive tech.
  const loop = [...photos, ...photos];

  return (
    <div>
      <div className="mx-auto flex max-w-7xl items-end justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <div>
          <h2 className="text-2xl font-bold tracking-[-0.025em] text-slate-900">
            More finished bathrooms
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {photos.length} more completed projects.
          </p>
        </div>
        <div className="hidden shrink-0 gap-2 sm:flex">
          <button
            type="button"
            onClick={() => nudge(-1)}
            aria-label="Previous photos"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-[#1B3C6C] shadow-sm transition hover:bg-slate-50"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => nudge(1)}
            aria-label="More photos"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-[#1B3C6C] shadow-sm transition hover:bg-slate-50"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
        /* No scroll-snap: snapping fights a continuous drift and drags the row
           back onto a tile edge every frame. */
        className="mt-8 flex gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {loop.map((photo, i) => (
          <figure
            key={`${photo.src}-${i}`}
            aria-hidden={i >= photos.length ? true : undefined}
            className="m-0 w-[74vw] max-w-[300px] shrink-0 overflow-hidden rounded-[1.35rem] bg-slate-200 shadow-sm"
          >
            <img
              src={photo.src}
              alt={i >= photos.length ? '' : photo.alt}
              width={1080}
              height={1440}
              loading="lazy"
              decoding="async"
              className="aspect-[3/4] w-full object-cover"
            />
          </figure>
        ))}
      </div>
    </div>
  );
}
