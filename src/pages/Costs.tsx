import { Link } from 'react-router-dom';
import {
  Calculator,
  ArrowRight,
  Info,
  Home,
  ShieldCheck,
  PaintBucket,
  Bath,
  Landmark,
  CheckCircle2,
} from 'lucide-react';

export default function Costs() {
  return (
    <div className="bg-slate-50 min-h-screen py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
            <Calculator className="w-4 h-4" /> 2026 Ontario Pricing
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Ontario Renovation Cost Guides
          </h1>

          <p className="text-xl text-slate-600 leading-relaxed">
            Real price ranges based on recent Ontario projects, so you can set
            better expectations before speaking with a contractor.
          </p>
        </div>

        {/* Disclaimer */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-10 flex gap-4 items-start max-w-5xl mx-auto">
          <Info className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
          <p className="text-sm text-blue-900 leading-relaxed">
            <strong>Disclaimer:</strong> These ranges are meant to help Ontario
            homeowners plan more realistically. Final costs can vary based on
            material choices, structural issues, scope changes, municipality,
            hidden site conditions, and how detailed the quote actually is.
          </p>
        </div>

        {/* Hamilton Incentive Strip */}
        <div className="max-w-5xl mx-auto mb-14">
          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 px-6 py-5 md:px-8 md:py-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-yellow-800">
                  <Landmark className="w-4 h-4" />
                  Hamilton Basement Incentive
                </div>
                <p className="mt-2 text-sm leading-7 text-slate-700 md:text-base">
                  Hamilton homeowners may qualify for up to <strong>$40,000</strong>{' '}
                  toward a legal basement apartment or secondary suite, depending
                  on project eligibility and approval.
                </p>
              </div>

              <Link
                to="/hamilton-basement-grant"
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                See Hamilton Grant
              </Link>
            </div>
          </div>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Card 1 */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-8">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-5">
                <Home className="w-6 h-6" />
              </div>

              <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">
                Basement Finishing
              </div>

              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                Basement (Personal Use)
              </h2>

              <div className="text-4xl font-bold text-blue-600 mb-5">
                $45K - $85K+
              </div>

              <p className="text-slate-600 text-sm leading-7 mb-6">
                Most projects fall between <strong>$50K - $70K</strong>,
                depending on size, layout, and finish level.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Typical use</span>
                  <span className="font-semibold text-slate-900">
                    Personal living space
                  </span>
                </div>
                <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Permit impact</span>
                  <span className="font-semibold text-slate-900">
                    Varies by scope
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Timeline</span>
                  <span className="font-semibold text-slate-900">
                    4-6 Weeks
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Link
                  to="/basements"
                  className="block w-full text-center border border-slate-300 hover:bg-slate-50 text-slate-900 font-semibold py-3 rounded-xl transition-colors"
                >
                  Read Basement Guide
                </Link>
                <Link
                  to="/match"
                  className="block w-full text-center bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  Get Quotes for Your Basement
                </Link>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl shadow-xl border border-[#1B3C6C] overflow-hidden relative">
            <div className="absolute top-0 right-0 bg-[#1B3C6C] text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
              Most Popular
            </div>

            <div className="p-8">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1B3C6C] flex items-center justify-center mb-5">
                <ShieldCheck className="w-6 h-6" />
              </div>

              <div className="text-sm font-bold text-[#1B3C6C] uppercase tracking-wider mb-2">
                Legal Secondary Suite
              </div>

              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                Legal Basement Apartment
              </h2>

              <div className="text-4xl font-bold text-slate-900 mb-5">
                $60K - $140K+
              </div>

              <p className="text-slate-600 text-sm leading-7 mb-6">
                Most projects fall between <strong>$70K - $110K</strong>,
                depending on entrance work, permits, and code-compliant scope.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Permits &amp; Drawings</span>
                  <span className="font-semibold text-slate-900">
                    ~$3,000 - $5,000+
                  </span>
                </div>
                <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Typical use</span>
                  <span className="font-semibold text-slate-900">
                    Income-generating unit
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Timeline</span>
                  <span className="font-semibold text-slate-900">
                    8-12 Weeks
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Link
                  to="/legal-suites"
                  className="block w-full text-center border border-slate-300 hover:bg-slate-50 text-slate-900 font-semibold py-3 rounded-xl transition-colors"
                >
                  Read Legal Suite Guide
                </Link>
                <Link
                  to="/match"
                  className="block w-full text-center bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  Get Quotes for a Legal Suite
                </Link>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-8">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-5">
                <PaintBucket className="w-6 h-6" />
              </div>

              <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">
                Kitchen Renovation
              </div>

              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                Full Kitchen Renovation
              </h2>

              <div className="text-4xl font-bold text-blue-600 mb-5">
                $30K - $75K+
              </div>

              <p className="text-slate-600 text-sm leading-7 mb-6">
                Most projects fall between <strong>$35K - $55K</strong>,
                depending on cabinetry, countertops, appliances, and layout
                complexity.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Design / planning</span>
                  <span className="font-semibold text-slate-900">
                    Varies by scope
                  </span>
                </div>
                <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Common trigger</span>
                  <span className="font-semibold text-slate-900">
                    Cabinets + layout
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Timeline</span>
                  <span className="font-semibold text-slate-900">
                    3-6 Weeks
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Link
                  to="/kitchen-renovations"
                  className="block w-full text-center border border-slate-300 hover:bg-slate-50 text-slate-900 font-semibold py-3 rounded-xl transition-colors"
                >
                  Read Kitchen Guide
                </Link>
                <Link
                  to="/match"
                  className="block w-full text-center bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  Get Quotes for Your Kitchen
                </Link>
              </div>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-8">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-5">
                <Bath className="w-6 h-6" />
              </div>

              <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">
                Bathroom Renovation
              </div>

              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                Full Bathroom Renovation
              </h2>

              <div className="text-4xl font-bold text-blue-600 mb-5">
                $15K - $40K+
              </div>

              <p className="text-slate-600 text-sm leading-7 mb-6">
                Most projects fall between <strong>$20K - $30K</strong>,
                depending on waterproofing, tile, fixtures, and layout changes.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Waterproofing</span>
                  <span className="font-semibold text-slate-900">
                    Major cost driver
                  </span>
                </div>
                <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Typical scope</span>
                  <span className="font-semibold text-slate-900">
                    Full gut + rebuild
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Timeline</span>
                  <span className="font-semibold text-slate-900">
                    2-4 Weeks
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Link
                  to="/bathroom-renovations"
                  className="block w-full text-center border border-slate-300 hover:bg-slate-50 text-slate-900 font-semibold py-3 rounded-xl transition-colors"
                >
                  Read Bathroom Guide
                </Link>
                <Link
                  to="/match"
                  className="block w-full text-center bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  Get Quotes for Your Bathroom
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Notes */}
        <div className="max-w-5xl mx-auto mt-16">
          <div className="rounded-2xl border border-slate-200 bg-white p-8">
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <div className="flex items-center gap-2 text-slate-900 font-semibold mb-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  Prices vary for a reason
                </div>
                <p className="text-sm leading-7 text-slate-600">
                  Layout changes, finish level, hidden site conditions, and
                  permit requirements can move pricing much more than most
                  homeowners expect.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-slate-900 font-semibold mb-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  Lower quotes can mislead
                </div>
                <p className="text-sm leading-7 text-slate-600">
                  Some quotes leave out critical components like demo, disposal,
                  electrical changes, waterproofing, finish details, or permit
                  scope.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-slate-900 font-semibold mb-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  Use guides before quotes
                </div>
                <p className="text-sm leading-7 text-slate-600">
                  These ranges are meant to help you anchor your expectations
                  before you start comparing contractors or narrowing scope.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="max-w-4xl mx-auto mt-14 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Want pricing based on your actual project?
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Tell us what you’re building and we’ll help point you toward the
            right contractor for your scope, budget, and renovation type.
          </p>

          <Link
            to="/match"
            className="inline-flex items-center justify-center bg-[#1B3C6C] hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all"
          >
            Get Matched <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </div>
    </div>
  );
}