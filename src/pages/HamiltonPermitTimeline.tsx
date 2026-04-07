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

const timelineSteps = [
  {
    step: '01',
    title: 'Planning and drawings',
    detail:
      'Scope definition, measurements, zoning checks, and permit-ready drawings usually happen before anything is sent to the City.',
  },
  {
    step: '02',
    title: 'Permit submission',
    detail:
      'Your application package is assembled and submitted with the required forms, drawings, and supporting documents.',
  },
  {
    step: '03',
    title: 'City review',
    detail:
      'Hamilton reviews the file for code, zoning, and project-specific compliance issues tied to the work you are proposing.',
  },
  {
    step: '04',
    title: 'Revisions if requested',
    detail:
      'If the reviewer flags missing information or design issues, the clock can effectively stretch while updates are prepared and resubmitted.',
  },
  {
    step: '05',
    title: 'Permit issuance',
    detail:
      'Once the application is accepted and fees are handled, the permit can be issued and the job is cleared to start.',
  },
  {
    step: '06',
    title: 'Construction and inspections',
    detail:
      'Permit timing is only the start. Basement and secondary suite projects still need staged inspections during construction.',
  },
];

const faqs = [
  {
    question: 'How long does a basement permit take in Hamilton?',
    answer:
      'A simple basement permit Hamilton project often lands around 2 to 4 weeks once drawings are ready and the file is complete.',
  },
  {
    question: 'Is a legal basement apartment permit slower?',
    answer:
      'Yes. A legal basement permit Ontario file is usually slower because secondary suites need more detail on fire separation, exits, HVAC, plumbing, and code compliance.',
  },
  {
    question: 'Can I start construction before the permit is issued?',
    answer:
      'No. Wait until the permit is issued. Starting early can lead to stop-work orders, rework, and extra cost.',
  },
  {
    question: 'What documents are usually needed?',
    answer:
      'Most applications need permit drawings, a clear scope of work, existing-condition information, and supporting code details. Secondary suites usually need a fuller package.',
  },
  {
    question: 'What causes the biggest permit delays?',
    answer:
      'Incomplete drawings, unclear scope, zoning issues, and slow revision responses cause most delays.',
  },
  {
    question: 'What happens if the City asks for revisions or corrections?',
    answer:
      'Revisions are common. The timeline depends on how quickly your designer or contractor sends back complete fixes.',
  },
];

