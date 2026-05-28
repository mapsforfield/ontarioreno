import { FormEvent, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { buttonStyles, formStyles } from '../lib/uiStyles';

const heroBullets = [
  'Qualified homeowner demand',
  'Basement, kitchen, bathroom, ADU and legal suite projects',
  'OntarioReno-managed consultations',
  'OntarioReno-managed sales process',
];

const contractorFit = [
  'Crews available',
  'Capacity for new renovation projects',
  'Experience with larger residential renovations',
  'Organized project management',
  'Professional workmanship',
  'Financing-ready companies may be prioritized',
];

const projectTypes = [
  {
    title: 'Basement Projects',
    body: 'Finished basements, legal basement apartments, and lower-level renovations.',
    image: '/images/legal%20basement.jpeg',
  },
  {
    title: 'Kitchen Projects',
    body: 'Kitchen remodels, cabinet replacements, layouts, and full upgrades.',
    image: '/images/financing-planning.png',
  },
  {
    title: 'Bathroom Projects',
    body: 'Bathroom remodels, tub-to-shower conversions, and full bathroom upgrades.',
    image: '/images/bathroom.jpg',
  },
  {
    title: 'Legal Basement Apartments',
    body: 'Secondary suite projects with permit, code, and rental potential.',
    image: '/images/basement.png',
  },
  {
    title: 'ADUs / Garden Suites',
    body: 'Larger backyard housing and additional residential unit projects.',
    image: '/images/garden-suite.jpg',
  },
  {
    title: 'Major Renovations',
    body: 'Additions, multi-room renovations, and higher-ticket home improvement work.',
    image: '/images/after-image-hero.jpg',
  },
];

const contractorReasons = [
  'Homeowners are already searching',
  'The demand is project-specific',
  'Financing questions are handled earlier',
  'Contractors avoid wasting time on weak inquiries',
  'Contractors can focus on project execution and delivery',
];

const partnerOptions = [
  {
    title: 'Partner Network',
    body: 'Approved contractors may receive homeowner renovation projects through OntarioReno.',
  },
  {
    title: 'Appointment Support',
    body: 'OntarioReno handles homeowner communication, qualification, and consultation coordination.',
  },
  {
    title: 'Sales Support',
    body: 'OntarioReno sales reps help guide homeowners through the project approval and sales process before fulfillment begins.',
  },
];

const credibilityPoints = [
  {
    title: 'Homeowners Research Here',
    body: 'OntarioReno attracts homeowners looking into renovation costs, grants, financing, and project planning.',
  },
  {
    title: 'Projects Are Reviewed',
    body: 'Inquiries are reviewed before a project is assigned for contractor fulfillment.',
  },
  {
    title: 'Projects Are Managed Through OntarioReno',
    body: 'OntarioReno and its sales team help guide the homeowner through qualification, consultation, and project approval before contractor fulfillment begins.',
  },
];

export default function ContractorPartners() {
  useEffect(() => {
    const themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const previousThemeColor = themeMeta?.getAttribute('content');

    themeMeta?.setAttribute('content', '#0d1729');

    return () => {
      if (previousThemeColor) {
        themeMeta?.setAttribute('content', previousThemeColor);
      }
    };
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Contractor Partners | Get More Renovation Jobs | OntarioReno</title>
        <meta
          name="description"
          content="OntarioReno reviews select Ontario renovation contractors for a managed homeowner opportunity and project fulfillment network."
        />
        <meta name="theme-color" content="#0d1729" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="canonical" href="https://ontarioreno.ca/contractor-partners" />
      </Helmet>

      <section className="relative isolate overflow-hidden bg-[#080f1c] text-white">
        <img
          src="/images/after-image-hero.jpg"
          alt=""
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center opacity-55"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(7,13,24,0.98)_0%,rgba(8,15,28,0.92)_43%,rgba(8,15,28,0.58)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_72%_25%,rgba(188,158,91,0.16),transparent_29%),linear-gradient(180deg,transparent_55%,rgba(3,8,16,0.78)_100%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-200/30 to-transparent" />

        <div className="mx-auto grid min-h-[calc(100vh-4.75rem)] max-w-7xl gap-14 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-[minmax(0,1fr)_430px] lg:items-center lg:gap-16 lg:px-8 lg:py-32">
          <div className="max-w-[780px]">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-200">
              OntarioReno Contractor Partners
            </p>
            <h1 className="mt-6 text-[3.45rem] font-bold leading-[0.93] tracking-[-0.07em] text-white sm:text-7xl lg:text-[6.15rem]">
              <span className="block">Need More</span>
              <span className="block">Renovation</span>
              <span className="block">Jobs?</span>
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-200 sm:text-[1.3rem] sm:leading-9">
              OntarioReno is building a contractor partner network for serious
              renovation companies across Ontario.
            </p>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
              If your company has crews available and can handle qualified homeowner
              projects, request a contractor review.
            </p>
            <a href="#partner-application" className={`${buttonStyles.primary} mt-11 px-8 py-4 text-[1.03rem]`}>
              Request Contractor Review
              <ArrowRight className="h-5 w-5" />
            </a>
            <p className="mt-6 max-w-xl text-base font-medium leading-7 text-blue-100">
              Limited partner spots available by service area and project category.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-[1.75rem] border border-white/15 bg-[#0c1628]/72 p-6 shadow-[0_32px_90px_rgba(0,0,0,0.34)] backdrop-blur-md sm:p-8">
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/60 to-transparent" />
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-100/85">
              Approved Partner Access
            </p>
            <h2 className="mt-4 text-2xl font-bold leading-tight tracking-[-0.03em] text-white">
              Managed homeowner demand. Built for capable crews.
            </h2>
            <ul className="mt-8 space-y-5">
              {heroBullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3 text-base font-medium leading-7 text-slate-100">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-amber-200" />
                  {bullet}
                </li>
              ))}
            </ul>
            <p className="mt-8 border-t border-white/12 pt-6 text-base leading-7 text-slate-300">
              Approved contractors may receive homeowner opportunities through
              OntarioReno&apos;s growing Ontario renovation network.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-[#fbfaf7]">
        <div className="mx-auto grid max-w-7xl px-4 py-11 sm:px-6 md:grid-cols-3 md:divide-x md:divide-slate-300/70 md:px-8 md:py-14">
          {credibilityPoints.map((point) => (
            <article key={point.title} className="border-b border-slate-200 py-7 first:pt-0 last:border-b-0 last:pb-0 md:border-b-0 md:px-9 md:py-0 md:first:pl-0 md:last:pr-0">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8d6b2a]">
                OntarioReno Network
              </p>
              <h2 className="mt-3 text-xl font-bold tracking-[-0.025em] text-slate-950">
                {point.title}
              </h2>
              <p className="mt-3 text-base leading-7 text-slate-600">{point.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white py-20 lg:py-28">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,1fr)] lg:items-start lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.19em] text-[#1B3C6C]">
              Contractor Criteria
            </p>
            <h2 className="mt-4 text-3xl font-bold leading-tight tracking-[-0.045em] text-slate-950 sm:text-[2.65rem]">
              We&apos;re Looking For Contractors Ready To Take On More Projects
            </h2>
          </div>
          <ul className="space-y-5 rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-6 shadow-sm sm:p-8">
            {contractorFit.map((item) => (
              <li key={item} className="flex items-center gap-3 text-base font-medium text-slate-700 sm:text-lg">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-[#2b5a96]" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-[#f3f5f7] py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.19em] text-[#1B3C6C]">
            Project Categories
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-[-0.045em] text-slate-950 sm:text-[2.85rem]">
            Project Types We Handle
          </h2>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projectTypes.map((project) => (
              <article
                key={project.title}
                className="group relative flex min-h-[290px] overflow-hidden rounded-[1.4rem] border border-slate-900/10 bg-slate-900 p-6 shadow-[0_14px_35px_rgba(15,23,42,0.12)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_25px_55px_rgba(15,23,42,0.19)] sm:p-7"
              >
                <img
                  src={project.image}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,15,28,0.12)_0%,rgba(8,15,28,0.86)_62%,rgba(8,15,28,0.97)_100%)]" />
                <div className="relative mt-auto">
                  <p className="text-xs font-bold uppercase tracking-[0.19em] text-amber-100/85">
                    Managed Project
                  </p>
                  <h3 className="mt-3 text-2xl font-bold tracking-[-0.03em] text-white">
                  {project.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-200">{project.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#101a2c] py-20 text-white lg:py-24">
        <div className="absolute right-0 top-0 h-full w-[48%] bg-[url('/images/blueprint-hero.png')] bg-cover bg-center opacity-[0.09]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.19em] text-blue-200">
            Managed Demand Infrastructure
          </p>
          <h2 className="mt-4 max-w-3xl text-3xl font-bold tracking-[-0.045em] text-white sm:text-[2.85rem]">
            Why This Works For Contractors
          </h2>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {contractorReasons.map((reason, index) => (
              <div key={reason} className="rounded-[1.15rem] border border-white/10 bg-white/[0.045] px-5 py-6 backdrop-blur-sm">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-200">
                  0{index + 1}
                </p>
                <p className="mt-5 text-lg font-semibold leading-7 text-white">{reason}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.19em] text-[#1B3C6C]">
            Partnership Structure
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-[-0.045em] text-slate-950 sm:text-[2.85rem]">
            How OntarioReno Works With Contractors
          </h2>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {partnerOptions.map((option) => (
              <article key={option.title} className="rounded-[1.35rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-7 shadow-[0_14px_36px_rgba(15,23,42,0.05)] sm:p-8">
                <div className="h-px w-12 bg-[#b08b46]" />
                <h3 className="mt-7 text-2xl font-bold tracking-[-0.025em] text-slate-950">
                  {option.title}
                </h3>
                <p className="mt-4 text-[1.02rem] leading-8 text-slate-600">{option.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="partner-application" className="scroll-mt-20 border-t border-slate-200 bg-[#f7f7f5] py-20 sm:scroll-mt-24 lg:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
              Contractor review
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-[-0.04em] text-slate-950 sm:text-4xl lg:text-5xl">
              Request Contractor Review
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
              Tell us about your company. If there is a fit, we&apos;ll reach out
              to discuss the best way OntarioReno can work with you.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-12 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_18px_44px_rgba(15,23,42,0.06)] sm:p-8"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <label>
                <span className={formStyles.label}>Company name</span>
                <input className={formStyles.field} type="text" name="companyName" />
              </label>
              <label>
                <span className={formStyles.label}>Contact name</span>
                <input className={formStyles.field} type="text" name="contactName" />
              </label>
              <label>
                <span className={formStyles.label}>Phone</span>
                <input className={formStyles.field} type="tel" name="phone" />
              </label>
              <label>
                <span className={formStyles.label}>Email</span>
                <input className={formStyles.field} type="email" name="email" />
              </label>
              <label>
                <span className={formStyles.label}>Website</span>
                <input className={formStyles.field} type="url" name="website" placeholder="https://" />
              </label>
              <label>
                <span className={formStyles.label}>Service area</span>
                <input className={formStyles.field} type="text" name="serviceArea" placeholder="Cities or regions" />
              </label>
              <label className="sm:col-span-2">
                <span className={formStyles.label}>Main project types</span>
                <input className={formStyles.field} type="text" name="projectTypes" placeholder="Basements, kitchens, bathrooms, ADUs..." />
              </label>
              <label>
                <span className={formStyles.label}>Average project size</span>
                <input className={formStyles.field} type="text" name="averageProjectSize" placeholder="e.g. $50K-$90K" />
              </label>
              <label>
                <span className={formStyles.label}>Do you currently offer homeowner financing?</span>
                <select className={formStyles.field} name="offersFinancing" defaultValue="">
                  <option value="" disabled>Select an option</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                  <option value="in-progress">In progress</option>
                </select>
              </label>
              <label className="sm:col-span-2">
                <span className={formStyles.label}>What partnership are you interested in?</span>
                <select className={formStyles.field} name="partnerSupport" defaultValue="">
                  <option value="" disabled>Select an option</option>
                  <option value="fulfillment">Project fulfillment opportunities</option>
                  <option value="managed-sales">OntarioReno-managed sales and fulfillment</option>
                  <option value="not-sure">Not sure yet</option>
                </select>
              </label>
              <label className="sm:col-span-2">
                <span className={formStyles.label}>Message</span>
                <textarea className={`${formStyles.field} min-h-28 resize-y`} name="message" />
              </label>
            </div>
            <p className="mt-6 text-sm leading-6 text-slate-500">
              Submission does not guarantee approval. OntarioReno reviews contractor fit,
              service area, project capacity, financing readiness, and delivery standards.
            </p>
            <button type="submit" className={`${buttonStyles.primary} mt-7`}>
              Submit For Review
              <ArrowRight className="h-5 w-5" />
            </button>
          </form>
        </div>
      </section>

      <section className="relative isolate overflow-hidden bg-[#07101d] py-24 text-white lg:py-32">
        <img
          src="/images/ontarioreno/modern-wide-angle-basement.jpg"
          alt=""
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center opacity-30"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(5,11,21,0.93),rgba(7,16,29,0.84)),radial-gradient(circle_at_center,rgba(43,90,150,0.2),transparent_58%)]" />
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.21em] text-amber-100/90">
            Contractor Partner Review
          </p>
          <h2 className="mt-5 text-4xl font-bold leading-tight tracking-[-0.055em] text-white sm:text-5xl lg:text-[3.7rem]">
            Can Your Company Handle More Work?
          </h2>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-slate-200 sm:text-xl">
            If yes, request a contractor review. If there is a fit, we&apos;ll
            discuss the right partner structure privately.
          </p>
          <a href="#partner-application" className={`${buttonStyles.primary} mt-11 px-9 py-4 text-[1.03rem]`}>
            Request Contractor Review
            <ArrowRight className="h-5 w-5" />
          </a>
        </div>
      </section>
    </div>
  );
}
