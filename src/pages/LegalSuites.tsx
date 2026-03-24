import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, AlertTriangle, FileText, Calculator } from 'lucide-react';

export default function LegalSuites() {
  return (
    <div className="bg-slate-50 min-h-screen">
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
              The definitive guide to building a legal, code-compliant income suite. Learn about zoning, fire separation, egress windows, and costs.
            </p>
            <Link to="/match" className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all inline-flex items-center gap-2">
              Find Specialized Contractors <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-12">
          
          <div className="lg:w-2/3 space-y-12">
            
            <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl flex gap-4">
              <AlertTriangle className="w-8 h-8 text-amber-600 shrink-0" />
              <div>
                <h3 className="font-bold text-amber-900 mb-2">Why "Legal" Matters</h3>
                <p className="text-amber-800 text-sm leading-relaxed">
                  Building an illegal basement apartment can lead to severe consequences, including forced eviction of tenants, massive fines, voided home insurance, and orders to tear out the work. Always build to code.
                </p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-3xl font-bold text-slate-900 mb-6">The 4 Pillars of a Legal Suite</h2>
              
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">1. Zoning & Parking</h3>
                  <p className="text-slate-600">Your municipality must allow secondary suites in your specific zone. You typically also need to provide an additional parking space for the tenant.</p>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">2. Fire Separation</h3>
                  <p className="text-slate-600">A continuous fire separation (usually 30-45 minutes) must exist between the main dwelling and the suite. This involves specific drywall (Type X), fire doors, and interconnected smoke alarms.</p>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">3. Egress (Exits)</h3>
                  <p className="text-slate-600">The suite must have a safe, continuous, and unobstructed exit. If the exit is shared, specific fire separation rules apply. Bedrooms also require egress windows of a specific size.</p>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">4. HVAC & Utilities</h3>
                  <p className="text-slate-600">Heating and ventilation must be addressed. You cannot share a single duct system between units without specialized smoke dampers, which is why many opt for separate baseboard heaters or ductless mini-splits for the suite.</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <Calculator className="w-8 h-8 text-emerald-600" /> 
                Cost Expectations
              </h2>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Converting an unfinished basement into a legal secondary suite is significantly more expensive than a standard basement finish due to the strict code requirements. Expect costs between <strong>$85,000 and $140,000+</strong>.
              </p>
            </div>

          </div>

          <div className="lg:w-1/3">
            <div className="sticky top-28 bg-slate-900 p-8 rounded-2xl shadow-xl text-white">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                <FileText className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Download the Legal Suite Checklist</h3>
              <p className="text-slate-400 mb-6">
                Get our comprehensive 20-point checklist to see if your home qualifies for a legal secondary suite before you spend money on drawings.
              </p>
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <input type="email" placeholder="Your email address" className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-500 outline-none" />
                <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-colors">
                  Get The Checklist
                </button>
              </form>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
