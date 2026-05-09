import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Compass, Landmark } from 'lucide-react';
import { buttonStyles } from '../lib/uiStyles';

const quickComparison = [
  {
    title: 'HELOC',
    icon: Compass,
    summary:
      'Usually fits better when the renovation plan is defined, spending may happen in stages, and the homeowner wants access to equity without resetting the full mortgage.',
    bestFor:
      'Staged renovation spending, timing uncertainty, and projects where flexible draw access supports the plan.',
    linkText: 'Read the home equity guide',
    href: '/financing/home-equity-renovations-ontario',
  },
  {
    title: 'Refinance',
    icon: Landmark,
    summary:
      'Usually fits better when the project is large enough to justify a broader borrowing reset and the ownership horizon is long enough for that decision to make sense.',
    bestFor:
      'Major additions, whole-home renovations, or larger Ontario renovation budgets that may justify restructuring into one mortgage.',
    linkText: 'Start project review',
    href: '/match',
  },
];

const helocFitPoints = [
  'Flexible draw access can suit renovation spending that happens in phases instead of one clean lump sum.',
  'It can be helpful when contractor timing, permit timing, or phased work leaves the budget sequence less predictable.',
  'It may fit homeowners who do not want to reset their entire mortgage just to support one renovation plan.',
  'It can support the renovation when equity access strengthens the project without changing the whole mortgage structure.',
];

const refinanceFitPoints = [
  'Very large renovation budgets can make refinance conversations more relevant, especially when the whole borrowing structure may need to change.',
  'A longer ownership horizon can make a broader borrowing reset feel more rational than short-term patchwork decisions.',
  'It can appeal to homeowners who want one mortgage structure instead of layering renovation borrowing on top of the existing setup.',
  'It tends to become more relevant on major additions, whole-home renovations, or other large Ontario projects with a stable long-term plan.',
];

const decisionFramework = [
  {
    step: '01',
    title: 'Is the scope defined?',
    body:
      'If the renovation is still changing shape, comparing a HELOC to a refinance is usually premature. A basement apartment, garden suite, or addition should first have a believable layout, permit path, and cost range.',
  },
  {
    step: '02',
    title: 'Is the project large enough?',
    body:
      'Smaller or cleaner renovations may not justify restructuring the entire mortgage. Larger projects with deeper cost, permit, or scope complexity may create a stronger reason to compare broader borrowing paths.',
  },
  {
    step: '03',
    title: 'Is the ownership timeline long enough?',
    body:
      'The longer the property is likely to be kept, the easier it is to justify a bigger financing decision around the renovation. A shorter horizon usually calls for more caution.',
  },
];

const ontarioConsiderations = [
  {
    title: 'Permits can change the financing conversation',
    body:
      'Ontario permit requirements, code upgrades, and compliance-heavy scope can turn a project that looked simple into something materially more expensive.',
    links: [
      { label: 'Ontario renovation costs', href: '/costs' },
      { label: 'project review', href: '/match' },
    ],
  },
  {
    title: 'Legal basement apartments need stronger planning',
    body:
      'Financing a legal basement apartment usually depends on more than income hopes. The suite has to work on layout, life safety, code compliance, and realistic budget logic.',
    links: [
      { label: 'legal suite planning guide', href: '/legal-suites' },
      {
        label: 'financing a legal basement apartment',
        href: '/financing/heloc-for-legal-basement-apartment',
      },
    ],
  },
  {
    title: 'Garden suites carry site and servicing complexity',
    body:
      'Garden suites can justify stronger long-term borrowing conversations, but only when servicing, site fit, municipal rules, and realistic costs support the plan.',
    links: [
      { label: 'garden suite planning guide', href: '/garden-suites' },
      {
        label: 'financing a garden suite',
        href: '/financing/garden-suite-financing-ontario',
      },
    ],
  },
  {
    title: 'Grants help, but they do not replace feasibility',
    body:
      'Ontario incentives can reduce borrowing pressure, especially on suite-related projects, but they should never be treated as a substitute for a viable renovation plan.',
    links: [
      { label: 'Hamilton grant guide', href: '/hamilton-grant-guide' },
      { label: 'grant eligibility calculator', href: '/grant-eligibility-calculator' },
    ],
  },
];

