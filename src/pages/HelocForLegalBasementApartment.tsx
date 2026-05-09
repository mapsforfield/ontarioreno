import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Compass, ShieldCheck } from 'lucide-react';
import { buttonStyles } from '../lib/uiStyles';

const homeEquityReasons = [
  'Separate entrances, kitchens, bathrooms, and code-driven upgrades often push the budget beyond a simple basement finish.',
  'Permit-heavy work can create staged construction costs that do not arrive all at once.',
  'Mechanical, electrical, plumbing, and life-safety changes can materially change the financing picture once the suite becomes real.',
  'A legal suite is often treated as a longer-term property decision, not just a quick cosmetic renovation.',
];

const legalSuiteDifferences = [
  'Permits and municipal review',
  'Fire separation and life-safety requirements',
  'Egress, window, and exit conditions',
  'Ceiling height and layout constraints',
  'HVAC, electrical, and plumbing rework',
  'Inspections and compliance sign-off',
];

const helocFitPoints = [
  'Phased spending can suit a suite project where permit timing and contractor sequencing do not happen in one clean draw.',
  'It can help homeowners retain the existing mortgage structure while still creating access to equity for the renovation.',
  'It may fit better when the suite plan is solid but the final construction sequence still has some timing uncertainty.',
  'It can support long-term rental flexibility when the project itself is already legally and financially credible.',
];

const cautionPoints = [
  'Relying entirely on future rent assumptions before the suite is actually feasible.',
  'Moving ahead while permit or layout feasibility is still unclear.',
  'Using home equity before the scope is defined enough to price responsibly.',
  'Treating a short ownership horizon like a long-term rental strategy.',
  'Underestimating code, compliance, and finishing costs that come with a real legal suite.',
];

const ontarioConsiderations = [
  {
    title: 'Realistic Ontario renovation costs matter early',
    body:
      'A legal basement apartment usually costs more than homeowners first expect, especially when structural, mechanical, fire-separation, and permit-related work become clearer.',
    links: [
      { label: 'basement renovation planning', href: '/basements' },
      { label: 'Ontario renovation costs', href: '/costs' },
    ],
  },
  {
    title: 'Municipal rules are not all identical',
    body:
      'Suite rules, permit timelines, and local interpretation can vary by municipality, which is why basement apartment financing should stay tied to actual project feasibility instead of assumptions.',
    links: [
      { label: 'project review', href: '/match' },
      { label: 'Hamilton grant guide', href: '/hamilton-grant-guide' },
    ],
  },
  {
    title: 'Grants can help, but only after the suite makes sense',
    body:
      'Incentives can reduce financing pressure on some secondary suite projects, but they should support a viable plan rather than create a false sense of feasibility.',
    links: [
      { label: 'grant eligibility calculator', href: '/grant-eligibility-calculator' },
      {
        label: 'using home equity for renovations',
        href: '/financing/home-equity-renovations-ontario',
      },
    ],
  },
];

const feasibilityFramework = [
  {
    question: 'Can the basement legally support a suite?',
    answer:
      'The suite needs to work on layout, exits, fire separation, servicing, and code obligations before financing becomes the real question.',
  },
  {
    question: 'Is the ownership horizon long enough?',
    answer:
      'A legal basement apartment usually makes more sense when the property will be held long enough for the project costs and long-term use to matter.',
  },
  {
    question: 'Is the project defined enough?',
    answer:
      'If the suite scope is still evolving, a HELOC can end up masking uncertainty instead of supporting an organized renovation plan.',
  },
  {
    question: 'Does the rental logic realistically support the investment?',
    answer:
      'Projected income should be realistic, not optimistic. The suite should still make sense when compliance costs, timing, and actual market conditions are taken seriously.',
  },
];

const commonMistakes = [
  'Financing before confirming legal feasibility and the likely permit path.',
  'Assuming every basement can become a legal apartment without major constraints.',
  'Ignoring the complexity of fire separation, egress, ceiling height, or servicing changes.',
  'Overbuilding beyond the property or neighborhood value logic.',
  'Treating projected rent as guaranteed before the suite is designed, permitted, and delivered.',
];

