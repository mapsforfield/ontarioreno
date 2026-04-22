import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  FileCheck2,
  FileSearch,
  Flame,
  Home,
  Landmark,
  LayoutGrid,
  Ruler,
  ShieldCheck,
} from 'lucide-react';
import { buttonStyles } from '../lib/uiStyles';
import { cn } from '../lib/utils';

const lastUpdated = 'April 2026';

const legalBasics = [
  'Self-contained unit design',
  'Separate entrance planning where required',
  'Fire separation and life-safety provisions',
  'Egress window and safe exit considerations',
  'Minimum ceiling height compliance',
  'Code-compliant plumbing and electrical work',
];

const zoningItems = [
  {
    title: 'Property qualification',
    body: 'Not all properties qualify the same way. Lot layout and existing conditions can materially affect feasibility.',
  },
  {
    title: 'Lot size and configuration',
    body: 'Lot dimensions and site layout influence unit placement, access, and overall compliance strategy.',
  },
  {
    title: 'Parking and access',
    body: 'Parking expectations and access conditions may apply depending on property context and unit type.',
  },
  {
    title: 'Setbacks for detached units',
    body: 'Detached ADU and garden suite concepts are typically more sensitive to setback and placement constraints.',
  },
  {
    title: 'Urban boundary context',
    body: 'Planning assumptions can differ based on where the property sits within St. Catharines development context.',
  },
];

const safetyItems = [
  'Fire-rated separation between units',
  'Smoke and carbon monoxide detector placement',
  'Egress and emergency exit requirements',
  'HVAC and ventilation compliance',
  'Sound separation considerations',
];

const permitSteps = [
  { step: '01', title: 'Check zoning', detail: 'Confirm that the property and proposed unit type align with municipal planning expectations.' },
  { step: '02', title: 'Create plans', detail: 'Prepare drawings and technical scope that reflect code and permit requirements.' },
  { step: '03', title: 'Submit application', detail: 'Submit permit documentation through the municipal process with required supporting materials.' },
  { step: '04', title: 'Review and approval', detail: 'Municipal teams review the file and request revisions where needed before approval.' },
  { step: '05', title: 'Inspections', detail: 'Required inspections occur through key project stages to confirm code compliance.' },
  { step: '06', title: 'Final compliance', detail: 'Project completion is tied to final compliance outcomes, not just construction completion.' },
];

const commonMistakes = [
  'Starting construction before permits are in place',
  'Underestimating building code scope',
  'Assuming any basement automatically qualifies as legal',
  'Ignoring ceiling height and entrance constraints early',
];

