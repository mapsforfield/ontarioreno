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
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '../lib/utils';
import CitySelectorSection from '../components/CitySelectorSection';
import { CostGuideCapture } from '../components/CostGuideCapture';
import { HUB_CARDS } from '../data/projects/showcase';
import { buttonStyles } from '../lib/uiStyles';
import {
  BASEMENT_FINANCING_OFFER,
  isGrantCityClosed,
} from '../lib/programClosures';


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
      <Helmet>
        <title>Ontario Reno | Ontario Renovation Guides, Costs & Project Reviews</title>

        <meta
          name="description"
          content="Plan your Ontario renovation the right way. Understand permits, legal suites, basement grants, real project costs, and review your project before hiring."
        />

        <link rel="canonical" href="https://ontarioreno.ca/" />

        <meta
          property="og:title"
          content="Ontario Reno | Ontario Renovation Guides, Costs & Project Reviews"
        />
        <meta
          property="og:description"
          content="Plan your Ontario renovation the right way. Understand permits, legal suites, basement grants, real project costs, and review your project before hiring."
        />
        <meta property="og:url" content="https://ontarioreno.ca/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://ontarioreno.ca/preview.jpg" />

        <meta
          name="twitter:title"
          content="Ontario Reno | Ontario Renovation Guides, Costs & Project Reviews"
        />
        <meta
          name="twitter:description"
          content="Plan your Ontario renovation the right way. Understand permits, legal suites, basement grants, real project costs, and review your project before hiring."
        />
        <meta name="twitter:image" content="https://ontarioreno.ca/preview.jpg" />
      </Helmet>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 text-white">
        <div className="absolute inset-0 z-0 opacity-40">
          <img
            src="/hero.jpg"
            alt="Ontario Home Renovation"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-transparent"></div>
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-14">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-[#1B3C6C]/20 px-4 py-2 text-sm font-medium text-blue-300 backdrop-blur-sm">
                <ShieldCheck className="w-4 h-4" />
                <span>Ontario&apos;s Independent Homeowner Guide</span>
              </div>

              <h1 className="mb-6 mt-8 max-w-3xl text-4xl font-bold leading-[0.98] tracking-[-0.05em] sm:text-5xl lg:text-7xl">
                Plan Your Renovation with <span className="text-[#7FB0E0]">Confidence.</span>
              </h1>

              <p className="mb-4 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
                OntarioReno helps homeowners understand renovation costs, permit requirements, project feasibility, and the right next steps before moving forward.
              </p>

              <p className="mb-10 max-w-2xl text-sm text-slate-400">
                Independent guidance for Ontario homeowners planning basements, legal suites, permits, grants, and renovation costs.
              </p>

              <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
                <Link
                  to="/match"
                  className={buttonStyles.primary}
                >
                  Start Project Review <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/costs"
                  className={buttonStyles.ghostDark}
                >
                  Explore Renovation Costs
                </Link>
              </div>

              <div className="mt-12 flex flex-wrap items-center gap-6 text-sm font-medium text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Free to use
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Independent guidance
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Built for Ontario homeowners
                </div>
              </div>
            </div>

            <div className="hidden lg:block">
              <Link
                to="/#cost-guide"
                className="group relative block rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07)_0%,rgba(255,255,255,0.03)_100%)] p-7 shadow-[0_28px_70px_rgba(2,6,23,0.26)] backdrop-blur-sm transition duration-200 hover:border-white/18 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.09)_0%,rgba(255,255,255,0.04)_100%)]"
              >
                <div className="absolute inset-x-10 top-10 h-48 rounded-full bg-[#4A8DDA]/18 blur-3xl" />
                <div className="absolute inset-x-16 top-[7.25rem] h-32 rounded-full bg-[#7FB0E0]/22 blur-2xl" />

                <div className="relative flex justify-center">
                  <img
                    src="/ontario-reno-cost-guide-3d-preview.png"
                    alt="2026 Ontario Renovation Cost Guide booklet preview"
                    className="relative z-10 h-auto w-[250px] object-contain drop-shadow-[0_26px_36px_rgba(2,6,23,0.34)] transition duration-200 group-hover:-translate-y-1"
                    loading="eager"
                  />
                </div>

                <div className="relative mt-5 border-t border-white/10 pt-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-200">
                    Free planning guide
                  </p>
                  <h2 className="mt-3 text-2xl font-bold leading-tight tracking-[-0.03em] text-white">
                    2026 Ontario Renovation Cost Guide
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    See how to price basements, kitchens, legal suites, and permit costs before your first quote.
                  </p>
                  <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white">
                    Get the free guide
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Financing first, then the hubs.

          Both of these sit above the fold-adjacent fold for a reason, and
          this is the order that reflects how a homeowner actually decides.
          "Can I afford this at all?" comes before "which room?" — someone
          who has quietly written the project off on price never gets as far
          as picking a trade. The monthly figure is the thing most likely to
          keep them on the page.

          The figure itself is governed: see the note inside the band. */}
      {/* The number IS the section — compactly.

          Five versions preceded this. The first three fixed the CONTAINER
          rather than the content: a dark card floating on white (which read as
          a rendering fault, since its gradient started at the hero's exact
          colour with a white strip between them), a plain white band (three
          tonal grounds in a row), then a dark band flush with the hero
          (structurally right, still mostly empty).

          The content fix was making the FIGURE the subject — it had been buried
          mid-sentence at body size. The last fix is size: at 120px type and
          16-unit padding the block ran 798px tall for a number, a sentence, a
          button and three facts. It now runs about half that. The figure is
          still the largest thing in it, which is all the emphasis it needed;
          the rest was padding pretending to be design.

          Two columns are explicit rather than space-between, which is what left
          a dead void down the middle at 1440px.

          $399 is the same figure as BASEMENT_FINANCING_PROGRAM.displayAmountLabel
          in lib/program-config.ts and the closed-grant pages' offer: never a
          quoted price, always on approved credit. The qualifier reads "Starting
          from" rather than the "from about" used by displayAmountLabel and the
          closed-grant pages. Both say the same thing — it is a FLOOR — and
          lib/consultation-routing.test.ts still enforces "from about" plus "on
          approved credit" on the consultation labels, which are untouched. */}
      <section className="bg-slate-50 px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
        {/* A hairline, not a card. No shadow, deliberately — a shadow is what
            made an earlier version float off the page. */}
        <div className="mx-auto max-w-7xl rounded-[1.25rem] border border-[#1B3C6C]/20 bg-white px-6 py-8 sm:px-8 lg:px-10 lg:py-9">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1B3C6C]">
            Renovation financing
          </p>

          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-14">
            <div>
              {/* THE QUALIFIER STAYS WELDED TO THE FIGURE. A bare "$399/month"
                  set large is a quoted price, and the consultant is the one who
                  has to walk it back. The sentence runs continuously across the
                  size change, so the floor is stated before the reader reaches
                  the number. */}
              <p className="text-base font-semibold text-slate-500">Starting from</p>
              <p className="mt-0.5 flex items-baseline gap-2.5">
                <span className="text-[3.5rem] font-bold leading-[0.9] tracking-[-0.045em] text-[#1B3C6C] sm:text-[4.25rem] lg:text-[5rem]">
                  $399
                </span>
                <span className="text-lg font-semibold text-slate-500">/month</span>
              </p>
              <h2 className="mt-3 max-w-[28ch] text-xl font-bold leading-[1.25] tracking-[-0.02em] text-slate-900 sm:text-2xl">
                for a finished basement, financed in full
              </h2>
            </div>

            <div>
              <p className="max-w-[42ch] text-base leading-7 text-slate-600">
                Nothing is paid upfront. It is an open loan — pay it down or clear
                it whenever you want, with no penalty and no lien on your home.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-5">
                <Link
                  to="/consultation/basement"
                  data-analytics="financing-cta"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1B3C6C] px-6 py-3.5 font-bold text-white shadow-sm transition-colors hover:bg-[#16325a]"
                >
                  See my monthly payment
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                {/* Both financing routes stay reachable — demoted to links, not
                    removed. One filled button per section. */}
                <Link
                  to="/open-loan-financing"
                  className="text-sm font-semibold text-[#1B3C6C] underline underline-offset-4 hover:text-[#16325a]"
                >
                  Open Loan financing
                </Link>
              </div>
            </div>
          </div>

          {/* The terms as three facts on a rule, not a boxed widget. The panel
              this replaced repeated the paragraph beside it almost word for
              word, on a wash that was invisible against its own background. */}
          <dl className="mt-8 grid gap-x-10 gap-y-4 border-t border-[#1B3C6C]/15 pt-6 sm:grid-cols-3">
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
        </div>
      </section>

      {/* Moved directly under the hero.

          This section routes a homeowner to the trade they came for, and it
          used to sit fifth — below the mistakes band, the grant programs,
          the trust section and the financing band. Someone arriving from an
          ad for a bathroom had to scroll past four unrelated pitches before
          the page acknowledged bathrooms existed. Now that the cards carry
          the work rather than a coloured icon, they earn the position. */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
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
              titles, same body copy, same order. */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
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
                    sizes="(min-width: 1024px) 22vw, (min-width: 768px) 45vw, 100vw"
                    alt={hub.photo.alt}
                    loading="lazy"
                    decoding="async"
                    className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                  {/* Region, not a town — same privacy rule as the hub pages. */}
                  <span className="absolute bottom-3 left-3 rounded-full bg-slate-900/75 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.06em] text-white">
                    {hub.photo.region}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-xl font-bold text-slate-900">{hub.title}</h3>
                  <p className="mt-2 flex-grow text-sm text-slate-600">{hub.body}</p>
                  <div className="mt-6 flex items-center text-sm font-semibold text-[#1B3C6C]">
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
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#1B3C6C]">
                <FileText className="h-4 w-4" />
                How OntarioReno Works
              </div>
              <h2 className="mt-4 text-3xl font-bold leading-tight tracking-[-0.03em] text-slate-900 md:text-4xl">
                Avoid costly renovation mistakes before committing.
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-600 md:text-lg">
                OntarioReno helps Ontario homeowners understand renovation costs, permit requirements, project feasibility, and the right next steps before moving forward.
              </p>
              <p className="mt-4 text-base leading-8 text-slate-500 md:text-lg">
                Most homeowners make decisions based on incomplete information — which leads to costly mistakes later.
              </p>
              <p className="mt-5 max-w-lg text-sm leading-7 text-slate-500 sm:text-base">
                Built to help homeowners make informed renovation decisions before moving forward.
              </p>
            </div>

            <div className="relative">
              <div className="absolute bottom-10 left-5 top-10 hidden w-px bg-[#1B3C6C]/10 md:block" />
              {[
                {
                  step: '01',
                  title: 'Review Your Project',
                  description:
                    'Share the basics of your renovation, property, budget, and timeline.',
                },
                {
                  step: '02',
                  title: 'Avoid Costly Planning Mistakes',
                  description:
                    'Identify cost, permit, and design decisions that commonly lead to delays, rework, or budget overruns.',
                },
                {
                  step: '03',
                  title: 'Choose the Right Next Step',
                  description:
                    'Determine the appropriate next step based on your scope, location, and project requirements.',
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
                applications today. Hamilton and St. Catharines have both closed their
                grants — their guides stay up for permits, costs, and legal-suite
                requirements, and the build can still be financed in full.
              </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {featuredPrograms.map((program, index) => (
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

      <div className="hidden md:block">
        <CitySelectorSection />
      </div>

      {/* The cost guide lead magnet. Extracted to a component so /costs
          can offer it too — see CostGuideCapture for why there must only
          ever be one implementation of it. */}
      <CostGuideCapture />

      {/* Project Review CTA */}
      <section className="bg-slate-900 py-20 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-16 h-16 bg-[#1B3C6C]/24 rounded-full flex items-center justify-center mb-7 mx-auto">
              <Hammer className="w-8 h-8 text-[#7FB0E0]" />
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-[-0.04em]">Ready to start your project?</h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
              Start with a clear project review built around scope, budget, and real track record. No random referrals, and no marketplace-style noise.
            </p>
            <div className="flex flex-col items-center gap-4">
              <Link
                to="/match"
                className={buttonStyles.primary}
              >
                Start Project Review
              </Link>
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
            {[
              {
                q: "Is OntarioReno a contracting company?",
                a: "No. OntarioReno is an independent homeowner resource platform. We provide educational content, cost guides, and a matching service to help homeowners make better decisions before hiring. We do not perform the renovation work ourselves."
              },
              {
                q: "How much does it cost to use your matching service?",
                a: "Our project review process is 100% free for homeowners. We may earn a referral fee from contractors in our network, but our positioning is based on project fit, not random placement or homeowner-facing bias."
              },
              {
                q: "How does the project review process work?",
                a: "We look at project scope, budget fit, location, and contractor track record. The goal is not to flood you with options. It is to help point you toward the next step that makes the most sense for your specific project."
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
    </div>
  );
}


