import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { BookConsultationBand } from '../components/BookConsultationCta';
import { CostDrawer } from '../components/project/CostDrawer';
import { PhotoMarquee } from '../components/project/PhotoMarquee';
import { ProjectDossierCompact } from '../components/project/ProjectDossierCompact';
import { BATHROOM_PROJECTS } from '../data/projects/bathroom';
import { BATHROOM_COST_TABS } from '../data/projects/costContent';

/**
 * The bathroom page, served at /bathroom-renovations.
 *
 * WHAT IT REPLACED, AND WHY. The previous build — still on disk as
 * BathroomRenovations.tsx, unrouted, as the rollback — was a cost guide with a
 * gallery bolted on: hero, before/after slider, twelve-tile grid, cost tables,
 * permits, CTA. Every section a full-width band in a fixed order, so the page
 * had to carry the union of everything anyone might want. It ran roughly twelve
 * screens on desktop and eighteen on a phone, with its pricing at the bottom.
 *
 * Two changes, not a rewrite of the content:
 *
 * 1. THE HORIZONTAL AXIS. A project is a two-column split with the
 *    photographs sticky, so one project reads as one screen instead of five.
 * 2. THE COST CONTENT MOVED, NOT DELETED. Table, drivers, quote warning and
 *    permits all live in CostDrawer, reachable from the masthead and from
 *    every dossier. Still rendered in the DOM for search; no longer four
 *    screens a reader must pass to reach anything else.
 *
 * The gallery is kept as a horizontal strip rather than a twelve-tile grid —
 * same photographs, one screen instead of four.
 *
 * Projects come from src/data/projects/bathroom.ts. Adding one is a data
 * change, not a component change — and any fact that file does not have renders
 * as a visible [NEEDS: …] marker rather than being invented. Read that file's
 * header before editing it: what may be claimed about a photographed job, and
 * what may not, is written down there.
 */

/** The loose finished shots. Not attached to any dossier — provenance unknown. */
const MORE_PHOTOS = [
  { src: '/images/bathroom-reno/bathroom-01.webp', alt: 'Finished bathroom renovation with tiled shower' },
  { src: '/images/bathroom-reno/bathroom-03.webp', alt: 'Renovated bathroom with glass shower enclosure' },
  { src: '/images/bathroom-reno/bathroom-05.webp', alt: 'Finished bathroom with freestanding fixtures' },
  { src: '/images/bathroom-reno/bathroom-06.webp', alt: 'Renovated bathroom with walk-in shower' },
  { src: '/images/bathroom-reno/bathroom-07.webp', alt: 'Bathroom renovation with custom tile work' },
  { src: '/images/bathroom-reno/bathroom-09.jpg', alt: 'Finished bathroom with tiled shower and vanity' },
  { src: '/images/bathroom-reno/bathroom-11.jpg', alt: 'Bathroom renovation with feature tile' },
  { src: '/images/bathroom-reno/bathroom-13.jpg', alt: 'Finished bathroom renovation detail' },
];

/**
 * The argument, as three claims rather than one paragraph.
 *
 * Same substance as the sidebar card this was promoted out of. Written the way
 * a foreman states things — short, concrete, nothing here that a homeowner
 * could not check.
 */
const THESIS_BEATS = [
  {
    kicker: 'What decides it',
    claim: 'Waterproofing, slope, drainage, ventilation.',
    body: 'The four things that determine whether a bathroom lasts three years or thirty.',
  },
  {
    kicker: 'When you see it',
    claim: 'Once. Before the tile goes on.',
    body: 'After that it is behind the wall for the life of the room, and no photograph will ever show it to you again.',
  },
  {
    kicker: 'What that costs',
    claim: 'A cheaper quote is a different answer.',
    body: 'Same room, same fixtures — a different decision about what happens underneath them.',
  },
];

