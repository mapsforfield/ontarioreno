import HamiltonGrantCalculator from "../components/HamiltonGrantCalculator";

export default function HamiltonGrant() {
  return (
    <main className="bg-white text-slate-900">
      {/* Hero */}
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-8 md:py-24">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-yellow-400">
              Hamilton Basement Grant Guide
            </p>
            <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">
              Build a Legal Basement Apartment in Hamilton and Get Up to
              $40,000 Back
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 md:text-xl">
              Understand how the incentive works, what costs qualify, and how
              much your project could receive.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="/match"
                className="rounded-xl bg-yellow-400 px-6 py-3 text-sm font-bold text-slate-900 transition hover:opacity-90"
              >
                Check If You Qualify
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
              Ideal Use
            </p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">
              Basement Units
            </p>
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section id="calculator" className="bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-8">
          <div className="mb-8 max-w-3xl">
            <h2 className="text-3xl font-extrabold md:text-4xl">
              Estimate Your Hamilton Grant
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Adjust the project cost below to see how the grant could reduce
              your real out-of-pocket renovation cost.
            </p>
          </div>

          <HamiltonGrantCalculator />
        </div>
      </section>

      {/* How to Maximize the Grant */}
      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16 md:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-extrabold text-slate-900 md:text-4xl">
              How to Actually Unlock the Full $40,000
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Most homeowners don’t realize this — the grant isn’t automatic. It
              depends on how your project is structured.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 md:text-xl">
                1. Enough Eligible Construction
              </h3>
              <p className="mt-3 text-slate-600">
                The grant covers up to 70% of qualifying construction work. If
                too much of your budget goes to non-eligible items, you won’t
                reach the full amount.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 md:text-xl">
                2. Proper Legal Layout
              </h3>
              <p className="mt-3 text-slate-600">
                Your basement must meet legal requirements like a separate
                entrance, kitchen, bathroom, and egress windows to qualify.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 md:text-xl">
                3. Smart Planning From Day One
              </h3>
              <p className="mt-3 text-slate-600">
                The biggest mistake homeowners make is designing first and
                thinking about the grant later. By then, money is already left
                on the table.
              </p>
            </div>
          </div>

          <div className="my-12 h-px bg-slate-200"></div>

          <div className="mx-auto max-w-3xl text-center">
            <h3 className="text-2xl font-extrabold text-slate-900">
              What Most Homeowners Get Wrong
            </h3>

            <p className="mt-4 text-lg text-slate-700">
              Many people assume they’ll automatically receive $40,000 — but
              that only happens when the project is structured correctly.
            </p>

            <p className="mt-4 text-lg text-slate-700">
              In reality, poorly planned basements often qualify for far less
              simply because the eligible portion wasn’t optimized.
            </p>

            <p className="mt-6 text-xl font-semibold text-slate-900">
              The difference can be tens of thousands of dollars.
            </p>
          </div>

          <div className="mt-16 rounded-3xl bg-slate-900 p-8 text-center text-white md:p-10">
            <h3 className="text-2xl font-extrabold md:text-3xl">
              This is where OntarioReno comes in
            </h3>

            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
              We don’t just help you build a basement — we help you structure it
              properly so you can maximize incentives, understand your real
              numbers, and make a confident decision.
            </p>

            <div className="mt-8">
              <a
                href="/match"
                className="inline-flex rounded-xl bg-yellow-400 px-6 py-3 text-sm font-bold text-slate-900 transition hover:opacity-90"
              >
                Get a Free Assessment
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Explanation */}
      <section className="bg-white">
        <div className="mx-auto max-w-4xl px-6 py-16 md:px-8">
          <h2 className="text-3xl font-extrabold md:text-4xl">
            How the Program Works
          </h2>
          <p className="mt-6 text-lg leading-8 text-slate-700">
            The City of Hamilton incentive is not a flat $40,000 cheque. It
            covers up to 70% of eligible construction costs, to a maximum of
            $40,000 per eligible unit.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-6">
              <h3 className="text-xl font-bold">What may be covered</h3>
              <ul className="mt-4 space-y-2 text-slate-700">
                <li>• Construction labour</li>
                <li>• Building materials</li>
                <li>• Plumbing and HVAC tied to the permit</li>
                <li>• Other eligible construction work</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 p-6">
              <h3 className="text-xl font-bold">What is usually not covered</h3>
              <ul className="mt-4 space-y-2 text-slate-700">
                <li>• Appliances</li>
                <li>• Drawings and permit plans</li>
                <li>• Financing costs</li>
                <li>• Decorative-only items</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-8">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 md:p-10">
            <h2 className="text-3xl font-extrabold md:text-4xl">
              Want to know what your home could qualify for?
            </h2>
            <p className="mt-4 max-w-2xl text-lg text-slate-300">
              We help homeowners understand the numbers, plan legal basement
              units properly, and move toward a real estimate with confidence.
            </p>

            <div className="mt-8">
              <a
                href="/match"
                className="inline-flex rounded-xl bg-yellow-400 px-6 py-3 text-sm font-bold text-slate-900 transition hover:opacity-90"
              >
                Get a Free Assessment
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
