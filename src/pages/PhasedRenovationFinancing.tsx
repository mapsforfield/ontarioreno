import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Compass, Landmark, Layers3, Wrench } from 'lucide-react';
import { buttonStyles } from '../lib/uiStyles';

const whyPhasingMatters = [
  'It can create better cost control when the full renovation scope is not stable enough to fund all at once.',
  'It helps separate must-do work from finish upgrades so financing pressure stays tied to what actually matters first.',
  'It is especially useful on permit-heavy projects where feasibility, approvals, or compliance demands are still becoming clear.',
  'It can reduce uncertainty and prevent homeowners from over-borrowing before the real renovation path is understood.',
];

const whenPhasingFits = [
  'The project scope is still unfinished or evolving.',
  'A major basement renovation may later move toward a legal suite path.',
  'An addition or garden suite still needs stronger feasibility confirmation.',
  'The homeowner wants to reduce upfront financing pressure while keeping the project moving intelligently.',
  'Older homes may carry hidden structural, mechanical, or compliance scope that should be tested before the full vision is funded.',
];

const phaseFirstItems = [
  {
    title: 'Structural and safety work',
    body:
      'Start with anything that materially affects safety, structure, or the integrity of the renovation before investing in finishes.',
  },
  {
    title: 'Permit and compliance requirements',
    body:
      'Handle the work that determines legal feasibility, inspections, and approval order before treating the project like a cosmetic build.',
  },
  {
    title: 'Mechanical, electrical, and plumbing',
    body:
      'These systems often determine cost risk and layout logic, especially in older Ontario homes or secondary suite projects.',
  },
  {
    title: 'Layout-defining work',
    body:
      'Wall locations, access, ceiling conditions, and circulation paths should be clarified early because they shape everything that follows.',
  },
  {
    title: 'Rental or legal-suite requirements',
    body:
      'On projects that may become legal suites, the compliance-critical work should come before finish upgrades or softer wish-list items.',
  },
  {
    title: 'Finish upgrades later',
    body:
      'Once feasibility, permits, and core systems are stable, finish upgrades become easier to phase without distorting the whole financing plan.',
  },
];

const financingComparison = [
  {
    title: 'HELOC',
    icon: Compass,
    body:
      'A HELOC can support staged draws when the renovation is being sequenced in deliberate phases rather than funded as one final package.',
    href: '/financing/home-equity-renovations-ontario',
    linkText: 'Read the home equity guide',
  },
  {
    title: 'Refinance',
    icon: Landmark,
    body:
      'Refinancing can make more sense when the project is already fully defined, large enough to justify a broader borrowing reset, and less dependent on phased uncertainty.',
    href: '/financing/heloc-vs-refinance-for-renovations',
    linkText: 'Compare HELOC vs refinance',
  },
  {
    title: 'Renovation financing',
    icon: Wrench,
    body:
      'Renovation financing can suit cleaner, more defined scopes where structured payments matter more than flexible staging.',
    href: '/financing/heloc-vs-contractor-financing',
    linkText: 'Compare HELOC vs renovation financing',
  },
  {
    title: 'Phased approach',
    icon: Layers3,
    body:
      'Phasing may be the better answer when uncertainty, permit sequencing, and scope control matter more than funding the whole dream version immediately.',
    href: '/match',
    linkText: 'Review the project path',
  },
];

const ontarioScenarios = [
  {
    title: 'Legal basement apartments',
    body:
      'Phasing can help when the basement still needs legal-feasibility confirmation, code work, or compliance-driven upgrades before the suite plan should be fully financed.',
    href: '/legal-suites',
    linkText: 'See legal suite planning',
  },
  {
    title: 'Garden suites',
    body:
      'Backyard suites can benefit from phasing when lot fit, servicing, approvals, and overall budget logic are not yet stable enough for one full commitment.',
    href: '/garden-suites',
    linkText: 'See garden suite planning',
  },
  {
    title: 'Additions and whole-home renovations',
    body:
      'Larger renovations often hide structural, mechanical, or permit complexity that is easier to manage when the project is sequenced with discipline.',
    href: '/costs',
    linkText: 'Review renovation costs',
  },
  {
    title: 'Older homes with hidden scope',
    body:
      'Older Ontario homes can carry unknown structural, electrical, or plumbing issues that make phased decision-making more strategic than fully financing the dream version upfront.',
    href: '/basements',
    linkText: 'Review basement planning',
  },
];

