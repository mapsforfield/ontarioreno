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
    title: 'Confirm the intended use',
    detail:
      'A legal basement is not just a finished basement. It is a code-compliant space intended to function properly under Ontario rules and local municipal requirements.',
  },
  {
    step: '02',
    title: 'Review zoning and municipal rules',
    detail:
      'Ontario-wide rules still sit alongside city-specific requirements, which is why local review still matters.',
  },
  {
    step: '03',
    title: 'Prepare compliant drawings',
    detail:
      'Permit drawings need to show details tied to exits, room layout, fire separation, ventilation, and the overall use of the unit.',
  },
  {
    step: '04',
    title: 'Submit permit application',
    detail:
      'The file goes into municipal review, where the legal basement permit Ontario process is tested against the actual submission quality.',
  },
  {
    step: '05',
    title: 'Respond to revisions',
    detail:
      'If comments come back, the speed and quality of the design response often determines whether the file keeps moving.',
  },
  {
    step: '06',
    title: 'Build and inspect',
    detail:
      'A legal basement has to be built to match the approved drawings and pass the required inspections.',
  },
];

const faqs = [
  {
    question: 'What makes a basement legal in Ontario?',
    answer:
      'It needs to meet applicable building code requirements, municipal rules, permit requirements, and safety conditions for the intended use.',
  },
  {
    question: 'Is a legal basement the same as a legal secondary suite?',
    answer:
      'Not always, but many homeowners mean a legal second unit when they use the term. That usually requires a more detailed permit and compliance review.',
  },
  {
    question: 'Does Ontario have one standard for every city?',
    answer:
      'No. Ontario rules matter, but municipal zoning and permit review still shape the final approval path.',
  },
  {
    question: 'Why does a legal basement permit Ontario project take longer?',
    answer:
      'Because more detail is needed around exits, fire separation, layout, HVAC, plumbing, and overall compliance.',
  },
  {
    question: 'What causes the biggest delays?',
    answer:
      'Weak drawings, missing details, zoning issues, and slow revision responses cause most delays.',
  },
  {
    question: 'What happens if the City asks for revisions or corrections?',
    answer:
      'The file slows down until complete fixes are prepared and resubmitted.',
  },
];

