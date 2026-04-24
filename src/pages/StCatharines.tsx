import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  FileText,
  Home,
  Landmark,
  Scale,
  Users,
} from 'lucide-react';
import { buttonStyles } from '../lib/uiStyles';
import { cn } from '../lib/utils';

const lastUpdated = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
}).format(new Date());

const projectTypes = [
  {
    title: 'Basement apartments',
    body: 'Convert existing lower-level space into a self-contained rental-ready layout with code and permit requirements considered early.',
  },
  {
    title: 'Legal secondary suites',
    body: 'Plan a compliant second unit strategy with zoning, fire/life safety, and building-code alignment built into the project scope.',
  },
  {
    title: 'Garden suites / detached ADUs',
    body: 'Evaluate detached-unit feasibility, servicing needs, lot constraints, and permit path before committing to design assumptions.',
  },
  {
    title: 'Garage conversions',
    body: 'Assess whether attached or detached garage space can support a viable ARU conversion under local zoning and code conditions.',
  },
];

const motivations = [
  {
    title: 'Rental income',
    body: 'A properly planned St. Catharines basement apartment or ADU can create long-term rental income and improve project economics.',
    icon: CircleDollarSign,
  },
  {
    title: 'Property value',
    body: 'Additional legal residential space can strengthen resale positioning and broaden buyer interest when executed with permits and compliance in mind.',
    icon: Home,
  },
  {
    title: 'Multi-generational living',
    body: 'Secondary suites and ADUs can support family housing flexibility while preserving privacy and independent living options.',
    icon: Users,
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

export default function StCatharines() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>
          Basement Renovations & ADUs in St. Catharines | OntarioReno
        </title>
        <meta
          name="description"
          content="Explore St. Catharines basement renovation, secondary suite, and ADU planning with OntarioReno. Learn project types, incentives, cost expectations, legal considerations, and next steps."
        />
        <link rel="canonical" href="https://ontarioreno.ca/st-catharines" />
      </Helmet>

      <section className="bg-slate-900 text-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center lg:px-8 lg:py-24">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/15 px-4 py-2 text-sm font-medium text-blue-200 ring-1 ring-white/10">
              <Landmark className="h-4 w-4" />
              St. Catharines housing guide
            </div>

            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-[-0.03em] md:text-6xl">
              Basement Renovations & ADUs in St. Catharines
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-8 text-slate-300">
              St. Catharines homeowners are building legal basement apartments
              and additional residential units to create rental income, expand
              usable housing space, and strengthen long-term property value.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                to="/match"
                className={cn(buttonStyles.primary, 'w-full sm:w-auto')}
              >
                Book Assessment
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/match"
                className={cn(buttonStyles.ghostDark, 'w-full sm:w-auto')}
              >
                Check Eligibility
              </Link>
            </div>

            <p className="mt-6 text-sm text-slate-400">
              Last updated: {lastUpdated}
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_24px_70px_rgba(2,6,23,0.28)] backdrop-blur-sm">
            <div className="rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.1)_0%,rgba(15,23,42,0.4)_100%)] p-6">
              <div className="mb-6 rounded-[1.2rem] border border-white/10 bg-white/92 px-5 py-4 shadow-[0_14px_36px_rgba(2,6,23,0.14)]">
                <div className="flex items-center justify-between gap-4">
                  <img
                    src="/images/st-catharines-logo.png"
                    alt="St. Catharines logo"
                    className="h-10 w-auto object-contain sm:h-12"
                  />
                  <div className="text-right">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Local market
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-700">
                      St. Catharines context
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-200">
                City hub purpose
              </p>
              <h2 className="mt-4 text-3xl font-bold leading-tight tracking-[-0.03em] text-white">
                Start with the full St. Catharines picture before budgeting.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                This page is the main OntarioReno hub for St. Catharines
                basement renovation, ADU, and secondary suite research, with
                direct paths into incentives, legal requirements, and project
                planning guidance.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeading
            title="Introduction"
            description="Demand for St. Catharines basement apartments and ARUs continues to grow as homeowners respond to rental demand, housing expansion goals, and the need for more flexible property use."
          />
          <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-600">
            Homeowners are increasingly comparing basement conversions,
            secondary suites, and detached ADU options as part of long-term
            planning. In practice, the strongest outcomes usually come from
            aligning zoning, permit strategy, and project economics before
            design assumptions lock in. That usually means reviewing the{' '}
            <Link
              to="/st-catharines-adu-permits"
              className="font-semibold text-slate-900 underline underline-offset-4"
            >
              St. Catharines permit requirements
            </Link>{' '}
            and the{' '}
            <Link
              to="/st-catharines-adu-cost"
              className="font-semibold text-slate-900 underline underline-offset-4"
            >
              local cost ranges
            </Link>{' '}
            before choosing a direction.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Types of projects in St. Catharines"
            description="St. Catharines homeowners usually compare a small set of core ARU-ready project types."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {projectTypes.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
              >
                <h3 className="text-2xl font-bold text-slate-900">{item.title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{item.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-600">
            If the project depends on incentive support, the most relevant next
            read is the{' '}
            <Link
              to="/st-catharines-adu-grant"
              className="font-semibold text-slate-900 underline underline-offset-4"
            >
              St. Catharines ADU grant guide
            </Link>
            .
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
                  Incentives and grants in St. Catharines
                </h2>
                <p className="mt-4 text-lg leading-8 text-slate-700">
                  St. Catharines has offered financial incentive pathways
                  connected to ARU construction and housing expansion goals.
                  Program structure, eligibility criteria, and intake windows
                  can vary, so this page keeps the overview high-level while the{' '}
                  <Link
                    to="/st-catharines-adu-permits"
                    className="font-semibold text-slate-900 underline underline-offset-4"
                  >
                    permit guide
                  </Link>{' '}
                  and{' '}
                  <Link
                    to="/st-catharines-adu-cost"
                    className="font-semibold text-slate-900 underline underline-offset-4"
                  >
                    cost guide
                  </Link>{' '}
                  handle the practical side.
                </p>
                <Link
                  to="/st-catharines-adu-grant"
                  className="mt-5 inline-flex items-center gap-2 text-base font-semibold text-slate-900 underline underline-offset-4"
                >
                  Explore St. Catharines ADU grant overview
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Cost overview"
            description="Basement renovations and ARU projects in St. Catharines can vary substantially based on existing conditions, code scope, and unit type."
          />
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Basement renovation
              </p>
              <p className="mt-3 text-4xl font-bold tracking-[-0.03em] text-slate-900">
                ~ $45K to $110K+
              </p>
              <p className="mt-4 leading-7 text-slate-600">
                Range depends on layout changes, plumbing work, life-safety
                upgrades, and target finish level.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                ARU / secondary suite
              </p>
              <p className="mt-3 text-4xl font-bold tracking-[-0.03em] text-slate-900">
                ~ $70K to $250K+
              </p>
              <p className="mt-4 leading-7 text-slate-600">
                Costs vary by whether the unit is interior, attached, or
                detached, plus servicing and permitting complexity.
              </p>
            </div>
          </div>
          <Link
            to="/st-catharines-adu-cost"
            className="mt-8 inline-flex items-center gap-2 text-base font-semibold text-slate-900 underline underline-offset-4"
          >
            View detailed St. Catharines cost guide
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-600">
            Cost only makes sense in context. If you are unsure whether the
            property can support the unit legally, review the{' '}
            <Link
              to="/st-catharines-adu-permits"
              className="font-semibold text-slate-900 underline underline-offset-4"
            >
              legal and permit requirements
            </Link>{' '}
            before treating any number as final.
          </p>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Legal and permit overview"
            description="St. Catharines ARU and basement apartment planning must align zoning, building code, and permit requirements from day one."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              'Zoning and land-use rules',
              'Building code and life safety',
              'Permit application and inspections',
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
          <Link
            to="/st-catharines-adu-permits"
            className="mt-8 inline-flex items-center gap-2 text-base font-semibold text-slate-900 underline underline-offset-4"
          >
            Review St. Catharines legal and permit guide
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-600">
            Once permit fit is clearer, homeowners usually move next to either
            the{' '}
            <Link
              to="/st-catharines-adu-cost"
              className="font-semibold text-slate-900 underline underline-offset-4"
            >
              cost page
            </Link>{' '}
            or the{' '}
            <Link
              to="/st-catharines-adu-grant"
              className="font-semibold text-slate-900 underline underline-offset-4"
            >
              grant page
            </Link>{' '}
            depending on whether budget or funding is the bigger question.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Why homeowners are building ARUs"
            description="For most households, ARU decisions are driven by long-term utility, income, and flexibility rather than short-term trends."
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
          <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-600">
            Homeowners who want the most complete picture usually compare all
            three supporting pages together: permits first, then cost, then
            incentive fit.
          </p>
        </div>
      </section>

      <section className="bg-slate-900 py-20 text-white">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 px-8 py-12 shadow-[0_24px_70px_rgba(2,6,23,0.28)]">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-200">
              Next step
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-[-0.03em] md:text-5xl">
              Move forward with the right St. Catharines project strategy.
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300">
              Get a clear read on property fit, project direction, and likely
              next steps before committing budget to the wrong scope.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                to="/match"
                className={cn(buttonStyles.primary, 'w-full sm:w-auto')}
              >
                Book Assessment
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/match"
                className={cn(buttonStyles.ghostDark, 'w-full sm:w-auto')}
              >
                Check Property
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm font-medium text-slate-300">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                St. Catharines basement renovation
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                St. Catharines secondary suite
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                St. Catharines garden suite
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
