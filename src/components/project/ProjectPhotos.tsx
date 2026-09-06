import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { Photo } from '../../data/projects/types';

/**
 * The media half of a dossier: a lead frame and exactly two supporting frames.
 *
 * THE THREE-PHOTO RULE. Some of these jobs were shot from five angles. Showing
 * all five stacked the column two rows taller than the text beside it, so the
 * dossier stopped being one screen and the page grew a ragged tail of
 * half-empty rows. Three is the number that fills the column and stops.
 *
 * The rest are not thrown away — the third tile carries a "+N more" plate and
 * opens every angle in a lightbox. Depth on demand, without the depth costing
 * anyone who did not ask for it a screen of scrolling.
 *
 * A real dialog: Escape closes, arrows move, focus enters on open and returns
 * to the tile that opened it, and the page behind cannot scroll. Same standard
 * as the ProjectGallery lightbox already in the repo.
 */
export function ProjectPhotos({
  photos,
  beforeAfter,
  eager = false,
}: {
  photos: Photo[];
  beforeAfter?: { before: Photo; after: Photo };
  eager?: boolean;
}) {
  const [lightboxAt, setLightboxAt] = useState<number | null>(null);
  const openerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const [lead, ...rest] = photos;

  /* Two supporting tiles. Where a before/after pair exists it IS the pair —
     it says more than two more finished angles ever could. */
  const supporting = beforeAfter
    ? [
        { photo: beforeAfter.before, label: 'Before' },
        { photo: beforeAfter.after, label: 'After' },
      ]
    : rest.slice(0, 2).map((photo) => ({ photo, label: null }));

  /* What the "+N" covers: every angle, so the lightbox is the whole set. */
  const hidden = beforeAfter ? rest.length : Math.max(0, rest.length - 2);

  const close = useCallback(() => {
    setLightboxAt(null);
    openerRef.current?.focus();
  }, []);

  const step = useCallback(
    (delta: number) =>
      setLightboxAt((at) =>
        at === null ? at : (at + delta + photos.length) % photos.length,
      ),
    [photos.length],
  );

  useEffect(() => {
    if (lightboxAt === null) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    document.addEventListener('keydown', onKey);

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [lightboxAt, close, step]);

  const current = lightboxAt === null ? null : photos[lightboxAt];

  return (
    <div>
      <figure className="relative m-0 overflow-hidden rounded-[1.35rem] bg-slate-200 shadow-sm">
        <img
          src={lead.src}
          srcSet={lead.srcSet}
          sizes="(min-width: 1024px) 42vw, 100vw"
          alt={lead.alt}
          width={lead.width}
          height={lead.height}
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : undefined}
          decoding="async"
          className="aspect-[16/10] w-full object-cover"
        />
        <figcaption className="absolute left-3 top-3 rounded-full bg-slate-900/75 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.06em] text-white">
          Finished
        </figcaption>
      </figure>

      {supporting.length > 0 ? (
        <div className="mt-2 grid grid-cols-2 gap-2">
          {supporting.map(({ photo, label }, i) => {
            const isLast = i === supporting.length - 1;
            const showMore = isLast && hidden > 0;

            return (
              <button
                key={photo.src}
                type="button"
                ref={showMore ? openerRef : undefined}
                onClick={() => setLightboxAt(photos.indexOf(photo) === -1 ? 0 : photos.indexOf(photo))}
                className="group relative m-0 block overflow-hidden rounded-[1.35rem] bg-slate-200 p-0 shadow-sm"
                aria-label={showMore ? `See all ${photos.length} photos` : photo.alt}
              >
                <img
                  src={photo.src}
                  srcSet={photo.srcSet}
                  sizes="(min-width: 1024px) 21vw, 50vw"
                  alt={photo.alt}
                  width={photo.width}
                  height={photo.height}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                />
                {label ? (
                  <span className="absolute left-3 top-3 rounded-full bg-slate-900/75 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.06em] text-white">
                    {label}
                  </span>
                ) : null}
                {showMore ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-slate-900/55 text-base font-bold text-white transition group-hover:bg-slate-900/65">
                    +{hidden} more
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}

      {current ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/90 p-4"
          onClick={close}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Project photos"
            tabIndex={-1}
            className="relative max-h-full w-full max-w-5xl outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={current.src}
              srcSet={current.srcSet}
              sizes="90vw"
              alt={current.alt}
              className="mx-auto max-h-[82vh] w-auto rounded-xl object-contain"
            />
            <p className="mt-3 text-center text-sm text-slate-300">
              {lightboxAt! + 1} of {photos.length}
            </p>

            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute -top-2 right-0 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous photo"
              className="absolute left-0 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next photo"
              className="absolute right-0 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
