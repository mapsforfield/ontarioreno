import { Helmet } from "react-helmet-async";
import {
  ArrowRight,
  CalendarCheck,
  Calculator,
  CheckCircle2,
  FileText,
  House,
  ShieldCheck,
} from "lucide-react";
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
              <h1 className="mt-4 text-[3rem] font-extrabold leading-[0.93] tracking-[-0.055em] text-white">
                <span className="sr-only">
                  Hamilton $40,000 Basement Grant (2026) - Who Actually Qualifies?
                </span>
                <span aria-hidden="true">
                  <span className="block">Hamilton $40,000</span>
                  <span className="block">Basement Grant</span>
                  <span className="mt-4 block text-[2.1rem] font-bold leading-[1.02] tracking-[-0.04em] text-yellow-300">
                    Who Actually Qualifies in 2026?
                  </span>
                </span>
              </h1>

              <div className="mt-4 h-1 w-10 rounded-full bg-sky-400/90" />

              <p className="mt-4 max-w-[19.75rem] text-[1rem] leading-[1.64] text-slate-200">
                Understand who qualifies, what costs are covered, and how Hamilton homeowners can access up to{' '}
                <span className="font-semibold text-white">$40,000</span> to build a legal basement suite through the city’s ADU and secondary suite programs.
              </p>

              <div className="mt-5 divide-y divide-white/10 border-y border-white/10">
                {[
                  "Up to $40,000 in funding for basement suites, secondary suites, and ADUs.",
                  "Clear breakdown of eligibility, costs covered, and requirements.",
                  "Step-by-step guidance through the entire application process.",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 py-3">
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-sky-400/65 bg-sky-500/8 text-sky-400">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                    <p className="text-[0.98rem] leading-7 text-slate-200">{item}</p>
                  </div>
                ))}
              </div>

              {/* Booking leads. It is the only path here that ends in a
                  confirmed appointment rather than a queue, so it takes the
                  solid fill; the other two stay reachable but quieter. */}
              <div className="mt-1.5 space-y-2.5">
                <a
                  href="/consultation/hamilton?src=grant-guide-hero"
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
            </div>

            <div className="mt-4 rounded-[1.45rem] border border-white/8 bg-[linear-gradient(180deg,rgba(9,21,43,0.92)_0%,rgba(5,16,35,0.9)_100%)] px-4 py-3.5 shadow-[0_18px_44px_rgba(2,12,27,0.16)] backdrop-blur-sm">
              <div className="grid grid-cols-3 divide-x divide-white/10">
                {[
                  {
                    title: "Up to $40k Funding",
                    body: "Government support for legal basement suites, secondary suites, and ADUs.",
                    icon: House,
                  },
                  {
                    title: "Legal Basement Suites",
                    body: "Create safe, compliant rental units and increase your property value.",
                    icon: ShieldCheck,
                  },
                  {
                    title: "Step-by-Step Guidance",
                    body: "Clear eligibility, costs covered, and the application process explained.",
                    icon: CheckCircle2,
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className="px-2 first:pl-0.5 last:pr-0.5"
                    >
                      <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-sky-500/6 text-sky-400 ring-1 ring-white/5">
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <p className="text-[0.84rem] font-bold leading-5 text-white">
                        {item.title}
                      </p>
                      <p className="mt-1.5 text-[0.7rem] leading-[1.18rem] text-slate-300">
                        {item.body}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto hidden max-w-7xl px-6 py-16 md:block md:px-8 md:py-24">
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
            {/* Booking leads here too. It is the only one of the three that
                ends in a confirmed appointment instead of a queue. */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="/consultation/hamilton?src=grant-guide-hero"
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
      <section id="calculator" className="bg-slate-50 scroll-mt-24 md:scroll-mt-28">
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

      {/* BOOK A VISIT — primary path
          The form below routes to a callback. This routes to a calendar the
          homeowner books themselves, and lands the lead in the portal with an
          address we have actually verified. It sits ABOVE the form and carries
          the page's primary styling on purpose: two equally weighted choices
          would just split the traffic and teach us nothing.
          `?src=` is recorded on the lead, so this button's contribution is
          measurable against the form rather than a matter of opinion. */}
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-5xl px-6 py-16 md:px-8">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 md:p-10">
            <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-400">
                  Fastest way to get answers
                </p>
                <h2 className="mt-3 text-3xl font-extrabold leading-tight md:text-4xl">
                  Book your in-home visit
                </h2>
                <p className="mt-4 text-lg leading-8 text-slate-300">
                  Pick a time that works. No waiting for a callback. A specialist
                  comes to you, reviews the space, and walks you through what your
                  project would actually qualify for.
                </p>
                <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-slate-300">
                  <span className="inline-flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-sky-400" /> 45 minutes
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-sky-400" /> Free
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-sky-400" /> No obligation
                  </span>
                </div>
              </div>

              <div className="shrink-0">
                <a
                  href="/consultation/hamilton?src=grant-guide"
                  className="inline-flex items-center gap-2.5 rounded-2xl bg-yellow-400 px-8 py-5 text-lg font-extrabold text-slate-950 shadow-[0_18px_34px_rgba(2,12,27,0.4)] transition hover:opacity-95"
                >
                  See available times
                  <ArrowRight className="h-5 w-5" />
                </a>
                <p className="mt-3 text-center text-sm text-slate-400">
                  Takes about a minute
                </p>
              </div>
            </div>
          </div>

          <p className="mt-8 text-center text-sm font-semibold text-slate-400">
            Prefer a phone call instead? Use the eligibility form below.
          </p>
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



