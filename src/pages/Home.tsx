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

      {/* HERO */}
      <section className="relative bg-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-40">
          <img 
            src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=2000" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-24 lg:py-32">
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#5694CF]/30 border border-[#1B3C6C]/40 text-[#1B3C6C] text-sm mb-8 backdrop-blur-sm">
            <ShieldCheck className="w-4 h-4" />
            Ontario's Independent Homeowner Guide
          </div>

          <h1 className="text-5xl lg:text-7xl font-bold mb-6">
            Plan Your Renovation with <span className="text-[#5694CF]">Confidence.</span>
          </h1>

          <p className="text-xl text-slate-300 mb-10 max-w-2xl">
            Understand costs, permits, and connect with vetted contractors across Ontario.
          </p>

          <div className="flex gap-4">
            <Link 
              to="/match"
              className="bg-[#1B3C6C] hover:bg-[#5694CF] text-white px-8 py-4 rounded-xl font-semibold flex items-center gap-2"
            >
              Find Contractors <ArrowRight className="w-5 h-5" />
            </Link>

            <Link 
              to="/costs"
              className="bg-white/10 hover:bg-white/20 px-8 py-4 rounded-xl"
            >
              View Cost Guides
            </Link>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="py-16 bg-white">
        <div className="grid md:grid-cols-3 gap-8 text-center max-w-6xl mx-auto">

          <div>
            <div className="w-16 h-16 bg-[#1B3C6C]/10 text-[#1B3C6C] rounded-xl flex items-center justify-center mx-auto mb-4">
              <FileText />
            </div>
            <h3 className="font-bold mb-2">Permit Clarity</h3>
            <p className="text-slate-600">Understand Ontario building rules easily.</p>
          </div>

          <div>
            <div className="w-16 h-16 bg-[#5694CF]/10 text-[#5694CF] rounded-xl flex items-center justify-center mx-auto mb-4">
              <Calculator />
            </div>
            <h3 className="font-bold mb-2">Transparent Pricing</h3>
            <p className="text-slate-600">Real renovation cost data.</p>
          </div>

          <div>
            <div className="w-16 h-16 bg-[#1B3C6C]/10 text-[#1B3C6C] rounded-xl flex items-center justify-center mx-auto mb-4">
              <Users />
            </div>
            <h3 className="font-bold mb-2">Contractor Matching</h3>
            <p className="text-slate-600">We connect you with vetted pros.</p>
          </div>

        </div>
      </section>

      {/* CATEGORIES */}
      <section className="py-20 bg-slate-50">
        <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">

          {[
            {name:'Basements', href:'/basements', icon:HomeIcon},
            {name:'Legal Suites', href:'/legal-suites', icon:ShieldCheck},
            {name:'Kitchens', href:'#', icon:PaintBucket},
            {name:'Bathrooms', href:'#', icon:Bath},
          ].map((item) => (
            <Link key={item.name} to={item.href} className="bg-white p-6 rounded-xl hover:shadow-lg transition">
              <item.icon className="mb-4 text-[#1B3C6C]" />
              <h3 className="font-bold">{item.name}</h3>
              <div className="text-[#1B3C6C] mt-4 flex items-center">
                Explore <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </Link>
          ))}

        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#1B3C6C] text-white text-center">
        <h2 className="text-3xl font-bold mb-6">Ready to start?</h2>
        <Link 
          to="/match"
          className="bg-[#5694CF] hover:bg-white hover:text-[#1B3C6C] px-8 py-4 rounded-xl font-bold"
        >
          Get Matched
        </Link>
      </section>

    </div>
  );
}