export default function OntarioLegalBasementRequirements() {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  return (
    <div className="bg-slate-50 min-h-screen">
      <Helmet>
        <title>Legal Basement Requirements in Ontario | OntarioReno</title>
        <meta
          name="description"
          content="Understand the legal basement requirements in Ontario, including permits, code compliance, municipal review, and what slows down legal basement approvals."
        />
        <link
          rel="canonical"
          href="https://ontarioreno.ca/legal-basement-requirements-in-ontario"
        />
      </Helmet>

      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/15 px-4 py-2 text-sm font-medium text-blue-200 ring-1 ring-white/10">
              <Clock3 className="h-4 w-4" />
              Ontario legal basement guide
            </div>

            <h1 className="mt-6 text-4xl font-bold leading-tight md:text-6xl">
              Legal Basement Requirements in Ontario
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300 md:text-xl">
              A legal basement in Ontario needs more than finishes. It usually needs
              permit approval, code-compliant design, and municipal review that fits
              the actual intended use of the space.
            </p>

            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400">
              This page explains the legal basement permit Ontario homeowners should
              expect, where municipal review affects the timeline, and how legal
              basement requirements connect to project cost and planning.
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
                Legal-basement focused
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                Permit and compliance focused
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                Written for homeowners
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
              Quick answer: what does a legal basement usually require?
            </h2>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              Legal basement work usually gets more complex as the space moves closer to a true second unit.
            </p>
            <ul className="mt-6 space-y-3 text-slate-700">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <span>Simple basement finishing: fewer compliance layers, but permits may still be required.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <span>Legal secondary suite: more code detail, more permit scrutiny, and usually a longer review path.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <span>Projects requiring zoning review: can take longer where local municipal conditions become part of the file.</span>
              </li>
            </ul>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Simple basement finishing</p>
                <p className="mt-3 text-2xl font-bold text-slate-900">Lower complexity</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Basement permit Hamilton projects can still need approvals even when the work looks modest.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Legal secondary suite</p>
                <p className="mt-3 text-2xl font-bold text-slate-900">Higher compliance</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  A legal basement permit Ontario project usually needs a fuller code and permit package.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Zoning review</p>
                <p className="mt-3 text-2xl font-bold text-slate-900">Local rules matter</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  The Hamilton building permit timeline can extend when zoning or property-specific review becomes part of approval.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 md:grid-cols-3 lg:px-8">
          <div className="rounded-2xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Biggest misconception</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">Finished does not mean legal</p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Key requirement</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">Permit plus compliance</p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Common slowdown</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">Missing design detail</p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
          <div className="space-y-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-3xl font-bold text-slate-900">
                What legal basement requirements usually include
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                The exact requirements depend on the municipality and intended use,
                but most homeowners should expect permit review, code-compliant
                drawings, and a much more careful standard than a simple cosmetic
                basement update. If your project is in Hamilton, the{' '}
                <Link
                  to="/hamilton-building-permit-timeline"
                  className="font-semibold text-slate-900 underline underline-offset-4"
                >
                  Hamilton permit timeline
                </Link>{' '}
                helps put those requirements into a more practical review sequence.
                If funding is part of the decision, the{' '}
                <Link
                  to="/hamilton-grant-guide"
                  className="font-semibold text-slate-900 underline underline-offset-4"
                >
                  Hamilton grant guide
                </Link>{' '}
                is the next logical read.
              </p>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                If your goal is a legal rental-ready unit in Hamilton, the{' '}
                <Link
                  to="/hamilton-grant-guide"
                  className="font-semibold text-slate-900 underline underline-offset-4"
                >
                  Hamilton grant guide
                </Link>{' '}
                is worth reviewing early because it connects legal suite planning with funding and project structure.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-3xl font-bold text-slate-900">
                Finished basement vs legal basement
              </h2>
              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-6">
                  <div className="flex items-center gap-3">
                    <Home className="h-6 w-6 text-slate-700" />
                    <h3 className="text-xl font-bold text-slate-900">Finished basement</h3>
                  </div>
                  <p className="mt-4 text-slate-600 leading-7">
                    A basement can look complete without meeting the standard needed for legal use as a proper dwelling space.
                  </p>
                </div>
                <div className="rounded-2xl border border-[#1B3C6C]/20 bg-blue-50 p-6">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-6 w-6 text-[#1B3C6C]" />
                    <h3 className="text-xl font-bold text-slate-900">Legal basement</h3>
                  </div>
                  <p className="mt-4 text-slate-700 leading-7">
                    A legal basement permit Ontario file usually needs stronger review because safety, layout, and intended use all matter.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-3xl font-bold text-slate-900">
                Why municipalities still matter
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                Ontario rules do not erase local review. Municipal zoning and permit
                standards still shape the approval path, which is why the Hamilton
                building permit timeline can differ from the broader Ontario idea.
                If you are still deciding{' '}
                <Link
                  to="/do-you-need-a-permit-for-a-basement-in-hamilton"
                  className="font-semibold text-slate-900 underline underline-offset-4"
                >
                  whether your basement needs a permit in Hamilton
                </Link>
                , that question should be settled before you assume the file is simple. If you want help turning that into a real next step, start with{' '}
                <Link
                  to="/match"
                  className="font-semibold text-slate-900 underline underline-offset-4"
                >
                  /match
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
                Weak drawings and unclear assumptions are still the biggest reason
                permit-heavy basement projects lose time. If you want help finding a
                team that understands legal-suite work, start with{' '}
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
              <h3 className="mt-6 text-2xl font-bold">Need help planning a legal basement properly?</h3>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                Permit-heavy basement projects move better when the right designer and contractor are aligned from the start.
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
              <h3 className="mt-5 text-2xl font-bold text-slate-900">Comparing cost and funding too?</h3>
              <p className="mt-4 text-sm leading-7 text-slate-700">
                Legal basement requirements and project economics should be reviewed together before you commit.
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
              Legal basement breakdown, step by step
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Most legal-basement projects move through the same general approval sequence.
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
                Want help structuring a legal basement project properly?
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                If you are ready to talk to the right team, go to{' '}
                <Link to="/match" className="font-semibold text-slate-900 underline underline-offset-4">
                  /match
                </Link>
                . If you are comparing legal suite economics in Hamilton, also review{' '}
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
              Direct answers about legal basement requirements in Ontario.
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
            Plan legal basement work with the right assumptions
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Legal basements are permit-heavy projects. The right scope and team can prevent expensive corrections later.
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
