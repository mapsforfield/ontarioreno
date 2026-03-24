import { useState } from 'react';
import { CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

export default function Match() {
  const [step, setStep] = useState(1);

  const nextStep = (e: React.MouseEvent) => {
    e.preventDefault();
    setStep(step + 1);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Find Vetted Ontario Contractors
          </h1>
          <p className="text-lg text-slate-600">
            Tell us about your project, and we'll match you with up to 3 licensed, insured professionals. 100% free.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col md:flex-row">
          
          {/* Left Side - Trust Info */}
          <div className="bg-slate-900 text-white p-8 md:w-2/5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-blue-400 font-bold mb-8">
                <ShieldCheck className="w-6 h-6" /> OntarioReno Verified
              </div>
              <h3 className="text-xl font-bold mb-6">Our Vetting Process</h3>
              <ul className="space-y-4 text-sm text-slate-300">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>Minimum $2M Liability Insurance verified</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>WSIB Clearance Certificate verified</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>Business Registration checked</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>Past client references interviewed</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="p-8 md:p-12 md:w-3/5">
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between text-xs font-medium text-slate-400 mb-2">
                <span>Project Details</span>
                <span>Contact Info</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-500"
                  style={{ width: step === 1 ? '50%' : '100%' }}
                ></div>
              </div>
            </div>

            <form>
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">What type of project are you planning?</label>
                    <select className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none bg-white">
                      <option>Basement Finishing</option>
                      <option>Legal Secondary Suite</option>
                      <option>Kitchen Renovation</option>
                      <option>Bathroom Renovation</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">What is your estimated budget?</label>
                    <select className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none bg-white">
                      <option>Under $25,000</option>
                      <option>$25,000 - $50,000</option>
                      <option>$50,000 - $100,000</option>
                      <option>Over $100,000</option>
                      <option>Not sure yet</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">When do you want to start?</label>
                    <select className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none bg-white">
                      <option>Immediately</option>
                      <option>1-3 Months</option>
                      <option>3-6 Months</option>
                      <option>Just researching</option>
                    </select>
                  </div>
                  <button onClick={nextStep} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-colors flex justify-center items-center gap-2 mt-8">
                    Next Step <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
                      <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
                      <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                    <input type="email" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                    <input type="tel" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Postal Code (To find local pros)</label>
                    <input type="text" placeholder="e.g. M4B 1B3" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none uppercase" />
                  </div>
                  <div className="flex gap-4 mt-8">
                    <button onClick={(e) => { e.preventDefault(); setStep(1); }} className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-4 rounded-xl transition-colors">
                      Back
                    </button>
                    <button onClick={(e) => e.preventDefault()} className="w-2/3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl transition-colors">
                      Get Matched
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
