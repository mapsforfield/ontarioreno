import { Helmet } from "react-helmet-async";
import { CheckCircle, Home, ShieldCheck, FileText } from "lucide-react";
import HamiltonGrantCalculator from "../components/HamiltonGrantCalculator";

export default function HamiltonSecondarySuiteGrant() {
    return (
        <main className="bg-white text-slate-900">
            <Helmet>
                <title>Hamilton Secondary Suite Grant | Up to $40,000 for Legal Units</title>
                <meta
                    name="description"
                    content="Learn how the Hamilton secondary suite grant works, what qualifies as a legal secondary suite, and how homeowners may receive up to $40,000 in grant funding."
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
                            Hamilton Secondary Suite Grant
                        </p>

                        <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">
                            Hamilton Secondary Suite Grant:
                            <br />
                            Up to $40,000 for Legal Units
                        </h1>

                        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300 md:text-xl">
                            Hamilton homeowners may qualify for up to <strong>$40,000 in grant funding</strong> when creating a
                            legal secondary suite. The key is that not every basement qualifies — the space must be planned and
                            structured properly.
                        </p>

                        <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-300">
                            <span>✔ Real grant, not a loan</span>
                            <span>✔ For legal secondary suites</span>
                            <span>✔ Best for rental-ready units</span>
                        </div>

                        <div className="mt-8 flex flex-wrap gap-4">
                            <a
                                href="/match"
                                className="rounded-xl bg-yellow-400 px-6 py-3 text-sm font-bold text-slate-900 transition hover:opacity-90"
                            >
                                Check If My Home Qualifies
                            </a>

                            <a
                                href="/hamilton-grant-guide"
                                className="rounded-xl border border-white/20 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                            >
                                Read Full Grant Guide
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* QUICK CLARITY STRIP */}
            <section className="border-b border-slate-200 bg-white">
                <div className="mx-auto grid max-w-7xl gap-6 px-6 py-10 md:grid-cols-3 md:px-8">
                    <div className="rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <p className="text-sm font-semibold uppercase text-slate-500">Maximum Grant</p>
                        <p className="mt-2 text-3xl font-extrabold">$40,000</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <p className="text-sm font-semibold uppercase text-slate-500">Coverage</p>
                        <p className="mt-2 text-3xl font-extrabold">Up to 70%</p>
                        <p className="mt-1 text-sm text-slate-600">of eligible construction costs</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <p className="text-sm font-semibold uppercase text-slate-500">Important</p>
                        <p className="mt-2 text-3xl font-extrabold">Must Be Legal</p>
                        <p className="mt-1 text-sm text-slate-600">A finished basement alone is not enough</p>
                    </div>
                </div>
            </section>

            {/* WHAT IS A SECONDARY SUITE */}
            <section className="bg-white">
                <div className="mx-auto max-w-6xl px-6 py-20 md:px-8 md:py-20">
                    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
                        <div>
                            <h2 className="text-3xl font-extrabold md:text-5xl">
                                What Is a Secondary Suite?
                            </h2>

                            <p className="mt-5 text-lg leading-8 text-slate-600">
                                A secondary suite is a self-contained residential unit inside an existing home. In practical terms, that
                                usually means a legal basement apartment or in-home unit designed for separate living.
                            </p>

                            <p className="mt-5 text-lg leading-8 text-slate-600">
                                You can spend a large amount finishing a basement, but if the layout, approvals, or intended use do not
                                line up properly, it may not qualify for the grant the way you expect.

                                If you're specifically exploring basement-focused options, see how the{" "}
                                <a href="/hamilton-basement-grant" className="font-semibold underline underline-offset-4">
                                    Hamilton basement grant works
                                </a>{" "}
                                and how projects are typically structured.
                            </p>
                        </div>

                        <div>
                            <img
                                src="/secondary-suite.jpg"
                                alt="Modern legal secondary suite basement apartment in Hamilton"
                                className="h-full w-full rounded-3xl object-cover shadow-xl ring-1 ring-black/5"
                            />
                            <p className="mt-3 text-sm text-slate-500">
                                Example of a clean, rental-ready secondary suite layout
                            </p>
                        </div>
                    </div>

                    <div className="mt-10 grid gap-6 md:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <Home className="h-8 w-8 text-slate-900" />
                            <h3 className="mt-4 text-xl font-bold">Self-Contained Living Space</h3>
                            <p className="mt-3 text-slate-600">
                                The unit should function as an independent living area within the home.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <ShieldCheck className="h-8 w-8 text-slate-900" />
                            <h3 className="mt-4 text-xl font-bold">Legal Compliance</h3>
                            <p className="mt-3 text-slate-600">
                                It must be designed to meet the required code, safety, and municipal standards.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <FileText className="h-8 w-8 text-slate-900" />
                            <h3 className="mt-4 text-xl font-bold">Grant-Eligible Structure</h3>
                            <p className="mt-3 text-slate-600">
                                The project needs to align with eligible work and approval requirements to maximize funding.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* BASEMENT VS SECONDARY SUITE */}
            <section className="bg-slate-50">
                <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-extrabold md:text-5xl">
                            Basement Renovation vs. Legal Secondary Suite
                        </h2>

                        <p className="mt-5 text-lg leading-8 text-slate-600">
                            This is where many homeowners get confused. A basement renovation and a legal secondary suite are not
                            automatically the same thing.
                        </p>

                        <p className="mt-5 text-lg leading-8 text-slate-600">
                            You can spend a large amount finishing a basement, but if the layout, approvals, or intended use do not
                            line up properly, it may not qualify for the grant the way you expect.
                        </p>
                    </div>

                    <div className="mt-10 grid gap-6 md:grid-cols-2">
                        <div className="rounded-2xl border border-red-200 bg-red-50 p-7">
                            <h3 className="text-2xl font-extrabold text-red-700">
                                Standard Finished Basement
                            </h3>
                            <ul className="mt-5 space-y-3 text-slate-700">
                                <li>• Can look modern and fully renovated</li>
                                <li>• May increase usable living space</li>
                                <li>• Does not automatically qualify as a legal unit</li>
                                <li>• May include non-eligible work that reduces payout</li>
                            </ul>
                        </div>

                        <div className="rounded-2xl border border-green-200 bg-green-50 p-7">
                            <h3 className="text-2xl font-extrabold text-green-700">
                                Legal Secondary Suite
                            </h3>
                            <ul className="mt-5 space-y-3 text-slate-700">
                                <li>• Planned as a separate, self-contained unit</li>
                                <li>• Intended to meet legal and safety requirements</li>
                                <li>• Better aligned with grant eligibility</li>
                                <li>• Stronger fit for rental and long-term value</li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                        <p className="text-lg font-semibold text-slate-900 md:text-xl">
                            In simple terms:
                        </p>
                        <p className="mt-3 text-lg leading-8 text-slate-600">
                            The Hamilton grant is strongest when the project is being approached as a <strong>legal secondary suite</strong>,
                            not just as a basement makeover.
                        </p>
                    </div>
                </div>
            </section>

            {/* CHECKLIST */}
            <section className="bg-white">
                <div className="mx-auto max-w-5xl px-6 py-16 md:px-8 md:py-20">
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-extrabold md:text-5xl">
                            Basic Secondary Suite Eligibility Checklist
                        </h2>

                        <p className="mt-5 text-lg leading-8 text-slate-600">
                            Every home is different, but these are the kinds of things that typically matter when determining whether a
                            basement can function as a legal secondary suite.
                        </p>
                    </div>

                    <div className="mt-10 grid gap-5">
                        {[
                            "Separate entrance or suitable access plan",
                            "Layout that supports independent living",
                            "Code-compliant safety and fire considerations",
                            "Proper permits and legal project planning",
                            "Project scope aligned with eligible construction costs",
                            "Intended use as a real secondary suite, not just extra finished space",
                        ].map((item) => (
                            <div
                                key={item}
                                className="flex items-start gap-4 rounded-2xl border border-slate-200 p-5 shadow-sm"
                            >
                                <CheckCircle className="mt-0.5 h-6 w-6 shrink-0 text-green-600" />
                                <p className="text-lg text-slate-700">{item}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-10 rounded-2xl bg-slate-50 p-8">
                        <p className="text-lg leading-8 text-slate-700">
                            Not sure where your home stands? That’s exactly why homeowners should verify eligibility
                            <strong> before building</strong>, not after decisions have already been made.
                        </p>
                    </div>
                </div>
            </section>

            {/* CALCULATOR SECTION */}
            <section className="bg-slate-50">
                <div className="mx-auto max-w-5xl px-6 py-16 md:px-8">
                    <div className="mb-8 text-center">
                        <h2 className="text-2xl font-extrabold md:text-3xl">
                            Estimate Your Potential Grant
                        </h2>

                        <p className="mt-3 text-lg text-slate-600">
                            If your home qualifies as a legal secondary suite, here’s what your project could receive.
                        </p>
                    </div>

                    <HamiltonGrantCalculator />

                    <div className="mt-8 text-center">
                        <a
                            href="/match"
                            className="inline-flex rounded-xl bg-green-600 px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
                        >
                            Get My Exact Eligibility
                        </a>
                    </div>
                </div>
            </section>

            {/* INTERNAL LINK / TOPIC AUTHORITY */}
            <section className="bg-white">
                <div className="mx-auto max-w-5xl px-6 py-16 md:px-8">
                    <h2 className="text-3xl font-extrabold md:text-4xl">
                        Related Hamilton Grant Pages
                    </h2>

                    <p className="mt-4 max-w-3xl text-lg text-slate-600">
                        If you are still comparing grant information, you can also read the full{" "}
                        <a href="/hamilton-grant-guide" className="font-semibold text-slate-900 underline underline-offset-4">
                            Hamilton grant guide
                        </a>{" "}
                        or visit the shorter{" "}
                        <a href="/hamilton-basement-grant" className="font-semibold text-slate-900 underline underline-offset-4">
                            Hamilton basement grant page
                        </a>{" "}
                        for a faster overview.
                    </p>
                </div>
            </section>

            {/* FINAL CTA */}
            <section className="bg-slate-900 text-white">
                <div className="mx-auto max-w-6xl px-6 py-16 md:px-8">
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center md:p-10">
                        <h2 className="text-3xl font-extrabold md:text-4xl">
                            See If Your Basement Can Qualify as a Legal Secondary Suite
                        </h2>

                        <p className="mx-auto mt-4 max-w-3xl text-lg text-slate-300">
                            The difference between a standard basement renovation and a grant-eligible secondary suite can be worth
                            tens of thousands of dollars.
                        </p>

                        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                            <a
                                href="/match"
                                className="inline-flex rounded-xl bg-yellow-400 px-8 py-4 text-base font-bold text-slate-900 transition hover:opacity-90"
                            >
                                Check If I Qualify
                            </a>

                            <a
                                href="/hamilton-grant-guide"
                                className="inline-flex rounded-xl border border-white/20 px-8 py-4 text-base font-bold text-white transition hover:bg-white/10"
                            >
                                Read Full Guide
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}