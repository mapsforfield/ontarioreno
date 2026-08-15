import { useCallback, useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Expand } from 'lucide-react';

export type GalleryPhoto = {
  src: string;
  /** Describes the ROOM, for screen readers and for search. Never a sales line. */
  alt: string;
  /** Shown under the tile and in the lightbox. Keep it to what is verifiable. */
  caption?: string;
  width: number;
  height: number;
};

/**
 * Photo grid with a lightbox, for the renovation guide pages.
 *
 * Sits BELOW the before/after on purpose. The slider does the persuading —
 * it shows change — and this answers the question that follows it: "fine, but
 * what do finished ones actually look like?" A grid on its own is decoration;
 * a grid after a transformation is evidence.
 *
 * Every photo is declared with its intrinsic width and height and every tile
 * reserves a fixed 3:2 box, so a page full of images cannot shift as they
 * decode. These are organic-search landing pages ranked partly on Core Web
 * Vitals, and image-heavy pages are exactly where that score is usually lost.
 * Tiles are lazy by default; the caller can eager-load the first row if the
 * gallery ever sits above the fold.
 *
 * The lightbox is a real dialog: Escape closes it, arrows move between photos,
 * focus moves into it on open and returns to the tile that opened it on close,
 * and the page behind it is inert to scroll. A gallery that traps a keyboard
 * user is worse than no gallery.
 *
 * Captions carry no implied authorship. What is true about a given photo is
 * the caller's to state — this component will render whatever it is handed and
 * invents nothing.
 */
export function ProjectGallery({
  photos,
  eagerCount = 0,
  aspect = '3/2',
  className = '',
}: {
  photos: GalleryPhoto[];
  /** How many leading tiles to load eagerly. Only above the fold. */
  eagerCount?: number;
  /**
   * Tile shape, as a CSS aspect-ratio.
   *
   * Defaults to the landscape 3/2 the basement gallery was built around, so
   * that page is unaffected. Bathrooms are the reason this is a prop: the
   * photos are shot PORTRAIT, and forcing a 3-by-2 tile crops the top and
   * bottom off every one of them — which on a bathroom means losing the shower
   * and the vanity, the two things the photo exists to show. The tile matches
   * the subject rather than the subject being cut to fit the tile.
   */
  aspect?: string;
  className?: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const triggersRef = useRef<(HTMLButtonElement | null)[]>([]);
  const closeRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpenIndex((current) => {
      // Return focus to the tile that opened the lightbox, or the keyboard user
      // is dumped back at the top of the document with no idea where they were.
      if (current !== null) triggersRef.current[current]?.focus();
      return null;
    });
  }, []);

  const step = useCallback(
    (delta: number) => {
      setOpenIndex((current) =>
        current === null ? null : (current + delta + photos.length) % photos.length
      );
    },
    [photos.length]
  );

  useEffect(() => {
    if (openIndex === null) return;
    closeRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowRight') step(1);
      if (event.key === 'ArrowLeft') step(-1);
    };
    document.addEventListener('keydown', onKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [openIndex, close, step]);

  const active = openIndex === null ? null : photos[openIndex];

  return (
    <>
      <ul className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>
        {photos.map((photo, index) => (
          <li key={photo.src}>
            <button
              type="button"
              ref={(node) => {
                triggersRef.current[index] = node;
              }}
              onClick={() => setOpenIndex(index)}
              className="group block w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
              aria-label={`View larger: ${photo.alt}`}
            >
              <span
                className="relative block overflow-hidden"
                style={{ aspectRatio: aspect }}
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  width={photo.width}
                  height={photo.height}
                  loading={index < eagerCount ? 'eager' : 'lazy'}
                  decoding="async"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                />
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                <span className="pointer-events-none absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/92 text-slate-700 opacity-0 shadow transition group-hover:opacity-100">
                  <Expand className="h-4 w-4" />
                </span>
              </span>
              {photo.caption ? (
                <span className="block px-4 py-3 text-sm font-semibold text-slate-700">
                  {photo.caption}
                </span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>

      {active ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={active.alt}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm"
          onClick={close}
        >
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/12 text-white transition hover:bg-white/22 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
          >
            <X className="h-5 w-5" />
          </button>

          {photos.length > 1 ? (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  step(-1);
                }}
                aria-label="Previous photo"
                className="absolute left-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/12 text-white transition hover:bg-white/22 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40 sm:left-6"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  step(1);
                }}
                aria-label="Next photo"
                className="absolute right-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/12 text-white transition hover:bg-white/22 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40 sm:right-6"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          ) : null}

          <figure
            className="max-h-full w-full max-w-5xl"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={active.src}
              alt={active.alt}
              width={active.width}
              height={active.height}
              className="mx-auto max-h-[78vh] w-auto rounded-2xl object-contain shadow-2xl"
            />
            <figcaption className="mt-4 text-center text-sm text-white/80">
              {active.caption ? <span className="font-semibold">{active.caption}</span> : null}
              <span className="ml-2 text-white/50">
                {(openIndex ?? 0) + 1} of {photos.length}
              </span>
            </figcaption>
          </figure>
        </div>
      ) : null}
    </>
  );
}
