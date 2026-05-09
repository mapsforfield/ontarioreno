import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Compass, Gift } from 'lucide-react';
import { buttonStyles } from '../lib/uiStyles';

const pressureReductionPoints = [
  'Reducing part of the out-of-pocket pressure on a project that already makes sense.',
  'Lowering how much of the renovation may need to be carried on a HELOC or other financing path.',
  'Helping the economics of a legal suite or secondary-suite project when eligibility is realistic.',
  'Adding confidence to a renovation plan that is already viable on cost, permits, and ownership logic.',
  'Supporting the financing plan without becoming the entire reason the renovation works.',
];

const projectsWhereIncentivesMatter = [
  {
    title: 'Legal basement apartments and secondary suites',
    body:
      'These are often the projects where municipal or housing-related programs can matter most, especially when the suite is part of a real legal-compliance path.',
    href: '/legal-suites',
    linkText: 'See legal suite planning',
  },
  {
    title: 'Garden suites and backyard dwellings',
    body:
      'Garden suites can sometimes align with housing-support or municipal programs, but the site, servicing, and cost logic still need to stand on their own.',
    href: '/garden-suites',
    linkText: 'See garden suite planning',
  },
  {
    title: 'Basement renovation paths that may become legal suites',
    body:
      'A basement project may move from a standard renovation into a legal suite conversation, which can change both the financing logic and the grant path.',
    href: '/basements',
    linkText: 'See basement planning',
  },
];

const confirmChecklist = [
  'Is the program currently active?',
  'Does the property qualify?',
  'Does the renovation scope qualify?',
  'Are permits required?',
  'When is funding paid?',
  'What documentation is needed?',
];

const ontarioConsiderations = [
  {
    title: 'Programs and municipal conditions can vary',
    body:
      'Ontario incentive programs are not always consistent across cities or across time. Municipal variation can affect which projects qualify and how helpful an incentive really is.',
    links: [
      { label: 'Hamilton grant guide', href: '/hamilton-grant-guide' },
      { label: 'grant eligibility calculator', href: '/grant-eligibility-calculator' },
    ],
  },
  {
    title: 'Legal suite permits still matter',
    body:
      'An incentive does not remove the need for a legal permit path, code compliance, or realistic suite feasibility. Those still shape the financing pressure and the project risk.',
    links: [
      {
        label: 'financing a legal basement apartment',
        href: '/financing/heloc-for-legal-basement-apartment',
      },
      { label: 'Ontario renovation costs', href: '/costs' },
    ],
  },
  {
    title: 'Garden suite and home-equity logic still need to work',
    body:
      'If a garden suite only feels viable because of a hoped-for incentive, the project may still be too fragile. Home equity and financing decisions should remain grounded in the underlying build logic.',
    links: [
      {
        label: 'garden suite financing',
        href: '/financing/garden-suite-financing-ontario',
      },
      {
        label: 'home equity guide',
        href: '/financing/home-equity-renovations-ontario',
      },
    ],
  },
];

const commonMistakes = [
  'Assuming grant money is guaranteed before eligibility is actually confirmed.',
  'Starting work before understanding the program requirements and timing rules.',
  'Ignoring documentation needs or reimbursement conditions.',
  'Financing a project that only works if the grant eventually pays out.',
  'Misunderstanding which costs are eligible and which are not.',
  'Ignoring permit conditions or compliance requirements tied to the incentive path.',
];

