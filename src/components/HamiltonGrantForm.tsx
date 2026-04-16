import { useState } from 'react';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

export default function HamiltonGrantForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    ownsHome: 'Yes',
    locatedInHamilton: 'Yes',
    projectType: 'Legal Secondary Suite',
    timeline: 'ASAP',
    basementStatus: 'Fully unfinished',
    separateEntrance: 'Yes',
    ceilingHeightOk: 'Yes',
    permitStatus: "Haven't applied yet",
    callPreference: 'Today',
    callDate: '',
    callWindow: 'Afternoon (12–5)',
    specificCallTime: '',
  });

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const basementDetails =
      formData.projectType === 'Legal Secondary Suite'
        ? [
            `Basement Status: ${formData.basementStatus}`,
            `Separate Entrance: ${formData.separateEntrance}`,
            `Ceiling Height: ${formData.ceilingHeightOk}`,
            `Permit Status: ${formData.permitStatus}`,
          ]
        : [];

    const callTimingDetails = [
      `Call Preference: ${formData.callPreference}`,
      ...(formData.callPreference === 'Another Day' && formData.callDate
        ? [`Preferred Call Date: ${formData.callDate}`]
        : []),
      `Preferred Time Window: ${formData.callWindow}`,
      ...(formData.specificCallTime.trim()
        ? [`Specific Time Requested: ${formData.specificCallTime.trim()}`]
        : []),
    ];

    const payload = {
      projectType: `Hamilton Grant - ${formData.projectType}`,
      budget: '',
      timeline: formData.timeline,
      name: `${formData.firstName} ${formData.lastName}`.trim(),
      email: formData.email,
      phone: formData.phone,
      message: [
        `Address: ${formData.address}`,
        `Owns Home: ${formData.ownsHome}`,
        `Located In Hamilton: ${formData.locatedInHamilton}`,
        `Planning: ${formData.projectType}`,
        `Timeline: ${formData.timeline}`,
        ...basementDetails,
        ...callTimingDetails,
        `Lead Source: Hamilton Grant Form`,
      ].join(' | '),
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

      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', 'Lead', {
          content_name: 'Hamilton Grant Form',
          value: 1,
          currency: 'CAD',
        });
      }

      alert(
        'You may qualify for up to $40,000. A representative from OntarioReno will be calling you shortly to review your eligibility and next steps.'
      );

      setFormData({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        address: '',
        ownsHome: 'Yes',
        locatedInHamilton: 'Yes',
        projectType: 'Legal Secondary Suite',
        timeline: 'ASAP',
        basementStatus: 'Fully unfinished',
        separateEntrance: 'Yes',
        ceilingHeightOk: 'Yes',
        permitStatus: "Haven't applied yet",
        callPreference: 'Today',
        callDate: '',
        callWindow: 'Afternoon (12–5)',
        specificCallTime: '',
      });
    } catch (error) {
      alert('REAL ERROR: ' + error);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="eligibility-form" className="bg-slate-50 py-16 scroll-mt-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col lg:flex-row">
          <div className="bg-slate-900 text-white p-8 md:p-10 lg:w-2/5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-[#5694CF] font-bold mb-8">
                <ShieldCheck className="w-6 h-6" />
                OntarioReno Eligibility Review
              </div>

              <h2 className="text-2xl md:text-3xl font-bold leading-tight mb-4">
                Check If Your Home Qualifies for the $40,000 Hamilton Grant
              </h2>

              <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-8">
                Answer a few quick questions and we&apos;ll review your
                eligibility.
              </p>

              <ul className="space-y-4 text-sm text-slate-300">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Reviewed based on your home and project details</span>
                </li>

                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    Built for Hamilton homeowners exploring funding options
                  </span>
                </li>

                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>No obligation</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="p-8 md:p-10 lg:w-3/5">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B3C6C]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B3C6C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B3C6C]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B3C6C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Property Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  placeholder="Street address"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B3C6C]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Do you own this home?
                </label>
                <select
                  name="ownsHome"
                  value={formData.ownsHome}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B3C6C]"
                >
                  <option>Yes</option>
                  <option>No</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Is this address located in Hamilton?
                </label>
                <select
                  name="locatedInHamilton"
                  value={formData.locatedInHamilton}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B3C6C]"
                >
                  <option>Yes</option>
                  <option>No</option>
                  <option>Not sure</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  What are you planning?
                </label>
                <select
                  name="projectType"
                  value={formData.projectType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B3C6C]"
                >
                  <option>Legal Secondary Suite</option>
                  <option>Garden Suite / Detached Unit</option>
                  <option>Laneway Suite / Detached Unit</option>
                  <option>Not sure yet</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  When are you hoping to start?
                </label>
                <select
                  name="timeline"
                  value={formData.timeline}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B3C6C]"
                >
                  <option>ASAP</option>
                  <option>1-3 Months</option>
                  <option>3+ Months</option>
                  <option>Just exploring</option>
                </select>
              </div>

              {formData.projectType === 'Legal Secondary Suite' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      What best describes the basement right now?
                    </label>
                    <select
                      name="basementStatus"
                      value={formData.basementStatus}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B3C6C]"
                    >
                      <option>Fully unfinished</option>
                      <option>Partially finished</option>
                      <option>Fully finished</option>
                      <option>Not sure</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Is there already a separate entrance?
                    </label>
                    <select
                      name="separateEntrance"
                      value={formData.separateEntrance}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B3C6C]"
                    >
                      <option>Yes</option>
                      <option>No</option>
                      <option>Not sure</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Does the basement have at least 1.95 m (6&apos; 4¾&quot;) of
                      ceiling height?
                    </label>
                    <select
                      name="ceilingHeightOk"
                      value={formData.ceilingHeightOk}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B3C6C]"
                    >
                      <option>Yes</option>
                      <option>No</option>
                      <option>Not sure</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      What is the permit status?
                    </label>
                    <select
                      name="permitStatus"
                      value={formData.permitStatus}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B3C6C]"
                    >
                      <option>Haven&apos;t applied yet</option>
                      <option>Waiting for permit approval</option>
                      <option>Permit already approved</option>
                      <option>Not sure</option>
                    </select>
                  </div>
                </>
              )}

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  When should we call you?
                </label>

                <select
                  name="callPreference"
                  value={formData.callPreference}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B3C6C]"
                >
                  <option>Today</option>
                  <option>Another Day</option>
                </select>
              </div>

              {formData.callPreference === 'Another Day' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Which date works best?
                  </label>
                  <input
                    type="date"
                    name="callDate"
                    value={formData.callDate}
                    onChange={handleChange}
                    min={getTomorrowDate()}
                    required={formData.callPreference === 'Another Day'}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B3C6C]"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Preferred time window
                </label>
                <select
                  name="callWindow"
                  value={formData.callWindow}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B3C6C]"
                >
                  <option>Morning (9–12)</option>
                  <option>Afternoon (12–5)</option>
                  <option>Evening (5–8)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Prefer a specific time?{' '}
                  <span className="text-slate-400">(optional)</span>
                </label>
                <input
                  type="text"
                  name="specificCallTime"
                  value={formData.specificCallTime}
                  onChange={handleChange}
                  placeholder="Example: 3:30 PM"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B3C6C]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#1B3C6C] hover:bg-[#16345d] text-white font-bold py-4 rounded-xl transition-colors"
                >
                  {isSubmitting ? 'Submitting...' : 'Check My Eligibility'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}