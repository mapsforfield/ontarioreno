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
      'The first question is whether the basement stays family-use, adds plumbing, changes layout, or moves toward a legal unit.',
  },
  {
    step: '02',
    title: 'Check permit triggers',
    detail:
      'City of Pickering permits are commonly triggered by walls, plumbing, electrical changes, bedrooms, and legal-suite work.',
  },
  {
    step: '03',
    title: 'Prepare drawings',
    detail:
      'Once a permit is required, the project usually needs permit-ready drawings and a clear scope before submission.',
  },
  {
    step: '04',
    title: 'Submit to Pickering',
    detail:
      'Your package moves through the City of Pickering building permit review process for municipal evaluation.',
  },
  {
    step: '05',
    title: 'Address revisions',
    detail:
      'If reviewers ask for updates, the file slows down until the corrections are complete and resubmitted clearly.',
  },
  {
    step: '06',
    title: 'Build after issuance',
    detail:
      'If a permit was required, construction should begin only after the permit is issued and inspections are lined up as needed.',
  },
];

const faqs = [
  {
    question: 'Do I need a permit to finish a basement in Pickering?',
    answer:
      'Often yes, especially if the work includes walls, plumbing, electrical changes, bedrooms, or layout changes beyond simple cosmetics.',
  },
  {
    question: 'Do newer Pickering homes avoid permit requirements?',
    answer:
      'No. Newer unfinished basements can simplify planning, but they do not remove the need for permits once real renovation work begins.',
  },
  {
    question: 'Do layouts and retrofits affect Pickering permit planning?',
    answer:
      'They can. Older homes may raise more questions about existing conditions and room planning, while newer homes still need clear permit scope once plumbing, bedrooms, or suites are added.',
  },
  {
    question: 'Is a legal basement apartment reviewed differently?',
    answer:
      'Yes. Once the basement is being planned as a second unit, the permit and compliance review usually becomes more detailed.',
  },
  {
    question: 'What causes the biggest permit delays in Pickering?',
    answer:
      'Unclear scope, incomplete drawings, layout questions, retrofit details, and slow revision responses cause most delays.',
  },
];

