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
              Build a Legal Basement Apartment in Hamilton and Get Up to $40,000 Back
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 md:text-xl">
              Understand how the incentive works, what costs qualify, and how much your project could receive.
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
            <p className="mt-2 text-3xl font-extrabold text-slate-900">$40,000</p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Coverage
            </p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">70%</p>
            <p className="mt-1 text-sm text-slate-600">of eligible construction costs</p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Ideal Use
            </p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">Basement Units</p>
          </div>
        </div>
      </section>

      {/* Calculator placeholder */}
      <section id="calculator" className="bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-8">
          <div className="mb-8 max-w-3xl">
            <h2 className="text-3xl font-extrabold md:text-4xl">
              Estimate Your Hamilton Grant
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              We’re adding an interactive calculator here next so homeowners can estimate their grant, net project cost, and potential rental upside.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-6">
                <p className="text-sm font-semibold text-slate-500">Estimated Grant</p>
                <p className="mt-2 text-3xl font-extrabold">$0</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-6">
                <p className="text-sm font-semibold text-slate-500">Estimated Net Cost</p>
                <p className="mt-2 text-3xl font-extrabold">$0</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-6">
                <p className="text-sm font-semibold text-slate-500">Potential Rent Offset</p>
                <p className="mt-2 text-3xl font-extrabold">$1,500+</p>
              </div>
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
            The City of Hamilton incentive is not a flat $40,000 cheque. It covers up to 70% of eligible construction costs, to a maximum of $40,000 per eligible unit.
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
              We help homeowners understand the numbers, plan legal basement units properly, and move toward a real estimate with confidence.
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
