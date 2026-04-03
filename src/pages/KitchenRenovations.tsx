import { Link } from 'react-router-dom';
import {
  CookingPot,
  ArrowRight,
  FileText,
  Calculator,
  CheckCircle2,
  Hammer,
  AlertTriangle,
} from 'lucide-react';

export default function KitchenRenovations() {
  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero */}
      <section className="bg-slate-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/20 text-blue-300 text-sm font-medium mb-6">
              <CookingPot className="w-4 h-4" /> Ontario Renovation Hub
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Kitchen Renovation Costs in Ontario
            </h1>

            <p className="text-xl text-slate-300 mb-8">
              Real pricing, smart planning, and what actually drives kitchen renovation
              costs across Ontario — before you start collecting quotes.
            </p>

            <Link
              to="/match"
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all inline-flex items-center gap-2"
            >
              Find Kitchen Contractors <ArrowRight className="w-5 h-5" />
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
                Kitchen Renovation Costs in Ontario
              </h2>

              <p className="text-slate-600 mb-6 leading-relaxed">
                In Ontario, kitchen renovations usually range from{' '}
                <strong>$30,000 to $70,000+</strong>, with many projects falling
                between <strong>$35,000 and $55,000</strong>. Final cost depends on
                cabinet quality, layout changes, countertops, electrical and plumbing
                work, appliance selections, and whether walls or structural elements
                are being modified.
              </p>

              <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                <div className="grid grid-cols-[1.4fr_1fr] bg-slate-100 px-5 py-4 text-sm font-bold text-slate-900">
                  <div>Typical Ontario Kitchen Cost Components</div>
                  <div className="text-right">Estimated Range</div>
                </div>

                <div className="divide-y divide-slate-200 bg-white">
                  <div className="grid grid-cols-[1.4fr_1fr] px-5 py-4 text-sm md:text-base">
                    <div className="text-slate-700">Cabinetry</div>
                    <div className="text-right font-semibold text-slate-900">
                      $10,000 – $25,000+
                    </div>
                  </div>

                  <div className="grid grid-cols-[1.4fr_1fr] px-5 py-4 text-sm md:text-base">
                    <div className="text-slate-700">Countertops</div>
                    <div className="text-right font-semibold text-slate-900">
                      $3,500 – $10,000+
                    </div>
                  </div>

                  <div className="grid grid-cols-[1.4fr_1fr] px-5 py-4 text-sm md:text-base">
                    <div className="text-slate-700">Backsplash</div>
                    <div className="text-right font-semibold text-slate-900">
                      $1,500 – $4,500
                    </div>
                  </div>

                  <div className="grid grid-cols-[1.4fr_1fr] px-5 py-4 text-sm md:text-base">
                    <div className="text-slate-700">Flooring</div>
                    <div className="text-right font-semibold text-slate-900">
                      $3,000 – $8,000
                    </div>
                  </div>

                  <div className="grid grid-cols-[1.4fr_1fr] px-5 py-4 text-sm md:text-base">
                    <div className="text-slate-700">Electrical</div>
                    <div className="text-right font-semibold text-slate-900">
                      $3,000 – $8,000
                    </div>
                  </div>

                  <div className="grid grid-cols-[1.4fr_1fr] px-5 py-4 text-sm md:text-base">
                    <div className="text-slate-700">Plumbing</div>
                    <div className="text-right font-semibold text-slate-900">
                      $2,500 – $8,000
                    </div>
                  </div>

                  <div className="grid grid-cols-[1.4fr_1fr] px-5 py-4 text-sm md:text-base">
                    <div className="text-slate-700">Demolition & prep</div>
                    <div className="text-right font-semibold text-slate-900">
                      $2,000 – $5,000
                    </div>
                  </div>

                  <div className="grid grid-cols-[1.4fr_1fr] px-5 py-4 text-sm md:text-base">
                    <div className="text-slate-700">Painting & finishing</div>
                    <div className="text-right font-semibold text-slate-900">
                      $2,000 – $5,000
                    </div>
                  </div>

                  <div className="grid grid-cols-[1.4fr_1fr] px-5 py-4 text-sm md:text-base">
                    <div className="text-slate-700">Appliances</div>
                    <div className="text-right font-semibold text-slate-900">
                      $4,000 – $15,000+
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-slate-500 mt-6 leading-relaxed text-sm md:text-base">
                Kitchens move up in price quickly when the layout changes, the panel
                needs upgrading, plumbing is relocated, or the project includes
                premium cabinetry, quartz or stone surfaces, built-in appliances, or
                custom millwork details.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-3xl font-bold text-slate-900 mb-6">
                What Actually Drives Kitchen Costs
              </h2>

              <p className="text-slate-600 mb-6 leading-relaxed">
                Two kitchens can look similar in photos and still be tens of thousands
                apart in price. The biggest cost differences come from materials,
                layout complexity, and how much hidden work is needed behind the walls.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <p className="font-semibold text-slate-900 mb-3">
                    Common cost drivers
                  </p>
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li>• Cabinet material and construction quality</li>
                    <li>• Quartz, granite, or premium countertop choices</li>
                    <li>• Moving sink, dishwasher, or gas lines</li>
                    <li>• Electrical rewiring or panel upgrades</li>
                    <li>• Built-in appliances and custom trim work</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <p className="font-semibold text-slate-900 mb-3">
                    Scope-related drivers
                  </p>
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li>• Removing walls or changing the footprint</li>
                    <li>• Leveling floors or correcting framing issues</li>
                    <li>• New lighting plan and added circuits</li>
                    <li>• Venting changes for range hoods</li>
                    <li>• Permit and design complexity</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl flex gap-4">
              <AlertTriangle className="w-8 h-8 text-amber-600 shrink-0" />
              <div>
                <h3 className="font-bold text-amber-900 mb-2">
                  Why kitchen quotes vary so much
                </h3>
                <p className="text-amber-800 text-sm leading-relaxed">
                  Some quotes look cheaper because they leave out major pieces of the
                  project: appliance supply, backsplash, demo, finish work, permit
                  drawings, waste removal, electrical upgrades, or even installation
                  details tied to cabinetry and countertops.
                </p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" />
                Do You Need a Permit?
              </h2>

              <p className="text-slate-600 mb-6 leading-relaxed">
                Sometimes yes, sometimes no. A simple cabinet-and-finish refresh may
                not require a permit. But once you start moving plumbing, altering
                electrical, removing walls, or changing structure, permits and proper
                approvals often become part of the job.
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
                        Removing or modifying walls
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700">
                        Moving sink or major plumbing lines
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700">
                        Adding new electrical circuits
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700">
                        Structural or beam changes
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700">
                        Range hood venting changes
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
                        Protects safety and code compliance
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700">
                        Helps avoid surprise corrections later
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
                        Prevents shortcuts on hidden work
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
                  Tell us about your kitchen project and we’ll help identify the
                  best-fit contractor based on your scope, budget, and finish level.
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
                  Lower quotes often exclude critical components
                </h3>

                <p className="text-slate-600 text-sm leading-7">
                  In kitchen renovations, cheaper quotes often leave out appliance
                  installation, backsplash, finish carpentry, electrical upgrades,
                  plumbing relocation, waste removal, or project management. That is
                  why some “budget” quotes rise sharply once work begins.
                </p>
              </div>

              <div className="bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-800 text-white">
                <h3 className="text-lg font-bold mb-3">
                  Most homeowners underestimate kitchen costs
                </h3>

                <p className="text-sm leading-7 text-slate-300">
                  Kitchens are one of the most finish-sensitive projects in the home.
                  Small material and layout decisions can move pricing dramatically,
                  especially when cabinetry, countertops, lighting, and hidden
                  electrical or plumbing work are involved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}