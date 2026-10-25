import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  FileText,
  Calculator,
  Users,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Hammer,
  Home as HomeIcon,
  PaintBucket,
  Bath,
  Landmark,
  MapPin,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '../lib/utils';
import BookingFlowDemo from '../components/BookingFlowDemo';
import CitySelectorSection from '../components/CitySelectorSection';
import { HeroSweep } from '../components/HeroSweep';
import { CostGuideCapture } from '../components/CostGuideCapture';
import MobileBookingBar from '../components/MobileBookingBar';
import ServicePicker from '../components/ServicePicker';
import { HUB_CARDS } from '../data/projects/showcase';
import { cityDirectory } from '../lib/cities';
import {
  BASEMENT_FINANCING_OFFER,
  isGrantCityClosed,
} from '../lib/programClosures';

const HOME_TITLE = 'Basement, Kitchen & Bathroom Renovations in Ontario | OntarioReno';
const HOME_DESCRIPTION =
  'Basement, kitchen, bathroom and garden suite renovations across the GTA and Ontario. Real costs, the permits your city requires, and financing. Book a free consultation.';

/**
 * Who OntarioReno is, for search engines. No phone number or street address:
 * there is no public line, and the business deliberately has no Google
 * Business Profile, so nothing here should look like a local listing.
 */
const ORGANIZATION_SCHEMA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://ontarioreno.ca/#organization',
      name: 'OntarioReno',
      url: 'https://ontarioreno.ca/',
      logo: 'https://ontarioreno.ca/logo.png',
      description:
        'Independent Ontario renovation team: free consultations, real costs, permit guidance and financing for basements, legal suites, kitchens, bathrooms and garden suites.',
      areaServed: { '@type': 'AdministrativeArea', name: 'Ontario, Canada' },
    },
    {
      '@type': 'WebSite',
      '@id': 'https://ontarioreno.ca/#website',
      name: 'OntarioReno',
      url: 'https://ontarioreno.ca/',
      publisher: { '@id': 'https://ontarioreno.ca/#organization' },
    },
  ],
};


/**
 * The three programs the homepage features.
 *
 * `city` is not decoration: it is matched against CLOSED_GRANT_CITIES so a
 * closed program cannot be advertised here as fundable. This section used to
 * lead with "Hamilton currently offers the strongest grant opportunity" and a
 * gold "Up to $40,000" card three weeks after Hamilton closed, because the
 * status lived in CURATED_PAGES and the nav and nobody wired the homepage to
 * either. lib/grant-integrity.test.ts now fails if this drifts again.
 *
 * Open programs are listed first — the featured slot belongs to money a reader
 * can actually apply for.
 *
 * Only OPEN programs render as cards. A closed one drops to the short
 * "Closed to new applications" list under them, decided by isGrantCityClosed
 * at render time — so a program that closes moves itself out of the cards the
 * moment its city is added to CLOSED_GRANT_CITIES. Two of three cards used to
 * be closed grants, which is a strange way to lead a section about funding.
 *
 * Barrie's figures are its own page's (BarrieSecondarySuiteFunding.tsx), word
 * for word: county up to $50,000, plus a possible $15,000 city top-up.
 */
