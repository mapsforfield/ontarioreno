import { useMemo, useState, type CSSProperties } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { HeroHouse } from '../components/HeroHouse';
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
import { buttonStyles, eyebrowStyles } from '../lib/uiStyles';

type FaqItem = {
  question: string;
  answer: string;
};

const payoffStrategies = [
  {
    title: 'Annual cash events',
    body: 'Bonuses, commissions, and tax refunds can cut principal meaningfully without changing the monthly structure.',
  },
  {
    title: 'Refinance after the basement is complete',
    body: 'If the renovation improves the home materially, some homeowners later revisit their borrowing rather than carrying the open loan indefinitely.',
  },
  {
    title: 'Control over timing',
    body: 'You are not forced into an all-cash decision today, and you are not boxed out of a better payoff path later.',
  },
];

const otherPaths = [
  {
    title: 'Using home equity',
    body: 'A HELOC or refinance for bigger projects, and how to tell if the renovation earns it.',
    href: '/financing/home-equity-renovations-ontario',
  },
  {
    title: 'HELOC vs renovation financing',
    body: 'Side-by-side: flexible equity access versus a set monthly payment.',
    href: '/financing/heloc-vs-contractor-financing',
  },
  {
    title: 'All financing options',
    body: 'Every way to pay for a renovation in Ontario, in one place.',
    href: '/financing',
  },
];

