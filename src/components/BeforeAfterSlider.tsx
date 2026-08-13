import { useId, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Drag-to-reveal before/after comparison.
 *
 * A renovation is bought on transformation, not on a finished photo — a gallery
 * of nice kitchens says "here is a kitchen", where a before/after says "this is
 * what we did to a room like yours". That is why this is the first image
 * treatment on the guide pages rather than a grid.
 *
 * The interaction is modelled on the slider already running in src/pages/Costs.tsx
 * so the two feel identical: same clamp, same handle, same "Drag to compare"
 * affordance. Costs.tsx is deliberately left alone — it works, it is not what we
 * were asked to change, and a shared component can absorb it later in its own
 * commit rather than riding along inside an unrelated one.
 *
 * Three things this adds over that original:
 *
 *   • KEYBOARD AND SCREEN READERS. The original is pointer-only, so the
 *     comparison is unreachable without a mouse. Here a real <input type="range">
 *     sits over the image: arrow keys move the reveal, the control is focusable,
 *     and assistive tech announces it as a slider. Every guide page is an
 *     organic-search landing page, so this is a public-facing accessibility
 *     floor, not a nicety.
 *
 *   • NO LAYOUT SHIFT. The frame owns an aspect ratio and the images fill it
 *     absolutely, so nothing reflows as they decode. These pages are ranked on
 *     Core Web Vitals; a hero-sized image that shifts the page is a measurable
 *     cost to the traffic we are trying to convert.
 *
 *   • AN HONEST CAPTION SLOT. `attribution` is rendered verbatim under the
 *     frame. A before/after on a page selling renovations reads as OUR work, so
 *     whatever is true about a given pair has to be sayable in place — the
 *     component never invents a claim on the caller's behalf.
 */
export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeAlt,
  afterAlt,
  beforeLabel = 'Before',
  afterLabel = 'After',
  attribution,
  initialPosition = 58,
  /** Intrinsic size of BOTH images. Drives the reserved aspect ratio. */
  width = 1920,
  height = 1280,
  /** `eager` only if this is the page's largest-contentful element. */
  loading = 'lazy',
  className = '',
}: {
  beforeSrc: string;
  afterSrc: string;
  beforeAlt: string;
  afterAlt: string;
  beforeLabel?: string;
  afterLabel?: string;
  attribution?: string;
  initialPosition?: number;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  className?: string;
}) {
  const [reveal, setReveal] = useState(initialPosition);
  const frameRef = useRef<HTMLDivElement>(null);
  const labelId = useId();

  // Same clamp as the original: the edges stay visible at both extremes, so the
  // control never looks like a broken single image.
  const setFromClientX = (clientX: number, element: HTMLElement) => {
    const bounds = element.getBoundingClientRect();
    const percent = ((clientX - bounds.left) / bounds.width) * 100;
    setReveal(Math.min(92, Math.max(8, percent)));
  };

  return (
    <figure className={className}>
      <div
        ref={frameRef}
        className="relative select-none overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-[0_24px_60px_rgba(15,23,42,0.12)] touch-none"
        style={{ aspectRatio: `${width} / ${height}` }}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          setFromClientX(event.clientX, event.currentTarget);
        }}
        onPointerMove={(event) => {
          if ((event.buttons & 1) !== 1 && event.pointerType !== 'touch') return;
          setFromClientX(event.clientX, event.currentTarget);
        }}
      >
        <img
          src={beforeSrc}
          alt={beforeAlt}
          width={width}
          height={height}
          loading={loading}
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* The "after" is clipped from the left, so dragging right reveals more
            of the finished room — the direction people expect. */}
        <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${reveal}%)` }}>
          <img
            src={afterSrc}
            alt={afterAlt}
            width={width}
            height={height}
            loading={loading}
            decoding="async"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/25 to-transparent" />

        <span className="pointer-events-none absolute left-3 top-3 z-20 rounded-full border border-white/70 bg-white/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600 backdrop-blur-sm">
          {beforeLabel}
        </span>
        <span className="pointer-events-none absolute right-3 top-3 z-20 rounded-full border border-white/70 bg-white/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600 backdrop-blur-sm">
          {afterLabel}
        </span>

        <div
          className="pointer-events-none absolute inset-y-0 z-20"
          style={{ left: `${reveal}%`, transform: 'translateX(-50%)' }}
        >
          <div className="relative h-full w-px bg-white/85 shadow-[0_0_24px_rgba(255,255,255,0.25)]" />
          <div className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/85 bg-white/96 text-slate-700 shadow-[0_12px_28px_rgba(15,23,42,0.18)]">
            <ChevronLeft className="h-4 w-4" />
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>

        <span className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/70 bg-white/85 px-3 py-1.5 text-[11px] font-semibold text-slate-700 backdrop-blur-sm">
          Drag to compare
        </span>

        {/* The real control. Transparent and stretched over the frame so pointer
            users never see it, but it carries focus, keyboard and a11y. */}
        <label htmlFor={labelId} className="sr-only">
          Reveal the finished renovation
        </label>
        <input
          id={labelId}
          type="range"
          min={8}
          max={92}
          step={1}
          value={Math.round(reveal)}
          onChange={(event) => setReveal(Number(event.target.value))}
          aria-valuetext={`${Math.round(reveal)}% of the finished renovation hidden`}
          className="absolute inset-0 z-30 h-full w-full cursor-ew-resize opacity-0 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-blue-400/70"
        />
      </div>

      {attribution ? (
        <figcaption className="mt-3 text-center text-sm text-slate-500">{attribution}</figcaption>
      ) : null}
    </figure>
  );
}
