import { Helmet } from "react-helmet-async";
import HamiltonGrantCalculator from "../components/HamiltonGrantCalculator";
import { CheckCircle } from "lucide-react";

export default function HamiltonBasementGrantAd() {
  return (
    <main className="bg-white text-slate-900">
      <Helmet>
        <title>Hamilton Basement Grant (Up to $40,000) | Check Eligibility</title>
        <meta
          name="description"
          content="Hamilton homeowners can receive up to $40,000 in grant funding (not a loan) for a legal basement apartment. Estimate your grant and check eligibility."
        />
        <link rel="canonical" href="https://ontarioreno.ca/hamilton-basement-grant" />
      </Helmet>

      {/* HERO */}
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-5xl px-6 py-16 text-center md:px-8 md:py-20">

          <p className="text-sm font-semibold uppercase tracking-wide text-yellow-400">
            Hamilton Basement Grant Program
          </p>

          <h1 className="mt-4 text-3xl font-extrabold leading-tight md:text-5xl">
            Get Up to $40,000 Toward Your Basement Renovation
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
            This is a <strong>real City of Hamilton grant (not a loan)</strong> for homeowners building a legal basement apartment or secondary suite.

            Not sure what qualifies? See what counts as a{" "}
            <a href="/hamilton-secondary-suite-grant" className="font-semibold underline underline-offset-4">
              legal secondary suite in Hamilton
            </a>.
          </p>

          {/* TRUST STRIP */}
          <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm text-slate-300">
            <span className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              No repayment required
            </span>

            <span className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              City-backed program
            </span>

            <span className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              Applies to legal units
            </span>
          </div>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
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
              Check If I Qualify
            </a>
          </div>

          {/* URGENCY */}
          <p className="mt-4 text-xs text-slate-300">
            Funding is limited and subject to approval. Delays can impact eligibility.
          </p>

        </div>
      </section>

      {/* CALCULATOR */}
      <section id="calculator" className="bg-slate-50">
        <div className="mx-auto max-w-5xl px-6 py-14 md:px-8">

          <div className="mb-8 text-center">
            <h2 className="text-2xl font-extrabold md:text-3xl">
              See How Much You Could Receive
            </h2>

            <p className="mt-3 text-lg text-slate-600">
              Based on typical project structures. Most homeowners underestimate how much they qualify for.
            </p>
          </div>

          <HamiltonGrantCalculator />

          <div className="mt-8 text-center">
            <p className="text-lg font-medium text-slate-700">
              Want exact numbers for your home?
            </p>

            <a
              href="/match"
              className="mt-4 inline-flex rounded-xl bg-green-600 px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
            >
              Lock In My Eligibility Review
            </a>

            <p className="mt-3 text-xs text-slate-500">
              Best suited for homeowners planning a legal basement unit
            </p>
          </div>

        </div>
      </section>

      {/* LOSS SECTION */}
      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16 md:px-8">

          <div className="mb-10 text-center">
            <h2 className="text-3xl font-extrabold md:text-4xl">
              Why Most Homeowners Miss Out on the Full $40,000
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">

            <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
              <h3 className="text-lg font-bold text-red-700">
                ❌ Too Much Non-Eligible Work
              </h3>
              <p className="mt-3 text-slate-700">
                Not all renovation costs qualify — this reduces your payout fast.
              </p>
            </div>

            <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
              <h3 className="text-lg font-bold text-red-700">
                ❌ Wrong Layout
              </h3>
              <p className="mt-3 text-slate-700">
                Without proper legal design, the project may not qualify at all.
              </p>
            </div>

            <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
              <h3 className="text-lg font-bold text-red-700">
                ❌ Planning Too Late
              </h3>
              <p className="mt-3 text-slate-700">
                By the time most people learn about the grant, it’s already too late to optimize.
              </p>
            </div>

          </div>

          <p className="text-center mt-10 text-xl font-semibold">
            This mistake can cost you tens of thousands.

            If you want a full breakdown of how the program works, read the{" "}
            <a href="/hamilton-grant-guide" className="underline underline-offset-4">
              complete Hamilton grant guide
            </a>.
          </p>

        </div>
      </section>

      {/* EXAMPLE */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-4xl px-6 py-14 text-center md:px-8">

          <h2 className="text-2xl font-extrabold md:text-3xl">
            Real Example
          </h2>

          <p className="mt-3 text-slate-600">
            When a project is structured correctly
          </p>

          <div className="mt-8 rounded-2xl border bg-white p-8 shadow-sm">

            <p className="text-lg text-slate-700">
              A properly structured
            </p>

            <p className="mt-2 text-3xl font-extrabold">
              $75,000 basement project
            </p>

            <p className="mt-4 text-lg text-slate-600">
              could receive up to
            </p>

            <p className="mt-2 text-4xl font-extrabold text-green-600">
              $40,000
            </p>

            <p className="mt-3 text-sm text-slate-500">
              depending on eligible costs and approval
            </p>

          </div>

        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-5xl px-6 py-16 text-center md:px-8">

          <h2 className="text-3xl font-extrabold md:text-4xl">
            Don’t Risk Missing Out on $40,000
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
            Your eligibility depends on how your basement is planned. Check before you build.
          </p>

          <div className="mt-8">
            <a
              href="/match"
              className="inline-flex rounded-xl bg-yellow-400 px-8 py-4 text-base font-bold text-slate-900 transition hover:opacity-90"
            >
              Check If I Qualify
            </a>
          </div>

        </div>
      </section>

    </main>
  );
}