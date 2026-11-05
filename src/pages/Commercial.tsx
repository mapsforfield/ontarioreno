import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { PageMeta } from '../components/PageMeta';
import { NeedsMarker } from '../components/project/NeedsMarker';
import { CommercialInquiryForm } from '../components/commercial/CommercialInquiryForm';
import type { CommercialPath } from '../../lib/commercial-inquiry';

/**
 * /commercial: commercial millwork and interior renovation, for general
 * contractors tendering a job and businesses planning one.
 *
 * Presented as OntarioReno, in the same voice as every other page: we take the
 * work on, and a vetted trade from the partner network builds it under a
 * written contract. No contractor is named.
 *
 * The positioning is the fixed date. The homeowner pages sell money; a
 * commercial buyer is buying certainty about a day that cannot move: a bid
 * closing, a store opening, a move-in, the first day of school. Keep new copy
 * written from that seat rather than as a list of what we make.
 *
 * No invented credentials, capacity or project history. Anything we have not
 * confirmed is a loud NeedsMarker, so it cannot go live looking finished.
 *
 * Photos: everything under "Recent commercial work" is a real job. The hero is
 * a design RENDER, so it must never be captioned or moved there as past work.
 * Captions name no client and no contractor.
 */

const PROOF: { label: string; value: string | null; needs: string }[] = [
  { label: 'WSIB', value: 'Clearance verified on every trade', needs: 'clearance status' },
  { label: 'Liability insurance', value: '$2M minimum on every trade', needs: 'coverage amount' },
  { label: 'Service area', value: 'Greater Toronto Area & Southern Ontario', needs: 'regions covered' },
  { label: 'Project size', value: '$10K – $500K+ Millwork & Fit‑Outs', needs: 'typical job range' },
];

const IMG = '/images/commercial';

/**
 * Filter tabs over the recent work. A tab only appears once a job carries its
 * category, so Office Interiors stays hidden until there is a real office job
 * to show: an empty tab tells that visitor we have never done their kind of work.
 */
const WORK_CATEGORIES = ['Hospitality & Restaurants', 'Retail & Salons', 'Office Interiors', 'Schools'] as const;
type WorkCategory = (typeof WORK_CATEGORIES)[number];
type WorkFilter = WorkCategory | 'All';

/** Real jobs with an in-progress and a finished view. */
const CASES: {
  title: string;
  category: WorkCategory;
  detail: string;
  during: { src: string; alt: string };
  finished: { src: string; alt: string };
}[] = [
  {
    title: 'Restaurant fit-out',
    category: 'Hospitality & Restaurants',
    detail: 'Banquette seating, a feature wall and a slatted wood ceiling, built into a brick storefront.',
    during: { src: `${IMG}/restaurant-during.webp`, alt: 'Restaurant space during construction with protected floors and exposed brick' },
    finished: { src: `${IMG}/restaurant-finished.webp`, alt: 'Finished restaurant with a tufted leather banquette along a green feature wall' },
  },
  {
    title: 'Barbershop build-out',
    category: 'Retail & Salons',
    detail: 'From roughed-in walls to a row of custom barber stations with built-in storage.',
    during: { src: `${IMG}/barbershop-during.webp`, alt: 'Barbershop wall during construction with wiring roughed in' },
    finished: { src: `${IMG}/barbershop-finished.webp`, alt: 'The same wall finished with a row of custom wood barber stations and mirrors' },
  },
];

const GALLERY: { src: string; title: string; category: WorkCategory; detail: string; alt: string }[] = [
  { src: `${IMG}/cafe-arches.webp`, title: 'Arched back wall', category: 'Hospitality & Restaurants', detail: 'Café', alt: 'Black café wall with lit wood-lined arches above a display case' },
  { src: `${IMG}/cafe-window.webp`, title: 'Pass-through window', category: 'Hospitality & Restaurants', detail: 'Café', alt: 'Wood-framed pass-through window with a matching counter' },
  { src: `${IMG}/restaurant-washroom.webp`, title: 'Accessible washroom', category: 'Hospitality & Restaurants', detail: 'Restaurant', alt: 'Restaurant washroom with grab bars, patterned tile and green walls' },
  { src: `${IMG}/barbershop-stations.webp`, title: 'Barber stations', category: 'Retail & Salons', detail: 'Barbershop', alt: 'Long barbershop with custom wood stations along one wall and panelled walls at the far end' },
  { src: `${IMG}/office-feature-wall.webp`, title: 'Feature wall', category: 'Office Interiors', detail: 'Office', alt: 'Lit office feature wall with angled metal inlays' },
  { src: `${IMG}/lab-islands.webp`, title: 'Science lab islands', category: 'Schools', detail: 'School', alt: 'School science lab with island casework, sinks and glass-front cabinets' },
  { src: `${IMG}/lab-casework.webp`, title: 'Lab casework', category: 'Schools', detail: 'School', alt: 'School lab wall cabinets with glass doors above a black countertop' },
];

