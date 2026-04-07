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

const delaySteps = [
  {
    step: '01',
    title: 'Clarify the real project scope',
    detail:
      'Permit delays start early when the homeowner, designer, and contractor are not aligned on exactly what is being built.',
  },
  {
    step: '02',
    title: 'Prepare complete drawings',
    detail:
      'Weak drawings create avoidable review comments and are one of the biggest reasons the Hamilton building permit timeline gets stretched.',
  },
  {
    step: '03',
    title: 'Catch zoning issues early',
    detail:
      'If zoning concerns are discovered late, the permit path can slow down significantly.',
  },
  {
    step: '04',
    title: 'Submit a clean application',
    detail:
      'A complete package gives the City a better chance to review the file efficiently the first time.',
  },
  {
    step: '05',
    title: 'Respond quickly to comments',
    detail:
      'If revisions come back, complete responses matter more than fast but partial replies.',
  },
  {
    step: '06',
    title: 'Keep construction aligned with approvals',
    detail:
      'Changes made after permit issuance can create new delays if they affect the approved scope.',
  },
];

const faqs = [
  {
    question: 'What causes most permit delays in Hamilton?',
    answer:
      'Incomplete drawings, unclear scope, zoning issues, and slow revision responses cause most delays.',
  },
  {
    question: 'Do legal basement units get delayed more often?',
    answer:
      'Usually yes. A legal basement permit Ontario project has more compliance details, which creates more opportunities for comments.',
  },
  {
    question: 'Can a contractor help reduce permit delays?',
    answer:
      'Yes, if the contractor or designer regularly handles permit-heavy basement and legal suite work.',
  },
  {
    question: 'Does zoning review slow everything down?',
    answer:
      'It can. If zoning questions appear, the Hamilton building permit timeline often extends beyond the typical range.',
  },
  {
    question: 'What should I do if revisions are requested?',
    answer:
      'Respond with complete fixes, not partial answers. That is one of the best ways to protect momentum.',
  },
  {
    question: 'Can I start building while revisions are outstanding?',
    answer:
      'No. Wait until permit approvals are complete and the issued drawings match the work you plan to build.',
  },
];