const featuredPrograms = [
  {
    city: 'Burlington',
    eyebrow: 'Incentive Program',
    title: 'Burlington ARU Incentive',
    highlight: 'Up to $95,000',
    description:
      'Burlington is the strongest open incentive for a legal additional residential unit, and the clearest starting point for funding a basement suite today.',
    primaryLabel: 'View Burlington Program',
    primaryHref: '/burlington-aru-incentive-program',
    secondaryLabel: 'Burlington Cost Guide',
    secondaryHref: '/basement-renovation-cost-burlington',
  },
  {
    city: 'Barrie',
    eyebrow: 'Funding Program',
    title: 'Barrie Secondary Suite Funding',
    highlight: 'Up to $65,000 combined',
    description:
      'Simcoe County offers up to $50,000 for eligible secondary or garden suites, and Barrie may add a $15,000 top-up for approved projects, subject to affordable-rental and program requirements.',
    primaryLabel: 'View Barrie Funding',
    primaryHref: '/barrie-secondary-suite-funding',
    secondaryLabel: 'Barrie Suite Costs',
    secondaryHref: '/barrie-secondary-suite-costs',
  },
  {
    city: 'Hamilton',
    eyebrow: 'Grant Program',
    title: 'Hamilton Basement Grant',
    highlight: 'Closed to new applications',
    description:
      'Hamilton reached its funding capacity on August 6, 2026. The guide stays up as reference for permits, legal-suite requirements, and what the build costs.',
    primaryLabel: 'Read the Hamilton Guide',
    primaryHref: '/hamilton-grant-guide',
    secondaryLabel: 'Build It Financed Instead',
    secondaryHref: BASEMENT_FINANCING_OFFER.href,
  },
  {
    city: 'St. Catharines',
    eyebrow: 'City Guide',
    title: 'St. Catharines ADU Guides',
    highlight: 'Grant closed — cost and permit path still current',
    description:
      'The cash grant is fully committed, but the ADU planning cluster — realistic costs, permits, and legal requirements — is unaffected.',
    primaryLabel: 'Explore St. Catharines',
    primaryHref: '/st-catharines',
    secondaryLabel: 'Cost & Permit Guides',
    secondaryHref: '/st-catharines-adu-cost',
  },
];


declare global {
  interface Window {
    onTurnstileSuccess?: (token: string) => void;
    onTurnstileExpired?: () => void;
    onTurnstileError?: () => void;
    turnstile?: {
      reset: (widget?: string | HTMLElement) => void;
    };
  }
}

