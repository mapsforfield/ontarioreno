import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Wallet,
  Wrench,
} from 'lucide-react';
import { buttonStyles } from '../lib/uiStyles';

const paymentExamples = [
  {
    title: 'Basement renovation',
    amount: '$420-$860/mo',
    context: 'Typical range for a $50K-$80K project',
    note: 'Illustrative example only',
    href: '/basements',
    linkText: 'Explore basement projects',
  },
  {
    title: 'Kitchen renovation',
    amount: '$280-$690/mo',
    context: 'Typical range for a mid-range kitchen project',
    note: 'Illustrative example only',
    href: '/kitchen-renovations',
    linkText: 'Explore kitchen projects',
  },
  {
    title: 'Bathroom renovation',
    amount: '$180-$420/mo',
    context: 'Typical range for a standard renovation scope',
    note: 'Illustrative example only',
    href: '/bathroom-renovations',
    linkText: 'Explore bathroom projects',
  },
];

const financeableProjects = [
  'Basement renovations',
  'Legal secondary suites',
  'Kitchens',
  'Bathrooms',
];

const oldThinkingPoints = [
  "What's the rate?",
  "What's the term?",
  'How long am I paying?',
  'This gets judged like a car loan',
];

const financingRealityPoints = [
  'Make the required monthly payment',
  'Pay extra anytime',
  'Extra goes toward principal',
  'Total cost depends heavily on how long the balance is carried',
];

const decisionShiftPoints = [
  'The project is judged by monthly fit, not just sticker price',
  'Basement income may help offset payment',
  'Faster paydown may become realistic',
  'The exit path can look very different than people assume',
];

const financingPillars = [
  {
    title: 'Control',
    body: 'Move forward without draining all your cash upfront.',
  },
  {
    title: 'Flexibility',
    body: 'Make the required payment, then push harder when it suits you.',
  },
  {
    title: 'Possibility',
    body: 'Judge the project by what works now, not just by the full sticker price.',
  },
];

