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

const processSteps = [
  {
    step: '01',
    title: 'Confirm the basement goal',
    detail:
      'Start by deciding whether the basement is for family use, a more complete finished level, or a future legal second unit.',
  },
  {
    step: '02',
    title: 'Review cost and permit scope',
    detail:
      'Milton basements often begin unfinished in newer homes, which helps with planning, but layout changes and plumbing still affect permits and price.',
  },
  {
    step: '03',
    title: 'Line up the right team',
    detail:
      'A basement project moves better when the contractor understands Town of Milton permit expectations and real project scope.',
  },
  {
    step: '04',
    title: 'Prepare drawings if needed',
    detail:
      'Permit-ready drawings matter more once the basement includes plumbing, bedrooms, new rooms, or legal-suite planning.',
  },
  {
    step: '05',
    title: 'Build with inspections in mind',
    detail:
      'Town of Milton review and inspections should shape the plan early, not appear as a last-minute requirement.',
  },
  {
    step: '06',
    title: 'Finish with the right approvals',
    detail:
      'Finished space only becomes truly useful when the work, permits, and intended use all align properly.',
  },
];

const faqs = [
  {
    question: 'Is basement renovation popular in Milton?',
    answer:
      'Yes. Many Milton homes have newer unfinished basements, which makes them strong candidates for family space, recreation rooms, and future legal suites.',
  },
  {
    question: 'What does a typical basement renovation in Milton include?',
    answer:
      'Most projects include framing, drywall, flooring, lighting, and often a bathroom. Larger layouts may add bedrooms, offices, or open family areas.',
  },
  {
    question: 'Do Milton basement projects usually need permits?',
    answer:
      'Often, yes. Once the project includes walls, plumbing, electrical changes, or suite planning, Town of Milton permits usually become part of the job.',
  },
  {
    question: 'Does Halton Region matter for basement planning?',
    answer:
      'Yes, especially where regional servicing, housing context, or broader approval questions affect how a legal or rental-ready project is evaluated.',
  },
  {
    question: 'What is the best next step before getting quotes?',
    answer:
      'Confirm the scope first, then compare cost direction, permit requirements, and whether the project could become a legal suite later.',
  },
];