const whoShouldCheck = [
  'Homeowners planning a basement apartment or secondary suite',
  'Owners evaluating detached ADU or garden suite options',
  'Households at early planning stage before final budget decisions',
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

export default function StCatharinesAduPermits() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>St. Catharines Basement & ADU Requirements Guide</title>
        <meta
          name="description"
          content="Learn the legal requirements for basement apartments, secondary suites, and ADUs in St. Catharines, including permits, zoning, and building code basics."
        />
        <link
          rel="canonical"
          href="https://ontarioreno.ca/st-catharines-adu-permits"
        />
      </Helmet>

      <section className="bg-slate-900 text-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center lg:px-8 lg:py-24">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/15 px-4 py-2 text-sm font-medium text-blue-200 ring-1 ring-white/10">
              <Landmark className="h-4 w-4" />
              St. Catharines legal and permit guide
            </div>

            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-[-0.03em] md:text-6xl">
              St. Catharines Basement & ADU Requirements
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-8 text-slate-300">
              Legal basement apartments and ADUs in St. Catharines must align
              with zoning, building code, and permit requirements before
              construction decisions are locked in. For the broader local
              overview, start with the{' '}
              <Link
                to="/st-catharines"
                className="font-semibold text-white underline underline-offset-4"
              >
                St. Catharines city hub
              </Link>
              .
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                to="/match"
                className={cn(buttonStyles.primary, 'w-full sm:w-auto')}
              >
                Check Property
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
                Why this page matters
              </p>
              <h2 className="mt-4 text-3xl font-bold leading-tight tracking-[-0.03em] text-white">
                Approval risk is usually a planning problem, not a construction problem.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                Homeowners who check legal and permit fit first usually avoid
                costly redesigns, delays, and assumptions that fail in review.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeading
            title="What makes a basement apartment legal"
            description="Most legal basement pathways are defined by safety, separation, and independent-living functionality."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {legalBasics.map((item) => (
              <div
                key={item}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <p className="leading-7 text-slate-700">{item}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-600">
            Once this legal baseline is clearer, homeowners usually move next
            to the{' '}
            <Link
              to="/st-catharines-adu-cost"
              className="font-semibold text-slate-900 underline underline-offset-4"
            >
              cost guide
            </Link>{' '}
            to understand what compliance may do to budget.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Zoning and property requirements"
            description="Not every property can support every unit type. Site constraints and planning context matter early."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {zoningItems.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <LayoutGrid className="h-5 w-5 text-[#1B3C6C]" />
                <h3 className="mt-3 text-xl font-bold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-3 leading-7 text-slate-600">{item.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm leading-7 text-slate-600">
            Note: exact requirements can vary by property and municipal review.
            Homeowners should verify current zoning and planning conditions with
            the City before relying on assumptions. If incentive support is part
            of the plan, compare these constraints against the{' '}
            <Link
              to="/st-catharines-adu-grant"
              className="font-semibold text-slate-900 underline underline-offset-4"
            >
              grant requirements overview
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Building code and safety requirements"
            description="Code compliance is central to legal unit approval and long-term use."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {safetyItems.map((item) => (
              <div
                key={item}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <Flame className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                  <p className="leading-7 text-slate-700">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Permit process overview"
            description="Most files follow a similar sequence from zoning check to final compliance."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {permitSteps.map((item) => (
              <div
                key={item.step}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
                  Step {item.step}
                </p>
                <h3 className="mt-3 text-xl font-bold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-3 leading-7 text-slate-600">{item.detail}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-600">
            Homeowners comparing budget and schedule at this stage should keep
            the{' '}
            <Link
              to="/st-catharines-adu-cost"
              className="font-semibold text-slate-900 underline underline-offset-4"
            >
              cost guide
            </Link>{' '}
            open alongside this page.
          </p>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
              <SectionHeading
                title="Detached ADU and garden suite rules"
                description="Detached units are usually more complex than basement conversions because site, servicing, and placement constraints are more demanding."
              />
              <div className="mt-8 space-y-4">
                {[
                  'Detached unit servicing for water and sewer is a key feasibility factor.',
                  'Setbacks and unit placement can limit where detached structures are possible.',
                  'Additional approvals and technical scope may be required compared with interior conversions.',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <FileSearch className="mt-0.5 h-5 w-5 shrink-0 text-[#1B3C6C]" />
                    <p className="leading-7 text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-sm leading-7 text-slate-600">
                Detached-unit homeowners often compare this section directly
                with the{' '}
                <Link
                  to="/st-catharines-adu-cost"
                  className="font-semibold text-slate-900 underline underline-offset-4"
                >
                  detached ADU cost ranges
                </Link>{' '}
                and the{' '}
                <Link
                  to="/st-catharines-adu-grant"
                  className="font-semibold text-slate-900 underline underline-offset-4"
                >
                  exterior grant cap
                </Link>
                .
              </p>
            </div>

            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900">
                Common mistakes homeowners make
              </h2>
              <div className="mt-6 space-y-4">
                {commonMistakes.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                    <p className="leading-7 text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="How requirements impact cost and timeline"
            description="Compliance scope drives both price and schedule. Cutting corners usually creates higher downstream cost and delay risk."
          />
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-lg leading-8 text-slate-600">
              Permit review, safety upgrades, and design revisions can
              materially affect total budget and timeline. Projects that start
              with weak assumptions often pay twice: once in redesign and once
              in delay.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:gap-6">
              <Link
                to="/st-catharines-adu-cost"
                className="font-semibold text-slate-900 underline underline-offset-4"
              >
                See St. Catharines cost guide
              </Link>
              <Link
                to="/st-catharines-adu-grant"
                className="font-semibold text-slate-900 underline underline-offset-4"
              >
                See St. Catharines grant guide
              </Link>
            </div>
            <p className="mt-6 text-sm leading-7 text-slate-600">
              If you need the broader page that ties these pieces together, use
              the{' '}
              <Link
                to="/st-catharines"
                className="font-semibold text-slate-900 underline underline-offset-4"
              >
                main St. Catharines hub
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
              <SectionHeading
                title="Who should check this first"
                description="The earlier legal and permit fit is checked, the lower the chance of expensive scope mistakes."
              />
              <div className="mt-8 space-y-4">
                {whoShouldCheck.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    <p className="leading-7 text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900">
                Related St. Catharines guides
              </h2>
              <div className="mt-6 space-y-3">
                <Link
                  to="/st-catharines"
                  className="block font-semibold text-slate-900 underline underline-offset-4"
                >
                  St. Catharines city hub
                </Link>
                <Link
                  to="/st-catharines-adu-cost"
                  className="block font-semibold text-slate-900 underline underline-offset-4"
                >
                  St. Catharines cost guide
                </Link>
                <Link
                  to="/st-catharines-adu-grant"
                  className="block font-semibold text-slate-900 underline underline-offset-4"
                >
                  St. Catharines grant guide
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white pb-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] p-8 shadow-[0_24px_70px_rgba(15,23,42,0.06)] md:p-10">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-slate-900 p-3 text-white">
                <Home className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-3xl font-bold tracking-[-0.03em] text-slate-900">
                  Important disclaimer
                </h2>
                <p className="mt-4 text-lg leading-8 text-slate-600">
                  OntarioReno is an independent private platform. We are not
                  the City of St. Catharines and we do not issue approvals.
                </p>
                <p className="mt-4 text-lg leading-8 text-slate-600">
                  Requirements, interpretations, and application conditions may
                  change. Final approval always depends on municipal review and
                  applicable regulations at the time of application.
                </p>
              </div>
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
              Check legal fit before committing budget.
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300">
              A proper early review helps avoid costly mistakes and keeps scope,
              compliance, and timeline aligned from the start.
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
                to="/st-catharines"
                className={cn(buttonStyles.ghostDark, 'w-full sm:w-auto')}
              >
                Back to St. Catharines hub
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
