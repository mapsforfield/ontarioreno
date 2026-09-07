import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { BookConsultationBand } from '../components/BookConsultationCta';
import { CostDrawer } from '../components/project/CostDrawer';
import { PhotoMarquee } from '../components/project/PhotoMarquee';
import { ProjectDossierCompact } from '../components/project/ProjectDossierCompact';
import { BASEMENT_MORE_PHOTOS, BASEMENT_PROJECTS } from '../data/projects/basement';
import { BASEMENT_COST_TABS } from '../data/projects/costContent';

/**
 * The basements page, served at /basements.
 *
 * Third room on the same components as the bathroom and kitchen pages. The
 * previous build — still on disk as Basements.tsx, unrouted, as the rollback —
 * already had a before/after slider and a nine-tile gallery, so it was in
 * better shape than the kitchen page was. What it did not do was show any one
 * job as a job.
 *
 * THE THESIS IS THE ROOM'S OWN, NOT A COPY.
 *
 *   bathroom  → what is hidden behind the tile
 *   kitchen   → fit, levelling and sequencing
 *   basement  → whether the space is dry, warm and legal to occupy
 *
 * A basement is the only one of the three where the answer can be "you are not
 * allowed to use it that way", and where the invisible work — moisture,
 * insulation, headroom, egress, fire separation — is most of the budget. That
 * is the argument, and it is the one the cost drawer's own figures support.
 *
 * ON THE WORD "LEGAL": this page names code FEATURES that are visible in the
 * photographs and never asserts the legal STATUS of a finished basement. See
 * the header of src/data/projects/basement.ts — that distinction is the whole
 * reason the note exists, and the site has a separate legal-suite page for the
 * subject itself.
 */

const THESIS_BEATS = [
  {
    kicker: 'What decides it',
    claim: 'Dry, warm, and allowed to be used that way.',
    body: 'Moisture control, insulation, headroom, egress and fire separation. Settled before a single wall is painted, and invisible once it is.',
  },
  {
    kicker: 'Where the money goes',
    claim: 'Mostly into things you will never see again.',
    body: 'On any other renovation the finishes carry the budget. Down here the slab, the framing and the paperwork carry it.',
  },
  {
    kicker: 'What that costs',
    claim: 'A cheaper basement quote is a smaller job.',
    body: 'Leave out the waterproofing, the fire separation, the egress window or the permit drawings and the number falls. So does what you are actually getting.',
  },
];

