import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  Home,
  Landmark,
  Scale,
  TreePine,
  Users,
} from 'lucide-react';
import BarrieSecondarySuiteResources from '../components/BarrieSecondarySuiteResources';
import { buttonStyles } from '../lib/uiStyles';
import { cn } from '../lib/utils';

const lastUpdated = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
}).format(new Date());

const projectTypes = [
  {
    title: 'Family-use basement renovations',
    body: 'Finish lower-level space for living, recreation, work-from-home use, or more flexible family space.',
    icon: Home,
  },
  {
    title: 'Legal basement apartments',
    body: 'Plan a compliant second unit strategy with zoning, permits, life safety, and long-term rental use considered early.',
    icon: Building2,
  },
  {
    title: 'Detached garden suites',
    body: 'Compare detached backyard housing options against lot fit, servicing, and Barrie-specific project economics.',
    icon: TreePine,
  },
];

const motivations = [
  {
    title: 'Rental income',
    body: 'A properly planned Barrie secondary suite can support long-term rental income, but the funding path works best when homeowners understand the affordable-rental tradeoffs first.',
    icon: CircleDollarSign,
  },
  {
    title: 'Property flexibility',
    body: 'Barrie homeowners often compare a standard finished basement against a legal suite or detached unit when planning for multi-use property value.',
    icon: Users,
  },
  {
    title: 'Funding support',
    body: 'Barrie is unusual because the Simcoe County program and Barrie Bonus can materially change project economics for qualifying homeowners.',
    icon: Landmark,
  },
];

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-3xl">
      <h2 className="text-3xl font-bold tracking-[-0.03em] text-slate-900 md:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-lg leading-8 text-slate-600">{description}</p>
      )}
    </div>
  );
}

