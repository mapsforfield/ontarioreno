import { FormEvent, useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { buttonStyles, formStyles } from '../lib/uiStyles';

const LEAD_SUBMISSION_ENDPOINT =
  'https://script.google.com/macros/s/AKfycbyi1JG7OXDwCghiVQb2PaOEME7ZByUa8Mxl3N7xbTCCaL07Bdrx3h01dA4YisDPV_Yw/exec';

const pipelineCards = [
  {
    title: 'New homeowner inquiry',
    body: 'Basement apartment project',
    step: '01',
    className: 'left-4 top-[12.7rem] w-[12rem] sm:left-6 sm:top-[10rem] sm:w-[13.5rem] lg:top-[13.15rem]',
  },
  {
    title: 'Consultation booked',
    body: 'Thursday, 6:30 PM',
    step: '02',
    className: 'right-4 top-[19.95rem] w-[12rem] sm:right-5 sm:top-[16.95rem] sm:w-[13.5rem] lg:top-[20.1rem]',
  },
  {
    title: 'Project reviewed',
    body: 'Budget range confirmed',
    step: '03',
    className: 'left-4 top-[26.45rem] w-[12rem] sm:left-8 sm:top-[23.9rem] sm:w-[13.5rem] lg:top-[27.05rem]',
  },
  {
    title: 'Project ready',
    body: 'Ready for assignment',
    step: '04',
    className: 'right-4 top-[33.35rem] w-[13rem] sm:right-6 sm:top-[29.75rem] sm:w-[14.25rem] lg:top-[32.9rem]',
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
  'Homeowners are searching',
  'Demand is project-specific',
  'Financing questions surface earlier',
  'Weak inquiries are filtered',
  'Contractors focus on delivery',
];

const partnerOptions = [
  {
    title: 'Partner Network',
    body: 'Approved contractors are considered for OntarioReno renovation project opportunities.',
  },
  {
    title: 'Appointment Support',
    body: 'Homeowner communication and consultation coordination stay inside the OntarioReno process.',
  },
  {
    title: 'Sales Support',
    body: 'OntarioReno sales reps support project approval before contractor fulfillment begins.',
  },
];

const credibilityPoints = [
  {
    title: 'Homeowners Research Here',
    body: 'Homeowners come to OntarioReno while planning costs, grants, financing, and project scope.',
  },
  {
    title: 'Projects Are Reviewed',
    body: 'Project category, location, budget, and readiness are reviewed before handoff.',
  },
  {
    title: 'Projects Are Managed Through OntarioReno',
    body: 'Approved partners step in when a project is ready for fulfillment.',
  },
];

export default function ContractorPartners() {
  const [visiblePipelineCards, setVisiblePipelineCards] = useState(
    pipelineCards.map(() => false)
  );
  const [submitStatus, setSubmitStatus] = useState<
    'idle' | 'submitting' | 'success' | 'error'
  >('idle');
  const pipelineCardRefs = useRef<Array<HTMLDivElement | null>>([]);

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

  useEffect(() => {
    const desktopQuery = window.matchMedia('(min-width: 1024px)');

    if (desktopQuery.matches) {
      const timers = pipelineCards.map((_, index) =>
        window.setTimeout(() => {
          setVisiblePipelineCards((current) => {
            if (current[index]) {
              return current;
            }

            const next = [...current];
            next[index] = true;
            return next;
          });
        }, 220 + index * 170)
      );

      return () => {
        timers.forEach((timer) => window.clearTimeout(timer));
      };
    }

    if (!('IntersectionObserver' in window)) {
      setVisiblePipelineCards(pipelineCards.map(() => true));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          const index = Number(
            (entry.target as HTMLElement).dataset.pipelineCardIndex
          );

          setVisiblePipelineCards((current) => {
            if (current[index]) {
              return current;
            }

            const next = [...current];
            next[index] = true;
            return next;
          });

          observer.unobserve(entry.target);
        });
      },
      {
        rootMargin: '0px 0px -12% 0px',
        threshold: 0.28,
      }
    );

    pipelineCardRefs.current.forEach((card) => {
      if (card) {
        observer.observe(card);
      }
    });

    return () => observer.disconnect();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitStatus('submitting');

    const form = event.currentTarget;
    const formData = new FormData(form);
    const value = (field: string) =>
      String(formData.get(field) ?? '').trim();

    const payload = {
      sheetTab: 'Contractors',
      'Company Name': value('companyName'),
      'Contact Name': value('contactName'),
      Phone: value('phone'),
      Email: value('email'),
      Website: value('website'),
      'Service Area': value('serviceArea'),
      'Main Renovation Work': value('projectTypes'),
      'Average Project Size': value('averageProjectSize'),
      'Offers Financing': value('offersFinancing'),
      Message: value('message'),
    };

    try {
      await fetch(LEAD_SUBMISSION_ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify(payload),
      });

      setSubmitStatus('success');
      form.reset();
    } catch (error) {
      console.error(error);
      setSubmitStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfaf7]">
      <Helmet>
        <title>Contractor Partners | Get More Renovation Jobs | OntarioReno</title>
        <meta
          name="description"
          content="OntarioReno reviews select Ontario renovation contractors for homeowner renovation opportunities by service area, project category, and capacity."
        />
        <meta name="theme-color" content="#0d1729" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="canonical" href="https://ontarioreno.ca/contractor-partners" />
      </Helmet>

      <section className="-mt-px bg-[#fbfaf7] px-3 pb-10 pt-0 sm:px-5 sm:pb-14 sm:pt-3 lg:px-8 lg:pt-5">
        <div className="relative isolate mx-auto grid max-w-7xl overflow-hidden rounded-[2.25rem] bg-[#0d1729] px-6 pb-0 pt-12 text-white shadow-[0_32px_90px_rgba(5,12,24,0.28)] sm:rounded-[3rem] sm:px-10 sm:pt-16 lg:min-h-[760px] lg:grid-cols-[minmax(0,1.05fr)_minmax(480px,0.95fr)] lg:items-center lg:gap-12 lg:px-14 lg:py-16 xl:grid-cols-[minmax(0,1.08fr)_minmax(520px,0.92fr)] xl:gap-14 xl:px-18">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_14%_12%,rgba(73,132,184,0.28),transparent_33%),radial-gradient(circle_at_78%_16%,rgba(188,158,91,0.14),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0)_42%)]" />
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(13,23,41,0)_48%,rgba(4,9,18,0.72)_100%)]" />
          <div className="pointer-events-none absolute -bottom-36 -right-24 -z-10 h-[28rem] w-[28rem] rounded-full bg-[#2b5a96]/30 blur-3xl" />
          <div className="relative z-10 max-w-[760px] pb-10 lg:max-w-[820px] lg:pb-0 xl:max-w-[860px]">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-200 sm:text-sm">
              OntarioReno Contractor Partners
            </p>
            <h1 className="mt-6 text-[3.72rem] font-bold leading-[0.84] tracking-[-0.068em] text-white sm:text-7xl sm:leading-[0.86] lg:text-[5.9rem] xl:text-[6.55rem]">
              <span className="block">Need More</span>
              <span className="block">Renovation Jobs?</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300 sm:mt-8 sm:text-xl sm:leading-9 lg:max-w-[46rem] xl:max-w-[50rem]">
              We manage homeowner demand, qualification, consultation, and sales
              before assigning projects to contractor partners.
            </p>
            <a
              href="#partner-application"
              className="mt-7 inline-flex min-h-[4rem] w-full items-center justify-center gap-3 rounded-[1.15rem] bg-[#2f69ad] px-8 py-4 text-base font-bold tracking-[-0.015em] text-white shadow-[0_18px_38px_rgba(47,105,173,0.28)] ring-1 ring-white/10 transition hover:bg-[#3677c2] hover:shadow-[0_22px_48px_rgba(47,105,173,0.34)] sm:mt-8 sm:w-auto sm:rounded-[1.25rem] sm:text-[1.03rem] lg:min-h-[4.35rem] lg:px-10 lg:py-5 lg:text-[1.08rem] xl:px-11"
            >
              Request Contractor Review
              <ArrowRight className="h-5 w-5" />
            </a>
            <p className="mt-4 max-w-xl text-sm font-semibold leading-7 text-blue-100 sm:mt-5 sm:text-base">
              Limited partner spots available by service area and project category.
            </p>
          </div>

          <div className="relative mx-auto mt-2 min-h-[660px] w-full max-w-[520px] self-end sm:min-h-[650px] lg:mt-0 lg:max-w-[560px] xl:max-w-[600px]">
            <div className="absolute inset-x-[-1.5rem] bottom-0 top-24 overflow-hidden rounded-t-[2rem] border border-white/18 bg-[#0d1729] shadow-[0_30px_80px_rgba(0,0,0,0.34)] sm:inset-x-0 sm:top-12 sm:rounded-t-[2.5rem] lg:inset-x-[-1rem]">
              <img
                src="/images/financing-planning.png"
                alt=""
                className="absolute inset-0 h-full w-full object-cover object-center opacity-82"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(13,23,41,0.08)_0%,rgba(13,23,41,0.34)_34%,rgba(4,9,18,0.78)_100%)]" />
              <div className="absolute inset-0 bg-[url('/images/blueprint-hero.png')] bg-cover bg-center opacity-[0.16] mix-blend-screen" />
            </div>

            <div className="absolute left-1/2 top-0 z-40 w-[15.5rem] -translate-x-1/2 rounded-[1.45rem] border border-white/80 bg-white/96 p-4 text-center shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur-md sm:w-[18.5rem] sm:p-6">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#1B3C6C] text-white shadow-[0_12px_24px_rgba(27,60,108,0.24)] sm:h-11 sm:w-11">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <p className="mt-4 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[#8d6b2a] sm:text-xs">
                OntarioReno Reviewed
              </p>
              <h2 className="mt-2 text-[1.35rem] font-bold leading-tight tracking-[-0.045em] text-[#08111f] sm:text-2xl">
                Qualified Project Opportunity
              </h2>
            </div>

            <div className="absolute bottom-14 left-1/2 top-[12rem] z-20 w-px -translate-x-1/2 bg-gradient-to-b from-white/0 via-white/40 to-white/0" />

            {pipelineCards.map((card, index) => (
              <div
                key={card.title}
                ref={(node) => {
                  pipelineCardRefs.current[index] = node;
                }}
                data-pipeline-card-index={index}
                className={`absolute z-30 origin-bottom rounded-[1rem] border border-white/80 bg-white/95 px-3.5 py-3 shadow-[0_18px_52px_rgba(0,0,0,0.26)] backdrop-blur-md transition-all duration-300 ease-[cubic-bezier(0.18,0.86,0.32,1.2)] will-change-transform motion-reduce:transition-none sm:rounded-[1.15rem] sm:px-4 sm:py-3.5 ${visiblePipelineCards[index] ? 'translate-y-0 scale-100 opacity-100 blur-0' : 'translate-y-5 scale-[0.93] opacity-0 blur-[1px]'} ${card.className}`}
                style={{
                  transitionDelay: visiblePipelineCards[index]
                    ? `${index * 60}ms`
                    : '0ms',
                }}
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[0.62rem] font-bold text-[#2b5a96] ring-1 ring-blue-100">
                    {card.step}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[0.62rem] font-bold uppercase leading-4 tracking-[0.14em] text-slate-500 sm:text-[0.7rem]">
                      {card.title}
                    </p>
                    <p className="mt-1.5 text-[0.82rem] font-bold leading-5 tracking-[-0.02em] text-slate-950 sm:text-sm">
                      {card.body}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#fbfaf7]">
        <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 md:px-8 md:py-11 lg:py-14 xl:px-10">
          <div className="grid overflow-hidden rounded-[1.75rem] border border-slate-200/70 bg-white/70 shadow-[0_18px_55px_rgba(15,23,42,0.055)] backdrop-blur md:grid-cols-3 md:divide-x md:divide-slate-200/80 lg:rounded-[2rem] lg:bg-white/80 lg:shadow-[0_26px_80px_rgba(15,23,42,0.075)]">
          {credibilityPoints.map((point) => (
            <article key={point.title} className="border-b border-slate-200/80 px-6 py-6 transition duration-300 last:border-b-0 md:border-b-0 md:px-8 md:py-7 lg:px-10 lg:py-9 lg:hover:bg-white/70">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8d6b2a] lg:text-[0.72rem] lg:tracking-[0.22em]">
                OntarioReno Network
              </p>
              <h2 className="mt-3 text-xl font-bold tracking-[-0.025em] text-slate-950 lg:mt-4 lg:text-[1.55rem] lg:leading-tight lg:tracking-[-0.035em]">
                {point.title}
              </h2>
              <p className="mt-3 text-base leading-7 text-slate-600 lg:mt-4 lg:text-[1.02rem] lg:leading-8">{point.body}</p>
            </article>
          ))}
          </div>
        </div>
      </section>

      <section className="bg-[#fbfaf7] py-16 lg:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,1fr)] lg:items-start lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.19em] text-[#1B3C6C]">
              Contractor Criteria
            </p>
            <h2 className="mt-4 text-3xl font-bold leading-tight tracking-[-0.045em] text-slate-950 sm:text-[2.65rem]">
              We&apos;re Looking For Contractors Ready To Take On More Projects
            </h2>
          </div>
          <ul className="space-y-4 rounded-[1.65rem] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.065)] sm:p-7">
            {contractorFit.map((item) => (
              <li key={item} className="flex items-center gap-3 text-base font-medium text-slate-700 sm:text-lg">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-[#2b5a96]" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-[#f2f4f5] py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.19em] text-[#1B3C6C]">
            Project Categories
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-[-0.045em] text-slate-950 sm:text-[2.85rem]">
            Project Types We Handle
          </h2>
          <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projectTypes.map((project) => (
              <article
                key={project.title}
                className="group relative flex min-h-[265px] overflow-hidden rounded-[1.55rem] border border-white/20 bg-slate-900 p-6 shadow-[0_20px_55px_rgba(15,23,42,0.16)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(15,23,42,0.22)] sm:p-7"
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

      <section className="relative overflow-hidden border-y border-white/10 bg-[#101a2c] py-16 text-white lg:py-20">
        <div className="absolute right-0 top-0 h-full w-[48%] bg-[url('/images/blueprint-hero.png')] bg-cover bg-center opacity-[0.09]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.19em] text-blue-200">
            Managed Demand Infrastructure
          </p>
          <h2 className="mt-4 max-w-3xl text-3xl font-bold tracking-[-0.045em] text-white sm:text-[2.85rem]">
            Why This Works For Contractors
          </h2>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {contractorReasons.map((reason, index) => (
              <div key={reason} className="rounded-[1.2rem] border border-white/10 bg-white/[0.06] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-sm">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-200">
                  0{index + 1}
                </p>
                <p className="mt-4 text-base font-semibold leading-7 text-white">{reason}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#fbfaf7] py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.19em] text-[#1B3C6C]">
            Partnership Structure
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-[-0.045em] text-slate-950 sm:text-[2.85rem]">
            How OntarioReno Works With Contractors
          </h2>
          <div className="mt-9 grid gap-5 lg:grid-cols-3">
            {partnerOptions.map((option) => (
              <article key={option.title} className="rounded-[1.55rem] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-6 shadow-[0_18px_55px_rgba(15,23,42,0.06)] sm:p-7">
                <div className="h-px w-12 bg-[#b08b46]" />
                <h3 className="mt-6 text-2xl font-bold tracking-[-0.025em] text-slate-950">
                  {option.title}
                </h3>
                <p className="mt-3 text-base leading-7 text-slate-600">{option.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="partner-application" className="scroll-mt-20 bg-[#f2f4f5] py-16 sm:scroll-mt-24 lg:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-7 lg:grid-cols-[minmax(0,0.82fr)_minmax(320px,0.48fr)] lg:items-end">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
                Selective contractor review
              </p>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.04em] text-slate-950 sm:text-4xl lg:text-5xl">
                Request Contractor Review
              </h2>
              <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
                Tell us about your company. If there is a fit, OntarioReno will
                reach out to discuss available project categories, service areas,
                and how we can work together.
              </p>
            </div>
            <div className="rounded-[1.35rem] border border-slate-200/80 bg-white/75 p-5 shadow-[0_16px_44px_rgba(15,23,42,0.06)]">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8d6b2a]">
                Review Standards
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Limited approval by category, service area, capacity, and project fit.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-9 overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#fbfcfd_100%)] shadow-[0_24px_70px_rgba(15,23,42,0.08)]"
          >
            <div className="space-y-8 p-5 sm:p-7 lg:p-8">
              <fieldset>
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0d1729] text-xs font-bold text-white">
                    1
                  </span>
                  <legend className="text-lg font-bold tracking-[-0.02em] text-slate-950">
                    Company details
                  </legend>
                </div>
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
                </div>
              </fieldset>

              <fieldset className="border-t border-slate-200/80 pt-8">
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0d1729] text-xs font-bold text-white">
                    2
                  </span>
                  <legend className="text-lg font-bold tracking-[-0.02em] text-slate-950">
                    Project capacity
                  </legend>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="sm:col-span-2">
                    <span className={formStyles.label}>Main renovation work</span>
                    <input className={formStyles.field} type="text" name="projectTypes" placeholder="Basements, kitchens, bathrooms, ADUs..." />
                  </label>
                  <label>
                    <span className={formStyles.label}>Average project size</span>
                    <input className={formStyles.field} type="text" name="averageProjectSize" placeholder="e.g. $50K-$90K" />
                  </label>
                  <label>
                    <span className={formStyles.label}>Do you offer financing?</span>
                    <select className={formStyles.field} name="offersFinancing" defaultValue="">
                      <option value="" disabled>Select an option</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                      <option value="in-progress">In progress</option>
                    </select>
                  </label>
                  <label className="sm:col-span-2">
                    <span className={formStyles.label}>Message</span>
                    <textarea className={`${formStyles.field} min-h-28 resize-y`} name="message" />
                  </label>
                </div>
              </fieldset>
            </div>
            <div className="border-t border-slate-200/80 bg-slate-50/80 p-5 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-7 lg:p-8">
              <div>
                <p className="text-sm leading-6 text-slate-500">
                  OntarioReno reviews contractor fit based on service area, project
                  category, capacity, financing readiness, and operational standards.
                </p>
                {submitStatus === 'success' && (
                  <p className="mt-3 rounded-[0.9rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold leading-6 text-emerald-800" aria-live="polite">
                    Your contractor review request has been submitted. OntarioReno will contact you if there is a fit.
                  </p>
                )}
                {submitStatus === 'error' && (
                  <p className="mt-3 rounded-[0.9rem] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-800" aria-live="polite">
                    Something went wrong. Please try again or contact OntarioReno directly.
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={submitStatus === 'submitting'}
                className={`${buttonStyles.primary} mt-5 shrink-0 disabled:cursor-not-allowed disabled:opacity-70 sm:mt-0`}
              >
                {submitStatus === 'submitting'
                  ? 'Submitting...'
                  : 'Submit For Contractor Review'}
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="relative isolate overflow-hidden bg-[#07101d] py-20 text-white lg:py-24">
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
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-200 sm:text-xl">
            Request a contractor review. If there is a fit, we&apos;ll discuss the structure privately.
          </p>
          <a href="#partner-application" className={`${buttonStyles.primary} mt-9 px-9 py-4 text-[1.03rem]`}>
            Request Contractor Review
            <ArrowRight className="h-5 w-5" />
          </a>
        </div>
      </section>
    </div>
  );
}
