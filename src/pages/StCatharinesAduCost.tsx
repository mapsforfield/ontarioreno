import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  FileCheck2,
  Home,
  Landmark,
  Layers3,
  Ruler,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { buttonStyles } from '../lib/uiStyles';
import { cn } from '../lib/utils';

const lastUpdated = 'April 2026';

const costRanges = [
  {
    title: 'Basement apartment',
    range: '~ $45,000 - $110,000+',
    detail:
      'Usually the lower-cost entry point when the existing basement condition is workable and major structural changes are limited.',
  },
  {
    title: 'Full legal secondary suite',
    range: '~ $70,000 - $150,000+',
    detail:
      'Costs rise when layout changes, separate entrances, fire separation, and full compliance upgrades are required.',
  },
  {
    title: 'Detached ADU / garden suite',
    range: '~ $150,000 - $300,000+',
    detail:
      'Detached units carry higher construction and servicing costs but can offer stronger long-term flexibility and value potential.',
  },
];

const costDrivers = [
  {
    title: 'Existing basement condition',
    body: 'Older or partially finished basements can require more correction work before layout upgrades even begin.',
    icon: Home,
  },
  {
    title: 'Plumbing and layout changes',
    body: 'Moving kitchens, bathrooms, and drainage points can materially shift budget and complexity.',
    icon: Wrench,
  },
  {
    title: 'Separate entrance requirements',
    body: 'New or modified entrances often add meaningful construction scope and inspection requirements.',
    icon: FileCheck2,
  },
  {
    title: 'Ceiling height and structural work',
    body: 'Low clearances, beams, and framing constraints can trigger structural adjustments and added cost.',
    icon: Ruler,
  },
  {
    title: 'Fire separation and code compliance',
    body: 'Legal unit pathways usually require more robust life-safety assemblies and compliance details.',
    icon: ShieldCheck,
  },
  {
    title: 'Electrical and HVAC upgrades',
    body: 'Service capacity, distribution changes, and ventilation upgrades are common cost escalators.',
    icon: Layers3,
  },
];

const hiddenCosts = [
  'Permits and drawings',
  'Engineering and design coordination',
  'Utility upgrades',
  'Excavation for entrances',
  'Soundproofing and fire-code assemblies',
];

