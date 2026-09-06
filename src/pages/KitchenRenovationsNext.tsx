import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { BookConsultationBand } from '../components/BookConsultationCta';
import { CostDrawer } from '../components/project/CostDrawer';
import { PhotoMarquee } from '../components/project/PhotoMarquee';
import { ProjectDossierCompact } from '../components/project/ProjectDossierCompact';
import { KITCHEN_MORE_PHOTOS, KITCHEN_PROJECTS } from '../data/projects/kitchen';
import { KITCHEN_COST_TABS } from '../data/projects/costContent';

/**
 * The kitchen page, served at /kitchen-renovations.
 *
 * Same structure as the bathroom page, from the same components — masthead,
 * thesis, dossiers, marquee, cost card, closing band. Adding a room is a data
 * file plus a page that wires it up; the layout is not duplicated.
 *
 * WHAT IT REPLACED. The previous build — still on disk as
 * KitchenRenovations.tsx, unrouted, as the rollback — was a cost guide with no
 * photographs at all. Not a weak gallery: none. It answered "how much" for a
 * $30-70k decision without ever showing a finished kitchen.
 *
 * THE THESIS IS DIFFERENT FROM THE BATHROOM'S, DELIBERATELY. A bathroom's
 * argument is what is hidden behind the tile. A kitchen's is not — a kitchen is
 * mostly visible. What goes wrong in a kitchen is the fit: doors that bind, a
 * counter seam over a dishwasher, a run that is 3mm out over ten feet, an
 * appliance that does not sit flush. Copying the bathroom's waterproofing
 * argument onto this page would have been the honest-sounding wrong answer.
 *
 * Projects come from src/data/projects/kitchen.ts; read that file's header
 * before editing it. Durations are absent there on purpose and the line does
 * not render until the office supplies kitchen day bands.
 */

const THESIS_BEATS = [
  {
    kicker: 'What you notice first',
    claim: 'Doors that line up. Drawers that close quietly.',
    body: 'A kitchen is judged by hand, every day, for twenty years. Gaps and binding hinges are what people actually live with.',
  },
  {
    kicker: 'What decides it',
    claim: 'Levelling, scribing, and the order of work.',
    body: 'Cabinets sit on floors that are never flat and against walls that are never straight. What makes a run look effortless is the hours spent before anything was screwed down.',
  },
  {
    kicker: 'What that costs',
    claim: 'The same cabinets, fitted twice as well.',
    body: 'Two kitchens can carry identical boxes and identical stone and still be tens of thousands apart. Most of that gap is labour and sequencing, not catalogue.',
  },
];

export default function KitchenRenovationsNext() {
  const [costsOpen, setCostsOpen] = useState(false);
  const costsButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="bg-slate-50">
      {/* ---- Masthead. Boxed to the same max-w-7xl gutter as the Navbar. ---- */}
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:min-h-[min(66vh,560px)] lg:grid-cols-2 lg:items-center lg:gap-12 lg:px-8 lg:py-16">
        <div className="flex flex-col justify-center">
          <h1 className="max-w-[16ch] text-4xl font-bold leading-[1.05] tracking-[-0.025em] text-slate-900 md:text-5xl xl:text-6xl">
            Kitchen renovations that fit
          </h1>
          <p className="mt-5 max-w-[52ch] text-lg leading-8 text-slate-600">
            Finished projects from across Ontario, completed by vetted
            contractors — shown one at a time, with what was actually done to
            each room.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to="/consultation/kitchen"
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
            src="/Kitchen/Kitchen1/kitchen01-1600w.webp"
            srcSet="/Kitchen/Kitchen1/kitchen01-800w.webp 800w, /Kitchen/Kitchen1/kitchen01-1600w.webp 1600w"
            sizes="(min-width: 1024px) 46vw, 100vw"
            alt="Finished kitchen with a quartz island, white cabinetry and a full pantry wall"
            width={1600}
            height={1067}
            fetchPriority="high"
            decoding="async"
            className="aspect-[4/3] w-full object-cover lg:aspect-[5/4]"
          />
        </figure>
      </section>

      {/* ---- The thesis. Fit, not waterproofing — see the note at the top. ---- */}
      <section className="bg-slate-900 px-4 py-14 text-white sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
            Why kitchens are different
          </p>
          <h2 className="mt-5 max-w-[16ch] text-3xl font-bold leading-[1.08] tracking-[-0.03em] sm:text-4xl lg:text-5xl">
            Anyone can hang a cabinet. Fitting a run is the job
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
            Recent kitchens, start to finish
          </h2>

          <div className="mt-10 space-y-10 sm:space-y-14">
            {KITCHEN_PROJECTS.map((project, i) => (
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

      {/* Landscape tiles here: kitchens are wide rooms and the portrait tile
          the bathroom page uses would crop the cabinetry run out of frame. */}
      <section className="border-t border-slate-200/80 bg-white py-12 lg:py-16">
        <PhotoMarquee
          photos={KITCHEN_MORE_PHOTOS}
          heading="More finished kitchens"
          aspect="aspect-[4/3]"
          tileWidth="w-[80vw] max-w-[380px]"
        />
      </section>

      {/* ---- Costs again, at the bottom, for anyone who only scrolls. ---- */}
      <section className="border-t border-slate-200/80 bg-slate-50 px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 rounded-[1.35rem] border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
          {/* No figure on this card, as on the bathroom page. The breakdown is
              one tap away, and leading with the top of the range reads as a
              price rather than a ceiling. */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1B3C6C]">
              What it costs
            </p>
            <p className="mt-4 max-w-[22ch] text-2xl font-bold leading-tight tracking-[-0.03em] text-slate-900 sm:text-3xl">
              No two kitchens price the same
            </p>
            <p className="mt-4 max-w-[48ch] text-sm leading-7 text-slate-600">
              Keeping the layout and reusing the plumbing and electrical costs
              less than moving the sink, taking out a wall and rewiring the room.
              Cabinetry and counter material move it further than anything else.
            </p>
            <p className="mt-3 max-w-[48ch] text-sm leading-7 text-slate-500">
              Yours is priced in the home, with the room measured. We do not
              quote a kitchen we have not stood in.
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
        slug="kitchen"
        heading="Get your kitchen priced properly, in person"
        body="A consultant measures the room, walks the layout and condition with you, and puts a real number on the project — with monthly financing from about $99 if you want it."
      />

      <CostDrawer
        open={costsOpen}
        onClose={() => setCostsOpen(false)}
        openerRef={costsButtonRef}
        tabs={KITCHEN_COST_TABS}
      />
    </div>
  );
}
