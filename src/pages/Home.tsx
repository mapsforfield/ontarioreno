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
import { useEffect, useRef, useState } from 'react';
import { cn } from '../lib/utils';
import CitySelectorSection from '../components/CitySelectorSection';
import { buttonStyles } from '../lib/uiStyles';

const GUIDE_PDF_URL = '/guides/ontario-renovation-cost-guide-2026.pdf';
const GUIDE_MIN_FILL_TIME_MS = 4000;
const TURNSTILE_SITE_KEY = '0x4AAAAAAC1T5itPPClMtbD6';
const GUIDE_ENDPOINT =
  'https://script.google.com/macros/s/AKfycbx01lpcatHsLZzoS_anmr1NhnxV_3D9bgnh0MYmIMpBpbqWYot4rfpGDthUEyqZXRei/exec';

const featuredPrograms = [
  {
    eyebrow: 'Grant Program',
    title: 'Hamilton Basement Grant',
    highlight: 'Up to $40,000',
    description:
      'The strongest current funding-focused entry point for legal basement and secondary suite planning.',
    primaryLabel: 'See My Estimated Grant',
    primaryHref: '/hamilton-basement-grant',
    secondaryLabel: 'Full Hamilton Guide',
    secondaryHref: '/hamilton-grant-guide',
  },
  {
    eyebrow: 'City Guide',
    title: 'St. Catharines ADU Guides',
    highlight: 'Grant, cost, and permit path',
    description:
      'A complete ADU planning cluster covering funding structure, realistic costs, and legal requirements.',
    primaryLabel: 'Explore St. Catharines',
    primaryHref: '/st-catharines',
    secondaryLabel: 'Grant Guide',
    secondaryHref: '/st-catharines-adu-grant',
  },
  {
    eyebrow: 'Incentive Guide',
    title: 'Burlington ARU Incentive',
    highlight: 'Program overview',
    description:
      'Useful for homeowners comparing Burlington incentive support with broader basement and legal-suite planning.',
    primaryLabel: 'View Burlington Guide',
    primaryHref: '/burlington-aru-incentive-program',
    secondaryLabel: 'Burlington Cost Guide',
    secondaryHref: '/basement-renovation-cost-burlington',
  },
];

const disposableEmailDomains = new Set([
  'mailinator.com',
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'yopmail.com',
  'sharklasers.com',
  'trashmail.com',
  'throwawaymail.com',
  'getnada.com',
  'temp-mail.org',
]);

const normalizePhone = (value: string) => value.replace(/\D/g, '');

const formatPhoneInput = (value: string) => {
  const digits = normalizePhone(value).slice(0, 10);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};

const isLikelyValidPhone = (value: string) => {
  const digits = normalizePhone(value);

  if (digits.length !== 10) return false;
  if (/^(\d)\1{9}$/.test(digits)) return false;
  if (digits === '1234567890') return false;
  if (digits === '0123456789') return false;
  if (digits === '0000000000') return false;

  const areaCode = digits.slice(0, 3);
  const exchange = digits.slice(3, 6);

  if (areaCode[0] === '0' || areaCode[0] === '1') return false;
  if (exchange[0] === '0' || exchange[0] === '1') return false;

  return true;
};

const isLikelyValidEmail = (email: string) => {
  const cleaned = email.trim().toLowerCase();
  const basic = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned);

  if (!basic) return false;

  const domain = cleaned.split('@')[1];
  if (!domain) return false;
  if (disposableEmailDomains.has(domain)) return false;

  return true;
};

const downloadGuidePdf = () => {
  const link = document.createElement('a');
  link.href = GUIDE_PDF_URL;
  link.download = '2026-Ontario-Renovation-Cost-Guide.pdf';
  document.body.appendChild(link);
  link.click();
  link.remove();
};

declare global {
  interface Window {
    onTurnstileSuccess?: (token: string) => void;
    onTurnstileExpired?: () => void;
    onTurnstileError?: () => void;
    turnstile?: {
      reset: (widget?: string | HTMLElement) => void;
    };
  }
}

