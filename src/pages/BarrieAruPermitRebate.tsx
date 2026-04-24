import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  FileCheck2,
  FileText,
  Home,
  Landmark,
  TreePine,
} from 'lucide-react';
import BarrieSecondarySuiteResources from '../components/BarrieSecondarySuiteResources';
import { buttonStyles } from '../lib/uiStyles';
import { cn } from '../lib/utils';

const breakdownCards = [
  {
    title: '50% upfront reduction',
    copy:
      'Eligible ARU building permit application fees may be reduced by 50% when applying.',
    icon: FileCheck2,
  },
  {
    title: 'Remaining 50% rebate',
    copy:
      'The remaining permit fee amount may be rebated if the project reaches the required final inspection or occupancy milestone within 12 months of permit issuance.',
    icon: CalendarClock,
  },
  {
    title: 'Applies to eligible ARUs',
    copy:
      'This can include basement suites, garden suites, coach houses, and eligible multi-unit conversions, subject to program rules.',
    icon: Building2,
  },
];

const projectCards = [
  {
    title: 'Basement suites',
    copy: 'May connect to the rebate if eligible under the City program.',
    href: '/barrie-basement-apartment-permits',
    icon: Home,
  },
  {
    title: 'Garden suites',
    copy: 'May connect to the rebate if eligible under the City program.',
    href: '/barrie-garden-suites',
    icon: TreePine,
  },
  {
    title: 'Coach houses',
    copy: 'May connect to the rebate if eligible under the City program.',
    href: '/barrie-garden-suites',
    icon: Building2,
  },
  {
    title: 'Multi-unit conversions',
    copy: 'May connect to the rebate if eligible under the City program limit.',
    href: '/barrie-aru-eligibility',
    icon: FileText,
  },
];

const misunderstandings = [
  'This does not pay for the full renovation.',
  'This does not guarantee permit approval.',
  'This does not replace the County funding program.',
  'The remaining rebate depends on meeting the timeline and completion requirements.',
  'Starting late or delaying construction may weaken the value of the incentive.',
];

