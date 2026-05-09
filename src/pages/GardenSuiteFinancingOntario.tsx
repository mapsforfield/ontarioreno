import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Compass, Landmark, Layers3, Wrench } from 'lucide-react';
import { buttonStyles } from '../lib/uiStyles';

const financingPaths = [
  {
    title: 'HELOC',
    icon: Compass,
    body:
      'Often becomes the most natural comparison point when the garden suite has promising feasibility, staged costs, and a homeowner who wants flexible access to equity without resetting the full mortgage.',
  },
  {
    title: 'Refinance',
    icon: Landmark,
    body:
      'Can make more sense when the garden suite budget is large enough to justify a broader borrowing reset and the ownership horizon is long enough for that decision to feel rational.',
  },
  {
    title: 'Renovation financing',
    icon: Wrench,
    body:
      'Can fit cleaner project scopes where payment structure or staged funding matters more than long-term access to home equity.',
  },
  {
    title: 'Phased approach',
    icon: Layers3,
    body:
      'Sometimes the better move is sequencing design, approvals, servicing work, and construction in stages instead of treating the entire garden suite as one funding event.',
  },
];

const whyFinancingPlanningMatters = [
  'Garden suites are high-ticket backyard projects, not light finish upgrades.',
  'Design, permit, and consultant work can begin well before major construction starts.',
  'Foundation work, site preparation, servicing, and utility connections can materially reshape the budget.',
  'Timelines are often long enough that staged financing decisions matter just as much as the total cost.',
];

const helocFitPoints = [
  'Staged project spending can suit a garden suite where design, approvals, servicing, and construction do not happen all at once.',
  'It can help homeowners retain the existing mortgage structure while still creating flexible access to funds.',
  'It may fit when the garden suite has strong long-term family-use or rental logic but the final construction sequence is still being refined.',
  'It can support the project when feasibility is promising and equity access helps move the suite through staged progress.',
];

const refinanceFitPoints = [
  'Very large project budgets can make refinancing more relevant than lighter financing tools.',
  'A longer ownership horizon can make a broader borrowing reset easier to justify.',
  'It may fit homeowners who want the garden suite financing folded into one larger mortgage structure.',
  'It becomes more relevant when the project is large enough, clear enough, and stable enough to support a bigger financing decision.',
];

const siteFeasibilityPoints = [
  'Lot size and setback constraints',
  'Access and buildability on the site',
  'Servicing and utility connection requirements',
  'Zoning or bylaw limitations',
  'Municipal review and permit path',
  'Design feasibility before financing is locked in',
];

const ontarioConsiderations = [
  {
    title: 'Municipal rules and approvals vary',
    body:
      'Garden suite rules can differ by municipality, which means site assumptions and financing assumptions should never get too far ahead of the local approval path.',
  },
  {
    title: 'Servicing complexity can change the budget quickly',
    body:
      'Water, sewer, hydro, grading, and access conditions can materially change what a garden suite really costs and how the financing pressure feels.',
  },
  {
    title: 'Long-term use matters as much as rent',
    body:
      'Family use, multigenerational use, long-term flexibility, and realistic rental potential all shape whether the project deserves a larger financing decision.',
  },
];

const commonMistakes = [
  'Financing before confirming whether the lot can actually support a garden suite.',
  'Assuming every backyard can handle setbacks, access, servicing, and permit requirements.',
  'Underestimating servicing and utility connection costs.',
  'Relying too heavily on projected rental income before the site and budget are real.',
  'Treating a garden suite like a simple backyard renovation instead of a serious secondary dwelling project.',
  'Ignoring permit timing and municipal uncertainty when planning the financing.',
];