export default function Financing() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>Ontario Renovation Financing | Monthly Payment Options | OntarioReno</title>
        <meta
          name="description"
          content="Explore monthly payment options for basement, kitchen, bathroom, and legal suite renovations in Ontario. Learn how renovation financing works and see example payment ranges."
        />
        <link rel="canonical" href="https://ontarioreno.ca/financing" />
      </Helmet>

      <section className="overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
        <div className="mx-auto grid max-w-7xl gap-16 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,1fr)_560px] lg:px-8 lg:py-28">
          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-[#1B3C6C]">
              <CreditCard className="h-4 w-4" />
              Ontario renovation financing
            </div>

            <h1 className="mt-7 max-w-2xl text-5xl font-bold tracking-[-0.04em] leading-[0.96] text-slate-900 md:text-7xl">
              Ontario Renovation Financing
            </h1>

            <p className="mt-7 max-w-xl text-xl leading-8 text-slate-600">
              See what monthly payments could look like for basement, kitchen,
              bathroom, and legal suite projects and get connected with the
              right contractor if it makes sense.
            </p>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-500">
              We help you understand your options first, then connect you with
              the right contractor if it makes sense.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                to="/match"
                className={buttonStyles.primary}
              >
                See My Options
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-7 py-4 text-base font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
              >
                How It Works
              </a>
            </div>
          </div>

          <div className="flex items-center justify-center lg:justify-end">
            <img
              src="/images/ontarioreno/modern-wide-angle-basement.jpg"
              alt="Finished basement renovation with an open layout and modern lighting"
              className="aspect-[5/4] w-full rounded-[2rem] object-cover shadow-[0_30px_80px_rgba(15,23,42,0.14)]"
            />
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
            Most homeowners don&apos;t pay for renovations upfront anymore
          </h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-600">
              Most renovations today are not paid upfront. They are structured
              into manageable monthly payments, which is one reason bigger
              projects often become possible sooner than homeowners expect,
              especially for <Link to="/basements" className="font-medium text-[#1B3C6C] hover:underline">basement renovation projects</Link>.
            </p>
          </div>
      </section>

      <section id="how-it-works" className="bg-white py-20">
        <div className="mx-auto grid max-w-[1380px] gap-14 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.22fr)_minmax(360px,0.78fr)] lg:items-center lg:gap-16 lg:px-8">
          <div className="max-w-none">
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
              How it works
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3 lg:gap-7">
              <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50/85 px-6 py-6 md:px-6 md:py-6">
                <div className="text-sm font-bold uppercase tracking-[0.18em] text-[#1B3C6C]">
                  Step 1
                </div>
                <h3 className="mt-3.5 text-[1.3rem] font-bold leading-snug text-slate-900">
                  Share what you are planning
                </h3>
                <p className="mt-2.5 text-slate-600 leading-6.5">
                  Tell us about your scope, budget range, and project type so you can start with the right context.
                </p>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50/85 px-6 py-6 md:px-6 md:py-6">
                <div className="text-sm font-bold uppercase tracking-[0.18em] text-[#1B3C6C]">
                  Step 2
                </div>
                <h3 className="mt-3.5 text-[1.3rem] font-bold leading-snug text-slate-900">
                  See possible monthly payment options
                </h3>
                <p className="mt-2.5 text-slate-600 leading-6.5">
                  Explore what monthly payment options could look like before deciding what feels workable.
                </p>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50/85 px-6 py-6 md:px-6 md:py-6">
                <div className="text-sm font-bold uppercase tracking-[0.18em] text-[#1B3C6C]">
                  Step 3
                </div>
                <h3 className="mt-3.5 text-[1.3rem] font-bold leading-snug text-slate-900">
                  Get connected with the right contractor
                </h3>
                <p className="mt-2.5 text-slate-600 leading-6.5">
                  Get connected with a contractor and plan that fit your budget.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center lg:justify-end">
            <img
              src="/images/ontarioreno/workspace-renovation-interior.jpg"
              alt="Renovation planning workspace and interior design setup"
              className="aspect-[5/4] w-full max-w-[460px] rounded-[2rem] object-cover shadow-[0_24px_60px_rgba(15,23,42,0.12)]"
            />
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
              Monthly payment examples
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              These Ontario renovation financing examples help homeowners think in monthly terms instead of total sticker shock.
            </p>
            <p className="mx-auto mt-2 max-w-3xl text-sm leading-7 text-slate-500">
              Illustrative scenarios only. Actual approval and terms depend on
              borrower profile, project scope, and lender review.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {paymentExamples.map((example) => (
              <div
                key={example.title}
                className="rounded-[2rem] border border-slate-200 bg-white px-8 py-7 shadow-[0_20px_40px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_56px_rgba(15,23,42,0.10)] md:px-9 md:py-8"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {example.title}
                </p>
                <p className="mt-4 text-[2.25rem] font-bold tracking-[-0.03em] leading-none text-slate-900 md:text-[2.5rem]">
                  {example.amount}
                </p>
                <p className="mt-4 text-sm leading-6 text-slate-700">
                  {example.context}
                </p>
                <p className="mt-3 text-xs leading-6 text-slate-500">
                  {example.note}
                </p>
                <Link
                  to={example.href}
                  className="mt-4 inline-flex items-center text-sm font-semibold text-[#1B3C6C] hover:underline"
                >
                  {example.linkText}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2.25rem] border border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_42%,#f8fafc_100%)] p-8 shadow-[0_28px_80px_rgba(15,23,42,0.06)] md:p-12 lg:p-14">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_62%)]" />
            <div className="relative max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
                Financing mindset
              </p>
              <h2 className="mt-4 max-w-4xl text-3xl font-bold tracking-[-0.03em] text-slate-900 md:text-5xl">
                How renovation financing works
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                Most people look at home renovation financing in Ontario like a car loan or mortgage. That is where the misunderstanding starts.
              </p>
            </div>

            <div className="relative mt-12 lg:mt-14">
              <div className="pointer-events-none absolute inset-x-[13%] top-[43%] hidden lg:block">
                <div className="relative h-24">
                  <div className="absolute left-0 top-10 h-px w-[31%] bg-gradient-to-r from-transparent via-slate-300 to-slate-300" />
                  <div className="absolute left-[30%] top-[2.1rem] w-[12%]">
                    <div className="h-px bg-gradient-to-r from-slate-300 to-blue-300/70" />
                    <div className="mt-1 h-px translate-x-4 bg-gradient-to-r from-transparent via-slate-200 to-blue-200/60" />
                  </div>
                  <div className="absolute left-[43.5%] top-[1.55rem] flex h-9 w-9 items-center justify-center rounded-full border border-blue-200/70 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
                    <span className="text-sm font-semibold text-[#1B3C6C]">1</span>
                  </div>
                  <div className="absolute right-[43.5%] top-[1.55rem] flex h-9 w-9 items-center justify-center rounded-full border border-blue-200/70 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
                    <span className="text-sm font-semibold text-[#1B3C6C]">2</span>
                  </div>
                  <div className="absolute right-[30%] top-[2.1rem] w-[12%]">
                    <div className="h-px bg-gradient-to-r from-blue-300/70 to-slate-300" />
                    <div className="mt-1 h-px -translate-x-4 bg-gradient-to-r from-blue-200/60 via-slate-200 to-transparent" />
                  </div>
                  <div className="absolute right-0 top-10 h-px w-[31%] bg-gradient-to-r from-slate-300 via-slate-300 to-transparent" />
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[0.82fr_1.36fr_0.88fr] lg:items-center">
                <div className="relative lg:pr-4">
                  <div className="max-w-xs rounded-[1.75rem] bg-white/35 p-6 backdrop-blur-[1px] md:p-7">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Old thinking
                    </p>
                    <ul className="mt-6 space-y-4 text-base leading-7 text-slate-500">
                      {oldThinkingPoints.map((point) => (
                        <li key={point} className="flex items-start gap-3">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="relative lg:z-10 lg:-mx-2">
                  <div className="absolute -inset-x-4 -inset-y-5 rounded-[2.5rem] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.10),transparent_68%)] blur-2xl" />
                  <div className="relative rounded-[2.15rem] border border-slate-900/10 bg-slate-900 px-7 py-8 text-white shadow-[0_36px_100px_rgba(15,23,42,0.22)] ring-1 ring-blue-200/20 md:px-10 md:py-10">
                    <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/65 to-transparent" />
                    <div className="absolute inset-0 rounded-[2.15rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]" />
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">
                      The shift
                    </p>
                    <h3 className="mt-4 max-w-lg text-2xl font-bold leading-tight tracking-[-0.02em] text-white md:text-[2rem]">
                      How open-loan financing actually works
                    </h3>

                    <div className="mt-7 space-y-4">
                      {financingRealityPoints.map((point, index) => (
                        <div
                          key={point}
                          className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                        >
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-400/15 text-sm font-semibold text-blue-200">
                            {index + 1}
                          </div>
                          <p className="text-base leading-7 text-slate-200">{point}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="relative lg:pl-3">
                  <div className="max-w-sm rounded-[1.75rem] bg-white/70 px-6 py-6 backdrop-blur-[1px] md:px-7 md:py-7">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
                      Why this changes the decision
                    </p>
                    <ul className="mt-5 space-y-3.5 text-base leading-7 text-slate-700">
                      {decisionShiftPoints.map((point) => (
                        <li key={point} className="flex items-start gap-3">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1B3C6C]" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative mt-5 border-t border-slate-200/70 pt-5">
              <div className="grid gap-5 lg:grid-cols-[1.55fr_1fr] lg:items-start">
                <div className="rounded-[1.5rem] bg-white/70 px-6 py-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)] backdrop-blur-[1px] md:px-7">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1B3C6C]">
                    This is where most homeowners misunderstand financing.
                  </p>
                  <p className="text-base font-medium leading-7 text-slate-700">
                    Open-loan financing changes the conversation. The minimum payment is only the starting point, extra payments can reduce principal sooner, and basement income may create a very different exit path than most homeowners assume.
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Financing may be available through established providers such as Financeit, depending on the contractor and project.
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    If you want a deeper breakdown of payment flexibility, no-prepayment-penalty structure, and smarter payoff planning, see our{' '}
                    <Link to="/open-loan-financing" className="font-medium text-[#1B3C6C] hover:underline">
                      open loan financing guide
                    </Link>
                    .
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    It also helps to compare monthly payments against overall{' '}
                    <Link to="/costs" className="font-medium text-[#1B3C6C] hover:underline">
                      renovation costs
                    </Link>{' '}
                    before deciding what feels realistic.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 lg:gap-3">
                  {financingPillars.map((pillar) => (
                    <div
                      key={pillar.title}
                      className="border-l border-slate-200 pl-4 sm:border-l-0 sm:border-t sm:pt-4 lg:border-l lg:border-t-0 lg:pt-0"
                    >
                      <p className="text-base font-semibold text-slate-900">{pillar.title}</p>
                      <p className="mt-2 text-sm leading-7 text-slate-600">{pillar.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="mx-auto grid max-w-7xl gap-16 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_500px] lg:px-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
              What can be financed
            </h2>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
              Financing can make projects like these possible sooner and feel more manageable than most homeowners expect.
            </p>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              It can be a practical way to balance project scope, monthly affordability, and timing without feeling forced into an all-cash decision, whether you are planning <Link to="/basements" className="font-medium text-[#1B3C6C] hover:underline">basement renovations</Link>, <Link to="/kitchen-renovations" className="font-medium text-[#1B3C6C] hover:underline">kitchen renovations</Link>, or <Link to="/bathroom-renovations" className="font-medium text-[#1B3C6C] hover:underline">bathroom renovations</Link>.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {financeableProjects.map((project) => (
                <div key={project} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <p className="text-base font-medium text-slate-800">
                    {project === 'Basement renovations' && (
                      <Link to="/basements" className="hover:underline">
                        {project}
                      </Link>
                    )}
                    {project === 'Legal secondary suites' && (
                      <Link to="/legal-suites" className="hover:underline">
                        {project}
                      </Link>
                    )}
                    {project === 'Kitchens' && (
                      <Link to="/kitchen-renovations" className="hover:underline">
                        kitchen renovations
                      </Link>
                    )}
                    {project === 'Bathrooms' && (
                      <Link to="/bathroom-renovations" className="hover:underline">
                        bathroom renovations
                      </Link>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center">
            <img
              src="/images/ontarioreno/unfinished-basement-framing.jpg"
              alt="Framed basement space during an early stage home renovation"
              className="aspect-[4/3] w-full rounded-[2rem] object-cover shadow-[0_24px_60px_rgba(15,23,42,0.12)]"
            />
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-8 shadow-[0_18px_50px_rgba(15,23,42,0.05)] md:p-10">
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
              Common financing questions
            </h2>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              <div className="rounded-[1.5rem] bg-white p-6 ring-1 ring-slate-200">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#1B3C6C]">
                  <Wallet className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-xl font-bold text-slate-900">
                  Do I need full cash upfront?
                </h3>
                <p className="mt-3 text-slate-600 leading-7">
                  No - you do not always need the full renovation cost in cash upfront, and many homeowners use monthly-payment financing instead.
                </p>
              </div>

              <div className="rounded-[1.5rem] bg-white p-6 ring-1 ring-slate-200">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#1B3C6C]">
                  <CreditCard className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-xl font-bold text-slate-900">
                  Can I explore options first?
                </h3>
                <p className="mt-3 text-slate-600 leading-7">
                  Yes. The goal is to understand possible options before committing, not to force a project into the wrong structure.
                </p>
              </div>

              <div className="rounded-[1.5rem] bg-white p-6 ring-1 ring-slate-200">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#1B3C6C]">
                  <Wrench className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-xl font-bold text-slate-900">
                  Can projects be structured around a budget?
                </h3>
                <p className="mt-3 text-slate-600 leading-7">
                  Often, yes. Scope, priorities, and project timing can usually be discussed with budget reality in mind.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-24 text-white">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(30,41,59,0.55)_0%,rgba(15,23,42,0.85)_100%)] px-8 py-12 shadow-[0_24px_70px_rgba(0,0,0,0.25)] md:px-12 md:py-14">
            <h2 className="text-3xl font-bold tracking-[-0.03em] md:text-5xl">
              Don&apos;t rule your renovation out before seeing what your monthly payment could look like
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300">
              Monthly payment options can make a basement, kitchen, bathroom, or legal suite project feel more manageable without forcing a rushed decision.
            </p>
            <div className="mt-10">
              <Link
                to="/match"
                className={buttonStyles.primary}
              >
                Check My Monthly Payment
              </Link>
              <p className="mt-4 text-sm leading-6 text-slate-400">
                Takes less than a minute - No obligation
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


