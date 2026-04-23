import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  CalendarDays,
  CircleDollarSign,
  FileCheck,
  Percent,
  PiggyBank,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  calculateFinancedAmountWithHST,
  calculateMonthlyPayment,
  formatCurrency,
  formatDuration,
  generateAmortizationSchedule,
} from '../lib/openLoanCalculator';

type FaqItem = {
  question: string;
  answer: string;
};

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-3xl">
      {eyebrow && (
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-slate-900 md:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-lg leading-8 text-slate-600">{description}</p>
      )}
    </div>
  );
}

export default function OpenLoanFinancing() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [renovationCost, setRenovationCost] = useState(85000);
  const [amortizationMonths, setAmortizationMonths] = useState<
    120 | 180 | 240
  >(240);
  const [targetPayoffMonths, setTargetPayoffMonths] = useState<24 | 36 | 60>(
    24
  );
  const [showSetupDetails, setShowSetupDetails] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showExitPlanner, setShowExitPlanner] = useState(false);

  const trustPoints = [
    {
      title: 'No prepayment penalties',
      body: 'Pay it down early if you want.',
      icon: ShieldCheck,
    },
    {
      title: 'Monthly-first setup',
      body: 'Built around a manageable payment.',
      icon: CreditCard,
    },
    {
      title: '60-month promo term',
      body: 'This is the most common structure we show.',
      icon: CalendarDays,
    },
    {
      title: 'Maximum amortization',
      body: 'Often used to keep the required monthly lower.',
      icon: Percent,
    },
    {
      title: 'O.A.C.',
      body: 'Final approval still depends on profile and lender.',
      icon: FileCheck,
    },
    {
      title: 'Finance incl. HST',
      body: 'The calculator reflects the full project amount.',
      icon: CircleDollarSign,
    },
  ];

  const heroBullets = [
    'Finish the basement now instead of waiting years to save the full amount',
    'Turn a large renovation cost into a more manageable monthly payment',
    'Protect savings while still moving forward on the project',
  ];

  const howItWorksSteps = [
    {
      title: 'Choose your renovation budget',
      body: 'Start with the full basement project number, including 13% HST, so the payment conversation reflects reality.',
    },
    {
      title: 'Estimate the monthly properly',
      body: 'Look at the real financed amount including HST, then structure the payment around the promo program and amortization period.',
    },
    {
      title: 'Choose the promo program',
      body: 'Most files are shown at 9.99%, 8.99%, or 7.99% depending on the borrower and how aggressively we want to support the monthly.',
    },
    {
      title: 'Maximize amortization if needed',
      body: 'A longer amortization period usually lowers the required monthly payment, which is why many real files are shown at the maximum.',
    },
    {
      title: 'Complete the renovation',
      body: 'Use financing to move forward now so the basement starts adding value and utility sooner, not years later.',
    },
    {
      title: 'Pay normally or exit early',
      body: 'That is the core benefit of an open loan: you can make the required payment now and still clear it early without a prepayment penalty.',
    },
  ];

  const useCases = [
    {
      title: 'Get the basement done now',
      body: 'Many homeowners finance because they want the finished space now, not after years of trying to save the full amount in cash.',
      icon: Wallet,
    },
    {
      title: 'Preserve savings',
      body: 'Financing can protect emergency reserves and day-to-day liquidity instead of draining cash all at once for a basement project.',
      icon: TrendingUp,
    },
    {
      title: 'Unlock rental potential',
      body: 'For some homeowners, a legal or rental-oriented basement creates income potential that would otherwise be delayed by waiting.',
      icon: ShieldCheck,
    },
    {
      title: 'Keep your exit flexible',
      body: 'An open structure gives you breathing room now while keeping a refinance, bonus payment, or early payoff strategy on the table later.',
      icon: PiggyBank,
    },
  ];

  const faqs: FaqItem[] = [
    {
      question: 'What is an open loan?',
      answer:
        'An open loan is a financing structure that lets you make the required monthly payment while still keeping the option to pay down extra principal or clear the balance early without a prepayment penalty.',
    },
    {
      question: 'Can I pay off the loan early?',
      answer:
        'Yes. That is one of the main advantages. The flexibility to exit early is what makes open-loan financing attractive for homeowners with a payoff plan.',
    },
    {
      question: 'Does extra payment reduce interest?',
      answer:
        'Yes. In general, reducing principal earlier means less interest accumulates over time. The real value often comes from shortening the time the balance is carried.',
    },
    {
      question: 'Can I finance the full renovation cost including HST?',
      answer:
        'In many cases, yes. Homeowners should think in terms of the full financed amount, not just the contractor subtotal, because 13% HST materially affects the payment conversation.',
    },
    {
      question: 'What happens with a 3- or 6-month deferral?',
      answer:
        'Deferrals are not usually the main way we structure these files. Most of the time, the focus is a monthly payment using a 60-month promo term and maximum amortization.',
    },
    {
      question: 'Are rates guaranteed?',
      answer:
        'No. Rates, terms, and APRs depend on the borrower profile, lender approval, and which contractor-supported buy-down option we choose to use. The lower promo rates are not the default in every file.',
    },
  ];

  const commonSetupRate = 0.0999;
  const financedAmount = useMemo(
    () => calculateFinancedAmountWithHST(renovationCost),
    [renovationCost]
  );
  const depositAmount = useMemo(
    () => Math.round(financedAmount * 0.2),
    [financedAmount]
  );
  const effectivePrincipal = financedAmount;
  const baseMonthlyPayment = useMemo(
    () =>
      calculateMonthlyPayment(
        effectivePrincipal,
        commonSetupRate,
        amortizationMonths
      ),
    [amortizationMonths, effectivePrincipal]
  );
  const dailyEquivalent = Math.round(baseMonthlyPayment / 30);
  const heroExampleMonthlyPayment = 592;
  const heroExampleDailyEquivalent = Math.round(heroExampleMonthlyPayment / 30);
  const financeBarWidth = Math.min(
    Math.max((baseMonthlyPayment / financedAmount) * 100, 8),
    24
  );
  const baseScheduleSummary = useMemo(
    () =>
      generateAmortizationSchedule({
        strategy: 'slow',
        principal: effectivePrincipal,
        annualRate: commonSetupRate,
        termYears: amortizationMonths / 12,
        deferralMonths: 0,
        baseMonthlyPayment,
      }),
    [amortizationMonths, baseMonthlyPayment, effectivePrincipal]
  );
  const exitStrategy = useMemo(() => {
    const termYears = amortizationMonths / 12;
    let low = 0;
    let high = financedAmount;
    let requiredExtra = 0;

    for (let i = 0; i < 40; i += 1) {
      const candidate = (low + high) / 2;
      const summary = generateAmortizationSchedule({
        strategy: 'slow',
        principal: effectivePrincipal,
        annualRate: commonSetupRate,
        termYears,
        deferralMonths: 0,
        baseMonthlyPayment: baseMonthlyPayment + candidate,
      });

      if (summary.payoffTimelineMonths <= targetPayoffMonths) {
        requiredExtra = candidate;
        high = candidate;
      } else {
        low = candidate;
      }
    }

    const roundedExtraMonthly = Math.ceil(requiredExtra / 25) * 25;
    const totalMonthly = baseMonthlyPayment + roundedExtraMonthly;
    const payoffSummary = generateAmortizationSchedule({
      strategy: 'slow',
      principal: effectivePrincipal,
      annualRate: commonSetupRate,
      termYears,
      deferralMonths: 0,
      baseMonthlyPayment: totalMonthly,
    });

    return {
      extraMonthly: roundedExtraMonthly,
      totalMonthly,
      sixMonthLumpSum: roundedExtraMonthly * 6,
      payoffMonths: payoffSummary.payoffTimelineMonths,
      yearsSaved: Math.max(
        baseScheduleSummary.payoffTimelineMonths - payoffSummary.payoffTimelineMonths,
        0
      ),
      interestAvoided: Math.max(
        baseScheduleSummary.totalInterest - payoffSummary.totalInterest,
        0
      ),
    };
  }, [
    amortizationMonths,
    baseMonthlyPayment,
    baseScheduleSummary.payoffTimelineMonths,
    baseScheduleSummary.totalInterest,
    commonSetupRate,
    effectivePrincipal,
    financedAmount,
    targetPayoffMonths,
  ]);

  const handleRenovationCostInput = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const digitsOnly = e.target.value.replace(/[^\d]/g, '');
    const nextValue = digitsOnly ? Number(digitsOnly) : 0;
    const clampedValue = Math.min(Math.max(nextValue, 10000), 150000);
    setRenovationCost(clampedValue);
  };

  const lightGlassButtonBase =
    'border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.84)_0%,rgba(248,250,252,0.64)_100%)] text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.88)] ring-1 ring-white/28 backdrop-blur-xl hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(248,250,252,0.74)_100%)] hover:shadow-[0_14px_30px_rgba(15,23,42,0.07),inset_0_1px_0_rgba(255,255,255,0.92)]';
  const lightGlassButtonActive =
    'border-sky-100/80 bg-[linear-gradient(180deg,rgba(239,246,255,0.98)_0%,rgba(219,234,254,0.82)_100%)] text-slate-900 shadow-[0_16px_34px_rgba(27,60,108,0.12),inset_0_1px_0_rgba(255,255,255,0.90)] ring-1 ring-blue-200/55 backdrop-blur-xl';
  const lightMetricCard =
    'rounded-[1.7rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.86)_0%,rgba(248,250,252,0.66)_100%)] shadow-[0_16px_34px_rgba(15,23,42,0.07),inset_0_1px_0_rgba(255,255,255,0.90)] ring-1 ring-white/40 backdrop-blur-xl';

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>Open Loan Renovation Financing Ontario | OntarioReno</title>
        <meta
          name="description"
          content="Learn how open loan renovation financing works in Ontario, including monthly payment flexibility, no-prepayment-penalty benefits, and smart payoff strategies."
        />
        <link
          rel="canonical"
          href="https://ontarioreno.ca/open-loan-financing"
        />
      </Helmet>

      <section className="overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,1fr)_540px] lg:gap-14 lg:px-8 lg:py-28">
          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-[#1B3C6C]">
              <CreditCard className="h-4 w-4" />
              Ontario renovation financing guide
            </div>

            <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-[-0.05em] leading-[0.96] text-slate-900 sm:text-5xl md:text-7xl">
              Finance Your Basement
            </h1>

            <p className="mt-3 max-w-2xl text-2xl font-semibold tracking-[-0.03em] text-slate-700 sm:text-3xl md:text-4xl">
              with a manageable monthly payment
            </p>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
              Move forward now without draining all your cash at once, while
              still keeping the flexibility to pay it down faster later.
            </p>

            <div className="mt-7 space-y-3 lg:max-w-2xl">
              {heroBullets.map((bullet) => (
                <div
                  key={bullet}
                  className="flex items-start gap-3"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <p className="text-sm leading-7 text-slate-700 sm:text-base">{bullet}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#calculator-placeholder"
                className="inline-flex items-center justify-center rounded-xl bg-[#1B3C6C] px-7 py-4 text-base font-bold text-white shadow-[0_16px_32px_rgba(27,60,108,0.18)] transition hover:bg-blue-700 hover:shadow-[0_20px_40px_rgba(27,60,108,0.22)]"
              >
                Estimate My Payments
              </a>
              <a
                href="#how-open-loans-work"
                className="inline-flex items-center justify-center rounded-[0.8rem] border border-slate-300 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-7 py-[0.95rem] text-base font-semibold tracking-[-0.015em] text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_1px_2px_rgba(15,23,42,0.03),0_12px_24px_rgba(15,23,42,0.05)] transition duration-200 hover:border-slate-400 hover:bg-[linear-gradient(180deg,#ffffff_0%,#f1f5f9_100%)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.98),0_1px_2px_rgba(15,23,42,0.04),0_14px_28px_rgba(15,23,42,0.06)] active:bg-slate-100 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
              >
                How Open Loans Work
              </a>
            </div>
          </div>

          <div className="flex items-center justify-center lg:justify-end">
            <div className="w-full max-w-[560px] rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-[0_30px_80px_rgba(15,23,42,0.10)] sm:rounded-[2rem] sm:p-5">
              <div className="mb-3 flex items-center justify-between px-1 sm:mb-4 sm:px-2">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Smart financing lens
                </p>
                <Sparkles className="h-5 w-5 text-[#1B3C6C]" />
              </div>

              <div className="overflow-hidden rounded-[1.5rem] shadow-[0_20px_50px_rgba(15,23,42,0.16)] sm:rounded-[1.75rem]">
                <div className="relative">
                <img
                  src="/images/modern-wide-angle-basement.jpg"
                  alt="Finished modern basement with comfortable lounge seating"
                  className="h-[300px] w-full object-cover object-center sm:h-[360px]"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(23,37,84,0)_0%,rgba(23,37,84,0.06)_28%,rgba(23,37,84,0.22)_52%,rgba(23,37,84,0.58)_76%,rgba(23,37,84,0.92)_100%)]" />

                <div className="absolute left-4 top-4 rounded-full border border-white/50 bg-white/88 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1B3C6C] shadow-[0_12px_30px_rgba(15,23,42,0.10)] backdrop-blur-md sm:left-5 sm:top-5 sm:px-4 sm:text-xs">
                  Finished basement outcome
                </div>

                <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,rgba(15,23,42,0)_0%,rgba(15,23,42,0.70)_100%)] px-4 pb-4 pt-12 text-white sm:px-6 sm:pb-6 sm:pt-16">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-200 sm:text-xs">
                    Why this works
                  </p>
                  <h2 className="mt-2 max-w-[16rem] text-xl font-bold tracking-[-0.03em] sm:max-w-[22rem] sm:text-3xl">
                    Get the basement now without draining all your cash today
                  </h2>
                  <p className="mt-2 max-w-[22rem] text-xs leading-6 text-slate-200 sm:mt-3 sm:max-w-[28rem] sm:text-sm sm:leading-7">
                    Use financing to make the project happen now and keep your
                    savings intact while the space starts working for you sooner.
                  </p>
                </div>
                </div>

                <div className="bg-[linear-gradient(180deg,#0f172a_0%,#172554_100%)] p-4 text-white sm:p-6">
                  <div className="grid gap-4 lg:grid-cols-[auto_1fr] lg:items-start">
                    <div className="rounded-[1.2rem] bg-white px-4 py-4 text-slate-900 shadow-[0_14px_30px_rgba(15,23,42,0.16)] sm:rounded-[1.3rem] sm:px-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
                        Example payment
                      </p>
                      <p className="mt-2 text-3xl font-bold tracking-[-0.04em] sm:text-5xl">
                        {formatCurrency(heroExampleMonthlyPayment)}
                        <span className="ml-2 text-sm font-semibold text-slate-500 sm:text-base">
                          /month
                        </span>
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-700">
                        Approx. {formatCurrency(heroExampleDailyEquivalent)}/day
                      </p>
                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        Deposit example: {formatCurrency(depositAmount)}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2 text-sm font-semibold text-white sm:gap-3">
                        <span className="rounded-full border border-white/12 bg-white/8 px-3 py-2 sm:px-4">
                          Typical project range: $10K - $150K
                        </span>
                        <span className="rounded-full border border-white/12 bg-white/8 px-3 py-2 sm:px-4">
                          Common setup: 60 / 240
                        </span>
                      </div>

                      <p className="mt-4 text-sm leading-7 text-slate-300">
                        You can also review our{' '}
                        <Link
                          to="/financing"
                          className="font-semibold text-white underline underline-offset-4"
                        >
                          renovation financing overview
                        </Link>
                        .
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
                At a glance
              </p>
              <p className="mt-2 text-lg font-bold tracking-[-0.02em] text-slate-900">
                The financing setup most homeowners are actually looking at
              </p>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-slate-600">
              These are the core assumptions behind the payment examples on this
              page, shown in plain English.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6">
            {trustPoints.map((point) => {
              const Icon = point.icon;

              return (
                <div
                  key={point.title}
                  className="rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-6 py-6 shadow-[0_10px_24px_rgba(15,23,42,0.05)]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-[#1B3C6C]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-5 text-lg font-bold leading-7 text-slate-900">
                    {point.title}
                  </p>
                  <p className="mt-3 max-w-[18rem] text-sm leading-7 text-slate-600">
                    {point.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="how-open-loans-work" className="bg-white py-20">
        <div className="mx-auto grid max-w-7xl gap-16 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_520px] lg:px-8">
          <div>
            <SectionHeading
              eyebrow="Open loan basics"
              title="What is an open loan?"
              description="An open loan lets you move forward on a basement renovation now and spread the cost over time without locking yourself into carrying the balance for the full schedule."
            />

            <div className="mt-8 space-y-5 text-lg leading-8 text-slate-600">
              <p>
                That distinction matters. Many homeowners hear a long
                amortization period and assume they are trapped for the full
                duration. With an open loan, the setup mostly exists to keep
                the required monthly payment manageable so the basement can get
                done now. It does not remove your ability to make extra
                payments or fully exit early.
              </p>
              <p>
                This is why open-loan financing can work well for basement
                projects with a smarter payoff plan behind them. You can keep
                monthly pressure manageable now, then use a bonus, refinance,
                or early payoff strategy later if it still makes sense.
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] p-8 shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
              The practical takeaway
            </p>
            <div className="mt-6 space-y-4">
              {[
                'Renovate now and spread the cost over time',
                'Keep the required payment manageable',
                'Make extra payments when cash flow allows',
                'Pay it off early with no prepayment penalty',
                'Use financing as a bridge, not necessarily a lifelong balance',
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <p className="text-sm leading-6 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Process"
            title="How it works"
            description="The financing path is straightforward. The key is understanding how rate support, term, and amortization shape the required monthly."
          />

            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {howItWorksSteps.map((step, index) => {
              const stepCardStyles = [
                'border-blue-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] shadow-[0_18px_45px_rgba(59,130,246,0.07)]',
                'border-sky-100 bg-[linear-gradient(180deg,#ffffff_0%,#f6fbff_100%)] shadow-[0_18px_45px_rgba(14,165,233,0.07)]',
                'border-cyan-100 bg-[linear-gradient(180deg,#ffffff_0%,#f4fcff_100%)] shadow-[0_18px_45px_rgba(6,182,212,0.07)]',
                'border-teal-100 bg-[linear-gradient(180deg,#ffffff_0%,#f3fdfb_100%)] shadow-[0_18px_45px_rgba(20,184,166,0.07)]',
                'border-emerald-100 bg-[linear-gradient(180deg,#ffffff_0%,#f4fdf7_100%)] shadow-[0_18px_45px_rgba(16,185,129,0.07)]',
                'border-lime-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fdee_100%)] shadow-[0_18px_45px_rgba(132,204,22,0.07)]',
              ];

              const stepBadgeStyles = [
                'bg-blue-50 text-blue-700',
                'bg-sky-50 text-sky-700',
                'bg-cyan-50 text-cyan-700',
                'bg-teal-50 text-teal-700',
                'bg-emerald-50 text-emerald-700',
                'bg-lime-50 text-lime-700',
              ];

              return (
                <div
                  key={step.title}
                  className={`rounded-[1.75rem] border p-6 ${stepCardStyles[index]} `}
                >
                  <div
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${stepBadgeStyles[index]}`}
                  >
                    Step {index + 1}
                  </div>
                  <h3 className="mt-4 text-xl font-bold tracking-[-0.02em] text-slate-900">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {step.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <SectionHeading
                eyebrow="Why homeowners use it"
            title="Why homeowners finance a basement instead of waiting"
            description="The appeal is usually not about borrowing for its own sake. It is about making the project happen sooner without wrecking cash flow."
          />

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {useCases.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-7 shadow-sm"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#1B3C6C]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-2xl font-bold tracking-[-0.02em] text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-base leading-7 text-slate-600">
                    {item.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="calculator-placeholder"
        className="overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(148,163,184,0.10),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(191,219,254,0.14),transparent_30%),linear-gradient(180deg,#fcfdff_0%,#f4f7fb_46%,#eef3f8_100%)] py-20"
      >
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Calculator"
            title="Basement payment calculator"
            description="Use this to pressure-test what it could look like to finish the basement with a manageable monthly payment instead of waiting until the full cost can be paid in cash."
          />
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
            This uses a common financing example: 9.99%, a 60-month promo term,
            monthly payments, and a longer amortization period to keep the
            required monthly lower.
          </p>

          <div className="relative z-10 mt-10 rounded-[2.25rem] border border-white/65 bg-[linear-gradient(180deg,rgba(255,255,255,0.76)_0%,rgba(248,250,252,0.60)_100%)] p-3 shadow-[0_34px_100px_rgba(15,23,42,0.13),0_10px_28px_rgba(255,255,255,0.22),inset_0_1px_0_rgba(255,255,255,0.84)] ring-1 ring-slate-200/45 backdrop-blur-2xl sm:p-4">
            <div className="pointer-events-none absolute inset-0 rounded-[2.25rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.50)_0%,rgba(255,255,255,0.20)_18%,rgba(255,255,255,0.08)_44%,rgba(255,255,255,0.03)_100%)]" />
            <div className="pointer-events-none absolute inset-0 rounded-[2.25rem] bg-[linear-gradient(120deg,rgba(255,255,255,0.14)_0%,transparent_18%,transparent_62%,rgba(255,255,255,0.05)_100%)]" />
            <div className="pointer-events-none absolute inset-0 rounded-[2.25rem] bg-[radial-gradient(circle_at_18%_14%,rgba(255,255,255,0.24),transparent_24%),linear-gradient(145deg,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0.03)_46%,rgba(148,163,184,0.05)_100%)]" />
            <div className="pointer-events-none absolute inset-[1px] rounded-[2.15rem] bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.12),transparent_34%)]" />
            <div className="pointer-events-none absolute -left-10 -top-10 h-52 w-52 rounded-full bg-white/50 blur-3xl" />
            <div className="pointer-events-none absolute right-8 top-8 h-32 w-32 rounded-full bg-sky-100/35 blur-3xl" />
            <div className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
            <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)]">
            <div className="relative overflow-hidden rounded-[1.95rem] border border-white/78 bg-[linear-gradient(180deg,rgba(255,255,255,0.86)_0%,rgba(248,250,252,0.68)_100%)] p-7 shadow-[0_28px_70px_rgba(15,23,42,0.11),0_8px_18px_rgba(255,255,255,0.16),inset_0_1px_0_rgba(255,255,255,0.94)] ring-1 ring-white/45 backdrop-blur-2xl">
              <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-90" />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.05)_100%),radial-gradient(circle_at_top_left,rgba(255,255,255,0.50),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(191,219,254,0.14),transparent_24%)]" />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,rgba(255,255,255,0.14)_0%,transparent_20%,transparent_66%,rgba(255,255,255,0.06)_100%)]" />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.04)_42%,rgba(148,163,184,0.05)_100%)]" />
              <div className="pointer-events-none absolute inset-[1px] rounded-[1.85rem] bg-[radial-gradient(circle_at_46%_16%,rgba(255,255,255,0.14),transparent_32%)]" />
                <div className="space-y-5">
                <div>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <label className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-600">
                      Renovation cost
                    </label>
                    <div className="w-full max-w-[14rem]">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatCurrency(renovationCost)}
                        onChange={handleRenovationCostInput}
                        className="w-full rounded-2xl border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(248,250,252,0.76)_100%)] px-4 py-3 text-right text-lg font-bold text-slate-900 shadow-[0_14px_30px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.98)] ring-1 ring-white/30 backdrop-blur-xl outline-none transition duration-200 focus:border-sky-200 focus:ring-4 focus:ring-blue-100/80"
                        aria-label="Renovation cost"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min={10000}
                    max={150000}
                    step={1000}
                    value={renovationCost}
                    onChange={(event) =>
                      setRenovationCost(Number(event.target.value))
                    }
                    className="mt-4 h-3 w-full cursor-pointer appearance-none rounded-full border border-white/75 bg-[linear-gradient(180deg,rgba(226,232,240,0.92)_0%,rgba(255,255,255,0.74)_100%)] accent-[#1B3C6C] shadow-[0_4px_10px_rgba(15,23,42,0.04),inset_0_1px_2px_rgba(255,255,255,0.88)] ring-1 ring-white/30 backdrop-blur-md"
                  />
                  <div className="mt-2 flex justify-between text-xs font-medium text-slate-600">
                    <span>$10,000</span>
                    <span>$150,000</span>
                  </div>
                </div>

                  <div className={`${lightMetricCard} p-5`}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                          Total financed (incl. HST)
                        </p>
                        <p className="mt-2 text-3xl font-bold tracking-[-0.03em] text-slate-900">
                          {formatCurrency(financedAmount)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowSetupDetails((current) => !current)}
                        className="inline-flex items-center justify-center rounded-full border border-white/80 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-800 shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition hover:bg-white"
                      >
                        {showSetupDetails ? 'Hide setup details' : 'Adjust setup details'}
                      </button>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      Start with the payment first. Open the setup only if you
                      want to pressure-test the assumptions behind it.
                    </p>
                  </div>

                  {showSetupDetails && (
                    <div className="space-y-6 border-t border-white/60 pt-6">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-600">
                          Amortization period
                        </p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                          {([
                            [120, '120 months'],
                            [180, '180 months'],
                            [240, '240 months'],
                          ] as const).map(([value, label]) => (
                            <button
                              key={label}
                              type="button"
                              onClick={() => setAmortizationMonths(value)}
                              className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition duration-200 ${
                                amortizationMonths === value
                                  ? 'border-sky-100/85 bg-[linear-gradient(180deg,rgba(27,60,108,0.96)_0%,rgba(37,99,235,0.80)_100%)] text-white shadow-[0_18px_38px_rgba(27,60,108,0.22),inset_0_1px_0_rgba(255,255,255,0.24)] ring-1 ring-white/12 backdrop-blur-xl'
                                  : lightGlassButtonBase
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                        <p className="mt-3 text-xs leading-6 text-slate-600">
                          We usually maximize amortization to keep the monthly
                          lower. In practice, 240 months is the most common
                          setup we show.
                        </p>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                        <div className={`${lightMetricCard} p-4`}>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                            Rate example
                          </p>
                          <p className="mt-2 text-lg font-bold text-slate-900">
                            9.99%
                          </p>
                          <p className="mt-1 text-xs leading-6 text-slate-600">
                            Our most common representative setup.
                          </p>
                        </div>
                        <div className={`${lightMetricCard} p-4`}>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                            Payment frequency
                          </p>
                          <p className="mt-2 text-lg font-bold text-slate-900">
                            Monthly
                          </p>
                          <p className="mt-1 text-xs leading-6 text-slate-600">
                            This is how we almost always show it.
                          </p>
                        </div>
                        <div className={`${lightMetricCard} p-4`}>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                            Promo term
                          </p>
                          <p className="mt-2 text-lg font-bold text-slate-900">
                            60 months
                          </p>
                          <p className="mt-1 text-xs leading-6 text-slate-600">
                            The most common sales setup we present.
                          </p>
                        </div>
                      </div>

                      <div className="rounded-[1.5rem] border border-sky-100/70 bg-[linear-gradient(180deg,rgba(239,246,255,0.98)_0%,rgba(224,242,254,0.78)_100%)] px-5 py-4 shadow-[0_18px_40px_rgba(37,99,235,0.10)]">
                        <p className="text-sm font-semibold text-[#16345d]">
                          Why this can work
                        </p>
                        <p className="mt-2 text-sm leading-7 text-slate-700">
                          A basement project often feels much more realistic once
                          the cost is translated into a monthly payment instead of
                          one large cash number.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
            </div>

            <div className="relative self-start overflow-hidden rounded-[1.95rem] border border-white/18 bg-[linear-gradient(180deg,rgba(15,23,42,0.78)_0%,rgba(15,23,42,0.58)_100%)] p-7 text-white shadow-[0_32px_90px_rgba(15,23,42,0.28),0_8px_18px_rgba(30,41,59,0.16),inset_0_1px_0_rgba(255,255,255,0.12)] ring-1 ring-slate-700/35 backdrop-blur-[22px]">
              <div
                className="pointer-events-none absolute inset-0 hidden lg:block"
                style={{
                  backgroundImage: "url('/images/calculator-image.jpg')",
                  backgroundSize: 'cover',
                  backgroundPosition: 'center 72%',
                  backgroundRepeat: 'no-repeat',
                  filter: 'blur(1px) saturate(0.92)',
                  opacity: 0.42,
                  WebkitMaskImage:
                    'linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.96) 26%, rgba(0,0,0,0.7) 46%, rgba(0,0,0,0.28) 60%, rgba(0,0,0,0) 74%)',
                  maskImage:
                    'linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.96) 26%, rgba(0,0,0,0.7) 46%, rgba(0,0,0,0.28) 60%, rgba(0,0,0,0) 74%)',
                }}
              />
              <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_92%_16%,rgba(255,255,255,0.10),transparent_20%),linear-gradient(135deg,rgba(255,255,255,0.09)_0%,rgba(255,255,255,0.03)_26%,rgba(255,255,255,0.02)_100%),radial-gradient(circle_at_top_left,rgba(96,165,250,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.04),transparent_24%)]" />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.08)_0%,transparent_18%,transparent_68%,rgba(255,255,255,0.04)_100%)]" />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.02)_40%,rgba(15,23,42,0.10)_100%)]" />
              <div className="pointer-events-none absolute inset-[1px] rounded-[1.85rem] bg-[radial-gradient(circle_at_50%_16%,rgba(255,255,255,0.08),transparent_30%)]" />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(270deg,rgba(15,23,42,0.08)_0%,rgba(15,23,42,0.04)_12%,transparent_28%,transparent_52%),linear-gradient(180deg,rgba(15,23,42,0.01)_0%,rgba(15,23,42,0.06)_100%)]" />
              <div className="pointer-events-none absolute right-0 top-0 h-44 w-44 rounded-full bg-sky-300/12 blur-3xl" />
                <div className="relative z-10 flex h-full flex-col">
                  <div>
                    <p className="text-sm font-medium tracking-[0.02em] text-sky-100">
                      Basement payment estimate
                  </p>
                  <p className="mt-5 text-5xl font-bold tracking-[-0.04em] text-white sm:text-6xl">
                    {formatCurrency(baseMonthlyPayment)}
                    <span className="ml-2 text-lg font-semibold text-slate-300 sm:text-xl">
                      / month
                    </span>
                  </p>
                    <p className="mt-4 text-xl font-semibold tracking-[-0.02em] text-white">
                      Approx. {formatCurrency(dailyEquivalent)}/day
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-200">
                      Instead of putting down {formatCurrency(depositAmount)} today
                    </p>
                  </div>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => setShowComparison((current) => !current)}
                      className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      {showComparison ? 'Hide comparison' : 'Compare deposit vs monthly'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowExitPlanner((current) => !current)}
                      className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      {showExitPlanner ? 'Hide exit plan' : 'Plan a faster payoff'}
                    </button>
                  </div>

                  {showComparison && (
                    <div className="mt-8 space-y-6">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-[1.4rem] bg-white/6 p-5 ring-1 ring-white/8">
                          <p className="text-sm font-medium text-slate-200">
                            Option A
                          </p>
                          <h3 className="mt-2 text-xl font-bold text-white">
                            Deposit paid today
                          </h3>
                          <p className="mt-3 text-2xl font-bold tracking-[-0.02em] text-white">
                            {formatCurrency(depositAmount)}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-300">
                            Example 20% deposit
                          </p>
                        </div>

                        <div className="rounded-[1.4rem] bg-[linear-gradient(180deg,rgba(56,189,248,0.18)_0%,rgba(96,165,250,0.12)_100%)] p-5 ring-1 ring-sky-200/20">
                          <p className="text-sm font-medium text-sky-100">
                            Option B
                          </p>
                          <h3 className="mt-2 text-xl font-bold text-white">
                            Finance monthly
                          </h3>
                          <p className="mt-3 text-2xl font-bold tracking-[-0.02em] text-white">
                            {formatCurrency(baseMonthlyPayment)}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-200">
                            Keep your savings intact
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <div className="mb-2 flex items-center justify-between gap-4 text-sm text-slate-300">
                            <span>Deposit today</span>
                            <span>{formatCurrency(depositAmount)}</span>
                          </div>
                          <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                            <div className="h-full w-full rounded-full bg-white/70 transition-all duration-700" />
                          </div>
                        </div>
                        <div>
                          <div className="mb-2 flex items-center justify-between gap-4 text-sm text-slate-300">
                            <span>Finance monthly</span>
                            <span>{formatCurrency(baseMonthlyPayment)}/mo</span>
                          </div>
                          <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full bg-[linear-gradient(90deg,#38bdf8_0%,#60a5fa_100%)] transition-all duration-700"
                              style={{ width: `${financeBarWidth}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {showExitPlanner && (
                    <div className="mt-8 rounded-[1.35rem] bg-white/5 px-5 py-4 ring-1 ring-white/8">
                      <p className="text-sm font-medium text-white">
                        Build your exit strategy
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-300">
                        Keep the lower required payment now, but map out what it
                        would take to be out faster.
                      </p>

                      <div className="mt-4 grid gap-2 sm:grid-cols-3">
                        {([
                          [24, '2 years'],
                          [36, '3 years'],
                          [60, '5 years'],
                        ] as const).map(([value, label]) => (
                          <button
                            key={label}
                            type="button"
                            onClick={() => setTargetPayoffMonths(value)}
                            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                              targetPayoffMonths === value
                                ? 'border-sky-200/70 bg-sky-300/15 text-white'
                                : 'border-white/12 bg-white/5 text-slate-200 hover:bg-white/10'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>

                      <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-sm font-medium text-slate-300">
                            Extra monthly needed
                          </p>
                          <p className="mt-1 text-2xl font-bold tracking-[-0.02em] text-white">
                            {formatCurrency(exitStrategy.extraMonthly)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-300">
                            Total monthly target
                          </p>
                          <p className="mt-1 text-2xl font-bold tracking-[-0.02em] text-white">
                            {formatCurrency(exitStrategy.totalMonthly)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-sm font-medium text-slate-300">
                            Or every 6 months
                          </p>
                          <p className="mt-1 text-xl font-bold tracking-[-0.02em] text-white">
                            About {formatCurrency(exitStrategy.sixMonthLumpSum)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-300">
                            Lifetime interest avoided
                          </p>
                          <p className="mt-1 text-xl font-bold tracking-[-0.02em] text-white">
                            {formatCurrency(exitStrategy.interestAvoided)}
                          </p>
                        </div>
                      </div>

                      <p className="mt-4 text-sm leading-7 text-slate-100">
                        To target a payoff in about {formatDuration(targetPayoffMonths)},
                        you would typically want to add about{' '}
                        {formatCurrency(exitStrategy.extraMonthly)} per month, or
                        plan for roughly {formatCurrency(exitStrategy.sixMonthLumpSum)}{' '}
                        every 6 months.
                      </p>
                    </div>
                  )}

                <div className="mt-8 space-y-3">
                  {[
                    'Turn a large cost into a manageable payment',
                    'Keep cash available for emergencies',
                    'Move forward now instead of waiting years',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-200" />
                      <span className="text-sm leading-6 text-slate-100">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-8">
                  <Link
                    to="/match"
                    className="inline-flex w-full items-center justify-center rounded-xl bg-white px-6 py-3.5 text-base font-bold text-slate-900 transition hover:bg-slate-100"
                  >
                    Check If You Qualify For This Payment
                  </Link>
                </div>

                <details className="mt-5 text-sm text-slate-300">
                  <summary className="cursor-pointer font-medium text-slate-200 transition hover:text-white">
                    View details
                  </summary>
                  <div className="mt-3 space-y-2 leading-6">
                    <p>
                      Typical example shown at 9.99%, 60-month promo term,
                      monthly payments, and {amortizationMonths}-month
                      amortization.
                    </p>
                    <p>
                      O.A.C. Illustrative only. Actual rates, terms, and APRs
                      depend on approval through Financeit.
                    </p>
                  </div>
                </details>
              </div>
            </div>
          </div>
          </div>

        </div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
              <SectionHeading
                eyebrow="Cost of waiting"
                title="Waiting has a cost too"
                description="Financing has a cost, but waiting often has one too. For many homeowners, the more useful question is whether delaying the basement makes life or property plans harder in the meantime."
              />
              <div className="mt-8 space-y-5 text-base leading-8 text-slate-600">
                <p>
                  A delayed basement often means delayed living space, delayed
                  rental potential, and more time living with a part of the
                  house that is not helping the family the way it could.
                </p>
                <p>
                  That is why many homeowners do not frame the decision as
                  &quot;cash or no project.&quot; They frame it as whether a
                  manageable monthly payment is worth getting the space now.
                </p>
                <p>
                  The point is not to push financing for its own sake. It is to
                  understand whether financing helps unlock a basement project
                  that meaningfully improves daily life, home value, or income
                  potential sooner.
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
                Basement decision lens
              </p>
              <div className="mt-6 space-y-4">
                {[
                  'Get the extra living space now',
                  'Avoid draining all your savings at once',
                  'Spread a large project into monthly payments',
                  'Keep the option to pay down faster later',
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    <p className="text-sm leading-6 text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2.2rem] border border-slate-900 bg-[linear-gradient(180deg,#0f172a_0%,#172554_100%)] p-8 text-white shadow-[0_28px_80px_rgba(15,23,42,0.24)] md:p-12">
            <div className="max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-200">
                Smart basement financing
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-white md:text-5xl">
                Open loans work best when they make the project possible now
              </h2>
              <p className="mt-5 text-lg leading-8 text-slate-300">
                The strongest use case is not borrowing forever. It is using
                financing as a flexible tool to get the basement done now while
                keeping control over when and how the balance gets reduced.
              </p>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              {[
                {
                  title: 'Annual cash events',
                  body: 'Bonuses, commissions, and tax refunds can be used to reduce principal meaningfully without changing the original monthly structure.',
                },
                {
                  title: 'Refinance after the basement is complete',
                  body: 'If the renovation improves the home in a material way, some homeowners later revisit their capital stack rather than carrying the open loan indefinitely.',
                },
                {
                  title: 'Control over timing',
                  body: 'The core advantage is optionality. You are not forced into an all-cash decision today, and you are not boxed out of a better payoff path later.',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6"
                >
                  <p className="text-lg font-bold text-white">{item.title}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
              <p className="text-base leading-8 text-slate-200">
                The point is not to glorify debt. The point is to use financing
                intelligently: make the basement possible now, preserve
                flexibility, and keep a realistic exit strategy in view from day
                one.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="FAQ"
            title="Common questions about open-loan financing"
            description="Short answers for homeowners trying to decide whether financing is the right way to move ahead on a basement renovation."
          />

          <div className="mt-10 space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;

              return (
                <div
                  key={faq.question}
                  className="rounded-[1.5rem] border border-slate-200 bg-white shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  >
                    <span className="text-lg font-bold text-slate-900">
                      {faq.question}
                    </span>
                    <span className="text-2xl font-light text-slate-400">
                      {isOpen ? '-' : '+'}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="border-t border-slate-200 px-6 py-5">
                      <p className="text-base leading-7 text-slate-600">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-8 py-12 shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
            <h2 className="text-3xl font-bold tracking-[-0.03em] text-slate-900 md:text-5xl">
              Use financing to get the basement done sooner, not keep it stuck on hold
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-600">
              A well-structured open loan can turn a basement renovation from a
              someday project into a realistic next step while still giving you
              control over how you reduce the balance later.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="#calculator-placeholder"
                className="inline-flex items-center justify-center rounded-[0.82rem] border border-slate-800 bg-[linear-gradient(180deg,#1f2937_0%,#0f172a_100%)] px-8 py-[0.98rem] text-lg font-semibold tracking-[-0.018em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(15,23,42,0.05),0_14px_30px_rgba(15,23,42,0.18)] transition duration-200 hover:border-slate-700 hover:bg-[linear-gradient(180deg,#273244_0%,#111c31_100%)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_1px_2px_rgba(15,23,42,0.06),0_18px_36px_rgba(15,23,42,0.22)] active:bg-[linear-gradient(180deg,#111827_0%,#020617_100%)] active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
              >
                Estimate My Payments
              </a>
              <Link
                to="/match"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-8 py-4 text-lg font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                Explore Your Financing Options
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-12 text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-200">
              Disclaimer
            </p>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              O.A.C. (On Approved Credit). Illustrative only. Actual rates,
              terms, and APRs are determined by Financeit based on individual
              credit profiles.
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              Promotional and contractor-supported financing options may not be
              available in all cases. Deferred payment programs may accrue
              interest during the deferral period.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