export default function BarrieBasementRenovation() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>Basement Renovation in Barrie | OntarioReno</title>
        <meta
          name="description"
          content="Planning a basement renovation in Barrie? Compare finished basements, legal secondary suites, garden suites, Barrie funding programs, permit requirements, and project costs."
        />
        <link rel="canonical" href="https://ontarioreno.ca/basement-renovation-barrie" />
      </Helmet>

      <section className="bg-slate-900 text-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center lg:px-8 lg:py-24">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/15 px-4 py-2 text-sm font-medium text-blue-200 ring-1 ring-white/10">
              <Landmark className="h-4 w-4" />
              Barrie basement renovation guide
            </div>

            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-[-0.03em] md:text-6xl">
              Basement Renovation in Barrie
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-8 text-slate-300">
              Whether you are finishing a basement for family use or exploring a legal rental suite, Barrie projects should be planned around cost, permits, funding options, and long-term use.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                to="/match"
                className={cn(buttonStyles.primary, 'w-full sm:w-auto')}
              >
                Review My Barrie Project
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/barrie-secondary-suite-funding"
                className={cn(buttonStyles.ghostDark, 'w-full sm:w-auto')}
              >
                See Barrie Funding
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-6 text-sm font-medium text-slate-300">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                Family-use and rental-use relevant
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                Barrie and Simcoe funding aware
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                Basement suite and garden suite relevant
              </span>
            </div>

            <p className="mt-6 text-sm text-slate-400">Last updated: {lastUpdated}</p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_24px_70px_rgba(2,6,23,0.28)] backdrop-blur-sm">
            <div className="rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(15,23,42,0.42)_100%)] p-6">
              <div className="mb-6 rounded-[1.2rem] border border-white/10 bg-white/90 px-5 py-4 shadow-[0_14px_36px_rgba(2,6,23,0.14)]">
                <div className="flex items-center justify-between gap-4">
                  <img
                    src="/images/barrie-logo.png"
                    alt="Barrie logo"
                    className="h-10 w-auto object-contain sm:h-12"
                  />
                  <div className="text-right">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Local market
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-700">
                      Barrie project context
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-200">
                Barrie has more than one renovation path
              </p>
              <h2 className="mt-4 text-3xl font-bold leading-tight tracking-[-0.03em] text-white">
                A simple basement finish is not the only direction.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                A basic basement finish, legal basement apartment, and detached garden suite can all lead to very different costs, permit requirements, and funding considerations.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">
              Quick answer: what should Barrie homeowners sort out first?
            </h2>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              Before pricing a Barrie basement project, separate five decisions: family use or rental use, basement suite or garden suite, permit requirements, funding eligibility, and total project cost.
            </p>
            <ul className="mt-6 space-y-3 text-slate-700">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <span>
                  Start with{' '}
                  <Link
                    to="/barrie-secondary-suite-funding"
                    className="font-semibold text-slate-900 underline underline-offset-4"
                  >
                    Barrie Secondary Suite Funding
                  </Link>{' '}
                  if the project depends on the County of Simcoe program or Barrie Bonus.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <span>
                  Compare{' '}
                  <Link
                    to="/barrie-secondary-suite-costs"
                    className="font-semibold text-slate-900 underline underline-offset-4"
                  >
                    Barrie Secondary Suite Costs
                  </Link>{' '}
                  before treating the funding amount as the whole budget story.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <span>
                  If you need legal-suite clarity, start with{' '}
                  <Link
                    to="/barrie-basement-apartment-permits"
                    className="font-semibold text-slate-900 underline underline-offset-4"
                  >
                    Barrie Basement Apartment Permits
                  </Link>{' '}
                  and{' '}
                  <Link
                    to="/barrie-aru-eligibility"
                    className="font-semibold text-slate-900 underline underline-offset-4"
                  >
                    Barrie ARU Eligibility
                  </Link>
                  .
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Types of Barrie projects homeowners usually compare"
            description="Barrie homeowners often start with a basement renovation question, then discover that the real choice is between several different project paths."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {projectTypes.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
              >
                <item.icon className="h-6 w-6 text-[#1B3C6C]" />
                <h3 className="mt-4 text-2xl font-bold text-slate-900">{item.title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{item.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-600">
            If you are deciding between an interior unit and a detached unit, compare{' '}
            <Link
              to="/barrie-basement-apartment-permits"
              className="font-semibold text-slate-900 underline underline-offset-4"
            >
              Barrie Basement Apartment Permits
            </Link>{' '}
            against{' '}
            <Link
              to="/barrie-garden-suites"
              className="font-semibold text-slate-900 underline underline-offset-4"
            >
              Barrie Garden Suites
            </Link>{' '}
            before locking in a direction.
          </p>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-blue-200 bg-blue-50 p-8 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-white p-3 text-[#1B3C6C]">
                <Landmark className="h-6 w-6" />
              </div>
              <div className="max-w-4xl">
                <h2 className="text-3xl font-bold tracking-[-0.03em] text-slate-900">
                  Barrie funding and incentive overview
                </h2>
                <p className="mt-4 text-lg leading-8 text-slate-700">
                  Barrie homeowners may be able to access up to $50,000 through the County of Simcoe program, plus a $15,000 Barrie Bonus for qualifying projects. That is not universal support, and it is tied to affordable-rental requirements.
                </p>
                <p className="mt-4 text-lg leading-8 text-slate-700">
                  Start with{' '}
                  <Link
                    to="/barrie-secondary-suite-funding"
                    className="font-semibold text-slate-900 underline underline-offset-4"
                  >
                    Barrie Secondary Suite Funding
                  </Link>{' '}
                  before assuming the economics work. If you also want to understand permit-fee savings, compare{' '}
                  <Link
                    to="/barrie-aru-permit-rebate"
                    className="font-semibold text-slate-900 underline underline-offset-4"
                  >
                    Barrie ARU Permit Rebate
                  </Link>{' '}
                  if you also want to understand permit-fee savings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Cost and feasibility in Barrie"
            description="Barrie projects can diverge quickly in price once the scope moves from standard finishing toward a legal suite or detached unit."
          />
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Standard basement renovation
              </p>
              <p className="mt-3 text-4xl font-bold tracking-[-0.03em] text-slate-900">
                Often lower than a legal-suite path
              </p>
              <p className="mt-4 leading-7 text-slate-600">
                Approximate planning range only. Scope depends on layout changes, bathroom additions, finish level, and whether the project stays family-use.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Secondary suite / garden suite path
              </p>
              <p className="mt-3 text-4xl font-bold tracking-[-0.03em] text-slate-900">
                Usually higher and more variable
              </p>
              <p className="mt-4 leading-7 text-slate-600">
                Approximate planning range only. Costs widen once the project includes life safety, separate-entry work, detached-unit servicing, or permit-heavy compliance upgrades.
              </p>
            </div>
          </div>
          <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-600">
            For the full budget picture, compare{' '}
            <Link
              to="/barrie-secondary-suite-costs"
              className="font-semibold text-slate-900 underline underline-offset-4"
            >
              Barrie Secondary Suite Costs
            </Link>
            . If the question is whether the property should even pursue the suite path, review{' '}
            <Link
              to="/barrie-aru-eligibility"
              className="font-semibold text-slate-900 underline underline-offset-4"
            >
              Barrie ARU Eligibility
            </Link>{' '}
            before treating any cost range as final.
          </p>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Legal and permit planning in Barrie"
            description="The strongest Barrie outcomes usually come from aligning permit scope, property fit, and intended use before construction assumptions harden."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              'Zoning and property-use fit',
              'Building code and life safety requirements',
              'Permit submission and inspection path',
            ].map((item) => (
              <div
                key={item}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <Scale className="mt-1 h-5 w-5 shrink-0 text-[#1B3C6C]" />
                  <p className="text-lg font-semibold text-slate-900">{item}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-600">
            Interior basement suites usually start with permit and code planning. Detached units usually require broader site, servicing, and design review. Start with{' '}
            <Link
              to="/barrie-basement-apartment-permits"
              className="font-semibold text-slate-900 underline underline-offset-4"
            >
              Barrie Basement Apartment Permits
            </Link>{' '}
            if the project is an interior suite. If you are comparing a detached unit, move next to{' '}
            <Link
              to="/barrie-garden-suites"
              className="font-semibold text-slate-900 underline underline-offset-4"
            >
              Barrie Garden Suites
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Why some Barrie homeowners consider rental-ready space"
            description="Most Barrie homeowners are not just renovating for finish level. They are usually comparing long-term utility, income, and property flexibility."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {motivations.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
              >
                <item.icon className="h-6 w-6 text-[#1B3C6C]" />
                <h3 className="mt-4 text-2xl font-bold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-3 leading-7 text-slate-600">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <BarrieSecondarySuiteResources />

      <section className="bg-slate-900 py-20 text-white">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 px-8 py-12 shadow-[0_24px_70px_rgba(2,6,23,0.28)]">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-200">
              Next step
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-[-0.03em] md:text-5xl">
              Plan the right Barrie basement project from the start.
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300">
              We help homeowners compare standard basement renovation, legal secondary suite, and garden suite directions before they move too far into quotes, permits, or funding assumptions.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                to="/match"
                className={cn(buttonStyles.primary, 'w-full sm:w-auto')}
              >
                Review My Barrie Project
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/barrie-secondary-suite-funding"
                className={cn(buttonStyles.ghostDark, 'w-full sm:w-auto')}
              >
                Barrie Funding Guide
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
