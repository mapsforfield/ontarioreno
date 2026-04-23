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
    title: 'Define what the basement needs to become',
    detail:
      'Start by deciding whether the lower level stays family-use, becomes a more complete finished space, or is being planned with future rental potential in mind.',
  },
  {
    step: '02',
    title: 'Review cost, layout, and permit scope',
    detail:
      'Oshawa homes range from older layouts to newer unfinished basements, so retrofit needs, room planning, and permit scope can shift more than homeowners expect.',
  },
  {
    step: '03',
    title: 'Choose a contractor who understands Oshawa',
    detail:
      'Basement projects usually move better when the contractor understands City of Oshawa permits, common retrofit issues, and realistic basement scope.',
  },
  {
    step: '04',
    title: 'Prepare drawings where required',
    detail:
      'Permit-ready drawings matter more once the project includes plumbing, bedrooms, walls, room changes, or legal basement planning.',
  },
  {
    step: '05',
    title: 'Build with inspections in mind',
    detail:
      'City of Oshawa review and inspections should shape the plan early instead of being treated as a last-minute item.',
  },
  {
    step: '06',
    title: 'Finish with the right approvals',
    detail:
      'The basement only works as intended when the build, permit scope, and final use all line up properly.',
  },
];

const faqs = [
  {
    question: 'Is basement renovation common in Oshawa?',
    answer:
      'Yes. Many Oshawa homeowners renovate basements for family living, work-from-home use, recreation space, or future legal-suite planning.',
  },
  {
    question: 'What does a typical Oshawa basement renovation include?',
    answer:
      'Most projects include framing, drywall, flooring, lighting, and often a bathroom. Larger scopes may also add bedrooms, offices, or open living areas.',
  },
  {
    question: 'Do basement renovations in Oshawa usually need permits?',
    answer:
      'Often yes. Once the basement includes walls, plumbing, electrical changes, room changes, or suite planning, City of Oshawa permits usually need to be reviewed.',
  },
  {
    question: 'Why do layouts and retrofits matter more in Oshawa?',
    answer:
      'Oshawa has a mix of older and newer homes, so ceiling heights, service locations, existing layouts, and unfinished conditions can all affect basement planning.',
  },
  {
    question: 'What should homeowners do before getting quotes?',
    answer:
      'Confirm the intended use first, then compare likely pricing, permit scope, and whether the basement may need to support a future legal unit.',
  },
];

