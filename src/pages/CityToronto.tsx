import { Link } from 'react-router-dom';
import { MapPin, ArrowRight, Building2, Calculator, ShieldCheck } from 'lucide-react';

export default function CityToronto() {
  return (
    <div className="bg-slate-50 min-h-screen">
      {/* City Hero */}
      <section className="relative bg-slate-900 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-30">
          <img 
            src="https://images.unsplash.com/photo-1507992781348-310259076fe0?auto=format&fit=crop&q=80&w=2000" 
            alt="Toronto Skyline" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white font-medium mb-6 backdrop-blur-sm">
            <MapPin className="w-4 h-4" /> Toronto, ON
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Toronto Home Renovation Guide
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10">
            Navigate Toronto building permits, understand local costs, and find the city's best vetted contractors for your next project.
          </p>
          <Link to="/match" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all inline-flex items-center gap-2 shadow-lg">
            Find Toronto Contractors <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <Building2 className="w-10 h-10 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-3">Toronto Permits</h3>
              <p className="text-slate-600 text-sm mb-4">Toronto has strict zoning and permit requirements, especially for secondary suites and additions. Wait times can range from 2-8 weeks.</p>
              <a href="#" className="text-blue-600 font-semibold text-sm hover:underline">Read Toronto Permit Guide</a>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <Calculator className="w-10 h-10 text-emerald-600 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-3">Local Pricing</h3>
              <p className="text-slate-600 text-sm mb-4">Renovation costs in Toronto are typically 10-15% higher than the provincial average due to labor demand and logistics (parking, disposal).</p>
              <Link to="/costs" className="text-emerald-600 font-semibold text-sm hover:underline">View Toronto Cost Data</Link>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <ShieldCheck className="w-10 h-10 text-purple-600 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-3">Vetted Pros</h3>
              <p className="text-slate-600 text-sm mb-4">We've pre-screened hundreds of Toronto contractors, verifying their City of Toronto Municipal Licensing & Standards (MLS) license.</p>
              <Link to="/match" className="text-purple-600 font-semibold text-sm hover:underline">Get Matched</Link>
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl p-8 md:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="md:w-2/3">
              <h2 className="text-3xl font-bold mb-4">Building a Laneway Suite in Toronto?</h2>
              <p className="text-slate-300 text-lg mb-6">
                Toronto's "Changing Lanes" initiative allows eligible homeowners to build secondary dwellings in their backyards. Learn the rules, costs, and find specialized builders.
              </p>
              <button className="bg-white text-slate-900 px-6 py-3 rounded-lg font-bold hover:bg-slate-100 transition-colors">
                Explore Laneway Suites Guide
              </button>
            </div>
            <div className="md:w-1/3 w-full">
              <img 
                src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800" 
                alt="Modern Home" 
                className="rounded-2xl shadow-2xl"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
