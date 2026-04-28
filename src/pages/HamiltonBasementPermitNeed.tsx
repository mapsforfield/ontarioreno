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

const timelineSteps = [
  {
    step: '01',
    title: 'Define the basement scope',
    detail:
      'The first question is what work is actually being done: finishing, bathroom additions, kitchen additions, layout changes, or a legal suite conversion.',
  },
  {
    step: '02',
    title: 'Check permit triggers',
    detail:
      'Structural work, plumbing, electrical changes, new rooms, and legal-suite work commonly trigger permits.',
  },
  {
    step: '03',
    title: 'Prepare drawings',
    detail:
      'If a permit is required, the project usually needs permit-ready drawings and a clear scope before submission.',
  },
  {
    step: '04',
    title: 'Submit to Hamilton',
    detail:
      'Your application package is sent through the City of Hamilton building permit process for review.',
  },
  {
    step: '05',
    title: 'Address revisions',
    detail:
      'If reviewers ask for corrections or clarification, the file may slow down until complete updates are returned.',
  },
  {
    step: '06',
    title: 'Build after permit issuance',
    detail:
      'If a permit was required, construction should begin only after the permit is issued and inspections are scheduled as needed.',
  },
];

const faqs = [
  {
    question: 'Do I need a permit to finish a basement in Hamilton?',
    answer:
      'Usually yes if you are adding walls, changing plumbing, doing electrical work, or creating new rooms. A simple cosmetic refresh is different from a real basement renovation.',
  },
  {
    question: 'Do I need a permit for a basement bathroom in Hamilton?',
    answer:
      'In most cases, yes. Plumbing work is one of the clearest basement permit Hamilton triggers.',
  },
  {
    question: 'Is a legal basement apartment treated differently?',
    answer:
      'Yes. A legal secondary suite or basement apartment needs a more detailed permit review and stricter code compliance.',
  },
  {
    question: 'What if the basement was finished before I bought the house?',
    answer:
      'You still need to confirm whether the work was permitted and compliant. Existing finished space is not the same as approved space.',
  },
  {
    question: 'What causes the biggest permit delays?',
    answer:
      'Unclear scope, weak drawings, zoning questions, and slow revision responses cause most delays.',
  },
  {
    question: 'What happens if the City asks for revisions or corrections?',
    answer:
      'Revisions are common. The timeline depends on how quickly complete fixes are prepared and sent back.',
  },
];

