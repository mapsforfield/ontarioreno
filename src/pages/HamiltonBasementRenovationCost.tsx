import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, CircleDollarSign, Home, ShieldCheck } from 'lucide-react';

const costBreakdown = [
  {
    title: 'Basic basement finish',
    range: '$45K-$60K',
    detail:
      'Usually fits a simpler family-use basement with standard finishes, a straightforward layout, and limited plumbing changes.',
    icon: Home,
  },
  {
    title: 'Standard family basement',
    range: '$60K-$75K',
    detail:
      'Often includes a bathroom, a more finished living layout, better material selections, and more coordination around mechanicals.',
    icon: CircleDollarSign,
  },
  {
    title: 'Legal secondary suite',
    range: '$75K-$90K+',
    detail:
      'Costs rise when the project is designed as a legal rental unit with permit-heavy work, code upgrades, and often a separate entrance.',
    icon: ShieldCheck,
  },
];

const costDrivers = [
  'Size of the basement',
  'Layout complexity',
  'Permits and design work',
  'Separate entrance requirements',
  'Fire code and suite-compliance upgrades',
];

export default function HamiltonBasementRenovationCost() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>Basement Renovation Cost in Hamilton (2026 Guide) | OntarioReno</title>
        <meta
          name="description"
          content="Learn the typical basement renovation cost in Hamilton, what drives pricing, how legal suite costs differ, and how financing or Hamilton grant options may fit your project."
        />
        <link
          rel="canonical"
          href="https://ontarioreno.ca/basement-renovation-cost-hamilton"
        />
      </Helmet>

      <section className="bg-slate-900 text-white">
        <div className="mx-auto grid max-w-7xl gap-14 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,1fr)_560px] lg:items-center lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/15 px-4 py-2 text-sm font-medium text-blue-200 ring-1 ring-white/10">
              <CircleDollarSign className="h-4 w-4" />
              Hamilton basement pricing guide
            </div>

            <h1 className="mt-6 text-4xl font-bold leading-tight md:text-6xl">
              Basement Renovation Cost in Hamilton{' '}
              <span className="text-[0.72em] align-middle text-slate-300">
                (2026 Guide)
              </span>
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300 md:text-xl">
              Understand what most basement renovations actually cost in Hamilton,
              and what drives the price.
            </p>

            <Link
              to="/hamilton-grant-guide"
              className="mt-5 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
            >
              Up to $40,000 available through Hamilton programs (see eligibility)
            </Link>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                to="/match"
                className="inline-flex items-center justify-center rounded-xl bg-[#1B3C6C] px-7 py-4 text-base font-bold text-white transition hover:bg-blue-700"
              >
                See what your project could look like
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/hamilton-grant-guide"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-7 py-4 text-base font-semibold text-white transition hover:bg-white/10"
              >
                Read the Hamilton Grant Guide
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-center lg:justify-end">
            <img
              src="/images/ontarioreno/hamilton-city.jpg"
              alt="Hamilton Ontario skyline and surrounding residential neighborhoods"
              className="aspect-[5/4] w-full rounded-[2rem] object-cover shadow-[0_30px_80px_rgba(15,23,42,0.18)]"
            />
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
              Most basement renovations in Hamilton typically fall around $45K-$90K+
            </h2>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              The range exists because some basements are simple finishes, while
              others involve bathrooms, structural changes, permit work, or full
              legal suite requirements that raise cost quickly.
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
              Most basement projects in Hamilton fall into one of these general
              ranges:
            </p>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              The fastest way to understand basement renovation cost in Hamilton is
              to separate a standard finish from a more polished renovation or a
              legal suite build.
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
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_520px] lg:items-center lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
              Where in Hamilton this applies
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Basement renovation costs can vary slightly depending on where you
              are in Hamilton, including areas like Hamilton Mountain, Stoney
              Creek, Ancaster, Dundas, and surrounding communities.
            </p>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              This guide reflects typical pricing across the broader Hamilton
              region, not just one neighborhood or housing type.
            </p>
          </div>

          <div className="flex items-center justify-center lg:justify-end">
            <img
              src="/images/ontarioreno/Hamilton.webp"
              alt="Map of Hamilton Ontario showing surrounding areas and city boundaries"
              className="aspect-[4/3] w-full max-w-[520px] rounded-[2rem] object-contain shadow-[0_24px_60px_rgba(15,23,42,0.12)]"
            />
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-blue-200 bg-blue-50 p-8 shadow-sm">
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
              Most homeowners don&apos;t pay this upfront
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-700">
              Many Hamilton basement projects are structured around monthly payments
              rather than full cash upfront. If you want to understand what that
              could look like, start with our guide to{' '}
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

      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-8 shadow-sm">
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
              Is there a grant in Hamilton?
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-700">
              Yes. Hamilton homeowners may be able to access up to $40K for a legal
              rental-unit project. If you are comparing pricing and incentives, read
              the full{' '}
              <Link
                to="/hamilton-grant-guide"
                className="font-semibold text-slate-900 underline underline-offset-4"
              >
                Hamilton grant guide
              </Link>{' '}
              or go straight to the{' '}
              <Link
                to="/hamilton-basement-grant"
                className="font-semibold text-slate-900 underline underline-offset-4"
              >
                Hamilton basement grant
              </Link>{' '}
              page.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-slate-900 py-20 text-white">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold md:text-5xl">
            See what your project could look like
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            If you want to compare scope, pricing direction, and the right next
            step, OntarioReno can help you understand the project and connect with
            the right contractor.
          </p>
          <div className="mt-8">
            <Link
              to="/match"
              className="inline-flex items-center justify-center rounded-xl bg-[#1B3C6C] px-8 py-4 text-base font-bold text-white transition hover:bg-blue-700"
            >
              See My Options
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


