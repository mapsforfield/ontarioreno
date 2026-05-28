import { FormEvent, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { buttonStyles, formStyles } from '../lib/uiStyles';

const pipelineCards = [
  {
    title: 'New homeowner inquiry',
    body: 'Basement apartment project',
    className: 'left-3 top-52 w-[10.75rem] sm:left-8 sm:top-10 sm:w-[13rem]',
  },
  {
    title: 'Consultation booked',
    body: 'Thursday • 6:30 PM',
    className: 'right-3 top-80 w-[11.25rem] sm:right-7 sm:top-32 sm:w-[12.5rem]',
  },
  {
    title: 'Project reviewed',
    body: 'Budget range confirmed',
    className: 'left-4 bottom-28 w-[10.75rem] sm:left-10 sm:bottom-24 sm:w-[12.75rem]',
  },
  {
    title: 'Contractor fulfillment partner',
    body: 'Ready for assignment',
    className: 'right-4 bottom-8 w-[12rem] sm:right-8 sm:bottom-8 sm:w-[13.5rem]',
  },
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
    <div className="min-h-screen bg-[#fbfaf6]">
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

      <section className="bg-[#fbfaf6] px-3 pb-10 pt-4 sm:px-5 sm:pb-14 lg:px-8 lg:pt-7">
        <div className="relative isolate mx-auto grid max-w-7xl overflow-hidden rounded-[2.25rem] bg-[#dbe8ec] px-6 pb-0 pt-12 shadow-[0_28px_80px_rgba(28,49,72,0.16)] sm:rounded-[3rem] sm:px-10 sm:pt-16 lg:min-h-[760px] lg:grid-cols-[minmax(0,0.94fr)_minmax(460px,1fr)] lg:items-center lg:gap-10 lg:px-14 lg:py-16 xl:px-18">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_16%_12%,rgba(255,255,255,0.82),transparent_32%),radial-gradient(circle_at_78%_18%,rgba(74,123,157,0.16),transparent_36%),linear-gradient(135deg,rgba(255,255,255,0.5),rgba(255,255,255,0)_46%)]" />
          <div className="pointer-events-none absolute -bottom-36 -right-24 -z-10 h-[28rem] w-[28rem] rounded-full bg-white/32 blur-3xl" />
          <div className="relative z-10 max-w-[760px] pb-10 lg:pb-0">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1B3C6C] sm:text-sm">
              OntarioReno Contractor Partners
            </p>
            <h1 className="mt-6 text-[3.95rem] font-bold leading-[0.88] tracking-[-0.075em] text-[#08111f] sm:text-7xl lg:text-[5.9rem] xl:text-[6.55rem]">
              <span className="block">Need More</span>
              <span className="block">Renovation</span>
              <span className="block">Jobs?</span>
            </h1>
            <p className="mt-8 max-w-2xl text-lg font-medium leading-8 text-[#263747] sm:text-[1.28rem] sm:leading-9">
              OntarioReno is building a contractor partner network for serious
              renovation companies across Ontario.
            </p>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-[#33495b] sm:text-xl sm:leading-9">
              We manage homeowner demand, qualification, consultation, and sales
              — then work with contractor partners who can fulfill the project.
            </p>
            <a
              href="#partner-application"
              className="mt-10 inline-flex min-h-[4rem] w-full items-center justify-center gap-3 rounded-[1.15rem] bg-[#1B3C6C] px-8 py-4 text-base font-bold tracking-[-0.015em] text-white shadow-[0_18px_36px_rgba(27,60,108,0.22)] transition hover:bg-[#15345f] hover:shadow-[0_22px_44px_rgba(27,60,108,0.26)] sm:w-auto sm:rounded-[1.25rem] sm:text-[1.03rem]"
            >
              Request Contractor Review
              <ArrowRight className="h-5 w-5" />
            </a>
            <p className="mt-5 max-w-xl text-sm font-semibold leading-7 text-[#51697b] sm:text-base">
              Limited partner spots available by service area and project category.
            </p>
          </div>

          <div className="relative mx-auto mt-2 min-h-[540px] w-full max-w-[520px] self-end sm:min-h-[580px] lg:mt-0 lg:max-w-none">
            <div className="absolute inset-x-1 bottom-0 top-24 overflow-hidden rounded-t-[2rem] border border-white/55 bg-[#0d1729] shadow-[0_30px_80px_rgba(11,27,43,0.24)] sm:inset-x-5 sm:top-12 sm:rounded-t-[2.5rem]">
              <img
                src="/images/financing-planning.png"
                alt=""
                className="absolute inset-0 h-full w-full object-cover object-center opacity-88"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(219,232,236,0.04)_0%,rgba(13,23,41,0.18)_28%,rgba(13,23,41,0.72)_100%)]" />
              <div className="absolute inset-0 bg-[url('/images/blueprint-hero.png')] bg-cover bg-center opacity-[0.12] mix-blend-screen" />
            </div>

            <div className="absolute left-1/2 top-0 z-40 w-[15.75rem] -translate-x-1/2 rounded-[1.45rem] border border-white/75 bg-white/92 p-4 text-center shadow-[0_24px_60px_rgba(15,40,62,0.18)] backdrop-blur-md sm:w-[19rem] sm:p-6">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#1B3C6C] text-white shadow-[0_12px_24px_rgba(27,60,108,0.24)]">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-[#8d6b2a]">
                OntarioReno Reviewed
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-[-0.045em] text-[#08111f]">
                Qualified Project Opportunity
              </h2>
            </div>

            {pipelineCards.map((card) => (
              <div
                key={card.title}
                className={`absolute z-30 rounded-[0.95rem] border border-white/75 bg-white/90 px-3 py-2.5 shadow-[0_16px_40px_rgba(15,40,62,0.15)] backdrop-blur-md sm:rounded-[1rem] sm:px-4 sm:py-3 ${card.className}`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#2b5a96] ring-4 ring-blue-100" />
                  <div>
                    <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-500 sm:text-[0.72rem]">
                      {card.title}
                    </p>
                    <p className="mt-1 text-xs font-bold leading-5 tracking-[-0.02em] text-slate-950 sm:text-sm">
                      {card.body}
                    </p>
                  </div>
                </div>
              </div>
            ))}
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