export default function BathroomRenovationsNext() {
  const [costsOpen, setCostsOpen] = useState(false);
  const costsButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="bg-slate-50">
      {/* ---- Masthead. Short: it does not own a whole screen on its own.

           BOXED, like the rest of the site: a full-bleed background band with
           the content held inside the same max-w-7xl gutter the Navbar and
           every other page uses. An edge-to-edge grid reads as a different
           site sitting under the same header. ---- */}
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:min-h-[min(66vh,560px)] lg:grid-cols-2 lg:items-center lg:gap-12 lg:px-8 lg:py-16">
        <div className="flex flex-col justify-center">
          {/* The headline is about the renovation, not about the page.
              "Bathrooms, shown properly" described what this page was doing —
              a caption on our own work, which is of no interest to a homeowner
              and reads like an instruction someone forgot to delete. This says
              something about the bathroom instead, and it is the same claim the
              dark band below spends three panels supporting.

              "Ontario" and "bathroom renovations" stay in the opening sentence:
              this is an organic landing page and the live one ranks on both. */}
          <h1 className="max-w-[16ch] text-4xl font-bold leading-[1.05] tracking-[-0.025em] text-slate-900 md:text-5xl xl:text-6xl">
            Bathroom renovations that hold up
          </h1>
          <p className="mt-5 max-w-[52ch] text-lg leading-8 text-slate-600">
            Finished projects from across Ontario, completed by vetted
            contractors — shown one at a time, with the work behind the walls
            that decides how long a bathroom lasts.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to="/consultation/bathroom"
              data-analytics="masthead-cta"
              className="inline-flex items-center gap-2 rounded-xl bg-[#1B3C6C] px-7 py-4 font-bold text-white shadow-md transition-colors hover:bg-[#16325a]"
            >
              Book a free in-home consultation
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
            {/* Costs are one tap from the top of the page rather than a scroll
                to the bottom of it. */}
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

        {/* A card inside the box rather than a bleed off the right edge. */}
        <figure className="m-0 overflow-hidden rounded-[1.35rem] bg-slate-200 shadow-md">
          <img
            src="/images/bathroom-reno/bathroom-15.jpg"
            alt="Finished bathroom with tiled shower and vanity"
            width={2560}
            height={1706}
            fetchPriority="high"
            decoding="async"
            className="aspect-[4/3] w-full object-cover lg:aspect-[5/4]"
          />
        </figure>
      </section>

      {/* ---- The thesis.
           This is the strongest thing the page has to say, and it was landing
           as a heading with a paragraph beside it — the shape of an FAQ answer
           rather than of an argument. Three changes. The headline is short
           enough to read as a statement instead of a sentence you have to
           finish. The reasoning is broken into three beats, because it is three
           separate claims and a single block hid that. And the band is dark, so
           the one moment on the page that is making a case does not look like
           every other white section around it. ---- */}
      <section className="bg-slate-900 px-4 py-14 text-white sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
            Why bathrooms are different
          </p>
          <h2 className="mt-5 max-w-[14ch] text-3xl font-bold leading-[1.08] tracking-[-0.03em] sm:text-4xl lg:text-5xl">
            Every bathroom looks good on day one
          </h2>

          {/* gap-px over a translucent background draws the dividing rules
              without four extra border declarations. */}
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
            Recent bathrooms, start to finish
          </h2>

          <div className="mt-10 space-y-10 sm:space-y-14">
            {BATHROOM_PROJECTS.map((project, i) => (
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

      {/* ---- The rest of the photographs: a strip, not a twelve-tile grid.
              Same images the live gallery uses; one screen instead of four. ---- */}
      {/* ---- The rest of the photographs.
              A slow continuous drift rather than a static row: it reads as a
              set that continues past the edge, which is what a row cut off at
              the viewport is trying to say anyway. It is still a real scroller
              underneath — draggable, arrow-driven, wheel-scrollable — and the
              drift stops the moment anyone touches, hovers or tabs into it.
              See PhotoMarquee for the seamless-loop mechanics. ---- */}
      <section className="border-t border-slate-200/80 bg-white py-12 lg:py-16">
        <PhotoMarquee photos={MORE_PHOTOS} heading="More finished bathrooms" />
      </section>

      {/* ---- Costs again, at the bottom.
              The masthead button only catches a reader who decides to press it
              before scrolling. Anyone who simply scrolls the page would reach
              the closing CTA having never been shown a number — so the range is
              stated here in the open, with the full breakdown one tap away in
              the same drawer. ---- */}
      <section className="border-t border-slate-200/80 bg-slate-50 px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 rounded-[1.35rem] border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
          {/* A single bold band was the wrong shape for this.
              Printing "$20,000 – $30,000" in 36px tells a homeowner planning a
              smaller refresh that their project is not one we do, and it is not
              even true — a same-layout refresh can land well under it. The
              honest version leads with the thing that actually decides the
              number, which is scope, and keeps the figures as a supporting
              range rather than a headline promise. */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1B3C6C]">
              What it costs
            </p>
            <p className="mt-4 max-w-[22ch] text-2xl font-bold leading-tight tracking-[-0.03em] text-slate-900 sm:text-3xl">
              No two bathrooms price the same
            </p>
            {/* NO FLOOR FIGURE, DELIBERATELY. Nobody here knows what the
                cheapest job we would actually take is — a small powder room
                might be well under the $15,000 the cost table quotes — and a
                guessed floor is the kind of number a homeowner checks and
                catches us on. So the copy describes what moves the price,
                says plainly that smaller jobs come in lower, and names no
                bottom. That reads as true at $8,000 or at $13,000, and it does
                not turn away the reader planning something modest.

                Replace this with a real figure only when someone has pulled
                the lowest bathroom actually closed in the last year. */}
            {/* NO FIGURE ON THIS CARD, DELIBERATELY.
                It carried a bold "$40,000+" and that was the first thing the
                eye landed on — the highest number we have, set in the heaviest
                weight on the card, reading as a price rather than as a ceiling.
                A reader planning a powder room saw it and concluded we were not
                for them.

                The breakdown is one tap away in the drawer, so this card does
                not need to quote anything. It describes what moves the price
                and hands over to the button. No floor either: nobody here has
                confirmed the cheapest job we would actually take, and a guessed
                number is one a homeowner can catch us on. */}
            <p className="mt-4 max-w-[48ch] text-sm leading-7 text-slate-600">
              A refresh that keeps the layout and the plumbing where they are
              costs less than a full rebuild with the walls open, the plumbing
              moved and the waterproofing redone. A small room, like a powder
              room, less again.
            </p>
            <p className="mt-3 max-w-[48ch] text-sm leading-7 text-slate-500">
              Yours is priced in the home, with the room measured. We do not
              quote a bathroom we have not stood in.
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

      {/* The live band component, so the closing CTA is the real one. */}
      <BookConsultationBand
        slug="bathroom"
        heading="Get your bathroom priced properly, in person"
        body="A consultant measures the room, walks the layout and condition with you, and puts a real number on the project — with monthly financing from about $99 if you want it."
      />

      <CostDrawer
        open={costsOpen}
        onClose={() => setCostsOpen(false)}
        openerRef={costsButtonRef}
        tabs={BATHROOM_COST_TABS}
      />
    </div>
  );
}
