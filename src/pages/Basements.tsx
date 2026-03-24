import { Link } from 'react-router-dom';
import { Home, CheckCircle2, ArrowRight, FileText, Calculator, Hammer } from 'lucide-react';

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
              Everything you need to know about costs, permits, layouts, and hiring the right contractor for your basement project.
            </p>
            <Link to="/match" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all inline-flex items-center gap-2">
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
                How much does it cost?
              </h2>
              <p className="text-slate-600 mb-6 leading-relaxed">
                In 2026, the average cost to finish a basement in Ontario ranges from <strong>$45,000 to $75,000+</strong>. This heavily depends on the size of your basement, the materials you choose, and whether you are adding a bathroom or kitchen.
              </p>
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-4">Cost Breakdown (Average 800 sq.ft)</h3>
                <ul className="space-y-3">
                  <li className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-600">Framing & Drywall</span>
                    <span className="font-semibold text-slate-900">$8,000 - $12,000</span>
                  </li>
                  <li className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-600">Electrical & Plumbing</span>
                    <span className="font-semibold text-slate-900">$7,000 - $15,000</span>
                  </li>
                  <li className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-600">Flooring</span>
                    <span className="font-semibold text-slate-900">$4,000 - $8,000</span>
                  </li>
                  <li className="flex justify-between pt-2">
                    <span className="text-slate-600">Permits & Drawings</span>
                    <span className="font-semibold text-slate-900">$1,500 - $3,000</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" /> 
                Do I need a permit?
              </h2>
              <p className="text-slate-600 mb-6 leading-relaxed">
                <strong>Yes.</strong> If you are finishing a previously unfinished basement in Ontario, you almost certainly need a building permit. This ensures your renovation meets the Ontario Building Code (OBC) for safety, structural integrity, and energy efficiency.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-600">Adding or moving walls (framing)</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-600">Installing new plumbing (bathroom)</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-600">Altering electrical wiring</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-600">Enlarging windows (egress)</p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column - Sidebar / Lead Capture */}
          <div className="lg:w-1/3">
            <div className="sticky top-28 bg-white p-8 rounded-2xl shadow-xl border border-blue-100">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                <Hammer className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Ready to get quotes?</h3>
              <p className="text-slate-600 mb-6">
                Describe your basement project once, and we'll match you with up to 3 vetted, licensed contractors in your area.
              </p>
              <Link to="/match" className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-colors">
                Get Matched Now
              </Link>
              <p className="text-xs text-center text-slate-400 mt-4">100% free. No obligation to hire.</p>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