export default function PickeringBasementPermit() {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>Basement Permit in Pickering | OntarioReno</title>
        <meta
          name="description"
          content="Learn when a basement permit is required in Pickering, what usually triggers City of Pickering review, and how permits connect to legal basement planning."
        />
        <link
          rel="canonical"
          href="https://ontarioreno.ca/basement-permit-pickering"
        />
      </Helmet>

      <section className="bg-slate-900 text-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-center lg:px-8 lg:py-24">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/15 px-4 py-2 text-sm font-medium text-blue-200 ring-1 ring-white/10">
              <Clock3 className="h-4 w-4" />
              Pickering basement permit guide
            </div>

            <h1 className="mt-6 text-4xl font-bold leading-tight md:text-6xl">
              Basement Permit in Pickering
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300 md:text-xl">
              In many cases, yes. If you are finishing a basement in Pickering
              and adding walls, plumbing, electrical, or planning a legal unit,
              a permit is usually part of the job.
            </p>

            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400">
              This guide explains the basement permit Pickering homeowners
              commonly need, what work usually triggers City of Pickering
              review, and how permit scope changes planning and price.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                to="/match"
                className="inline-flex items-center justify-center rounded-xl bg-[#1B3C6C] px-7 py-4 text-base font-bold text-white transition hover:bg-blue-700"
              >
                Check your project scope
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/legal-basement-pickering"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-7 py-4 text-base font-semibold text-white transition hover:bg-white/10"
              >
                Read the legal basement guide
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-6 text-sm font-medium text-slate-300">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                Permit-focused
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                City of Pickering relevant
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                Built for homeowners planning ahead
              </span>
            </div>

            <p className="mt-6 text-sm text-slate-400">Last updated: {lastUpdated}</p>
          </div>

          <div className="flex items-center justify-center lg:justify-end lg:translate-y-4">
            <div className="relative w-full max-w-[500px] rounded-[2rem] bg-white/6 p-4 ring-1 ring-white/10">
              <div className="pointer-events-none absolute inset-6 rounded-[1.75rem] bg-black/10 blur-2xl" />
              <div className="relative">
                <div className="absolute left-4 top-4 z-10 rounded-full border border-white/15 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                  Typical Pickering Basement Finish
                </div>
                <img
                  src="/images/ontarioreno/pickering-main-basement.png"
                  alt="Finished basement renovation in Pickering Ontario"
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
              Quick answer: when is a permit usually needed?
            </h2>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              The bigger the basement scope becomes, the more likely City of
              Pickering permits need to be part of the plan.
            </p>
            <ul className="mt-6 space-y-3 text-slate-700">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <span>
                  Simple finishing: permits are still common if walls, rooms,
                  or services are being changed.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <span>
                  Legal basement planning: permits are expected and usually
                  more detailed.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <span>
                  Need deeper cost context too? Review{' '}
                  <Link
                    to="/basement-renovation-cost-pickering"
                    className="font-semibold text-slate-900 underline underline-offset-4"
                  >
                    Pickering basement costs
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
                Direct answer: what work usually needs a permit?
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                Cosmetic updates may not need one. But if the project is
                changing rooms, adding plumbing, altering electrical, or
                building toward a legal unit, City of Pickering permits usually
                become part of the work. If you are still deciding between a
                simpler finish and a legal unit, compare the{' '}
                <Link
                  to="/legal-basement-pickering"
                  className="font-semibold text-slate-900 underline underline-offset-4"
                >
                  legal basement Pickering
                </Link>{' '}
                guide next.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-3xl font-bold text-slate-900">
                Family-use basement vs legal unit permit risk
              </h2>
              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-6">
                  <div className="flex items-center gap-3">
                    <Home className="h-6 w-6 text-slate-700" />
                    <h3 className="text-xl font-bold text-slate-900">Standard basement finishing</h3>
                  </div>
                  <p className="mt-4 leading-7 text-slate-600">
                    Permit needs are often simpler, but bathrooms, bedrooms, and
                    layout changes still matter.
                  </p>
                </div>
                <div className="rounded-2xl border border-[#1B3C6C]/20 bg-blue-50 p-6">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-6 w-6 text-[#1B3C6C]" />
                    <h3 className="text-xl font-bold text-slate-900">Legal basement unit</h3>
                  </div>
                  <p className="mt-4 leading-7 text-slate-700">
                    Once the basement is intended to function independently,
                    permit review usually becomes stricter and more detailed.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-3xl font-bold text-slate-900">
                What usually slows permit approval down
              </h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {[
                  'Unclear basement scope',
                  'Incomplete drawings',
                  'Missing plumbing or bedroom details',
                  'Slow revision responses',
                ].map((item) => (
                  <div key={item} className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
                    <p className="text-base leading-7 text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-lg leading-8 text-slate-600">
                If you want the full project view, go back to{' '}
                <Link
                  to="/basement-renovation-pickering"
                  className="font-semibold text-slate-900 underline underline-offset-4"
                >
                  basement renovation Pickering
                </Link>{' '}
                or compare pricing first on{' '}
                <Link
                  to="/basement-renovation-cost-pickering"
                  className="font-semibold text-slate-900 underline underline-offset-4"
                >
                  basement renovation cost Pickering
                </Link>
                .
              </p>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <img
                src="/images/ontarioreno/pickering-city.jpg"
                alt="Pickering Ontario cityscape"
                className="w-full object-cover"
              />
            </div>

            <div className="rounded-3xl border border-blue-200 bg-blue-50 p-8 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#1B3C6C]">
                Next move
              </p>
              <h2 className="mt-3 text-3xl font-bold text-slate-900">
                Most permit problems start before submission
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-700">
                The cleanest permit files usually come from clear scope,
                stronger drawings, and the right contractor fit before pricing
                gets locked in.
              </p>
              <div className="mt-6">
                <Link
                  to="/match"
                  className="inline-flex items-center justify-center rounded-[0.8rem] border border-slate-800 bg-[linear-gradient(180deg,#1f2937_0%,#0f172a_100%)] px-6 py-[0.95rem] text-base font-semibold tracking-[-0.015em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(15,23,42,0.05),0_14px_30px_rgba(15,23,42,0.18)] transition duration-200 hover:border-slate-700 hover:bg-[linear-gradient(180deg,#273244_0%,#111c31_100%)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_1px_2px_rgba(15,23,42,0.06),0_18px_36px_rgba(15,23,42,0.22)] active:bg-[linear-gradient(180deg,#111827_0%,#020617_100%)] active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
                >
                  Find the right team
                </Link>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl bg-slate-900 p-8 text-white shadow-xl">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-200">
                <Hammer className="h-7 w-7" />
              </div>
              <h3 className="mt-6 text-2xl font-bold">Need help getting permit-ready?</h3>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                Basement projects move better when scope, drawings, and
                contractor expectations are aligned early.
              </p>
              <Link
                to="/match"
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[#1B3C6C] px-5 py-4 text-center font-bold text-white transition hover:bg-blue-700"
              >
                Start project review
              </Link>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-2xl font-bold text-slate-900">Pickering cluster</h3>
              <div className="mt-5 space-y-3 text-sm leading-7 text-slate-700">
                <Link
                  to="/basement-renovation-pickering"
                  className="block font-semibold underline underline-offset-4"
                >
                  Basement renovation Pickering
                </Link>
                <Link
                  to="/basement-renovation-cost-pickering"
                  className="block font-semibold underline underline-offset-4"
                >
                  Basement renovation cost Pickering
                </Link>
                <Link
                  to="/legal-basement-pickering"
                  className="block font-semibold underline underline-offset-4"
                >
                  Legal basement Pickering
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
              Permit breakdown, step by step
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Once the scope clearly needs a permit, most Pickering basement
              files move through the same sequence.
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
              Direct answers for Pickering homeowners planning basement work.
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
            Confirm permit requirements before construction starts
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            The right scope and the right team can prevent expensive basement
            permit mistakes later.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              to="/match"
              className="inline-flex items-center justify-center rounded-xl bg-[#1B3C6C] px-8 py-4 text-base font-bold text-white transition hover:bg-blue-700"
            >
              Find the right team
            </Link>
            <Link
              to="/legal-basement-pickering"
              className="inline-flex items-center justify-center rounded-xl border border-white/20 px-8 py-4 text-base font-semibold text-white transition hover:bg-white/10"
            >
              Review legal basement planning
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
