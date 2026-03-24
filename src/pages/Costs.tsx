import { Link } from 'react-router-dom';
import { Calculator, ArrowRight, Info } from 'lucide-react';

export default function Costs() {
  return (
    <div className="bg-slate-50 min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
            <Calculator className="w-4 h-4" /> 2026 Data
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Ontario Renovation Cost Guides
          </h1>
          <p className="text-xl text-slate-600">
            Stop guessing. Get realistic, localized pricing data for your next home improvement project based on recent Ontario contracts.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-12 flex gap-4 items-start max-w-4xl mx-auto">
          <Info className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
          <p className="text-sm text-blue-900 leading-relaxed">
            <strong>Disclaimer:</strong> Prices shown are averages for the Greater Toronto Area and surrounding regions. Costs can vary wildly based on material choices, structural issues, and specific municipal permit fees. Always get 3 quotes from vetted professionals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          
          {/* Cost Card 1 */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Standard Basement Finish</h2>
              <p className="text-slate-500 text-sm mb-6">800 sq.ft, open concept, 3-piece bath</p>
              <div className="text-4xl font-bold text-blue-600 mb-6">$45,000 - $75,000</div>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Low-End (Basic finishes)</span>
                  <span className="font-semibold text-slate-900">~$45k</span>
                </div>
                <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Mid-Range (Standard)</span>
                  <span className="font-semibold text-slate-900">~$60k</span>
                </div>
                <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                  <span className="text-slate-600">High-End (Custom)</span>
                  <span className="font-semibold text-slate-900">$80k+</span>
                </div>
              </div>
              
              <Link to="/match" className="block w-full text-center bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl transition-colors">
                Get Quotes for Your Basement
              </Link>
            </div>
          </div>

          {/* Cost Card 2 */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
            <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">High ROI</div>
            <div className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Legal Secondary Suite</h2>
              <p className="text-slate-500 text-sm mb-6">Full conversion to code, separate entrance</p>
              <div className="text-4xl font-bold text-emerald-600 mb-6">$85,000 - $140,000</div>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Permits & Drawings</span>
                  <span className="font-semibold text-slate-900">$4k - $8k</span>
                </div>
                <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Fire Separation & Egress</span>
                  <span className="font-semibold text-slate-900">$15k - $25k</span>
                </div>
                <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Kitchen & Bath</span>
                  <span className="font-semibold text-slate-900">$25k - $40k</span>
                </div>
              </div>
              
              <Link to="/match" className="block w-full text-center bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl transition-colors">
                Get Quotes for a Legal Suite
              </Link>
            </div>
          </div>

          {/* Cost Card 3 */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Kitchen Renovation</h2>
              <p className="text-slate-500 text-sm mb-6">Full gut, new cabinets, counters, appliances</p>
              <div className="text-4xl font-bold text-blue-600 mb-6">$30,000 - $65,000</div>
              
              <Link to="/match" className="block w-full text-center bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl transition-colors mt-auto">
                Get Quotes for Your Kitchen
              </Link>
            </div>
          </div>

          {/* Cost Card 4 */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Bathroom Remodel</h2>
              <p className="text-slate-500 text-sm mb-6">Full gut, waterproofing, new fixtures</p>
              <div className="text-4xl font-bold text-blue-600 mb-6">$15,000 - $35,000</div>
              
              <Link to="/match" className="block w-full text-center bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl transition-colors mt-auto">
                Get Quotes for Your Bathroom
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
