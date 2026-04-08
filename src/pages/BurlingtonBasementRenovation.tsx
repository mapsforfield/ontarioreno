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
      'Start by deciding whether the basement is staying family-use, becoming a more complete finished level, or being planned with future rental-unit potential.',
  },
  {
    step: '02',
    title: 'Review cost, retrofit, and permit scope',
    detail:
      'Burlington homes range from older layouts to newer unfinished basements, so retrofit needs, services, and permit scope can vary more than homeowners expect.',
  },
  {
    step: '03',
    title: 'Choose a contractor who understands Burlington',
    detail:
      'Projects move more smoothly when the contractor understands City of Burlington permits, typical retrofit issues, and realistic basement scope.',
  },
  {
    step: '04',
    title: 'Prepare drawings where required',
    detail:
      'Permit-ready drawings become more important once the work includes plumbing, bedrooms, walls, new rooms, or legal-basement planning.',
  },
  {
    step: '05',
    title: 'Build with inspections in mind',
    detail:
      'City of Burlington review and inspection requirements should shape the plan early instead of appearing after pricing is already set.',
  },
  {
    step: '06',
    title: 'Finish with the right approvals',
    detail:
      'The basement only works as intended when the build, permit scope, and end use all line up properly.',
  },
];

const faqs = [
  {
    question: 'Is basement renovation common in Burlington?',
    answer:
      'Yes. Burlington has a mix of older homes and newer builds, so homeowners often renovate basements for family space, home offices, recreation, or future legal-suite planning.',
  },
  {
    question: 'What does a typical Burlington basement renovation include?',
    answer:
      'Most projects include framing, drywall, flooring, lighting, and often a bathroom. Some also add bedrooms, offices, open living areas, or better storage.',
  },
  {
    question: 'Do basement renovations in Burlington usually need permits?',
    answer:
      'Often yes. Once the project includes walls, plumbing, electrical changes, room changes, or suite planning, City of Burlington permits usually need to be considered.',
  },
  {
    question: 'Why do retrofit considerations matter more in Burlington?',
    answer:
      'Older housing stock can mean lower ceilings, dated services, and more existing-condition surprises, while newer homes may begin unfinished but still need clear planning once work starts.',
  },
  {
    question: 'What should homeowners do before getting quotes?',
    answer:
      'Confirm the intended use first, then compare likely cost, permit scope, and whether the basement may need to support a future legal unit.',
  },
];

