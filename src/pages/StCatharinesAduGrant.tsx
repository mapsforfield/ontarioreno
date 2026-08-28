import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  CircleDollarSign,
  FileCheck2,
  FileText,
  Home,
  Landmark,
  ShieldCheck,
} from 'lucide-react';
import StCatharinesGrantCalculator from '../components/StCatharinesGrantCalculator';
import ProgramClosedNotice from '../components/ProgramClosedNotice';
import {
  BASEMENT_FINANCING_OFFER,
  ST_CATHARINES_ADU_CLOSURE,
} from '../lib/programClosures';
import { buttonStyles } from '../lib/uiStyles';
import { cn } from '../lib/utils';

const lastUpdated = 'April 2026';

const snapshotItems = [
  {
    label: 'Funding coverage',
    value: 'Up to 70%',
    detail: 'Program funding may cover up to 70% of eligible project costs.',
    icon: CircleDollarSign,
  },
  {
    label: 'Interior units',
    value: 'Up to $40,000',
    detail: 'Interior ADUs, including basement apartment-style units, can be funded up to $40,000.',
    icon: Home,
  },
  {
    label: 'Exterior units',
    value: 'Up to $80,000',
    detail: 'Exterior or detached ADU projects can be funded up to $80,000.',
    icon: Building2,
  },
  {
    label: 'Intake model',
    value: 'First-come, first-served',
    detail: 'Funding is limited and allocated by intake order and program availability.',
    icon: CalendarClock,
  },
  {
    label: 'Final approval',
    value: 'Municipal review required',
    detail: 'Final eligibility depends on City review, eligible costs, and program rules.',
    icon: FileCheck2,
  },
];

const programBenefits = [
  'Upfront capital relief that can improve early project feasibility',
  'A lower barrier to creating legal rental units on qualifying properties',
  'Improved project economics for owners planning long-term rental use',
  'More flexibility in how homeowners phase budget and construction decisions',
];

const bestFitItems = [
  'Homeowners planning a legal basement apartment in St. Catharines',
  'Owners comparing detached ADU or garden suite funding paths',
  'Properties positioned for long-term rental income strategy',
  'Households prepared to follow permits, zoning, and code requirements',
];

const processSteps = [
  {
    step: '01',
    title: 'Check property and project fit',
    detail:
      'Start with whether the property and intended unit type reasonably align with City requirements.',
  },
  {
    step: '02',
    title: 'Review the funding framework',
    detail:
      'Understand the 70% funding model and the interior versus exterior funding caps before budgeting.',
  },
  {
    step: '03',
    title: 'Confirm current availability',
    detail:
      'Verify whether funding remains available and whether the intake is active for your project type.',
  },
  {
    step: '04',
    title: 'Prepare application requirements',
    detail:
      'Organize project details, required plans, and supporting documents tied to City program requirements.',
  },
  {
    step: '05',
    title: 'Proceed through municipal review',
    detail:
      'If eligible, move through formal review, permit steps, and project execution in the approved framework.',
  },
];

