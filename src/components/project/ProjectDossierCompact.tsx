import { Link } from 'react-router-dom';
import { ArrowRight, Check, Clock, MapPin } from 'lucide-react';
import type { Project } from '../../data/projects/types';
import { STAGE_LABELS } from '../../data/projects/types';
import { NeedsMarker } from './NeedsMarker';
import { ProjectPhotos } from './ProjectPhotos';

/**
 * One project, one screen.
 *
 * An earlier version stacked every layer in a single narrow column and ran
 * five screens per project, which is what made the page feel endless — on
 * desktop especially, where two thirds of the width sat empty.
 *
 * The fix is the horizontal axis. From `lg` up the photographs STICK while the
 * detail column scrolls past them, so a project occupies roughly one viewport
 * instead of five. Below `lg` it collapses to one column and the sticky rule is
 * dropped, because sticky media on a phone just eats the screen.
 *
 * The media half is ProjectPhotos: a lead frame plus exactly two supporting
 * frames, with any further angles behind a "+N more" lightbox. Three is the
 * number that fills the column without outrunning the text beside it.
 *
 * Most projects are the second kind and that is not a shortcoming. They were
 * finished before any process captured demolition or rough-in, so `beneath` is
 * empty and simply renders nothing — no placeholder, no apology.
 *
 * THERE IS NO PRICE ROW. Pricing happens in the home with the room measured;
 * see the note in data/projects/types.ts.
 */
/**
 * Accent, so a dossier sits inside its page's own palette rather than dragging
 * navy onto a page built in green. Matches the accents BookConsultationCta
 * already offers.
 */
const ACCENT = {
  blue: {
    label: 'text-[#1B3C6C]',
    check: 'text-[#1B3C6C]',
    cta: 'bg-[#1B3C6C] hover:bg-[#16325a]',
    ghost: 'text-[#1B3C6C]',
  },
  emerald: {
    label: 'text-emerald-800',
    check: 'text-emerald-600',
    cta: 'bg-emerald-700 hover:bg-emerald-600',
    ghost: 'text-emerald-800',
  },
} as const;

export function ProjectDossierCompact({
  project,
  index,
  eager = false,
  onOpenCosts,
  accent = 'blue',
  costsLabel = 'What it costs',
}: {
  project: Project;
  index: number;
  /** True for the first dossier only — it is near the top of the page. */
  eager?: boolean;
  onOpenCosts: () => void;
  accent?: keyof typeof ACCENT;
  /** The secondary button's label, where a page calls its costs something else. */
  costsLabel?: string;
}) {
  const a = ACCENT[accent];
  return (
    <article
      id={project.slug}
      className="scroll-mt-24 border-t border-slate-200/80 pt-8 first:border-t-0 first:pt-0 sm:pt-12"
    >
      <div className="grid items-start gap-6 lg:grid-cols-[1.15fr_1fr] lg:gap-12">
        {/* ---- The finished space. Sticks on desktop.
             Three frames, never more — see ProjectPhotos for why, and for
             where the remaining angles went. ---- */}
        <div className="lg:sticky lg:top-24">
          <ProjectPhotos
            photos={project.finished}
            beforeAfter={project.beforeAfter}
            eager={eager}
          />
        </div>

        {/* ---- The detail column ---- */}
        <div>
          <p className={`text-xs font-bold uppercase tracking-[0.18em] ${a.label}`}>
            Project {String(index + 1).padStart(2, '0')}
          </p>
          <h3 className="mt-3 text-xl font-bold tracking-[-0.02em] text-slate-900 sm:text-2xl">
            {project.title}
          </h3>

          {/* Region, not a town. A homeowner who let us photograph their
              bathroom did not agree to have their street published with it. */}
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600">
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              {project.location ?? <NeedsMarker label="region" />}
            </span>
            {project.phases.length > 0 ? (
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                {project.phases.map((p) => p.duration).join(' · ')} on site
              </span>
            ) : null}
          </div>

          {/* Rendered only when the photographs exist. Empty renders nothing. */}
          {project.beneath.length > 0 ? (
            <div className="mt-7">
              <p className={`text-xs font-bold uppercase tracking-[0.18em] ${a.label}`}>
                Beneath the surface
              </p>
              <ol className="mt-4 space-y-5">
                {project.beneath.map((photo) => (
                  <li key={photo.src} className="flex gap-3">
                    <img
                      src={photo.src}
                      alt={photo.alt}
                      width={photo.width}
                      height={photo.height}
                      loading="lazy"
                      decoding="async"
                      className="h-20 w-20 shrink-0 rounded-xl bg-slate-200 object-cover"
                    />
                    <div>
                      <p className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-slate-500">
                        {STAGE_LABELS[photo.stage]}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-800">{photo.why}</p>
                      <p className="mt-1 border-l-2 border-amber-300 pl-3 text-sm leading-6 text-slate-600">
                        <span className="font-semibold text-slate-700">
                          A cheaper quote:
                        </span>{' '}
                        {photo.skipped}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          {/* ---- What was done ---- */}
          <div className="mt-7">
            <p className={`text-xs font-bold uppercase tracking-[0.18em] ${a.label}`}>
              What was done
            </p>
            {project.scope.length === 0 ? (
              <p className="mt-3">
                <NeedsMarker label="scope" />
              </p>
            ) : (
              <ul className="mt-4 space-y-2.5">
                {project.scope.map((line) => (
                  <li key={line} className="flex gap-2.5">
                    <Check
                      className={`mt-1 h-4 w-4 shrink-0 ${a.check}`}
                      aria-hidden="true"
                    />
                    <span className="text-sm leading-6 text-slate-700">{line}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ---- The consultation ---- */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to={`/consultation/${project.room}`}
              data-analytics="dossier-cta"
              data-project={project.slug}
              className={`inline-flex items-center gap-2 rounded-xl px-6 py-4 font-bold text-white shadow-md transition-colors ${a.cta}`}
            >
              Price my version of this
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={onOpenCosts}
              className={`rounded-[0.95rem] border border-slate-200 bg-white px-4 py-3 text-sm font-bold shadow-sm transition hover:bg-slate-50 ${a.ghost}`}
            >
              {costsLabel}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
