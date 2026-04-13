import { useState } from 'react';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

type FormData = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  ownsHome: string;
  locatedInHamilton: string;
  projectType: string;
  timeline: string;
  basementStatus: string;
  separateEntrance: string;
  ceilingHeight: string;
  backyardSpace: string;
  sideAccess: string;
  backsOntoLaneway: string;
  rearLotSpace: string;
  reviewOptions: string[];
  bestCallDay: string;
  bestCallTime: string;
  preferredVisitDay: string;
  preferredVisitTime: string;
};

const getDefaultFormData = (): FormData => ({
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  address: '',
  ownsHome: 'Yes',
  locatedInHamilton: 'Yes',
  projectType: 'Legal Basement Apartment',
  timeline: 'ASAP',
  basementStatus: 'Not sure',
  separateEntrance: 'Not sure',
  ceilingHeight: 'Not sure',
  backyardSpace: 'Not sure',
  sideAccess: 'Not sure',
  backsOntoLaneway: 'Not sure',
  rearLotSpace: 'Not sure',
  reviewOptions: [],
  bestCallDay: 'Monday',
  bestCallTime: 'Morning',
  preferredVisitDay: '',
  preferredVisitTime: 'Flexible',
});

export default function HamiltonGrantForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>(getDefaultFormData());

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'projectType') {
      setFormData((prev) => ({
        ...prev,
        projectType: value,
        basementStatus: 'Not sure',
        separateEntrance: 'Not sure',
        ceilingHeight: 'Not sure',
        backyardSpace: 'Not sure',
        sideAccess: 'Not sure',
        backsOntoLaneway: 'Not sure',
        rearLotSpace: 'Not sure',
        reviewOptions: [],
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleReviewOptionChange = (option: string) => {
    setFormData((prev) => ({
      ...prev,
      reviewOptions: prev.reviewOptions.includes(option)
        ? prev.reviewOptions.filter((item) => item !== option)
        : [...prev.reviewOptions, option],
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const messageParts = [
      `Address: ${formData.address}`,
      `Owns Home: ${formData.ownsHome}`,
      `Located In Hamilton: ${formData.locatedInHamilton}`,
      `Planning: ${formData.projectType}`,
      `Timeline: ${formData.timeline}`,
      `Best Call Day: ${formData.bestCallDay}`,
      `Best Call Time: ${formData.bestCallTime}`,
      `Preferred Visit Day: ${formData.preferredVisitDay || 'Not provided'}`,
      `Preferred Visit Time: ${formData.preferredVisitTime}`,
      `Lead Source: Hamilton Grant Form`,
    ];

    if (formData.projectType === 'Legal Basement Apartment') {
      messageParts.push(`Basement Status: ${formData.basementStatus}`);
      messageParts.push(`Separate Entrance: ${formData.separateEntrance}`);
      messageParts.push(`Ceiling Height: ${formData.ceilingHeight}`);
    }

    if (formData.projectType === 'Garden Suite') {
      messageParts.push(`Backyard Space: ${formData.backyardSpace}`);
      messageParts.push(`Side Access: ${formData.sideAccess}`);
    }

    if (formData.projectType === 'Laneway Suite') {
      messageParts.push(`Backs Onto Laneway: ${formData.backsOntoLaneway}`);
      messageParts.push(`Rear Lot Space: ${formData.rearLotSpace}`);
    }

    if (formData.projectType === 'Not Sure Yet') {
      messageParts.push(
        `Review Options: ${
          formData.reviewOptions.length > 0
            ? formData.reviewOptions.join(', ')
            : 'None selected'
        }`
      );
    }

    const payload = {
      projectType: `Hamilton Grant - ${formData.projectType}`,
      budget: '',
      timeline: formData.timeline,
      name: `${formData.firstName} ${formData.lastName}`.trim(),
      email: formData.email,
      phone: formData.phone,
      message: messageParts.join(' | '),
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
        'Your grant review request has been received. A representative from OntarioReno will contact you to review your property details, explain the grant process, and help you avoid common mistakes before moving forward.'
      );

      setFormData(getDefaultFormData());
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
                Answer a few quick questions and we&apos;ll review your property
                details and walk you through how the Hamilton grant actually
                works.
              </p>

              <ul className="space-y-4 text-sm text-slate-300">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Reviewed based on your property and project type</span>
                </li>

                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    Guidance to help avoid mistakes that can lead to grant
                    rejection
                  </span>
                </li>

                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Time-sensitive funding opportunity</span>
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
                  Home Address
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
                  <option>Legal Basement Apartment</option>
                  <option>Garden Suite</option>
                  <option>Laneway Suite</option>
                  <option>Not Sure Yet</option>
                </select>
              </div>

              {formData.projectType === 'Legal Basement Apartment' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      What best describes your basement right now?
                    </label>
                    <select
                      name="basementStatus"
                      value={formData.basementStatus}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B3C6C]"
                    >
                      <option>Completely unfinished</option>
                      <option>Partially finished</option>
                      <option>Fully finished (not a legal unit)</option>
                      <option>Already a secondary unit</option>
                      <option>Not sure</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Does the basement already have a separate entrance?
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
                      Is there enough ceiling height to walk comfortably
                      throughout most of the basement?
                    </label>
                    <select
                      name="ceilingHeight"
                      value={formData.ceilingHeight}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B3C6C]"
                    >
                      <option>Yes</option>
                      <option>No</option>
                      <option>Not sure</option>
                    </select>
                  </div>
                </>
              )}

              {formData.projectType === 'Garden Suite' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Do you have a backyard with open space for a detached unit?
                    </label>
                    <select
                      name="backyardSpace"
                      value={formData.backyardSpace}
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
                      Do you have side access to the backyard?
                    </label>
                    <select
                      name="sideAccess"
                      value={formData.sideAccess}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B3C6C]"
                    >
                      <option>Yes</option>
                      <option>No</option>
                      <option>Not sure</option>
                    </select>
                  </div>
                </>
              )}

              {formData.projectType === 'Laneway Suite' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Does your property back onto a public laneway?
                    </label>
                    <select
                      name="backsOntoLaneway"
                      value={formData.backsOntoLaneway}
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
                      Is there space at the rear of your lot for a detached
                      unit?
                    </label>
                    <select
                      name="rearLotSpace"
                      value={formData.rearLotSpace}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B3C6C]"
                    >
                      <option>Yes</option>
                      <option>No</option>
                      <option>Not sure</option>
                    </select>
                  </div>
                </>
              )}

              {formData.projectType === 'Not Sure Yet' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    What would you like us to review for your property?
                  </label>
                  <div className="space-y-3 rounded-xl border border-slate-200 p-4">
                    {[
                      'Basement Apartment',
                      'Garden Suite',
                      'Laneway Suite',
                      'Help me decide',
                    ].map((option) => (
                      <label
                        key={option}
                        className="flex items-start gap-3 text-sm text-slate-700"
                      >
                        <input
                          type="checkbox"
                          checked={formData.reviewOptions.includes(option)}
                          onChange={() => handleReviewOptionChange(option)}
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-[#1B3C6C] focus:ring-[#1B3C6C]"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

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

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Best day for us to reach you
                </label>
                <select
                  name="bestCallDay"
                  value={formData.bestCallDay}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B3C6C]"
                >
                  <option>Monday</option>
                  <option>Tuesday</option>
                  <option>Wednesday</option>
                  <option>Thursday</option>
                  <option>Friday</option>
                  <option>Saturday</option>
                  <option>Sunday</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Best time to reach you
                </label>
                <select
                  name="bestCallTime"
                  value={formData.bestCallTime}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B3C6C]"
                >
                  <option>Morning</option>
                  <option>Afternoon</option>
                  <option>Evening</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    If a property review is needed later, what day usually works
                    best for you?
                  </label>
                  <input
                    type="date"
                    name="preferredVisitDay"
                    value={formData.preferredVisitDay}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B3C6C]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    What time usually works best?
                  </label>
                  <select
                    name="preferredVisitTime"
                    value={formData.preferredVisitTime}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B3C6C]"
                  >
                    <option>9 AM - 12 PM</option>
                    <option>12 PM - 3 PM</option>
                    <option>3 PM - 6 PM</option>
                    <option>Flexible</option>
                  </select>
                </div>
              </div>

              <p className="text-xs text-slate-500">
                We&apos;ll confirm the final call and any property review timing
                with you directly.
              </p>

              <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-4 text-sm leading-relaxed text-slate-600">
                <p>
                  Important: Most homeowners apply after committing to a
                  contractor. If the project is not structured properly from the
                  start, the grant can be rejected even after money has already
                  been spent.
                </p>
                <p className="mt-3">
                  Grant funding is limited and processed based on eligibility
                  and timing. Early review is recommended.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#1B3C6C] hover:bg-[#16345d] text-white font-bold py-4 rounded-xl transition-colors"
                >
                  {isSubmitting ? 'Submitting...' : 'Start My Grant Review'}
                </button>
                <p className="mt-3 text-xs text-slate-500 text-center">
                  No obligation. Initial review only.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