export default function OpenLoanFinancing() {
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

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };

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

  const renovationFill = `${((renovationCost - 10000) / 140000) * 100}%`;

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
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
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      {/* Hero — white 60/40. The dark card shares state with the full
          calculator below, so dragging here moves that one too. */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-14 pt-12 sm:px-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-center lg:gap-14 lg:px-8 lg:pb-20 lg:pt-20">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-[0.8rem] font-medium text-[#1B3C6C]">
              <CreditCard className="h-3.5 w-3.5" />
              Ontario renovation financing guide
            </p>

            <h1 className="mt-6 max-w-2xl text-[2.45rem] font-bold leading-[1.02] tracking-[-0.045em] text-slate-950 md:text-[3.4rem] lg:text-[3.9rem]">
              Open Loan Renovation Financing
            </h1>

            <p className="mt-6 max-w-xl text-[1.05rem] leading-8 text-slate-600 md:text-[1.15rem]">
              Finish the basement now with a manageable monthly payment, and
              keep the freedom to pay it off early with no penalty.
            </p>

            <ul className="mt-7 space-y-3">
              {heroBullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3 text-[0.98rem] leading-7 text-slate-700">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[#2b5a96]" />
                  {bullet}
                </li>
              ))}
            </ul>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a href="#calculator-placeholder" className={buttonStyles.primary}>
                Estimate my payment
                <ArrowRight className="h-5 w-5" />
              </a>
              <Link to="/match" className={buttonStyles.secondary}>
                Start Project Review
              </Link>
            </div>
          </div>

          <div className="min-w-0">
            <HeroHouse>
            <div className="rounded-[1.6rem] bg-[#0F172A] p-6 text-white shadow-[0_30px_70px_rgba(15,23,42,0.28)] sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-blue-200">
                  Quick payment check
                </p>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[0.7rem] font-medium text-slate-300">
                  Example
                </span>
              </div>

              <label className="mt-6 block">
                <span className="flex items-baseline justify-between gap-4 text-sm">
                  <span className="text-slate-300">Renovation cost</span>
                  <span className="font-semibold tabular-nums">{formatCurrency(renovationCost)}</span>
                </span>
                <input
                  type="range"
                  min={10000}
                  max={150000}
                  step={1000}
                  value={renovationCost}
                  onChange={(event) => setRenovationCost(Number(event.target.value))}
                  aria-label="Renovation cost"
                  style={{ '--fill': renovationFill } as CSSProperties}
                  className="equity-range mt-4 w-full"
                />
              </label>

              <div className="mt-7 rounded-2xl bg-white/[0.06] p-5 ring-1 ring-white/10">
                <p className="text-sm text-slate-300">Estimated monthly payment</p>
                <p className="mt-1 text-[2.4rem] font-bold leading-none tracking-[-0.04em] tabular-nums md:text-[2.7rem]">
                  <span key={Math.round(baseMonthlyPayment)} className="equity-pop">
                    {formatCurrency(baseMonthlyPayment)}
                  </span>
                  <span className="ml-1.5 text-base font-semibold text-slate-400">/mo</span>
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  About {formatCurrency(dailyEquivalent)}/day on{' '}
                  {formatCurrency(financedAmount)} incl. HST
                </p>
                <p className="mt-3 text-xs leading-5 text-slate-400">
                  Example at 9.99%, 60-month promo term, {amortizationMonths}-month
                  amortization. O.A.C.
                </p>
              </div>

              <a
                href="#calculator-placeholder"
                className="mt-5 inline-flex items-center text-sm font-semibold text-sky-300 hover:underline"
              >
                See the full breakdown and payoff plan
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </div>
            </HeroHouse>
          </div>
        </div>

        {/* At a glance — the assumptions behind every number on the page. */}
        <div className="border-t border-slate-200 bg-slate-50/60">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-6 px-4 py-8 sm:px-6 md:grid-cols-3 lg:grid-cols-6 lg:px-8">
            {trustPoints.map((point) => {
              const Icon = point.icon;
              return (
                <div key={point.title} className="min-w-0">
                  <Icon className="h-5 w-5 text-[#2b5a96]" />
                  <p className="mt-3 text-sm font-semibold text-slate-900">{point.title}</p>
                  <p className="mt-1 text-[0.8rem] leading-5 text-slate-500">{point.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* What it is + how it works — explanation left, connected steps right. */}
      <section id="how-open-loans-work" className="scroll-mt-24 bg-[#F8FAFC] py-20 lg:py-28">
        <div className="mx-auto grid max-w-6xl gap-14 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-16 lg:px-8">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className={eyebrowStyles}>Open loan basics</p>
            <h2 className="mt-3 text-[2rem] font-bold leading-[1.1] tracking-[-0.035em] text-slate-950 md:text-[2.6rem]">
              What is an open loan?
            </h2>
            <div className="mt-5 space-y-4 text-[1.02rem] leading-8 text-slate-600">
              <p>
                An open loan lets you move forward on a basement renovation now
                and spread the cost over time, without being locked into
                carrying the balance for the full schedule.
              </p>
              <p>
                A long amortization mostly exists to keep the required monthly
                payment manageable. It does not stop you making extra payments
                or paying the whole thing off early.
              </p>
            </div>
          </div>

          <ol className="relative space-y-4">
            <div aria-hidden className="absolute bottom-8 left-[2.375rem] top-8 w-px bg-gradient-to-b from-[#2b5a96]/50 via-slate-200 to-slate-200" />
            {howItWorksSteps.map((step, index) => (
              <li
                key={step.title}
                className="relative flex gap-5 rounded-[1.2rem] border border-slate-200 bg-white p-5 shadow-sm"
              >
                <span
                  className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ring-4 ring-white ${
                    index === howItWorksSteps.length - 1
                      ? 'bg-[#1B3C6C] text-white'
                      : 'border border-slate-200 bg-white text-[#1B3C6C]'
                  }`}
                >
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-[1.05rem] font-semibold tracking-[-0.015em] text-slate-950">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-[0.94rem] leading-7 text-slate-600">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Calculator — dark band; the input card is the brightest thing here. */}
      <section
        id="calculator-placeholder"
        className="relative scroll-mt-24 overflow-hidden bg-[#0F172A] py-20 lg:py-28"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(56,189,248,0.16),transparent_70%)]" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-300">Calculator</p>
            <h2 className="mt-3 text-[2rem] font-bold leading-[1.1] tracking-[-0.035em] text-white md:text-[2.6rem]">
              Basement payment calculator
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[1.05rem] leading-7 text-slate-300">
              See what finishing the basement could cost per month instead of
              waiting until you can pay the full amount in cash.
            </p>
          </div>

          <div className="mt-12 grid items-start gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            {/* Inputs */}
            <div className="rounded-[1.6rem] bg-white p-6 shadow-[0_30px_70px_rgba(2,6,23,0.4)] sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <label htmlFor="open-loan-cost" className="text-sm font-semibold text-slate-700">
                  Renovation cost
                </label>
                <input
                  id="open-loan-cost"
                  type="text"
                  inputMode="numeric"
                  value={formatCurrency(renovationCost)}
                  onChange={handleRenovationCostInput}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-right text-lg font-bold text-slate-900 outline-none transition hover:border-slate-400 focus:border-[#2b5a96] focus:ring-4 focus:ring-blue-100 sm:max-w-[14rem]"
                />
              </div>
              <input
                type="range"
                min={10000}
                max={150000}
                step={1000}
                value={renovationCost}
                onChange={(event) => setRenovationCost(Number(event.target.value))}
                aria-label="Renovation cost slider"
                style={{ '--fill': renovationFill } as CSSProperties}
                className="equity-range equity-range--light mt-5 w-full"
              />
              <div className="mt-2 flex justify-between text-xs font-medium text-slate-500">
                <span>$10,000</span>
                <span>$150,000</span>
              </div>

              <div className="mt-7 flex flex-col gap-4 rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Total financed (incl. HST)
                  </p>
                  <p className="mt-1 text-[1.9rem] font-bold tracking-[-0.03em] tabular-nums text-slate-950">
                    {formatCurrency(financedAmount)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSetupDetails((current) => !current)}
                  aria-expanded={showSetupDetails}
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-[#2b5a96] hover:text-[#1B3C6C] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                >
                  {showSetupDetails ? 'Hide setup details' : 'Adjust setup details'}
                </button>
              </div>

              {showSetupDetails && (
                <div className="mt-6 space-y-6 border-t border-slate-200 pt-6">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Amortization period</p>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {([
                        [120, '120 months'],
                        [180, '180 months'],
                        [240, '240 months'],
                      ] as const).map(([value, label]) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => setAmortizationMonths(value)}
                          aria-pressed={amortizationMonths === value}
                          className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 ${
                            amortizationMonths === value
                              ? 'border-[#1B3C6C] bg-[#1B3C6C] text-white'
                              : 'border-slate-300 bg-white text-slate-700 hover:border-[#2b5a96] hover:text-[#1B3C6C]'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <p className="mt-3 text-xs leading-6 text-slate-500">
                      We usually maximize amortization to keep the monthly
                      lower. In practice, 240 months is the most common setup we
                      show.
                    </p>
                  </div>

                  <dl className="grid gap-3 sm:grid-cols-3">
                    {[
                      ['Rate example', '9.99%', 'Our most common representative setup.'],
                      ['Payment frequency', 'Monthly', 'This is how we almost always show it.'],
                      ['Promo term', '60 months', 'The most common sales setup we present.'],
                    ].map(([label, value, note]) => (
                      <div key={label} className="rounded-xl border border-slate-200 p-4">
                        <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
                          {label}
                        </dt>
                        <dd className="mt-1 text-lg font-bold text-slate-950">{value}</dd>
                        <dd className="mt-1 text-xs leading-5 text-slate-500">{note}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>

            {/* Result */}
            <div className="rounded-[1.6rem] bg-[#1B3C6C] p-6 text-white shadow-[0_30px_70px_rgba(2,6,23,0.4)] ring-1 ring-white/10 sm:p-8">
              <p className="text-sm font-medium text-sky-100">Basement payment estimate</p>
              <p className="mt-3 text-[3rem] font-bold leading-none tracking-[-0.04em] tabular-nums sm:text-[3.6rem]">
                <span key={Math.round(baseMonthlyPayment)} className="equity-pop">
                  {formatCurrency(baseMonthlyPayment)}
                </span>
                <span className="ml-2 text-lg font-semibold text-blue-200">/ month</span>
              </p>
              <p className="mt-4 text-lg font-semibold">
                Approx. {formatCurrency(dailyEquivalent)}/day
              </p>
              <p className="mt-1 text-sm text-blue-100">
                Instead of putting down {formatCurrency(depositAmount)} today
              </p>

              <div className="mt-7 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setShowComparison((current) => !current)}
                  aria-expanded={showComparison}
                  className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/25"
                >
                  {showComparison ? 'Hide comparison' : 'Compare deposit vs monthly'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowExitPlanner((current) => !current)}
                  aria-expanded={showExitPlanner}
                  className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/25"
                >
                  {showExitPlanner ? 'Hide exit plan' : 'Plan a faster payoff'}
                </button>
              </div>

              {showComparison && (
                <div className="mt-6 space-y-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white/[0.07] p-4 ring-1 ring-white/10">
                      <p className="text-xs font-medium text-blue-200">Option A</p>
                      <h3 className="mt-1 font-semibold">Deposit paid today</h3>
                      <p className="mt-2 text-2xl font-bold tabular-nums">{formatCurrency(depositAmount)}</p>
                      <p className="mt-1 text-xs text-blue-200">Example 20% deposit</p>
                    </div>
                    <div className="rounded-2xl bg-sky-400/15 p-4 ring-1 ring-sky-300/30">
                      <p className="text-xs font-medium text-sky-100">Option B</p>
                      <h3 className="mt-1 font-semibold">Finance monthly</h3>
                      <p className="mt-2 text-2xl font-bold tabular-nums">{formatCurrency(baseMonthlyPayment)}</p>
                      <p className="mt-1 text-xs text-sky-100">Keep your savings intact</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="mb-1.5 flex justify-between text-xs text-blue-100">
                        <span>Deposit today</span>
                        <span>{formatCurrency(depositAmount)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10">
                        <div className="h-full w-full rounded-full bg-white/70" />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1.5 flex justify-between text-xs text-blue-100">
                        <span>Finance monthly</span>
                        <span>{formatCurrency(baseMonthlyPayment)}/mo</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-300 transition-all duration-700"
                          style={{ width: `${financeBarWidth}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {showExitPlanner && (
                <div className="mt-6 rounded-2xl bg-white/[0.07] p-5 ring-1 ring-white/10">
                  <p className="font-semibold">Build your exit strategy</p>
                  <p className="mt-1 text-sm leading-6 text-blue-100">
                    Keep the lower required payment now, but map out what it
                    would take to be out faster.
                  </p>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {([
                      [24, '2 years'],
                      [36, '3 years'],
                      [60, '5 years'],
                    ] as const).map(([value, label]) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setTargetPayoffMonths(value)}
                        aria-pressed={targetPayoffMonths === value}
                        className={`rounded-full border px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/25 ${
                          targetPayoffMonths === value
                            ? 'border-white bg-white text-[#1B3C6C]'
                            : 'border-white/20 bg-white/5 text-blue-100 hover:bg-white/10'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <dl className="mt-5 grid grid-cols-2 gap-4">
                    {[
                      ['Extra monthly needed', formatCurrency(exitStrategy.extraMonthly)],
                      ['Total monthly target', formatCurrency(exitStrategy.totalMonthly)],
                      ['Or every 6 months', `About ${formatCurrency(exitStrategy.sixMonthLumpSum)}`],
                      ['Lifetime interest avoided', formatCurrency(exitStrategy.interestAvoided)],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt className="text-xs text-blue-200">{label}</dt>
                        <dd className="mt-0.5 text-xl font-bold tabular-nums">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-4 text-sm leading-6 text-blue-50">
                    To target a payoff in about {formatDuration(targetPayoffMonths)},
                    you would typically want to add about{' '}
                    {formatCurrency(exitStrategy.extraMonthly)} per month, or plan
                    for roughly {formatCurrency(exitStrategy.sixMonthLumpSum)} every
                    6 months.
                  </p>
                </div>
              )}

              <Link
                to="/match"
                className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-base font-bold text-[#1B3C6C] shadow-[0_12px_28px_rgba(2,6,23,0.25)] transition hover:bg-slate-100"
              >
                Check If You Qualify For This Payment
                <ArrowRight className="h-5 w-5" />
              </Link>

              <p className="mt-4 text-xs leading-5 text-blue-200">
                Typical example shown at 9.99%, 60-month promo term, monthly
                payments, and {amortizationMonths}-month amortization. O.A.C.
                Illustrative only. Actual rates, terms, and APRs depend on
                approval through Financeit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why finance instead of waiting — the cost-of-waiting argument left,
          the four reasons right. */}
      <section className="bg-white py-20 lg:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16 lg:px-8">
          <div>
            <p className={eyebrowStyles}>Why homeowners use it</p>
            <h2 className="mt-3 text-[2rem] font-bold leading-[1.1] tracking-[-0.035em] text-slate-950 md:text-[2.6rem]">
              Waiting has a cost too
            </h2>
            <div className="mt-5 space-y-4 text-[1.02rem] leading-8 text-slate-600">
              <p>
                A delayed basement means delayed living space, delayed rental
                potential, and more time with a part of the house that is not
                helping the family the way it could.
              </p>
              <p>
                So many homeowners don't frame it as &quot;cash or no
                project.&quot; They ask whether a manageable monthly payment is
                worth having the space now.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {useCases.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-[1.3rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1B3C6C] text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-[1.12rem] font-semibold tracking-[-0.02em] text-slate-950">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-[0.94rem] leading-7 text-slate-600">{item.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Payoff strategies — branded conversion box on a light band. */}
      <section className="bg-[#F8FAFC] py-20 lg:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2rem] bg-[#1B3C6C] text-white shadow-[0_40px_80px_rgba(27,60,108,0.3)]">
            <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-sky-400/20 blur-3xl" />
            <div className="relative grid gap-10 p-8 md:p-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14 lg:p-14">
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-sky-200">
                  Smart basement financing
                </p>
                <h2 className="mt-3 text-[1.9rem] font-bold leading-[1.1] tracking-[-0.035em] md:text-[2.4rem]">
                  Open loans work best when they make the project possible now
                </h2>
                <p className="mt-4 max-w-md text-[1.02rem] leading-7 text-blue-100">
                  Not borrowing forever: a flexible tool to get the basement
                  done now while you control when the balance comes down.
                </p>
                <Link
                  to="/match"
                  className="mt-8 inline-flex items-center justify-center gap-2 rounded-[0.8rem] bg-white px-7 py-[0.95rem] text-base font-semibold text-[#1B3C6C] shadow-[0_12px_28px_rgba(2,6,23,0.25)] transition hover:bg-slate-100"
                >
                  Start Project Review
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <p className="mt-4 text-sm text-blue-200">Free and no obligation.</p>
              </div>

              <ul className="space-y-3">
                {payoffStrategies.map((item) => (
                  <li key={item.title} className="rounded-2xl bg-white/[0.07] p-5 ring-1 ring-white/10">
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-blue-100">{item.body}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Other paths — keeps this page linked into the financing cluster. */}
      <section className="bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className={eyebrowStyles}>Other ways to pay</p>
            <h2 className="mt-3 text-[2rem] font-bold leading-[1.1] tracking-[-0.035em] text-slate-950 md:text-[2.6rem]">
              Not sure an open loan fits?
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {otherPaths.map((path) => (
              <Link
                key={path.href}
                to={path.href}
                className="group flex flex-col rounded-[1.3rem] border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
              >
                <h3 className="text-[1.12rem] font-semibold tracking-[-0.02em] text-slate-950">{path.title}</h3>
                <p className="mt-2 flex-1 text-[0.94rem] leading-7 text-slate-600">{path.body}</p>
                <span className="mt-5 inline-flex items-center text-sm font-semibold text-[#1B3C6C]">
                  Read the guide
                  <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-slate-200 bg-[#F8FAFC] py-20 lg:py-28">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16 lg:px-8">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className={eyebrowStyles}>FAQ</p>
            <h2 className="mt-3 text-[2rem] font-bold leading-[1.1] tracking-[-0.035em] text-slate-950 md:text-[2.6rem]">
              Common questions about open-loan financing
            </h2>
          </div>

          <div className="divide-y divide-slate-200 rounded-[1.4rem] border border-slate-200 bg-white px-6 shadow-sm md:px-8">
            {faqs.map((faq, index) => (
              <details key={faq.question} open={index === 0} className="group py-5">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-5 text-left">
                  <span className="text-[1rem] font-semibold leading-7 tracking-[-0.015em] text-slate-950 md:text-[1.05rem]">
                    {faq.question}
                  </span>
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-200 text-sm text-slate-500 transition group-open:rotate-45 group-open:border-[#1B3C6C] group-open:text-[#1B3C6C]">
                    +
                  </span>
                </summary>
                <p className="mt-3 pr-8 text-[0.96rem] leading-7 text-slate-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA + disclaimer */}
      <section className="bg-[#0F172A] py-20 text-white lg:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-[2rem] font-bold leading-[1.1] tracking-[-0.035em] md:text-[2.6rem]">
            Get the basement done sooner, not stuck on hold
          </h2>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <a href="#calculator-placeholder" className={buttonStyles.primary}>
              Estimate My Payments
              <ArrowRight className="h-5 w-5" />
            </a>
            <Link to="/match" className={buttonStyles.ghostDark}>
              Explore Your Financing Options
            </Link>
          </div>
          <div className="mx-auto mt-14 max-w-2xl border-t border-white/10 pt-8 text-left text-xs leading-6 text-slate-400">
            <p>
              O.A.C. (On Approved Credit). Illustrative only. Actual rates,
              terms, and APRs are determined by Financeit based on individual
              credit profiles.
            </p>
            <p className="mt-2">
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
