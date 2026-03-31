import HamiltonGrantCalculator from "../components/HamiltonGrantCalculator";

export default function HamiltonBasementGrantAd() {
  return (
    <main className="bg-white text-slate-900">

      {/* HERO */}
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-5xl px-6 py-16 md:px-8 md:py-20 text-center">

          <p className="text-sm font-semibold uppercase tracking-wide text-yellow-400">
            Hamilton Basement Grant Program
          </p>

          <h1 className="mt-4 text-3xl font-extrabold leading-tight md:text-5xl">
            Get Up to $40,000 Back
            <br />
            for a Legal Basement Unit
          </h1>

          <p className="mt-4 text-lg text-slate-300 max-w-2xl mx-auto">
            Most homeowners don’t realize this — the grant isn’t automatic.
            It depends on how your basement project is structured.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="#calculator"
              className="rounded-xl bg-yellow-400 px-6 py-3 text-sm font-bold text-slate-900 hover:opacity-90 transition"
            >
              Check What You Could Get
            </a>

            <a
              href="/match"
              className="rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition"
            >
              Get Free Assessment
            </a>
          </div>

          <p className="mt-4 text-sm text-slate-400">
            ✔ No obligation • ✔ Local experts • ✔ Real numbers
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
              Adjust your project cost — we’ll estimate your grant instantly.
            </p>
          </div>

          <HamiltonGrantCalculator />

          {/* LIGHT CTA */}
          <div className="mt-8 text-center">
            <p className="text-lg font-medium text-slate-700">
              Want exact numbers for your home?
            </p>

            <a
              href="/match"
              className="mt-4 inline-flex rounded-xl bg-yellow-400 px-6 py-3 text-sm font-bold text-slate-900 hover:opacity-90 transition"
            >
              Get My Free Grant Assessment
            </a>
          </div>

        </div>
      </section>

      {/* WHY PEOPLE MISS OUT */}
      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16 md:px-8">

          <div className="text-center mb-10">
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
                If your budget includes too many non-eligible items, your grant amount drops significantly.
              </p>
            </div>

            <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
              <h3 className="text-lg font-bold text-red-700">
                ❌ Not Designed as a Legal Unit
              </h3>
              <p className="mt-3 text-slate-700">
                Without proper layout (entrance, kitchen, egress), the project may not qualify at all.
              </p>
            </div>

            <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
              <h3 className="text-lg font-bold text-red-700">
                ❌ Planning Happens Too Late
              </h3>
              <p className="mt-3 text-slate-700">
                By the time most people think about the grant, the structure is already wrong.
              </p>
            </div>

          </div>

          <div className="mt-10 text-center max-w-2xl mx-auto">
            <p className="text-xl font-semibold text-slate-900">
              That mistake can cost you tens of thousands of dollars.
            </p>
          </div>

        </div>
      </section>

      {/* SIMPLE EXAMPLE */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-4xl px-6 py-14 md:px-8 text-center">

          <h2 className="text-2xl font-extrabold md:text-3xl">
            A Real Example
          </h2>

          <div className="mt-8 rounded-2xl bg-white border border-slate-200 p-8 shadow-sm">

            <p className="text-lg text-slate-700">
              A properly structured
            </p>

            <p className="mt-2 text-3xl font-extrabold text-slate-900">
              $80,000 basement project
            </p>

            <p className="mt-4 text-lg text-slate-600">
              could receive
            </p>

            <p className="mt-2 text-4xl font-extrabold text-green-600">
              $40,000 back
            </p>

          </div>

        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-5xl px-6 py-16 md:px-8 text-center">

          <h2 className="text-3xl font-extrabold md:text-4xl">
            Find Out What Your Home Qualifies For
          </h2>

          <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-300">
            We’ll help you understand your numbers, structure your project properly, and avoid leaving money on the table.
          </p>

          <div className="mt-8">
            <a
              href="/match"
              className="inline-flex rounded-xl bg-yellow-400 px-8 py-4 text-base font-bold text-slate-900 hover:opacity-90 transition"
            >
              Get My Free Assessment
            </a>
          </div>

        </div>
      </section>

    </main>
  );
}
