import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
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

const comparisonCards = [
  {
    title: 'Legal basement apartment',
    range: 'Lower to mid range',
    notes:
      'Usually uses existing structure, but may still require fire separation, egress, plumbing, HVAC, electrical, and permit work.',
    icon: Home,
  },
  {
    title: 'New basement suite conversion',
    range: 'Mid to higher range',
    notes:
      'Costs rise when the basement needs layout changes, separate entrance work, ceiling height improvements, new kitchen, laundry, or major mechanical upgrades.',
    icon: Building2,
  },
  {
    title: 'Detached garden suite',
    range: 'Highest range',
    notes:
      'Usually involves a new detached structure, servicing, site work, design, permits, and construction from the ground up.',
    icon: TreePine,
  },
];

const costDrivers = [
  'Existing basement condition',
  'Ceiling height',
  'Separate entrance',
  'Fire separation',
  'Egress windows',
  'Plumbing and drainage',
  'Electrical upgrades',
  'HVAC and ventilation',
  'Kitchen and laundry',
  'Permit drawings and engineering',
  'Site servicing for garden suites',
  'Soil, grading, access, and utility connection issues',
];

const faqs = [
  {
    question: 'What is the cheapest way to create a secondary suite in Barrie?',
    answer:
      'Usually the lowest-cost path is a basement apartment that can use more of the existing structure with fewer major corrections. Even then, the budget can rise quickly once life safety, plumbing, entrance, and permit requirements are added.',
  },
  {
    question: 'Are garden suites more expensive than basement apartments?',
    answer:
      'Yes, in most cases. Garden suites usually involve a new detached structure, site servicing, foundations, utility connections, and full construction rather than a conversion within existing space.',
  },
  {
    question: 'Can the Barrie funding reduce my project cost?',
    answer:
      'It may, but only if the project qualifies under the County of Simcoe program and Barrie Bonus rules. The support is conditional, the County portion is structured as a forgivable loan, and the unit must be rented under affordable-rental requirements.',
  },
  {
    question: 'Does the $65,000 funding apply to every project?',
    answer:
      'No. It is not automatic, not universal, and not a general renovation grant. Approval, available funding, affordable-rental requirements, and project fit all matter.',
  },
  {
    question: 'Do permit rebates cover construction costs?',
    answer:
      'No. Permit rebates may reduce or refund eligible permit fees, but they do not replace the broader construction budget.',
  },
  {
    question: 'What costs are usually missed by homeowners?',
    answer:
      'The most commonly missed items are entrance work, ceiling-height corrections, drainage and plumbing scope, permit drawings, engineering, fire separation, utility work, and site servicing for detached units.',
  },
  {
    question: 'Should I price the project before checking eligibility?',
    answer:
      'Usually no. A rough budget is useful, but the strongest next step is checking property and program fit first so the homeowner is not pricing a project path that may not be realistic.',
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

export default function BarrieSecondarySuiteCosts() {
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
        <title>Barrie Secondary Suite Costs | Basement Apartments & Garden Suites</title>
        <meta
          name="description"
          content="Understand typical Barrie secondary suite costs, including basement apartments, garden suites, permits, funding, and rebate considerations for eligible ARU projects."
        />
        <link rel="canonical" href="https://ontarioreno.ca/barrie-secondary-suite-costs" />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <section className="bg-slate-900 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-start lg:px-8 lg:py-20">
          <div className="max-w-[54rem]">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/15 px-4 py-2 text-sm font-medium text-blue-200 ring-1 ring-white/10">
              <Landmark className="h-4 w-4" />
              Barrie Cost Guide
            </div>

            <h1 className="mt-5 text-4xl font-bold leading-[1.02] tracking-[-0.035em] md:text-6xl">
              How much does a secondary suite cost in Barrie?
            </h1>

            <p className="mt-5 max-w-3xl text-xl leading-8 text-slate-300">
              Costs can vary heavily depending on whether you are legalizing a basement apartment, building a new basement suite, or planning a detached garden suite. Funding and permit rebates may also change the final economics.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link to="/match" className={cn(buttonStyles.primary, 'w-full sm:w-auto')}>
                Check My Project
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
              Quick cost reality
            </p>
            <div className="mt-4 space-y-4">
              {[
                'Basement apartments usually start from an existing structure, but compliance work can still move the budget quickly.',
                'Garden suites usually have the highest total cost because they involve detached construction and site servicing.',
                'Funding and permit rebates may improve the economics, but they do not make every project inexpensive.',
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
            title="Quick comparison"
            description="Barrie costs usually diverge because the project path itself changes the amount of structural, permit, and servicing work involved."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {comparisonCards.map((card) => (
              <div
                key={card.title}
                className="rounded-[1.35rem] border border-slate-200 bg-white p-6 shadow-[0_12px_28px_rgba(15,23,42,0.05)]"
              >
                <card.icon className="h-6 w-6 text-[#1B3C6C]" />
                <h3 className="mt-4 text-2xl font-bold text-slate-900">{card.title}</h3>
                <p className="mt-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Typical cost range
                </p>
                <p className="mt-1 text-lg font-semibold text-[#1B3C6C]">{card.range}</p>
                <p className="mt-4 leading-7 text-slate-600">{card.notes}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="What drives the cost"
            description="The biggest Barrie price swings usually come from property conditions and from how close the project is to legal-suite or detached-unit requirements."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {costDrivers.map((item) => (
              <div
                key={item}
                className="rounded-[1.3rem] border border-slate-200 bg-white p-6 shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
              >
                <div className="flex items-start gap-3">
                  <Wrench className="mt-0.5 h-5 w-5 shrink-0 text-[#1B3C6C]" />
                  <p className="leading-7 text-slate-700">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[1.5rem] border border-blue-200 bg-blue-50 p-8 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
            <SectionHeading
              title="How funding may affect the economics"
              description="Barrie homeowners may be able to combine County of Simcoe funding and the Barrie Bonus for up to $65,000 in potential support, but only if the project qualifies and is provided as an affordable rental unit under program rules."
            />
            <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-700">
              Start with{' '}
              <Link
                to="/barrie-secondary-suite-funding"
                className="font-semibold text-slate-900 underline underline-offset-4"
              >
                Barrie Secondary Suite Funding
              </Link>{' '}
              if the project depends on the County and City stack. This does not mean every project becomes $65,000 cheaper. The funding is conditional, the County portion is structured as a forgivable loan, and affordable-rent rules affect the long-term income side.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-8 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
            <SectionHeading
              title="Permit fees may also be reduced"
              description="Barrie’s ARU permit rebate may reduce or refund eligible permit fees when project timelines and requirements are met."
            />
            <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-600">
              Compare the permit side with{' '}
              <Link
                to="/barrie-aru-permit-rebate"
                className="font-semibold text-slate-900 underline underline-offset-4"
              >
                Barrie ARU Permit Rebate
              </Link>
              . Permit rebates can improve the math, but they do not replace the broader construction budget.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Basement apartment vs garden suite"
            description="Barrie homeowners usually get better cost clarity once they decide whether existing space should be used first or whether a detached unit makes more sense."
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-8 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
              <h3 className="text-2xl font-bold text-slate-900">Basement apartment</h3>
              <div className="mt-6 space-y-4">
                {[
                  'Lower starting point if the basement is already viable',
                  'More dependent on existing conditions',
                  'May be faster than a detached build',
                  'Better for homeowners who want to use existing space',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    <p className="leading-7 text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
              <Link
                to="/barrie-basement-apartment-permits"
                className="mt-6 inline-flex items-center gap-2 text-base font-semibold text-slate-900 underline underline-offset-4"
              >
                Barrie Basement Apartment Permits
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-8 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
              <h3 className="text-2xl font-bold text-slate-900">Garden suite</h3>
              <div className="mt-6 space-y-4">
                {[
                  'Higher build cost',
                  'More design and site complexity',
                  'More privacy and separation',
                  'Better where the basement is not suitable or where detached rental value makes sense',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    <p className="leading-7 text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
              <Link
                to="/barrie-garden-suites"
                className="mt-6 inline-flex items-center gap-2 text-base font-semibold text-slate-900 underline underline-offset-4"
              >
                Barrie Garden Suites
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-8 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
            <SectionHeading
              title="When costs may not be worth it"
              description="Some Barrie projects may not make financial sense once the property, rental goals, and long-term obligations are viewed together."
            />
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {[
                'The homeowner wants full market rent but is pursuing affordable-rental funding',
                'The property may be sold soon',
                'The basement needs major structural or height corrections',
                'The lot is not well-suited for a detached suite',
                'The owner does not want long-term rental obligations',
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[1.25rem] border border-amber-200/80 bg-white/70 p-5"
                >
                  <div className="flex items-start gap-3">
                    <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                    <p className="leading-7 text-slate-700">{item}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-6 text-lg leading-8 text-slate-700">
              Before assuming the project economics will work, compare{' '}
              <Link
                to="/barrie-aru-eligibility"
                className="font-semibold text-slate-900 underline underline-offset-4"
              >
                Barrie ARU Eligibility
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Frequently asked questions"
            description="These are the cost questions that usually matter most before a Barrie homeowner decides whether to move forward."
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
              Understand your Barrie project before pricing it
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300">
              Before assuming the cost, funding, or rental return, it helps to understand whether the property, project type, and program requirements line up.
            </p>
            <div className="mt-8 flex justify-center">
              <Link to="/match" className={buttonStyles.primary}>
                Start My Barrie Review
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