const faqItems = [
  {
    question: 'Can I use a HELOC for a basement apartment?',
    answer:
      'Yes. Many Ontario homeowners use a HELOC for a basement apartment project, but the suite should first make sense legally, structurally, and financially before home equity becomes part of the decision.',
  },
  {
    question: 'Is a HELOC better than refinancing for a basement suite?',
    answer:
      'Not automatically. A HELOC can suit phased work and flexible access to equity, while refinancing may be worth comparing on larger suite projects with a longer ownership horizon.',
  },
  {
    question: 'What makes a basement apartment legal in Ontario?',
    answer:
      'A legal basement apartment typically depends on permit approval, fire and life-safety requirements, layout conditions, exits or egress, mechanical systems, and municipal compliance standards.',
  },
  {
    question: 'Can rental income justify the renovation?',
    answer:
      'Sometimes, but projected rent should support a real plan rather than rescue a weak one. The suite still needs realistic costs, legal feasibility, and a credible ownership strategy.',
  },
  {
    question: 'What should I confirm before financing the suite?',
    answer:
      'Confirm the likely permit path, legal feasibility, layout, cost range, ownership horizon, and whether the rental logic remains strong after compliance costs are included.',
  },
  {
    question: 'Do permits affect basement apartment financing?',
    answer:
      'Yes. Permit requirements often change timing, cost, and scope assumptions, which is why they directly affect whether a HELOC or any other borrowing path actually fits the project.',
  },
  {
    question: 'Can grants reduce project pressure?',
    answer:
      'Sometimes. Grants and incentives can reduce financing pressure on some suite-related projects, but they are not guaranteed and do not replace the need for a viable basement plan.',
  },
  {
    question: 'What risks should homeowners understand first?',
    answer:
      'The main risks are unclear legal feasibility, underestimating compliance costs, overestimating rent, and using financing before the suite design and scope are stable enough to trust.',
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

export default function HelocForLegalBasementApartment() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#f4f7fb_34%,#f7f9fc_100%)]">
      <Helmet>
        <title>Using a HELOC for a Legal Basement Apartment in Ontario | OntarioReno</title>
        <meta
          name="description"
          content="Learn when a HELOC may make sense for a legal basement apartment project in Ontario, including permits, renovation costs, rental-income considerations, and renovation planning risks."
        />
        <link
          rel="canonical"
          href="https://ontarioreno.ca/financing/heloc-for-legal-basement-apartment"
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
              <ShieldCheck className="h-4 w-4" />
              Ontario legal suite planning guide
            </div>

            <h1 className="mt-6 max-w-4xl text-[3.1rem] font-bold leading-[0.94] tracking-[-0.055em] text-slate-950 md:text-[5rem]">
              Using a HELOC for a Legal Basement Apartment in Ontario
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600 md:text-[1.35rem] md:leading-9">
              The value of a basement apartment is not only the financing. The
              suite itself has to make sense legally, structurally, financially,
              and operationally before borrowing should follow it.
            </p>

            <div className="mt-11 flex flex-col gap-4 sm:flex-row">
              <Link to="/match" className={buttonStyles.primary}>
                Review My Basement Project
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link to="/costs" className={buttonStyles.secondary}>
                Explore Basement Renovation Costs
              </Link>
            </div>
          </div>

          <div className="relative z-10">
            <div className="overflow-hidden rounded-[2.2rem] border border-white/60 bg-white/36 p-4 shadow-[0_35px_90px_rgba(15,23,42,0.15)] backdrop-blur-sm md:p-5">
              <div className="relative overflow-hidden rounded-[1.8rem]">
                <img
                  src="/images/ontarioreno/modern-wide-angle-basement.jpg"
                  alt="Basement suite transformation atmosphere for Ontario renovation planning"
                  className="aspect-[5/4] w-full object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.04)_0%,rgba(15,23,42,0.2)_58%,rgba(15,23,42,0.36)_100%)]" />
                <div className="absolute inset-x-6 bottom-6">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-white/72">
                    Legal suite planning
                  </p>
                  <p className="mt-2 max-w-[70%] text-base leading-7 text-white/92">
                    Separate entrances, compliance work, and realistic renovation
                    costs change the financing decision.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between px-2 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
              <span>Basement suite feasibility</span>
              <span>Ontario project guidance</span>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
            Why homeowners use home equity
          </p>
          <h2 className="mt-5 max-w-3xl text-[2.35rem] font-bold leading-[1.04] tracking-[-0.04em] text-slate-950 md:text-[3.45rem]">
            Basement apartment projects are usually bigger than a normal basement renovation
          </h2>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {homeEquityReasons.map((item) => (
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
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
                Why legal suites are different
              </p>
              <h2 className="mt-5 max-w-3xl text-[2.25rem] font-bold leading-[1.05] tracking-[-0.04em] text-slate-950 md:text-[3.2rem]">
                A legal basement apartment is not just a finished basement with extra rent potential
              </h2>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 md:text-[1.02rem]">
                This is why renovation planning matters before financing decisions.
                Ontario suite projects can trigger compliance work, inspections, and
                layout changes that materially affect both cost and timing.
              </p>
            </div>

            <div className="rounded-[2rem] bg-white/76 px-6 py-7 ring-1 ring-slate-200/80 md:px-8 md:py-8">
              <div className="grid gap-4 sm:grid-cols-2">
                {legalSuiteDifferences.map((item) => (
                  <div key={item} className="border-t border-slate-200 pt-4 first:border-t-0 first:pt-0">
                    <p className="text-sm font-semibold leading-7 text-slate-800">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-24 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
                When a HELOC may fit well
              </p>
              <h2 className="mt-5 max-w-2xl text-[2.2rem] font-bold leading-[1.05] tracking-[-0.04em] text-slate-950 md:text-[3.1rem]">
                Flexible equity access can support staged suite progress
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

            <div className="bg-slate-950 px-6 py-8 text-white md:px-8 md:py-10">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-200">
                When caution is needed
              </p>
              <h2 className="mt-5 max-w-2xl text-[2.2rem] font-bold leading-[1.05] tracking-[-0.04em] text-white md:text-[3.1rem]">
                A suite can look attractive on paper before it is viable in reality
              </h2>
              <ul className="mt-8 space-y-4 text-base leading-8 text-slate-200">
                {cautionPoints.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-blue-200" />
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
            Ontario basement apartment planning considerations
          </p>
          <h2 className="mt-5 max-w-4xl text-[2.45rem] font-bold leading-[1.02] tracking-[-0.045em] text-white md:text-[3.7rem]">
            Permit variability, legal suite timelines, and real project costs still drive the financing pressure
          </h2>

          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            {ontarioConsiderations.map((item) => (
              <article key={item.title} className="border-t border-white/12 pt-6 first:pt-0 first:border-t-0">
                <h3 className="text-[1.2rem] font-semibold tracking-[-0.03em] text-white">
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
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
            Renovation-first feasibility framework
          </p>
          <h2 className="mt-5 max-w-3xl text-[2.3rem] font-bold leading-[1.04] tracking-[-0.04em] text-slate-950 md:text-[3.35rem]">
            Test the legal suite first, then decide whether the borrowing path belongs
          </h2>

          <div className="mt-12 space-y-8">
            {feasibilityFramework.map((item, index) => (
              <article
                key={item.question}
                className="grid gap-5 border-t border-slate-200 pt-6 first:border-t-0 first:pt-0 lg:grid-cols-[90px_minmax(0,1fr)]"
              >
                <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                  0{index + 1}
                </div>
                <div>
                  <h3 className="text-[1.45rem] font-semibold tracking-[-0.03em] text-slate-950">
                    {item.question}
                  </h3>
                  <p className="mt-3 max-w-3xl text-base leading-8 text-slate-600">
                    {item.answer}
                  </p>
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
            Basement apartment financing gets risky when feasibility is assumed instead of tested
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
            Confirm the basement plan before structuring the financing
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-600 md:text-[1.05rem]">
            Start with legal feasibility, realistic renovation costs, and ownership logic before
            using a HELOC or another borrowing path to support the suite.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link to="/match" className={buttonStyles.primary}>
              Review My Basement Project
            </Link>
            <Link to="/costs" className={buttonStyles.secondary}>
              Explore Renovation Costs
            </Link>
          </div>
          <p className="mt-5 text-sm leading-7 text-slate-500">
            If you want to compare this against more structured monthly-payment
            project options, review the{' '}
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
            Questions before using a HELOC on a legal basement apartment
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