const commonMistakes = [
  'Financing the entire dream version before feasibility is confirmed.',
  'Doing cosmetic work before permit-critical or compliance-critical work.',
  'Treating phasing like random delay instead of a deliberate strategy.',
  'Underestimating hidden mechanical, structural, or servicing scope.',
  'Ignoring inspections, permit order, and sequencing logic.',
  'Assuming a HELOC removes the need for disciplined renovation sequencing.',
];

const faqItems = [
  {
    question: 'What is phased renovation financing?',
    answer:
      'Phased renovation financing means sequencing the project so the most important or risk-sensitive work happens first, instead of borrowing for the entire renovation all at once.',
  },
  {
    question: 'When should I renovate in phases?',
    answer:
      'Phasing can make sense when the scope is still evolving, the project is permit-heavy, hidden issues are likely, or the homeowner wants to reduce upfront financing pressure while keeping the project moving.',
  },
  {
    question: 'Can a HELOC work for phased renovations?',
    answer:
      'Yes. A HELOC can work well for phased renovations because flexible access to equity can align with staged spending, but it still requires disciplined sequencing and cost control.',
  },
  {
    question: 'Is refinancing better for phased renovations?',
    answer:
      'Sometimes, but usually only when the project becomes fully defined and large enough to justify a broader borrowing reset. Refinancing is often less useful when major uncertainty still needs to be worked through.',
  },
  {
    question: 'What renovation work should come first?',
    answer:
      'Structural, safety, permit-critical, layout-defining, and mechanical work usually comes before finish upgrades because it shapes the real cost and feasibility of the project.',
  },
  {
    question: 'Does phasing help with legal basement apartments?',
    answer:
      'Often yes. Legal basement apartments can benefit from phasing because code, permit, and systems work may need to be clarified before the full suite vision should be financed.',
  },
  {
    question: 'Can phasing reduce financing risk?',
    answer:
      'Yes. Phasing can reduce financing risk by preventing homeowners from overcommitting capital before the renovation is stable enough to justify that level of borrowing.',
  },
  {
    question: 'Should I phase a garden suite project?',
    answer:
      'Sometimes. A garden suite may benefit from phasing when lot fit, servicing, municipal review, or design feasibility still needs stronger confirmation before the whole build is financed.',
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

export default function PhasedRenovationFinancing() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#f4f7fb_34%,#f7f9fc_100%)]">
      <Helmet>
        <title>Phased Renovation Financing in Ontario | OntarioReno</title>
        <meta
          name="description"
          content="Learn when phased renovation financing may make sense for Ontario homeowners, including staged project planning, permit-heavy renovations, HELOC use, renovation financing, and cost control."
        />
        <link
          rel="canonical"
          href="https://ontarioreno.ca/financing/phased-renovation-financing"
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
              <Layers3 className="h-4 w-4" />
              Ontario renovation sequencing guide
            </div>

            <h1 className="mt-6 max-w-4xl text-[3.1rem] font-bold leading-[0.94] tracking-[-0.055em] text-slate-950 md:text-[5rem]">
              Phased Renovation Financing in Ontario
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600 md:text-[1.35rem] md:leading-9">
              Sometimes the best financing decision is not borrowing more. It is
              sequencing the renovation better.
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
                  alt="Ontario renovation planning atmosphere focused on project sequencing"
                  className="aspect-[5/4] w-full object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.04)_0%,rgba(15,23,42,0.2)_58%,rgba(15,23,42,0.36)_100%)]" />
                <div className="absolute inset-x-6 bottom-6">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-white/72">
                    Strategic sequencing
                  </p>
                  <p className="mt-2 max-w-[74%] text-base leading-7 text-white/92">
                    Separate must-do work from finish upgrades before financing the whole vision.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between px-2 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
              <span>Permit-aware planning</span>
              <span>Ontario project discipline</span>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
            Why phased renovation planning matters
          </p>
          <h2 className="mt-5 max-w-3xl text-[2.35rem] font-bold leading-[1.04] tracking-[-0.04em] text-slate-950 md:text-[3.45rem]">
            Better sequencing can be a stronger decision than borrowing for everything at once
          </h2>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {whyPhasingMatters.map((item) => (
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
            When phased financing may make sense
          </p>
          <h2 className="mt-5 max-w-3xl text-[2.25rem] font-bold leading-[1.05] tracking-[-0.04em] text-slate-950 md:text-[3.2rem]">
            Phase the project when clarity is still catching up to the ambition
          </h2>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {whenPhasingFits.map((item) => (
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
            What to phase first
          </p>
          <h2 className="mt-5 max-w-3xl text-[2.3rem] font-bold leading-[1.04] tracking-[-0.04em] text-slate-950 md:text-[3.35rem]">
            Start with the work that defines feasibility, not the work that only finishes it
          </h2>

          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            {phaseFirstItems.map((item) => (
              <article key={item.title} className="border-t border-slate-200 pt-6 first:border-t-0 first:pt-0">
                <h3 className="text-[1.3rem] font-semibold tracking-[-0.03em] text-slate-950">
                  {item.title}
                </h3>
                <p className="mt-3 text-base leading-8 text-slate-600">{item.body}</p>
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
            Comparing the financing path
          </p>
          <h2 className="mt-5 max-w-4xl text-[2.45rem] font-bold leading-[1.02] tracking-[-0.045em] text-white md:text-[3.7rem]">
            Phasing changes how HELOCs, refinancing, and renovation financing should be judged
          </h2>

          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            {financingComparison.map((item) => {
              const Icon = item.icon;

              return (
                <article key={item.title} className="border-t border-white/12 pt-6 first:border-t-0 first:pt-0">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-white/12">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h3 className="text-[1.3rem] font-semibold tracking-[-0.03em] text-white">
                        {item.title}
                      </h3>
                      <p className="mt-3 text-base leading-8 text-slate-300">{item.body}</p>
                      <Link
                        to={item.href}
                        className="mt-4 inline-flex items-center text-sm font-semibold text-blue-200 hover:underline"
                      >
                        {item.linkText}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,#ffffff_0%,#fbfcfd_100%)] py-24 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
            Ontario renovation scenarios where phasing can help
          </p>
          <h2 className="mt-5 max-w-3xl text-[2.3rem] font-bold leading-[1.04] tracking-[-0.04em] text-slate-950 md:text-[3.35rem]">
            Permit-heavy and hidden-scope projects often benefit most from disciplined sequencing
          </h2>

          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            {ontarioScenarios.map((item) => (
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

      <section className="bg-[linear-gradient(180deg,#f5f8fc_0%,#edf2f7_100%)] py-24 lg:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
            Common mistakes
          </p>
          <h2 className="mt-5 max-w-3xl text-[2.2rem] font-bold leading-[1.04] tracking-[-0.04em] text-slate-950 md:text-[3.1rem]">
            Phasing only works when it is deliberate, not when it is accidental delay
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
            Sequence the renovation before you overcommit the financing
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-600 md:text-[1.05rem]">
            Decide what has to happen first, what needs permits or compliance work, and what can
            wait until the renovation is more stable before borrowing for the entire vision.
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
            If you also want the broader monthly-payment context, review the{' '}
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
            Questions before financing a renovation in phases
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
