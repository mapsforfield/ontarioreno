import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  FileCheck2,
  Landmark,
} from 'lucide-react';
import BarrieSecondarySuiteResources from '../components/BarrieSecondarySuiteResources';
import { buttonStyles } from '../lib/uiStyles';
import { cn } from '../lib/utils';

const lastUpdated = 'April 2026';

const fundingBreakdown = [
  {
    label: 'County of Simcoe',
    value: 'Up to $50,000',
    detail: 'Secondary Suites Program funding for eligible secondary or garden suites.',
    icon: Landmark,
  },
  {
    label: 'City of Barrie Bonus',
    value: '$15,000',
    detail: 'One-time top-up available after County approval.',
    icon: FileCheck2,
  },
  {
    label: 'Total potential support',
    value: 'Up to $65,000',
    detail: 'Subject to approval, affordable rental requirements, and available funding.',
    icon: CheckCircle2,
  },
];

const countyItems = [
  'Up to $50,000 per unit',
  'Applies to eligible secondary suites and garden suites',
  'Structured as a 15-year forgivable loan',
  'Funding is forgiven over time if the homeowner follows the program rules',
  'Funding is limited and first-come, first-served',
  'Projects that are ready to begin construction may be prioritized',
];

const barrieBonusItems = [
  'The Barrie Bonus is a one-time $15,000 top-up',
  'The homeowner must first be approved for the County of Simcoe Secondary Suites Program',
  'The County then provides the Barrie Bonus application process',
  'It is not applied for separately before County approval',
];

const goodFitItems = [
  'Homeowners planning a legal basement apartment',
  'Homeowners considering a garden suite',
  'Homeowners comfortable with affordable rental rules',
  'Homeowners looking for long-term rental income',
  'Homeowners who want help understanding if the program is worth it',
];

const notIdealItems = [
  'Homeowners who want full market rent',
  'Homeowners who may sell soon',
  'Homeowners who do not want long-term rental obligations',
  'Homeowners who only want a personal-use basement renovation',
];