const faqItems = [
  {
    question: 'Can grants reduce how much home equity I need?',
    answer:
      'Sometimes. Grants and incentives can reduce financing pressure, but they usually work best as support for a project that already makes sense rather than as the foundation of the plan.',
  },
  {
    question: 'Can I use a HELOC while waiting for a grant?',
    answer:
      'Sometimes, yes. A HELOC can offer flexible access to funds while a project moves through approvals or reimbursement timing, but it should still be backed by a realistic renovation and cash-flow plan.',
  },
  {
    question: 'Are renovation grants guaranteed in Ontario?',
    answer:
      'No. Programs can change, eligibility can vary, and approval is not guaranteed. That is why incentives should be treated as supportive rather than assumed.',
  },
  {
    question: 'Should I finance a renovation before confirming grant eligibility?',
    answer:
      'Usually no. At minimum, homeowners should understand whether the program is active, whether the property and scope appear to qualify, and how the funding is actually paid.',
  },
  {
    question: 'Do basement apartment grants affect HELOC planning?',
    answer:
      'They can. If a legal basement apartment project has a realistic incentive path, that may reduce the financing pressure, but the suite still has to work on permits, cost, and legal feasibility.',
  },
  {
    question: 'Can incentives help with garden suites?',
    answer:
      'Sometimes, depending on the municipality and program structure. But a garden suite should still make sense on site fit, servicing, timing, and cost even without relying on a best-case incentive scenario.',
  },
  {
    question: 'What should I confirm before relying on a grant?',
    answer:
      'Confirm whether the program is active, whether the property and renovation scope qualify, what permits are required, when funding is paid, and what documentation must be submitted.',
  },
  {
    question: 'Do grants replace permits or feasibility?',
    answer:
      'No. Incentives do not replace permits, feasibility, code compliance, or realistic renovation costs. Those still drive whether the project is viable.',
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

export default function GrantsAndIncentivesWithHomeEquity() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#f4f7fb_34%,#f7f9fc_100%)]">
      <Helmet>
        <title>Using Grants and Incentives with Home Equity in Ontario | OntarioReno</title>
        <meta
          name="description"
          content="Learn how Ontario homeowners can think about grants, incentives, HELOCs, and home equity when planning renovations, including legal suites, garden suites, permits, feasibility, and financing pressure."
        />
        <link
          rel="canonical"
          href="https://ontarioreno.ca/financing/grants-and-incentives-with-home-equity"
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
              <Gift className="h-4 w-4" />
              Ontario incentive-aware planning guide
            </div>

            <h1 className="mt-6 max-w-4xl text-[3.1rem] font-bold leading-[0.94] tracking-[-0.055em] text-slate-950 md:text-[5rem]">
              Using Grants and Incentives with Home Equity in Ontario
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600 md:text-[1.35rem] md:leading-9">
              Grants and incentives can help support a renovation, but they should not be treated
              as the foundation of the project. The renovation still needs to make sense on cost,
              permits, scope, and ownership timeline.
            </p>

            <div className="mt-11 flex flex-col gap-4 sm:flex-row">
              <Link to="/grant-eligibility-calculator" className={buttonStyles.primary}>
                Check Grant Eligibility
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
                  src="/images/blueprint-hero.png"
                  alt="Architectural blueprint atmosphere representing incentive-aware renovation planning"
                  className="aspect-[5/4] w-full object-contain bg-[linear-gradient(180deg,#eef4fa_0%,#e8eff6_100%)] p-8"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.03)_0%,rgba(15,23,42,0.1)_70%,rgba(15,23,42,0.16)_100%)]" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between px-2 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
              <span>Grant-aware planning</span>
              <span>Ontario renovation strategy</span>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
            Why grants do not replace renovation feasibility
          </p>
          <h2 className="mt-5 max-w-3xl text-[2.35rem] font-bold leading-[1.04] tracking-[-0.04em] text-slate-950 md:text-[3.45rem]">
            Incentives can reduce pressure, but they do not make a weak renovation plan viable
          </h2>

          <div className="mt-8 max-w-3xl space-y-5 text-base leading-8 text-slate-600 md:text-[1.02rem]">
            <p>
              Incentives may be limited, programs can change, approval is not guaranteed, and
              reimbursement timing can matter more than homeowners expect. Even when a program looks
              promising, the renovation still needs realistic costs, a credible permit path, and a
              scope that can hold up without best-case assumptions.
            </p>
            <p>
              The safest mindset is to treat grants as supportive project context rather than as
              free money that solves the renovation.
            </p>
          </div>
        </div>
      </section>

      <section className="relative bg-[linear-gradient(180deg,#f4f7fb_0%,#f7f9fc_100%)] py-24 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
            How grants can reduce financing pressure
          </p>
          <h2 className="mt-5 max-w-3xl text-[2.25rem] font-bold leading-[1.05] tracking-[-0.04em] text-slate-950 md:text-[3.2rem]">
            Grants can support the financing plan without becoming the entire plan
          </h2>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {pressureReductionPoints.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-slate-400" />
                <p className="text-base leading-8 text-slate-600">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-24 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
            Projects where incentives may matter most
          </p>
          <h2 className="mt-5 max-w-3xl text-[2.3rem] font-bold leading-[1.04] tracking-[-0.04em] text-slate-950 md:text-[3.35rem]">
            Incentives usually matter most where legal housing or support-program logic is strongest
          </h2>

          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            {projectsWhereIncentivesMatter.map((item) => (
              <article key={item.title} className="border-t border-slate-200 pt-6 first:border-t-0 first:pt-0">
                <h3 className="text-[1.3rem] font-semibold tracking-[-0.03em] text-slate-950">
                  {item.title}
                </h3>
                <p className="mt-3 text-base leading-8 text-slate-600">{item.body}</p>
                <Link
                  to={item.href}
                  className="mt-4 inline-flex items-center text-sm font-semibold text-[#1B3C6C] hover:underline"
                >
                  {item.linkText}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
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
            Home equity and grant timing
          </p>
          <h2 className="mt-5 max-w-4xl text-[2.45rem] font-bold leading-[1.02] tracking-[-0.045em] text-white md:text-[3.7rem]">
            The incentive may arrive later than the financing pressure
          </h2>

          <div className="mt-8 max-w-4xl space-y-5 text-base leading-8 text-slate-300 md:text-[1.02rem]">
            <p>
              Some grants reimburse later, depend on approvals, or require specific milestones and
              documentation. That means homeowners may still need upfront financing or enough cash
              flow to move the renovation through early stages.
            </p>
            <p>
              A HELOC can sometimes provide flexibility while waiting for program steps, and
              renovation financing can still help on cleaner scopes, but neither should be chosen
              without realistic expectations about timing and eligibility.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,#ffffff_0%,#fbfcfd_100%)] py-24 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
            What to confirm before relying on incentives
          </p>
          <h2 className="mt-5 max-w-3xl text-[2.3rem] font-bold leading-[1.04] tracking-[-0.04em] text-slate-950 md:text-[3.35rem]">
            Confirm the program path before you build it into the financing plan
          </h2>

          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {confirmChecklist.map((item) => (
              <div key={item} className="border-t border-slate-200 pt-4 first:border-t-0 first:pt-0">
                <p className="text-base leading-8 text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,#f5f8fc_0%,#edf2f7_100%)] py-24 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
            Ontario-specific planning considerations
          </p>
          <h2 className="mt-5 max-w-3xl text-[2.2rem] font-bold leading-[1.04] tracking-[-0.04em] text-slate-950 md:text-[3.1rem]">
            Incentives, permits, and financing pressure all need to be judged in the same Ontario project context
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

      <section className="bg-white py-24 lg:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
            Common mistakes
          </p>
          <h2 className="mt-5 max-w-3xl text-[2.2rem] font-bold leading-[1.04] tracking-[-0.04em] text-slate-950 md:text-[3.1rem]">
            Grants help most when they support a disciplined project, not when they substitute for one
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
            Confirm the incentive path before building it into the financing plan
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-600 md:text-[1.05rem]">
            Check the real eligibility path, the permit requirements, and the renovation logic
            before treating an incentive as part of the funding strategy.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link to="/grant-eligibility-calculator" className={buttonStyles.primary}>
              Check Grant Eligibility
            </Link>
            <Link to="/match" className={buttonStyles.secondary}>
              Start Project Review
            </Link>
          </div>
          <p className="mt-5 text-sm leading-7 text-slate-500">
            For the broader monthly-payment renovation context, review the{' '}
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
            Questions before using incentives in the financing plan
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
