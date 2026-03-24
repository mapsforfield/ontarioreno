import { Link } from 'react-router-dom';
import { ShieldCheck, FileText, Calculator, Users, ArrowRight, CheckCircle2, ChevronDown, Hammer, Home as HomeIcon, PaintBucket, Bath } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';

export default function Home() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-40">
          <img 
            src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=2000" 
            alt="Ontario Home Renovation" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 flex flex-col items-start">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-300 font-medium text-sm mb-8 backdrop-blur-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>Ontario's Independent Homeowner Guide</span>
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-6 max-w-3xl leading-tight">
            Plan Your Renovation with <span className="text-[#5694CF]">Confidence.</span>
          </h1>
          
          <p className="text-xl text-slate-300 mb-10 max-w-2xl leading-relaxed">
            We help Ontario homeowners navigate permits, understand real costs, and connect with vetted local contractors. Not a contracting company—your independent advocate.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link 
              to="/match" 
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-blue-600/25 flex items-center justify-center gap-2"
            >
              Find Vetted Contractors <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              to="/costs" 
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-8 py-4 rounded-xl font-semibold text-lg transition-all backdrop-blur-sm flex items-center justify-center"
            >
              View 2026 Cost Guides
            </Link>
          </div>
          
          <div className="mt-12 flex items-center gap-6 text-sm text-slate-400 font-medium">
            <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Free to use</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Vetted pros</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Ontario specific</div>
          </div>
        </div>
      </section>

      {/* Authority / Trust Section */}
      <section className="py-16 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-slate-100">
            <div className="p-6">
              <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Permit & Code Clarity</h3>
              <p className="text-slate-600 leading-relaxed">Stop guessing. We break down Ontario building codes and municipal permit requirements into plain English.</p>
            </div>
            <div className="p-6">
              <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                <Calculator className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Transparent Pricing</h3>
              <p className="text-slate-600 leading-relaxed">Access real, localized cost data for basements, kitchens, and legal suites across the GTA and beyond.</p>
            </div>
            <div className="p-6">
              <div className="mx-auto w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Contractor Matching</h3>
              <p className="text-slate-600 leading-relaxed">Skip the directory scrolling. Tell us your project, and we'll match you with up to 3 vetted, licensed pros.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Renovation Categories */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Explore Our Renovation Hubs</h2>
            <p className="text-lg text-slate-600">Comprehensive guides, cost breakdowns, and expert advice for Ontario's most popular home improvement projects.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Category Card 1 */}
            <Link to="/basements" className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all border border-slate-100 flex flex-col h-full">
              <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <HomeIcon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Basement Finishing</h3>
              <p className="text-slate-600 text-sm mb-6 flex-grow">From framing to flooring, understand the costs and process of finishing your Ontario basement.</p>
              <div className="flex items-center text-blue-600 font-semibold text-sm mt-auto">
                Explore Hub <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Category Card 2 */}
            <Link to="/legal-suites" className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all border border-slate-100 flex flex-col h-full">
              <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Legal Secondary Suites</h3>
              <p className="text-slate-600 text-sm mb-6 flex-grow">Navigate zoning, fire separation, and municipal requirements to build a legal income suite.</p>
              <div className="flex items-center text-blue-600 font-semibold text-sm mt-auto">
                Explore Hub <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Category Card 3 */}
            <Link to="#" className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all border border-slate-100 flex flex-col h-full">
              <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <PaintBucket className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Kitchen Renovations</h3>
              <p className="text-slate-600 text-sm mb-6 flex-grow">Budgeting for cabinets, countertops, and layouts. Find the right team for the heart of your home.</p>
              <div className="flex items-center text-blue-600 font-semibold text-sm mt-auto">
                Explore Hub <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Category Card 4 */}
            <Link to="#" className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all border border-slate-100 flex flex-col h-full">
              <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Bath className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Bathroom Remodels</h3>
              <p className="text-slate-600 text-sm mb-6 flex-grow">Waterproofing, plumbing, and tile costs. Learn what to expect before you start demo day.</p>
              <div className="flex items-center text-blue-600 font-semibold text-sm mt-auto">
                Explore Hub <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Lead Capture Block */}
      <section className="py-20 bg-blue-600 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-blue-500 rounded-full blur-3xl opacity-50"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="lg:w-1/2">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Get the 2026 Ontario Renovation Cost Guide</h2>
              <p className="text-blue-100 text-lg mb-8">
                Stop guessing on pricing. Download our comprehensive PDF guide breaking down average costs for basements, kitchens, and legal suites across 15+ Ontario cities.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-blue-300" /> Material vs. Labor breakdowns</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-blue-300" /> Permit fee estimates by municipality</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-blue-300" /> Red flags to watch out for in quotes</li>
              </ul>
            </div>
            <div className="lg:w-5/12 w-full">
              <div className="bg-white rounded-2xl p-8 shadow-2xl text-slate-900">
                <h3 className="text-2xl font-bold mb-2">Download Free Guide</h3>
                <p className="text-slate-500 text-sm mb-6">Join 15,000+ Ontario homeowners planning smarter.</p>
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                    <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all" placeholder="John" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                    <input type="email" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all" placeholder="john@example.com" />
                  </div>
                  <button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-colors mt-2">
                    Send Me The Guide
                  </button>
                  <p className="text-xs text-slate-400 text-center mt-4">We respect your privacy. Unsubscribe anytime.</p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing / Cost Education Teaser */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Real Ontario Pricing Data</h2>
              <p className="text-lg text-slate-600">We aggregate data from hundreds of recent projects to give you realistic budget expectations before you talk to a contractor.</p>
            </div>
            <Link to="/costs" className="text-blue-600 font-semibold flex items-center hover:text-blue-700 whitespace-nowrap">
              View All Cost Guides <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pricing Card 1 */}
            <div className="border border-slate-200 rounded-2xl p-8 hover:border-blue-200 hover:shadow-lg transition-all">
              <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Basement Finishing</div>
              <div className="text-3xl font-bold text-slate-900 mb-4">$45k - $75k+</div>
              <p className="text-slate-600 text-sm mb-6">Average cost for a standard 800 sq.ft. open-concept basement in the GTA.</p>
              <div className="space-y-3 pt-6 border-t border-slate-100">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Permits</span>
                  <span className="font-medium text-slate-900">~$1,500</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Timeline</span>
                  <span className="font-medium text-slate-900">4-6 Weeks</span>
                </div>
              </div>
            </div>

            {/* Pricing Card 2 */}
            <div className="border border-blue-600 rounded-2xl p-8 shadow-xl relative transform md:-translate-y-4 bg-white">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Most Popular</div>
              <div className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-2">Legal Secondary Suite</div>
              <div className="text-3xl font-bold text-slate-900 mb-4">$85k - $140k+</div>
              <p className="text-slate-600 text-sm mb-6">Full conversion including separate entrance, fire separation, and full kitchen/bath.</p>
              <div className="space-y-3 pt-6 border-t border-slate-100">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Permits & Drawings</span>
                  <span className="font-medium text-slate-900">~$4,000+</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Timeline</span>
                  <span className="font-medium text-slate-900">8-12 Weeks</span>
                </div>
              </div>
            </div>

            {/* Pricing Card 3 */}
            <div className="border border-slate-200 rounded-2xl p-8 hover:border-blue-200 hover:shadow-lg transition-all">
              <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Kitchen Renovation</div>
              <div className="text-3xl font-bold text-slate-900 mb-4">$30k - $65k+</div>
              <p className="text-slate-600 text-sm mb-6">Complete gut and remodel with mid-to-high end finishes and new appliances.</p>
              <div className="space-y-3 pt-6 border-t border-slate-100">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Design Fees</span>
                  <span className="font-medium text-slate-900">~$2,000</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Timeline</span>
                  <span className="font-medium text-slate-900">5-8 Weeks</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contractor Matching CTA */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-8">
            <Hammer className="w-10 h-10 text-[#5694CF]" />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to start your project?</h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            Don't risk your home with unverified contractors. Tell us about your project, and we'll match you with up to 3 licensed, insured, and vetted professionals in your area.
          </p>
          <Link 
            to="/match" 
            className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-blue-600/25"
          >
            Get Matched Now
          </Link>
          <p className="mt-6 text-sm text-slate-500">100% free service for homeowners. No obligation to hire.</p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-slate-600">Common questions from Ontario homeowners about renovations and our service.</p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Is OntarioReno a contracting company?",
                a: "No. OntarioReno is an independent homeowner resource platform. We provide educational content, cost guides, and a matching service to connect you with vetted local contractors. We do not perform the renovation work ourselves."
              },
              {
                q: "How much does it cost to use your matching service?",
                a: "Our matching service is 100% free for homeowners. We charge a small lead fee to the contractors in our network when they are matched with a project. This allows us to keep the platform free and unbiased for you."
              },
              {
                q: "Do I really need a permit to finish my basement?",
                a: "In almost all Ontario municipalities, yes. If you are adding walls, altering plumbing, or changing electrical, a building permit is required by law. Skipping this can lead to fines, forced removal of work, and issues when selling your home."
              },
              {
                q: "How do you vet the contractors in your network?",
                a: "We have a strict vetting process. We verify their WSIB clearance, minimum $2M liability insurance, business registration, and check references from past clients. We also monitor ongoing performance and remove contractors who fail to meet our standards."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <button 
                  className="w-full px-6 py-4 text-left flex justify-between items-center focus:outline-none"
                  onClick={() => toggleFaq(index)}
                >
                  <span className="font-semibold text-slate-900">{faq.q}</span>
                  <ChevronDown className={cn("w-5 h-5 text-slate-500 transition-transform", activeFaq === index && "rotate-180")} />
                </button>
                {activeFaq === index && (
                  <div className="px-6 pb-4 text-slate-600 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