const faqs = [
  {
    question: 'What is the Barrie ARU permit rebate?',
    answer:
      'It is a 2026 permit fee incentive for eligible additional residential unit projects. Eligible homeowners may receive a 50% permit fee reduction upfront, with the remaining 50% potentially rebated if the project reaches the required completion milestone within 12 months.',
  },
  {
    question: 'Does Barrie cover 100% of ARU permit fees?',
    answer:
      'Not automatically. The first 50% may be reduced upfront, and the remaining 50% may only be rebated if the project meets the timeline and completion requirements.',
  },
  {
    question: 'Is this the same as the $65,000 secondary suite funding?',
    answer:
      'No. The permit rebate is separate from the County of Simcoe Secondary Suites Program and Barrie Bonus. One focuses on eligible permit fees, while the other is a broader funding stack for qualifying affordable-rental projects.',
  },
  {
    question: 'Which projects can use the Barrie permit rebate?',
    answer:
      'Eligible ARU projects may include basement suites, garden suites, coach houses, and certain multi-unit conversions, subject to the City program rules.',
  },
  {
    question: 'What happens if the project takes longer than 12 months?',
    answer:
      'The homeowner may not receive the remaining permit fee rebate if the required completion milestone is not reached within the allowed timeframe.',
  },
  {
    question: 'Does the rebate apply to construction costs?',
    answer:
      'No. This is a permit fee incentive, not a construction funding program.',
  },
  {
    question: 'Should I check eligibility before applying?',
    answer:
      'Usually yes. Homeowners should confirm that the project type, permit path, and timeline realistically fit the City program before relying on the rebate.',
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

export default function BarrieAruPermitRebate() {
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
        <title>Barrie ARU Permit Rebate | 2026 Permit Fee Incentive</title>
        <meta
          name="description"
          content="Learn how Barrie’s 2026 ARU permit rebate works, including the 50% upfront permit fee reduction and the possible remaining 50% rebate for eligible secondary suite and garden suite projects."
        />
        <link rel="canonical" href="https://ontarioreno.ca/barrie-aru-permit-rebate" />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <section className="bg-slate-900 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-start lg:px-8 lg:py-20">
          <div className="max-w-[54rem]">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/15 px-4 py-2 text-sm font-medium text-blue-200 ring-1 ring-white/10">
              <Landmark className="h-4 w-4" />
              Barrie Permit Rebate
            </div>

            <h1 className="mt-5 text-4xl font-bold leading-[1.02] tracking-[-0.035em] md:text-6xl">
              Barrie ARU permit rebate: how the 2026 incentive works
            </h1>

            <p className="mt-5 max-w-3xl text-xl leading-8 text-slate-300">
              Barrie is offering a permit fee incentive for eligible additional residential units, including basement suites and garden suites. Homeowners may receive a 50% permit fee reduction upfront, with the remaining 50% rebated if the project reaches the required completion milestone within 12 months.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link to="/match" className={cn(buttonStyles.primary, 'w-full sm:w-auto')}>
                Check My ARU Project
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/barrie-secondary-suite-funding"
                className={cn(buttonStyles.ghostDark, 'w-full sm:w-auto')}
              >
                See $65K Funding Program
              </Link>
            </div>
          </div>

          <div className="rounded-[1rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.045)_0%,rgba(255,255,255,0.02)_100%)] p-5 shadow-[0_10px_24px_rgba(2,6,23,0.14)] backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200/90">
              Quick reality check
            </p>
            <div className="mt-4 space-y-4">
              {[
                'This is a permit fee incentive, not construction funding.',
                'The second half depends on the project hitting the required milestone within 12 months.',
                'This does not mean every ARU project qualifies.',
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
            title="Quick breakdown"
            description="Barrie’s 2026 permit incentive is built around a split benefit, not a single upfront waiver."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {breakdownCards.map((card) => (
              <div
                key={card.title}
                className="rounded-[1.35rem] border border-slate-200 bg-white p-6 shadow-[0_12px_28px_rgba(15,23,42,0.05)]"
              >
                <card.icon className="h-6 w-6 text-[#1B3C6C]" />
                <h3 className="mt-4 text-2xl font-bold text-slate-900">{card.title}</h3>
                <p className="mt-4 leading-7 text-slate-600">{card.copy}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            This is a permit fee incentive, not construction funding.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[1.5rem] border border-blue-200 bg-blue-50 p-8 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
            <SectionHeading
              title="This is separate from the $65K funding program"
              description="The permit rebate is different from the County of Simcoe Secondary Suites Program and Barrie Bonus. The funding program may provide up to $65,000 for eligible affordable rental units, while the permit rebate is focused on reducing eligible permit fees."
            />
            <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-700">
              Compare the broader funding stack through{' '}
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
          <SectionHeading
            title="Why the 12-month timeline matters"
            description="The rebate is tied to project completion timing. If the project does not reach the required completion milestone within the allowed window, the homeowner may not receive the remaining permit fee rebate."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              'For basement suites, the relevant milestone may involve final interior inspection.',
              'For garden suites or detached ARUs, the relevant milestone may involve occupancy.',
              'Exact requirements should be confirmed through the City program.',
            ].map((item) => (
              <div
                key={item}
                className="rounded-[1.3rem] border border-slate-200 bg-slate-50 p-6 shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
              >
                <div className="flex items-start gap-3">
                  <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-[#1B3C6C]" />
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
            title="Which projects may connect to the rebate?"
            description="Different ARU formats may connect to the rebate if eligible under the City program."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {projectCards.map((card) => (
              <Link
                key={card.title}
                to={card.href}
                className="group rounded-[1.3rem] border border-slate-200 bg-white p-6 shadow-[0_10px_24px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:shadow-[0_14px_30px_rgba(15,23,42,0.06)]"
              >
                <card.icon className="h-6 w-6 text-[#1B3C6C]" />
                <h3 className="mt-4 text-2xl font-bold text-slate-900">{card.title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{card.copy}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-8 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
            <SectionHeading
              title="How this affects project planning"
              description="The rebate does not remove the need for proper planning. Homeowners still need to consider design, drawings, permit review, inspections, contractor timelines, and whether the project can realistically meet the 12-month completion window."
            />
            <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-600">
              Compare the broader project math in{' '}
              <Link
                to="/barrie-secondary-suite-costs"
                className="font-semibold text-slate-900 underline underline-offset-4"
              >
                Barrie Secondary Suite Costs
              </Link>
              {' '}and the property-fit side in{' '}
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

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-8 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
            <SectionHeading
              title="Common misunderstandings"
              description="Barrie’s permit incentive can help, but it is often misunderstood when homeowners treat it like broader project funding."
            />
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {misunderstandings.map((item) => (
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

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Frequently asked questions"
            description="These are the rebate questions that usually matter most before a Barrie homeowner decides whether to rely on the incentive."
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
              Check if your Barrie ARU project can use the permit rebate
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300">
              Before assuming the rebate applies, confirm whether your project type, permit path, timeline, and funding goals line up.
            </p>
            <div className="mt-8 flex justify-center">
              <Link to="/match" className={buttonStyles.primary}>
                Start My Barrie ARU Review
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
