import { Helmet } from "react-helmet-async";
import { CheckCircle, Home, ShieldCheck, FileText } from "lucide-react";
import HamiltonGrantCalculator from "../components/HamiltonGrantCalculator";
import HamiltonGrantForm from "../components/HamiltonGrantForm";

export default function HamiltonSecondarySuiteGrant() {
    return (
        <main className="bg-white text-slate-900">
            <Helmet>
                <title>
                    Hamilton Secondary Suite Grant (Up to $40,000) | ADU & Basement Eligibility
                </title>
                <meta
                    name="description"
                    content="Learn what qualifies as a legal secondary suite or ADU in Hamilton. Understand eligibility for the $40,000 basement grant and how to structure your project correctly."
                />
                <link
                    rel="canonical"
                    href="https://ontarioreno.ca/hamilton-secondary-suite-grant"
                />
            </Helmet>

            {/* HERO */}
            <section className="bg-slate-900 text-white">
                <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-24">
                    <div className="max-w-4xl">
                        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-yellow-400">
                            Hamilton Secondary Suite / ADU Grant (Up to $40,000)
                        </p>

                        <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">
                            What Qualifies as a Secondary Suite for the $40,000 Hamilton Grant?
                        </h1>

                        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300 md:text-xl">
                            To qualify for the Hamilton Basement Grant, your project must function as a
                            <strong> legal secondary suite or additional dwelling unit (ADU)</strong>.
                            Not every finished basement qualifies - structure, layout, and approvals matter for the Hamilton secondary suite grant, Hamilton basement grant, and ADU grant.
                        </p>

                        <p className="mt-4 text-sm font-medium text-yellow-300">
                            This is NOT the $2,000 plumbing rebate. This page explains what qualifies for the full $40,000 secondary suite / ADU grant.
                        </p>

                        <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-300">
                            <span>Real grant, not a loan</span>
                            <span>Must be legally compliant</span>
                            <span>Designed for rental-ready units</span>
                        </div>

                        <div className="mt-8 flex flex-wrap gap-4">
                            <a
                                href="#eligibility-form"
                                className="rounded-xl bg-yellow-400 px-6 py-3 text-sm font-bold text-slate-900 transition hover:opacity-90"
                            >
                                Check If My Home Qualifies
                            </a>

                            <a
                                href="/hamilton-basement-grant"
                                className="rounded-xl border border-white/20 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                            >
                                See Basement Grant Breakdown
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* QUICK STATS */}
            <section className="border-b border-slate-200 bg-white">
                <div className="mx-auto grid max-w-7xl gap-6 px-6 py-10 md:grid-cols-3 md:px-8">
                    <div className="rounded-2xl border p-6 shadow-sm">
                        <p className="text-sm font-semibold uppercase text-slate-500">Maximum Grant</p>
                        <p className="mt-2 text-3xl font-extrabold">$40,000</p>
                    </div>

                    <div className="rounded-2xl border p-6 shadow-sm">
                        <p className="text-sm font-semibold uppercase text-slate-500">Coverage</p>
                        <p className="mt-2 text-3xl font-extrabold">Up to 70%</p>
                    </div>

                    <div className="rounded-2xl border p-6 shadow-sm">
                        <p className="text-sm font-semibold uppercase text-slate-500">Requirement</p>
                        <p className="mt-2 text-3xl font-extrabold">Must Be Legal</p>
                    </div>
                </div>
            </section>

            {/* WHAT QUALIFIES */}
            <section className="bg-white">
                <div className="mx-auto max-w-6xl px-6 py-20 md:px-8">
                    <h2 className="text-center text-3xl font-extrabold md:text-5xl">
                        What Qualifies as a Legal Secondary Suite or ADU?
                    </h2>

                    <p className="mx-auto mt-6 max-w-3xl text-center text-lg text-slate-600">
                        A secondary suite is a self-contained unit within a home that is designed for independent living.
                        In most cases, this means a legal basement apartment or additional dwelling unit (ADU).
                    </p>

                    <div className="mt-12 grid gap-6 md:grid-cols-3">
                        <div className="rounded-2xl border p-6">
                            <Home className="h-8 w-8" />
                            <h3 className="mt-4 text-lg font-bold">Self-Contained Unit</h3>
                            <p className="mt-2 text-slate-600">
                                Must function as a separate living space.
                            </p>
                        </div>

                        <div className="rounded-2xl border p-6">
                            <ShieldCheck className="h-8 w-8" />
                            <h3 className="mt-4 text-lg font-bold">Legal Compliance</h3>
                            <p className="mt-2 text-slate-600">
                                Must meet building code, zoning, and safety requirements.
                            </p>
                        </div>

                        <div className="rounded-2xl border p-6">
                            <FileText className="h-8 w-8" />
                            <h3 className="mt-4 text-lg font-bold">Grant-Eligible Structure</h3>
                            <p className="mt-2 text-slate-600">
                                Must align with eligible construction scope.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* KEY INSIGHT */}
            <section className="bg-slate-50">
                <div className="mx-auto max-w-5xl px-6 py-16 text-center md:px-8">
                    <h2 className="text-3xl font-extrabold">
                        Basement Renovation vs Secondary Suite
                    </h2>

                    <p className="mt-4 text-lg text-slate-600">
                        A finished basement alone does NOT qualify.
                        The project must be structured as a legal secondary suite or ADU.
                    </p>

                    <p className="mt-6 text-lg font-semibold text-slate-700">
                        The grant is strongest when planned as a legal unit - not just a renovation.
                    </p>
                </div>
            </section>

            {/* CHECKLIST */}
            <section className="bg-white">
                <div className="mx-auto max-w-5xl px-6 py-16 md:px-8">
                    <h2 className="text-center text-3xl font-extrabold">
                        Secondary Suite Eligibility Checklist
                    </h2>

                    <div className="mt-10 grid gap-5">
                        {[
                            "Separate entrance or access plan",
                            "Independent living layout",
                            "Code-compliant safety design",
                            "Proper permits and approvals",
                            "Eligible construction scope",
                            "Intended use as a real rental unit",
                        ].map((item) => (
                            <div key={item} className="flex items-start gap-4 rounded-2xl border p-5">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                                <p className="text-lg">{item}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CALCULATOR */}
            <section id="calculator" className="bg-slate-50">
                <div className="mx-auto max-w-5xl px-6 py-16 md:px-8">
                    <div className="mb-8 text-center">
                        <h2 className="text-2xl font-extrabold">
                            Estimate Your Grant
                        </h2>
                    </div>

                    <HamiltonGrantCalculator />

                    <div className="mt-8 text-center">
                        <a
                            href="#eligibility-form"
                            className="inline-flex rounded-xl bg-green-600 px-6 py-3 font-bold text-white"
                        >
                            Get My Exact Eligibility
                        </a>
                    </div>
                </div>
            </section>

            {/* FORM */}
            <HamiltonGrantForm />

            {/* INTERNAL LINKING */}
            <section className="bg-white">
                <div className="mx-auto max-w-5xl px-6 py-16 text-center">
                    <h2 className="text-3xl font-extrabold">
                        Want the Full Breakdown of the Program?
                    </h2>

                    <p className="mt-4 text-lg text-slate-600">
                        For a complete explanation of how the Hamilton secondary suite
                        grant, Hamilton basement grant, and ADU grant work - including
                        funding structure, eligibility, and how to maximize your
                        $40,000 - see the full guide.
                    </p>

                    <div className="mt-8">
                        <a
                            href="/hamilton-grant-guide"
                            className="inline-flex rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-50"
                        >
                            View Full Hamilton Grant Guide
                        </a>
                    </div>

                    <p className="mt-6 text-sm text-slate-500">
                        Looking for the basement-focused version? See the{" "}
                        <a href="/hamilton-basement-grant" className="font-semibold underline">
                            Hamilton Basement Grant
                        </a>.
                    </p>
                </div>
            </section>

            {/* FINAL CTA */}
            <section className="bg-slate-900 text-white">
                <div className="mx-auto max-w-6xl px-6 py-16 text-center">
                    <h2 className="text-3xl font-extrabold">
                        Make Sure Your Basement Actually Qualifies
                    </h2>

                    <p className="mt-4 text-lg text-slate-300">
                        Structuring your project correctly can mean tens of thousands more in funding.
                    </p>

                    <div className="mt-8">
                        <a
                            href="#eligibility-form"
                            className="rounded-xl bg-yellow-400 px-8 py-4 font-bold text-slate-900"
                        >
                            Check If I Qualify
                        </a>
                    </div>
                </div>
            </section>
        </main>
    );
}
