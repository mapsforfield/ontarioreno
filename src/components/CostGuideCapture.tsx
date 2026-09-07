import { useEffect, useRef, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

/**
 * The 2026 Ontario Renovation Cost Guide lead magnet.
 *
 * EXTRACTED FROM Home.tsx, NOT COPIED, and that distinction is the point. It
 * owns a Cloudflare Turnstile widget lifecycle, two responsive layouts, a
 * honeypot and minimum-fill-time check, and the POST to the guide endpoint. A
 * second copy of all that would drift, and the half that drifted would be a
 * silently broken lead capture — the worst kind of broken, because the page
 * still looks completely fine.
 *
 * WHY IT IS ALSO ON /costs. That page is the entire reason someone would want
 * this PDF and it never mentioned it. A visitor reading cost tables is the most
 * qualified person on the site for a cost guide, and was the only one never
 * offered it.
 *
 * ONE PER PAGE. Turnstile renders into whichever layout is active, tracked by
 * its own ref and widget id and torn down on unmount. Do not mount two of these
 * on one page — the second would fight the first for the widget.
 *
 * The section keeps id="cost-guide" so existing #cost-guide links still land.
 */
const GUIDE_PDF_URL = '/guides/ontario-renovation-cost-guide-2026.pdf';
const GUIDE_MIN_FILL_TIME_MS = 4000;
const TURNSTILE_SITE_KEY = '0x4AAAAAAC1T5itPPClMtbD6';
const GUIDE_ENDPOINT =
  'https://script.google.com/macros/s/AKfycbx01lpcatHsLZzoS_anmr1NhnxV_3D9bgnh0MYmIMpBpbqWYot4rfpGDthUEyqZXRei/exec';

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

export function CostGuideCapture() {
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

      if (activeRef && !activeWidgetIdRef.current) {
        activeWidgetIdRef.current = turnstile.render(activeRef, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (token: string) => {
            setTurnstileToken(token);
            setTurnstileStatus('verified');
          },
          'expired-callback': () => {
            setTurnstileToken('');
            setTurnstileStatus('expired');
          },
          'error-callback': () => {
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

  const resetTurnstile = () => {
    if (!window.turnstile) return;

    const activeWidgetId = isDesktopGuideLayout
      ? desktopTurnstileWidgetId.current
      : mobileTurnstileWidgetId.current;

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

  const handleGuideChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setGuideForm((prev) => ({
      ...prev,
      [name]: name === 'phone' ? formatPhoneInput(value) : value,
    }));
  };

  const handleGuideSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

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
      setGuideStatus({
        type: 'error',
        message: 'Something went wrong. Please try again.',
      });
    } finally {
      setGuideSubmitting(false);
    }
  };

  return (
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
  );
}