const commonMistakes = [
  'Comparing HELOCs and refinancing before the renovation has been realistically priced.',
  'Refinancing for a project that is still too unclear on layout, permits, or total cost.',
  'Using a HELOC without enough discipline around staged draws and scope changes.',
  'Assuming rental income will rescue a weak legal basement apartment or garden suite plan.',
  'Ignoring permit-heavy scope that can materially change the renovation budget.',
];

const faqItems = [
  {
    question: 'Is a HELOC better than refinancing for renovations?',
    answer:
      'Not automatically. A HELOC can suit staged spending and flexible access to equity, while a refinance can fit larger Ontario renovation projects that may justify a broader borrowing reset. The renovation itself should drive that decision.',
  },
  {
    question: 'When should I refinance for a renovation?',
    answer:
      'Refinancing becomes more relevant when the renovation budget is large, the ownership horizon is long, and the project is defined enough to justify folding the borrowing into one larger mortgage structure.',
  },
  {
    question: 'When does a HELOC make more sense?',
    answer:
      'A HELOC can make more sense when spending will happen in stages, timing is less predictable, or the homeowner wants equity access without changing the full mortgage.',
  },
  {
    question: 'Should I use a HELOC before I know the renovation cost?',
    answer:
      'Usually no. It is better to understand realistic Ontario renovation costs, likely permit implications, and the full project scope before relying on a HELOC as the solution.',
  },
  {
    question: 'Is refinancing better for a legal basement apartment?',
    answer:
      'Sometimes, but not by default. A legal basement apartment has to be feasible, code-compliant, and financially believable before refinance logic becomes meaningful.',
  },
  {
    question: 'Which option is better for a garden suite?',
    answer:
      'It depends on project size, servicing complexity, ownership timeline, and whether the garden suite is stable enough to justify broader borrowing changes.',
  },
  {
    question: 'Can grants affect the decision?',
    answer:
      'Yes. Ontario grants and incentives can reduce financing pressure, but they should be treated as supporting context rather than guaranteed project support.',
  },
  {
    question: 'What should I confirm before choosing?',
    answer:
      'Confirm the renovation scope, likely permit path, realistic cost range, ownership timeline, and whether the long-term value or income logic is actually strong enough to support the borrowing decision.',
  },
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
};