const fitItems = [
  'Homeowners planning to hold the property long-term',
  'Owners focused on rental income and usable expansion',
  'Projects where available capital can cover remaining costs',
  'Households that want compliance done properly the first time',
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

export default function StCatharinesAduCost() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>St. Catharines Basement & ADU Cost Guide (2026)</title>
        <meta
          name="description"
          content="See real basement renovation and ADU costs in St. Catharines, including secondary suites and garden suites, with realistic pricing and grant impact."
        />
        <link
          rel="canonical"
          href="https://ontarioreno.ca/st-catharines-adu-cost"
        />
      </Helmet>

      <section className="bg-slate-900 text-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center lg:px-8 lg:py-24">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/15 px-4 py-2 text-sm font-medium text-blue-200 ring-1 ring-white/10">
              <Landmark className="h-4 w-4" />
              St. Catharines cost planning guide
            </div>

            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-[-0.03em] md:text-6xl">
              St. Catharines Basement & ADU Cost Guide
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-8 text-slate-300">
              St. Catharines basement renovation and ADU costs vary widely
              based on existing conditions, layout changes, and the level of
              legal/compliance work required. If you are starting from scratch,
              the{' '}
              <Link
                to="/st-catharines"
                className="font-semibold text-white underline underline-offset-4"
              >
                St. Catharines city hub
              </Link>{' '}
              gives the broader planning context first.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                to="/match"
                className={cn(buttonStyles.primary, 'w-full sm:w-auto')}
              >
                Check Eligibility
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/match"
                className={cn(buttonStyles.ghostDark, 'w-full sm:w-auto')}
              >
                Book Assessment
              </Link>
            </div>

            <p className="mt-6 text-sm text-slate-400">
              Last updated: {lastUpdated}
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_24px_70px_rgba(2,6,23,0.28)] backdrop-blur-sm">
            <div className="rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(15,23,42,0.42)_100%)] p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-200">
                Cost reality
              </p>
              <h2 className="mt-4 text-3xl font-bold leading-tight tracking-[-0.03em] text-white">
                The biggest pricing mistakes happen before scope is clear.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                This guide is built to help homeowners avoid low-end assumptions
                that break once permit, layout, and compliance requirements are
                fully accounted for.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeading
            title="Quick cost ranges"
            description="These are realistic planning bands for homeowners comparing basement apartment, legal suite, and detached unit options in St. Catharines."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {costRanges.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-7 shadow-sm"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {item.title}
                </p>
                <p className="mt-3 text-4xl font-bold tracking-[-0.03em] text-slate-900">
                  {item.range}
                </p>
                <p className="mt-4 leading-7 text-slate-600">{item.detail}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-600">
            These ranges get stronger once you compare them with the{' '}
            <Link
              to="/st-catharines-adu-permits"
              className="font-semibold text-slate-900 underline underline-offset-4"
            >
              permit requirements
            </Link>{' '}
            that shape real scope.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Why costs vary"
            description="Project budgets move most when physical constraints and compliance requirements are discovered late."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {costDrivers.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <item.icon className="h-5 w-5 text-[#1B3C6C]" />
                <h3 className="mt-3 text-xl font-bold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-3 leading-7 text-slate-600">{item.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-600">
            In practice, legal and permit requirements are often the reason a
            budget moves from optimistic to realistic, which is why the{' '}
            <Link
              to="/st-catharines-adu-permits"
              className="font-semibold text-slate-900 underline underline-offset-4"
            >
              permit guide
            </Link>{' '}
            is part of the same cluster.
          </p>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
              <SectionHeading
                title="Hidden costs homeowners miss"
                description="These line items often get ignored in early conversations and then reappear later as budget pressure."
              />
              <div className="mt-8 space-y-4">
                {hiddenCosts.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <p className="leading-7 text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-blue-200 bg-blue-50 p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900">
                Basement vs detached unit
              </h2>
              <div className="mt-6 grid gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Basement unit
                  </p>
                  <p className="mt-3 leading-7 text-slate-700">
                    Lower cost, faster timeline, and usually easier approval
                    compared with detached construction.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Detached unit
                  </p>
                  <p className="mt-3 leading-7 text-slate-700">
                    Higher cost but stronger long-term flexibility and often
                    better value potential for the property.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="How the St. Catharines grant affected cost (closed)"
            description="The cash grant is closed to new applications as of August 6, 2026. This is kept as reference for how the funding worked, and for anyone already in the program."
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <p className="leading-7 text-slate-700">
                    While open, funding covered up to 70% of eligible costs.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <p className="leading-7 text-slate-700">
                    Caps were $40,000 for interior projects and $80,000 for
                    exterior projects, where eligible.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <p className="leading-7 text-slate-700">
                    Grant funding does not cover full project cost and does not
                    apply to every line item automatically.
                  </p>
                </div>
              </div>
              <Link
                to="/st-catharines-adu-grant"
                className="mt-6 inline-flex items-center gap-2 text-base font-semibold text-slate-900 underline underline-offset-4"
              >
                Review full St. Catharines grant details
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="mt-5 text-sm leading-7 text-slate-600">
                That grant page is the primary next step if funding support is
                part of how the project becomes feasible.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Realistic budget example
              </p>
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between rounded-2xl bg-white px-5 py-4 ring-1 ring-slate-200">
                  <span className="font-medium text-slate-700">
                    Basement project
                  </span>
                  <span className="text-xl font-bold text-slate-900">$80,000</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white px-5 py-4 ring-1 ring-slate-200">
                  <span className="font-medium text-slate-700">
                    Grant support (if eligible)
                  </span>
                  <span className="text-xl font-bold text-emerald-700">$40,000</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-900 px-5 py-4 text-white">
                  <span className="font-medium">Estimated out-of-pocket</span>
                  <span className="text-xl font-bold">~ $40,000</span>
                </div>
              </div>
              <p className="mt-5 text-sm leading-7 text-slate-600">
                Example shown for planning context only. Actual numbers depend on
                scope, eligible costs, approval outcomes, and whether the
                property can meet the{' '}
                <Link
                  to="/st-catharines-adu-permits"
                  className="font-semibold text-slate-900 underline underline-offset-4"
                >
                  legal requirements
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
              <SectionHeading
                title="What a realistic budget should include"
                description="Strong projects plan for compliance, contingency, and financing structure early, not after design is finalized."
              />
              <div className="mt-8 space-y-4">
                {fitItems.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1B3C6C]" />
                    <p className="leading-7 text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900">
                Internal planning links
              </h2>
              <div className="mt-6 space-y-3">
                <Link
                  to="/st-catharines"
                  className="block font-semibold text-slate-900 underline underline-offset-4"
                >
                  St. Catharines city hub
                </Link>
                <Link
                  to="/st-catharines-adu-grant"
                  className="block font-semibold text-slate-900 underline underline-offset-4"
                >
                  St. Catharines ADU grant guide
                </Link>
                <Link
                  to="/st-catharines-adu-permits"
                  className="block font-semibold text-slate-900 underline underline-offset-4"
                >
                  St. Catharines permit and legal guide
                </Link>
              </div>
              <p className="mt-6 text-sm leading-7 text-slate-600">
                Use these together: start with city context, confirm permit
                reality, and then budget with grant assumptions only where
                they are verified. If you have not already, the{' '}
                <Link
                  to="/st-catharines-adu-grant"
                  className="font-semibold text-slate-900 underline underline-offset-4"
                >
                  grant guide
                </Link>{' '}
                is usually the best next page from here.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-900 py-20 text-white">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 px-8 py-12 shadow-[0_24px_70px_rgba(2,6,23,0.28)]">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-200">
              Next step
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-[-0.03em] md:text-5xl">
              Check property fit before spending on the wrong scope.
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300">
              The fastest way to waste money is budgeting around assumptions
              that do not survive permit and compliance review.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                to="/match"
                className={cn(buttonStyles.primary, 'w-full sm:w-auto')}
              >
                Check Property Fit
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/st-catharines-adu-grant"
                className={cn(buttonStyles.ghostDark, 'w-full sm:w-auto')}
              >
                Understand Grant Eligibility
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