export default function HamiltonBasementPermitNeed() {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  return (
    <div className="bg-slate-50 min-h-screen">
      <Helmet>
        <title>Do You Need a Permit for a Basement in Hamilton? | OntarioReno</title>
        <meta
          name="description"
          content="Learn when a basement permit is required in Hamilton, which basement projects trigger permits, and how to avoid delays if you are finishing a basement or planning a legal suite."
        />
        <link
          rel="canonical"
          href="https://ontarioreno.ca/do-you-need-a-permit-for-a-basement-in-hamilton"
        />
      </Helmet>

      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/15 px-4 py-2 text-sm font-medium text-blue-200 ring-1 ring-white/10">
              <Clock3 className="h-4 w-4" />
              Hamilton basement permit guide
            </div>

            <h1 className="mt-6 text-4xl font-bold leading-tight md:text-6xl">
              Do You Need a Permit for a Basement in Hamilton?
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300 md:text-xl">
              In most cases, yes. If you are finishing a basement in Hamilton and
              adding walls, plumbing, electrical, or creating a legal basement unit,
              a permit is usually required.
            </p>

            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400">
              This guide explains the basement permit Hamilton homeowners usually
              need, what work commonly triggers permits, and how permit scope affects
              timing and project risk.
            </p>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
              This guide is part of our Hamilton basement permit series covering timelines, requirements, and how to avoid delays.
            </p>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
              Based on City of Hamilton building permit review timelines and typical
              residential project experience.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                to="/match"
                className="inline-flex items-center justify-center rounded-xl bg-[#1B3C6C] px-7 py-4 text-base font-bold text-white transition hover:bg-blue-700"
              >
                Check if your project qualifies and avoid permit delays
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/hamilton-grant-guide"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-7 py-4 text-base font-semibold text-white transition hover:bg-white/10"
              >
                Read the Hamilton Grant Guide
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-6 text-sm font-medium text-slate-300">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                Basement finishing focused
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                Hamilton-specific
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                Built for homeowners planning ahead
              </span>
            </div>

            <p className="mt-6 text-sm text-slate-400">Last updated: {lastUpdated}</p>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">
              Quick answer: when is a permit usually needed?
            </h2>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              The bigger the scope, the more likely the project needs a permit.
            </p>
            <ul className="mt-6 space-y-3 text-slate-700">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <span>Simple basement finishing: often needs a permit if walls, rooms, or services are being changed.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <span>Legal secondary suite: almost always requires a permit and a fuller review.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <span>Projects requiring zoning review: can take longer if use, layout, or property conditions raise questions.</span>
              </li>
            </ul>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Simple basement finishing
                </p>
                <p className="mt-3 text-2xl font-bold text-slate-900">Permit often required</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  A basement permit Hamilton project is common when the work goes beyond cosmetic updates.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Legal secondary suite
                </p>
                <p className="mt-3 text-2xl font-bold text-slate-900">Permit expected</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  A legal basement permit Ontario project requires more review because it is being treated as a dwelling unit.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Zoning review
                </p>
                <p className="mt-3 text-2xl font-bold text-slate-900">May extend timing</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  If zoning questions come up, the Hamilton building permit timeline can become longer than expected.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 md:grid-cols-3 lg:px-8">
          <div className="rounded-2xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Most common trigger</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">Plumbing or layout changes</p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Higher-risk projects</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">Legal basement units</p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Best next step</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">Confirm scope before building</p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
          <div className="space-y-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-3xl font-bold text-slate-900">
                Direct answer: what work usually needs a permit?
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                If you are just painting or replacing finishes, the answer may be no.
                If you are changing layout, adding plumbing, upgrading electrical,
                building bedrooms, or creating a rental-ready unit, the answer is
                usually yes. If you also want to understand{' '}
                <Link
                  to="/hamilton-building-permit-timeline"
                  className="font-semibold text-slate-900 underline underline-offset-4"
                >
                  how long building permits take in Hamilton
                </Link>
                , the next question is how cleanly the file gets prepared.
              </p>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                If your basement plan is tied to income potential or grant planning,
                review the{' '}
                <Link
                  to="/hamilton-grant-guide"
                  className="font-semibold text-slate-900 underline underline-offset-4"
                >
                  Hamilton grant guide
                </Link>{' '}
                early so permit requirements and project economics stay aligned.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-3xl font-bold text-slate-900">
                Basement finishing vs legal suite permit requirements
              </h2>
              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-6">
                  <div className="flex items-center gap-3">
                    <Home className="h-6 w-6 text-slate-700" />
                    <h3 className="text-xl font-bold text-slate-900">Standard basement finishing</h3>
                  </div>
                  <p className="mt-4 text-slate-600 leading-7">
                    Many homeowners assume a permit is optional. In reality, finished basements often still trigger permits because walls, rooms, plumbing, or electrical are being changed.
                    If you want help avoiding the wrong assumptions early, it often
                    makes sense to start with{' '}
                    <Link
                      to="/match"
                      className="font-semibold text-slate-900 underline underline-offset-4"
                    >
                      OntarioReno&apos;s project review
                    </Link>
                    .
                  </p>
                </div>
                <div className="rounded-2xl border border-[#1B3C6C]/20 bg-blue-50 p-6">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-6 w-6 text-[#1B3C6C]" />
                    <h3 className="text-xl font-bold text-slate-900">Legal basement apartment</h3>
                  </div>
                  <p className="mt-4 text-slate-700 leading-7">
                    A legal basement permit Ontario project has a much clearer permit path because the work is more complex and the code standard is higher.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-3xl font-bold text-slate-900">
                What usually happens in the permit process
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                The Hamilton building permit timeline still matters even on a page
                about permit need. Once the scope clearly triggers a permit, the next
                question becomes how cleanly the file is prepared and submitted. That
                usually leads directly into{' '}
                <Link
                  to="/how-to-avoid-building-permit-delays-in-hamilton"
                  className="font-semibold text-slate-900 underline underline-offset-4"
                >
                  what causes permit delays
                </Link>
                .
              </p>
            </div>

            <div className="rounded-3xl border border-blue-200 bg-blue-50 p-8 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#1B3C6C]">
                Why projects stall
              </p>
              <h2 className="mt-3 text-3xl font-bold text-slate-900">
                Most delays happen before submission
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-700">
                The biggest setbacks usually come from weak drawings, unclear scope,
                and permit questions that should have been resolved before the file
                reached the City. If you want help lining up the right team, start
                with{' '}
                <Link
                  to="/match"
                  className="font-semibold text-slate-900 underline underline-offset-4"
                >
                  OntarioReno&apos;s project review
                </Link>
                .
              </p>
              <div className="mt-6">
                <Link
                  to="/match"
                  className="inline-flex items-center justify-center rounded-[0.8rem] border border-slate-800 bg-[linear-gradient(180deg,#1f2937_0%,#0f172a_100%)] px-6 py-[0.95rem] text-base font-semibold tracking-[-0.015em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(15,23,42,0.05),0_14px_30px_rgba(15,23,42,0.18)] transition duration-200 hover:border-slate-700 hover:bg-[linear-gradient(180deg,#273244_0%,#111c31_100%)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_1px_2px_rgba(15,23,42,0.06),0_18px_36px_rgba(15,23,42,0.22)] active:bg-[linear-gradient(180deg,#111827_0%,#020617_100%)] active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
                >
                  Check if your project qualifies and avoid permit delays
                </Link>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl bg-slate-900 p-8 text-white shadow-xl">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-200">
                <Hammer className="h-7 w-7" />
              </div>
              <h3 className="mt-6 text-2xl font-bold">Need help with permit-ready planning?</h3>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                Basement projects move better when the scope, drawings, and contractor are aligned early.
              </p>
              <Link
                to="/match"
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[#1B3C6C] px-5 py-4 text-center font-bold text-white transition hover:bg-blue-700"
              >
                Start Project Review
              </Link>
            </div>

            <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-8 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-200/70 text-yellow-900">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-2xl font-bold text-slate-900">Researching the Hamilton grant too?</h3>
              <p className="mt-4 text-sm leading-7 text-slate-700">
                If your basement could become a legal suite, funding and permit strategy should be reviewed together.
              </p>
              <Link
                to="/hamilton-grant-guide"
                className="mt-6 inline-flex font-semibold text-slate-900 underline underline-offset-4"
              >
                Read the Hamilton Grant Guide
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
              Permit breakdown, step by step
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Once the scope clearly requires a permit, most Hamilton basement projects follow the same sequence.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {timelineSteps.map((item) => (
              <div
                key={item.step}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
              >
                <div className="text-sm font-bold uppercase tracking-[0.2em] text-[#1B3C6C]">
                  Step {item.step}
                </div>
                <h3 className="mt-3 text-xl font-bold text-slate-900">{item.title}</h3>
                <p className="mt-3 text-slate-600 leading-7">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 md:p-10">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                Next step
              </p>
              <h2 className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl">
                Want help confirming permit scope before you build?
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                If you are ready to move forward, go to{' '}
                <Link to="/match" className="font-semibold text-slate-900 underline underline-offset-4">
                  /match
                </Link>
                . If you are evaluating a legal basement unit, also review{' '}
                <Link
                  to="/hamilton-grant-guide"
                  className="font-semibold text-slate-900 underline underline-offset-4"
                >
                  /hamilton-grant-guide
                </Link>
                .
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                to="/match"
                className="inline-flex items-center justify-center rounded-[0.8rem] border border-slate-800 bg-[linear-gradient(180deg,#1f2937_0%,#0f172a_100%)] px-7 py-[0.95rem] text-base font-semibold tracking-[-0.015em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(15,23,42,0.05),0_14px_30px_rgba(15,23,42,0.18)] transition duration-200 hover:border-slate-700 hover:bg-[linear-gradient(180deg,#273244_0%,#111c31_100%)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_1px_2px_rgba(15,23,42,0.06),0_18px_36px_rgba(15,23,42,0.22)] active:bg-[linear-gradient(180deg,#111827_0%,#020617_100%)] active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
              >
                Go to /match
              </Link>
              <Link
                to="/hamilton-grant-guide"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-7 py-4 text-base font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                Go to /hamilton-grant-guide
              </Link>
            </div>
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
              Direct answers for Hamilton homeowners planning basement work.
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
                  {isOpen && <div className="px-6 pb-6 text-slate-600 leading-7">{faq.answer}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-slate-900 py-20 text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold md:text-5xl">
            Confirm permit requirements before construction starts
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            The right scope and the right team can prevent expensive basement permit mistakes later.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              to="/match"
              className="inline-flex items-center justify-center rounded-xl bg-[#1B3C6C] px-8 py-4 text-base font-bold text-white transition hover:bg-blue-700"
            >
              Find the Right Team
            </Link>
            <Link
              to="/hamilton-grant-guide"
              className="inline-flex items-center justify-center rounded-xl border border-white/20 px-8 py-4 text-base font-semibold text-white transition hover:bg-white/10"
            >
              Explore Grant Eligibility
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
