import { Helmet } from "react-helmet-async";
import { ArrowRight, CalendarCheck, Calculator, CheckCircle2, FileText } from "lucide-react";
import HamiltonGrantCalculator from "../components/HamiltonGrantCalculator";
import HamiltonGrantForm from "../components/HamiltonGrantForm";

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
        <div className="relative overflow-hidden bg-slate-950 md:hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[50vh] min-h-[430px] max-h-[520px]">
            <img
              src="/images/mobile-hero.jpg"
              alt=""
              aria-hidden="true"
              loading="eager"
              fetchPriority="high"
              className="ml-auto mr-[-3%] h-full w-[82%] object-cover object-right-top"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.992)_0%,rgba(2,6,23,0.978)_30%,rgba(2,6,23,0.86)_48%,rgba(2,6,23,0.4)_72%,rgba(2,6,23,0.1)_100%)]" />
            <div className="absolute inset-x-0 bottom-0 h-56 bg-[linear-gradient(180deg,rgba(2,6,23,0)_0%,rgba(2,6,23,0.42)_28%,rgba(2,6,23,0.86)_62%,rgba(2,6,23,1)_100%)]" />
          </div>
          <div className="pointer-events-none absolute inset-x-0 top-[26rem] bottom-0 bg-[linear-gradient(180deg,rgba(2,6,23,0)_0%,rgba(2,6,23,0.74)_20%,rgba(2,6,23,0.96)_42%,rgba(2,6,23,1)_62%,rgba(2,6,23,1)_100%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_26%_34%,rgba(2,6,23,0.22)_0%,rgba(2,6,23,0.16)_18%,rgba(2,6,23,0.08)_30%,rgba(2,6,23,0)_50%),radial-gradient(circle_at_34%_48%,rgba(2,6,23,0.12)_0%,rgba(2,6,23,0.06)_18%,rgba(2,6,23,0)_38%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_24%_52%,rgba(2,6,23,0.16)_0%,rgba(2,6,23,0.1)_18%,rgba(2,6,23,0.04)_30%,rgba(2,6,23,0)_46%)]" />

          <div className="relative mx-auto max-w-7xl px-5 pb-7 pt-6">
            <div className="max-w-[22.5rem]">
              <p className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-yellow-300/95">
                Hamilton Basement Grant (Up to $40,000)
              </p>

              <h1 className="mt-4 text-[3rem] font-extrabold leading-[0.9] tracking-[-0.055em] text-white">
                Hamilton Basement Grant (Up to $40,000)
              </h1>

              <p className="mt-4 max-w-[19.25rem] text-[1rem] leading-[1.58] text-slate-200">
                The Hamilton basement grant (also known as the Hamilton secondary suite
                grant or ADU grant) gives homeowners up to $40,000 in funding to build
                a legal basement apartment or additional dwelling unit.
              </p>

              <div className="mt-4 max-w-[20rem] text-[0.92rem] font-medium leading-7 text-yellow-200">
                Warning: Most homeowners are being shown the wrong program. This is NOT the
                $2,000 plumbing rebate. This is the program that can provide up to
                $40,000 for a legal basement or secondary suite.
              </div>

              <div className="mt-4 divide-y divide-white/10 border-y border-white/10">
                {[
                  "No repayment required",
                  "City-backed program",
                  "Applies to legal units",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 py-3">
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-emerald-400/65 bg-emerald-500/8 text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                    <p className="text-[0.98rem] leading-7 text-slate-200">{item}</p>
                  </div>
                ))}
              </div>

              {/* Booking leads: the only path here that ends in a confirmed
                  appointment rather than a queue. The form and calculator stay
                  one tap away, quieter. */}
              <div className="mt-1.5 space-y-2.5">
                <a
                  href="/consultation/hamilton?src=basement-grant-hero"
                  className="flex w-full items-center rounded-2xl bg-yellow-400 px-5 py-4 text-left text-[1.02rem] font-extrabold leading-6 text-slate-950 shadow-[0_18px_34px_rgba(15,23,42,0.22)] transition hover:opacity-95"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <CalendarCheck className="h-5 w-5 shrink-0" />
                    <span>Book your in-home visit</span>
                  </span>
                  <ArrowRight className="ml-auto h-5 w-5 shrink-0" />
                </a>
                <p className="px-1 text-[0.82rem] font-semibold text-slate-400">
                  Pick a time that works — no waiting for a callback.
                </p>

                <a
                  href="#eligibility-form"
                  className="flex w-full items-center rounded-2xl border border-white/18 bg-white/6 px-5 py-4 text-[1.02rem] font-semibold text-white/95 backdrop-blur-sm transition hover:bg-white/10"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <FileText className="h-5 w-5 shrink-0" />
                    <span>Check If I Qualify</span>
                  </span>
                  <ArrowRight className="ml-auto h-5 w-5 shrink-0 text-white/70" />
                </a>

                <a
                  href="#calculator"
                  className="flex w-full items-center rounded-2xl border border-white/18 bg-white/6 px-5 py-4 text-[1.02rem] font-semibold text-white/95 backdrop-blur-sm transition hover:bg-white/10"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <Calculator className="h-5 w-5 shrink-0" />
                    <span>See My Estimated Grant</span>
                  </span>
                  <ArrowRight className="ml-auto h-5 w-5 shrink-0 text-white/70" />
                </a>
              </div>

              <p className="mt-4 text-xs text-slate-300">
                Funding is limited and subject to approval.
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto hidden max-w-7xl px-6 py-16 md:block md:px-8 md:py-24">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-yellow-300/95">
              Hamilton Basement Grant (Up to $40,000)
            </p>

            <h1 className="mt-4 text-4xl font-extrabold leading-tight md:text-6xl">
              Hamilton Basement Grant (Up to $40,000)
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300 md:text-xl">
              The Hamilton basement grant (also known as the Hamilton secondary suite
              grant or ADU grant) gives homeowners up to $40,000 in funding to build
              a legal basement apartment or additional dwelling unit.
            </p>

            <div className="mt-5 max-w-3xl text-base font-medium leading-8 text-yellow-200 md:text-lg">
              Warning: Most homeowners are being shown the wrong program. This is NOT the
              $2,000 plumbing rebate. This is the program that can provide up to
              $40,000 for a legal basement or secondary suite.
            </div>

            <div className="mt-6 flex flex-wrap gap-6 text-sm text-slate-300">
              {[
                "No repayment required",
                "City-backed program",
                "Applies to legal units",
              ].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="/consultation/hamilton?src=basement-grant-hero"
                className="inline-flex items-center gap-2.5 rounded-xl bg-yellow-400 px-7 py-4 text-base font-extrabold text-slate-900 shadow-[0_16px_30px_rgba(2,12,27,0.35)] transition hover:opacity-95"
              >
                <CalendarCheck className="h-5 w-5" />
                Book your in-home visit
                <ArrowRight className="h-5 w-5" />
              </a>

              <a
                href="#eligibility-form"
                className="rounded-xl border border-white/20 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Check If I Qualify
              </a>

              <a
                href="#calculator"
                className="rounded-xl border border-white/20 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                See My Estimated Grant
              </a>
            </div>

            <p className="mt-4 text-sm font-semibold text-slate-400">
              Pick a time that works — no waiting for a callback.
            </p>

            <p className="mt-2 text-xs text-slate-300">
              Funding is limited and subject to approval.
            </p>
          </div>
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
              className="inline-flex rounded-[0.74rem] border border-slate-300 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-6 py-[0.78rem] text-sm font-semibold tracking-[-0.015em] text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.96),0_1px_2px_rgba(15,23,42,0.03),0_10px_22px_rgba(15,23,42,0.05)] transition duration-200 hover:border-slate-400 hover:bg-[linear-gradient(180deg,#ffffff_0%,#f1f5f9_100%)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.98),0_1px_2px_rgba(15,23,42,0.04),0_14px_26px_rgba(15,23,42,0.06)] active:bg-slate-100 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
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