export default function BurlingtonBasementRenovation() {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>Basement Renovation in Burlington | OntarioReno</title>
        <meta
          name="description"
          content="Planning a basement renovation in Burlington? Learn what finished basements usually involve, what City of Burlington permits may apply, and how family-use and legal-suite planning differ."
        />
        <link
          rel="canonical"
          href="https://ontarioreno.ca/basement-renovation-burlington"
        />
      </Helmet>

      <section className="bg-slate-900 text-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-center lg:px-8 lg:py-24">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/15 px-4 py-2 text-sm font-medium text-blue-200 ring-1 ring-white/10">
              <Clock3 className="h-4 w-4" />
              Burlington basement renovation guide
            </div>

            <h1 className="mt-6 text-4xl font-bold leading-tight md:text-6xl">
              Basement Renovation in Burlington
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300 md:text-xl">
              Burlington basements can start from very different places, from older
              homes that need retrofit planning to newer houses with unfinished
              lower levels. Cost, permits, and intended use all need to be aligned
              early.
            </p>

            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400">
              This guide explains how basement renovation planning works in
              Burlington, how pricing and permit scope connect, and what changes
              once the project moves from family-use space toward a legal basement
              path.
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
                to="/basement-renovation-cost-burlington"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-7 py-4 text-base font-semibold text-white transition hover:bg-white/10"
              >
                See Burlington basement costs
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-6 text-sm font-medium text-slate-300">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                Burlington-specific planning
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
                  Typical Burlington Basement Finish
                </div>
                <img
                  src="/images/ontarioreno/burlington-basement.jpg"
                  alt="Finished basement renovation in Burlington Ontario"
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
              Most Burlington basement projects become easier to manage once you
              separate three questions early: price, permit scope, and whether the
              basement may need to work as a legal unit later.
            </p>
            <ul className="mt-6 space-y-3 text-slate-700">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <span>
                  Want pricing first? Review the{' '}
                  <Link
                    to="/basement-renovation-cost-burlington"
                    className="font-semibold text-slate-900 underline underline-offset-4"
                  >
                    Burlington basement cost guide
                  </Link>
                  .
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <span>
                  Thinking about a legal unit? Compare the{' '}
                  <Link
                    to="/legal-basement-burlington"
                    className="font-semibold text-slate-900 underline underline-offset-4"
                  >
                    Burlington legal basement guide
                  </Link>
                  .
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <span>
                  Need permit clarity? Start with{' '}
                  <Link
                    to="/basement-permit-burlington"
                    className="font-semibold text-slate-900 underline underline-offset-4"
                  >
                    Burlington basement permits
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
                Why Burlington basement projects vary so much
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                Burlington includes a broader mix of housing stock than some nearby
                communities. Older homes can bring retrofit considerations like
                existing ceiling heights, service updates, and layout constraints,
                while newer homes may start with unfinished basements that still
                need a clear scope once rooms, bathrooms, or bedrooms are added.
              </p>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                If your first concern is budget, go to the{' '}
                <Link
                  to="/basement-renovation-cost-burlington"
                  className="font-semibold text-slate-900 underline underline-offset-4"
                >
                  basement renovation cost in Burlington
                </Link>{' '}
                page. If the real goal is a second unit, the{' '}
                <Link
                  to="/legal-basement-burlington"
                  className="font-semibold text-slate-900 underline underline-offset-4"
                >
                  legal basement Burlington
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
                    This route usually focuses on daily living space, storage,
                    recreation, and maybe a bathroom without full rental-unit
                    compliance.
                  </p>
                </div>
                <div className="rounded-2xl border border-[#1B3C6C]/20 bg-blue-50 p-6">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-6 w-6 text-[#1B3C6C]" />
                    <h3 className="text-xl font-bold text-slate-900">Legal second unit</h3>
                  </div>
                  <p className="mt-4 leading-7 text-slate-700">
                    This path usually needs more design detail, stronger permit
                    planning, and closer attention to City of Burlington and wider
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
                  'Bedroom layouts, window size, and egress assumptions',
                  'Whether the basement stays family-use or becomes rental-ready',
                  'Permit drawings and City of Burlington review scope',
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
                src="/images/ontarioreno/burlington.jpg"
                alt="Downtown Burlington Ontario streetscape"
                className="w-full object-cover"
              />
            </div>

            <div className="rounded-3xl border border-blue-200 bg-blue-50 p-8 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#1B3C6C]">
                Next move
              </p>
              <h2 className="mt-3 text-3xl font-bold text-slate-900">
                Most Burlington basements need better planning before quotes
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-700">
                Cleaner scope makes it easier to compare real pricing and avoid
                wrong assumptions about permits, retrofit issues, or legal-suite
                upgrades. If you want help sorting the right path, go to{' '}
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
                Need help comparing Burlington basement options?
              </h3>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                The right contractor fit matters more once pricing, retrofit scope,
                permits, and legal-suite planning begin overlapping.
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
                Burlington cluster
              </h3>
              <div className="mt-5 space-y-3 text-sm leading-7 text-slate-700">
                <Link
                  to="/basement-renovation-cost-burlington"
                  className="block font-semibold underline underline-offset-4"
                >
                  Basement renovation cost in Burlington
                </Link>
                <Link
                  to="/legal-basement-burlington"
                  className="block font-semibold underline underline-offset-4"
                >
                  Legal basement Burlington
                </Link>
                <Link
                  to="/basement-permit-burlington"
                  className="block font-semibold underline underline-offset-4"
                >
                  Basement permit Burlington
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
              Most Burlington basement projects follow a similar planning sequence
              even when the end use changes.
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
              Practical answers for Burlington homeowners planning basement work.
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
            Plan your Burlington basement with the right assumptions
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Pricing, retrofit scope, permits, and legal-suite planning all become
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
              to="/basement-renovation-cost-burlington"
              className="inline-flex items-center justify-center rounded-xl border border-white/20 px-8 py-4 text-base font-semibold text-white transition hover:bg-white/10"
            >
              See Burlington basement costs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
