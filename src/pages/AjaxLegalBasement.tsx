import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  Hammer,
  Home,
  ShieldCheck,
} from 'lucide-react';

const lastUpdated = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
}).format(new Date());

const requirementSteps = [
  {
    step: '01',
    title: "Confirm the basement's intended use",
    detail:
      'A legal basement in Ajax has to be planned as true code-compliant living space, not just a nicely finished lower level.',
  },
  {
    step: '02',
    title: 'Review local requirements early',
    detail:
      'Town of Ajax permit expectations can change how the project is structured long before construction starts.',
  },
  {
    step: '03',
    title: 'Prepare permit-ready drawings',
    detail:
      'Drawings usually need to show exits, room layout, fire separation, ventilation, plumbing, and the actual use of the unit.',
  },
  {
    step: '04',
    title: 'Submit for municipal review',
    detail:
      "A legal basement application is reviewed against the drawings and details provided, not just the homeowner's goal for the space.",
  },
  {
    step: '05',
    title: 'Respond to revision comments',
    detail:
      'If the Town asks for updates, complete revision responses matter more than fast but partial replies.',
  },
  {
    step: '06',
    title: 'Build and inspect',
    detail:
      'The approved design still needs to be built correctly and inspected before the unit can be relied on as planned.',
  },
];

const faqs = [
  {
    question: 'What makes a basement legal in Ajax?',
    answer:
      'It needs permit approval, code-compliant design, and a layout that satisfies Town of Ajax review for the intended use.',
  },
  {
    question: 'Is a legal basement the same as a legal second unit?',
    answer:
      'Not always, but that is what many homeowners mean. Once the basement is meant to work as an independent unit, the review path usually becomes more detailed.',
  },
  {
    question: 'Do layouts and retrofits matter more in Ajax legal basements?',
    answer:
      'They can. Older homes often need more careful planning around exits, service updates, and room layouts, while newer homes may start unfinished but still need full compliance once a unit is created.',
  },
  {
    question: 'Why does a legal basement cost more?',
    answer:
      'Costs rise because compliance, egress, fire separation, layout planning, and permit coordination all become more demanding.',
  },
  {
    question: 'Where should I start if I am comparing legality, cost, and permits?',
    answer:
      'Start by comparing the Ajax cost page, the Ajax permit page, and your intended use before asking contractors for final pricing.',
  },
];

