import { useState } from 'react';
import { CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { buttonStyles, formStyles } from '../lib/uiStyles';
import { cn } from '../lib/utils';

export default function Match() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({
    type: null,
    message: '',
  });

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
    setSubmitStatus({ type: null, message: '' });
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

      setSubmitStatus({
        type: 'success',
        message:
          'Thanks. Your project details were received. We will review the scope and follow up with the best next step.',
      });
    } catch (error) {
      console.error(error);
      setSubmitStatus({
        type: 'error',
        message:
          'Something went wrong while submitting. Please try again or email info@ontarioreno.ca.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* HERO */}
        <div className="mb-8 text-center sm:mb-12">
          <h1 className="mb-4 text-3xl font-bold tracking-[-0.03em] text-slate-900 sm:text-4xl">
            Find the Right Contractor for Your Project
          </h1>

          <p className="mx-auto max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            We don't just send you random contractors - we help identify the best-fit company based on your project, budget, and goals.
          </p>

          <p className="mt-4 text-sm text-slate-500">
            No spam. No pressure. No bias.
          </p>
        </div>

        <div className="flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl md:flex-row">

          {/* LEFT PANEL */}
          <div className="flex flex-col justify-between bg-slate-900 p-6 text-white sm:p-8 md:w-2/5">
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
                  <span>Guided toward the best fit - not whoever pays to be shown</span>
                </li>
              </ul>
            </div>
          </div>

          {/* FORM */}
          <div className="p-6 sm:p-8 md:w-3/5 md:p-12">
            {submitStatus.type === 'success' ? (
              <div className="flex min-h-[420px] flex-col justify-center">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h2 className="mt-6 text-3xl font-bold tracking-[-0.03em] text-slate-900">
                  Your request is in.
                </h2>
                <p className="mt-4 text-base leading-7 text-slate-600">
                  {submitStatus.message}
                </p>
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="font-semibold text-slate-900">What happens next</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    We check the project type, budget, location, and timeline so
                    the contractor conversation starts with better fit, not a
                    random directory-style referral.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setSubmitStatus({ type: null, message: '' });
                  }}
                  className={cn(buttonStyles.secondary, 'mt-6 w-full')}
                >
                  Submit another project
                </button>
              </div>
            ) : (
              <>

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
                    <label className={formStyles.label}>
                      What type of project are you planning?
                    </label>

                    <select
                      name="projectType"
                      value={formData.projectType}
                      onChange={handleChange}
                      className={formStyles.field}
                    >
                      <option>Basement Finishing</option>
                      <option>Legal Secondary Suite</option>
                      <option>Kitchen Renovation</option>
                      <option>Bathroom Renovation</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div>
                    <label className={formStyles.label}>
                      What is your estimated budget?
                    </label>

                    <select
                      name="budget"
                      value={formData.budget}
                      onChange={handleChange}
                      className={formStyles.field}
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
                    className={cn(buttonStyles.primary, 'mt-8 w-full')}
                  >
                    Continue <ArrowRight className="w-5 h-5" />
                  </button>

                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">

                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      type="text"
                      name="firstName"
                      placeholder="First Name"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={formStyles.field}
                    />

                    <input
                      type="text"
                      name="lastName"
                      placeholder="Last Name"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={formStyles.field}
                    />
                  </div>

                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleChange}
                    className={formStyles.field}
                  />

                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={handleChange}
                    className={formStyles.field}
                  />

                  <input
                    type="text"
                    name="postalCode"
                    placeholder="Postal Code (e.g. M4B 1B3)"
                    value={formData.postalCode}
                    onChange={handleChange}
                    className={cn(formStyles.field, 'uppercase')}
                  />

                  {submitStatus.type === 'error' && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                      {submitStatus.message}
                    </div>
                  )}

                  <div className="mt-8 flex gap-4">
                    <button
                      onClick={prevStep}
                      className={cn(buttonStyles.secondary, 'w-1/3 px-4')}
                    >
                      Back
                    </button>

                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className={cn(buttonStyles.primary, 'w-2/3 px-4')}
                    >
                      {isSubmitting ? 'Submitting...' : 'Get My Best-Fit Contractor'}
                    </button>
                  </div>

                </div>
              )}

            </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

