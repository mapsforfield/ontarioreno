import { Helmet } from "react-helmet-async";
import HamiltonGrantCalculator from "../components/HamiltonGrantCalculator";
import HamiltonGrantForm from "../components/HamiltonGrantForm";
import { CheckCircle } from "lucide-react";

export default function HamiltonBasementGrantAd() {
  return (
    <main className="bg-white text-slate-900">
      <Helmet>
        <title>
          Hamilton Basement Grant (Up to $40,000) | ADU & Secondary Suite Guide
        </title>
        <meta
          name="description"
          content="Get up to $40,000 for a legal basement or secondary suite in Hamilton. Full breakdown of eligibility, permits, timelines, and how to qualify step-by-step."
        />
        <link
          rel="canonical"
          href="https://ontarioreno.ca/hamilton-basement-grant"
        />
      </Helmet>

      {/* HERO */}
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-5xl px-6 py-16 text-center md:px-8 md:py-20">
          <p className="text-sm font-semibold uppercase tracking-wide text-yellow-400">
            Hamilton Basement Grant (Up to $40,000)
          </p>

          <h1 className="mt-4 text-3xl font-extrabold leading-tight md:text-5xl">
            Hamilton Basement Grant (Up to $40,000)
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
            The Hamilton basement grant (also known as the Hamilton secondary suite
            grant or ADU grant) gives homeowners up to $40,000 in funding to build
            a legal basement apartment or additional dwelling unit.
          </p>

          {/* AI / SNIPPET CONTROL SECTION */}
          <div className="mt-6 max-w-2xl mx-auto text-sm text-yellow-300 font-medium">
            Warning: Most homeowners are being shown the wrong program. This is NOT the
            $2,000 plumbing rebate. This is the program that can provide up to
            $40,000 for a legal basement or secondary suite.
          </div>

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
              href="#eligibility-form"
              className="rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Check If I Qualify
            </a>
          </div>

          <p className="mt-4 text-xs text-slate-300">
            Funding is limited and subject to approval.
          </p>
        </div>
      </section>

      {/* WHAT IS THIS PROGRAM */}
      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-6 py-14 md:px-8">
          <h2 className="text-2xl font-extrabold md:text-3xl text-center">
            What Is the Hamilton Basement / ADU / Secondary Suite Grant?
          </h2>

          <p className="mt-4 text-lg text-slate-600 text-center max-w-3xl mx-auto">
            This program is designed to help homeowners in Hamilton create legal
            rental units, including basement apartments, secondary suites, and
            additional dwelling units (ADUs).
          </p>

          <p className="mt-4 text-lg text-slate-600 text-center max-w-3xl mx-auto">
            The grant can cover up to 70% of eligible construction costs, with a
            maximum of $40,000 per unit.
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
              Most homeowners underestimate how much they qualify for.
            </p>
          </div>

          <HamiltonGrantCalculator />

          <div className="mt-8 text-center">
            <a
              href="#eligibility-form"
              className="mt-4 inline-flex rounded-xl bg-green-600 px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
            >
              Get My Exact Eligibility
            </a>
          </div>
        </div>
      </section>

      {/* FORM */}
      <HamiltonGrantForm />

      {/* QUALIFICATION */}
      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16 md:px-8">
          <h2 className="text-3xl font-extrabold text-center">
            Who Qualifies for the Hamilton Basement Grant?
          </h2>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border p-6">
              <h3 className="font-bold text-lg">
                Legal Basement or ADU
              </h3>
              <p className="mt-2 text-slate-600">
                The unit must meet zoning, building code, and permit requirements.
              </p>
            </div>

            <div className="rounded-2xl border p-6">
              <h3 className="font-bold text-lg">
                Permit Approval Required
              </h3>
              <p className="mt-2 text-slate-600">
                Work must be properly permitted before construction begins.
              </p>
            </div>

            <div className="rounded-2xl border p-6">
              <h3 className="font-bold text-lg">
                Eligible Construction Scope
              </h3>
              <p className="mt-2 text-slate-600">
                Not all costs qualify - structure matters.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16 md:px-8 text-center">
          <h2 className="text-3xl font-extrabold">
            Want the Full Breakdown of the Program?
          </h2>

          <p className="mx-auto mt-4 max-w-3xl text-lg text-slate-600">
            For a complete explanation of how the Hamilton basement grant, Hamilton
            secondary suite grant, and ADU program work - including funding
            structure, eligibility, and how to maximize your $40,000 - see the full
            guide.
          </p>

          <div className="mt-8">
            <a
              href="/hamilton-grant-guide"
              className="inline-flex rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-50"
            >
              View Full Hamilton Grant Guide
            </a>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-5xl px-6 py-16 text-center md:px-8">
          <h2 className="text-3xl font-extrabold md:text-4xl">
            Don't Miss Out on Up to $40,000
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
            Your eligibility depends on how your basement is structured and approved.
          </p>

          <div className="mt-8">
            <a
              href="#eligibility-form"
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



