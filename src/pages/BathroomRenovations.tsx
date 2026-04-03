import { Link } from 'react-router-dom';
import {
  Bath,
  ArrowRight,
  FileText,
  Calculator,
  CheckCircle2,
  Hammer,
  AlertTriangle,
} from 'lucide-react';

export default function BathroomRenovations() {
  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero */}
      <section className="bg-slate-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/20 text-blue-300 text-sm font-medium mb-6">
              <Bath className="w-4 h-4" /> Ontario Renovation Hub
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Bathroom Renovation Costs in Ontario
            </h1>

            <p className="text-xl text-slate-300 mb-8">
              Real bathroom pricing, smart planning, and what actually drives
              renovation costs across Ontario before you commit to a contractor.
            </p>

            <Link
              to="/match"
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all inline-flex items-center gap-2"
            >
              Find Bathroom Contractors <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-12">
          {/* Left Column */}
          <div className="lg:w-2/3 space-y-12">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <Calculator className="w-8 h-8 text-blue-600" />
                Bathroom Renovation Costs in Ontario
              </h2>

              <p className="text-slate-600 mb-6 leading-relaxed">
                In Ontario, bathroom renovations usually range from{' '}
                <strong>$15,000 to $40,000+</strong>, with many projects falling
                between <strong>$20,000 and $30,000</strong>. Final cost depends
                on tile selection, waterproofing scope, plumbing changes, vanity
                and fixture quality, glass work, and whether the layout stays the
                same or is being reconfigured.
              </p>

              <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                <div className="grid grid-cols-[1.4fr_1fr] bg-slate-100 px-5 py-4 text-sm font-bold text-slate-900">
                  <div>Typical Ontario Bathroom Cost Components</div>
                  <div className="text-right">Estimated Range</div>
                </div>

                <div className="divide-y divide-slate-200 bg-white">
                  <div className="grid grid-cols-[1.4fr_1fr] px-5 py-4 text-sm md:text-base">
                    <div className="text-slate-700">Demolition & prep</div>
                    <div className="text-right font-semibold text-slate-900">
                      $1,500 – $4,000
                    </div>
                  </div>

                  <div className="grid grid-cols-[1.4fr_1fr] px-5 py-4 text-sm md:text-base">
                    <div className="text-slate-700">
                      Waterproofing & shower prep
                    </div>
                    <div className="text-right font-semibold text-slate-900">
                      $2,500 – $6,000
                    </div>
                  </div>

                  <div className="grid grid-cols-[1.4fr_1fr] px-5 py-4 text-sm md:text-base">
                    <div className="text-slate-700">Tile supply & installation</div>
                    <div className="text-right font-semibold text-slate-900">
                      $5,000 – $14,000+
                    </div>
                  </div>

                  <div className="grid grid-cols-[1.4fr_1fr] px-5 py-4 text-sm md:text-base">
                    <div className="text-slate-700">Vanity & countertop</div>
                    <div className="text-right font-semibold text-slate-900">
                      $2,500 – $7,000+
                    </div>
                  </div>

                  <div className="grid grid-cols-[1.4fr_1fr] px-5 py-4 text-sm md:text-base">
                    <div className="text-slate-700">Toilet, tub, shower fixtures</div>
                    <div className="text-right font-semibold text-slate-900">
                      $2,500 – $8,000+
                    </div>
                  </div>

                  <div className="grid grid-cols-[1.4fr_1fr] px-5 py-4 text-sm md:text-base">
                    <div className="text-slate-700">Plumbing changes</div>
                    <div className="text-right font-semibold text-slate-900">
                      $2,500 – $8,000
                    </div>
                  </div>

                  <div className="grid grid-cols-[1.4fr_1fr] px-5 py-4 text-sm md:text-base">
                    <div className="text-slate-700">Electrical & lighting</div>
                    <div className="text-right font-semibold text-slate-900">
                      $1,500 – $5,000
                    </div>
                  </div>

                  <div className="grid grid-cols-[1.4fr_1fr] px-5 py-4 text-sm md:text-base">
                    <div className="text-slate-700">Glass / shower enclosure</div>
                    <div className="text-right font-semibold text-slate-900">
                      $1,500 – $5,000+
                    </div>
                  </div>

                  <div className="grid grid-cols-[1.4fr_1fr] px-5 py-4 text-sm md:text-base">
                    <div className="text-slate-700">Painting & finishing</div>
                    <div className="text-right font-semibold text-slate-900">
                      $1,500 – $4,000
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-slate-500 mt-6 leading-relaxed text-sm md:text-base">
                Bathrooms become expensive quickly when premium tile, custom
                glass, layout changes, plumbing relocation, in-floor heating, or
                waterproofing remediation are part of the job.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-3xl font-bold text-slate-900 mb-6">
                What Actually Drives Bathroom Costs
              </h2>

              <p className="text-slate-600 mb-6 leading-relaxed">
                Two bathrooms of similar size can land far apart in price. In
                most cases, the biggest differences come from tile selection,
                waterproofing scope, fixture quality, and whether plumbing or
                layout changes are needed.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <p className="font-semibold text-slate-900 mb-3">
                    Common cost drivers
                  </p>
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li>• Tile size, type, and installation complexity</li>
                    <li>• Custom shower builds and waterproofing</li>
                    <li>• Vanity, countertop, and fixture upgrades</li>
                    <li>• Plumbing relocation</li>
                    <li>• Glass enclosures and premium hardware</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <p className="font-semibold text-slate-900 mb-3">
                    Scope-related drivers
                  </p>
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li>• Rot, mold, or subfloor repair discovered after demo</li>
                    <li>• Electrical corrections and added lighting</li>
                    <li>• In-floor heating systems</li>
                    <li>• Niche details, benches, and custom trim</li>
                    <li>• Permit and design complexity</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl flex gap-4">
              <AlertTriangle className="w-8 h-8 text-amber-600 shrink-0" />
              <div>
                <h3 className="font-bold text-amber-900 mb-2">
                  Why bathroom quotes can be misleading
                </h3>
                <p className="text-amber-800 text-sm leading-relaxed">
                  Some quotes look attractive because they exclude waterproofing
                  details, fixture allowances, glass, tile prep, hidden plumbing
                  work, waste removal, or finish-level assumptions. Bathrooms are
                  one of the easiest places for “extras” to show up if the quote
                  is not detailed.
                </p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" />
                Do You Need a Permit?
              </h2>

              <p className="text-slate-600 mb-6 leading-relaxed">
                Sometimes. A straightforward bathroom refresh that keeps the same
                layout may not require a permit. But once plumbing is relocated,
                electrical is modified, ventilation changes, or structural work
                is involved, permits and code compliance become much more likely.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                  <p className="font-semibold text-slate-900 mb-4">
                    Permits are more likely needed for:
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700">
                        Moving drains or plumbing lines
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700">
                        New electrical circuits or wiring changes
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700">
                        Ventilation / exhaust changes
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700">
                        Structural framing modifications
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700">
                        Adding a brand new bathroom where one did not exist
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <p className="font-semibold text-slate-900 mb-4">
                    Why this matters
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700">
                        Protects waterproofing and code compliance
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700">
                        Helps avoid hidden failures behind finished tile
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700">
                        Important for resale and renovation documentation
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700">
                        Prevents shortcuts on plumbing and ventilation work
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
              <div className="bg-white p-8 rounded-2xl shadow-xl border border-blue-100">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                  <Hammer className="w-8 h-8 text-blue-600" />
                </div>

                <h3 className="text-2xl font-bold text-slate-900 mb-4">
                  Ready to get quotes?
                </h3>

                <p className="text-slate-600 mb-6">
                  Tell us about your bathroom project and we’ll help identify the
                  best-fit contractor based on your scope, budget, and finish
                  level.
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

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 mb-3">
                  Ontario pricing reality check
                </p>

                <h3 className="text-xl font-bold text-slate-900 mb-4">
                  Lower quotes often skip the expensive hidden work
                </h3>

                <p className="text-slate-600 text-sm leading-7">
                  In bathroom renovations, cheaper quotes often understate
                  waterproofing, tile prep, plumbing changes, niche work, shower
                  glass, ventilation corrections, or fixture allowances. That is
                  why many “budget” bathrooms become much more expensive once
                  construction begins.
                </p>
              </div>

              <div className="bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-800 text-white">
                <h3 className="text-lg font-bold mb-3">
                  Most homeowners underestimate bathroom complexity
                </h3>

                <p className="text-sm leading-7 text-slate-300">
                  Bathrooms are compact, but they are one of the most technically
                  sensitive rooms in the house. Small mistakes in waterproofing,
                  slope, drainage, or ventilation can become costly problems
                  later.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}