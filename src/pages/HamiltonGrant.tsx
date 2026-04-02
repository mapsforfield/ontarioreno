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
              Build a Legal Basement Apartment in Hamilton with Up to $40,000 in Grant Funding
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300 md:text-xl">
              Learn how the Hamilton basement grant works, what costs usually qualify, and how much funding a legal basement apartment or secondary unit could realistically receive.
            </p>

            {/* 🔥 SEO SUPPORT LINE */}
            <p className="mt-6 max-w-3xl text-sm leading-7 text-slate-400 md:text-base">
              This guide breaks down the City of Hamilton basement grant and ADU incentive for homeowners planning a legal secondary unit.
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
              Estimate Your Hamilton Basement Grant
            </h2>

            {/* 🔥 SEO BOOST PARAGRAPH */}
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600 md:text-xl">
              The Hamilton basement grant can cover up to 70% of eligible construction costs, to a maximum of $40,000, for qualifying legal basement and ADU projects.
            </p>
          </div>

          <HamiltonGrantCalculator />
        </div>
      </section>

      {/* 🔥 NEW FAQ SECTION (SEO GOLD) */}
      <section className="bg-white border-t border-slate-200">
        <div className="mx-auto max-w-5xl px-6 py-16 md:px-8">
          <h2 className="text-3xl font-extrabold text-center mb-10">
            Frequently Asked Questions About the Hamilton Basement Grant
          </h2>

          <div className="space-y-6">
            <div className="border rounded-xl p-6">
              <h3 className="font-bold text-lg">
                What is the Hamilton basement grant?
              </h3>
              <p className="mt-2 text-slate-600">
                The Hamilton basement grant is a City of Hamilton incentive program that may cover up to 70% of eligible construction costs, to a maximum of $40,000, for qualifying legal basement apartments, secondary units, and ADU projects.
              </p>
            </div>

            <div className="border rounded-xl p-6">
              <h3 className="font-bold text-lg">
                Do all basement renovations qualify?
              </h3>
              <p className="mt-2 text-slate-600">
                No. Only specific construction costs tied to a legal secondary unit typically qualify. Layout, permits, and scope all play a role.
              </p>
            </div>

            <div className="border rounded-xl p-6">
              <h3 className="font-bold text-lg">
                Can I get the full $40,000?
              </h3>
              <p className="mt-2 text-slate-600">
                Only if enough of your project qualifies under the program. Many homeowners receive less depending on how their project is structured.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* (rest of your page unchanged) */}
    </main>
  );
}
