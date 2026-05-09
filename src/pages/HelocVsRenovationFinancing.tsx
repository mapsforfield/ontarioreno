import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Compass, Wrench } from 'lucide-react';
import { buttonStyles } from '../lib/uiStyles';

const comparisonItems = [
  {
    title: 'HELOC',
    icon: Compass,
    summary:
      'Usually fits best when the homeowner wants flexible access to home equity and the renovation may unfold in stages rather than one fixed payment structure.',
    bestFor:
      'Larger budgets, staged spending, longer ownership horizons, and projects with more scope or permit complexity.',
    href: '/financing/home-equity-renovations-ontario',
    linkText: 'Read the home equity guide',
  },
  {
    title: 'Renovation financing',
    icon: Wrench,
    summary:
      'Usually fits best when the renovation scope is cleaner, the budget is more defined, and the homeowner prefers financing structure that feels closer to the project itself.',
    bestFor:
      'Defined scopes, cleaner payment structure, and projects where monthly-payment clarity matters more than flexible equity access.',
    href: '/open-loan-financing',
    linkText: 'Explore renovation financing context',
  },
];

const helocFitPoints = [
  'Larger project budgets can make flexible access to home equity more useful than tightly structured project-based payments.',
  'Staged renovation spending can suit a HELOC when design, permits, contractor timing, and final scope do not line up cleanly all at once.',
  'It can appeal to homeowners who want to keep the existing mortgage structure intact while still accessing equity.',
  'It often fits better on legal suites, garden suites, additions, or other complex renovation scopes where the project may need more financial flexibility.',
  'A longer ownership horizon can make home-equity-backed renovation decisions easier to justify.',
];

const renovationFinancingFitPoints = [
  'Cleaner project scopes and more defined budgets can make structured renovation financing feel simpler to manage.',
  'It may fit homeowners who prefer clearer payment structure tied more directly to the renovation decision.',
  'It often fits better where payment clarity matters more than flexible access to home equity.',
  'Smaller or mid-sized renovation projects can sometimes feel more manageable when financing is attached to a defined project rather than a broader equity strategy.',
  'It still depends on realistic costs and a clear scope, not just on whether the payment path looks easy.',
];

const decisionFramework = [
  {
    question: 'Is the project scope defined?',
    answer:
      'If the scope is still likely to expand, structured renovation financing may feel too tight while a HELOC may feel too easy. Either way, the renovation needs more clarity first.',
  },
  {
    question: 'Is the renovation budget realistic?',
    answer:
      'Financing comparisons become distorted when the cost range is optimistic. Realistic Ontario renovation costs should come before choosing a payment path.',
  },
  {
    question: 'Is the project permit-heavy?',
    answer:
      'Permit-heavy projects such as legal suites, garden suites, additions, or major reconfigurations often carry more timing and scope risk than clean interior upgrades.',
  },
  {
    question: 'Does the homeowner need flexibility or structure?',
    answer:
      'A HELOC tends to serve flexibility. Renovation financing tends to serve payment structure. The right answer depends on the renovation itself, not just on the borrowing tool.',
  },
];

const ontarioConsiderations = [
  {
    title: 'Permit-heavy projects change the financing fit',
    body:
      'Basement renovations, legal basement apartments, garden suites, and additions can become more expensive and slower once permit, compliance, or municipal requirements become real.',
    links: [
      { label: 'Ontario renovation costs', href: '/costs' },
      { label: 'HELOC vs refinance', href: '/financing/heloc-vs-refinance-for-renovations' },
    ],
  },
  {
    title: 'Legal suites and garden suites usually need more planning than cleaner renovations',
    body:
      'These projects often carry more long-term upside, but they also bring more scope complexity, servicing demands, and financing pressure than many homeowners first expect.',
    links: [
      { label: 'legal suite planning', href: '/legal-suites' },
      { label: 'garden suite planning', href: '/garden-suites' },
    ],
  },
  {
    title: 'Financing pressure should stay connected to the project size',
    body:
      'The right path depends on whether the renovation is small and clean, mid-sized and defined, or larger and flexible enough to justify home equity as part of the plan.',
    links: [
      { label: 'basement renovation planning', href: '/basements' },
      { label: 'home equity guide', href: '/financing/home-equity-renovations-ontario' },
    ],
  },
];

const commonMistakes = [
  'Choosing the financing path before pricing the renovation realistically.',
  'Using renovation financing for a project scope that is still likely to expand heavily.',
  'Using a HELOC without enough discipline around staged draws and budget control.',
  'Assuming the easiest payment path is automatically the best project path.',
  'Ignoring permits, feasibility, and hidden scope changes.',
  'Comparing monthly payments without comparing actual renovation risk.',
];