/** Sideways swipe on a phone, without a visible scrollbar. */
const SWIPE = 'overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

const WORK_TABS: WorkFilter[] = [
  'All',
  ...WORK_CATEGORIES.filter((c) => [...CASES, ...GALLERY].some((job) => job.category === c)),
];

const BUYERS: { image: string; alt: string; date: string; title: string; body: string }[] = [
  {
    image: `${IMG}/card-contractors.webp`,
    alt: 'Banquette seating and wall panels being installed in a long dining room',
    date: 'Bid closing',
    title: 'General contractors',
    body: "Millwork is the last trade in and the first thing your client sees. You'll know within one business day if we're bidding, so you aren't short a number on closing day.",
  },
  {
    image: `${IMG}/card-retail.webp`,
    alt: 'Restaurant counter under a slatted wood ceiling',
    date: 'Opening day',
    title: 'Retail and restaurants',
    body: 'Every day past opening is lost sales with the rent already running. We plan back from your opening and your landlord\'s requirements.',
  },
  {
    image: `${IMG}/card-offices.webp`,
    alt: 'Lit feature wall with angled metal inlays',
    date: 'Move-in',
    title: 'Offices and property managers',
    body: 'Tenants have move-in dates and neighbours who stay open. We plan the work around the people still using the building.',
  },
  {
    image: `${IMG}/card-schools.webp`,
    alt: 'School science lab with island casework and glass-front cabinets',
    date: 'First day back',
    title: 'Schools, libraries and institutions',
    body: 'Public buildings run on a calendar. We plan the work around the time the building can be closed.',
  },
];

const BUILDS = [
  'Reception desks',
  'Feature walls',
  'Retail displays',
  'Bar counters',
  'Banquette seating',
  'Wall panelling',
  'Custom cabinetry',
  'Interior renovations',
];

const STEPS = [
  { title: 'Send the package', body: 'Upload the drawings and specs or paste a link, with your closing date.' },
  { title: 'Know where you stand', body: "Within one business day you'll know if we're bidding and if anything in the set is missing." },
  { title: 'Get a number you can carry', body: 'Priced by line item, with what is included and excluded spelled out.' },
  { title: 'Built around your site', body: 'A vetted trade fabricates and installs under a written contract, on your schedule.' },
];