export default function HamiltonPermitTimeline() {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  return (
    <div className="bg-slate-50 min-h-screen">
      <Helmet>
        <title>
          How Long Does It Take to Get a Building Permit in Hamilton? | OntarioReno
        </title>
        <meta
          name="description"
          content="Learn what affects building permit timelines in Hamilton for basement finishing and legal secondary suite projects, what can slow approvals down, and how to avoid permit delays."
        />
        <link
          rel="canonical"
          href="https://ontarioreno.ca/hamilton-building-permit-timeline"
        />
        <meta
          property="og:title"
          content="How Long Does It Take to Get a Building Permit in Hamilton?"
        />
        <meta
          property="og:description"
          content="A practical guide for Hamilton homeowners planning a basement or legal secondary suite project and trying to understand permit timing."
        />
        <meta
          property="og:url"
          content="https://ontarioreno.ca/hamilton-building-permit-timeline"
        />
        <meta property="og:type" content="article" />
        <meta
          name="twitter:title"
          content="How Long Does It Take to Get a Building Permit in Hamilton?"
        />
        <meta
          name="twitter:description"
          content="Understand what drives Hamilton building permit timelines for basement and legal secondary suite projects."
        />
      </Helmet>

      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/15 px-4 py-2 text-sm font-medium text-blue-200 ring-1 ring-white/10">
              <Clock3 className="h-4 w-4" />
              Hamilton permit planning guide
            </div>

            <h1 className="mt-6 text-4xl font-bold leading-tight md:text-6xl">
              How Long Does It Take to Get a Building Permit in Hamilton?
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300 md:text-xl">
              Most Hamilton building permits take 2-6 weeks, but legal basement
              units can take longer depending on drawings, zoning, and revisions.
            </p>

            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400">
              This Hamilton building permit timeline guide is designed to help you
              set realistic expectations early, avoid preventable delays, and move
              faster with the right permit-ready team.
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
                Basement and legal suite focused
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                Written for Hamilton homeowners
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                Built around real approval bottlenecks
              </span>
            </div>

            <p className="mt-6 text-sm text-slate-400">
              Last updated: April 2026
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">
              Quick answer: what timeline should you expect?
            </h2>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              For most homeowners, the City of Hamilton permit process moves fastest
              when drawings are complete and the scope is clearly defined before
              submission.
            </p>
            <ul className="mt-6 space-y-3 text-slate-700">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <span>Simple basement finishing: often about 2 to 4 weeks with a clean submission.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <span>Legal secondary suite: often about 4 to 6 or more weeks because more compliance details are reviewed.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <span>Projects requiring zoning review: usually longer than the typical Hamilton building permit timeline.</span>
              </li>
            </ul>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Simple basement finishing
                </p>
                <p className="mt-3 text-2xl font-bold text-slate-900">About 2-4 weeks</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  A basement permit Hamilton homeowners need for straightforward
                  interior work can move relatively quickly if drawings and scope are clean.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Legal secondary suite
                </p>
                <p className="mt-3 text-2xl font-bold text-slate-900">About 4-6+ weeks</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  A legal basement permit Ontario project usually takes longer
                  because more life-safety and compliance details are reviewed.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Projects needing zoning review
                </p>
                <p className="mt-3 text-2xl font-bold text-slate-900">Usually longer</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  If zoning questions or property-specific issues come up, the Hamilton
                  building permit timeline can extend beyond the typical range.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 md:grid-cols-3 lg:px-8">
          <div className="rounded-2xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
              Fastest files
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              Cleaner submissions move sooner
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
              Biggest slowdowns
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              Revisions, zoning, and missing details
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
              Most complex projects
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              Legal suites usually need more coordination
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
          <div className="space-y-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-3xl font-bold text-slate-900">
                Typical permit timeline overview
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                The full timeline is not just the City review window. Homeowners
                usually need to account for time spent confirming scope, producing
                permit drawings, checking zoning and code assumptions, preparing the
                submission package, responding to reviewer comments, and only then
                moving into permit issuance through the City of Hamilton permit process.
              </p>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                For a standard basement renovation, the process may feel more
                straightforward. For a legal secondary suite, the timeline is often
                longer because the permit package has to prove the space works as a
                compliant dwelling unit, not just a finished basement. If grant
                eligibility is part of your decision, it also helps to review the{' '}
                <Link
                  to="/hamilton-grant-guide"
                  className="font-semibold text-slate-900 underline underline-offset-4"
                >
                  Hamilton grant guide
                </Link>{' '}
                early, especially if you are trying to connect permit timing with
                project economics and funding.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-3xl font-bold text-slate-900">
                What can slow a Hamilton permit down
              </h2>
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {[
                  'Incomplete or inconsistent drawings',
                  'A scope that changes after design has started',
                  'Zoning questions or property-specific constraints',
                  'Missing details for exits, windows, HVAC, or plumbing',
                  'Secondary suite layouts that do not clearly show compliance',
                  'Slow revision turnaround from the design or contractor side',
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                      <p className="text-base leading-7 text-slate-700">{item}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-3xl font-bold text-slate-900">
                Basement finishing vs legal secondary suite permit timelines
              </h2>
              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-6">
                  <div className="flex items-center gap-3">
                    <Home className="h-6 w-6 text-slate-700" />
                    <h3 className="text-xl font-bold text-slate-900">
                      Standard basement finishing
                    </h3>
                  </div>
                  <p className="mt-4 text-slate-600 leading-7">
                    If the project is mostly interior finishing with a cleaner scope,
                    fewer compliance layers may need to be coordinated. That can make
                    the design and submission side simpler, assuming the drawings are
                    complete and the work is clearly defined.
                  </p>
                </div>
                <div className="rounded-2xl border border-[#1B3C6C]/20 bg-blue-50 p-6">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-6 w-6 text-[#1B3C6C]" />
                    <h3 className="text-xl font-bold text-slate-900">
                      Legal secondary suite
                    </h3>
                  </div>
                  <p className="mt-4 text-slate-700 leading-7">
                    These files are often slower because they need stronger detail
                    around fire separation, independent living layout, exits, ceiling
                    conditions, mechanical systems, and the overall legality of the
                    unit. More moving parts means more opportunities for revision,
                    which is why a legal basement permit Ontario project is usually
                    slower than a standard basement finish.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-3xl font-bold text-slate-900">
                What happens before submission
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                The pre-submission phase is where many projects win or lose time.
                Accurate measurements, realistic scope planning, permit drawings,
                zoning review, and code-aware design all happen before the City sees
                the file. If this stage is rushed, the application may look submitted
                quickly but still end up delayed later. Homeowners who want to move
                faster and reduce preventable mistakes usually benefit from finding
                the right fit through{' '}
                <Link
                  to="/match"
                  className="font-semibold text-slate-900 underline underline-offset-4"
                >
                  OntarioReno&apos;s matching process
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
                The biggest setbacks usually come from unclear scope, weak drawings,
                and missed issues before the file reaches the City. If you want to
                reduce permit friction, the smartest move is getting the right team
                aligned early through{' '}
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

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-3xl font-bold text-slate-900">
                What happens after submission
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                After submission, Hamilton reviews the application and may return
                comments or request clarification. That is normal. The real issue is
                how quickly and accurately your team responds. Fast, thoughtful
                revisions protect momentum. Slow or incomplete responses can stretch
                the timeline much more than homeowners expect, especially on basement
                permit Hamilton files with incomplete details or zoning questions.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-3xl font-bold text-slate-900">
                How to avoid delays
              </h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {[
                  'Define the project properly before anyone starts drafting drawings.',
                  'Confirm early whether the goal is a finished basement or a legal secondary suite.',
                  'Use permit-ready drawings, not rough concept sketches.',
                  'Treat reviewer comments as design issues to solve fully, not just boxes to check.',
                ].map((item) => (
                  <div key={item} className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
                    <p className="text-base leading-7 text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-3xl font-bold text-slate-900">
                Why the contractor / designer matters
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                The City does not just review what you want to build. It reviews the
                quality and completeness of the package your team puts together. A
                contractor or designer who regularly works on Hamilton basement and
                secondary suite files is more likely to catch scope issues early,
                prepare better drawings, and respond faster when revisions come back.
                If the project may become a legal rental unit, it also helps to
                review the{' '}
                <Link
                  to="/hamilton-grant-guide"
                  className="font-semibold text-slate-900 underline underline-offset-4"
                >
                  Hamilton grant guide
                </Link>{' '}
                before finalizing scope.
              </p>
              <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-6">
                <p className="text-base leading-7 text-slate-700">
                  If you want help finding a team that understands permit-heavy
                  basement and legal suite projects, the strongest next step is to{' '}
                  <Link
                    to="/match"
                    className="font-semibold text-slate-900 underline underline-offset-4"
                  >
                    use OntarioReno&apos;s contractor match
                  </Link>
                  . If you are still weighing economics and incentives, review the{' '}
                  <Link
                    to="/hamilton-grant-guide"
                    className="font-semibold text-slate-900 underline underline-offset-4"
                  >
                    Hamilton grant guide
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl bg-slate-900 p-8 text-white shadow-xl">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-200">
                <Hammer className="h-7 w-7" />
              </div>
              <h3 className="mt-6 text-2xl font-bold">
                Need help getting the right team in place?
              </h3>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                Basement and secondary suite permits move better when the scope,
                drawings, and contractor are aligned from the start.
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
              <h3 className="mt-5 text-2xl font-bold text-slate-900">
                Researching the Hamilton grant too?
              </h3>
              <p className="mt-4 text-sm leading-7 text-slate-700">
                If your goal is a legal basement apartment or secondary suite, permit
                timing is only one part of the decision. Funding structure and
                eligibility matter too.
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
              Permit timeline, step by step
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Most Hamilton projects move through the same sequence. The main
              difference is how much friction shows up at each stage.
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
                <h3 className="mt-3 text-xl font-bold text-slate-900">
                  {item.title}
                </h3>
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
                Want help moving your project forward without permit guesswork?
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                If you are ready to line up the right contractor or designer, go to
                the matching page. If you are still comparing whether a legal suite
                project makes sense financially, review the Hamilton grant guide
                first.
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
              Practical answers for Hamilton homeowners planning basement and legal
              suite work.
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
                    <span className="text-lg font-semibold text-slate-900">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-slate-500 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 text-slate-600 leading-7">
                      {faq.answer}
                    </div>
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
            Better permit planning starts before submission
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Strong drawings, the right scope, and experienced basement or legal
            suite professionals can save weeks of avoidable delay.
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
