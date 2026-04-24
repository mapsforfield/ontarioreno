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
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import BarrieSecondarySuiteResources from '../components/BarrieSecondarySuiteResources';
import { buttonStyles } from '../lib/uiStyles';
import { cn } from '../lib/utils';

const reviewItems = [
  'Zoning and ARU permissions',
  'Ceiling height',
  'Fire separation',
  'Smoke and carbon monoxide alarms',
  'Egress windows or exits',
  'Separate entrance or safe access',
  'Plumbing and drainage',
  'Electrical work',
  'Heating, ventilation, and HVAC',
  'Sound separation where applicable',
  'Parking and site considerations',
  'Final inspections',
];

const faqs = [
  {
    question: 'Do basement apartments in Barrie need permits?',
    answer:
      'Usually yes. A basement apartment built or legalized for rental use commonly needs permit and inspection planning because life safety, occupancy, plumbing, electrical, and code issues may all be reviewed.',
  },
  {
    question: 'Is a finished basement the same as a legal basement apartment?',
    answer:
      'No. A finished basement may work well for family use, but that does not automatically make it a legal rental apartment.',
  },
  {
    question: 'What makes a basement apartment legal?',
    answer:
      'A legal basement apartment needs the right permit path, code-compliant life safety measures, and approval for residential rental use. The exact requirements vary by property and project scope.',
  },
  {
    question: 'Can a basement apartment qualify for the Barrie funding program?',
    answer:
      'It may, but only if the project qualifies under the County of Simcoe and Barrie program rules. Funding is not automatic, and affordable-rent rules apply if the owner uses that funding path.',
  },
  {
    question: 'Can permit fees be rebated in Barrie?',
    answer:
      'They may be reduced or refunded under the Barrie ARU permit rebate structure when project timing and requirements are met. Homeowners should not assume every permit fee is automatically rebated.',
  },
  {
    question: 'What usually increases the cost of legalizing a basement apartment?',
    answer:
      'The most common cost drivers are ceiling-height issues, egress work, entrance changes, fire separation, plumbing and mechanical upgrades, permit drawings, and inspections.',
  },
  {
    question: 'Should I check permits before getting a renovation quote?',
    answer:
      'Usually yes. A quote is more useful once the homeowner has a clearer sense of whether the basement can support a legal suite and what permit-related upgrades may be involved.',
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

export default function BarrieBasementApartmentPermits() {
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
        <title>Barrie Basement Apartment Permits | Legal Suite Guide</title>
        <meta
          name="description"
          content="Understand Barrie basement apartment permit requirements, including legal suite planning, inspections, life safety, costs, funding, and ARU rebate considerations."
        />
        <link rel="canonical" href="https://ontarioreno.ca/barrie-basement-apartment-permits" />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <section className="bg-slate-900 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-start lg:px-8 lg:py-20">
          <div className="max-w-[54rem]">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/15 px-4 py-2 text-sm font-medium text-blue-200 ring-1 ring-white/10">
              <Landmark className="h-4 w-4" />
              Barrie Permit Guide
            </div>

            <h1 className="mt-5 text-4xl font-bold leading-[1.02] tracking-[-0.035em] md:text-6xl">
              Barrie basement apartment permits: what homeowners need to know
            </h1>

            <p className="mt-5 max-w-3xl text-xl leading-8 text-slate-300">
              A basement apartment in Barrie usually needs more than a standard renovation plan. Legal rental use can involve zoning, building permits, fire separation, egress, ceiling height, plumbing, electrical, HVAC, and inspections.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link to="/match" className={cn(buttonStyles.primary, 'w-full sm:w-auto')}>
                Check My Basement
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
                'A finished basement is not automatically a legal apartment.',
                'Rental use usually raises the compliance standard.',
                'Permit and inspection planning can materially affect cost and timeline.',
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
            title="Why permits matter"
            description="A legal basement apartment must be safe, code-compliant, and approved for residential rental use. Without the right permit path, a homeowner may finish the space but still not have a legal rental unit."
          />
          <div className="mt-8 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-8 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
            <div className="space-y-4 text-lg leading-8 text-slate-600">
              <p>A nice finished basement is not automatically a legal apartment.</p>
              <p>Rental use raises the compliance standard.</p>
              <p>Permits and inspections help protect the homeowner, tenant, and long-term property value.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="What Barrie may review"
            description="Permit and code planning can differ from one property to another, but these are the issues that commonly affect a Barrie basement apartment path."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {reviewItems.map((item) => (
              <div
                key={item}
                className="rounded-[1.3rem] border border-slate-200 bg-white p-6 shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
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
          <SectionHeading
            title="Finished basement vs legal basement apartment"
            description="Barrie homeowners often discover that a family-use basement and a legal rental suite are not the same project, even when the space looks similar on paper."
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-8 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
              <h3 className="text-2xl font-bold text-slate-900">Finished basement</h3>
              <div className="mt-6 space-y-4">
                {[
                  'Built for family use',
                  'May include recreation space, bedroom, bathroom, or office',
                  'Does not automatically create a legal rental unit',
                  'Usually simpler than a legal suite',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    <p className="leading-7 text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-8 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
              <h3 className="text-2xl font-bold text-slate-900">Legal basement apartment</h3>
              <div className="mt-6 space-y-4">
                {[
                  'Built or legalized for rental use',
                  'Requires permit and inspection planning',
                  'Must satisfy life safety and occupancy requirements',
                  'May qualify for funding only if program rules are met',
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
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-8 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
            <SectionHeading
              title="How permits affect cost"
              description="Permit requirements can change the cost because the project may need life safety upgrades, egress work, mechanical adjustments, drawings, inspections, and possible layout changes."
            />
            <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-600">
              Compare the budget side with{' '}
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
          <div className="rounded-[1.5rem] border border-blue-200 bg-blue-50 p-8 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
            <SectionHeading
              title="How this connects to funding"
              description="Barrie homeowners may be able to access up to $65,000 through the County of Simcoe Secondary Suites Program and Barrie Bonus, but the unit must qualify and be provided as an affordable rental unit under program rules."
            />
            <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-700">
              Funding is not automatic. The County portion is a 15-year forgivable loan, affordable-rent rules apply, and early sale or broken conditions may trigger repayment of the unforgiven balance. Start with{' '}
              <Link
                to="/barrie-secondary-suite-funding"
                className="font-semibold text-slate-900 underline underline-offset-4"
              >
                Barrie Secondary Suite Funding
              </Link>
              {' '}if the project depends on that path.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-8 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
            <SectionHeading
              title="How this connects to the permit rebate"
              description="Barrie also has an ARU permit rebate opportunity that may reduce or refund eligible permit fees when requirements and timelines are met. This is separate from the County funding stack."
            />
            <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-600">
              Compare the permit-fee side with{' '}
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
              title="When a basement apartment may not be the right path"
              description="Some Barrie homeowners are better served by a different direction once the basement condition, cost, and long-term goals are viewed together."
            />
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {[
                'Ceiling height is too low or expensive to correct',
                'Safe access or egress is difficult',
                'Mechanical or plumbing upgrades are too costly',
                'The homeowner wants a simple family-use renovation',
                'The homeowner wants market rent but is relying on affordable-rental funding',
                'A detached garden suite may be a better fit for the property',
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
              Compare{' '}
              <Link
                to="/barrie-garden-suites"
                className="font-semibold text-slate-900 underline underline-offset-4"
              >
                Barrie Garden Suites
              </Link>
              {' '}and{' '}
              <Link
                to="/barrie-aru-eligibility"
                className="font-semibold text-slate-900 underline underline-offset-4"
              >
                Barrie ARU Eligibility
              </Link>
              {' '}if you are unsure whether a basement suite is the right use of the property.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Frequently asked questions"
            description="These are the permit and legal-suite questions that usually matter most before a Barrie homeowner moves too far into design or quoting."
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
              Check if your Barrie basement can become a legal suite
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300">
              Before moving forward with drawings, pricing, or construction, confirm whether the basement layout, permit path, funding goals, and rental plan actually line up.
            </p>
            <div className="mt-8 flex justify-center">
              <Link to="/match" className={buttonStyles.primary}>
                Start My Basement Suite Review
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
