import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  ArrowRight,
  AlertTriangle,
  FileText,
  Calculator,
  CheckCircle2,
  Hammer,
} from 'lucide-react';

export default function LegalSuites() {
  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero */}
      <section className="bg-slate-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-600/20 text-emerald-400 text-sm font-medium mb-6">
              <ShieldCheck className="w-4 h-4" /> High ROI Project
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Legal Secondary Suites in Ontario
            </h1>

            <p className="text-xl text-slate-300 mb-8">
              The definitive guide to building a legal, code-compliant income
              suite. Learn about zoning, fire separation, egress, HVAC
              separation, and what real pricing looks like in Ontario.
            </p>

            <Link
              to="/match"
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all inline-flex items-center gap-2"
            >
              Find Specialized Contractors <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-12">
          {/* Left Column */}
          <div className="lg:w-2/3 space-y-12">
            <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl flex gap-4">
              <AlertTriangle className="w-8 h-8 text-amber-600 shrink-0" />
              <div>
                <h3 className="font-bold text-amber-900 mb-2">
                  Why "Legal" Matters
                </h3>
                <p className="text-amber-800 text-sm leading-relaxed">
                  Building an illegal basement apartment can create serious
                  problems later: fines, insurance issues, forced removal of
                  work, difficulties when selling, and problems with tenants.
                  If the unit is meant to generate income, it needs to be built
                  properly from the start.
                </p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-3xl font-bold text-slate-900 mb-6">
                The 4 Pillars of a Legal Suite
              </h2>

              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    1. Zoning &amp; Municipal Rules
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    Your municipality must allow a secondary suite on the
                    property, and your house must meet any local conditions tied
                    to lot type, access, setbacks, or parking. Ontario allows
                    secondary suites broadly, but municipal implementation still
                    matters.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    2. Fire Separation
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    A legal suite needs proper fire separation between the main
                    dwelling and the basement unit. This often includes Type X
                    drywall, sealed penetrations, fire-rated doors, and
                    interconnected smoke / CO alarms.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    3. Egress &amp; Safe Exits
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    The suite must have a safe way out. Bedroom windows often
                    need to meet minimum egress requirements, and the unit’s exit
                    path must be continuous and compliant.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    4. HVAC, Ventilation &amp; Utilities
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    Heating and ventilation are a major legal-suite issue. Many
                    projects need dedicated heating solutions, duct adjustments,
                    fire dampers, added exhaust, or electrical upgrades to make
                    the suite code-compliant.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <Calculator className="w-8 h-8 text-emerald-600" />
                Legal Suite Cost Expectations in Ontario
              </h2>

              <p className="text-slate-600 mb-6 leading-relaxed">
                A legal basement apartment is much more expensive than a standard
                basement finish because you are not just renovating — you are
                creating a code-compliant second dwelling unit. In Ontario,
                these projects usually range from <strong>$60,000 to $140,000+</strong>,
                with many landing between <strong>$70,000 and $110,000</strong>
                depending on layout, entrance work, kitchen / bathroom scope,
                HVAC changes, and permit requirements.
              </p>

              <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                <div className="grid grid-cols-[1.4fr_1fr] bg-slate-100 px-5 py-4 text-sm font-bold text-slate-900">
                  <div>Typical Legal Suite Cost Components</div>
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
                    <div className="text-slate-700">Electrical upgrades</div>
                    <div className="text-right font-semibold text-slate-900">
                      $5,000 – $12,000
                    </div>
                  </div>

                  <div className="grid grid-cols-[1.4fr_1fr] px-5 py-4 text-sm md:text-base">
                    <div className="text-slate-700">Plumbing</div>
                    <div className="text-right font-semibold text-slate-900">
                      $5,000 – $14,000
                    </div>
                  </div>

                  <div className="grid grid-cols-[1.4fr_1fr] px-5 py-4 text-sm md:text-base">
                    <div className="text-slate-700">Flooring &amp; finishes</div>
                    <div className="text-right font-semibold text-slate-900">
                      $6,000 – $14,000
                    </div>
                  </div>

                  <div className="grid grid-cols-[1.4fr_1fr] px-5 py-4 text-sm md:text-base">
                    <div className="text-slate-700">Full bathroom</div>
                    <div className="text-right font-semibold text-slate-900">
                      $12,000 – $22,000
                    </div>
                  </div>

                  <div className="grid grid-cols-[1.4fr_1fr] px-5 py-4 text-sm md:text-base">
                    <div className="text-slate-700">Kitchen installation</div>
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
                    <div className="text-slate-700">
                      Fire separation / code compliance work
                    </div>
                    <div className="text-right font-semibold text-slate-900">
                      $5,000 – $15,000
                    </div>
                  </div>

                  <div className="grid grid-cols-[1.4fr_1fr] px-5 py-4 text-sm md:text-base">
                    <div className="text-slate-700">Permits &amp; drawings</div>
                    <div className="text-right font-semibold text-slate-900">
                      $3,000 – $8,000+
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-slate-500 mt-6 leading-relaxed text-sm md:text-base">
                Final pricing depends heavily on whether the suite already has
                enough ceiling height, whether a side entrance exists, how much
                mechanical rework is needed, and how close the basement already
                is to legal-suite standards.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-3xl font-bold text-slate-900 mb-6">
                What Usually Pushes Legal Suite Costs Higher
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <p className="font-semibold text-slate-900 mb-3">
                    Common cost drivers
                  </p>
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li>• No existing side / separate entrance</li>
                    <li>• Low ceiling height or structural constraints</li>
                    <li>• Full kitchen and bathroom additions</li>
                    <li>• Electrical panel upgrades</li>
                    <li>• Older plumbing or drainage changes</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <p className="font-semibold text-slate-900 mb-3">
                    Legal-compliance drivers
                  </p>
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li>• Fire separation requirements</li>
                    <li>• Soundproofing between units</li>
                    <li>• HVAC separation or mechanical revisions</li>
                    <li>• Bedroom egress upgrades</li>
                    <li>• Permit and design complexity</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <FileText className="w-8 h-8 text-emerald-600" />
                Permits, Drawings &amp; Approvals
              </h2>

              <p className="text-slate-600 mb-6 leading-relaxed">
                Legal suites almost always require proper drawings, permits, and
                inspections. This is not the type of project where guessing is
                safe. Even when the basement already looks “mostly done,” legal
                conversion often reveals hidden work needed for fire separation,
                egress, ventilation, and code compliance.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                  <p className="font-semibold text-slate-900 mb-4">
                    You will usually need to address:
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700">
                        Municipal zoning compliance
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700">
                        Architectural / permit drawings
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700">
                        Fire separation details
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700">
                        Egress and exit requirements
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700">
                        HVAC / ventilation compliance
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <p className="font-semibold text-slate-900 mb-4">
                    Why people underestimate the project
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700">
                        They compare it to a standard basement finish
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700">
                        Quotes often exclude key code-related work
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700">
                        Existing basements are rarely “legal-ready”
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700">
                        Entrance and mechanical changes add up quickly
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:w-1/3">
            <div className="sticky top-28 space-y-6">
              <div className="bg-slate-900 p-8 rounded-2xl shadow-xl text-white">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                  <Hammer className="w-8 h-8 text-emerald-400" />
                </div>

                <h3 className="text-2xl font-bold mb-4">
                  Ready to price your legal suite properly?
                </h3>

                <p className="text-slate-400 mb-6">
                  Tell us about your property and we’ll help identify the
                  best-fit contractor based on project type, legal-suite scope,
                  and likely budget range.
                </p>

                <Link
                  to="/match"
                  className="block w-full text-center bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl transition-colors"
                >
                  Find the Right Contractor
                </Link>

                <p className="text-xs text-center text-slate-500 mt-4">
                  100% free. No obligation to hire.
                </p>
              </div>

              <div className="bg-yellow-50 p-8 rounded-2xl shadow-sm border border-yellow-200">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-800 mb-3">
                  Hamilton incentive
                </p>

                <h3 className="text-2xl font-bold text-slate-900 mb-4">
                  Up to $40,000 Available for Qualifying Legal Suites
                </h3>

                <p className="text-slate-700 mb-4">
                  Homeowners in Hamilton may qualify for a city-backed incentive
                  covering up to <strong>70% of eligible construction costs</strong>{' '}
                  when building a legal basement apartment or secondary unit.
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

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mb-5">
                  <FileText className="w-7 h-7 text-emerald-600" />
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  Legal suite checklist
                </h3>

                <p className="text-slate-600 text-sm leading-7 mb-5">
                  A proper legal-suite project starts with the right assumptions
                  about zoning, permits, exits, and fire separation — not just a
                  contractor quote.
                </p>

                <p className="text-sm font-medium text-slate-900">
                  Good projects are planned. Expensive mistakes usually are not.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}