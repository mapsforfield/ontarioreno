import { Helmet } from 'react-helmet-async';
import HamiltonGrantCalculator from "../components/HamiltonGrantCalculator";

export default function HamiltonGrant() {
  return (
    <main className="bg-white text-slate-900">
      <Helmet>
        <title>Hamilton Basement Grant (Up to $40,000) | Legal Secondary Suite Incentive</title>
        <meta
          name="description"
          content="Hamilton homeowners can receive up to $40,000 in grant funding (not a loan) to build a legal basement apartment or secondary suite. Check eligibility and estimate your grant."
        />
        <link rel="canonical" href="https://ontarioreno.ca/hamilton-grant-guide" />
      </Helmet>

      {/* HERO */}
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-8 md:py-24">
          <div className="max-w-4xl">

            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-yellow-400">
              Hamilton Basement Grant
            </p>

            <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">
              Hamilton Basement Grant (Up to $40,000 for Legal Secondary Suites)
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300 md:text-xl">
              Homeowners in Hamilton can receive up to <strong>$40,000 in grant funding</strong> — not a loan — to build a legal basement apartment or secondary suite.
            </p>

            {/* TRUST STRIP */}
            <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-300">
              <span>✔ City-backed program</span>
              <span>✔ No repayment required</span>
              <span>✔ Applies to legal rental units</span>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="/match"
                className="rounded-xl bg-yellow-400 px-6 py-3 text-sm font-bold text-slate-900 transition hover:opacity-90"
              >
                Check If You Qualify for the $40K Grant
              </a>

              <a
                href="#calculator"
                className="rounded-xl border border-white/20 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Estimate Your Grant
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-10 md:grid-cols-3 md:px-8">
          <div className="rounded-2xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase text-slate-500">Maximum Grant</p>
            <p className="mt-2 text-3xl font-extrabold">$40,000</p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase text-slate-500">Coverage</p>
            <p className="mt-2 text-3xl font-extrabold">70%</p>
            <p className="mt-1 text-sm text-slate-600">of eligible construction costs</p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase text-slate-500">Best Fit</p>
            <p className="mt-2 text-3xl font-extrabold">Legal Basement Units</p>
          </div>
        </div>
      </section>

      {/* CALCULATOR */}
      <section id="calculator" className="bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-8 md:py-20">

          <div className="mb-10 max-w-4xl">
            <h2 className="text-3xl font-extrabold md:text-5xl">
              See How Much of Your Basement Could Be Covered
            </h2>

            <p className="mt-4 text-lg text-slate-600">
              In 30 seconds, estimate how much grant funding your project could realistically qualify for.
            </p>
          </div>

          <HamiltonGrantCalculator />

          {/* POST CALC CTA */}
          <div className="mt-10 text-center">
            <a
              href="/match"
              className="inline-flex rounded-xl bg-green-600 px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
            >
              Lock In Your Eligibility Review
            </a>
          </div>

        </div>
      </section>

      {/* TRUST + CLARITY */}
      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16 md:px-8">
          <h2 className="text-3xl font-extrabold text-center mb-6">
            Is the Hamilton Basement Grant Real?
          </h2>

          <p className="text-center text-lg text-slate-600">
            Yes — this is a real City of Hamilton incentive program. It is <strong>not a loan</strong>, and homeowners may receive up to $40,000 depending on how their basement project is structured and approved.

            Not every finished basement qualifies, however. To understand what the program is actually looking for, see what counts as a{" "}
            <a href="/hamilton-secondary-suite-grant" className="font-semibold underline underline-offset-4">
              legal secondary suite in Hamilton
            </a>.
          </p>
        </div>
      </section>

      {/* MISTAKES SECTION */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">

          <h2 className="text-3xl font-extrabold text-center md:text-5xl">
            Why Most Homeowners Lose Out on the Full $40,000
          </h2>

          <div className="mt-10 grid gap-6 md:grid-cols-3">

            <div className="rounded-xl border p-5">
              <p className="font-bold">❌ Designing first</p>
              <p className="text-sm text-slate-600 mt-2">
                Layout decisions made too early can reduce eligibility.
              </p>
            </div>

            <div className="rounded-xl border p-5">
              <p className="font-bold">❌ Wrong cost assumptions</p>
              <p className="text-sm text-slate-600 mt-2">
                Not all renovation costs count toward the grant.
              </p>
            </div>

            <div className="rounded-xl border p-5">
              <p className="font-bold">❌ Expecting max payout</p>
              <p className="text-sm text-slate-600 mt-2">
                The full $40K requires proper planning and structure.
              </p>
            </div>

          </div>

          <p className="text-center mt-8 font-semibold text-xl">
            The difference can be tens of thousands of dollars.

            If you're planning a basement renovation specifically, see how the{" "}
            <a href="/hamilton-basement-grant" className="underline underline-offset-4">
              Hamilton basement grant works
            </a>{" "}
            and how homeowners typically structure their projects.
          </p>

        </div>
      </section>

      {/* AUTHORITY BLOCK */}
      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16 text-center">
          <h2 className="text-3xl font-extrabold">
            We Structure Your Project to Maximize the Grant
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            OntarioReno helps homeowners plan legal basement units specifically around grant eligibility — not after the fact.
          </p>

          <div className="mt-8">
            <a
              href="/match"
              className="inline-flex rounded-xl bg-yellow-400 px-6 py-3 text-sm font-bold text-slate-900"
            >
              Check Your Eligibility Now
            </a>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-8">

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">

            <h2 className="text-3xl font-extrabold">
              Don’t Miss Out on Up to $40,000 in Grant Funding
            </h2>

            <p className="mt-4 text-lg text-slate-300">
              Eligibility depends on how your project is planned. Check before you build.
            </p>

            <div className="mt-8">
              <a
                href="/match"
                className="inline-flex rounded-xl bg-yellow-400 px-6 py-3 text-sm font-bold text-slate-900"
              >
                Check If You Qualify
              </a>
            </div>

          </div>

        </div>
      </section>
    </main>
  );
}