export default function AjaxLegalBasement() {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>Legal Basement in Ajax | OntarioReno</title>
        <meta
          name="description"
          content="Learn what a legal basement in Ajax usually requires, how Town of Ajax permits affect the project, and what changes once a basement is planned as a second unit."
        />
        <link
          rel="canonical"
          href="https://ontarioreno.ca/legal-basement-ajax"
        />
      </Helmet>

      <section className="bg-slate-900 text-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-center lg:px-8 lg:py-24">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/15 px-4 py-2 text-sm font-medium text-blue-200 ring-1 ring-white/10">
              <Clock3 className="h-4 w-4" />
              Ajax legal basement guide
            </div>

            <h1 className="mt-6 text-4xl font-bold leading-tight md:text-6xl">
              Legal Basement in Ajax
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300 md:text-xl">
              A legal basement in Ajax usually requires more than a nice finish. It
              means permit approval, code-compliant design, and a layout that works
              under Town of Ajax review.
            </p>

            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400">
              This page explains what typically separates a finished basement from a
              legal one, and how cost, permits, varying layouts, and retrofit
              considerations start connecting once the space is meant to work
              independently.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                to="/match"
                className="inline-flex items-center justify-center rounded-xl bg-[#1B3C6C] px-7 py-4 text-base font-bold text-white transition hover:bg-blue-700"
              >
                Find the right contractor
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/basement-permit-ajax"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-7 py-4 text-base font-semibold text-white transition hover:bg-white/10"
              >
                Review Ajax permits
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-6 text-sm font-medium text-slate-300">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                Legal-suite focused
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                Town of Ajax relevant
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                Built for homeowner planning
              </span>
            </div>

            <p className="mt-6 text-sm text-slate-400">Last updated: {lastUpdated}</p>
          </div>

          <div className="flex items-center justify-center lg:justify-end lg:translate-y-4">
            <div className="relative w-full max-w-[500px] rounded-[2rem] bg-white/6 p-4 ring-1 ring-white/10">
              <div className="pointer-events-none absolute inset-6 rounded-[1.75rem] bg-black/10 blur-2xl" />
              <div className="relative">
                <div className="absolute left-4 top-4 z-10 rounded-full border border-white/15 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                  Typical Ajax Basement Finish
                </div>
                <img
                  src="/images/ontarioreno/ajax-basement-1.webp"
                  alt="Finished basement renovation in Ajax Ontario"
                  className="w-full max-w-[500px] rounded-[1.75rem] object-cover shadow-[0_32px_80px_rgba(15,23,42,0.14)]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">
              Quick answer: what does a legal basement usually require?
            </h2>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              The closer the basement gets to functioning as a true independent
              unit, the more the project depends on permits, code detail, and local
              review.
            </p>
            <ul className="mt-6 space-y-3 text-slate-700">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <span>
                  Comparing cost first? Use the{' '}
                  <Link
                    to="/basement-renovation-cost-ajax"
                    className="font-semibold text-slate-900 underline underline-offset-4"
                  >
                    Ajax basement cost page
                  </Link>
                  .
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <span>
                  Need permit clarity? Review{' '}
                  <Link
                    to="/basement-permit-ajax"
                    className="font-semibold text-slate-900 underline underline-offset-4"
                  >
                    basement permit Ajax
                  </Link>
                  .
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <span>
                  Still shaping the overall project? Start with{' '}
                  <Link
                    to="/basement-renovation-ajax"
                    className="font-semibold text-slate-900 underline underline-offset-4"
                  >
                    basement renovation Ajax
                  </Link>
                  .
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
          <div className="space-y-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-3xl font-bold text-slate-900">
                Finished basement vs legal basement in Ajax
              </h2>
              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-6">
                  <div className="flex items-center gap-3">
                    <Home className="h-6 w-6 text-slate-700" />
                    <h3 className="text-xl font-bold text-slate-900">Finished basement</h3>
                  </div>
                  <p className="mt-4 leading-7 text-slate-600">
                    A basement can work well for family use without meeting the
                    higher standard expected for a legal second unit.
                  </p>
                </div>
                <div className="rounded-2xl border border-[#1B3C6C]/20 bg-blue-50 p-6">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-6 w-6 text-[#1B3C6C]" />
                    <h3 className="text-xl font-bold text-slate-900">Legal basement</h3>
                  </div>
                  <p className="mt-4 leading-7 text-slate-700">
                    A legal basement usually needs fuller permit drawings, stronger
                    code detail, and clearer Town of Ajax review documentation.
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <img
                src="/images/ontarioreno/ajax-basement-2.webp"
                alt="Modern finished basement in Ajax Ontario"
                className="w-full object-cover"
              />
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-3xl font-bold text-slate-900">
                What legal basement planning usually includes
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                Most legal basement projects need permit-ready drawings, exit
                planning, fire separation detail, layout clarity, and a stronger
                review standard than a simple family-use basement. If pricing is
                your first concern, compare the{' '}
                <Link
                  to="/basement-renovation-cost-ajax"
                  className="font-semibold text-slate-900 underline underline-offset-4"
                >
                  basement renovation cost in Ajax
                </Link>{' '}
                page before assuming the numbers will match a standard finish.
              </p>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                If approvals are the next concern, the{' '}
                <Link
                  to="/basement-permit-ajax"
                  className="font-semibold text-slate-900 underline underline-offset-4"
                >
                  Ajax permit page
                </Link>{' '}
                explains where Town of Ajax review typically starts affecting the
                timeline.
              </p>
            </div>

            <div className="rounded-3xl border border-blue-200 bg-blue-50 p-8 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#1B3C6C]">
                Why scope matters
              </p>
              <h2 className="mt-3 text-3xl font-bold text-slate-900">
                A legal basement changes both cost and permit strategy
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-700">
                Many homeowners underestimate the jump from a standard basement
                finish to a rental-ready unit. The stronger the legal intent
                becomes, the more the project depends on correct drawings, layout
                planning, retrofit decisions, permit strategy, and the right
                contractor fit.
              </p>
              <div className="mt-6">
                <Link
                  to="/legal-suites"
                  className="inline-flex items-center justify-center rounded-[0.8rem] border border-slate-800 bg-[linear-gradient(180deg,#1f2937_0%,#0f172a_100%)] px-6 py-[0.95rem] text-base font-semibold tracking-[-0.015em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(15,23,42,0.05),0_14px_30px_rgba(15,23,42,0.18)] transition duration-200 hover:border-slate-700 hover:bg-[linear-gradient(180deg,#273244_0%,#111c31_100%)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_1px_2px_rgba(15,23,42,0.06),0_18px_36px_rgba(15,23,42,0.22)] active:bg-[linear-gradient(180deg,#111827_0%,#020617_100%)] active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
                >
                  Explore legal suites
                </Link>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <img
                src="/images/ontarioreno/ajax-signage.jpg"
                alt="Ajax Ontario city signage"
                className="w-full object-cover"
              />
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl bg-slate-900 p-8 text-white shadow-xl">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-200">
                <Hammer className="h-7 w-7" />
              </div>
              <h3 className="mt-6 text-2xl font-bold">
                Need help structuring the project properly?
              </h3>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                Legal basements move better when the scope, permit strategy, and
                contractor are aligned from the start.
              </p>
              <Link
                to="/match"
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[#1B3C6C] px-5 py-4 text-center font-bold text-white transition hover:bg-blue-700"
              >
                Start with contractor matching
              </Link>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-2xl font-bold text-slate-900">
                Ajax cluster
              </h3>
              <div className="mt-5 space-y-3 text-sm leading-7 text-slate-700">
                <Link
                  to="/basement-renovation-ajax"
                  className="block font-semibold underline underline-offset-4"
                >
                  Basement renovation Ajax
                </Link>
                <Link
                  to="/basement-renovation-cost-ajax"
                  className="block font-semibold underline underline-offset-4"
                >
                  Basement renovation cost Ajax
                </Link>
                <Link
                  to="/basement-permit-ajax"
                  className="block font-semibold underline underline-offset-4"
                >
                  Basement permit Ajax
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
              Legal basement breakdown, step by step
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Most legal basement projects in Ajax move through a similar approval
              sequence.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {requirementSteps.map((item) => (
              <div
                key={item.step}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
              >
                <div className="text-sm font-bold uppercase tracking-[0.2em] text-[#1B3C6C]">
                  Step {item.step}
                </div>
                <h3 className="mt-3 text-xl font-bold text-slate-900">{item.title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
              Frequently asked questions
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Direct answers about legal basement planning in Ajax.
            </p>
          </div>

          <div className="mt-10 space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div
                  key={faq.question}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  >
                    <span className="text-lg font-semibold text-slate-900">{faq.question}</span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-slate-500 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 leading-7 text-slate-600">{faq.answer}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-slate-900 py-20 text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold md:text-5xl">
            Plan legal basement work with the right assumptions
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Legal basements are permit-heavy projects. The right scope and team can
            prevent expensive corrections later.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              to="/match"
              className="inline-flex items-center justify-center rounded-xl bg-[#1B3C6C] px-8 py-4 text-base font-bold text-white transition hover:bg-blue-700"
            >
              Find the right team
            </Link>
            <Link
              to="/basement-permit-ajax"
              className="inline-flex items-center justify-center rounded-xl border border-white/20 px-8 py-4 text-base font-semibold text-white transition hover:bg-white/10"
            >
              Review permits
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}