export default function Commercial() {
  const [path, setPath] = useState<CommercialPath>('tender');
  const [workFilter, setWorkFilter] = useState<WorkFilter>('All');
  const cases = CASES.filter((job) => workFilter === 'All' || job.category === workFilter);
  const gallery = GALLERY.filter((item) => workFilter === 'All' || item.category === workFilter);

  // Phones only: keep a way to the form in reach on a long page. Hidden while
  // the hero's own buttons are on screen, and from the form downward.
  const heroButtons = useRef<HTMLDivElement>(null);
  const [heroInView, setHeroInView] = useState(true);
  const [reachedForm, setReachedForm] = useState(false);
  useEffect(() => {
    const form = document.getElementById('inquiry');
    if (!heroButtons.current || !form) return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === form) setReachedForm(entry.isIntersecting || entry.boundingClientRect.top < 0);
        else setHeroInView(entry.isIntersecting);
      }
    });
    observer.observe(heroButtons.current);
    observer.observe(form);
    return () => observer.disconnect();
  }, []);
  const showPhoneBar = !heroInView && !reachedForm;

  const goToForm = (next: CommercialPath) => {
    setPath(next);
    document.getElementById('inquiry')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="bg-[#0B1424] text-white">
      <PageMeta
        path="/commercial"
        title="Commercial Millwork & Renovations Ontario | Tenders & Fit-Outs | OntarioReno"
        description="Commercial millwork and interior renovations across Ontario. General contractors can send drawings for pricing. Businesses can request a quote for retail, restaurant, office and institutional projects."
      />

      {/* ---- Hero ---- */}
      <section className="relative overflow-hidden">
        <img
          src={`${IMG}/hero-1800w.webp`}
          srcSet={`${IMG}/hero-900w.webp 900w, ${IMG}/hero-1800w.webp 1800w`}
          sizes="100vw"
          alt="Curved reception desk with a fluted wood front against a slatted wood wall"
          fetchPriority="high"
          className="h-44 w-full object-cover object-right sm:h-72 lg:absolute lg:right-0 lg:top-0 lg:h-full lg:w-[60%]"
        />
        <div
          className="absolute inset-0 hidden bg-[linear-gradient(90deg,#0B1424_40%,rgba(11,20,36,0.75)_47%,rgba(11,20,36,0)_60%)] lg:block"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-[76rem] px-5 py-7 sm:px-8 sm:py-12 lg:py-28">
          <div className="max-w-[35rem]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8FB6DD]">Commercial millwork and interiors</p>
            <h1 className="mt-3 text-[2.15rem] font-bold leading-[1.08] tracking-[-0.03em] [text-wrap:balance] sm:mt-4 sm:text-5xl lg:text-[3.5rem]">
              Every commercial job has a date that can't move.
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-300 sm:mt-5 sm:text-lg sm:leading-8">
              A bid closing, a store opening, a first day of school. OntarioReno prices and delivers commercial interiors by
              working back from that date. Send what you have and you'll hear back within one business day.
            </p>
            <div ref={heroButtons} className="mt-5 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:gap-3">
              <button
                type="button"
                onClick={() => goToForm('tender')}
                className="inline-flex min-h-[3.25rem] items-center justify-center gap-2 rounded-[0.78rem] bg-white px-6 font-bold text-[#0B1424] transition hover:bg-slate-200"
              >
                I have a tender to price
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => goToForm('project')}
                className="inline-flex min-h-[3.25rem] items-center justify-center rounded-[0.78rem] border border-white/30 bg-[#0B1424]/40 px-6 font-bold text-white transition hover:bg-white/10"
              >
                I'm planning a project
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Proof bar ---- */}
      <section className="border-y border-white/10 bg-[#101C31]" aria-label="Credentials">
        <dl className="mx-auto grid max-w-[76rem] grid-cols-2 gap-x-4 gap-y-5 px-5 py-6 sm:gap-6 sm:px-8 sm:py-7 lg:grid-cols-4">
          {PROOF.map((item) => (
            <div key={item.label}>
              <dt className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#8FB6DD] sm:text-xs sm:tracking-[0.14em]">{item.label}</dt>
              <dd className="mt-1 text-[0.95rem] font-bold leading-snug sm:mt-2 sm:text-lg">{item.value ?? <NeedsMarker label={item.needs} />}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ---- Whose date ---- */}
      <section className="mx-auto max-w-[76rem] px-5 py-12 sm:px-8 sm:py-16">
        <h2 className="max-w-[34rem] text-3xl font-bold tracking-[-0.02em] [text-wrap:balance] sm:text-4xl">Whose date are you working to?</h2>
        <div className={`-mx-5 mt-6 flex snap-x snap-mandatory scroll-px-5 gap-3 px-5 sm:mx-0 sm:mt-8 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-4 ${SWIPE}`}>
          {BUYERS.map(({ image, alt, date, title, body }) => (
            <article key={title} className="w-[84%] shrink-0 snap-start overflow-hidden rounded-[1rem] border border-white/10 bg-[#101C31] sm:w-auto">
              <img src={image} alt={alt} loading="lazy" className="aspect-[3/2] w-full object-cover" />
              <div className="p-5 sm:p-6">
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-[#8FB6DD]">{date}</p>
                <h3 className="mt-1 text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
              </div>
            </article>
          ))}
        </div>
        <h3 className="mt-12 text-lg font-bold">What we build</h3>
        <ul className="mt-4 flex flex-wrap gap-2">
          {BUILDS.map((item) => (
            <li key={item} className="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-200">
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* ---- For general contractors ---- */}
      <section className="border-t border-white/10 bg-[#101C31]">
        <div className="mx-auto max-w-[76rem] px-5 py-12 sm:px-8 sm:py-16">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8FB6DD]">For general contractors and estimators</p>
          <h2 className="mt-3 max-w-[36rem] text-3xl font-bold tracking-[-0.02em] [text-wrap:balance] sm:text-4xl">How a tender works with us</h2>
          <ol className="mt-6 grid gap-5 sm:mt-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <li key={step.title} className="grid grid-cols-[2rem_1fr] sm:block sm:border-t-2 sm:border-[#5694CF] sm:pt-4">
                <span className="pt-1 font-mono text-sm text-[#8FB6DD]">0{i + 1}</span>
                <div>
                  <h3 className="text-lg font-bold sm:mt-2">{step.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-300 sm:mt-2">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <figure className="mt-8 overflow-hidden rounded-[1rem] border border-white/10 sm:mt-10">
            <img
              src={`${IMG}/shop-edgebander.webp`}
              alt="Edgebanding machine running in a millwork shop"
              loading="lazy"
              className="aspect-[16/9] w-full object-cover sm:aspect-[3/1]"
            />
          </figure>
        </div>
      </section>

      {/* ---- Recent work ---- */}
      <section className="mx-auto max-w-[76rem] px-5 py-12 sm:px-8 sm:py-16">
        <h2 className="text-3xl font-bold tracking-[-0.02em] sm:text-4xl">Recent commercial work</h2>
        <div className={`-mx-5 mt-5 flex gap-2 px-5 sm:mx-0 sm:mt-6 sm:flex-wrap sm:px-0 ${SWIPE}`} role="group" aria-label="Filter work by industry">
          {WORK_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              aria-pressed={workFilter === tab}
              onClick={() => setWorkFilter(tab)}
              className={`min-h-[2.75rem] shrink-0 rounded-full border px-4 text-sm font-bold transition ${
                workFilter === tab
                  ? 'border-white bg-white text-[#0B1424]'
                  : 'border-white/20 text-slate-200 hover:border-white/50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className={`mt-8 space-y-10 ${cases.length === 0 ? 'hidden' : ''}`}>
          {cases.map((job) => (
            <article key={job.title} className="grid gap-5 lg:grid-cols-[0.55fr_1.45fr] lg:items-center">
              <div>
                <h3 className="text-xl font-bold">{job.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{job.detail}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { label: 'During', ...job.during },
                  { label: 'Finished', ...job.finished },
                ].map((view) => (
                  <figure key={view.label} className="relative overflow-hidden rounded-[1rem] border border-white/10">
                    <img src={view.src} alt={view.alt} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                    <figcaption className="absolute left-3 top-3 rounded-full bg-[#0B1424]/85 px-3 py-1 text-xs font-bold">{view.label}</figcaption>
                  </figure>
                ))}
              </div>
            </article>
          ))}
        </div>
        <div className={`grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 ${cases.length === 0 ? 'mt-8' : 'mt-12'}`}>
          {gallery.map((item, i) => (
            <figure
              key={item.title}
              className={`overflow-hidden rounded-[1rem] border border-white/10 bg-[#101C31] ${
                i === 0 && gallery.length % 2 === 1 ? 'col-span-2 lg:col-span-1' : ''
              }`}
            >
              <img src={item.src} alt={item.alt} loading="lazy" className="aspect-[4/3] w-full object-cover" />
              <figcaption className="p-3 sm:p-4">
                <p className="text-sm font-bold">{item.title}</p>
                <p className="mt-0.5 text-xs text-slate-400">{item.detail}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ---- Inquiry form ---- */}
      <section id="inquiry" className="scroll-mt-24 border-t border-white/10 bg-[#101C31]">
        <div className="mx-auto grid max-w-[76rem] gap-6 px-4 py-12 sm:gap-10 sm:px-8 sm:py-16 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="text-3xl font-bold tracking-[-0.02em] sm:text-4xl">Give us the date. We'll work back from there.</h2>
            <p className="mt-4 text-base leading-7 text-slate-300">
              Your drawings stay private. They are shared only with the trades pricing your project.
            </p>
          </div>
          <CommercialInquiryForm path={path} onPathChange={setPath} />
        </div>
      </section>

      {/* ---- Phone action bar ---- */}
      <div
        aria-hidden={!showPhoneBar}
        className={`fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 gap-2 border-t border-white/10 bg-[#0B1424]/95 px-3 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2.5 backdrop-blur transition-transform duration-200 sm:hidden ${
          showPhoneBar ? 'translate-y-0' : 'pointer-events-none translate-y-full'
        }`}
      >
        <button
          type="button"
          tabIndex={showPhoneBar ? 0 : -1}
          onClick={() => goToForm('tender')}
          className="min-h-[3rem] rounded-[0.7rem] bg-white text-sm font-bold text-[#0B1424]"
        >
          Price a tender
        </button>
        <button
          type="button"
          tabIndex={showPhoneBar ? 0 : -1}
          onClick={() => goToForm('project')}
          className="min-h-[3rem] rounded-[0.7rem] border border-white/30 text-sm font-bold text-white"
        >
          Plan a project
        </button>
      </div>
    </div>
  );
}