export default function HamiltonPermitDelayAvoidance() {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  return (
    <div className="bg-slate-50 min-h-screen">
      <Helmet>
        <title>How to Avoid Building Permit Delays in Hamilton | OntarioReno</title>
        <meta
          name="description"
          content="Learn how to avoid building permit delays in Hamilton for basement and legal suite projects by improving scope, drawings, submission quality, and revision turnaround."
        />
        <link
          rel="canonical"
          href="https://ontarioreno.ca/how-to-avoid-building-permit-delays-in-hamilton"
        />
      </Helmet>

      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/15 px-4 py-2 text-sm font-medium text-blue-200 ring-1 ring-white/10">
              <Clock3 className="h-4 w-4" />
              Hamilton permit delay guide
            </div>

            <h1 className="mt-6 text-4xl font-bold leading-tight md:text-6xl">
              How to Avoid Building Permit Delays in Hamilton
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300 md:text-xl">
              Most Hamilton permit delays come from preventable issues before the file is even submitted, especially weak drawings, unclear scope, zoning surprises, and slow revisions.
            </p>

            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400">
              This Hamilton building permit timeline guide focuses on what actually
              slows basement permit Hamilton and legal basement permit Ontario files
              down, and what homeowners can do earlier to avoid that friction.
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
                Delay-prevention focused
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                Basement and legal-suite relevant
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                Practical homeowner guidance
              </span>
            </div>

            <p className="mt-6 text-sm text-slate-400">Last updated: April 2026</p>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">
              Quick answer: what reduces permit delays?
            </h2>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              Clean scope, permit-ready drawings, and fast revision handling do more to protect timelines than most homeowners expect.
            </p>
            <ul className="mt-6 space-y-3 text-slate-700">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <span>Simple basement finishing: delays are often avoidable if the file is complete from the start.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <span>Legal secondary suite: more review means stronger drawings and better coordination matter even more.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <span>Projects requiring zoning review: early checks can prevent the worst delays later.</span>
              </li>
            </ul>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Simple basement finishing</p>
                <p className="mt-3 text-2xl font-bold text-slate-900">Clean files move better</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Basement permit Hamilton delays usually start when the scope and drawings are vague.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Legal secondary suite</p>
                <p className="mt-3 text-2xl font-bold text-slate-900">More detail required</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  A legal basement permit Ontario project needs stronger planning because the review standard is higher.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Zoning review</p>
                <p className="mt-3 text-2xl font-bold text-slate-900">Check early</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Early zoning questions are often easier to solve than late-stage surprises in the Hamilton building permit timeline.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 md:grid-cols-3 lg:px-8">
          <div className="rounded-2xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Biggest cause</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">Incomplete drawings</p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Most exposed projects</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">Legal basement units</p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Best protection</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">Strong prep before submission</p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
          <div className="space-y-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-3xl font-bold text-slate-900">
                The real reason permits get delayed
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                Most homeowners blame the City first, but the bigger issue is often
                the file quality itself. Weak plans, unclear assumptions, and missing
                details cause more friction than most people expect. If you want to
                compare that with{' '}
                <Link
                  to="/hamilton-building-permit-timeline"
                  className="font-semibold text-slate-900 underline underline-offset-4"
                >
                  typical permit timelines in Hamilton
                </Link>
                , the key takeaway is that delays often get added before review even starts. If you need help getting the right team involved earlier, move to{' '}
                <Link
                  to="/match"
                  className="font-semibold text-slate-900 underline underline-offset-4"
                >
                  /match
                </Link>
                .
              </p>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                If your project is also being evaluated for a legal suite or funding
                strategy, review the{' '}
                <Link
                  to="/hamilton-grant-guide"
                  className="font-semibold text-slate-900 underline underline-offset-4"
                >
                  Hamilton grant guide
                </Link>{' '}
                before you lock in the wrong scope.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-3xl font-bold text-slate-900">
                Basement finishing vs legal suite delay risk
              </h2>
              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-6">
                  <div className="flex items-center gap-3">
                    <Home className="h-6 w-6 text-slate-700" />
                    <h3 className="text-xl font-bold text-slate-900">Standard basement finishing</h3>
                  </div>
                  <p className="mt-4 text-slate-600 leading-7">
                    Delay risk is lower when the scope is simpler, but poor drawings can still create unnecessary comments and back-and-forth.
                  </p>
                </div>
                <div className="rounded-2xl border border-[#1B3C6C]/20 bg-blue-50 p-6">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-6 w-6 text-[#1B3C6C]" />
                    <h3 className="text-xl font-bold text-slate-900">Legal secondary suite</h3>
                  </div>
                  <p className="mt-4 text-slate-700 leading-7">
                    A legal basement permit Ontario file has more opportunities for delay because the review standard is more detailed and less forgiving.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-3xl font-bold text-slate-900">
                What homeowners can control
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                You cannot control every review outcome, but you can control scope
                clarity, team quality, drawing quality, zoning checks, and how fast
                revisions are handled. Those are the real levers inside the Hamilton
                building permit timeline. That starts with confirming{' '}
                <Link
                  to="/do-you-need-a-permit-for-a-basement-in-hamilton"
                  className="font-semibold text-slate-900 underline underline-offset-4"
                >
                  when a permit is required
                </Link>
                , because wrong assumptions at the beginning create delays later. If
                the same project may turn into a legal suite, the{' '}
                <Link
                  to="/hamilton-grant-guide"
                  className="font-semibold text-slate-900 underline underline-offset-4"
                >
                  Hamilton grant guide
                </Link>{' '}
                helps connect delay risk with project economics.
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
                The biggest setbacks usually happen before a permit application is
                sent in. If the scope, drawings, and review strategy are weak, the
                file starts in a bad position. For help getting the right team lined
                up, start with{' '}
                <Link
                  to="/match"
                  className="font-semibold text-slate-900 underline underline-offset-4"
                >
                  OntarioReno&apos;s contractor match
                </Link>
                .
              </p>
              <div className="mt-6">
                <Link
                  to="/match"
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-4 text-base font-bold text-white transition hover:bg-slate-800"
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
              <h3 className="mt-6 text-2xl font-bold">Need help reducing permit risk?</h3>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                The right contractor or designer can reduce avoidable delays before the file even reaches review.
              </p>
              <Link
                to="/match"
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[#1B3C6C] px-5 py-4 text-center font-bold text-white transition hover:bg-blue-700"
              >
                Start With Contractor Matching
              </Link>
            </div>

            <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-8 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-200/70 text-yellow-900">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-2xl font-bold text-slate-900">Planning a legal suite too?</h3>
              <p className="mt-4 text-sm leading-7 text-slate-700">
                Delay prevention is even more important when your basement plan ties into legal suite economics or grant eligibility.
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
              Delay-prevention breakdown, step by step
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Most permit-delay prevention happens well before the City sends back comments.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {delaySteps.map((item) => (
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
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">Next step</p>
              <h2 className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl">
                Want help reducing permit friction before you submit?
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                If you want to move forward with a stronger team, go to{' '}
                <Link to="/match" className="font-semibold text-slate-900 underline underline-offset-4">
                  /match
                </Link>
                . If your project may become a legal suite, also review{' '}
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
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-7 py-4 text-base font-bold text-white transition hover:bg-slate-800"
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
              Direct answers about building permit delays in Hamilton.
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
            Reduce permit delays before they start
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Strong prep and the right team can save weeks of avoidable delay on basement and legal suite projects.
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
