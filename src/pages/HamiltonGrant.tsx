import HamiltonGrantCalculator from "../components/HamiltonGrantCalculator";

export default function HamiltonGrant() {
  return (
    <main className="bg-white text-slate-900">
      {/* Hero */}
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-8 md:py-24">
          <div className="max-w-4xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-yellow-400">
              Hamilton Basement Grant Guide
            </p>
            <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">
              Build a Legal Basement Apartment in Hamilton and Get Up to $40,000 in Grant Funding
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300 md:text-xl">
              Understand how the grant works, what costs usually qualify, and
              how much your basement project could realistically receive.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="/match"
                className="rounded-xl bg-yellow-400 px-6 py-3 text-sm font-bold text-slate-900 transition hover:opacity-90"
              >
                See If Your Basement Could Qualify
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

      {/* Quick stats */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-10 md:grid-cols-3 md:px-8">
          <div className="rounded-2xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Maximum Grant
            </p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">
              $40,000
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Coverage
            </p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">70%</p>
            <p className="mt-1 text-sm text-slate-600">
              of eligible construction costs
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Best Fit
            </p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">
              Legal Basement Units
            </p>
          </div>
        </div>

        {/* Trust anchor */}
        <div className="mx-auto max-w-4xl px-6 pb-10 text-center md:px-8">
          <p className="text-sm font-medium tracking-wide text-slate-400">
            This City of Hamilton–backed incentive program is subject to approval, eligibility, and available funding.
          </p>
        </div>
      </section>

      {/* Calculator */}
      <section id="calculator" className="bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-8 md:py-20">
          <div className="mb-10 max-w-4xl">
            <h2 className="text-3xl font-extrabold md:text-5xl">
              Estimate Your Hamilton Grant
            </h2>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600 md:text-xl">
              Based on typical project structures where a large portion of construction costs qualify. Final grant amounts depend on approved eligible costs.
            </p>
          </div>

          <HamiltonGrantCalculator />
        </div>
      </section>

      {/* Unlock section */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold text-slate-900 md:text-5xl">
              How to Actually Unlock the Full $40,000
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-slate-600 md:text-xl">
              The grant is not automatic. The total you receive depends on how
              much of the project actually qualifies and how well the basement
              is planned from the start.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 p-7 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900">
                1. Enough Eligible Construction
              </h3>
              <p className="mt-3 text-base leading-7 text-slate-600">
                The program covers up to 70% of qualifying construction work. If
                too much of the budget goes to non-eligible items, the grant
                total drops quickly.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-7 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900">
                2. Proper Legal Layout
              </h3>
              <p className="mt-3 text-base leading-7 text-slate-600">
                Your basement needs the right legal setup, including the type of
                work tied to the permit and the features required for a legal
                secondary unit.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-7 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900">
                3. Smart Planning From Day One
              </h3>
              <p className="mt-3 text-base leading-7 text-slate-600">
                The biggest mistake homeowners make is designing first and
                thinking about the grant later. By then, money is often already
                left on the table.
              </p>
            </div>
          </div>

          <div className="my-14 h-px bg-slate-200"></div>

          <div className="mx-auto max-w-4xl text-center">
            <h3 className="text-2xl font-extrabold text-slate-900 md:text-3xl">
              Where Most Homeowners Lose Money
            </h3>

            <p className="mt-4 text-lg leading-8 text-slate-700">
              Most people assume they’ll automatically receive $40,000 — but
              that’s not how the program works.
            </p>

            <div className="mt-8 grid gap-4 text-left md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="font-semibold text-slate-900">❌ Designing first</p>
                <p className="mt-2 text-sm text-slate-600">
                  Planning the layout without considering the grant often leads
                  to missed eligibility.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <p className="font-semibold text-slate-900">
                  ❌ Misunderstanding costs
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Not all renovation costs qualify, which can reduce the grant
                  significantly.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <p className="font-semibold text-slate-900">
                  ❌ Assuming max payout
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  The full $40K only happens when the project is structured
                  properly.
                </p>
              </div>
            </div>

            <p className="mt-8 text-xl font-semibold text-slate-900 md:text-2xl">
              The difference can be tens of thousands of dollars.
            </p>
          </div>

          <div className="mt-16 rounded-3xl bg-slate-900 p-8 text-center text-white md:p-10">
            <h3 className="text-2xl font-extrabold md:text-3xl">
              This is where OntarioReno comes in
            </h3>

            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-300">
              We don’t just help you build a basement — we help you structure it
              properly so you can maximize incentives, understand your real
              numbers, and make a confident decision.
            </p>

            <div className="mt-8">
              <a
                href="/match"
                className="inline-flex rounded-xl bg-yellow-400 px-6 py-3 text-sm font-bold text-slate-900 transition hover:opacity-90"
              >
                Get a Basement Grant Assessment
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* What counts */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold text-slate-900 md:text-5xl">
              What Usually Counts Toward the Grant
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-slate-600 md:text-xl">
              This is one of the biggest sources of confusion. Not every dollar
              in a basement renovation quote counts the same way.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-green-200 bg-green-50 p-8 shadow-sm">
              <div className="mb-4 inline-flex rounded-full bg-green-600 px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-white">
                Usually Counts
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900">
                Eligible Construction Work
              </h3>
              <ul className="mt-6 space-y-3 text-base leading-7 text-slate-700">
                <li>• Framing and drywall</li>
                <li>• Labour tied to the build</li>
                <li>• Plumbing work</li>
                <li>• HVAC work tied to the permit</li>
                <li>• Electrical tied to the construction scope</li>
                <li>• Building materials required for the legal unit</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-4 inline-flex rounded-full bg-slate-900 px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-white">
                Usually Does Not Count
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900">
                Non-Eligible Costs
              </h3>
              <ul className="mt-6 space-y-3 text-base leading-7 text-slate-700">
                <li>• Drawings and permit plans</li>
                <li>• Permit-related soft costs</li>
                <li>• Appliances</li>
                <li>• Financing costs</li>
                <li>• Decorative-only upgrades</li>
                <li>• Other non-construction extras not tied to the permit</li>
              </ul>
            </div>
          </div>

          <div className="mx-auto mt-10 max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <p className="text-lg leading-8 text-slate-700">
              That’s why the calculator uses a typical estimate instead of
              assuming 100% of every project qualifies. The goal is to give
              homeowners a strong, grounded starting point.
            </p>
          </div>
        </div>
      </section>

      {/* Worked example + key takeaways */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold text-slate-900 md:text-5xl">
              Example: How a Project Reaches the Full $40,000
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-slate-600 md:text-xl">
              Here’s a simple example of how the math works when a basement
              project is structured well.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
            <div className="grid gap-4 md:grid-cols-5">
              <div className="rounded-2xl bg-white p-5 text-center shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Project Cost
                </p>
                <p className="mt-3 text-3xl font-extrabold text-slate-900">
                  $80,000
                </p>
              </div>

              <div className="rounded-2xl bg-white p-5 text-center shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Estimated Qualifying
                </p>
                <p className="mt-3 text-3xl font-extrabold text-slate-900">
                  $64,000
                </p>
              </div>

              <div className="rounded-2xl bg-white p-5 text-center shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  70% Covered
                </p>
                <p className="mt-3 text-3xl font-extrabold text-slate-900">
                  $44,800
                </p>
              </div>

              <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-5 text-center shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Grant Applied
                </p>
                <p className="mt-3 text-3xl font-extrabold text-green-600">
                  $40,000
                </p>
                <p className="mt-2 text-sm text-slate-500">capped at max</p>
              </div>

              <div className="rounded-2xl bg-white p-5 text-center shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Real Cost After Grant
                </p>
                <p className="mt-3 text-3xl font-extrabold text-slate-900">
                  $40,000
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-2xl bg-slate-900 px-6 py-5 text-center text-white">
              <p className="text-lg font-bold md:text-xl">
                A well-structured project can cut the effective cost dramatically.
              </p>
              <p className="mt-2 text-base text-slate-300">
                That’s why planning the right scope matters just as much as the
                total budget.
              </p>
            </div>
          </div>

          {/* Light CTA */}
          <div className="mx-auto mt-12 max-w-3xl text-center">
            <p className="text-lg text-slate-700">
              Want a quick answer based on your actual home?
            </p>

            <p className="mt-2 text-slate-600">
              We’ll walk you through what your basement could qualify for — no pressure.
            </p>

            <div className="mt-6">
              <a
                href="/match"
                className="inline-flex rounded-xl border border-slate-900 px-6 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-900 hover:text-white"
              >
                Get a Free Assessment
              </a>
            </div>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-7 shadow-sm">
              <h3 className="text-2xl font-bold text-slate-900">
                What This Means for Homeowners
              </h3>
              <ul className="mt-5 space-y-3 text-base leading-7 text-slate-700">
                <li>• You do not automatically receive the full $40,000</li>
                <li>• A larger project does not always mean a larger grant</li>
                <li>• The qualifying portion of the work matters</li>
                <li>• Planning and legal setup matter from the start</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 p-7 shadow-sm">
              <h3 className="text-2xl font-bold text-slate-900">
                What Happens Next
              </h3>
              <ul className="mt-5 space-y-3 text-base leading-7 text-slate-700">
                <li>• Get a realistic project assessment</li>
                <li>• Understand what usually qualifies</li>
                <li>• Review the legal layout and likely scope</li>
                <li>• Move forward with far more clarity and confidence</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-8">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 md:p-10">
            <h2 className="text-3xl font-extrabold md:text-4xl">
              Want to know what your basement could qualify for?
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
              We help homeowners understand the numbers, plan legal basement
              units properly, and move toward a real estimate with confidence.
            </p>

            <div className="mt-8">
              <a
                href="/match"
                className="inline-flex rounded-xl bg-yellow-400 px-6 py-3 text-sm font-bold text-slate-900 transition hover:opacity-90"
              >
                Get a Basement Grant Assessment
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
