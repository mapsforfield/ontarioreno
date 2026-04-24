import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  FileCheck2,
  Home,
  Landmark,
  Scale,
  TreePine,
  Wrench,
} from 'lucide-react';
import BarrieSecondarySuiteResources from '../components/BarrieSecondarySuiteResources';
import { buttonStyles } from '../lib/uiStyles';
import { cn } from '../lib/utils';

const basementFactors = [
  'Ceiling height',
  'Safe access or entrance',
  'Egress windows or exits',
  'Fire separation',
  'Plumbing and drainage',
  'Electrical capacity',
  'Heating and ventilation',
  'Layout for kitchen, bathroom, sleeping, and living areas',
  'Inspection readiness',
];

const gardenFactors = [
  'Lot size and backyard space',
  'Setbacks',
  'Site access for construction',
  'Utility servicing',
  'Drainage and grading',
  'Trees, easements, or obstructions',
  'Emergency access',
  'Parking and site layout',
];

const selfCheckItems = [
  'Is the project for rental use or family use?',
  'Are you considering a basement suite or garden suite?',
  'Are you comfortable with affordable-rental rules if pursuing funding?',
  'Do you plan to keep the property long enough for forgivable-loan rules to make sense?',
  'Is your timeline realistic for permit rebate requirements?',
  'Have you considered permit, construction, and inspection costs?',
  'Are you willing to adjust the scope if eligibility issues appear?',
];

