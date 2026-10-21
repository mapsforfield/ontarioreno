import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export type TypePhoto = { src: string; alt: string };

/**
 * The photo strip at the top of each window-type card on /windows.
 *
 * A native scroll-snap row rather than a carousel library: it swipes with a
 * thumb on a phone for free, the arrows only nudge the scroll position, and
 * there is no autoplay to fight a reader. Every image is lazy: this section
 * sits well below the fold and must not compete with the hero for bandwidth.
 *
 * Files are pre-cut to 4:3 at 480w and 800w (public/images/windows/<type>/),
 * so the browser picks the smaller one on a phone.
 *
 * These photos illustrate the TYPE of window. Most are not our installs, so
 * nothing here may caption them as our work.
 */
export function TypePhotos({ photos, label }: { photos: TypePhoto[]; label: string }) {
  const strip = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  // Steps from where the strip actually IS, not from `index`: a swipe that is
  // still settling has not reported its final position yet, and stepping from
  // a stale index would skip a photo or stall on the same one.
  const step = (dir: 1 | -1) => {
    const el = strip.current;
    if (!el) return;
    const current = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
    const next = Math.max(0, Math.min(photos.length - 1, current + dir));
    setIndex(next);
    el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' });
  };

  return (
    <div className="relative overflow-hidden rounded-t-[1.35rem] bg-slate-100">
      <div
        ref={strip}
        onScroll={(e) => {
          const el = e.currentTarget;
          setIndex(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
        }}
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="region"
        aria-label={`${label} photos`}
        tabIndex={0}
      >
        {photos.map((p) => (
          <img
            key={p.src}
            src={`${p.src}-800w.webp`}
            srcSet={`${p.src}-480w.webp 480w, ${p.src}-800w.webp 800w`}
            sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
            alt={p.alt}
            width={800}
            height={600}
            loading="lazy"
            decoding="async"
            className="aspect-[4/3] w-full shrink-0 snap-center object-cover"
          />
        ))}
      </div>

      {photos.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => step(-1)}
            disabled={index === 0}
            aria-label={`Previous ${label} photo`}
            className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-sm transition hover:bg-white disabled:opacity-0"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            disabled={index === photos.length - 1}
            aria-label={`Next ${label} photo`}
            className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-sm transition hover:bg-white disabled:opacity-0"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
          <span className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-slate-900/70 px-2.5 py-1 text-xs font-semibold text-white">
            {index + 1} / {photos.length}
          </span>
        </>
      )}
    </div>
  );
}