export default function BasementsNext() {
  const [costsOpen, setCostsOpen] = useState(false);
  const costsButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="bg-slate-50">
      {/* ---- Masthead. Boxed to the same max-w-7xl gutter as the Navbar. ---- */}
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:min-h-[min(66vh,560px)] lg:grid-cols-2 lg:items-center lg:gap-12 lg:px-8 lg:py-16">
        <div className="flex flex-col justify-center">
          <h1 className="max-w-[17ch] text-4xl font-bold leading-[1.05] tracking-[-0.025em] text-slate-900 md:text-5xl xl:text-6xl">
            Basements finished properly
          </h1>
          <p className="mt-5 max-w-[52ch] text-lg leading-8 text-slate-600">
            Finished lower levels from across Ontario, completed by vetted
            contractors — shown one at a time, with what was actually done to
            each space.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to="/consultation/basement"
              data-analytics="masthead-cta"
              className="inline-flex items-center gap-2 rounded-xl bg-[#1B3C6C] px-7 py-4 font-bold text-white shadow-md transition-colors hover:bg-[#16325a]"
            >
              Book a free in-home consultation
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
            <button
              ref={costsButtonRef}
              type="button"
              onClick={() => setCostsOpen(true)}
              className="rounded-[0.95rem] border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-[#1B3C6C] shadow-sm transition hover:bg-slate-50"
            >
              What it costs
            </button>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Financing available from about $99/month.
          </p>
        </div>

        <figure className="m-0 overflow-hidden rounded-[1.35rem] bg-slate-200 shadow-md">
          <img
            src="/Basement/Basement%203/55-1600w.webp"
            srcSet="/Basement/Basement%203/55-800w.webp 800w, /Basement/Basement%203/55-1600w.webp 1600w"
            sizes="(min-width: 1024px) 46vw, 100vw"
            alt="Finished basement with a projection media wall and a bar beyond"
            width={1600}
            height={1066}
            fetchPriority="high"
            decoding="async"
            className="aspect-[4/3] w-full object-cover lg:aspect-[5/4]"
          />
        </figure>
      </section>

      {/* ---- The thesis. The basement's own argument — see the note above. ---- */}
      <section className="bg-slate-900 px-4 py-14 text-white sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
            Why basements are different
          </p>
          <h2 className="mt-5 max-w-[17ch] text-3xl font-bold leading-[1.08] tracking-[-0.03em] sm:text-4xl lg:text-5xl">
            The expensive part is finished before the drywall goes up
          </h2>

          <div className="mt-10 grid gap-px overflow-hidden rounded-[1.35rem] bg-white/10 sm:mt-12 lg:grid-cols-3">
            {THESIS_BEATS.map((beat) => (
              <div key={beat.kicker} className="bg-slate-900 p-6 lg:p-8">
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-blue-300">
                  {beat.kicker}
                </p>
                <p className="mt-4 text-lg font-bold leading-snug tracking-[-0.02em] text-white">
                  {beat.claim}
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-300">{beat.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- The dossiers ---- */}
      <section className="px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1B3C6C]">
            Recent work
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-[-0.025em] text-slate-900 md:text-3xl">
            Recent basements, start to finish
          </h2>

          <div className="mt-10 space-y-10 sm:space-y-14">
            {BASEMENT_PROJECTS.map((project, i) => (
              <ProjectDossierCompact
                key={project.slug}
                project={project}
                index={i}
                eager={i === 0}
                onOpenCosts={() => setCostsOpen(true)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Landscape tiles: a basement is a wide space, and the bathroom page's
          portrait tile crops the span the photograph exists to show. */}
      <section className="border-t border-slate-200/80 bg-white py-12 lg:py-16">
        <PhotoMarquee
          photos={BASEMENT_MORE_PHOTOS}
          heading="More finished basements"
          aspect="aspect-[4/3]"
          tileWidth="w-[80vw] max-w-[380px]"
        />
      </section>

      {/* ---- Costs again, at the bottom, for anyone who only scrolls. ---- */}
      <section className="border-t border-slate-200/80 bg-slate-50 px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 rounded-[1.35rem] border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1B3C6C]">
              What it costs
            </p>
            <p className="mt-4 max-w-[24ch] text-2xl font-bold leading-tight tracking-[-0.03em] text-slate-900 sm:text-3xl">
              A family basement and a legal suite are different jobs
            </p>
            <p className="mt-4 max-w-[48ch] text-sm leading-7 text-slate-600">
              Finishing a lower level for your own family costs less than
              building a self-contained apartment with its own kitchen,
              bathroom, entrance and permits. Ceiling height, moisture and
              panel capacity move both further than the finishes do.
            </p>
            <p className="mt-3 max-w-[48ch] text-sm leading-7 text-slate-500">
              Yours is priced in the home, with the space measured. We do not
              quote a basement we have not stood in.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCostsOpen(true)}
            className="shrink-0 rounded-xl border border-slate-200 bg-white px-6 py-4 font-bold text-[#1B3C6C] shadow-sm transition hover:bg-slate-50"
          >
            See the full breakdown
          </button>
        </div>
      </section>

      <BookConsultationBand
        slug="basement"
        heading="Get your basement priced properly, in person"
        body="A consultant measures the space, walks the layout and condition with you, and puts a real number on the project — with monthly financing from about $99 if you want it."
      />

      <CostDrawer
        open={costsOpen}
        onClose={() => setCostsOpen(false)}
        openerRef={costsButtonRef}
        tabs={BASEMENT_COST_TABS}
      />
    </div>
  );
}