export default function HelocVsRefinanceForRenovations() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#f4f7fb_34%,#f7f9fc_100%)]">
      <Helmet>
        <title>HELOC vs Refinance for Renovations in Ontario | OntarioReno</title>
        <meta
          name="description"
          content="Compare HELOCs and refinancing for Ontario renovation projects, including when each path may fit, what risks to consider, and why the renovation plan should come before the borrowing decision."
        />
        <link
          rel="canonical"
          href="https://ontarioreno.ca/financing/heloc-vs-refinance-for-renovations"
        />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#f9fbfe_0%,#edf3f8_55%,#f6f8fb_100%)]">
        <div className="pointer-events-none absolute inset-0 opacity-45">
          <div className="absolute inset-x-0 top-0 h-44 bg-[radial-gradient(circle_at_18%_10%,rgba(96,165,250,0.18),transparent_30%),radial-gradient(circle_at_78%_16%,rgba(148,163,184,0.14),transparent_34%)]" />
          <div className="absolute inset-y-0 right-[10%] w-px bg-gradient-to-b from-transparent via-white/70 to-transparent" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />
        </div>

        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,0.98fr)_minmax(360px,0.86fr)] lg:items-center lg:gap-16 lg:px-8 lg:py-24">
          <div className="relative z-10">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-100/90 bg-white/80 px-4 py-2 text-sm font-medium text-[#1B3C6C] backdrop-blur-sm">
              <Compass className="h-4 w-4" />
              Ontario renovation financing guide
            </div>

            <h1 className="mt-6 max-w-4xl text-[3.1rem] font-bold leading-[0.94] tracking-[-0.055em] text-slate-950 md:text-[5rem]">
              HELOC vs Refinance for Renovations in Ontario
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600 md:text-[1.35rem] md:leading-9">
              The question is not only which borrowing path is available. The
              better question is whether the renovation is defined, valuable, and
              stable enough to justify restructuring borrowing around it.
            </p>

            <div className="mt-11 flex flex-col gap-4 sm:flex-row">
              <Link to="/match" className={buttonStyles.primary}>
                Start Project Review
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link to="/costs" className={buttonStyles.secondary}>
                Explore Renovation Costs
              </Link>
            </div>
          </div>

          <div className="relative z-10">
            <div className="overflow-hidden rounded-[2.2rem] border border-white/60 bg-white/36 p-4 shadow-[0_35px_90px_rgba(15,23,42,0.15)] backdrop-blur-sm md:p-5">
              <div className="relative overflow-hidden rounded-[1.8rem]">
                <img
                  src="/images/ontarioreno/modern-wide-angle-basement.jpg"
                  alt="Ontario renovation planning atmosphere with a refined interior renovation space"
                  className="aspect-[5/4] w-full object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.03)_0%,rgba(15,23,42,0.18)_58%,rgba(15,23,42,0.36)_100%)]" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between px-2 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
              <span>Borrowing comparison</span>
              <span>Renovation-first logic</span>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
            Quick comparison
          </p>
          <h2 className="mt-5 max-w-3xl text-[2.35rem] font-bold leading-[1.04] tracking-[-0.04em] text-slate-950 md:text-[3.45rem]">
            Two borrowing paths, one renovation-first question
          </h2>

          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            {quickComparison.map((item, index) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.title}
                  className={`rounded-[2rem] px-6 py-7 md:px-8 md:py-8 ${
                    index === 0
                      ? 'bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] ring-1 ring-slate-200/80 shadow-[0_22px_56px_rgba(15,23,42,0.08)]'
                      : 'bg-[linear-gradient(180deg,#f8fafc_0%,#f2f6fa_100%)] ring-1 ring-slate-200/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
                        {index === 0 ? 'Primary comparison point' : 'Secondary comparison point'}
                      </p>
                      <h3 className="mt-3 text-[1.9rem] font-bold leading-[1.05] tracking-[-0.035em] text-slate-950">
                        {item.title}
                      </h3>
                    </div>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                  </div>

                  <p className="mt-6 text-base leading-8 text-slate-600">{item.summary}</p>
                  <p className="mt-5 text-sm leading-7 text-slate-700">
                    <span className="font-semibold text-slate-900">Usually best for:</span>{' '}
                    {item.bestFor}
                  </p>
                  <Link
                    to={item.href}
                    className="mt-6 inline-flex items-center text-sm font-semibold text-[#1B3C6C] hover:underline"
                  >
                    {item.linkText}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative bg-[linear-gradient(180deg,#f4f7fb_0%,#f7f9fc_100%)] py-24 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
                When a HELOC may fit better
              </p>
              <h2 className="mt-5 max-w-2xl text-[2.2rem] font-bold leading-[1.05] tracking-[-0.04em] text-slate-950 md:text-[3.1rem]">
                Flexible access can matter more than a full borrowing reset
              </h2>
              <ul className="mt-8 space-y-4 text-base leading-8 text-slate-600">
                {helocFitPoints.map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-slate-400" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
                When refinancing may fit better
              </p>
              <h2 className="mt-5 max-w-2xl text-[2.2rem] font-bold leading-[1.05] tracking-[-0.04em] text-slate-950 md:text-[3.1rem]">
                Bigger projects can justify a broader mortgage-level decision
              </h2>
              <ul className="mt-8 space-y-4 text-base leading-8 text-slate-600">
                {refinanceFitPoints.map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-slate-400" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-24 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
            Renovation-first decision framework
          </p>
          <h2 className="mt-5 max-w-3xl text-[2.3rem] font-bold leading-[1.04] tracking-[-0.04em] text-slate-950 md:text-[3.35rem]">
            Test the renovation before comparing the borrowing path
          </h2>

          <div className="mt-12 space-y-8">
            {decisionFramework.map((item) => (
              <article
                key={item.step}
                className="grid gap-5 border-t border-slate-200 pt-6 first:border-t-0 first:pt-0 lg:grid-cols-[90px_minmax(0,1fr)]"
              >
                <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-[1.5rem] font-semibold tracking-[-0.03em] text-slate-950">
                    {item.title}
                  </h3>
                  <p className="mt-3 max-w-3xl text-base leading-8 text-slate-600">
                    {item.body}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_24%),linear-gradient(180deg,#0f172a_0%,#020617_100%)] py-24 text-white lg:py-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/16 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-200">
            Ontario renovation considerations
          </p>
          <h2 className="mt-5 max-w-4xl text-[2.45rem] font-bold leading-[1.02] tracking-[-0.045em] text-white md:text-[3.7rem]">
            Ontario permits, suite rules, and realistic costs still shape the borrowing choice
          </h2>

          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            {ontarioConsiderations.map((item) => (
              <article key={item.title} className="border-t border-white/12 pt-6 first:pt-0 first:border-t-0">
                <h3 className="text-[1.3rem] font-semibold tracking-[-0.03em] text-white">
                  {item.title}
                </h3>
                <p className="mt-3 text-base leading-8 text-slate-300">{item.body}</p>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-blue-200">
                  {item.links.map((link) => (
                    <Link key={link.href} to={link.href} className="hover:underline">
                      {link.label}
                    </Link>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,#ffffff_0%,#fbfcfd_100%)] py-24 lg:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
            Common mistakes
          </p>
          <h2 className="mt-5 max-w-3xl text-[2.2rem] font-bold leading-[1.04] tracking-[-0.04em] text-slate-950 md:text-[3.1rem]">
            Borrowing comparisons get messy when the renovation is still unclear
          </h2>

          <div className="mt-10 space-y-4">
            {commonMistakes.map((item) => (
              <div key={item} className="flex items-start gap-3 border-t border-slate-200 pt-4 first:border-t-0 first:pt-0">
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-slate-400" />
                <p className="text-base leading-8 text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative bg-[linear-gradient(180deg,#f5f8fc_0%,#edf2f7_100%)] py-24 lg:py-28">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
            Next step
          </p>
          <h2 className="mx-auto mt-5 max-w-4xl text-[2.35rem] font-bold leading-[1.04] tracking-[-0.04em] text-slate-950 md:text-[3.35rem]">
            Compare the financing path after the renovation makes sense
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-600 md:text-[1.05rem]">
            Start with the renovation scope, the permit path, and the realistic cost logic. Then
            decide whether a HELOC, a refinance, or a phased approach deserves a closer look.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link to="/match" className={buttonStyles.primary}>
              Start Project Review
            </Link>
            <Link
              to="/financing/home-equity-renovations-ontario"
              className={buttonStyles.secondary}
            >
              Read the Home Equity Guide
            </Link>
          </div>
          <p className="mt-5 text-sm leading-7 text-slate-500">
            If you are also comparing monthly payment-oriented project options,
            review the{' '}
            <Link to="/financing" className="font-medium text-[#1B3C6C] hover:underline">
              Ontario renovation financing overview
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
            Frequently asked questions
          </p>
          <h2 className="mt-5 max-w-3xl text-[2.2rem] font-bold leading-[1.05] tracking-[-0.04em] text-slate-950 md:text-[3.1rem]">
            Questions before choosing between a HELOC and a refinance
          </h2>

          <div className="mt-12 divide-y divide-slate-200/80">
            {faqItems.map((item) => (
              <details key={item.question} className="group px-0 py-5">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-left">
                  <span className="max-w-3xl text-[1.05rem] font-semibold leading-7 tracking-[-0.02em] text-slate-950 md:text-[1.12rem]">
                    {item.question}
                  </span>
                  <span className="mt-1 text-slate-400 transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