const faqs = [
  {
    question: 'What affects ARU eligibility in Barrie?',
    answer:
      'Eligibility usually depends on both property fit and program fit. Lot layout, basement conditions, servicing, permits, rental plans, affordable-rent rules, timeline, and total project economics can all matter.',
  },
  {
    question: 'Can every Barrie basement become a legal apartment?',
    answer:
      'No. Some basements may be too constrained by ceiling height, access, egress, layout, or mechanical limitations to make a legal suite practical.',
  },
  {
    question: 'Can every Barrie property support a garden suite?',
    answer:
      'No. Detached units depend heavily on lot layout, setbacks, servicing, buildable backyard area, and other site conditions.',
  },
  {
    question: 'Does eligibility for the $65,000 funding happen automatically?',
    answer:
      'No. Funding is not automatic, not universal, and not a general renovation grant. Approval depends on program rules, available funding, affordable-rent requirements, and project fit.',
  },
  {
    question: 'Do I have to rent below market to use the funding program?',
    answer:
      'If the homeowner uses the County and Barrie funding path, the unit must be provided as an affordable rental unit under program rules. The rent is program-defined, not freely set at full market levels.',
  },
  {
    question: 'Can I still sell the property after receiving funding?',
    answer:
      'Yes, but early sale or broken conditions may trigger repayment of the unforgiven balance because the County portion is structured as a 15-year forgivable loan.',
  },
  {
    question: 'Should I check eligibility before getting quotes?',
    answer:
      'Usually yes. A quote is more useful once the homeowner knows whether the property, permit path, rental plan, and funding goals actually line up.',
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

export default function BarrieAruEligibility() {
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
        <title>Barrie ARU Eligibility | Basement Suite & Garden Suite Guide</title>
        <meta
          name="description"
          content="Check the main factors that affect Barrie ARU eligibility, including property fit, basement suite feasibility, garden suite feasibility, permits, funding, rent rules, and timelines."
        />
        <link rel="canonical" href="https://ontarioreno.ca/barrie-aru-eligibility" />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <section className="bg-slate-900 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-start lg:px-8 lg:py-20">
          <div className="max-w-[54rem]">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/15 px-4 py-2 text-sm font-medium text-blue-200 ring-1 ring-white/10">
              <Landmark className="h-4 w-4" />
              Barrie Eligibility Guide
            </div>

            <h1 className="mt-5 text-4xl font-bold leading-[1.02] tracking-[-0.035em] md:text-6xl">
              Is your Barrie property eligible for an ARU?
            </h1>

            <p className="mt-5 max-w-3xl text-xl leading-8 text-slate-300">
              Eligibility depends on more than wanting a basement apartment or garden suite. Property layout, zoning, servicing, permit requirements, cost, funding rules, rental plans, and timelines can all affect whether the project makes sense.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link to="/match" className={cn(buttonStyles.primary, 'w-full sm:w-auto')}>
                Check My Property
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/barrie-secondary-suite-funding"
                className={cn(buttonStyles.ghostDark, 'w-full sm:w-auto')}
              >
                See Funding Options
              </Link>
            </div>
          </div>

          <div className="rounded-[1rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.045)_0%,rgba(255,255,255,0.02)_100%)] p-5 shadow-[0_10px_24px_rgba(2,6,23,0.14)] backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200/90">
              Quick reality check
            </p>
            <div className="mt-4 space-y-4">
              {[
                'A project can be technically possible but still not be a good fit.',
                'Funding and permit incentives do not make every property eligible.',
                'The strongest next step is checking fit before committing to scope and pricing.',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-[0.95rem] border border-white/8 bg-white/[0.03] p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                  <p className="text-sm leading-7 text-slate-300">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Eligibility has two sides"
            description="Barrie homeowners usually need to understand both property fit and program fit before the project starts to feel real."
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-8 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
              <h3 className="text-2xl font-bold text-slate-900">Property eligibility</h3>
              <div className="mt-6 space-y-4">
                {[
                  'Does the property layout support the unit?',
                  'Can the space meet permit and safety requirements?',
                  'Is servicing realistic?',
                  'Can the project be built and inspected properly?',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    <p className="leading-7 text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-8 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
              <h3 className="text-2xl font-bold text-slate-900">Program eligibility</h3>
              <div className="mt-6 space-y-4">
                {[
                  'Does the homeowner want to rent the unit?',
                  'Are they comfortable with affordable-rental rules if pursuing funding?',
                  'Can the project meet approval requirements?',
                  'Can the timeline support rebate or funding conditions?',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
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
            title="Basement suite eligibility factors"
            description="A basement may be a good candidate if the existing space can reasonably meet legal rental requirements."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {basementFactors.map((item) => (
              <div
                key={item}
                className="rounded-[1.3rem] border border-slate-200 bg-white p-6 shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
              >
                <div className="flex items-start gap-3">
                  <Home className="mt-0.5 h-5 w-5 shrink-0 text-[#1B3C6C]" />
                  <p className="leading-7 text-slate-700">{item}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-600">
            If your project is leaning toward an interior suite, compare the permit path in{' '}
            <Link
              to="/barrie-basement-apartment-permits"
              className="font-semibold text-slate-900 underline underline-offset-4"
            >
              Barrie Basement Apartment Permits
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Garden suite eligibility factors"
            description="A garden suite depends more heavily on the lot and site conditions because it is a detached residential unit."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {gardenFactors.map((item) => (
              <div
                key={item}
                className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
              >
                <div className="flex items-start gap-3">
                  <TreePine className="mt-0.5 h-5 w-5 shrink-0 text-[#1B3C6C]" />
                  <p className="leading-7 text-slate-700">{item}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-600">
            If the project is leaning detached, compare the broader backyard-unit path in{' '}
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
          <div className="rounded-[1.5rem] border border-blue-200 bg-blue-50 p-8 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
            <SectionHeading
              title="Funding eligibility"
              description="Barrie homeowners may be able to access up to $65,000 through the County of Simcoe Secondary Suites Program and Barrie Bonus, but this is not automatic and is not a general renovation grant."
            />
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {[
                'County portion can provide up to $50,000',
                'Barrie Bonus can add $15,000 after County approval',
                'County portion is structured as a 15-year forgivable loan',
                'Unit must be provided as an affordable rental unit under program rules',
                'Rent is program-defined, not freely set at full market levels',
                'Early sale or broken conditions may trigger repayment of the unforgiven balance',
                'Funding is limited and subject to approval',
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[1.25rem] border border-blue-200/80 bg-white/70 p-5"
                >
                  <div className="flex items-start gap-3">
                    <Landmark className="mt-0.5 h-5 w-5 shrink-0 text-[#1B3C6C]" />
                    <p className="leading-7 text-slate-700">{item}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-6 text-lg leading-8 text-slate-700">
              Review the full funding structure in{' '}
              <Link
                to="/barrie-secondary-suite-funding"
                className="font-semibold text-slate-900 underline underline-offset-4"
              >
                Barrie Secondary Suite Funding
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-8 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
            <SectionHeading
              title="Permit rebate eligibility"
              description="Barrie’s ARU permit rebate is separate from the $65K funding stack. It may reduce eligible permit fees by 50% upfront and may rebate the remaining 50% if the project reaches the required completion milestone within 12 months."
            />
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                'Not construction funding',
                'Timeline matters',
                'Eligibility depends on project type and City program rules',
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex items-start gap-3">
                    <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1B3C6C]" />
                    <p className="leading-7 text-slate-700">{item}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              Compare the rebate rules in{' '}
              <Link
                to="/barrie-aru-permit-rebate"
                className="font-semibold text-slate-900 underline underline-offset-4"
              >
                Barrie ARU Permit Rebate
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-8 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
            <SectionHeading
              title="Cost feasibility"
              description="A project can be technically possible but still not financially practical. Costs can rise because of ceiling height corrections, separate entrance work, utility upgrades, site servicing, drawings, engineering, inspections, and construction complexity."
            />
            <p className="mt-6 text-lg leading-8 text-slate-600">
              Compare the broader economics in{' '}
              <Link
                to="/barrie-secondary-suite-costs"
                className="font-semibold text-slate-900 underline underline-offset-4"
              >
                Barrie Secondary Suite Costs
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Quick self-check"
            description="This is the simplest way to tell whether a Barrie basement suite or garden suite path is worth pushing further."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {selfCheckItems.map((item) => (
              <div
                key={item}
                className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
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

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Frequently asked questions"
            description="These are the eligibility questions that usually matter most before a Barrie homeowner moves too far into drawings or pricing."
          />
          <div className="mt-10 space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-6 shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
              >
                <h3 className="text-xl font-bold text-slate-900">{faq.question}</h3>
                <p className="mt-3 leading-7 text-slate-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <BarrieSecondarySuiteResources />

      <section className="bg-slate-900 py-20 text-white">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold tracking-[-0.03em] md:text-5xl">
              Check your Barrie ARU fit before moving forward
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300">
              Before spending time on drawings, pricing, or applications, confirm whether the property, project type, rental plan, and funding rules line up.
            </p>
            <div className="mt-8 flex justify-center">
              <Link to="/match" className={buttonStyles.primary}>
                Start My Eligibility Review
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
