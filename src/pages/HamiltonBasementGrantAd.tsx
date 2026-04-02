import HamiltonGrantCalculator from "../components/HamiltonGrantCalculator";
import { CheckCircle } from "lucide-react";

export default function HamiltonBasementGrantAd() {
  return (
    <main className="bg-white text-slate-900">
      {/* HERO */}
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-5xl px-6 py-16 text-center md:px-8 md:py-20">
          <p className="text-sm font-semibold uppercase tracking-wide text-yellow-400">
            Hamilton Basement Incentive Program
          </p>

          <h1 className="mt-4 text-3xl font-extrabold leading-tight md:text-5xl">
            Reduce Your Basement Cost by
            <br />
            Up to $40,000
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
            Most homeowners don’t realize this — the incentive isn’t automatic.
            It depends on how your basement project is structured.
          </p>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href="#calculator"
              className="rounded-xl bg-yellow-400 px-6 py-3 text-sm font-bold text-slate-900 transition hover:opacity-90"
            >
              See My Estimated Grant
            </a>

            <a
              href="/match"
              className="rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Get My Free Grant Assessment
            </a>
          </div>

          <p className="mt-4 text-center text-sm text-slate-300">
            <span className="inline-flex flex-wrap items-center justify-center gap-6">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                No obligation
              </span>

              <span className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                Local experts
              </span>

              <span className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                Real numbers
              </span>
            </span>
          </p>

          <p className="mt-3 text-xs font-medium tracking-wide text-slate-300">
            City of Hamilton–backed incentive program. Subject to approval,
            eligibility, and available funding.
          </p>
        </div>
      </section>

      {/* CALCULATOR */}
      <section id="calculator" className="bg-slate-50">
        <div className="mx-auto max-w-5xl px-6 py-14 md:px-8">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-extrabold md:text-3xl">
              See What Your Basement Could Qualify For
            </h2>
            <p className="mt-3 text-lg text-slate-600">
              Based on typical project structures. Final amounts depend on
              approved eligible costs.
            </p>
          </div>

          <HamiltonGrantCalculator />

          <div className="mt-8 text-center">
            <p className="text-lg font-medium text-slate-700">
              Want exact numbers for your home?
            </p>

            <a
              href="/match"
              className="mt-4 inline-flex rounded-xl bg-yellow-400 px-6 py-3 text-sm font-bold text-slate-900 transition hover:opacity-90"
            >
              Get My Free Grant Assessment
            </a>

            <p className="mt-3 text-xs text-slate-500">
              Best suited for homeowners planning a full legal basement unit.
            </p>
          </div>
        </div>
      </section>

      {/* WHY PEOPLE MISS OUT */}
      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16 md:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-extrabold md:text-4xl">
              Why Most Homeowners Don’t Get the Full $40,000
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
              <h3 className="text-lg font-bold text-red-700">
                ❌ Too Much Goes to Non-Eligible Work
              </h3>
              <p className="mt-3 text-slate-700">
                If your budget includes too many non-eligible items, your grant
                amount drops significantly.
              </p>
            </div>

            <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
              <h3 className="text-lg font-bold text-red-700">
                ❌ Not Designed as a Legal Unit
              </h3>
              <p className="mt-3 text-slate-700">
                Without proper layout, the project may not qualify at all.
              </p>
            </div>

            <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
              <h3 className="text-lg font-bold text-red-700">
                ❌ Planning Happens Too Late
              </h3>
              <p className="mt-3 text-slate-700">
                By the time most people think about the incentive, the structure
                is already wrong.
              </p>
            </div>
          </div>

          <div className="mx-auto mt-10 max-w-2xl text-center">
            <p className="text-xl font-semibold text-slate-900">
              This can cost you tens of thousands.
            </p>
          </div>
        </div>
      </section>

      {/* EXAMPLE */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-4xl px-6 py-14 text-center md:px-8">
          <h2 className="text-2xl font-extrabold md:text-3xl">
            A Typical Example
          </h2>

          <p className="mt-3 text-slate-600">
            Based on a project where most construction costs qualify
          </p>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-lg text-slate-700">A properly structured</p>

            <p className="mt-2 text-3xl font-extrabold text-slate-900">
              $75,000 basement project
            </p>

            <p className="mt-4 text-lg text-slate-600">could receive up to</p>

            <p className="mt-2 text-4xl font-extrabold text-green-600">
              $40,000
            </p>

            <p className="mt-3 text-sm text-slate-500">
              Based on typical eligible cost breakdowns.
            </p>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-5xl px-6 py-16 text-center md:px-8">
          <h2 className="text-3xl font-extrabold md:text-4xl">
            Find Out What Your Home Qualifies For
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
            We’ll help you understand your numbers, structure your project
            properly, and avoid leaving money on the table.
          </p>

          <p className="mt-4 text-xs font-medium tracking-wide text-slate-300">
            Funding is limited and approval-based.
          </p>

          <div className="mt-8">
            <a
              href="/match"
              className="inline-flex rounded-xl bg-yellow-400 px-8 py-4 text-base font-bold text-slate-900 transition hover:opacity-90"
            >
              Get My Free Grant Assessment
            </a>
          </div>
        </div>
      </section>

      {/* SHORT FOOTER FOR AD PAGE */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-6 py-8 text-center md:px-8">
          <p className="text-sm font-semibold text-slate-900">OntarioReno</p>
          <p className="max-w-2xl text-sm text-slate-500">
            Helping homeowners understand legal basement units, renovation
            planning, and available incentive opportunities.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-500">
            <a href="/privacy-policy" className="hover:text-slate-900">
              Privacy Policy
            </a>
            <a href="/terms" className="hover:text-slate-900">
              Terms
            </a>
            <a href="mailto:info@ontarioreno.ca" className="hover:text-slate-900">
              info@ontarioreno.ca
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