export default function MiltonBasementRenovation() {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  return (
    <div className="bg-slate-50 min-h-screen">
      <Helmet>
        <title>Basement Renovation in Milton | OntarioReno</title>
        <meta
          name="description"
          content="Planning a basement renovation in Milton? Learn what newer unfinished basements usually cost to finish, what permits may be required, and how to compare family-use and legal-suite options."
        />
        <link
          rel="canonical"
          href="https://ontarioreno.ca/basement-renovation-milton"
        />
      </Helmet>

      <section className="bg-slate-900 text-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-center lg:px-8 lg:py-24">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/15 px-4 py-2 text-sm font-medium text-blue-200 ring-1 ring-white/10">
              <Clock3 className="h-4 w-4" />
              Milton basement renovation guide
            </div>

            <h1 className="mt-6 text-4xl font-bold leading-tight md:text-6xl">
              Basement Renovation in Milton
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300 md:text-xl">
              Many Milton homeowners start with newer unfinished basements, which
              makes planning easier, but real costs, permits, and future suite
              potential still need to be lined up properly.
            </p>

            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400">
              This guide explains basement renovation planning in Milton, how cost
              and permit scope connect, and what to think about before choosing a
              family-use finish or legal basement path.
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
                to="/basement-renovation-cost-milton"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-7 py-4 text-base font-semibold text-white transition hover:bg-white/10"
              >
                See Milton basement costs
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-6 text-sm font-medium text-slate-300">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                Milton-specific planning
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                Built for newer unfinished basements
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                Family-use and legal-suite relevant
              </span>
            </div>

            <p className="mt-6 text-sm text-slate-400">Last updated: {lastUpdated}</p>
          </div>

          <div className="flex items-center justify-center lg:justify-end lg:translate-y-4">
            <div className="relative w-full max-w-[500px] rounded-[2rem] bg-white/6 p-4 ring-1 ring-white/10">
              <div className="pointer-events-none absolute inset-6 rounded-[1.75rem] bg-black/10 blur-2xl" />
              <div className="relative">
                <div className="absolute left-4 top-4 z-10 rounded-full border border-white/15 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                  Typical Milton Basement Finish
                </div>
                <img
                  src="/images/ontarioreno/finished-basement-milton.jpg"
                  alt="Finished basement renovation in Milton Ontario"
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
              Quick answer: what should you figure out first?
            </h2>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              Most Milton basement projects move faster once you separate three
              questions early: cost, permit scope, and whether the basement may
              become a legal unit later.
            </p>
            <ul className="mt-6 space-y-3 text-slate-700">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <span>Want pricing first? Review the <Link to="/basement-renovation-cost-milton" className="font-semibold text-slate-900 underline underline-offset-4">Milton basement cost guide</Link>.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <span>Thinking about a legal unit? Compare the <Link to="/legal-basement-milton" className="font-semibold text-slate-900 underline underline-offset-4">Milton legal basement guide</Link>.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <span>Need permit clarity? Start with <Link to="/basement-permit-milton" className="font-semibold text-slate-900 underline underline-offset-4">Milton basement permits</Link>.</span>
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
                Why Milton basement projects are often different
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                Milton has many newer homes with unfinished basements, which can
                make layout planning feel simpler than older housing stock. Even so,
                the real project still depends on ceiling height, plumbing rough-ins,
                family-use goals, and what the Town of Milton expects once walls,
                rooms, or bathrooms are being added.
              </p>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                If your first question is budget, go to the{' '}
                <Link
                  to="/basement-renovation-cost-milton"
                  className="font-semibold text-slate-900 underline underline-offset-4"
                >
                  basement renovation cost in Milton
                </Link>{' '}
                page. If your real goal is a second unit, the{' '}
                <Link
                  to="/legal-basement-milton"
                  className="font-semibold text-slate-900 underline underline-offset-4"
                >
                  legal basement Milton
                </Link>{' '}
                guide is the better starting point.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-3xl font-bold text-slate-900">
                Family-use basement vs future legal suite
              </h2>
              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-6">
                  <div className="flex items-center gap-3">
                    <Home className="h-6 w-6 text-slate-700" />
                    <h3 className="text-xl font-bold text-slate-900">Standard family basement</h3>
                  </div>
                  <p className="mt-4 text-slate-600 leading-7">
                    This path usually focuses on living space, storage, a bathroom,
                    and better day-to-day use without full rental-unit compliance.
                  </p>
                </div>
                <div className="rounded-2xl border border-[#1B3C6C]/20 bg-blue-50 p-6">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-6 w-6 text-[#1B3C6C]" />
                    <h3 className="text-xl font-bold text-slate-900">Legal second unit</h3>
                  </div>
                  <p className="mt-4 text-slate-700 leading-7">
                    A legal basement path usually needs stronger design, a clearer
                    permit strategy, and more attention to Town of Milton and broader
                    Halton housing context.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-3xl font-bold text-slate-900">
                What usually changes cost and complexity
              </h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {[
                  'Bathroom additions and plumbing locations',
                  'Bedroom layouts and egress assumptions',
                  'Whether the basement stays family-use or becomes rental-ready',
                  'Permit drawings and Town of Milton review scope',
                ].map((item) => (
                  <div key={item} className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
                    <p className="text-base leading-7 text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-lg leading-8 text-slate-600">
                For broader basement planning, you can also compare the site's main{' '}
                <Link
                  to="/basements"
                  className="font-semibold text-slate-900 underline underline-offset-4"
                >
                  basement renovation hub
                </Link>{' '}
                and our Ontario{' '}
                <Link
                  to="/costs"
                  className="font-semibold text-slate-900 underline underline-offset-4"
                >
                  renovation cost guides
                </Link>
                .
              </p>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <img
                src="/images/ontarioreno/downtown-milton.jpg"
                alt="Downtown Milton Ontario streetscape"
                className="w-full object-cover"
              />
            </div>

            <div className="rounded-3xl border border-blue-200 bg-blue-50 p-8 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#1B3C6C]">
                Next move
              </p>
              <h2 className="mt-3 text-3xl font-bold text-slate-900">
                Most Milton basements need better planning before quotes
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-700">
                The cleaner the scope is before pricing starts, the easier it is to
                compare real numbers and avoid wrong assumptions about permits or
                legal-suite upgrades. If you want help choosing the right path, go to{' '}
                <Link
                  to="/match"
                  className="font-semibold text-slate-900 underline underline-offset-4"
                >
                  /match
                </Link>
                .
              </p>
              <div className="mt-6">
                <Link
                  to="/match"
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-4 text-base font-bold text-white transition hover:bg-slate-800"
                >
                  Find the right contractor
                </Link>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl bg-slate-900 p-8 text-white shadow-xl">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-200">
                <Hammer className="h-7 w-7" />
              </div>
              <h3 className="mt-6 text-2xl font-bold">
                Need help comparing Milton basement options?
              </h3>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                The right contractor fit matters more once cost, permits, and legal-suite plans all start overlapping.
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
                Milton cluster
              </h3>
              <div className="mt-5 space-y-3 text-sm leading-7 text-slate-700">
                <Link to="/basement-renovation-cost-milton" className="block font-semibold underline underline-offset-4">
                  Basement renovation cost in Milton
                </Link>
                <Link to="/legal-basement-milton" className="block font-semibold underline underline-offset-4">
                  Legal basement Milton
                </Link>
                <Link to="/basement-permit-milton" className="block font-semibold underline underline-offset-4">
                  Basement permit Milton
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
              Basement planning, step by step
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Most Milton basement projects follow the same planning sequence even when the end goal changes.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {processSteps.map((item) => (
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

      <section className="bg-white py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
              Frequently asked questions
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Practical answers for Milton homeowners planning basement work.
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
            Plan your Milton basement with the right assumptions
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Cost, permits, and legal-suite planning all get easier once the right scope is defined early.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              to="/match"
              className="inline-flex items-center justify-center rounded-xl bg-[#1B3C6C] px-8 py-4 text-base font-bold text-white transition hover:bg-blue-700"
            >
              Find the right team
            </Link>
            <Link
              to="/basement-renovation-cost-milton"
              className="inline-flex items-center justify-center rounded-xl border border-white/20 px-8 py-4 text-base font-semibold text-white transition hover:bg-white/10"
            >
              See Milton basement costs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