const faqItems = [
  {
    question: 'Can I use a HELOC for a garden suite?',
    answer:
      'Yes. Many Ontario homeowners consider a HELOC for a garden suite, especially when the project will move through staged spending and the homeowner wants flexible access to equity without changing the full mortgage.',
  },
  {
    question: 'Is refinancing better for a garden suite?',
    answer:
      'Sometimes. Refinancing can become more relevant when the garden suite budget is very large, the ownership horizon is long, and the project is stable enough to justify a broader borrowing reset.',
  },
  {
    question: 'What makes garden suite financing different?',
    answer:
      'A garden suite is shaped by site feasibility, municipal review, servicing, utilities, design work, and long timelines. Those layers make the financing decision more complex than a typical interior renovation.',
  },
  {
    question: 'Should I finance before confirming site feasibility?',
    answer:
      'Usually no. Lot constraints, servicing requirements, setbacks, and municipal rules should be pressure-tested before financing becomes the center of the decision.',
  },
  {
    question: 'Can rental income justify a garden suite?',
    answer:
      'Sometimes, but projected rent should support a viable project rather than rescue a weak one. The suite still needs a realistic site, budget, permit path, and long-term use case.',
  },
  {
    question: 'What costs should I understand before financing?',
    answer:
      'Understand design work, permits, servicing, site preparation, utility connections, construction costs, and the timeline risk that can change how the budget unfolds.',
  },
  {
    question: 'Do permits affect garden suite financing?',
    answer:
      'Yes. Permit timing, municipal review, and servicing requirements can materially change both the budget and the timing of borrowing decisions.',
  },
  {
    question: 'What should homeowners confirm first?',
    answer:
      'Confirm lot fit, zoning or bylaw feasibility, likely servicing demands, realistic cost range, ownership horizon, and whether the long-term use logic is actually strong enough to support the financing.',
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

export default function GardenSuiteFinancingOntario() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#f4f7fb_34%,#f7f9fc_100%)]">
      <Helmet>
        <title>Garden Suite Financing in Ontario | OntarioReno</title>
        <meta
          name="description"
          content="Learn how Ontario homeowners can think about financing a garden suite, including HELOCs, refinancing, renovation financing, site feasibility, permits, servicing, and long-term value considerations."
        />
        <link
          rel="canonical"
          href="https://ontarioreno.ca/financing/garden-suite-financing-ontario"
        />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#f9fbfe_0%,#eef3f8_55%,#f6f8fb_100%)]">
        <div className="pointer-events-none absolute inset-0 opacity-45">
          <div className="absolute inset-x-0 top-0 h-44 bg-[radial-gradient(circle_at_18%_10%,rgba(96,165,250,0.18),transparent_30%),radial-gradient(circle_at_78%_16%,rgba(148,163,184,0.14),transparent_34%)]" />
          <div className="absolute inset-y-0 right-[10%] w-px bg-gradient-to-b from-transparent via-white/70 to-transparent" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />
        </div>

        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,0.98fr)_minmax(360px,0.86fr)] lg:items-center lg:gap-16 lg:px-8 lg:py-24">
          <div className="relative z-10">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-100/90 bg-white/80 px-4 py-2 text-sm font-medium text-[#1B3C6C] backdrop-blur-sm">
              <Compass className="h-4 w-4" />
              Ontario garden suite planning guide
            </div>

            <h1 className="mt-6 max-w-4xl text-[3.1rem] font-bold leading-[0.94] tracking-[-0.055em] text-slate-950 md:text-[5rem]">
              Garden Suite Financing in Ontario
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600 md:text-[1.35rem] md:leading-9">
              A garden suite is not just a financing decision. The project has to
              make sense on the lot, through the permit path, through servicing,
              and through the homeowner&apos;s long-term plan.
            </p>

            <div className="mt-11 flex flex-col gap-4 sm:flex-row">
              <Link to="/match" className={buttonStyles.primary}>
                Review My Garden Suite Project
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link to="/garden-suites" className={buttonStyles.secondary}>
                Explore Garden Suite Planning
              </Link>
            </div>
          </div>

          <div className="relative z-10">
            <div className="overflow-hidden rounded-[2.2rem] border border-white/60 bg-white/36 p-4 shadow-[0_35px_90px_rgba(15,23,42,0.15)] backdrop-blur-sm md:p-5">
              <div className="relative overflow-hidden rounded-[1.8rem]">
                  <img
                    src="/images/garden-suite.jpg"
                    alt="Architectural planning atmosphere for an Ontario backyard garden suite project"
                    className="aspect-[5/4] w-full object-cover"
                  />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.04)_0%,rgba(15,23,42,0.2)_58%,rgba(15,23,42,0.36)_100%)]" />
                <div className="absolute inset-x-6 bottom-6">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-white/72">
                    Site and suite planning
                  </p>
                  <p className="mt-2 max-w-[74%] text-base leading-7 text-white/92">
                    Garden suites are shaped as much by lot fit and servicing as
                    they are by financing.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between px-2 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
              <span>Backyard suite feasibility</span>
              <span>Ontario residential context</span>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
            Why financing planning matters
          </p>
          <h2 className="mt-5 max-w-3xl text-[2.35rem] font-bold leading-[1.04] tracking-[-0.04em] text-slate-950 md:text-[3.45rem]">
            Garden suites usually require serious financing planning before the build begins
          </h2>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {whyFinancingPlanningMatters.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-slate-400" />
                <p className="text-base leading-8 text-slate-600">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative bg-[linear-gradient(180deg,#f4f7fb_0%,#f7f9fc_100%)] py-24 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
            Financing paths homeowners may compare
          </p>
          <h2 className="mt-5 max-w-3xl text-[2.25rem] font-bold leading-[1.05] tracking-[-0.04em] text-slate-950 md:text-[3.2rem]">
            The borrowing path should follow the garden suite plan, not lead it
          </h2>

          <div className="mt-12 space-y-6">
            {financingPaths.map((item) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.title}
                  className="grid gap-5 border-t border-slate-200 pt-6 first:border-t-0 first:pt-0 lg:grid-cols-[80px_minmax(0,1fr)]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-[1.4rem] font-semibold tracking-[-0.03em] text-slate-950">
                      {item.title}
                    </h3>
                    <p className="mt-3 max-w-3xl text-base leading-8 text-slate-600">{item.body}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white py-24 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
                When a HELOC may fit
              </p>
              <h2 className="mt-5 max-w-2xl text-[2.2rem] font-bold leading-[1.05] tracking-[-0.04em] text-slate-950 md:text-[3.1rem]">
                Flexible equity access can suit a staged garden suite project
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
                When refinancing may fit better
              </p>
              <h2 className="mt-5 max-w-2xl text-[2.2rem] font-bold leading-[1.05] tracking-[-0.04em] text-slate-950 md:text-[3.1rem]">
                Larger garden suite budgets can justify a broader financing reset
              </h2>
              <ul className="mt-8 space-y-4 text-base leading-8 text-slate-600">
                {refinanceFitPoints.map((item) => (
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
            Site feasibility before financing
          </p>
          <h2 className="mt-5 max-w-4xl text-[2.45rem] font-bold leading-[1.02] tracking-[-0.045em] text-white md:text-[3.7rem]">
            Confirm the lot, servicing, and municipal path before you commit the financing
          </h2>

          <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="grid gap-4 sm:grid-cols-2">
              {siteFeasibilityPoints.map((item) => (
                <div key={item} className="border-t border-white/12 pt-4 first:border-t-0 first:pt-0">
                  <p className="text-base leading-8 text-slate-200">{item}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-white/12 pt-6 lg:border-t-0 lg:border-l lg:border-white/12 lg:pl-8 lg:pt-0">
              <p className="text-base leading-8 text-slate-300">
                A garden suite can look financeable long before it is genuinely
                buildable. That is why the project should connect back to{' '}
                <Link to="/garden-suites" className="font-medium text-blue-200 hover:underline">
                  garden suite planning
                </Link>
                , realistic{' '}
                <Link to="/costs" className="font-medium text-blue-200 hover:underline">
                  renovation costs
                </Link>
                , and a structured{' '}
                <Link to="/match" className="font-medium text-blue-200 hover:underline">
                  project review
                </Link>{' '}
                before the borrowing path is treated as settled.
              </p>
              <p className="mt-5 text-base leading-8 text-slate-300">
                If you are comparing a HELOC against a refinance, it is worth
                reading the broader{' '}
                <Link
                  to="/financing/home-equity-renovations-ontario"
                  className="font-medium text-blue-200 hover:underline"
                >
                  home equity guide
                </Link>{' '}
                and the more specific{' '}
                <Link
                  to="/financing/heloc-vs-refinance-for-renovations"
                  className="font-medium text-blue-200 hover:underline"
                >
                  HELOC vs refinance comparison
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,#ffffff_0%,#fbfcfd_100%)] py-24 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
            Ontario-specific planning considerations
          </p>
          <h2 className="mt-5 max-w-3xl text-[2.3rem] font-bold leading-[1.04] tracking-[-0.04em] text-slate-950 md:text-[3.35rem]">
            Municipal differences, servicing complexity, and build timelines all change the financing fit
          </h2>

          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            {ontarioConsiderations.map((item) => (
              <article key={item.title} className="border-t border-slate-200 pt-6 first:border-t-0 first:pt-0">
                <h3 className="text-[1.2rem] font-semibold tracking-[-0.03em] text-slate-950">
                  {item.title}
                </h3>
                <p className="mt-3 text-base leading-8 text-slate-600">{item.body}</p>
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
            Financing gets risky when the garden suite is treated like a simple backyard renovation
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
            Confirm the garden suite path before choosing the financing
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-600 md:text-[1.05rem]">
            Start with lot fit, servicing, design feasibility, and realistic costs before deciding
            whether a HELOC, refinance, renovation financing, or phased approach deserves to lead
            the project.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link to="/match" className={buttonStyles.primary}>
              Review My Garden Suite Project
            </Link>
            <Link
              to="/financing/home-equity-renovations-ontario"
              className={buttonStyles.secondary}
            >
              Read the Home Equity Guide
            </Link>
          </div>
          <p className="mt-5 text-sm leading-7 text-slate-500">
            For homeowners also comparing structured monthly-payment project
            options, review the{' '}
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
            Questions before financing a garden suite in Ontario
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