export default function OshawaBasementRenovation() {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>Basement Renovation in Oshawa | OntarioReno</title>
        <meta
          name="description"
          content="Planning a basement renovation in Oshawa? Learn what finished basements usually involve, what City of Oshawa permits may apply, and how family-use and legal basement planning differ."
        />
        <link
          rel="canonical"
          href="https://ontarioreno.ca/basement-renovation-oshawa"
        />
      </Helmet>

      <section className="bg-slate-900 text-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-center lg:px-8 lg:py-24">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/15 px-4 py-2 text-sm font-medium text-blue-200 ring-1 ring-white/10">
              <Clock3 className="h-4 w-4" />
              Oshawa basement renovation guide
            </div>

            <h1 className="mt-6 text-4xl font-bold leading-tight md:text-6xl">
              Basement Renovation in Oshawa
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300 md:text-xl">
              Oshawa basements can start from very different conditions, from
              older homes with retrofit needs to newer houses with unfinished
              lower levels. Cost, permits, and intended use all need to be
              aligned early.
            </p>

            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400">
              This guide explains how basement renovation planning works in
              Oshawa, how pricing and permit scope connect, and what changes
              once the project moves from family-use space toward a legal
              basement path.
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
                to="/basement-renovation-cost-oshawa"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-7 py-4 text-base font-semibold text-white transition hover:bg-white/10"
              >
                See Oshawa basement costs
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-6 text-sm font-medium text-slate-300">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                Oshawa-specific planning
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                Older and newer home relevant
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
                  Typical Oshawa Basement Finish
                </div>
                <img
                  src="/images/ontarioreno/oshawa-finished-basement.webp"
                  alt="Finished basement renovation in Oshawa Ontario"
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
              Quick answer: what should you sort out first?
            </h2>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              Most Oshawa basement projects get easier to manage once you
              separate three questions early: price, permit scope, and whether
              the basement may need to work as a legal unit later.
            </p>
            <ul className="mt-6 space-y-3 text-slate-700">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <span>
                  Want pricing first? Review the{' '}
                  <Link
                    to="/basement-renovation-cost-oshawa"
                    className="font-semibold text-slate-900 underline underline-offset-4"
                  >
                    Oshawa basement cost guide
                  </Link>
                  .
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <span>
                  Thinking about a legal unit? Compare the{' '}
                  <Link
                    to="/legal-basement-oshawa"
                    className="font-semibold text-slate-900 underline underline-offset-4"
                  >
                    Oshawa legal basement guide
                  </Link>
                  .
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <span>
                  Need permit clarity? Start with{' '}
                  <Link
                    to="/basement-permit-oshawa"
                    className="font-semibold text-slate-900 underline underline-offset-4"
                  >
                    Oshawa basement permits
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
                Why Oshawa basement projects vary so much
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                Oshawa has a broad mix of older and newer homes, which means
                basement layouts can vary a lot from one property to the next.
                Older homes may bring retrofit considerations like ceiling
                heights, service changes, and awkward room planning, while newer
                homes may begin unfinished but still need a clear scope once
                real work starts.
              </p>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                If your first concern is budget, go to the{' '}
                <Link
                  to="/basement-renovation-cost-oshawa"
                  className="font-semibold text-slate-900 underline underline-offset-4"
                >
                  basement renovation cost in Oshawa
                </Link>{' '}
                page. If the real goal is a second unit, the{' '}
                <Link
                  to="/legal-basement-oshawa"
                  className="font-semibold text-slate-900 underline underline-offset-4"
                >
                  legal basement Oshawa
                </Link>{' '}
                guide is the better next step.
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
                  <p className="mt-4 leading-7 text-slate-600">
                    This route usually focuses on family living space,
                    recreation, storage, and maybe a bathroom without full
                    rental-unit compliance.
                  </p>
                </div>
                <div className="rounded-2xl border border-[#1B3C6C]/20 bg-blue-50 p-6">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-6 w-6 text-[#1B3C6C]" />
                    <h3 className="text-xl font-bold text-slate-900">Legal second unit</h3>
                  </div>
                  <p className="mt-4 leading-7 text-slate-700">
                    This path usually needs more design detail, stronger permit
                    planning, and closer attention to City of Oshawa review.
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <img
                src="/images/ontarioreno/oshawa-basement-two.jpg"
                alt="Modern finished basement in Oshawa Ontario"
                className="w-full object-cover"
              />
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-3xl font-bold text-slate-900">
                What usually changes cost and complexity
              </h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {[
                  'Bathroom additions and plumbing locations',
                  'Bedroom layouts, egress assumptions, and window sizing',
                  'Whether the basement stays family-use or becomes rental-ready',
                  'Permit drawings and City of Oshawa review scope',
                ].map((item) => (
                  <div key={item} className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
                    <p className="text-base leading-7 text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-lg leading-8 text-slate-600">
                For broader basement planning, compare the main{' '}
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
                src="/images/ontarioreno/oshawa-city-sign.webp"
                alt="Oshawa Ontario city sign"
                className="w-full object-cover"
              />
            </div>

            <div className="rounded-3xl border border-blue-200 bg-blue-50 p-8 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#1B3C6C]">
                Next move
              </p>
              <h2 className="mt-3 text-3xl font-bold text-slate-900">
                Most Oshawa basements need better planning before quotes
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-700">
                Cleaner scope makes it easier to compare real pricing and avoid
                wrong assumptions about permits, layout constraints, or
                legal-suite upgrades. If you want help sorting the right path,
                go to{' '}
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
                  className="inline-flex items-center justify-center rounded-[0.8rem] border border-slate-800 bg-[linear-gradient(180deg,#1f2937_0%,#0f172a_100%)] px-6 py-[0.95rem] text-base font-semibold tracking-[-0.015em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(15,23,42,0.05),0_14px_30px_rgba(15,23,42,0.18)] transition duration-200 hover:border-slate-700 hover:bg-[linear-gradient(180deg,#273244_0%,#111c31_100%)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_1px_2px_rgba(15,23,42,0.06),0_18px_36px_rgba(15,23,42,0.22)] active:bg-[linear-gradient(180deg,#111827_0%,#020617_100%)] active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
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
                Need help comparing Oshawa basement options?
              </h3>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                The right contractor fit matters more once pricing, retrofit
                scope, permits, and legal-suite planning begin overlapping.
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
                Oshawa cluster
              </h3>
              <div className="mt-5 space-y-3 text-sm leading-7 text-slate-700">
                <Link
                  to="/basement-renovation-cost-oshawa"
                  className="block font-semibold underline underline-offset-4"
                >
                  Basement renovation cost in Oshawa
                </Link>
                <Link
                  to="/legal-basement-oshawa"
                  className="block font-semibold underline underline-offset-4"
                >
                  Legal basement Oshawa
                </Link>
                <Link
                  to="/basement-permit-oshawa"
                  className="block font-semibold underline underline-offset-4"
                >
                  Basement permit Oshawa
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
              Most Oshawa basement projects follow a similar planning
              sequence even when the end use changes.
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
              Practical answers for Oshawa homeowners planning basement work.
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
            Plan your Oshawa basement with the right assumptions
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Pricing, layout, permits, and legal-suite planning all become
            easier once the right direction is defined early.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              to="/match"
              className="inline-flex items-center justify-center rounded-xl bg-[#1B3C6C] px-8 py-4 text-base font-bold text-white transition hover:bg-blue-700"
            >
              Find the right team
            </Link>
            <Link
              to="/basement-renovation-cost-oshawa"
              className="inline-flex items-center justify-center rounded-xl border border-white/20 px-8 py-4 text-base font-semibold text-white transition hover:bg-white/10"
            >
              See Oshawa basement costs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