const faqs = [
  {
    question: 'Is the St. Catharines ADU grant still available?',
    answer:
      'Program funding is limited and first-come, first-served. A significant portion of funding has already been committed, so homeowners should verify current availability directly with the City of St. Catharines.',
  },
  {
    question: 'How much does the St. Catharines ADU grant cover?',
    answer:
      'The program framework indicates funding can cover up to 70% of eligible costs, with interior units funded up to $40,000 and exterior units funded up to $80,000, subject to program rules and City review.',
  },
  {
    question: 'Is there funding for a basement apartment in St. Catharines?',
    answer:
      'The program framework includes interior unit funding, which can apply to basement apartment-type ADU projects when the property and project meet municipal requirements.',
  },
  {
    question: 'Is there funding for a detached garden suite in St. Catharines?',
    answer:
      'Exterior or detached ADU-type projects are included in the higher funding band, up to $80,000, subject to availability, eligibility, and City approval.',
  },
  {
    question: 'Does the grant cover the full project cost?',
    answer:
      'No. The grant framework is up to 70% of eligible costs and does not replace the balance of project funding or compliance obligations.',
  },
  {
    question: 'Is funding guaranteed?',
    answer:
      'No. Funding is competitive and limited, and final approval depends on available program funds, municipal review, and whether the project meets City requirements.',
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

export default function StCatharinesAduGrant() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>
          St. Catharines ADU Grant Program | Up to 70% Funding for Basement &
          Detached Units
        </title>
        <meta
          name="description"
          content="Learn how the St. Catharines ADU Grant Program works, including funding amounts, interior vs exterior unit caps, limited funding status, and what homeowners should know before applying."
        />
        <link
          rel="canonical"
          href="https://ontarioreno.ca/st-catharines-adu-grant"
        />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      {/* Above the hero on purpose — the hero leads with $40,000/$80,000. */}
      <ProgramClosedNotice {...ST_CATHARINES_ADU_CLOSURE} />

      <section className="bg-slate-900 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:px-8 lg:py-20">
          <div className="max-w-[52rem]">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/15 px-4 py-2 text-sm font-medium text-blue-200 ring-1 ring-white/10">
              <Landmark className="h-4 w-4" />
              St. Catharines ADU grant guide
            </div>

            <h1 className="mt-5 text-4xl font-bold leading-[1.02] tracking-[-0.035em] md:text-6xl">
              St. Catharines ADU Grant Program
            </h1>

            <p className="mt-5 max-w-3xl text-xl leading-8 text-slate-300">
              The St. Catharines ADU grant can cover up to 70% of eligible
              costs, with up to $40,000 for interior units and up to $80,000
              for exterior units. For the broader planning picture, start with
              the{' '}
              <Link
                to="/st-catharines"
                className="font-semibold text-white underline underline-offset-4"
              >
                St. Catharines city hub
              </Link>
              .
            </p>

            <div className="mt-5 max-w-3xl rounded-[1rem] border border-amber-300/20 bg-amber-500/[0.07] p-4.5">
              <div className="flex items-start gap-3">
                <CircleAlert className="mt-1 h-5 w-5 shrink-0 text-amber-200" />
                {/* This was the pre-closure hedge — "a large share has already
                    been committed". The share is now all of it, and a hedge that
                    still implies some money is left is worse than no note. */}
                <p className="text-sm leading-7 text-slate-100">
                  Status note: the grant is closed to new applications. The
                  funding amounts on this page describe how the program worked
                  while it was open, and are kept for reference — they are not
                  currently available to new applicants.
                </p>
              </div>
            </div>

            {/* "Check Eligibility" for a closed grant sent a homeowner to a
                project review believing funding was on the table. The build is
                still financeable, so the page keeps converting without
                advertising money that is gone. */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                to={BASEMENT_FINANCING_OFFER.href}
                className={cn(buttonStyles.primary, 'w-full sm:w-auto')}
              >
                {BASEMENT_FINANCING_OFFER.ctaLabel}
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/match"
                className={cn(buttonStyles.ghostDark, 'w-full sm:w-auto')}
              >
                Start a Project Review
              </Link>
            </div>

            <p className="mt-3 text-sm font-semibold text-slate-400">
              St. Catharines&apos; grant is closed — the build can still be financed
              in full, with no upfront cost.
            </p>

            <p className="mt-4 text-sm text-slate-400">
              Last updated: {lastUpdated}
            </p>
          </div>

          <div className="rounded-[1rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.045)_0%,rgba(255,255,255,0.02)_100%)] p-5 shadow-[0_10px_24px_rgba(2,6,23,0.14)] backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200/90">
              Grant positioning
            </p>
            <h2 className="mt-3 text-[1.6rem] font-bold leading-tight tracking-[-0.03em] text-white">
              Meaningful funding, but still a competitive municipal program.
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              This page is designed to help homeowners quickly understand if
              the St. Catharines basement grant or garden suite grant path is
              realistically worth pursuing before spending time on the wrong
              assumptions.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeading
            title="Quick program snapshot"
            description="A fast summary of the St. Catharines additional dwelling unit grant framework and what homeowners should verify first."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {snapshotItems.map((item) => (
              <div
                key={item.label}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
              >
                <item.icon className="h-5 w-5 text-[#1B3C6C]" />
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {item.label}
                </p>
                <p className="mt-2 text-2xl font-bold tracking-[-0.03em] text-slate-900">
                  {item.value}
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="calculator"
        className="bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] py-16 md:py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
              Planning Tool
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-slate-900 md:text-4xl">
              Interactive St. Catharines Grant Estimator
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              This estimator helps homeowners visualize how the program may
              apply by separating eligible costs from ineligible costs, then
              applying the published funding structure. It is designed for
              planning clarity only and should not be treated as an approval or
              funding commitment.
            </p>
          </div>

          <StCatharinesGrantCalculator />
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <SectionHeading
                title="What this grant can help cover"
                description="At a high level, the grant is intended to offset a portion of eligible ADU construction-related costs within the City's program framework."
              />
              <p className="mt-8 text-lg leading-8 text-slate-600">
                The key concept is eligible cost. Not every expense in a
                renovation budget is automatically covered by grant funding, and
                final treatment of costs is determined by municipal rules and
                review.
              </p>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                For planning purposes, homeowners should treat the program as a
                partial funding support tool that may improve feasibility, not
                as full project funding.
              </p>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                For broader St. Catharines planning context, see the{' '}
                <Link
                  to="/st-catharines"
                  className="font-semibold text-slate-900 underline underline-offset-4"
                >
                  St. Catharines city hub
                </Link>{' '}
                before locking in budget assumptions. Homeowners usually pair
                this with the{' '}
                <Link
                  to="/st-catharines-adu-cost"
                  className="font-semibold text-slate-900 underline underline-offset-4"
                >
                  cost guide
                </Link>{' '}
                to understand what the remaining budget may still look like.
              </p>
            </div>

            <div className="rounded-3xl border border-blue-200 bg-blue-50 p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900">
                St. Catharines ADU grant reality check
              </h2>
              <div className="mt-5 space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <p className="leading-7 text-slate-700">
                    Grant support may materially improve project viability.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <p className="leading-7 text-slate-700">
                    Availability is not unlimited and is tied to program funds.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1B3C6C]" />
                  <p className="leading-7 text-slate-700">
                    Approval remains subject to City requirements and review.
                  </p>
                </div>
              </div>
              <p className="mt-5 text-sm leading-7 text-slate-700">
                If the bigger concern is whether the property can qualify
                legally, review the{' '}
                <Link
                  to="/st-catharines-adu-permits"
                  className="font-semibold text-slate-900 underline underline-offset-4"
                >
                  permit requirements
                </Link>{' '}
                before treating grant math as real.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-10 md:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm md:p-8">
            <h2 className="text-2xl font-bold tracking-[-0.02em] text-slate-900">
              What this does not mean
            </h2>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Not full funding
                </p>
                <p className="mt-2 leading-7 text-slate-700">
                  The grant does not automatically cover the full project cost.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Eligible costs only
                </p>
                <p className="mt-2 leading-7 text-slate-700">
                  Funding applies to eligible items, not every line in the
                  construction budget.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Remaining balance
                </p>
                <p className="mt-2 leading-7 text-slate-700">
                  Homeowners should still expect to fund a remaining project
                  balance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Interior vs. exterior unit funding"
            description="The program distinguishes between interior and exterior ADU configurations."
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Interior ADU funding
              </p>
              <h3 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-slate-900">
                Up to $40,000
              </h3>
              <p className="mt-4 leading-8 text-slate-600">
                Interior units, including St. Catharines basement apartment
                grant scenarios, can be funded up to $40,000 under the stated
                program framework. For many homeowners, that still leaves a
                meaningful remaining budget shown more clearly in the{' '}
                <Link
                  to="/st-catharines-adu-cost"
                  className="font-semibold text-slate-900 underline underline-offset-4"
                >
                  cost guide
                </Link>
                .
              </p>
            </div>
            <div className="rounded-3xl border border-blue-200 bg-blue-50 p-8 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
                Exterior ADU funding
              </p>
              <h3 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-slate-900">
                Up to $80,000
              </h3>
              <p className="mt-4 leading-8 text-slate-700">
                Exterior units, including St. Catharines garden suite grant
                pathways and detached ADU concepts, can be funded up to
                $80,000, subject to program review and available funding. These
                projects also tend to be more permit-sensitive, which is why
                the{' '}
                <Link
                  to="/st-catharines-adu-permits"
                  className="font-semibold text-slate-900 underline underline-offset-4"
                >
                  permit page
                </Link>{' '}
                matters early.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Why this program matters"
            description="When available, this grant can shift project math in a meaningful way for homeowners building legal rental units."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {programBenefits.map((item) => (
              <div
                key={item}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <p className="leading-7 text-slate-700">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-8 shadow-sm md:p-10">
            <SectionHeading
              title="Limited funding and competitive intake"
              description="This is not an unlimited incentive pool. The St. Catharines ADU grant framework is tied to available program funding."
            />
            <div className="mt-6 space-y-4 text-lg leading-8 text-slate-700">
              <p>
                Funding is first-come, first-served, and homeowners who wait
                too long may miss the opportunity if available funds are fully
                allocated.
              </p>
              <p>
                City communications indicate a significant portion of funding
                has already been committed. That is why verifying availability
                early is practical, not hype.
              </p>
              <p>
                The right move is to confirm current status with the City,
                validate project fit, and then plan permits, scope, and budget
                in that order.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Who this program may be best for"
            description="These project profiles usually align best with a St. Catharines ARU incentive strategy."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {bestFitItems.map((item) => (
              <div
                key={item}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#1B3C6C]" />
                  <p className="leading-7 text-slate-700">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-8 shadow-sm md:p-10">
            <SectionHeading
              title="Important requirements and reality check"
              description="Grant funding does not replace permits, zoning, or code compliance obligations."
            />
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {[
                'City approval is required before funding assumptions are final.',
                'Permits, zoning, and building-code compliance still apply in full.',
                'Grant eligibility does not remove project planning and documentation requirements.',
                'Final outcomes depend on municipal review and current program rules.',
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex items-start gap-3">
                    <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <p className="leading-7 text-slate-700">{item}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Process overview"
            description="A practical sequence homeowners can use before committing to assumptions about grant-backed project economics."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {processSteps.map((item) => (
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
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Frequently asked questions"
            description="Clear answers for homeowners comparing the St. Catharines basement grant, detached ADU funding, and next-step requirements."
          />
          <div className="mt-10 space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
              >
                <h3 className="text-xl font-bold text-slate-900">
                  {faq.question}
                </h3>
                <p className="mt-3 leading-7 text-slate-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white pb-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] p-8 shadow-[0_24px_70px_rgba(15,23,42,0.06)] md:p-10">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-slate-900 p-3 text-white">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-3xl font-bold tracking-[-0.03em] text-slate-900">
                  Important disclosure
                </h2>
                <p className="mt-4 text-lg leading-8 text-slate-600">
                  OntarioReno is an independent private platform. We are not
                  the City of St. Catharines and we do not administer City
                  grant programs.
                </p>
                <p className="mt-4 text-lg leading-8 text-slate-600">
                  Program availability, funding levels, and requirements may
                  change. Final approval is subject to City review, eligible
                  costs, and current program rules. Homeowners should confirm
                  current details directly with the City of St. Catharines.
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
              Check property fit before remaining funding is allocated.
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300">
              If you are researching the St. Catharines ADU grant, basement
              apartment incentive, or detached garden suite funding, start by
              validating project fit and compliance path before finalizing
              budget assumptions.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                to="/match"
                className={cn(buttonStyles.primary, 'w-full sm:w-auto')}
              >
                Check Eligibility
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/st-catharines"
                className={cn(buttonStyles.ghostDark, 'w-full sm:w-auto')}
              >
                Back to St. Catharines hub
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm font-medium text-slate-300">
              <Link
                to="/st-catharines-adu-cost"
                className="inline-flex items-center gap-2 underline underline-offset-4"
              >
                Cost guide
              </Link>
              <Link
                to="/st-catharines-adu-permits"
                className="inline-flex items-center gap-2 underline underline-offset-4"
              >
                Permit and legal guide
              </Link>
              <Link
                to="/st-catharines"
                className="inline-flex items-center gap-2 underline underline-offset-4"
              >
                City hub
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
