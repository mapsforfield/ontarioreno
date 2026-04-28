import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calculator,
  ArrowRight,
  CreditCard,
  Info,
  Home,
  ShieldCheck,
  PaintBucket,
  Bath,
  Landmark,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { buttonStyles } from '../lib/uiStyles';
import { cn } from '../lib/utils';

export default function Costs() {
  const [revealPosition, setRevealPosition] = useState(58);

  const updateRevealPosition = (clientX: number, element: HTMLDivElement) => {
    const bounds = element.getBoundingClientRect();
    const rawPercent = ((clientX - bounds.left) / bounds.width) * 100;
    const clampedPercent = Math.min(92, Math.max(8, rawPercent));
    setRevealPosition(clampedPercent);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const container = event.currentTarget;
    container.setPointerCapture(event.pointerId);
    updateRevealPosition(event.clientX, container);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.buttons & 1) !== 1 && event.pointerType !== 'touch') return;
    updateRevealPosition(event.clientX, event.currentTarget);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-10 md:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="mx-auto mb-16 max-w-[1320px] overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="md:hidden">
            <div className="select-none px-5 pb-3 pt-5 text-slate-900">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700">
                <Calculator className="h-4 w-4" />
                2026 Ontario Pricing
              </div>

              <h1 className="mt-4 max-w-[12ch] text-[2.35rem] font-bold leading-[0.96] tracking-[-0.04em] text-slate-950">
                Ontario Renovation Cost Guides
              </h1>

              <p className="mt-4 max-w-sm text-[15px] leading-7 text-slate-600">
                Real price ranges based on actual Ontario projects so you can
                set better expectations before speaking with a contractor.
              </p>

              <div className="mt-7 flex flex-col gap-3">
                <Link to="/match" className={cn(buttonStyles.primary, 'w-full justify-center')}>
                  Start Project Review
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  to="/costs#cost-breakdown"
                  className={cn(buttonStyles.secondary, 'w-full justify-center')}
                >
                  See Cost Breakdown
                </Link>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-2 text-[11px] font-medium text-slate-600 sm:gap-2.5 sm:text-[12px]">
                <div className="flex min-w-0 items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-slate-400" />
                  Ontario-based cost ranges
                </div>
                <div className="flex min-w-0 items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-slate-400" />
                  Permit &amp; scope-aware pricing
                </div>
                <div className="flex min-w-0 items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-slate-400" />
                  Built from real project data
                </div>
              </div>
            </div>

            <div className="px-4 pb-4 pt-3">
              <div
                className="relative h-[292px] select-none overflow-hidden rounded-xl border border-slate-200 bg-slate-100 touch-none"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
              >
                <div className="absolute inset-0">
                  <img
                    src="/images/before-image-hero.jpg"
                    alt="Before basement renovation"
                    className="h-full w-full object-cover"
                  />
                </div>

                <div
                  className="absolute inset-0"
                  style={{
                    clipPath: `inset(0 0 0 ${revealPosition}%)`,
                  }}
                >
                  <img
                    src="/images/after-image-hero.jpg"
                    alt="Finished legal basement apartment"
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/20 to-transparent" />

                <div className="pointer-events-none absolute left-3 top-3 z-20 rounded-full border border-white/70 bg-white/88 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600 backdrop-blur-sm">
                  Drag to compare
                </div>

                <div
                  className="absolute inset-y-0 z-20"
                  style={{ left: `${revealPosition}%`, transform: 'translateX(-50%)' }}
                >
                  <div className="relative h-full w-px bg-white/85 shadow-[0_0_24px_rgba(255,255,255,0.18)]" />
                  <div className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 select-none items-center justify-center rounded-full border border-white/85 bg-white/96 text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.16)] cursor-ew-resize">
                    <ChevronLeft className="h-2.5 w-2.5" />
                    <ChevronRight className="h-2.5 w-2.5" />
                  </div>
                </div>

                <div className="pointer-events-none absolute bottom-3 right-3 z-20 rounded-full border border-white/70 bg-white/85 px-3 py-1.5 text-right shadow-[0_10px_24px_rgba(15,23,42,0.10)] backdrop-blur-sm">
                  <p className="text-[12px] font-medium tracking-[0.02em] text-slate-700">
                    Typical Finished Result
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div
            className="relative hidden min-h-[560px] select-none overflow-hidden touch-none md:block"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
          >
            <div className="absolute inset-0">
              <img
                src="/images/before-image-hero.jpg"
                alt="Before basement renovation"
                className="h-full w-full object-cover"
              />
            </div>

            <div
              className="absolute inset-0"
              style={{
                clipPath: `inset(0 0 0 ${revealPosition}%)`,
              }}
            >
              <img
                src="/images/after-image-hero.jpg"
                alt="Finished legal basement apartment"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-transparent" />

            <div
              className="absolute inset-y-0 z-20"
              style={{ left: `${revealPosition}%`, transform: 'translateX(-50%)' }}
            >
              <div className="relative h-full w-px bg-white/80 shadow-[0_0_24px_rgba(255,255,255,0.18)]" />
              <div className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 select-none items-center justify-center rounded-full border border-white/85 bg-white/96 text-slate-700 shadow-[0_12px_28px_rgba(15,23,42,0.18)] cursor-ew-resize">
                <ChevronLeft className="h-4 w-4" />
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>

            <div className="absolute inset-0 z-30 flex items-center p-10 lg:p-12">
              <div className="flex h-full max-w-xl flex-col pb-16 text-white">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-blue-100 backdrop-blur-sm">
                  <Calculator className="h-4 w-4" />
                  2026 Ontario Pricing
                </div>

                <h1 className="mt-6 max-w-lg text-5xl font-bold leading-[1.02] tracking-[-0.04em] lg:text-6xl">
                  Ontario Renovation Cost Guides
                </h1>

                <p className="mt-6 max-w-lg text-xl leading-8 text-slate-200">
                  Real price ranges based on actual Ontario projects so you
                  can set better expectations before speaking with a
                  contractor.
                </p>

                <div className="mt-10 flex flex-row gap-4">
                  <Link to="/match" className={buttonStyles.primary}>
                    Start Project Review
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link
                    to="/costs#cost-breakdown"
                    className={buttonStyles.ghostDark}
                  >
                    See Cost Breakdown
                  </Link>
                </div>

                <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-3 pt-10 text-[13px] font-medium text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-slate-400" />
                    Ontario-based cost ranges
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-slate-400" />
                    Permit &amp; scope-aware pricing
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-slate-400" />
                    Built from real project data
                  </div>
                </div>
              </div>
            </div>

            <div className="pointer-events-none absolute bottom-6 right-6 z-20 rounded-full border border-white/70 bg-white/90 px-4 py-2.5 text-right shadow-[0_10px_24px_rgba(15,23,42,0.10)] backdrop-blur-sm">
              <p className="text-sm font-medium tracking-[0.02em] text-slate-700">
                Typical Finished Result
              </p>
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-10 flex gap-4 items-start max-w-5xl mx-auto">
          <Info className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
          <p className="text-sm text-blue-900 leading-relaxed">
            <strong>Disclaimer:</strong> These ranges are meant to help Ontario
            homeowners plan more realistically. Final costs can vary based on
            material choices, structural issues, scope changes, municipality,
            hidden site conditions, and how detailed the quote actually is.
          </p>
        </div>

        {/* Hamilton Incentive Strip */}
        <div className="max-w-5xl mx-auto mb-14">
          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 px-6 py-5 md:px-8 md:py-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-yellow-800">
                  <Landmark className="w-4 h-4" />
                  Hamilton Basement Incentive
                </div>
                <p className="mt-2 text-sm leading-7 text-slate-700 md:text-base">
                  Hamilton homeowners may qualify for up to <strong>$40,000</strong>{' '}
                  toward a legal basement apartment or secondary suite, depending
                  on project eligibility and approval.
                </p>
              </div>

              <Link
                to="/hamilton-basement-grant"
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                See Hamilton Grant
              </Link>
            </div>
          </div>
        </div>

        {/* Pricing Grid */}
        <div id="cost-breakdown" className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto scroll-mt-28">
          {/* Card 1 */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-8">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-5">
                <Home className="w-6 h-6" />
              </div>

              <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">
                Basement Finishing
              </div>

              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                Basement (Personal Use)
              </h2>

              <div className="text-4xl font-bold text-blue-600 mb-5">
                $45K - $85K+
              </div>

              <p className="text-slate-600 text-sm leading-7 mb-6">
                Most projects fall between <strong>$50K - $70K</strong>,
                depending on size, layout, and finish level.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Typical use</span>
                  <span className="font-semibold text-slate-900">
                    Personal living space
                  </span>
                </div>
                <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Permit impact</span>
                  <span className="font-semibold text-slate-900">
                    Varies by scope
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Timeline</span>
                  <span className="font-semibold text-slate-900">
                    4-6 Weeks
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Link
                  to="/basements"
                  className="block w-full text-center border border-slate-300 hover:bg-slate-50 text-slate-900 font-semibold py-3 rounded-xl transition-colors"
                >
                  Read Basement Guide
                </Link>
                <Link
                  to="/match"
                  className="block w-full text-center bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  Get Quotes for Your Basement
                </Link>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl shadow-xl border border-[#1B3C6C] overflow-hidden relative">
            <div className="absolute top-0 right-0 bg-[#1B3C6C] text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
              Most Popular
            </div>

            <div className="p-8">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1B3C6C] flex items-center justify-center mb-5">
                <ShieldCheck className="w-6 h-6" />
              </div>

              <div className="text-sm font-bold text-[#1B3C6C] uppercase tracking-wider mb-2">
                Legal Secondary Suite
              </div>

              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                Legal Basement Apartment
              </h2>

              <div className="text-4xl font-bold text-slate-900 mb-5">
                $60K - $140K+
              </div>

              <p className="text-slate-600 text-sm leading-7 mb-6">
                Most projects fall between <strong>$70K - $110K</strong>,
                depending on entrance work, permits, and code-compliant scope.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Permits &amp; Drawings</span>
                  <span className="font-semibold text-slate-900">
                    ~$3,000 - $5,000+
                  </span>
                </div>
                <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Typical use</span>
                  <span className="font-semibold text-slate-900">
                    Income-generating unit
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Timeline</span>
                  <span className="font-semibold text-slate-900">
                    8-12 Weeks
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Link
                  to="/legal-suites"
                  className="block w-full text-center border border-slate-300 hover:bg-slate-50 text-slate-900 font-semibold py-3 rounded-xl transition-colors"
                >
                  Read Legal Suite Guide
                </Link>
                <Link
                  to="/match"
                  className="block w-full text-center bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  Get Quotes for a Legal Suite
                </Link>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-8">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-5">
                <PaintBucket className="w-6 h-6" />
              </div>

              <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">
                Kitchen Renovation
              </div>

              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                Full Kitchen Renovation
              </h2>

              <div className="text-4xl font-bold text-blue-600 mb-5">
                $30K - $75K+
              </div>

              <p className="text-slate-600 text-sm leading-7 mb-6">
                Most projects fall between <strong>$35K - $55K</strong>,
                depending on cabinetry, countertops, appliances, and layout
                complexity.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Design / planning</span>
                  <span className="font-semibold text-slate-900">
                    Varies by scope
                  </span>
                </div>
                <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Common trigger</span>
                  <span className="font-semibold text-slate-900">
                    Cabinets + layout
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Timeline</span>
                  <span className="font-semibold text-slate-900">
                    3-6 Weeks
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Link
                  to="/kitchen-renovations"
                  className="block w-full text-center border border-slate-300 hover:bg-slate-50 text-slate-900 font-semibold py-3 rounded-xl transition-colors"
                >
                  Read Kitchen Guide
                </Link>
                <Link
                  to="/match"
                  className="block w-full text-center bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  Get Quotes for Your Kitchen
                </Link>
              </div>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-8">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-5">
                <Bath className="w-6 h-6" />
              </div>

              <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">
                Bathroom Renovation
              </div>

              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                Full Bathroom Renovation
              </h2>

              <div className="text-4xl font-bold text-blue-600 mb-5">
                $15K - $40K+
              </div>

              <p className="text-slate-600 text-sm leading-7 mb-6">
                Most projects fall between <strong>$20K - $30K</strong>,
                depending on waterproofing, tile, fixtures, and layout changes.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Waterproofing</span>
                  <span className="font-semibold text-slate-900">
                    Major cost driver
                  </span>
                </div>
                <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Typical scope</span>
                  <span className="font-semibold text-slate-900">
                    Full gut + rebuild
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Timeline</span>
                  <span className="font-semibold text-slate-900">
                    2-4 Weeks
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Link
                  to="/bathroom-renovations"
                  className="block w-full text-center border border-slate-300 hover:bg-slate-50 text-slate-900 font-semibold py-3 rounded-xl transition-colors"
                >
                  Read Bathroom Guide
                </Link>
                <Link
                  to="/match"
                  className="block w-full text-center bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  Get Quotes for Your Bathroom
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Notes */}
        <div className="max-w-5xl mx-auto mt-16">
          <div className="rounded-2xl border border-slate-200 bg-white p-8">
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <div className="flex items-center gap-2 text-slate-900 font-semibold mb-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  Prices vary for a reason
                </div>
                <p className="text-sm leading-7 text-slate-600">
                  Layout changes, finish level, hidden site conditions, and
                  permit requirements can move pricing much more than most
                  homeowners expect.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-slate-900 font-semibold mb-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  Lower quotes can mislead
                </div>
                <p className="text-sm leading-7 text-slate-600">
                  Some quotes leave out critical components like demo, disposal,
                  electrical changes, waterproofing, finish details, or permit
                  scope.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-slate-900 font-semibold mb-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  Use guides before quotes
                </div>
                <p className="text-sm leading-7 text-slate-600">
                  These ranges are meant to help you anchor your expectations
                  before you start comparing contractors or narrowing scope.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto mt-10">
          <div className="rounded-2xl border border-blue-200 bg-blue-50 px-6 py-6 md:px-8 md:py-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#1B3C6C]">
                  <CreditCard className="w-4 h-4" />
                  Financing Options
                </div>
                <h2 className="mt-3 text-2xl font-bold text-slate-900 md:text-3xl">
                  Cost is one number. Monthly fit is another.
                </h2>
                <p className="mt-4 text-base leading-7 text-slate-700">
                  If the project range feels bigger than expected, it may help
                  to compare what basement, kitchen, bathroom, or legal-suite
                  work could look like as a monthly payment instead of judging
                  the full sticker price alone.
                </p>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  Explore the{' '}
                  <Link
                    to="/financing"
                    className="font-semibold text-slate-900 underline underline-offset-4"
                  >
                    Ontario renovation financing page
                  </Link>{' '}
                  for payment examples, then go deeper into the{' '}
                  <Link
                    to="/open-loan-financing"
                    className="font-semibold text-slate-900 underline underline-offset-4"
                  >
                    open loan financing guide
                  </Link>{' '}
                  if you want to understand flexibility and payoff strategy.
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 md:w-auto md:min-w-[240px]">
                <Link
                  to="/financing"
                  className={cn(buttonStyles.primary, 'w-full justify-center')}
                >
                  See Financing Options
                </Link>
                <Link
                  to="/open-loan-financing"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                >
                  Open Loan Guide
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="max-w-4xl mx-auto mt-14 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Want pricing based on your actual project?
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Tell us what you're building and we'll help you understand your
            next steps and move forward with the right renovation path for your
            scope, budget, and renovation type.
          </p>

          <Link
            to="/match"
            className="inline-flex items-center justify-center bg-[#1B3C6C] hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all"
          >
            Start Project Review <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </div>
    </div>
  );
}
