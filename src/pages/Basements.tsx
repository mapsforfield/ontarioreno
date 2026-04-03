import { Link } from 'react-router-dom';
import {
  Home,
  CheckCircle2,
  ArrowRight,
  FileText,
  Calculator,
  Hammer,
} from 'lucide-react';

export default function Basements() {
  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero */}
      <section className="bg-slate-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/20 text-blue-300 text-sm font-medium mb-6">
              <Home className="w-4 h-4" /> Ontario Renovation Hub
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              The Ultimate Guide to Finishing Your Basement in Ontario
            </h1>
            <p className="text-xl text-slate-300 mb-8">
              Everything you need to know about costs, permits, layouts, and
              hiring the right contractor for your basement project.
            </p>
            <Link
              to="/match"
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all inline-flex items-center gap-2"
            >
              Find Basement Contractors <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-12">
          {/* Left Column - Content */}
          <div className="lg:w-2/3 space-y-12">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <Calculator className="w-8 h-8 text-blue-600" />
                Basement Renovation Costs in Ontario
              </h2>

              <p className="text-slate-600 mb-6 leading-relaxed">
                In Ontario, a typical basement renovation for personal use
                usually ranges from <strong>$45,000 to $85,000+</strong>, with
                many projects falling between <strong>$50,000 and $70,000</strong>.
                If you are building a legal basement apartment with a bathroom,
                kitchen, permits, and code-compliant upgrades, costs more often
                range from <strong>$60,000 to $140,000+</strong>, with many
                projects landing between <strong>$70,000 and $110,000</strong>.

                If you're specifically comparing grant eligibility in Hamilton,
                see what counts as a{" "}
                <Link
                  to="/hamilton-secondary-suite-grant"
                  className="font-semibold underline underline-offset-4"
                >
                  legal secondary suite
                </Link>.
              </p>

              <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                <div className="grid grid-cols-[1.4fr_1fr] bg-slate-100 px-5 py-4 text-sm font-bold text-slate-900">
                  <div>Typical Ontario / GTA Cost Components</div>
                  <div className="text-right">Estimated Range</div>
                </div>

                <div className="divide-y divide-slate-200 bg-white">
                  <div className="grid grid-cols-[1.4fr_1fr] px-5 py-4 text-sm md:text-base">
                    <div className="text-slate-700">
                      Framing, drywall, taping &amp; paint
                    </div>
                    <div className="text-right font-semibold text-slate-900">
                      $12,000 – $22,000
                    </div>
                  </div>

                  <div className="grid grid-cols-[1.4fr_1fr] px-5 py-4 text-sm md:text-base">
                    <div className="text-slate-700">Electrical</div>
                    <div className="text-right font-semibold text-slate-900">
                      $4,000 – $10,000
                    </div>
                  </div>

                  <div className="grid grid-cols-[1.4fr_1fr] px-5 py-4 text-sm md:text-base">
                    <div className="text-slate-700">Plumbing</div>
                    <div className="text-right font-semibold text-slate-900">
                      $4,000 – $12,000
                    </div>
                  </div>

                  <div className="grid grid-cols-[1.4fr_1fr] px-5 py-4 text-sm md:text-base">
                    <div className="text-slate-700">Flooring</div>
                    <div className="text-right font-semibold text-slate-900">
                      $4,000 – $10,000
                    </div>
                  </div>

                  <div className="grid grid-cols-[1.4fr_1fr] px-5 py-4 text-sm md:text-base">
                    <div className="text-slate-700">
                      Trim, doors &amp; finish carpentry
                    </div>
                    <div className="text-right font-semibold text-slate-900">
                      $4,000 – $9,000
                    </div>
                  </div>

                  <div className="grid grid-cols-[1.4fr_1fr] px-5 py-4 text-sm md:text-base">
                    <div className="text-slate-700">Bathroom addition</div>
                    <div className="text-right font-semibold text-slate-900">
                      $12,000 – $22,000
                    </div>
                  </div>

                  <div className="grid grid-cols-[1.4fr_1fr] px-5 py-4 text-sm md:text-base">
                    <div className="text-slate-700">Kitchen for legal apartment</div>
                    <div className="text-right font-semibold text-slate-900">
                      $12,000 – $25,000
                    </div>
                  </div>

                  <div className="grid grid-cols-[1.4fr_1fr] px-5 py-4 text-sm md:text-base">
                    <div className="text-slate-700">Separate entrance</div>
                    <div className="text-right font-semibold text-slate-900">
                      $8,000 – $20,000
                    </div>
                  </div>

                  <div className="grid grid-cols-[1.4fr_1fr] px-5 py-4 text-sm md:text-base">
                    <div className="text-slate-700">Permits &amp; drawings</div>
                    <div className="text-right font-semibold text-slate-900">
                      $2,500 – $6,000+
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-slate-500 mt-6 leading-relaxed text-sm md:text-base">
                Final pricing depends heavily on layout, finish level, whether
                a bathroom or kitchen is being added, and whether the project is
                being built for personal use or as a legal income-generating
                basement apartment.

                For Hamilton homeowners, you can also read the{" "}
                <Link
                  to="/hamilton-grant-guide"
                  className="font-semibold underline underline-offset-4"
                >
                  full Hamilton grant guide
                </Link>{" "}
                to understand how the incentive works.
              </p>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <h2 className="text-3xl font-bold text-slate-900 mb-6">
                  What Actually Drives Basement Costs
                </h2>

                <p className="text-slate-600 mb-6 leading-relaxed">
                  Two basements with the same square footage can end up tens of
                  thousands apart. The biggest pricing differences usually come
                  from scope, legal requirements, and existing site conditions.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <p className="font-semibold text-slate-900 mb-3">
                      Common cost drivers
                    </p>
                    <ul className="space-y-2 text-sm text-slate-700">
                      <li>• Ceiling height and structural limitations</li>
                      <li>• Adding a bathroom or full kitchen</li>
                      <li>• Electrical panel upgrades</li>
                      <li>• Waterproofing or moisture remediation</li>
                      <li>• Separate entrance construction</li>
                    </ul>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <p className="font-semibold text-slate-900 mb-3">
                      Legal suite upgrades
                    </p>
                    <ul className="space-y-2 text-sm text-slate-700">
                      <li>• Fire separation requirements</li>
                      <li>• Soundproofing between units</li>
                      <li>• Egress and window compliance</li>
                      <li>• Dedicated HVAC / ventilation work</li>
                      <li>• Permit and drawing complexity</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <h2 className="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <FileText className="w-8 h-8 text-blue-600" />
                  Do I need a permit?
                </h2>

                <p className="text-slate-600 mb-6 leading-relaxed">
                  <strong>Usually yes.</strong> In most GTA municipalities, if
                  you are finishing a previously unfinished basement, adding
                  rooms, changing plumbing, modifying electrical, or creating a
                  legal secondary suite, you will usually need permits and
                  approved drawings before construction starts.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                    <p className="font-semibold text-slate-900 mb-4">
                      Permits are commonly needed for:
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-slate-700">
                          Adding or moving walls
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-slate-700">
                          New bathroom plumbing
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-slate-700">
                          New kitchen plumbing
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-slate-700">
                          Electrical changes or new circuits
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-slate-700">
                          Enlarging windows for egress
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-slate-700">
                          Creating a legal basement apartment
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <p className="font-semibold text-slate-900 mb-4">
                      Why it matters
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-slate-700">
                          Protects safety and code compliance
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-slate-700">
                          Helps avoid stop-work orders and fines
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-slate-700">
                          Matters when selling or refinancing
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-slate-700">
                          Especially important for income suites
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar / Lead Capture */}
            <div className="lg:w-1/3">
              <div className="sticky top-28 space-y-6">
                <div className="bg-white p-8 rounded-2xl shadow-xl border border-blue-100">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                    <Hammer className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">
                    Ready to get quotes?
                  </h3>
                  <p className="text-slate-600 mb-6">
                    Tell us about your basement project and we’ll help identify
                    the best-fit contractor based on your scope, budget, and
                    project type.
                  </p>
                  <Link
                    to="/match"
                    className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-colors"
                  >
                    Find the Right Contractor
                  </Link>
                  <p className="text-xs text-center text-slate-400 mt-4">
                    100% free. No obligation to hire.
                  </p>
                </div>

                <div className="bg-yellow-50 p-8 rounded-2xl shadow-sm border border-yellow-200">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-800 mb-3">
                    Hamilton incentive
                  </p>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">
                    Up to $40,000 Available for Qualifying Basement Projects
                  </h3>
                  <p className="text-slate-700 mb-4">
                    Homeowners in Hamilton may qualify for a city-backed incentive
                    covering up to <strong>70% of eligible construction costs</strong>{" "}
                    when building a legal secondary unit. For a full breakdown, see the{" "}
                    <Link
                      to="/hamilton-grant-guide"
                      className="font-semibold underline underline-offset-4"
                    >
                      Hamilton grant guide
                    </Link>.
                  </p>
                  <p className="text-xs text-slate-500 mb-5">
                    Subject to approval, eligibility, and available funding.
                  </p>
                  <Link
                    to="/hamilton-basement-grant"
                    className="inline-flex text-sm font-semibold text-slate-900 underline underline-offset-4"
                  >
                    See if you qualify →
                  </Link>
                </div>

                <div className="bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-800 text-white">
                  <h3 className="text-lg font-bold mb-3">
                    Ontario pricing reality check
                  </h3>
                  <p className="text-sm leading-7 text-slate-300">
                    If a contractor is quoting far below normal Ontario market
                    pricing, there is usually a reason: missing permit scope,
                    lower-grade materials, incomplete labour coverage, or major
                    exclusions that show up later as extras.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}