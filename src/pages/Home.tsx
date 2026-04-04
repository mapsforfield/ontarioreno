import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  FileText,
  Calculator,
  Users,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Hammer,
  Home as HomeIcon,
  PaintBucket,
  Bath,
  Landmark,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';

export default function Home() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const [guideForm, setGuideForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  const [guideSubmitting, setGuideSubmitting] = useState(false);
  const [guideStatus, setGuideStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({
    type: null,
    message: '',
  });

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const handleGuideChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setGuideForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGuideSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setGuideStatus({ type: null, message: '' });

    if (
      !guideForm.name.trim() ||
      !guideForm.email.trim() ||
      !guideForm.phone.trim() ||
      !guideForm.address.trim()
    ) {
      setGuideStatus({
        type: 'error',
        message: 'Please fill in all fields before submitting.',
      });
      return;
    }

    setGuideSubmitting(true);

    try {
      const response = await fetch(
        'https://script.google.com/macros/s/AKfycbx01lpcatHsLZzoS_anmr1NhnxV_3D9bgnh0MYmIMpBpbqWYot4rfpGDthUEyqZXRei/exec',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify({
            type: 'guide',
            name: guideForm.name,
            email: guideForm.email,
            phone: guideForm.phone,
            address: guideForm.address,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setGuideStatus({
          type: 'success',
          message: 'Success — your guide request was submitted.',
        });

        setGuideForm({
          name: '',
          email: '',
          phone: '',
          address: '',
        });
      } else {
        setGuideStatus({
          type: 'error',
          message: 'Something went wrong. Please try again.',
        });
      }
    } catch (error) {
      setGuideStatus({
        type: 'error',
        message: 'Something went wrong. Please try again.',
      });
    } finally {
      setGuideSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <title>Ontario Reno | Ontario Renovation Guides, Costs & Contractor Matching</title>

        <meta
          name="description"
          content="Plan your Ontario renovation the right way. Understand permits, legal suites, basement grants, real project costs, and find the best-fit contractor for your project."
        />

        <link rel="canonical" href="https://ontarioreno.ca/" />

        <meta
          property="og:title"
          content="Ontario Reno | Ontario Renovation Guides, Costs & Contractor Matching"
        />
        <meta
          property="og:description"
          content="Plan your Ontario renovation the right way. Understand permits, legal suites, basement grants, real project costs, and find the best-fit contractor for your project."
        />
        <meta property="og:url" content="https://ontarioreno.ca/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://ontarioreno.ca/preview.jpg" />

        <meta
          name="twitter:title"
          content="Ontario Reno | Ontario Renovation Guides, Costs & Contractor Matching"
        />
        <meta
          name="twitter:description"
          content="Plan your Ontario renovation the right way. Understand permits, legal suites, basement grants, real project costs, and find the best-fit contractor for your project."
        />
        <meta name="twitter:image" content="https://ontarioreno.ca/preview.jpg" />
      </Helmet>

      {/* Hero Section */}
      <section className="relative bg-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-40">
          <img
            src="/hero.jpg"
            alt="Ontario Home Renovation"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 flex flex-col items-start">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1B3C6C]/20 border border-blue-500/30 text-blue-300 font-medium text-sm mb-8 backdrop-blur-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>Ontario&apos;s Independent Homeowner Guide</span>
          </div>

          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-6 max-w-3xl leading-tight">
            Plan Your Renovation with <span className="text-[#5694CF]">Confidence.</span>
          </h1>

          <p className="text-xl text-slate-300 mb-4 max-w-2xl leading-relaxed">
            We help Ontario homeowners understand real costs, avoid expensive mistakes, and choose the right contractor for their project.
          </p>

          <p className="text-sm text-slate-400 mb-10 max-w-2xl">
            We don’t sell renovations. We help you make the right decision before hiring anyone.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link
              to="/match"
              className="bg-[#1B3C6C] hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-blue-600/25 flex items-center justify-center gap-2"
            >
              Find the Right Contractor <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/costs"
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-8 py-4 rounded-xl font-semibold text-lg transition-all backdrop-blur-sm flex items-center justify-center"
            >
              View 2026 Cost Guides
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-6 text-sm text-slate-400 font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Free to use
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Independent guidance
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Built for Ontario homeowners
            </div>
          </div>
        </div>
      </section>

      {/* Featured Grant Opportunity */}
      <section className="border-b border-yellow-100 bg-gradient-to-r from-yellow-50 via-amber-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
          <div className="rounded-3xl border border-yellow-200/80 bg-white/80 backdrop-blur-sm shadow-sm px-6 py-8 md:px-8 md:py-9">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-yellow-100 text-yellow-900 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em]">
                  <Landmark className="w-4 h-4" />
                  Confirmed Hamilton Basement Grant
                </div>

                <h2 className="mt-4 text-2xl md:text-4xl font-bold text-slate-900 leading-tight">
                  Hamilton Homeowners May Qualify for Up to $40,000 Through the Hamilton Basement Grant
                </h2>

                <p className="mt-4 text-base md:text-lg text-slate-700 leading-relaxed max-w-2xl">
                  We’ve confirmed a City of Hamilton–backed basement grant and ADU incentive that can cover up to 70% of eligible construction costs for qualifying legal basement unit projects.

                  If you're unsure what qualifies, see what counts as a{" "}
                  <Link
                    to="/hamilton-secondary-suite-grant"
                    className="font-semibold underline underline-offset-4"
                  >
                    legal secondary suite in Hamilton
                  </Link>.
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-4 text-sm font-medium text-slate-600">
                  <span className="inline-flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Up to $40,000 available
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Not a loan
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Legal basement unit focus
                  </span>
                </div>

                <p className="mt-4 text-sm text-slate-600 max-w-2xl">
                  Looking for the Hamilton basement grant guide? Start with a quick estimate or read the full breakdown of eligible costs, approvals, and how the program works.
                </p>

                <p className="mt-3 text-xs md:text-sm text-slate-500">
                  Subject to approval, eligibility, and available funding.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:min-w-[280px]">
                <Link
                  to="/hamilton-basement-grant"
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-6 py-4 font-semibold transition-all shadow-sm"
                >
                  See My Estimated Grant
                </Link>

                <Link
                  to="/hamilton-grant-guide"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 px-6 py-4 font-semibold transition-all"
                >
                  Read Full Grant Guide
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Authority / Trust Section */}
      <section className="py-16 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-slate-100">
            <div className="p-6">
              <div className="mx-auto w-16 h-16 bg-blue-50 text-[#1B3C6C] rounded-2xl flex items-center justify-center mb-6">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Permit & Code Clarity</h3>
              <p className="text-slate-600 leading-relaxed">
                Stop guessing. We break down Ontario building codes and municipal permit requirements into plain English.
              </p>
            </div>

            <div className="p-6">
              <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                <Calculator className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Transparent Pricing</h3>
              <p className="text-slate-600 leading-relaxed">
                Access real, localized cost data for basements, kitchens, and legal suites across the GTA and beyond.
              </p>
            </div>

            <div className="p-6">
              <div className="mx-auto w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Best-Fit Contractor Matching</h3>
              <p className="text-slate-600 leading-relaxed">
                Skip the directory scrolling. We help identify the right contractor for your project based on scope, budget, and track record.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Renovation Categories */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Explore Our Renovation Hubs</h2>
            <p className="text-lg text-slate-600">
              Comprehensive guides, cost breakdowns, and expert advice for Ontario&apos;s most popular home improvement projects.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link to="/basements" className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all border border-slate-100 flex flex-col h-full">
              <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#1B3C6C] group-hover:text-white transition-colors">
                <HomeIcon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Basement Finishing</h3>
              <p className="text-slate-600 text-sm mb-6 flex-grow">
                From framing to flooring, understand the costs and process of finishing your Ontario basement.
              </p>
              <div className="flex items-center text-[#1B3C6C] font-semibold text-sm mt-auto">
                Explore Hub <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link to="/legal-suites" className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all border border-slate-100 flex flex-col h-full">
              <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#1B3C6C] group-hover:text-white transition-colors">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Legal Secondary Suites</h3>
              <p className="text-slate-600 text-sm mb-6 flex-grow">
                Navigate zoning, fire separation, and municipal requirements to build a legal income suite.
              </p>
              <div className="flex items-center text-[#1B3C6C] font-semibold text-sm mt-auto">
                Explore Hub <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link to="/kitchen-renovations" className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all border border-slate-100 flex flex-col h-full">
              <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#1B3C6C] group-hover:text-white transition-colors">
                <PaintBucket className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Kitchen Renovations</h3>
              <p className="text-slate-600 text-sm mb-6 flex-grow">
                Real pricing for cabinets, countertops, and layout changes across Ontario kitchens.
              </p>
              <div className="flex items-center text-[#1B3C6C] font-semibold text-sm mt-auto">
                Explore Hub <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link to="/bathroom-renovations" className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all border border-slate-100 flex flex-col h-full">
              <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#1B3C6C] group-hover:text-white transition-colors">
                <Bath className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Bathroom Renovations</h3>
              <p className="text-slate-600 text-sm mb-6 flex-grow">
                Waterproofing, plumbing, and tile costs explained before you start your project.
              </p>
              <div className="flex items-center text-[#1B3C6C] font-semibold text-sm mt-auto">
                Explore Hub <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Lead Capture Block */}
      <section className="relative overflow-hidden bg-[#1F477F] py-24 xl:py-28 text-white">
        {/* Ambient background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_50%,rgba(96,165,250,0.16),transparent_22%),radial-gradient(circle_at_52%_48%,rgba(96,165,250,0.14),transparent_26%),radial-gradient(circle_at_86%_50%,rgba(59,130,246,0.16),transparent_20%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.02),rgba(255,255,255,0)_20%,rgba(255,255,255,0)_80%,rgba(255,255,255,0.02))]" />

        <div className="relative z-10 max-w-[1800px] mx-auto px-6 lg:px-10 xl:px-14">
          {/* Mobile / tablet */}
          <div className="xl:hidden flex flex-col items-center text-center gap-8">
            <div className="relative isolate flex justify-center">
              <img
                src="/ontario-reno-cost-guide-3d-preview.png"
                alt="2026 Ontario Renovation Cost Guide booklet preview"
                className="relative z-10 w-[230px] sm:w-[275px] md:w-[320px] h-auto object-contain drop-shadow-[0_18px_34px_rgba(0,0,0,0.18)]"
                loading="lazy"
              />
            </div>

            <div className="max-w-2xl">
              <h2 className="tracking-[-0.03em] leading-[1.04]">
                <span className="block text-[15px] sm:text-[17px] font-medium uppercase tracking-[0.12em] text-blue-200 mb-4">
                  Plan Smarter Before You Renovate
                </span>

                <span className="block text-[2.1rem] sm:text-[2.7rem] md:text-[3.1rem] font-semibold text-white">
                  Get the 2026 Ontario
                </span>

                <span className="block text-[2.1rem] sm:text-[2.7rem] md:text-[3.1rem] font-bold bg-gradient-to-r from-white via-blue-100 to-blue-300 bg-clip-text text-transparent">
                  Renovation Cost Guide
                </span>

                <span className="block mt-4 text-[1.1rem] sm:text-[1.3rem] md:text-[1.45rem] leading-[1.25] font-medium text-blue-100">
                  Before You Get Your First Quote
                </span>
              </h2>

              <p className="mt-6 text-[18px] leading-8 text-blue-100 max-w-[700px] mx-auto">
                Stop guessing on pricing. Download our comprehensive PDF guide
                breaking down average costs for basements, kitchens, and legal suites
                across 15+ Ontario cities.
              </p>

              <ul className="mt-7 space-y-4 max-w-[520px] mx-auto text-left">
                <li className="flex items-start gap-3 text-blue-50">
                  <CheckCircle2 className="mt-0.5 w-5 h-5 text-blue-300 shrink-0" />
                  <span className="text-[17px] leading-7">Material vs. labour breakdowns</span>
                </li>
                <li className="flex items-start gap-3 text-blue-50">
                  <CheckCircle2 className="mt-0.5 w-5 h-5 text-blue-300 shrink-0" />
                  <span className="text-[17px] leading-7">Permit fee estimates by municipality</span>
                </li>
                <li className="flex items-start gap-3 text-blue-50">
                  <CheckCircle2 className="mt-0.5 w-5 h-5 text-blue-300 shrink-0" />
                  <span className="text-[17px] leading-7">Red flags to watch out for in quotes</span>
                </li>
              </ul>
            </div>

            <div className="w-full max-w-[440px]">
              <div className="rounded-[24px] bg-white text-slate-900 shadow-[0_24px_70px_rgba(0,0,0,0.22)] p-8 sm:p-9 text-left">
                <h3 className="text-[1.9rem] leading-tight font-bold">Get Instant Access</h3>
                <p className="mt-2 text-[15px] text-slate-500">
                  Join 15,000+ Ontario homeowners planning smarter.
                </p>

                <form className="mt-7 space-y-4" onSubmit={handleGuideSubmit}>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      First Name
                    </label>
                    <input
                      name="name"
                      type="text"
                      value={guideForm.name}
                      onChange={handleGuideChange}
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                      placeholder="John"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Email Address
                    </label>
                    <input
                      name="email"
                      type="email"
                      value={guideForm.email}
                      onChange={handleGuideChange}
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Phone Number
                    </label>
                    <input
                      name="phone"
                      type="tel"
                      value={guideForm.phone}
                      onChange={handleGuideChange}
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                      placeholder="(416) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Project Address
                    </label>
                    <input
                      name="address"
                      type="text"
                      value={guideForm.address}
                      onChange={handleGuideChange}
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                      placeholder="123 Main St, Hamilton"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={guideSubmitting}
                    className="w-full mt-2 rounded-xl bg-slate-950 hover:bg-slate-900 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-4 transition-colors"
                  >
                    {guideSubmitting ? 'Submitting...' : 'Send Me The Guide'}
                  </button>

                  {guideStatus.message && (
                    <p
                      className={`text-sm text-center mt-2 ${guideStatus.type === 'success' ? 'text-green-600' : 'text-red-600'
                        }`}
                    >
                      {guideStatus.message}
                    </p>
                  )}

                  <p className="text-xs text-slate-400 text-center pt-2">
                    We respect your privacy. Unsubscribe anytime.
                  </p>
                </form>
              </div>
            </div>
          </div>

          {/* Desktop */}
          <div
            className="hidden xl:grid items-center justify-center"
            style={{
              gridTemplateColumns: '980px 430px',
              columnGap: '40px',
            }}
          >
            {/* Left content group: book + copy */}
            <div
              className="grid items-center"
              style={{
                gridTemplateColumns: '340px minmax(560px, 760px)',
                columnGap: '52px',
              }}
            >
              {/* Book */}
              <div className="flex justify-center">
                <img
                  src="/ontario-reno-cost-guide-3d-preview.png"
                  alt="2026 Ontario Renovation Cost Guide booklet preview"
                  className="w-[300px] 2xl:w-[340px] h-auto object-contain drop-shadow-[0_42px_84px_rgba(0,0,0,0.40)]"
                  loading="lazy"
                />
              </div>

              {/* Copy */}
              <div className="max-w-[760px]">
                <h2 className="tracking-[-0.035em] leading-[1.02]">
                  <span className="block text-[15px] font-medium uppercase tracking-[0.14em] text-blue-200 mb-5">
                    Plan Smarter Before You Renovate
                  </span>

                  <span className="block text-[54px] 2xl:text-[60px] font-semibold text-white">
                    Get the 2026 Ontario
                  </span>

                  <span className="block text-[54px] 2xl:text-[60px] font-bold bg-gradient-to-r from-white via-blue-100 to-blue-300 bg-clip-text text-transparent">
                    Renovation Cost Guide
                  </span>

                  <span className="block mt-5 text-[28px] 2xl:text-[31px] leading-[1.2] font-medium text-blue-100">
                    Before You Get Your First Quote
                  </span>
                </h2>

                <p className="mt-8 text-[21px] leading-9 text-blue-100 max-w-[650px]">
                  Stop guessing on pricing. Download our comprehensive PDF guide
                  breaking down average costs for basements, kitchens, and legal suites
                  across 15+ Ontario cities.
                </p>

                <ul className="mt-8 space-y-4 max-w-[560px]">
                  <li className="flex items-start gap-3 text-blue-50">
                    <CheckCircle2 className="mt-0.5 w-5 h-5 text-blue-300 shrink-0" />
                    <span className="text-[17px] leading-7">Material vs. labour breakdowns</span>
                  </li>
                  <li className="flex items-start gap-3 text-blue-50">
                    <CheckCircle2 className="mt-0.5 w-5 h-5 text-blue-300 shrink-0" />
                    <span className="text-[17px] leading-7">Permit fee estimates by municipality</span>
                  </li>
                  <li className="flex items-start gap-3 text-blue-50">
                    <CheckCircle2 className="mt-0.5 w-5 h-5 text-blue-300 shrink-0" />
                    <span className="text-[17px] leading-7">Red flags to watch out for in quotes</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Form */}
            <div className="w-full max-w-[430px] justify-self-end">
              <div className="rounded-[24px] bg-white text-slate-900 shadow-[0_24px_70px_rgba(0,0,0,0.22)] p-9">
                <h3 className="text-[1.9rem] leading-tight font-bold">Get Instant Access</h3>
                <p className="mt-2 text-[15px] text-slate-500">
                  Join 15,000+ Ontario homeowners planning smarter.
                </p>

                <form className="mt-7 space-y-4" onSubmit={handleGuideSubmit}>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      First Name
                    </label>
                    <input
                      name="name"
                      type="text"
                      value={guideForm.name}
                      onChange={handleGuideChange}
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                      placeholder="John"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Email Address
                    </label>
                    <input
                      name="email"
                      type="email"
                      value={guideForm.email}
                      onChange={handleGuideChange}
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Phone Number
                    </label>
                    <input
                      name="phone"
                      type="tel"
                      value={guideForm.phone}
                      onChange={handleGuideChange}
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                      placeholder="(416) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Project Address
                    </label>
                    <input
                      name="address"
                      type="text"
                      value={guideForm.address}
                      onChange={handleGuideChange}
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                      placeholder="123 Main St, Hamilton"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={guideSubmitting}
                    className="w-full mt-2 rounded-xl bg-slate-950 hover:bg-slate-900 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-4 transition-colors"
                  >
                    {guideSubmitting ? 'Submitting...' : 'Send Me The Guide'}
                  </button>

                  {guideStatus.message && (
                    <p
                      className={`text-sm text-center mt-2 ${guideStatus.type === 'success' ? 'text-green-600' : 'text-red-600'
                        }`}
                    >
                      {guideStatus.message}
                    </p>
                  )}

                  <p className="text-xs text-slate-400 text-center pt-2">
                    We respect your privacy. Unsubscribe anytime.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contractor Matching CTA */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-20 h-20 bg-[#1B3C6C]/20 rounded-full flex items-center justify-center mx-auto mb-8">
            <Hammer className="w-10 h-10 text-[#5694CF]" />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to start your project?</h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            We help you identify the best-fit contractor for your project — based on scope, budget, and real track record. Not random referrals, and not whoever pays to be shown.
          </p>
          <Link
            to="/match"
            className="inline-flex items-center justify-center bg-[#1B3C6C] hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-blue-600/25"
          >
            Find the Right Contractor
          </Link>
          <p className="mt-6 text-sm text-slate-500">100% free for homeowners. No obligation to hire.</p>
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
                a: "No. OntarioReno is an independent homeowner resource platform. We provide educational content, cost guides, and a matching service to help homeowners make better decisions before hiring. We do not perform the renovation work ourselves."
              },
              {
                q: "How much does it cost to use your matching service?",
                a: "Our matching service is 100% free for homeowners. We may earn a referral fee from contractors in our network, but our positioning is based on project fit, not random placement or homeowner-facing bias."
              },
              {
                q: "How do you choose which contractors to recommend?",
                a: "We look at project scope, budget fit, location, and contractor track record. The goal is not to show you dozens of options — it’s to help point you toward the company that makes the most sense for your specific project."
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
                  <ChevronDown
                    className={cn(
                      "w-5 h-5 text-slate-500 transition-transform",
                      activeFaq === index && "rotate-180"
                    )}
                  />
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