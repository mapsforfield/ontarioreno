import { Helmet } from "react-helmet-async";
import HamiltonGrantCalculator from "../components/HamiltonGrantCalculator";
import HamiltonGrantForm from "../components/HamiltonGrantForm";

export default function HamiltonGrant() {
  return (
    <main className="bg-white text-slate-900">
      <Helmet>
        <title>
          Hamilton $40,000 Basement Grant (2026) - Who Actually Qualifies?
        </title>
        <meta
          name="description"
          content="Get up to $40,000 to build a legal basement suite in Hamilton. See who qualifies, real costs, and exactly how to apply step-by-step."
        />
        <link
          rel="canonical"
          href="https://ontarioreno.ca/hamilton-grant-guide"
        />
      </Helmet>

      {/* HERO */}
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-8 md:py-24">
          <div className="max-w-4xl">
            <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">
              Hamilton $40,000 Basement Grant (2026) - Who Actually Qualifies?
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300 md:text-xl">
              Hamilton homeowners can receive up to $40,000 in funding to build a legal basement suite through the city's ADU and secondary suite programs.
            </p>

            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300 md:text-xl">
              This guide breaks down exactly who qualifies, what costs are covered, and how to apply step-by-step - based on real program rules and requirements.
            </p>

            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300 md:text-xl">
              If you're planning to finish your basement into a legal rental unit, this is everything you need to know before getting started.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="/hamilton-basement-grant"
                className="rounded-xl bg-yellow-400 px-6 py-3 text-sm font-bold text-slate-900 transition hover:opacity-90"
              >
                See How the Hamilton Basement Grant Works
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

      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-6 py-14 md:px-8">
          <h2 className="text-2xl font-extrabold text-center md:text-3xl">
            Hamilton Secondary Suite Grant & Basement Grant Overview
          </h2>

          <p className="mt-4 max-w-3xl mx-auto text-center text-lg text-slate-600">
            The Hamilton secondary suite grant, Hamilton basement grant, and ADU grant
            all refer to the same program offering up to <strong>$40,000</strong> to
            help homeowners build a legal rental unit.
          </p>
        </div>
      </section>

      {/* WHAT IS PROGRAM */}
      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-6 py-14 md:px-8">
          <h2 className="text-2xl font-extrabold md:text-3xl text-center">
            What Is the Hamilton Basement / ADU / Secondary Suite Grant?
          </h2>

          <p className="mt-4 text-lg text-slate-600 text-center max-w-3xl mx-auto">
            This program is designed to increase housing supply by helping homeowners
            create legal rental units such as basement apartments, secondary suites,
            and additional dwelling units (ADUs).
          </p>

          <p className="mt-4 text-lg text-slate-600 text-center max-w-3xl mx-auto">
            It can cover up to 70% of eligible construction costs, with a maximum
            grant of $40,000 per unit.
          </p>
        </div>
      </section>

      {/* CALCULATOR */}
      <section id="calculator" className="bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-8 md:py-20">
          <div className="mb-10 max-w-4xl">
            <h2 className="text-3xl font-extrabold md:text-5xl">
              Estimate Your Potential Grant
            </h2>

            <p className="mt-4 text-lg text-slate-600">
              In under a minute, see how much your project could qualify for.
            </p>
          </div>

          <HamiltonGrantCalculator />

          <div className="mt-10 text-center">
            <a
              href="#eligibility-form"
              className="inline-flex rounded-xl bg-green-600 px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
            >
              Get My Exact Eligibility
            </a>
          </div>
        </div>
      </section>

      {/* FORM */}
      <HamiltonGrantForm />

      {/* QUALIFICATIONS */}
      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16 md:px-8">
          <h2 className="text-3xl font-extrabold text-center">
            Who Qualifies for the Hamilton Basement Grant?
          </h2>

          <p className="mt-4 text-center text-lg text-slate-600">
            Eligibility depends on zoning, permits, and how the unit is built.
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border p-6">
              <h3 className="font-bold">Legal Unit Required</h3>
              <p className="mt-2 text-slate-600">
                Must meet building code and zoning requirements.
              </p>
            </div>

            <div className="rounded-2xl border p-6">
              <h3 className="font-bold">Permit-Based Work</h3>
              <p className="mt-2 text-slate-600">
                Permits must be approved before construction begins.
              </p>
            </div>

            <div className="rounded-2xl border p-6">
              <h3 className="font-bold">Eligible Cost Structure</h3>
              <p className="mt-2 text-slate-600">
                Only certain construction costs qualify toward the grant.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* INTERNAL AUTHORITY PUSH */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-5xl px-6 py-16 md:px-8 text-center">
          <h2 className="text-3xl font-extrabold">
            Planning a Basement Specifically?
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            If you're focused on building a legal basement apartment, see the full breakdown of the{" "}
            <a
              href="/hamilton-basement-grant"
              className="font-semibold underline underline-offset-4"
            >
              Hamilton Basement Grant
            </a>{" "}
            including structure, eligibility, and real examples. If you are
            still comparing budget first, review our{" "}
            <a
              href="/basement-renovation-cost-hamilton"
              className="font-semibold underline underline-offset-4"
            >
              basement renovation pricing in Hamilton
            </a>.
          </p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-8">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
            <h2 className="text-3xl font-extrabold">
              Don't Miss Out on Up to $40,000
            </h2>

            <p className="mt-4 text-lg text-slate-300">
              Your eligibility depends on how your project is structured. Check before you build.
            </p>

            <div className="mt-8">
              <a
                href="#eligibility-form"
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



