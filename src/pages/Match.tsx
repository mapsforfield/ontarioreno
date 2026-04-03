import { useState } from 'react';
import { CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

export default function Match() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    projectType: 'Basement Finishing',
    budget: 'Under $25,000',
    timeline: 'Immediately',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    postalCode: '',
  });

  const nextStep = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setStep(2);
  };

  const prevStep = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setStep(1);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      projectType: formData.projectType,
      budget: formData.budget,
      timeline: formData.timeline,
      name: `${formData.firstName} ${formData.lastName}`.trim(),
      email: formData.email,
      phone: formData.phone,
      message: `Postal Code: ${formData.postalCode}`,
    };

    try {
      await fetch(
        'https://script.google.com/macros/s/AKfycbyi1JG7OXDwCghiVQb2PaOEME7ZByUa8Mxl3N7xbTCCaL07Bdrx3h01dA4YisDPV_Yw/exec',
        {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'text/plain',
          },
          body: JSON.stringify(payload),
        }
      );

      alert('Submitted successfully!');
    } catch (error) {
      alert('REAL ERROR: ' + error);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* HERO */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Find the Right Contractor for Your Project
          </h1>

          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            We don’t just send you random contractors — we help identify the best-fit company based on your project, budget, and goals.
          </p>

          <p className="mt-4 text-sm text-slate-500">
            No spam. No pressure. No bias.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col md:flex-row">

          {/* LEFT PANEL */}
          <div className="bg-slate-900 text-white p-8 md:w-2/5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-[#5694CF] font-bold mb-8">
                <ShieldCheck className="w-6 h-6" /> OntarioReno Verified
              </div>

              <h3 className="text-xl font-bold mb-6">
                How We Match You Properly
              </h3>

              <ul className="space-y-4 text-sm text-slate-300">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>Matched based on your specific project scope</span>
                </li>

                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>Budget alignment (no wasted time with wrong quotes)</span>
                </li>

                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>Contractors selected based on real track record</span>
                </li>

                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>Guided toward the best fit — not whoever pays to be shown</span>
                </li>
              </ul>
            </div>
          </div>

          {/* FORM */}
          <div className="p-8 md:p-12 md:w-3/5">

            {/* PROGRESS */}
            <div className="mb-8">
              <div className="flex justify-between text-xs font-medium text-slate-400 mb-2">
                <span>Project Details</span>
                <span>Contact Info</span>
              </div>

              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1B3C6C] transition-all duration-500"
                  style={{ width: step === 1 ? '50%' : '100%' }}
                ></div>
              </div>
            </div>

            <form>

              {step === 1 && (
                <div className="space-y-6">

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      What type of project are you planning?
                    </label>

                    <select
                      name="projectType"
                      value={formData.projectType}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200"
                    >
                      <option>Basement Finishing</option>
                      <option>Legal Secondary Suite</option>
                      <option>Kitchen Renovation</option>
                      <option>Bathroom Renovation</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      What is your estimated budget?
                    </label>

                    <select
                      name="budget"
                      value={formData.budget}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200"
                    >
                      <option>Under $25,000</option>
                      <option>$25,000 - $50,000</option>
                      <option>$50,000 - $100,000</option>
                      <option>Over $100,000</option>
                      <option>Not sure yet</option>
                    </select>
                  </div>

                  <button
                    onClick={nextStep}
                    className="w-full bg-[#1B3C6C] text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2 mt-8"
                  >
                    Continue <ArrowRight className="w-5 h-5" />
                  </button>

                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">

                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="firstName"
                      placeholder="First Name"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="px-4 py-3 rounded-xl border border-slate-200"
                    />

                    <input
                      type="text"
                      name="lastName"
                      placeholder="Last Name"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="px-4 py-3 rounded-xl border border-slate-200"
                    />
                  </div>

                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200"
                  />

                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200"
                  />

                  <input
                    type="text"
                    name="postalCode"
                    placeholder="Postal Code (e.g. M4B 1B3)"
                    value={formData.postalCode}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 uppercase"
                  />

                  <div className="flex gap-4 mt-8">
                    <button
                      onClick={prevStep}
                      className="w-1/3 bg-slate-100 py-4 rounded-xl"
                    >
                      Back
                    </button>

                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="w-2/3 bg-emerald-600 text-white font-bold py-4 rounded-xl"
                    >
                      {isSubmitting ? 'Submitting...' : 'Get My Best-Fit Contractor'}
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