export default function Home() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);



  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };


  return (
    <div className="flex flex-col min-h-screen">
      {/* Title and description lead with the work people search for. The old
          title, "Ontario Reno | Ontario Renovation Guides, Costs & Project
          Reviews", named no project at all, and the description still sold
          basement grants after the two biggest had closed. */}
      <Helmet>
        <title>{HOME_TITLE}</title>

        <meta name="description" content={HOME_DESCRIPTION} />

        <link rel="canonical" href="https://ontarioreno.ca/" />

        <meta property="og:title" content={HOME_TITLE} />
        <meta property="og:description" content={HOME_DESCRIPTION} />
        <meta property="og:url" content="https://ontarioreno.ca/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://ontarioreno.ca/preview.jpg" />

        <meta name="twitter:title" content={HOME_TITLE} />
        <meta name="twitter:description" content={HOME_DESCRIPTION} />
        <meta name="twitter:image" content="https://ontarioreno.ca/preview.jpg" />

        <script type="application/ld+json">{JSON.stringify(ORGANIZATION_SCHEMA)}</script>
      </Helmet>

      {/* Hero — full-bleed transformation.

          The whole hero is one real basement, unfinished on one side of the
          seam and finished on the other, edge to edge; the copy sits on the
          unfinished side under a warm vignette (see HeroSweep). Earlier
          versions — a dark glass card, a tabbed estimator, a boxed photo on
          beige — read as a fintech dashboard or a design blog. The
          photograph is the argument; the copy only has to be clear.

          The fold carries the booking CTA only. The 2026 cost guide lives
          mid-page (see CostGuideCapture).

          The eyebrow names the work. It used to read "Independent renovation
          advisory", so the first screen never said basement, kitchen or
          bathroom. It stays off phones, where the picker's tiles name the
          work a few lines further down and every line pushes them toward the
          fold. "Independent" still leads the trust line. */}
      <HeroSweep>
        <p className="hidden text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-white/75 sm:block">
          Basement, kitchen &amp; bathroom renovations · Ontario
        </p>

        <h1 className="text-[2rem] font-extrabold [text-wrap:balance] sm:[text-wrap:wrap] leading-[1.0] tracking-[-0.045em] text-white sm:mt-4 sm:text-[3.4rem] lg:text-[4.1rem]">
          Stop dreading the reno.
          <span className="block text-white/80">Build your Ontario home right.</span>
        </h1>

        <p className="mt-3 max-w-lg text-[0.98rem] leading-7 text-white/80 sm:mt-5 sm:text-[1.12rem] sm:leading-8">
          Real costs before the first quote, the permits your city will
          actually ask for, and honest financing, from one independent team
          that comes to see the space for free.
        </p>

        {/* The service picker replaces the single "Start your free project
            review" button, which opened /match. See ServicePicker for the
            numbers behind that. Both of the old buttons are still here:
            /match is the picker's "Not sure yet?" link, and "See costs by
            project" sits beside the trust line below. */}
        <ServicePicker compact source="home-hero" className="mt-5 sm:mt-6" />

        <p className="mt-3 flex flex-wrap items-center gap-x-1 gap-y-1.5 text-xs font-medium text-white/75 sm:mt-4 sm:gap-y-2 sm:text-sm">
          <span>
            Independent <span aria-hidden className="px-1.5 text-white/35">·</span> Ontario-local{' '}
            <span aria-hidden className="px-1.5 text-white/35">·</span> Zero-lien financing paths
          </span>
          {/* On a phone the link wraps to its own line; a separator there
              would dangle at the end of the first. */}
          <span aria-hidden className="hidden px-1.5 text-white/35 sm:inline">·</span>
          <a
            href="#explore"
            onClick={(event) => {
              const target = document.getElementById('explore');
              if (!target) return;
              event.preventDefault();
              const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
              target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
            }}
            className="font-semibold text-white underline decoration-white/50 underline-offset-4 hover:decoration-white"
          >
            See costs by project
          </a>
        </p>
      </HeroSweep>

      {/* The booking demo, first thing after the hero.

          It was lower down at first, sitting after the trust section on the
          reasoning that trust earns the right to ask. In practice that put
          the page's actual conversion six sections deep, below three
          sections about money and one about rooms, where most readers never
          reached it. The hero makes the promise; this shows the promise
          costs three taps. That is the strongest thing the page has and it
          now runs second.

          FINANCING NOW SHARES THIS SECTION rather than following it as its
          own band. Two stacked sections cost roughly 1,400px to say "booking
          is easy" and "here is what it costs" — two halves of one decision,
          read one after the other, with a full section's padding between
          them. The phone is ~700px tall and the booking copy beside it is
          ~450px, so a quarter of this section was empty at desktop width
          while the band below paid for its own padding. The figure moved
          into that gap.

          The order argued for below still holds: financing still comes
          before the hubs, because "can I afford this at all?" still precedes
          "which room?". It just no longer needs a section of its own to say
          so.

          It plays a REPLICA of /consultation, not the live flow. See
          BookingFlowDemo for why, and for what that costs. */}
      <BookingFlowDemo
        aside={
          <>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1B3C6C]">
              Renovation financing
            </p>

            {/* THE QUALIFIER STAYS WELDED TO THE FIGURE. A bare "$399/month"
                set large is a quoted price, and the consultant is the one who
                has to walk it back. The sentence runs continuously across the
                size change, so the floor is stated before the reader reaches
                the number.

                The figure is smaller than it was in the standalone band
                (5rem → 4rem) because the column is narrower. It is still the
                largest type in the section by a wide margin, which is all the
                emphasis that note ever asked for — it was written against a
                version where the number sat mid-sentence at body size. */}
            {/* Figure beside its explanation, which is the relationship the
                standalone band had. It survives the move because the left
                column is still ~700px wide — wide enough for two. */}
            <div className="mt-4 grid gap-6 lg:grid-cols-2 lg:items-center lg:gap-10">
              <div>
                <p className="text-base font-semibold text-slate-500">Starting from</p>
                <p className="mt-0.5 flex items-baseline gap-2.5">
                  <span className="text-[3.25rem] font-bold leading-[0.9] tracking-[-0.045em] text-[#1B3C6C] sm:text-[4rem]">
                    $399
                  </span>
                  <span className="text-lg font-semibold text-slate-500">/month</span>
                </p>
                <h2 className="mt-2.5 max-w-[24ch] text-lg font-bold leading-[1.3] tracking-[-0.02em] text-slate-900 sm:text-xl">
                  for a finished basement, financed in full
                </h2>
              </div>

              <div>
                <p className="text-[0.95rem] leading-7 text-slate-600">
                  Nothing is paid upfront. It is an open loan — pay it down or clear
                  it whenever you want, with no penalty and no lien on your home.
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
                  {/* Outlined, not filled. The booking CTA above is this
                      section's one filled button, and the band's own note kept
                      that rule when it demoted the second financing route to a
                      link. Merging the two sections is what forced the choice;
                      this route stays a button rather than becoming a third
                      link, because it is a conversion and it carries the
                      analytics hook. */}
                  <Link
                    to="/consultation/basement"
                    data-analytics="financing-cta"
                    className="inline-flex items-center gap-2 rounded-xl border border-[#1B3C6C]/35 px-5 py-3 text-[0.95rem] font-bold text-[#1B3C6C] transition-colors hover:border-[#1B3C6C] hover:bg-[#f2f7ff]"
                  >
                    See my monthly payment
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  {/* Both financing routes stay reachable — demoted to links,
                      not removed. */}
                  <Link
                    to="/open-loan-financing"
                    className="text-sm font-semibold text-[#1B3C6C] underline underline-offset-4 hover:text-[#16325a]"
                  >
                    Open Loan financing
                  </Link>
                </div>
              </div>
            </div>
          </>
        }
        /* The terms as three facts on a rule, not a boxed widget. The panel
           this replaced repeated the paragraph beside it almost word for word,
           on a wash that was invisible against its own background.

           Full width under both columns rather than inside the aside: three
           facts across the whole measure is one short row, while the same
           three stacked in a half-width column is three. */
        footer={
          <>
            <dl className="grid gap-x-10 gap-y-4 sm:grid-cols-3">
              {[
                ['Due upfront', '$0'],
                ['Loan type', 'Open — repay early, no penalty'],
                ['Secured against your home', 'No lien'],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-slate-500">
                    {label}
                  </dt>
                  <dd className="mt-1 text-base font-bold text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>

            <p className="mt-6 text-sm text-slate-500">
              On approved credit.{' '}
              <Link
                to="/financing"
                className="font-semibold text-[#1B3C6C] underline underline-offset-4"
              >
                View all financing options
              </Link>
              .
            </p>
          </>
        }
      />

      {/* Moved directly under the hero.

          This section routes a homeowner to the trade they came for, and it
          used to sit fifth — below the mistakes band, the grant programs,
          the trust section and the financing band. Someone arriving from an
          ad for a bathroom had to scroll past four unrelated pitches before
          the page acknowledged bathrooms existed. Now that the cards carry
          the work rather than a coloured icon, they earn the position. */}
      <section id="explore" className="scroll-mt-20 bg-white py-14 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Explore Our Renovation Hubs</h2>
            <p className="text-lg text-slate-600">
              Comprehensive guides, cost breakdowns, and expert advice for Ontario&apos;s most popular home improvement projects.
            </p>
            {/* A Hamilton-only line used to sit here, pointing at the
                Hamilton basement cost guide. It made sense when the Hamilton
                secondary-suite grant was the reason people came — it is not
                any more; that program is closed (see CURATED_PAGES in
                lib/grants.ts). Anchoring the home page's only routing section
                on one city singled out a minority of visitors and said nothing
                to the rest.

                The Hamilton cost guide is NOT orphaned by this: it is still
                linked from lib/cities.ts (the city selector below), from
                HamiltonGrant.tsx, and it is in the sitemap. */}
          </div>

          {/* Photo cards, not icon cards.

              This section's whole job is routing a homeowner to the trade they
              came for, and until now it did that with four coloured squares
              while the four pages it links to each open with real work. The
              photograph IS the routing signal — someone planning a bathroom
              recognises theirs instantly.

              Nothing else in the section changed: same four links, same
              titles, same body copy, same order.

              Two across on a phone. One across stacked four 4:3 photos into
              ~2,200px — the longest section on the page, for four links. At
              two across the body copy has no room, so it shows from `sm` up;
              the photo and the title do the routing. */}
          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
            {HUB_CARDS.map((hub) => (
              <Link
                key={hub.to}
                to={hub.to}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-xl"
              >
                <div className="relative overflow-hidden bg-slate-200">
                  <img
                    src={hub.photo.src}
                    srcSet={hub.photo.srcSet}
                    sizes="(min-width: 1024px) 22vw, 50vw"
                    alt={hub.photo.alt}
                    loading="lazy"
                    decoding="async"
                    className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                  {/* Region, not a town — same privacy rule as the hub pages. */}
                  <span className="absolute bottom-2 left-2 hidden rounded-full bg-slate-900/75 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.06em] text-white sm:bottom-3 sm:left-3 sm:inline">
                    {hub.photo.region}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-4 sm:p-6">
                  <h3 className="text-base font-bold leading-snug text-slate-900 sm:text-xl">{hub.title}</h3>
                  <p className="mt-2 hidden flex-grow text-sm text-slate-600 sm:block">{hub.body}</p>
                  <div className="mt-auto flex items-center pt-3 text-sm font-semibold text-[#1B3C6C] sm:pt-6">
                    Explore Hub
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-100 bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.45fr)_minmax(0,0.55fr)] lg:gap-16">
            {/* The three steps are the real ones now: book, consultation,
                build. They used to describe a planning exercise ("Avoid Costly
                Planning Mistakes", "Choose the Right Next Step") that matched
                nothing a homeowner actually goes through, under three
                paragraphs that said the same sentence three ways.

                The remote line matters: Windsor, Niagara Falls and Thorold
                book a call, not a visit (lib/remote-consultation.ts), and a
                remote booking must never be described as a visit. */}
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#1B3C6C]">
                <FileText className="h-4 w-4" />
                How OntarioReno Works
              </div>
              <h2 className="mt-4 text-3xl font-bold leading-tight tracking-[-0.03em] text-slate-900 md:text-4xl">
                Avoid costly renovation mistakes before committing.
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-600 md:text-lg">
                Most expensive renovation mistakes start with incomplete
                information. We get you the real cost, the permits your city
                will ask for, and your financing options before you sign
                anything.
              </p>
            </div>

            <div className="relative">
              <div className="absolute bottom-10 left-5 top-10 hidden w-px bg-[#1B3C6C]/10 md:block" />
              {[
                {
                  step: '01',
                  title: 'Book a Free Consultation',
                  description:
                    'Pick your project and a time online in a few taps. We confirm by text.',
                },
                {
                  step: '02',
                  title: 'We Scope and Price It',
                  description:
                    'A consultant comes to see the space — or calls, if you are outside our travel area — and lays out a realistic cost, the permits involved, and your financing options.',
                },
                {
                  step: '03',
                  title: 'A Vetted Contractor Builds It',
                  description:
                    'If you go ahead, a vetted Ontario contractor from our partner network does the work under a written contract with you. No obligation until you sign.',
                },
              ].map((item, index, array) => (
                <div
                  key={item.step}
                  className={cn(
                    'relative flex items-start gap-5 py-8 sm:gap-6',
                    index !== array.length - 1 && 'border-b border-slate-100/70'
                  )}
                >
                  <div className="relative z-10 mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1B3C6C] text-sm font-bold text-white">
                    {item.step}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl font-extrabold leading-tight tracking-[-0.01em] text-slate-900">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-7 text-slate-600 sm:text-base">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="hidden md:block">
        <CitySelectorSection />
      </div>

      {/* Phones get a compact city row. The full selector stays desktop-only —
          at phone width it runs well over a screen — but hiding it left phone
          visitors no way to reach their city's guide from the homepage. Same
          list (lib/cities.ts), so the two cannot disagree. */}
      <section className="bg-white py-12 md:hidden">
        <div className="px-4">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#1B3C6C]">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            City guides
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-[-0.03em] text-slate-900">Find your city</h2>
          <p className="mt-2 text-base leading-7 text-slate-600">
            Costs, permits, and legal basement rules where you live.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {cityDirectory.map((city) => (
              <Link
                key={city.name}
                to={city.href}
                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-[#1B3C6C] hover:text-[#1B3C6C] active:scale-[0.98]"
              >
                {city.name}
              </Link>
            ))}
          </div>
          <Link
            to="/cities"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#1B3C6C]"
          >
            View all cities
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* The cost guide, mid-page. It used to be pitched from the hero; it
          now sits after the hubs and city guides, as a companion for readers
          still researching. Extracted to a component so /costs can offer it
          too — see CostGuideCapture for why there must only ever be one
          implementation of it. */}
      <CostGuideCapture framing="companion" />

      {/* Featured Programs */}
      <section className="border-b border-yellow-100 bg-[linear-gradient(180deg,#fffaf0_0%,#fffdf8_48%,#ffffff_100%)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-14">
          <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-yellow-100 text-yellow-900 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em]">
                <Landmark className="w-4 h-4" />
                Featured Ontario Programs
              </div>
              <h2 className="mt-4 text-2xl md:text-4xl font-bold text-slate-900 leading-tight">
                Explore Ontario&apos;s top basement grant and ADU programs
              </h2>
              <p className="mt-4 max-w-2xl text-base md:text-lg text-slate-700 leading-relaxed">
                Burlington&apos;s ARU incentive is the strongest program open to new
                applications today, and Barrie homeowners may qualify for combined
                county and city funding. Hamilton and St. Catharines have both closed
                their grants — their guides stay up for permits, costs, and
                legal-suite requirements, and the build can still be financed in full.
              </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {featuredPrograms.filter((program) => !isGrantCityClosed(program.city)).map((program) => (
              <div
                key={program.title}
                className={cn(
                  'flex h-full flex-col rounded-[1.35rem] border p-6 shadow-[0_12px_28px_rgba(15,23,42,0.05)]',
                  // The gold treatment follows the OPEN program, not the first
                  // slot. It used to mark index 0, which is how a closed grant
                  // ended up as the highlighted pick of the page.
                  !isGrantCityClosed(program.city)
                    ? 'border-yellow-200 bg-[linear-gradient(180deg,#fffdf4_0%,#ffffff_100%)]'
                    : 'border-slate-200/90 bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)]'
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {program.eyebrow}
                  </p>
                  {isGrantCityClosed(program.city) && (
                    <span className="inline-flex items-center rounded-full bg-slate-200/80 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-slate-600">
                      Closed
                    </span>
                  )}
                </div>
                <h3 className="mt-3 text-2xl font-bold tracking-[-0.02em] text-slate-900">
                  {program.title}
                </h3>
                {/* A closed program's status must never wear the same confident
                    blue as an open program's dollar figure. */}
                <p
                  className={cn(
                    'mt-2 text-sm font-semibold',
                    isGrantCityClosed(program.city) ? 'text-slate-500' : 'text-[#1B3C6C]'
                  )}
                >
                  {program.highlight}
                </p>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  {program.description}
                </p>
                <div className="mt-auto pt-6 flex flex-col gap-3">
                  <Link
                    to={program.primaryHref}
                    className="inline-flex items-center justify-center rounded-[0.74rem] border border-slate-800 bg-[linear-gradient(180deg,#1f2937_0%,#0f172a_100%)] px-5 py-[0.78rem] font-semibold tracking-[-0.015em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(15,23,42,0.05),0_10px_22px_rgba(15,23,42,0.14)] transition duration-200 hover:border-slate-700 hover:bg-[linear-gradient(180deg,#273244_0%,#111c31_100%)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_1px_2px_rgba(15,23,42,0.06),0_14px_26px_rgba(15,23,42,0.18)] active:bg-[linear-gradient(180deg,#111827_0%,#020617_100%)] active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
                  >
                    {program.primaryLabel}
                  </Link>
                  <Link
                    to={program.secondaryHref}
                    className="inline-flex items-center justify-center rounded-[0.74rem] border border-slate-300 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-5 py-[0.78rem] font-semibold tracking-[-0.015em] text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.96),0_1px_2px_rgba(15,23,42,0.03),0_10px_22px_rgba(15,23,42,0.05)] transition duration-200 hover:border-slate-400 hover:bg-[linear-gradient(180deg,#ffffff_0%,#f1f5f9_100%)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.98),0_1px_2px_rgba(15,23,42,0.04),0_14px_26px_rgba(15,23,42,0.06)] active:bg-slate-100 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                  >
                    {program.secondaryLabel}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Closed programs: one short list, links kept, no gold card. */}
          {featuredPrograms.some((program) => isGrantCityClosed(program.city)) && (
            <div className="mt-6 rounded-[1.1rem] border border-slate-200/90 bg-white/80 px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Closed to new applications
              </p>
              <ul className="mt-1 divide-y divide-slate-100">
                {featuredPrograms.filter((program) => isGrantCityClosed(program.city)).map((program) => (
                  <li
                    key={program.title}
                    className="flex flex-col gap-2 py-3 lg:flex-row lg:items-center lg:justify-between lg:gap-8"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{program.title}</p>
                      <p className="mt-0.5 text-sm leading-6 text-slate-500">{program.description}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-x-5 gap-y-1 text-sm font-semibold">
                      <Link
                        to={program.primaryHref}
                        className="text-[#1B3C6C] underline underline-offset-4 hover:text-[#16325a]"
                      >
                        {program.primaryLabel}
                      </Link>
                      <Link
                        to={program.secondaryHref}
                        className="text-[#1B3C6C] underline underline-offset-4 hover:text-[#16325a]"
                      >
                        {program.secondaryLabel}
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* Authority / Trust Section */}
      <section className="border-b border-slate-100 bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-14">
            <div className="max-w-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
                Why homeowners use OntarioReno
              </p>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.03em] text-slate-900">
                More clarity before quotes, permits, and pricing decisions.
              </h2>
            </div>

            <div className="grid gap-0 md:grid-cols-3 md:divide-x md:divide-slate-200/80">
              <div className="border-t border-slate-200/80 pt-6 md:border-t-0 md:px-7 md:pt-0 md:first:pl-0 md:last:pr-0">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[1rem] bg-blue-50 text-[#1B3C6C]">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Permit & Code Clarity</h3>
                <p className="text-slate-600 leading-relaxed">
                  Stop guessing. We break down Ontario building codes and municipal permit requirements into plain English.
                </p>
              </div>

              <div className="border-t border-slate-200/80 pt-6 md:border-t-0 md:px-7 md:pt-0 md:first:pl-0 md:last:pr-0">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[1rem] bg-emerald-50 text-emerald-600">
                  <Calculator className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Transparent Pricing</h3>
                <p className="text-slate-600 leading-relaxed">
                  Access real, localized cost data for basements, kitchens, and legal suites across the GTA and beyond.
                </p>
              </div>

              <div className="border-t border-slate-200/80 pt-6 md:border-t-0 md:px-7 md:pt-0 md:first:pl-0 md:last:pr-0">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[1rem] bg-sky-50 text-sky-700">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Project Review & Next-Step Guidance</h3>
                <p className="text-slate-600 leading-relaxed">
                  Get project guidance, understand your next steps, and move forward with the right renovation path.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Project Review CTA */}
      <section className="bg-slate-900 py-20 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-16 h-16 bg-[#1B3C6C]/24 rounded-full flex items-center justify-center mb-7 mx-auto">
              <Hammer className="w-8 h-8 text-[#7FB0E0]" />
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-[-0.04em]">Ready to start your project?</h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
              Book a free consultation built around your scope, budget, and timeline. No random referrals, and no marketplace-style noise.
            </p>
            {/* The service picker, like the hero. This button opened /match;
                the project review is still one tap away as "Not sure yet?". */}
            <div className="flex flex-col items-center gap-4">
              <ServicePicker source="home-footer-cta" className="w-full max-w-xl text-left" />
              <p className="text-sm text-slate-400">100% free for homeowners. No obligation to hire.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-slate-600">Common questions from Ontario homeowners about renovations and our service.</p>
          </div>

          <div className="space-y-4">
            {/* The first three answers now tell the same story as the hero:
                one independent team that comes to see the space, with a vetted
                partner contractor doing the build under its own contract with
                the homeowner (src/portal/lib/contractPdf.ts — the Contractor is
                the second party). They used to describe a "matching service"
                and a "resource platform", which contradicted the page above.
                The referral-fee disclosure stays, word for word. */}
            {[
              {
                q: "Is OntarioReno a contracting company?",
                a: "No. We are an independent renovation team that handles everything before the build. One of our consultants comes to see the space for free, then lays out a realistic cost, the permits your city will ask for, and your financing options. The construction itself is done by a vetted Ontario contractor from our partner network, under a written contract with you."
              },
              {
                q: "How much does it cost to use OntarioReno?",
                a: "Nothing. The consultation is 100% free for homeowners, with no obligation to hire. We may earn a referral fee from contractors in our network, but our positioning is based on project fit, not random placement or homeowner-facing bias."
              },
              {
                q: "How does the free consultation work?",
                a: "Pick your project and a time online, and we confirm by text. A consultant comes to see the space — or calls, if you are outside our travel area — and looks at scope, budget, location, and timeline. The goal is not to flood you with options. It is one clear plan and one vetted contractor that fits your project."
              },
              {
                q: "Do I really need a permit to finish my basement?",
                a: "In almost all Ontario municipalities, yes. If you are adding walls, altering plumbing, or changing electrical, a building permit is required by law. Skipping this can lead to fines, forced removal of work, and issues when selling your home."
              },
              {
                q: "How do you vet the contractors in your network?",
                a: "We have a strict vetting process. We verify their WSIB clearance, minimum $2M liability insurance, business registration, and check references from past clients. We also monitor ongoing performance and remove contractors who fail to meet our standards."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  aria-expanded={activeFaq === index}
                  aria-controls={`faq-panel-${index}`}
                  id={`faq-trigger-${index}`}
                  className="w-full px-6 py-4 text-left flex justify-between items-center gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1B3C6C]/40"
                  onClick={() => toggleFaq(index)}
                >
                  <span className="font-semibold text-slate-900">{faq.q}</span>
                  <ChevronDown
                    aria-hidden="true"
                    className={cn(
                      "w-5 h-5 shrink-0 text-slate-500 transition-transform duration-200",
                      activeFaq === index && "rotate-180"
                    )}
                  />
                </button>
                <div
                  id={`faq-panel-${index}`}
                  role="region"
                  aria-labelledby={`faq-trigger-${index}`}
                  className={cn(
                    "grid transition-[grid-template-rows] duration-200 ease-out",
                    activeFaq === index ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="px-6 pb-4 text-slate-600 leading-relaxed">
                      {faq.a}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <MobileBookingBar />
    </div>
  );
}