export default function Home() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const [guideForm, setGuideForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    companyWebsite: '',
  });

  const [guideSubmitting, setGuideSubmitting] = useState(false);
  const [guideStatus, setGuideStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({
    type: null,
    message: '',
  });

  const [turnstileToken, setTurnstileToken] = useState('');
  const [isDesktopGuideLayout, setIsDesktopGuideLayout] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(min-width: 1280px)').matches;
  });
  const [turnstileStatus, setTurnstileStatus] = useState<
    'idle' | 'rendered' | 'verified' | 'expired' | 'error'
  >('idle');
  const desktopTurnstileRef = useRef<HTMLDivElement | null>(null);
  const mobileTurnstileRef = useRef<HTMLDivElement | null>(null);
  const desktopTurnstileWidgetId = useRef<string | null>(null);
  const mobileTurnstileWidgetId = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(min-width: 1280px)');
    const syncGuideLayout = (event?: MediaQueryListEvent) => {
      const matches = event ? event.matches : mediaQuery.matches;
      setIsDesktopGuideLayout(matches);
    };

    syncGuideLayout();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', syncGuideLayout);
      return () => mediaQuery.removeEventListener('change', syncGuideLayout);
    }

    mediaQuery.addListener(syncGuideLayout);
    return () => mediaQuery.removeListener(syncGuideLayout);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const turnstile = (window as any).turnstile;

      if (!turnstile) {
        return;
      }

      const activeRef = isDesktopGuideLayout
        ? desktopTurnstileRef.current
        : mobileTurnstileRef.current;
      const activeWidgetIdRef = isDesktopGuideLayout
        ? desktopTurnstileWidgetId
        : mobileTurnstileWidgetId;
      const activeLayoutLabel = isDesktopGuideLayout ? 'desktop' : 'mobile';

      if (activeRef && !activeWidgetIdRef.current) {
        console.log(`[Turnstile] render requested for ${activeLayoutLabel} guide form`);
        activeWidgetIdRef.current = turnstile.render(activeRef, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (token: string) => {
            console.log(`[Turnstile] success callback fired on ${activeLayoutLabel} guide form`);
            console.log('[Turnstile] token received', {
              layout: activeLayoutLabel,
              tokenLength: token?.length ?? 0,
            });
            setTurnstileToken(token);
            setTurnstileStatus('verified');
          },
          'expired-callback': () => {
            console.log(`[Turnstile] token expired on ${activeLayoutLabel} guide form`);
            setTurnstileToken('');
            setTurnstileStatus('expired');
          },
          'error-callback': () => {
            console.log(`[Turnstile] widget error on ${activeLayoutLabel} guide form`);
            setTurnstileToken('');
            setTurnstileStatus('error');
          },
        });
        setTurnstileStatus('rendered');
      }

      if (activeWidgetIdRef.current) {
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isDesktopGuideLayout]);

  useEffect(() => {
    console.log('[Turnstile] active guide form layout', isDesktopGuideLayout ? 'desktop' : 'mobile');
  }, [isDesktopGuideLayout]);

  const resetTurnstile = () => {
    if (!window.turnstile) return;

    const activeWidgetId = isDesktopGuideLayout
      ? desktopTurnstileWidgetId.current
      : mobileTurnstileWidgetId.current;

    console.log('[Turnstile] manual reset requested', {
      layout: isDesktopGuideLayout ? 'desktop' : 'mobile',
      hasWidget: Boolean(activeWidgetId),
    });

    if (activeWidgetId) {
      window.turnstile.reset(activeWidgetId);
      setTurnstileToken('');
      setTurnstileStatus('rendered');
    }
  };

  const guideFormLoadedAt = useRef(Date.now());

  useEffect(() => {
    window.onTurnstileSuccess = (token: string) => {
      setTurnstileToken(token);
    };

    window.onTurnstileExpired = () => {
      setTurnstileToken('');
    };

    window.onTurnstileError = () => {
      setTurnstileToken('');
    };

    return () => {
      delete window.onTurnstileSuccess;
      delete window.onTurnstileExpired;
      delete window.onTurnstileError;
    };
  }, []);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const handleGuideChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setGuideForm((prev) => ({
      ...prev,
      [name]: name === 'phone' ? formatPhoneInput(value) : value,
    }));
  };

  const handleGuideSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    console.log('[Turnstile] submit clicked', {
      layout: isDesktopGuideLayout ? 'desktop' : 'mobile',
      hasToken: Boolean(turnstileToken),
      tokenLength: turnstileToken.length,
    });

    setGuideStatus({ type: null, message: '' });

    const trimmedName = guideForm.name.trim();
    const trimmedEmail = guideForm.email.trim().toLowerCase();
    const trimmedAddress = guideForm.address.trim();
    const normalizedPhone = normalizePhone(guideForm.phone);
    const fillTimeMs = Date.now() - guideFormLoadedAt.current;

    if (!trimmedName) {
      setGuideStatus({
        type: 'error',
        message: 'Please enter your first name.',
      });
      return;
    }

    if (!isLikelyValidEmail(trimmedEmail)) {
      setGuideStatus({
        type: 'error',
        message: 'Please enter a valid email address.',
      });
      return;
    }

    if (!isLikelyValidPhone(normalizedPhone)) {
      setGuideStatus({
        type: 'error',
        message: 'Please enter a valid phone number.',
      });
      return;
    }

    if (!trimmedAddress || trimmedAddress.length < 6) {
      setGuideStatus({
        type: 'error',
        message: 'Please enter your project address.',
      });
      return;
    }

    if (guideForm.companyWebsite.trim() !== '') {
      setGuideStatus({
        type: 'error',
        message: 'Submission blocked.',
      });
      return;
    }

    if (fillTimeMs < GUIDE_MIN_FILL_TIME_MS) {
      setGuideStatus({
        type: 'error',
        message: 'Please take a moment to complete the form properly.',
      });
      return;
    }

    if (!turnstileToken) {
      console.log('[Turnstile] submit blocked due to missing token', {
        layout: isDesktopGuideLayout ? 'desktop' : 'mobile',
      });
      setGuideStatus({
        type: 'error',
        message: 'Please complete the verification first.',
      });
      return;
    }

    setGuideSubmitting(true);

    try {
      const response = await fetch(GUIDE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          type: 'guide',
          source: 'guide',
          name: trimmedName,
          email: trimmedEmail,
          phone: normalizedPhone,
          address: trimmedAddress,
          honeypot: guideForm.companyWebsite.trim(),
          fillTimeMs,
          turnstileToken,
          guidePdfUrl: `${window.location.origin}${GUIDE_PDF_URL}`,
          userAgent: navigator.userAgent,
          pageUrl: window.location.href,
        }),
      });

      const result = await response.json();
      console.log('Guide response:', result);

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Submission failed.');
      }

      setGuideStatus({
        type: 'success',
        message: 'Success. Your guide is downloading now.',
      });

      downloadGuidePdf();

      setGuideForm({
        name: '',
        email: '',
        phone: '',
        address: '',
        companyWebsite: '',
      });

      setTurnstileToken('');
      setTurnstileStatus('rendered');
      guideFormLoadedAt.current = Date.now();

      if (window.turnstile) {
        resetTurnstile();
      }
    } catch (error) {
      console.log('[Turnstile] submit failed after verification', {
        layout: isDesktopGuideLayout ? 'desktop' : 'mobile',
      });
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
        <title>Ontario Reno | Ontario Renovation Guides, Costs & Project Reviews</title>

        <meta
          name="description"
          content="Plan your Ontario renovation the right way. Understand permits, legal suites, basement grants, real project costs, and review your project before hiring."
        />

        <link rel="canonical" href="https://ontarioreno.ca/" />

        <meta
          property="og:title"
          content="Ontario Reno | Ontario Renovation Guides, Costs & Project Reviews"
        />
        <meta
          property="og:description"
          content="Plan your Ontario renovation the right way. Understand permits, legal suites, basement grants, real project costs, and review your project before hiring."
        />
        <meta property="og:url" content="https://ontarioreno.ca/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://ontarioreno.ca/preview.jpg" />

        <meta
          name="twitter:title"
          content="Ontario Reno | Ontario Renovation Guides, Costs & Project Reviews"
        />
        <meta
          name="twitter:description"
          content="Plan your Ontario renovation the right way. Understand permits, legal suites, basement grants, real project costs, and review your project before hiring."
        />
        <meta name="twitter:image" content="https://ontarioreno.ca/preview.jpg" />
      </Helmet>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 text-white">
        <div className="absolute inset-0 z-0 opacity-40">
          <img
            src="/hero.jpg"
            alt="Ontario Home Renovation"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-transparent"></div>
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-14">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-[#1B3C6C]/20 px-4 py-2 text-sm font-medium text-blue-300 backdrop-blur-sm">
                <ShieldCheck className="w-4 h-4" />
                <span>Ontario&apos;s Independent Homeowner Guide</span>
              </div>

              <h1 className="mb-6 mt-8 max-w-3xl text-4xl font-bold leading-[0.98] tracking-[-0.05em] sm:text-5xl lg:text-7xl">
                Plan Your Renovation with <span className="text-[#7FB0E0]">Confidence.</span>
              </h1>

              <p className="mb-4 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
                OntarioReno helps homeowners understand renovation costs, permit requirements, project feasibility, and the right next steps before moving forward.
              </p>

              <p className="mb-10 max-w-2xl text-sm text-slate-400">
                Independent guidance for Ontario homeowners planning basements, legal suites, permits, grants, and renovation costs.
              </p>

              <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
                <Link
                  to="/match"
                  className={buttonStyles.primary}
                >
                  Start Project Review <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/costs"
                  className={buttonStyles.ghostDark}
                >
                  Explore Renovation Costs
                </Link>
              </div>

              <div className="mt-12 flex flex-wrap items-center gap-6 text-sm font-medium text-slate-400">
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

            <div className="hidden lg:block">
              <Link
                to="/#cost-guide"
                className="group relative block rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07)_0%,rgba(255,255,255,0.03)_100%)] p-7 shadow-[0_28px_70px_rgba(2,6,23,0.26)] backdrop-blur-sm transition duration-200 hover:border-white/18 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.09)_0%,rgba(255,255,255,0.04)_100%)]"
              >
                <div className="absolute inset-x-10 top-10 h-48 rounded-full bg-[#4A8DDA]/18 blur-3xl" />
                <div className="absolute inset-x-16 top-[7.25rem] h-32 rounded-full bg-[#7FB0E0]/22 blur-2xl" />

                <div className="relative flex justify-center">
                  <img
                    src="/ontario-reno-cost-guide-3d-preview.png"
                    alt="2026 Ontario Renovation Cost Guide booklet preview"
                    className="relative z-10 h-auto w-[250px] object-contain drop-shadow-[0_26px_36px_rgba(2,6,23,0.34)] transition duration-200 group-hover:-translate-y-1"
                    loading="eager"
                  />
                </div>

                <div className="relative mt-5 border-t border-white/10 pt-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-200">
                    Free planning guide
                  </p>
                  <h2 className="mt-3 text-2xl font-bold leading-tight tracking-[-0.03em] text-white">
                    2026 Ontario Renovation Cost Guide
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    See how to price basements, kitchens, legal suites, and permit costs before your first quote.
                  </p>
                  <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white">
                    Get the free guide
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-100 bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.45fr)_minmax(0,0.55fr)] lg:gap-16">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#1B3C6C]">
                <FileText className="h-4 w-4" />
                How OntarioReno Works
              </div>
              <h2 className="mt-4 text-3xl font-bold leading-tight tracking-[-0.03em] text-slate-900 md:text-4xl">
                Avoid costly renovation mistakes before committing.
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-600 md:text-lg">
                OntarioReno helps Ontario homeowners understand renovation costs, permit requirements, project feasibility, and the right next steps before moving forward.
              </p>
              <p className="mt-4 text-base leading-8 text-slate-500 md:text-lg">
                Most homeowners make decisions based on incomplete information — which leads to costly mistakes later.
              </p>
              <p className="mt-5 max-w-lg text-sm leading-7 text-slate-500 sm:text-base">
                Built to help homeowners make informed renovation decisions before moving forward.
              </p>
            </div>

            <div className="relative">
              <div className="absolute bottom-10 left-5 top-10 hidden w-px bg-[#1B3C6C]/10 md:block" />
              {[
                {
                  step: '01',
                  title: 'Review Your Project',
                  description:
                    'Share the basics of your renovation, property, budget, and timeline.',
                },
                {
                  step: '02',
                  title: 'Avoid Costly Planning Mistakes',
                  description:
                    'Identify cost, permit, and design decisions that commonly lead to delays, rework, or budget overruns.',
                },
                {
                  step: '03',
                  title: 'Choose the Right Next Step',
                  description:
                    'Determine the appropriate next step based on your scope, location, and project requirements.',
                },
              ].map((item, index, array) => (
                <div
                  key={item.step}
                  className={cn(
                    'relative flex items-start gap-5 py-8 sm:gap-6',
                    index !== array.length - 1 && 'border-b border-slate-100/70'
                  )}
                >
                  <div className="relative z-10 mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1B3C6C] text-sm font-bold text-white">
                    {item.step}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl font-extrabold leading-tight tracking-[-0.01em] text-slate-900">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-7 text-slate-600 sm:text-base">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Programs */}
      <section className="border-b border-yellow-100 bg-[linear-gradient(180deg,#fffaf0_0%,#fffdf8_48%,#ffffff_100%)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-14">
          <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-yellow-100 text-yellow-900 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em]">
                <Landmark className="w-4 h-4" />
                Featured Ontario Programs
              </div>
              <h2 className="mt-4 text-2xl md:text-4xl font-bold text-slate-900 leading-tight">
                Explore Ontario&apos;s top basement grant and ADU programs
              </h2>
              <p className="mt-4 max-w-2xl text-base md:text-lg text-slate-700 leading-relaxed">
                Hamilton currently offers the strongest grant opportunity, while St. Catharines and Burlington provide valuable guidance for planning legal basement and secondary suite projects.
              </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {featuredPrograms.map((program, index) => (
              <div
                key={program.title}
                className={cn(
                  'flex h-full flex-col rounded-[1.35rem] border p-6 shadow-[0_12px_28px_rgba(15,23,42,0.05)]',
                  index === 0
                    ? 'border-yellow-200 bg-[linear-gradient(180deg,#fffdf4_0%,#ffffff_100%)]'
                    : 'border-slate-200/90 bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)]'
                )}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {program.eyebrow}
                </p>
                <h3 className="mt-3 text-2xl font-bold tracking-[-0.02em] text-slate-900">
                  {program.title}
                </h3>
                <p className="mt-2 text-sm font-semibold text-[#1B3C6C]">
                  {program.highlight}
                </p>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  {program.description}
                </p>
                <div className="mt-auto pt-6 flex flex-col gap-3">
                  <Link
                    to={program.primaryHref}
                    className="inline-flex items-center justify-center rounded-[0.74rem] border border-slate-800 bg-[linear-gradient(180deg,#1f2937_0%,#0f172a_100%)] px-5 py-[0.78rem] font-semibold tracking-[-0.015em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(15,23,42,0.05),0_10px_22px_rgba(15,23,42,0.14)] transition duration-200 hover:border-slate-700 hover:bg-[linear-gradient(180deg,#273244_0%,#111c31_100%)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_1px_2px_rgba(15,23,42,0.06),0_14px_26px_rgba(15,23,42,0.18)] active:bg-[linear-gradient(180deg,#111827_0%,#020617_100%)] active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
                  >
                    {program.primaryLabel}
                  </Link>
                  <Link
                    to={program.secondaryHref}
                    className="inline-flex items-center justify-center rounded-[0.74rem] border border-slate-300 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-5 py-[0.78rem] font-semibold tracking-[-0.015em] text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.96),0_1px_2px_rgba(15,23,42,0.03),0_10px_22px_rgba(15,23,42,0.05)] transition duration-200 hover:border-slate-400 hover:bg-[linear-gradient(180deg,#ffffff_0%,#f1f5f9_100%)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.98),0_1px_2px_rgba(15,23,42,0.04),0_14px_26px_rgba(15,23,42,0.06)] active:bg-slate-100 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                  >
                    {program.secondaryLabel}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Authority / Trust Section */}
      <section className="border-b border-slate-100 bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-14">
            <div className="max-w-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
                Why homeowners use OntarioReno
              </p>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.03em] text-slate-900">
                More clarity before quotes, permits, and pricing decisions.
              </h2>
            </div>

            <div className="grid gap-0 md:grid-cols-3 md:divide-x md:divide-slate-200/80">
              <div className="border-t border-slate-200/80 pt-6 md:border-t-0 md:px-7 md:pt-0 md:first:pl-0 md:last:pr-0">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[1rem] bg-blue-50 text-[#1B3C6C]">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Permit & Code Clarity</h3>
                <p className="text-slate-600 leading-relaxed">
                  Stop guessing. We break down Ontario building codes and municipal permit requirements into plain English.
                </p>
              </div>

              <div className="border-t border-slate-200/80 pt-6 md:border-t-0 md:px-7 md:pt-0 md:first:pl-0 md:last:pr-0">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[1rem] bg-emerald-50 text-emerald-600">
                  <Calculator className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Transparent Pricing</h3>
                <p className="text-slate-600 leading-relaxed">
                  Access real, localized cost data for basements, kitchens, and legal suites across the GTA and beyond.
                </p>
              </div>

              <div className="border-t border-slate-200/80 pt-6 md:border-t-0 md:px-7 md:pt-0 md:first:pl-0 md:last:pr-0">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[1rem] bg-sky-50 text-sky-700">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Project Review & Next-Step Guidance</h3>
                <p className="text-slate-600 leading-relaxed">
                  Get project guidance, understand your next steps, and move forward with the right renovation path.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[2.15rem] border border-slate-900/10 bg-[linear-gradient(180deg,#0f172a_0%,#172554_100%)] shadow-[0_28px_80px_rgba(15,23,42,0.20)]">
            <div className="grid gap-0 lg:grid-cols-[minmax(0,1.2fr)_360px]">
              <div className="px-8 py-10 text-white md:px-10 md:py-12">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/8 px-4 py-2 text-sm font-semibold text-blue-200">
                  <Calculator className="h-4 w-4" />
                  Renovation financing
                </div>
                <h2 className="mt-5 max-w-3xl text-3xl font-bold tracking-[-0.03em] text-white md:text-5xl">
                  Need a clearer path to monthly renovation financing?
                </h2>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
                  Explore monthly payment examples, then go deeper into our
                  open-loan financing guide if you want the full picture on
                  payment flexibility, faster payoff strategy, and how the math
                  actually works.
                </p>
                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <Link
                    to="/open-loan-financing"
                    className={buttonStyles.primary}
                  >
                    Explore Open Loan Financing <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    to="/financing"
                    className={buttonStyles.ghostDark}
                  >
                    View Financing Options
                  </Link>
                </div>
              </div>

              <div className="border-t border-white/10 bg-white/6 px-8 py-10 text-white backdrop-blur-sm md:px-10 lg:border-l lg:border-t-0">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-200">
                  Why it matters
                </p>
                <div className="mt-6 space-y-4">
                  {[
                    'See the monthly lens before ruling a project out',
                    'Understand open-loan flexibility beyond the headline payment',
                    'Compare financing fit before finalizing scope or budget',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 w-5 h-5 shrink-0 text-blue-200" />
                      <p className="text-sm leading-7 text-slate-200">{item}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-6 text-sm leading-7 text-slate-300">
                  This is the easiest way to understand whether financing changes
                  what feels realistic for your renovation.
                </p>
              </div>
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
            <p className="mt-4 text-base text-slate-600">
              If you are planning in Hamilton, start with our{' '}
              <Link
                to="/basement-renovation-cost-hamilton"
                className="font-semibold underline underline-offset-4"
              >
                basement renovation cost in Hamilton
              </Link>{' '}
              guide for a faster pricing reality check.
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

      <div className="hidden md:block">
        <CitySelectorSection />
      </div>

      {/* Lead Capture Block */}
      <section
        id="cost-guide"
        className="relative overflow-visible xl:overflow-hidden bg-[#1F477F] py-24 xl:py-28 text-white"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_50%,rgba(96,165,250,0.16),transparent_22%),radial-gradient(circle_at_52%_48%,rgba(96,165,250,0.14),transparent_26%),radial-gradient(circle_at_86%_50%,rgba(59,130,246,0.16),transparent_20%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.02),rgba(255,255,255,0)_20%,rgba(255,255,255,0)_80%,rgba(255,255,255,0.02))]" />

        <div className="relative z-10 max-w-[1800px] mx-auto px-6 lg:px-10 xl:px-14">
          {!isDesktopGuideLayout ? (
          <div className="flex flex-col items-center text-center gap-8">
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
                    <label className="block text-sm font-semibold tracking-[-0.012em] text-slate-700 mb-1.5">
                      First Name
                    </label>
                    <input
                      name="name"
                      type="text"
                      required
                      autoComplete="given-name"
                      value={guideForm.name}
                      onChange={handleGuideChange}
                      className="w-full rounded-[0.78rem] border border-slate-300/85 bg-[linear-gradient(180deg,#fcfdff_0%,#f8fafc_100%)] px-4 py-[0.92rem] text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.96),0_1px_2px_rgba(15,23,42,0.03),0_8px_18px_rgba(15,23,42,0.04)] outline-none transition duration-200 placeholder:text-slate-400 focus:border-[#2b5a96] focus:bg-white focus:ring-4 focus:ring-blue-100/80"
                      placeholder="John"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold tracking-[-0.012em] text-slate-700 mb-1.5">
                      Email Address
                    </label>
                    <input
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={guideForm.email}
                      onChange={handleGuideChange}
                      className="w-full rounded-[0.78rem] border border-slate-300/85 bg-[linear-gradient(180deg,#fcfdff_0%,#f8fafc_100%)] px-4 py-[0.92rem] text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.96),0_1px_2px_rgba(15,23,42,0.03),0_8px_18px_rgba(15,23,42,0.04)] outline-none transition duration-200 placeholder:text-slate-400 focus:border-[#2b5a96] focus:bg-white focus:ring-4 focus:ring-blue-100/80"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold tracking-[-0.012em] text-slate-700 mb-1.5">
                      Phone Number
                    </label>
                    <input
                      name="phone"
                      type="tel"
                      required
                      autoComplete="tel"
                      value={guideForm.phone}
                      onChange={handleGuideChange}
                      className="w-full rounded-[0.78rem] border border-slate-300/85 bg-[linear-gradient(180deg,#fcfdff_0%,#f8fafc_100%)] px-4 py-[0.92rem] text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.96),0_1px_2px_rgba(15,23,42,0.03),0_8px_18px_rgba(15,23,42,0.04)] outline-none transition duration-200 placeholder:text-slate-400 focus:border-[#2b5a96] focus:bg-white focus:ring-4 focus:ring-blue-100/80"
                      placeholder="(416) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold tracking-[-0.012em] text-slate-700 mb-1.5">
                      Project Address
                    </label>
                    <input
                      name="address"
                      type="text"
                      required
                      autoComplete="street-address"
                      value={guideForm.address}
                      onChange={handleGuideChange}
                      className="w-full rounded-[0.78rem] border border-slate-300/85 bg-[linear-gradient(180deg,#fcfdff_0%,#f8fafc_100%)] px-4 py-[0.92rem] text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.96),0_1px_2px_rgba(15,23,42,0.03),0_8px_18px_rgba(15,23,42,0.04)] outline-none transition duration-200 placeholder:text-slate-400 focus:border-[#2b5a96] focus:bg-white focus:ring-4 focus:ring-blue-100/80"
                      placeholder="123 Main St, Hamilton"
                    />
                  </div>

                  <input
                    type="text"
                    name="companyWebsite"
                    value={guideForm.companyWebsite}
                    onChange={handleGuideChange}
                    tabIndex={-1}
                    autoComplete="off"
                    className="hidden"
                    aria-hidden="true"
                  />

                  <div
                    ref={mobileTurnstileRef}
                    className="flex justify-center"
                  />

                  <button
                    type="submit"
                    disabled={guideSubmitting || !turnstileToken}
                    className="w-full mt-2 rounded-[0.8rem] border border-slate-800 bg-[linear-gradient(180deg,#1f2937_0%,#0f172a_100%)] py-[0.95rem] text-white font-semibold tracking-[-0.015em] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(15,23,42,0.05),0_14px_30px_rgba(15,23,42,0.18)] transition duration-200 hover:border-slate-700 hover:bg-[linear-gradient(180deg,#273244_0%,#111c31_100%)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_1px_2px_rgba(15,23,42,0.06),0_18px_36px_rgba(15,23,42,0.22)] active:bg-[linear-gradient(180deg,#111827_0%,#020617_100%)] active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-70"
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

                  {!turnstileToken && (
                    <p className="text-xs text-center text-slate-500">
                      {turnstileStatus === 'expired' || turnstileStatus === 'error'
                        ? 'Verification needs to be completed again before you can download the guide.'
                        : 'Complete the verification above to download the guide.'}
                    </p>
                  )}

                  {(turnstileStatus === 'expired' || turnstileStatus === 'error') && (
                    <button
                      type="button"
                      onClick={resetTurnstile}
                      className="w-full rounded-[0.74rem] border border-slate-300 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-4 py-[0.78rem] text-sm font-semibold tracking-[-0.015em] text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.96),0_1px_2px_rgba(15,23,42,0.03),0_10px_22px_rgba(15,23,42,0.05)] transition duration-200 hover:border-slate-400 hover:bg-[linear-gradient(180deg,#ffffff_0%,#f1f5f9_100%)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.98),0_1px_2px_rgba(15,23,42,0.04),0_14px_26px_rgba(15,23,42,0.06)] active:bg-slate-100 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                    >
                      Retry Verification
                    </button>
                  )}

                  <p className="text-xs text-slate-400 text-center pt-2">
                    Your information is used to send the guide and support your project planning. Unsubscribe anytime.
                  </p>
                </form>
              </div>
            </div>
          </div>
          ) : (
          <div
            className="grid items-center justify-center"
            style={{
              gridTemplateColumns: '980px 430px',
              columnGap: '40px',
            }}
          >
            <div
              className="grid items-center"
              style={{
                gridTemplateColumns: '340px minmax(560px, 760px)',
                columnGap: '52px',
              }}
            >
              <div className="flex justify-center">
                <img
                  src="/ontario-reno-cost-guide-3d-preview.png"
                  alt="2026 Ontario Renovation Cost Guide booklet preview"
                  className="w-[300px] 2xl:w-[340px] h-auto object-contain drop-shadow-[0_42px_84px_rgba(0,0,0,0.40)]"
                  loading="lazy"
                />
              </div>

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

            <div className="w-full max-w-[430px] justify-self-end">
              <div className="rounded-[24px] bg-white text-slate-900 shadow-[0_24px_70px_rgba(0,0,0,0.22)] p-9">
                <h3 className="text-[1.9rem] leading-tight font-bold">Get Instant Access</h3>
                <p className="mt-2 text-[15px] text-slate-500">
                  Join 15,000+ Ontario homeowners planning smarter.
                </p>

                <form className="mt-7 space-y-4" onSubmit={handleGuideSubmit}>
                  <div>
                    <label className="block text-sm font-semibold tracking-[-0.012em] text-slate-700 mb-1.5">
                      First Name
                    </label>
                    <input
                      name="name"
                      type="text"
                      required
                      autoComplete="given-name"
                      value={guideForm.name}
                      onChange={handleGuideChange}
                      className="w-full rounded-[0.78rem] border border-slate-300/85 bg-[linear-gradient(180deg,#fcfdff_0%,#f8fafc_100%)] px-4 py-[0.92rem] text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.96),0_1px_2px_rgba(15,23,42,0.03),0_8px_18px_rgba(15,23,42,0.04)] outline-none transition duration-200 placeholder:text-slate-400 focus:border-[#2b5a96] focus:bg-white focus:ring-4 focus:ring-blue-100/80"
                      placeholder="John"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold tracking-[-0.012em] text-slate-700 mb-1.5">
                      Email Address
                    </label>
                    <input
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={guideForm.email}
                      onChange={handleGuideChange}
                      className="w-full rounded-[0.78rem] border border-slate-300/85 bg-[linear-gradient(180deg,#fcfdff_0%,#f8fafc_100%)] px-4 py-[0.92rem] text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.96),0_1px_2px_rgba(15,23,42,0.03),0_8px_18px_rgba(15,23,42,0.04)] outline-none transition duration-200 placeholder:text-slate-400 focus:border-[#2b5a96] focus:bg-white focus:ring-4 focus:ring-blue-100/80"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold tracking-[-0.012em] text-slate-700 mb-1.5">
                      Phone Number
                    </label>
                    <input
                      name="phone"
                      type="tel"
                      required
                      autoComplete="tel"
                      value={guideForm.phone}
                      onChange={handleGuideChange}
                      className="w-full rounded-[0.78rem] border border-slate-300/85 bg-[linear-gradient(180deg,#fcfdff_0%,#f8fafc_100%)] px-4 py-[0.92rem] text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.96),0_1px_2px_rgba(15,23,42,0.03),0_8px_18px_rgba(15,23,42,0.04)] outline-none transition duration-200 placeholder:text-slate-400 focus:border-[#2b5a96] focus:bg-white focus:ring-4 focus:ring-blue-100/80"
                      placeholder="(416) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold tracking-[-0.012em] text-slate-700 mb-1.5">
                      Project Address
                    </label>
                    <input
                      name="address"
                      type="text"
                      required
                      autoComplete="street-address"
                      value={guideForm.address}
                      onChange={handleGuideChange}
                      className="w-full rounded-[0.78rem] border border-slate-300/85 bg-[linear-gradient(180deg,#fcfdff_0%,#f8fafc_100%)] px-4 py-[0.92rem] text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.96),0_1px_2px_rgba(15,23,42,0.03),0_8px_18px_rgba(15,23,42,0.04)] outline-none transition duration-200 placeholder:text-slate-400 focus:border-[#2b5a96] focus:bg-white focus:ring-4 focus:ring-blue-100/80"
                      placeholder="123 Main St, Hamilton"
                    />
                  </div>

                  <input
                    type="text"
                    name="companyWebsite"
                    value={guideForm.companyWebsite}
                    onChange={handleGuideChange}
                    tabIndex={-1}
                    autoComplete="off"
                    className="hidden"
                    aria-hidden="true"
                  />

                  <div ref={desktopTurnstileRef} className="flex justify-center" />

                  <button
                    type="submit"
                    disabled={guideSubmitting || !turnstileToken}
                    className="w-full mt-2 rounded-[0.8rem] border border-slate-800 bg-[linear-gradient(180deg,#1f2937_0%,#0f172a_100%)] py-[0.95rem] text-white font-semibold tracking-[-0.015em] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(15,23,42,0.05),0_14px_30px_rgba(15,23,42,0.18)] transition duration-200 hover:border-slate-700 hover:bg-[linear-gradient(180deg,#273244_0%,#111c31_100%)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_1px_2px_rgba(15,23,42,0.06),0_18px_36px_rgba(15,23,42,0.22)] active:bg-[linear-gradient(180deg,#111827_0%,#020617_100%)] active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-70"
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

                  {!turnstileToken && (
                    <p className="text-xs text-center text-slate-500">
                      {turnstileStatus === 'expired' || turnstileStatus === 'error'
                        ? 'Verification needs to be completed again before you can download the guide.'
                        : 'Complete the verification above to download the guide.'}
                    </p>
                  )}

                  {(turnstileStatus === 'expired' || turnstileStatus === 'error') && (
                    <button
                      type="button"
                      onClick={resetTurnstile}
                      className="w-full rounded-[0.74rem] border border-slate-300 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-4 py-[0.78rem] text-sm font-semibold tracking-[-0.015em] text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.96),0_1px_2px_rgba(15,23,42,0.03),0_10px_22px_rgba(15,23,42,0.05)] transition duration-200 hover:border-slate-400 hover:bg-[linear-gradient(180deg,#ffffff_0%,#f1f5f9_100%)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.98),0_1px_2px_rgba(15,23,42,0.04),0_14px_26px_rgba(15,23,42,0.06)] active:bg-slate-100 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                    >
                      Retry Verification
                    </button>
                  )}

                  <p className="text-xs text-slate-400 text-center pt-2">
                    Your information is used to send the guide and support your project planning. Unsubscribe anytime.
                  </p>
                </form>
              </div>
            </div>
          </div>
          )}
        </div>
      </section>

      {/* Project Review CTA */}
      <section className="bg-slate-900 py-20 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-16 h-16 bg-[#1B3C6C]/24 rounded-full flex items-center justify-center mb-7 mx-auto">
              <Hammer className="w-8 h-8 text-[#7FB0E0]" />
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-[-0.04em]">Ready to start your project?</h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
              Start with a clear project review built around scope, budget, and real track record. No random referrals, and no marketplace-style noise.
            </p>
            <div className="flex flex-col items-center gap-4">
              <Link
                to="/match"
                className={buttonStyles.primary}
              >
                Start Project Review
              </Link>
              <p className="text-sm text-slate-400">100% free for homeowners. No obligation to hire.</p>
            </div>
          </div>
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
                a: "Our project review process is 100% free for homeowners. We may earn a referral fee from contractors in our network, but our positioning is based on project fit, not random placement or homeowner-facing bias."
              },
              {
                q: "How does the project review process work?",
                a: "We look at project scope, budget fit, location, and contractor track record. The goal is not to flood you with options. It is to help point you toward the next step that makes the most sense for your specific project."
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