const faqItems = [
  {
    question: 'Is a HELOC better than renovation financing?',
    answer:
      'Not automatically. A HELOC usually fits better when flexibility matters, while renovation financing may fit better when the scope is cleaner and the homeowner wants more structured payments. The renovation itself should drive the choice.',
  },
  {
    question: 'What is renovation financing?',
    answer:
      'In this context, renovation financing means payment-based financing connected more closely to the renovation project rather than drawing on home equity directly. It can feel simpler, but it does not replace project planning.',
  },
  {
    question: 'When does renovation financing make sense?',
    answer:
      'It often makes more sense when the renovation scope is defined, the budget is clearer, and the homeowner prefers structure and payment clarity over flexible equity access.',
  },
  {
    question: 'When does a HELOC make more sense?',
    answer:
      'A HELOC often makes more sense on larger or more staged projects, longer-term renovation plans, legal suites, garden suites, additions, and other scopes where flexibility matters more than fixed payment structure.',
  },
  {
    question: 'Is renovation financing the same as contractor financing?',
    answer:
      'Homeowners often hear similar language around these options, but the more useful distinction is whether the financing is structured around the renovation project itself rather than around home equity access.',
  },
  {
    question: 'Should I compare payment options before pricing the project?',
    answer:
      'Usually no. Realistic pricing, likely permits, and scope stability should come before comparing how to fund the renovation.',
  },
  {
    question: 'Which option works better for basement renovations?',
    answer:
      'That depends on scope, permits, budget clarity, and whether the basement is a cleaner finish project or something more complex such as a legal suite path.',
  },
  {
    question: 'Which option works better for legal suites or garden suites?',
    answer:
      'Projects like legal suites or garden suites often need deeper planning and may lean more naturally toward flexible equity access, but only when the feasibility, cost logic, and ownership plan are strong enough to support that choice.',
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

export default function HelocVsRenovationFinancing() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#f4f7fb_34%,#f7f9fc_100%)]">
      <Helmet>
        <title>HELOC vs Renovation Financing in Ontario | OntarioReno</title>
        <meta
          name="description"
          content="Compare HELOCs and renovation financing for Ontario renovation projects, including when each path may fit, what risks to consider, and why the project plan should come before the borrowing decision."
        />
        <link
          rel="canonical"
          href="https://ontarioreno.ca/financing/heloc-vs-contractor-financing"
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
              <Wrench className="h-4 w-4" />
              Ontario renovation financing guide
            </div>

            <h1 className="mt-6 max-w-4xl text-[3.1rem] font-bold leading-[0.94] tracking-[-0.055em] text-slate-950 md:text-[5rem]">
              HELOC vs Renovation Financing in Ontario
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600 md:text-[1.35rem] md:leading-9">
              A HELOC and renovation financing solve different problems. One tends to offer
              flexible access to home equity. The other may feel more structured around the
              renovation itself. The project plan should come first either way.
            </p>

            <div className="mt-11 flex flex-col gap-4 sm:flex-row">
              <Link to="/match" className={buttonStyles.primary}>
                Start Project Review
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/financing/home-equity-renovations-ontario"
                className={buttonStyles.secondary}
              >
                Read the Home Equity Guide
              </Link>
            </div>
          </div>

          <div className="relative z-10">
            <div className="overflow-hidden rounded-[2.2rem] border border-white/60 bg-white/36 p-4 shadow-[0_35px_90px_rgba(15,23,42,0.15)] backdrop-blur-sm md:p-5">
              <div className="relative overflow-hidden rounded-[1.8rem]">
                <img
                  src="/images/ontarioreno/modern-wide-angle-basement.jpg"
                  alt="Ontario renovation planning atmosphere for comparing financing paths"
                  className="aspect-[5/4] w-full object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.04)_0%,rgba(15,23,42,0.2)_58%,rgba(15,23,42,0.36)_100%)]" />
                <div className="absolute inset-x-6 bottom-6">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-white/72">
                    Project-first comparison
                  </p>
                  <p className="mt-2 max-w-[74%] text-base leading-7 text-white/92">
                    Compare the payment path only after the renovation is defined enough to trust.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between px-2 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
              <span>Flexible equity vs structure</span>
              <span>Ontario homeowner guidance</span>
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
            Two financing paths, two different kinds of flexibility
          </h2>

          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            {comparisonItems.map((item) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.title}
                  className="rounded-[2rem] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-6 py-7 ring-1 ring-slate-200/80 shadow-[0_22px_56px_rgba(15,23,42,0.08)] md:px-8 md:py-8"
                >
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
                        {item.title === 'HELOC' ? 'Equity path' : 'Project-linked path'}
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
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
                What renovation financing means here
              </p>
              <h2 className="mt-5 max-w-3xl text-[2.25rem] font-bold leading-[1.05] tracking-[-0.04em] text-slate-950 md:text-[3.2rem]">
                More structured payments tied to the renovation, not direct access to home equity
              </h2>
            </div>

            <div className="space-y-5 text-base leading-8 text-slate-600 md:text-[1.02rem]">
              <p>
                Renovation financing, in this context, means payment-based financing that sits
                closer to the renovation project itself. Homeowners often consider it when the
                scope is cleaner, the budget is more defined, and the appeal of structured payments
                matters more than flexible equity access.
              </p>
              <p>
                It can feel simpler than using a HELOC, but it does not replace project planning.
                If the renovation is still unstable on cost, permits, or scope, the financing path
                can still be wrong even when the payment structure looks convenient.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-24 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
                When a HELOC may fit better
              </p>
              <h2 className="mt-5 max-w-2xl text-[2.2rem] font-bold leading-[1.05] tracking-[-0.04em] text-slate-950 md:text-[3.1rem]">
                Flexible access matters more when the renovation is larger or less linear
              </h2>
              <ul className="mt-8 space-y-4 text-base leading-8 text-slate-600">
                {helocFitPoints.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-slate-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
                When renovation financing may fit better
              </p>
              <h2 className="mt-5 max-w-2xl text-[2.2rem] font-bold leading-[1.05] tracking-[-0.04em] text-slate-950 md:text-[3.1rem]">
                Structure matters more when the project is cleaner and easier to price
              </h2>
              <ul className="mt-8 space-y-4 text-base leading-8 text-slate-600">
                {renovationFinancingFitPoints.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-slate-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
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
            Renovation-first decision framework
          </p>
          <h2 className="mt-5 max-w-4xl text-[2.45rem] font-bold leading-[1.02] tracking-[-0.045em] text-white md:text-[3.7rem]">
            Compare the financing path only after the renovation can answer these questions
          </h2>

          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            {decisionFramework.map((item) => (
              <article key={item.question} className="border-t border-white/12 pt-6 first:pt-0 first:border-t-0">
                <h3 className="text-[1.3rem] font-semibold tracking-[-0.03em] text-white">
                  {item.question}
                </h3>
                <p className="mt-3 text-base leading-8 text-slate-300">{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,#ffffff_0%,#fbfcfd_100%)] py-24 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
            Ontario renovation considerations
          </p>
          <h2 className="mt-5 max-w-3xl text-[2.3rem] font-bold leading-[1.04] tracking-[-0.04em] text-slate-950 md:text-[3.35rem]">
            Permit-heavy projects change the financing conversation faster than many homeowners expect
          </h2>

          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            {ontarioConsiderations.map((item) => (
              <article key={item.title} className="border-t border-slate-200 pt-6 first:border-t-0 first:pt-0">
                <h3 className="text-[1.2rem] font-semibold tracking-[-0.03em] text-slate-950">
                  {item.title}
                </h3>
                <p className="mt-3 text-base leading-8 text-slate-600">{item.body}</p>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-[#1B3C6C]">
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

      <section className="bg-[linear-gradient(180deg,#f5f8fc_0%,#edf2f7_100%)] py-24 lg:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
            Common mistakes
          </p>
          <h2 className="mt-5 max-w-3xl text-[2.2rem] font-bold leading-[1.04] tracking-[-0.04em] text-slate-950 md:text-[3.1rem]">
            Financing comparisons get distorted when the renovation is still unclear
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
            Choose the financing path after the renovation is clear
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-600 md:text-[1.05rem]">
            Price the renovation, understand the permit path, and judge the project risk before
            deciding whether flexible equity access or more structured renovation financing fits
            better.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link to="/match" className={buttonStyles.primary}>
              Start Project Review
            </Link>
            <Link to="/costs" className={buttonStyles.secondary}>
              Explore Renovation Costs
            </Link>
          </div>
          <p className="mt-5 text-sm leading-7 text-slate-500">
            For the broader monthly-payment and project-financing context, review
            the{' '}
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
            Questions before choosing between a HELOC and renovation financing
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