const faqs = [
  {
    question: 'How much funding can Barrie homeowners get for a secondary suite?',
    answer:
      'Barrie homeowners may qualify for up to $65,000 in combined support, with up to $50,000 through the County of Simcoe Secondary Suites Program and a possible $15,000 Barrie Bonus for projects approved through the County program.',
  },
  {
    question: 'Is the $65,000 a grant?',
    answer:
      'Not exactly. The County of Simcoe portion is described as a 15-year forgivable loan, not unrestricted free money. The funding is tied to program compliance, affordable rental rules, and continued eligibility over time.',
  },
  {
    question: 'Do I have to rent the unit below market rent?',
    answer:
      'The program requires the unit to be provided as an affordable rental unit under program rules. That means the rent is not freely set at full market levels, and affordable rent is defined by the program rather than by the homeowner alone.',
  },
  {
    question: 'Can I sell my house before the 15 years are over?',
    answer:
      'Yes, but the forgiveness structure is tied to continued compliance over the full term. If the property is sold early or the program conditions are broken before the forgiveness period ends, the remaining unforgiven balance may need to be repaid.',
  },
  {
    question: 'Can I apply for the Barrie Bonus first?',
    answer:
      'No. The Barrie Bonus only becomes available after the homeowner is approved through the County of Simcoe Secondary Suites Program. The County then provides the Barrie Bonus application process.',
  },
  {
    question: 'Does this apply to garden suites?',
    answer:
      'Yes. The County program materials indicate the funding can apply to both secondary suites and garden suites when the project meets program and approval requirements.',
  },
  {
    question: 'Is funding guaranteed?',
    answer:
      'No. Funding is limited, first-come, first-served, and subject to program approval and available funding. Project readiness and compliance with affordable rental rules also matter.',
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

export default function BarrieSecondarySuiteFunding() {
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
        <title>Barrie Secondary Suite Funding | Up to $65K for Eligible ARUs</title>
        <meta
          name="description"
          content="Barrie homeowners may qualify for up to $65,000 in combined funding to create a legal secondary suite or garden suite, subject to affordable rental and program requirements."
        />
        <link
          rel="canonical"
          href="https://ontarioreno.ca/barrie-secondary-suite-funding"
        />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <section className="bg-slate-900 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-start lg:px-8 lg:py-20">
          <div className="max-w-[54rem]">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/15 px-4 py-2 text-sm font-medium text-blue-200 ring-1 ring-white/10">
              <Landmark className="h-4 w-4" />
              Barrie ARU Funding
            </div>

            <h1 className="mt-5 text-4xl font-bold leading-[1.02] tracking-[-0.035em] md:text-6xl">
              Barrie homeowners may qualify for up to $65,000 for eligible secondary suites
            </h1>

            <p className="mt-5 max-w-3xl text-xl leading-8 text-slate-300">
              Simcoe County offers up to $50,000 for eligible secondary or garden suites, and Barrie may add a $15,000 top-up for approved projects.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/match"
                className={cn(buttonStyles.primary, 'w-full sm:w-auto')}
              >
                Check My Eligibility
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="#how-funding-works"
                className={cn(buttonStyles.ghostDark, 'w-full sm:w-auto')}
              >
                See How the Funding Works
              </a>
            </div>

            <p className="mt-4 text-sm text-slate-400">Last updated: {lastUpdated}</p>
          </div>

          <div className="rounded-[1rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.045)_0%,rgba(255,255,255,0.02)_100%)] p-5 shadow-[0_10px_24px_rgba(2,6,23,0.14)] backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200/90">
              Quick funding breakdown
            </p>
            <div className="mt-4 space-y-4">
              {fundingBreakdown.map((item) => (
                <div key={item.label} className="rounded-[0.95rem] border border-white/8 bg-white/[0.03] p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-white/8 p-2 text-blue-200">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        {item.label}
                      </p>
                      <p className="mt-1 text-2xl font-bold text-white">{item.value}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{item.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Subject to approval, affordable rental requirements, and available funding.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-8 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
            <SectionHeading
              title="This is not a general renovation grant"
              description="This funding is for homeowners creating a legal rental unit that will be rented under affordable housing rules. It is not for homeowners who want full market rent flexibility."
            />
            <p className="mt-6 text-lg leading-8 text-slate-700">
              Whether the project is a basement apartment or a detached garden suite, the funding rules need to be considered before design, permits, or pricing are finalized. Start with{' '}
              <Link
                to="/barrie-basement-apartment-permits"
                className="font-semibold text-slate-900 underline underline-offset-4"
              >
                Barrie Basement Apartment Permits
              </Link>
              {' '}for interior suites or{' '}
              <Link
                to="/barrie-garden-suites"
                className="font-semibold text-slate-900 underline underline-offset-4"
              >
                Barrie Garden Suites
              </Link>
              {' '}for detached-unit planning before assuming the funding stack fits the project the same way.
            </p>
          </div>
        </div>
      </section>

      <section id="how-funding-works" className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="How the $50,000 County funding works"
            description="The County of Simcoe Secondary Suites Program is the main funding layer in the Barrie stack."
          />
          <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-600">
            The headline amount only matters if the project still works on the property and in the budget. That is why most homeowners compare{' '}
            <Link
              to="/barrie-secondary-suite-costs"
              className="font-semibold text-slate-900 underline underline-offset-4"
            >
              Barrie Secondary Suite Costs
            </Link>
            {' '}with{' '}
            <Link
              to="/barrie-aru-eligibility"
              className="font-semibold text-slate-900 underline underline-offset-4"
            >
              Barrie ARU Eligibility
            </Link>
            {' '}before they rely on the County funding as a real project plan.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {countyItems.map((item) => (
              <div
                key={item}
                className="rounded-[1.3rem] border border-slate-200 bg-white p-6 shadow-[0_12px_28px_rgba(15,23,42,0.05)]"
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
          <SectionHeading
            title="How the $15,000 Barrie Bonus works"
            description="Barrie adds a second layer of support, but only after the County approval step."
          />
          <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-600">
            Homeowners who are also looking at permit-related savings should compare this with{' '}
            <Link
              to="/barrie-aru-permit-rebate"
              className="font-semibold text-slate-900 underline underline-offset-4"
            >
              Barrie ARU Permit Rebate
            </Link>
            .
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {barrieBonusItems.map((item) => (
              <div
                key={item}
                className="rounded-[1.3rem] border border-slate-200 bg-slate-50 p-6 shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
              >
                <div className="flex items-start gap-3">
                  <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1B3C6C]" />
                  <p className="leading-7 text-slate-700">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-8 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
              <SectionHeading
                title="The affordable rental requirement"
                description="The unit must be rented at a program-approved affordable rent. This means the homeowner does not freely set the rent at full market price. Tenant and rent rules are controlled by the program."
              />
              <p className="mt-6 text-lg leading-8 text-slate-600">
                If you are unsure whether your property and rental plan line up with program conditions, start with{' '}
                <Link
                  to="/barrie-aru-eligibility"
                  className="font-semibold text-slate-900 underline underline-offset-4"
                >
                  Barrie ARU Eligibility
                </Link>
                .
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-8 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
              <h2 className="text-3xl font-bold tracking-[-0.03em] text-slate-900">
                What happens if you sell early?
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                The homeowner is not physically locked into the property for 15 years, but the loan forgiveness is tied to continued compliance. If the property is sold or program rules are broken before the forgiveness period is complete, the remaining unforgiven balance may need to be repaid.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Typical Barrie ARU Path"
            description="Most homeowners understand the funding stack fastest when they move through the core Barrie questions in a practical order."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {[
              {
                step: '01',
                title: 'Check property and program eligibility',
                href: '/barrie-aru-eligibility',
              },
              {
                step: '02',
                title: 'Understand expected project costs',
                href: '/barrie-secondary-suite-costs',
              },
              {
                step: '03',
                title: 'Review funding and rebate options',
                href: '/barrie-secondary-suite-funding',
                secondaryHref: '/barrie-aru-permit-rebate',
              },
              {
                step: '04',
                title: 'Confirm permit requirements',
                href: '/barrie-basement-apartment-permits',
              },
              {
                step: '05',
                title: 'Decide between basement suite or garden suite',
                href: '/barrie-garden-suites',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-[1.3rem] border border-slate-200 bg-slate-50 p-6 shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
                  Step {item.step}
                </p>
                <h3 className="mt-3 text-xl font-bold text-slate-900">{item.title}</h3>
                <div className="mt-4 space-y-2">
                  <Link
                    to={item.href}
                    className="block font-semibold text-slate-900 underline underline-offset-4"
                  >
                    {item.step === '01'
                      ? 'Review eligibility'
                      : item.step === '02'
                        ? 'Compare costs'
                        : item.step === '03'
                          ? 'Review funding options'
                          : item.step === '04'
                            ? 'Review the permit process'
                            : 'Compare garden suite options'}
                  </Link>
                  {item.secondaryHref && (
                    <Link
                      to={item.secondaryHref}
                      className="block font-semibold text-slate-900 underline underline-offset-4"
                    >
                      Review permit rebate
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Who this may be good for"
            description="The funding stack is powerful for the right homeowner, but it is not a fit for every project."
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-8 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
              <h3 className="text-2xl font-bold text-slate-900">Good fit</h3>
              <div className="mt-6 space-y-4">
                {goodFitItems.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                    <p className="leading-7 text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-8 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
              <h3 className="text-2xl font-bold text-slate-900">Not ideal</h3>
              <div className="mt-6 space-y-4">
                {notIdealItems.map((item) => (
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

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Frequently asked questions"
            description="These are the questions that usually matter most before a Barrie homeowner decides whether the funding stack is worth pursuing."
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
              Find out if your Barrie property is a fit
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300">
              We help homeowners understand whether their basement suite or garden suite may fit the funding requirements before they move too far into design, permits, or construction.
            </p>
            <div className="mt-8 flex justify-center">
              <Link to="/match" className={buttonStyles.primary}>
                Start My Barrie Funding Review
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
