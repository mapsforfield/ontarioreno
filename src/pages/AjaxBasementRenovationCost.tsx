import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, CircleDollarSign, Home, ShieldCheck } from 'lucide-react';

const costBreakdown = [
  {
    title: 'Basic basement finish',
    range: '$45K-$60K',
    detail:
      'Often fits a simpler family-use basement with standard finishes, lighter layout changes, and limited plumbing work.',
    icon: Home,
  },
  {
    title: 'Standard family basement',
    range: '$60K-$75K',
    detail:
      'Usually includes a bathroom, more complete living space, better finish selections, and more coordination around layout and existing services.',
    icon: CircleDollarSign,
  },
  {
    title: 'Legal secondary suite',
    range: '$75K-$90K+',
    detail:
      'Pricing rises once the basement is designed as a legal rental unit with permit-heavy work, code upgrades, and often a separate entrance.',
    icon: ShieldCheck,
  },
];

const costDrivers = [
  'Basement size and existing layout',
  'Bathroom or kitchenette additions',
  'Town of Ajax permits and drawings',
  'Separate entrance requirements',
  'Fire code and legal-suite upgrades',
];

export default function AjaxBasementRenovationCost() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>Basement Renovation Cost in Ajax (2026 Guide) | OntarioReno</title>
        <meta
          name="description"
          content="Learn the typical basement renovation cost in Ajax, what drives pricing in older and newer homes, and how legal suite work changes the budget."
        />
        <link
          rel="canonical"
          href="https://ontarioreno.ca/basement-renovation-cost-ajax"
        />
      </Helmet>

      <section className="bg-slate-900 text-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-center lg:px-8 lg:py-24">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/15 px-4 py-2 text-sm font-medium text-blue-200 ring-1 ring-white/10">
              <CircleDollarSign className="h-4 w-4" />
              Ajax basement pricing guide
            </div>

            <h1 className="mt-6 text-4xl font-bold leading-tight md:text-6xl">
              Basement Renovation Cost in Ajax
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300 md:text-xl">
              Understand what most basement renovations actually cost in Ajax, and
              why price changes once layout challenges, retrofit work, permits,
              bathrooms, or legal-suite planning enter the scope.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                to="/match"
                className="inline-flex items-center justify-center rounded-xl bg-[#1B3C6C] px-7 py-4 text-base font-bold text-white transition hover:bg-blue-700"
              >
                See what your project could look like
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/basement-renovation-ajax"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-7 py-4 text-base font-semibold text-white transition hover:bg-white/10"
              >
                Read the Ajax renovation guide
              </Link>
            </div>
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
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Typical range
            </p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl">
              Most basement renovations in Ajax typically fall around $45K-$90K+
            </h2>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              The range exists because Ajax homes vary in age, basement layout,
              and retrofit needs. Layout changes, bathrooms, legal-suite work, and
              permit-heavy scope can all raise the budget quickly.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
              Cost breakdown
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Most basement projects in Ajax fall into one of these general ranges:
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {costBreakdown.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className="mt-6 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {item.title}
                  </p>
                  <p className="mt-3 text-3xl font-bold text-slate-900">{item.range}</p>
                  <p className="mt-4 text-base leading-7 text-slate-600">{item.detail}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
              What drives cost
            </h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {costDrivers.map((item) => (
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
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-blue-200 bg-blue-50 p-8 shadow-sm">
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
              Most homeowners don&apos;t pay this upfront
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-700">
              Many Ajax basement projects are structured around monthly payments
              rather than full cash upfront. If you want to see what that can look
              like, start with our guide to{' '}
              <Link
                to="/financing"
                className="font-semibold text-slate-900 underline underline-offset-4"
              >
                renovation financing
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-4">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <img
              src="/images/ontarioreno/ajax-signage.jpg"
              alt="Ajax Ontario city signage"
              className="w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
              Related Ajax pages
            </h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Link
                to="/basement-renovation-ajax"
                className="rounded-2xl bg-slate-50 p-5 font-semibold text-slate-900 underline underline-offset-4"
              >
                Basement renovation Ajax
              </Link>
              <Link
                to="/legal-basement-ajax"
                className="rounded-2xl bg-slate-50 p-5 font-semibold text-slate-900 underline underline-offset-4"
              >
                Legal basement Ajax
              </Link>
              <Link
                to="/basement-permit-ajax"
                className="rounded-2xl bg-slate-50 p-5 font-semibold text-slate-900 underline underline-offset-4"
              >
                Basement permit Ajax
              </Link>
              <Link
                to="/costs"
                className="rounded-2xl bg-slate-50 p-5 font-semibold text-slate-900 underline underline-offset-4"
              >
                Ontario renovation costs
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-900 py-20 text-white">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold md:text-5xl">
            See what your project could look like
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            If you want to compare pricing direction, layout scope, and the right
            next step, OntarioReno can help.
          </p>
          <div className="mt-8">
            <Link
              to="/match"
              className="inline-flex items-center justify-center rounded-xl bg-[#1B3C6C] px-8 py-4 text-base font-bold text-white transition hover:bg-blue-700"
            >
              See my options
            </Link>
            <p className="mt-4 text-sm text-slate-400">
              Takes less than a minute - No obligation
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}


