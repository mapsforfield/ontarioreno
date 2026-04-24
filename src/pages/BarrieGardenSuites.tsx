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

const lotFitItems = [
  'Lot size and layout',
  'Backyard depth and available build area',
  'Access for construction',
  'Setbacks and zoning rules',
  'Servicing capacity',
  'Water, sewer, hydro, and drainage',
  'Fire access and emergency access considerations',
  'Existing trees, grading, slopes, or easements',
  'Parking and overall site design',
];

const faqs = [
  {
    question: 'What is a garden suite in Barrie?',
    answer:
      'A garden suite is a self-contained residential unit in a detached building on the same lot as the main home. It is meant for legal residential occupancy, not just storage, a shed, or a backyard office.',
  },
  {
    question: 'Is a garden suite the same as a basement apartment?',
    answer:
      'No. A basement apartment is built inside the main home, while a garden suite is detached from the main house and sits elsewhere on the same property.',
  },
  {
    question: 'Are garden suites more expensive than basement apartments?',
    answer:
      'Usually yes. Garden suites often cost more because they involve detached construction, servicing, site work, drawings, permits, and full build scope instead of working inside existing space.',
  },
  {
    question: 'Can garden suites qualify for the Barrie funding program?',
    answer:
      'They may, but only if the project qualifies under the County of Simcoe program rules and is provided as an affordable rental unit under program requirements. Funding is not automatic.',
  },
  {
    question: 'Can a garden suite use the Barrie ARU permit rebate?',
    answer:
      'It may, depending on how the project and permit timing fit the rebate requirements. Homeowners should compare the detached-unit plan against the permit rebate details directly.',
  },
  {
    question: 'What makes a property suitable for a garden suite?',
    answer:
      'The strongest candidates usually have enough lot space, workable servicing, buildable backyard area, practical access, and a site layout that can support zoning and emergency-access requirements.',
  },
  {
    question: 'Should I check funding or lot feasibility first?',
    answer:
      'Usually lot feasibility first. Funding only helps if the property can realistically support the detached unit in the first place.',
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

export default function BarrieGardenSuites() {
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
        <title>Barrie Garden Suites | Backyard ARU Guide</title>
        <meta
          name="description"
          content="Learn how garden suites work in Barrie, including lot fit, servicing, costs, permits, funding, and rebate considerations for detached backyard ARUs."
        />
        <link rel="canonical" href="https://ontarioreno.ca/barrie-garden-suites" />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <section className="bg-slate-900 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-start lg:px-8 lg:py-20">
          <div className="max-w-[54rem]">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/15 px-4 py-2 text-sm font-medium text-blue-200 ring-1 ring-white/10">
              <Landmark className="h-4 w-4" />
              Barrie Garden Suites
            </div>

            <h1 className="mt-5 text-4xl font-bold leading-[1.02] tracking-[-0.035em] md:text-6xl">
              Can you build a garden suite in Barrie?
            </h1>

            <p className="mt-5 max-w-3xl text-xl leading-8 text-slate-300">
              A garden suite is a detached secondary unit built on the same property as the main home. In Barrie, the right lot may support a backyard ARU, but feasibility depends on zoning, servicing, access, design, permits, and cost.
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
                'A garden suite is a legal residential unit, not just a backyard outbuilding.',
                'Detached units usually cost more than basement apartments.',
                'Lot fit and servicing usually matter before funding does.',
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
            title="What is a garden suite?"
            description="A garden suite is a self-contained residential unit located in a detached building on the same lot as the main house. It usually includes its own living space, kitchen, bathroom, sleeping area, and servicing."
          />
          <div className="mt-8 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-8 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
            <div className="space-y-4 text-lg leading-8 text-slate-600">
              <p>It is not just a shed.</p>
              <p>It is not just a backyard office.</p>
              <p>It needs to be legal, permitted, and suitable for residential occupancy.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Garden suite vs basement apartment"
            description="Barrie homeowners often compare a detached backyard unit against a legal basement apartment before deciding where the property has the better fit."
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-8 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
              <h3 className="text-2xl font-bold text-slate-900">Garden suite</h3>
              <div className="mt-6 space-y-4">
                {[
                  'Detached from the main home',
                  'More privacy',
                  'Usually higher cost',
                  'More site and servicing complexity',
                  'Can work when the basement is not suitable',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    <p className="leading-7 text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-8 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
              <h3 className="text-2xl font-bold text-slate-900">Basement apartment</h3>
              <div className="mt-6 space-y-4">
                {[
                  'Built inside the existing house',
                  'Often lower cost if the basement is viable',
                  'Depends heavily on ceiling height, fire separation, entrance, and layout',
                  'May be faster when the existing structure works',
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
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="What decides if a Barrie lot is suitable?"
            description="The best Barrie garden suite sites usually work because the lot, servicing, and access conditions all cooperate. Detached-unit feasibility is rarely decided by one factor alone."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {lotFitItems.map((item) => (
              <div
                key={item}
                className="rounded-[1.3rem] border border-slate-200 bg-white p-6 shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
              >
                <div className="flex items-start gap-3">
                  <Scale className="mt-0.5 h-5 w-5 shrink-0 text-[#1B3C6C]" />
                  <p className="leading-7 text-slate-700">{item}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-600">
            If you are unsure whether the lot is realistic for a detached unit, compare the property questions in{' '}
            <Link
              to="/barrie-aru-eligibility"
              className="font-semibold text-slate-900 underline underline-offset-4"
            >
              Barrie ARU Eligibility
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Cost considerations"
            description="Garden suites usually cost more than basement apartments because they involve a new detached structure, site work, servicing, drawings, permits, and full construction."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              'Design and drawings',
              'Foundation or slab',
              'Utility connections',
              'Plumbing and electrical',
              'Heating and cooling',
              'Kitchen and bathroom',
              'Exterior finishes',
              'Site restoration',
            ].map((item) => (
              <div
                key={item}
                className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
              >
                <div className="flex items-start gap-3">
                  <Wrench className="mt-0.5 h-5 w-5 shrink-0 text-[#1B3C6C]" />
                  <p className="leading-7 text-slate-700">{item}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-600">
            For the broader budget picture, compare{' '}
            <Link
              to="/barrie-secondary-suite-costs"
              className="font-semibold text-slate-900 underline underline-offset-4"
            >
              Barrie Secondary Suite Costs
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[1.5rem] border border-blue-200 bg-blue-50 p-8 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
            <SectionHeading
              title="Funding considerations"
              description="Barrie garden suites may connect to the County of Simcoe Secondary Suites Program and the City of Barrie Bonus, but only if the project qualifies and the unit is provided as an affordable rental unit under program rules."
            />
            <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-700">
              This does not mean every garden suite qualifies, and it does not mean the funding is automatic. The County portion is structured as a 15-year forgivable loan, and the affordable-rent rules affect the rental-income side. Start with{' '}
              <Link
                to="/barrie-secondary-suite-funding"
                className="font-semibold text-slate-900 underline underline-offset-4"
              >
                Barrie Secondary Suite Funding
              </Link>
              {' '}if the project depends on the County and Barrie stack.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-8 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
            <SectionHeading
              title="Permit rebate considerations"
              description="Barrie also has an ARU permit rebate structure that may reduce permit costs if requirements and timelines are met. This is separate from the County funding stack."
            />
            <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-600">
              Compare the detached-unit permit side with{' '}
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

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-8 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
            <SectionHeading
              title="When a garden suite may not be the right move"
              description="Some Barrie homeowners are better served by a different path once the lot, cost, and long-term obligations are viewed honestly."
            />
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {[
                'The lot is too tight or awkward',
                'Servicing is too expensive',
                'The homeowner wants the lowest-cost path',
                'The homeowner wants market rent but is relying on affordable-rental funding',
                'The homeowner may sell soon',
                'A basement apartment would achieve the goal at lower cost',
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
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Frequently asked questions"
            description="These are the garden suite questions that usually matter most before a Barrie homeowner moves too far into design or pricing."
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
              See if your Barrie property can support a garden suite
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300">
              Before committing to drawings, pricing, or construction, check whether your lot, servicing, budget, and funding goals line up.
            </p>
            <div className="mt-8 flex justify-center">
              <Link to="/match" className={buttonStyles.primary}>
                Start My Garden Suite Review
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
