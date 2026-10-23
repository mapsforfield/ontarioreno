import { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  Landmark,
  Layers3,
  Scale,
  Wrench,
} from 'lucide-react';
import { buttonStyles } from '../lib/uiStyles';

// Shown once, as the "Is equity right for this project?" row. This list used
// to render three times (strip, sticky sidebar, section headers) — keep it to
// one place.
const decisionSteps = [
  {
    step: '01',
    title: 'Define the renovation',
    body: 'Know what is being built before you decide how to pay for it.',
  },
  {
    step: '02',
    title: 'Test feasibility',
    body: 'Check the permit path, compliance work, and hidden complexity.',
  },
  {
    step: '03',
    title: 'Check the value',
    body: 'Will the project add value or rental income that earns the equity?',
  },
  {
    step: '04',
    title: 'Choose how to pay',
    body: 'Compare the options only once the renovation itself makes sense.',
  },
];

// Each comparison guide is linked once, from its card. These links are most of
// this page's internal-link value for the /financing/* guides.
const financingPaths = [
  {
    title: 'HELOC',
    icon: Compass,
    body:
      'Flexible access to equity, drawn as you need it. A natural fit when the renovation is defined and has long-term value.',
    bestFor: 'Defined, higher-value projects like suites and additions.',
    href: '/financing/heloc-vs-contractor-financing',
    linkText: 'HELOC vs renovation financing',
  },
  {
    title: 'Refinance',
    icon: Landmark,
    body:
      'Resets the mortgage to free up a larger amount. Makes more sense for big projects on a home you plan to keep.',
    bestFor: 'Bigger projects with a longer ownership horizon.',
    href: '/financing/heloc-vs-refinance-for-renovations',
    linkText: 'HELOC vs refinance',
  },
  {
    title: 'Open Loan',
    icon: Wrench,
    body:
      'A set monthly payment you can pay down or clear early with no prepayment penalty. Approval depends on your profile and the lender.',
    bestFor: 'Homeowners who want a clear monthly number.',
    href: '/open-loan-financing',
    linkText: 'See how the open loan works',
  },
  {
    title: 'Phased approach',
    icon: Layers3,
    body:
      'Sometimes the answer is not more borrowing but a better order: must-do work first, finishes later.',
    bestFor: 'Permit-heavy or evolving projects.',
    href: '/financing/phased-renovation-financing',
    linkText: 'Phased renovation financing',
  },
];

const renovationTypeOptions = [
  'Legal basement apartment',
  'Basement renovation',
  'Garden suite',
  'Home addition',
  'Kitchen renovation',
  'Whole-home renovation',
  'Other major renovation',
];

const ownershipTimelineOptions = [
  'Less than 3 years',
  '3 to 7 years',
  '7 to 12 years',
  '12+ years',
];

const scopeClarityOptions = ['Clearly defined', 'Partially defined', 'Still evolving'];

const permitComplexityOptions = ['Low', 'Moderate', 'High'];

const rentalPotentialOptions = [
  'None',
  'Possible but uncertain',
  'Realistic and central',
];

const grantInvolvementOptions = ['None', 'Maybe', 'Likely relevant'];

const faqItems = [
  {
    question: 'Can you use a HELOC for renovations in Ontario?',
    answer:
      'Yes. Many Ontario homeowners use a HELOC for renovations, but the better question is whether the renovation scope, permit path, cost logic, and long-term project purpose actually justify using home equity in the first place.',
  },
  {
    question: 'Is a HELOC better than renovation financing for an Ontario renovation?',
    answer:
      'Not always. A HELOC can offer flexible access to home equity, while renovation financing can feel cleaner for some projects. The better choice depends on scope certainty, ownership horizon, and how defined the Ontario renovation plan really is.',
  },
  {
    question: 'What should I confirm before using home equity for a renovation?',
    answer:
      'A realistic cost range based on Ontario project conditions, the likely permit path, how stable the scope is, whether rental income or resale value genuinely matters, whether any grant actually applies, and how long you plan to keep the home after the work is done.',
  },
  {
    question: 'Which renovations are a weaker fit for home equity?',
    answer:
      'Mostly cosmetic upgrades with little long-term value, projects whose scope is still moving too much to price, and renovations on a home you expect to sell soon or that rely on speculative payoff assumptions.',
  },
  {
    question: 'Should I use home equity before I know the full Ontario renovation cost?',
    answer:
      'Usually no. It is safer to understand realistic Ontario renovation costs, likely permit requirements, and scope risk before treating home equity as the answer.',
  },
  {
    question: 'Does using home equity make sense for a legal basement apartment in Ontario?',
    answer:
      'It can, especially when the Ontario suite has realistic rental logic and a credible path to legal compliance. It becomes much harder to justify if income assumptions are strong but feasibility is weak.',
  },
  {
    question: 'Can Ontario grants and incentives reduce how much I need to borrow?',
    answer:
      'Sometimes, yes. Ontario grants and incentives can reduce financing pressure, but they are not guaranteed and do not automatically make the renovation viable.',
  },
  {
    question: 'Is a renovation refinance better than a HELOC for a large Ontario project?',
    answer:
      'Sometimes. A refinance may make more sense on a larger Ontario renovation project with a longer ownership horizon, while a HELOC may fit homeowners who want more flexibility. The project itself should drive that comparison.',
  },
  {
    question: 'Which Ontario renovations are most likely to justify using home equity?',
    answer:
      'Ontario projects with stronger long-term value, practical household benefit, or realistic rental logic tend to justify home equity more easily than smaller cosmetic work.',
  },
  {
    question:
      'What should I figure out before financing a garden suite or legal basement apartment in Ontario?',
    answer:
      'Clarify the Ontario cost range, permit path, layout feasibility, servicing or mechanical needs, legal compliance requirements, and whether the income or property-value logic is actually strong enough to support the investment.',
  },
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
};

type FitCalculatorState = {
  homeValue: string;
  mortgageBalance: string;
  renovationBudget: string;
  helocRate: string;
  renovationType: string;
  ownershipTimeline: string;
  scopeClarity: string;
  permitComplexity: string;
  rentalPotential: string;
  grantInvolvement: string;
};

function SegmentedControl({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (option: string) => void;
}) {
  return (
    <div>
      <p className="text-sm font-semibold tracking-[-0.01em] text-slate-900">
        {label}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const isActive = option === value;

          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`max-w-full min-w-0 whitespace-normal break-words rounded-full border px-4 py-2 text-center text-sm font-medium leading-5 transition ${
                isActive
                  ? 'border-slate-900 bg-slate-900 text-white shadow-[0_10px_22px_rgba(15,23,42,0.12)]'
                  : 'border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(248,250,252,0.94)_100%)] text-slate-600 hover:border-slate-300 hover:text-slate-900'
              }`}
              aria-pressed={isActive}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type FitResult = {
  fitLabel: 'Strong fit' | 'Needs review' | 'Caution';
  fitInterpretation: string;
  totalEstimatedEquity: number;
  estimatedUsableEquity: number;
  estimatedDrawAmount: number;
  interestOnlyMonthlyCost: number;
  budgetPercentOfUsableEquity: number | null;
  equityPressureLabel:
    | 'Lighter equity pressure'
    | 'Moderate equity pressure'
    | 'Heavier equity pressure'
    | 'Not enough estimated usable equity';
  strengths: string[];
  needsReview: string[];
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
};

function parseCurrencyInput(value: string) {
  const cleaned = value.replace(/[^0-9.]/g, '');
  if (!cleaned) return null;

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function parsePercentInput(value: string) {
  const cleaned = value.replace(/[^0-9.]/g, '');
  if (!cleaned) return null;

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatCadCurrency(value: number, suffix = '') {
  return `${new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(value)}${suffix}`;
}

function formatMonthlyCad(value: number) {
  return `${new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(value)}/mo`;
}

function formatPercent(value: number) {
  return `${new Intl.NumberFormat('en-CA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value)}%`;
}

export default function HomeEquityRenovationsOntario() {
  const [fitCalculator, setFitCalculator] = useState<FitCalculatorState>({
    homeValue: '',
    mortgageBalance: '',
    renovationBudget: '',
    helocRate: '6.4',
    renovationType: renovationTypeOptions[0],
    ownershipTimeline: ownershipTimelineOptions[2],
    scopeClarity: scopeClarityOptions[1],
    permitComplexity: permitComplexityOptions[1],
    rentalPotential: rentalPotentialOptions[1],
    grantInvolvement: grantInvolvementOptions[0],
  });
  const [currentFitStep, setCurrentFitStep] = useState(1);
  const [showFitPreview, setShowFitPreview] = useState(false);
  const [fitResult, setFitResult] = useState<FitResult | null>(null);
  const [fitValidationMessage, setFitValidationMessage] = useState('');
  const fitResultRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!showFitPreview || !fitResult || typeof window === 'undefined') return;
    if (window.innerWidth >= 1024) return;

    const timer = window.setTimeout(() => {
      const target = fitResultRef.current;
      if (!target) return;

      const headerOffset = 92;
      const top =
        target.getBoundingClientRect().top + window.scrollY - headerOffset;

      window.scrollTo({
        top: Math.max(top, 0),
        behavior: 'smooth',
      });
    }, 120);

    return () => window.clearTimeout(timer);
  }, [showFitPreview, fitResult]);

  const updateFitField = <K extends keyof FitCalculatorState>(
    key: K,
    value: FitCalculatorState[K]
  ) => {
    setFitCalculator((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const runFitAssessment = () => {
    const homeValue = parseCurrencyInput(fitCalculator.homeValue);
    const mortgageBalance = parseCurrencyInput(fitCalculator.mortgageBalance);
    const renovationBudget = parseCurrencyInput(fitCalculator.renovationBudget);
    const helocRate = parsePercentInput(fitCalculator.helocRate);

    const invalidRequiredInputs =
      homeValue === null ||
      homeValue <= 0 ||
      mortgageBalance === null ||
      mortgageBalance < 0 ||
      renovationBudget === null ||
      renovationBudget <= 0;

    if (invalidRequiredInputs) {
      setFitResult(null);
      setShowFitPreview(false);
      setFitValidationMessage(
        'Add the property value, mortgage balance, and renovation budget to see the renovation fit outlook.'
      );
      return;
    }

    const safeHelocRate = helocRate !== null && helocRate >= 0 ? helocRate : 0;

    const totalEstimatedEquity = Math.max(homeValue - mortgageBalance, 0);
    const estimatedUsableEquity = Math.max(homeValue * 0.8 - mortgageBalance, 0);
    const estimatedDrawAmount = Math.min(renovationBudget, estimatedUsableEquity);
    const interestOnlyMonthlyCost =
      (estimatedDrawAmount * safeHelocRate) / 100 / 12;

    const budgetPercentOfUsableEquity =
      estimatedUsableEquity > 0
        ? (renovationBudget / estimatedUsableEquity) * 100
        : null;

    let equityPressureScore = 0;
    let equityPressureLabel: FitResult['equityPressureLabel'] =
      'Not enough estimated usable equity';

    if (budgetPercentOfUsableEquity !== null) {
      if (budgetPercentOfUsableEquity <= 35) {
        equityPressureScore = 25;
        equityPressureLabel = 'Lighter equity pressure';
      } else if (budgetPercentOfUsableEquity <= 70) {
        equityPressureScore = 15;
        equityPressureLabel = 'Moderate equity pressure';
      } else {
        equityPressureScore = 5;
        equityPressureLabel = 'Heavier equity pressure';
      }
    }

    const scopeScoreMap: Record<string, number> = {
      'Clearly defined': 20,
      'Partially defined': 12,
      'Still evolving': 4,
    };

    let permitComplexityScore = 6;
    if (fitCalculator.permitComplexity === 'Low') permitComplexityScore = 15;
    if (fitCalculator.permitComplexity === 'Moderate') permitComplexityScore = 10;
    if (
      fitCalculator.permitComplexity === 'High' &&
      fitCalculator.scopeClarity === 'Still evolving'
    ) {
      permitComplexityScore = 2;
    }

    const projectTypeScoreMap: Record<string, number> = {
      'Legal basement apartment': 20,
      'Garden suite': 20,
      'Home addition': 18,
      'Whole-home renovation': 15,
      'Kitchen renovation': 12,
      'Basement renovation': 10,
      'Other major renovation': 10,
    };

    const ownershipScoreMap: Record<string, number> = {
      'Less than 3 years': 2,
      '3 to 7 years': 6,
      '7 to 12 years': 9,
      '12+ years': 10,
    };

    const rentalPotentialScoreMap: Record<string, number> = {
      None: 2,
      'Possible but uncertain': 6,
      'Realistic and central': 10,
    };

    const totalScore =
      equityPressureScore +
      (scopeScoreMap[fitCalculator.scopeClarity] ?? 0) +
      permitComplexityScore +
      (projectTypeScoreMap[fitCalculator.renovationType] ?? 10) +
      (ownershipScoreMap[fitCalculator.ownershipTimeline] ?? 0) +
      (rentalPotentialScoreMap[fitCalculator.rentalPotential] ?? 0);

    let fitLabel: FitResult['fitLabel'] = 'Caution';
    if (totalScore >= 75) fitLabel = 'Strong fit';
    else if (totalScore >= 50) fitLabel = 'Needs review';

    const needsReviewNotes: string[] = [];

    if (estimatedUsableEquity <= 0) {
      needsReviewNotes.push(
        'The project may not have enough estimated usable equity based on the 80% planning assumption.'
      );
    }
    if (
      budgetPercentOfUsableEquity !== null &&
      budgetPercentOfUsableEquity > 70
    ) {
      needsReviewNotes.push(
        'The renovation budget appears to rely heavily on estimated usable equity.'
      );
    }
    if (fitCalculator.scopeClarity === 'Still evolving') {
      needsReviewNotes.push(
        'The project scope still appears too fluid for confident equity-backed planning.'
      );
    }
    if (fitCalculator.permitComplexity === 'High') {
      needsReviewNotes.push(
        'This renovation may carry meaningful permit or compliance complexity that can change cost assumptions.'
      );
    }
    if (fitCalculator.ownershipTimeline === 'Less than 3 years') {
      needsReviewNotes.push(
        'A shorter ownership timeline can make equity-backed renovations harder to justify.'
      );
    }
    if (
      fitCalculator.rentalPotential === 'None' &&
      ['Legal basement apartment', 'Garden suite'].includes(
        fitCalculator.renovationType
      )
    ) {
      needsReviewNotes.push(
        'Income logic should be clarified before treating this project as a strong equity fit.'
      );
    }
    if (
      ['Maybe', 'Likely relevant'].includes(fitCalculator.grantInvolvement)
    ) {
      needsReviewNotes.push(
        'Grants or incentives may help, but they should not be treated as guaranteed project support.'
      );
    }
    if (
      needsReviewNotes.length < 2 &&
      budgetPercentOfUsableEquity !== null &&
      budgetPercentOfUsableEquity > 35
    ) {
      needsReviewNotes.push(
        'The renovation uses a meaningful share of estimated usable equity, so cost discipline still matters.'
      );
    }
    if (
      needsReviewNotes.length < 2 &&
      fitCalculator.permitComplexity === 'Moderate'
    ) {
      needsReviewNotes.push(
        'Permit-related changes could still affect timing, cost, and scope assumptions.'
      );
    }

    const strengths: string[] = [];

    if (fitCalculator.scopeClarity === 'Clearly defined') {
      strengths.push(
        'The scope appears clear enough to support more confident planning.'
      );
    }
    if (
      ['Legal basement apartment', 'Garden suite'].includes(
        fitCalculator.renovationType
      )
    ) {
      strengths.push(
        'The project type can carry stronger rental or long-term value logic when feasibility is confirmed.'
      );
    }
    if (
      ['7 to 12 years', '12+ years'].includes(fitCalculator.ownershipTimeline)
    ) {
      strengths.push(
        'A longer ownership timeline gives the renovation more time to justify the investment.'
      );
    }
    if (fitCalculator.rentalPotential === 'Realistic and central') {
      strengths.push(
        'Rental or income potential is central to the project, which can strengthen the equity case.'
      );
    }
    if (
      budgetPercentOfUsableEquity !== null &&
      budgetPercentOfUsableEquity <= 35
    ) {
      strengths.push(
        'The renovation budget appears to use a lighter share of estimated usable equity.'
      );
    }
    if (
      strengths.length < 2 &&
      budgetPercentOfUsableEquity !== null &&
      budgetPercentOfUsableEquity <= 70
    ) {
      strengths.push(
        'Estimated usable equity appears broad enough to keep financing pressure from feeling extreme.'
      );
    }
    if (
      strengths.length < 2 &&
      fitCalculator.permitComplexity === 'Low'
    ) {
      strengths.push(
        'Permit complexity appears more manageable than some higher-risk equity-backed projects.'
      );
    }
    if (
      strengths.length < 2 &&
      fitCalculator.ownershipTimeline === '3 to 7 years'
    ) {
      strengths.push(
        'The ownership timeline gives the renovation some time to justify the investment.'
      );
    }
    if (strengths.length < 2) {
      strengths.push(
        'The project has enough defined context to compare renovation logic against home equity instead of guessing at the fit.'
      );
    }
    if (strengths.length < 2) {
      strengths.push(
        'The assessment can now frame the project around property context, ownership timing, and renovation purpose.'
      );
    }

    if (needsReviewNotes.length < 2) {
      needsReviewNotes.push(
        'The renovation should still be checked against realistic cost and permit assumptions before using equity.'
      );
    }
    if (needsReviewNotes.length < 2) {
      needsReviewNotes.push(
        'Even stronger-fit projects benefit from confirming scope stability before equity becomes part of the plan.'
      );
    }

    const trimmedStrengths = strengths.slice(0, 4);
    const trimmedNeedsReview = needsReviewNotes.slice(0, 4);

    const ctaMap: Record<
      FitResult['fitLabel'],
      { primary: string; secondary: string }
    > = {
      'Strong fit': {
        primary: 'Start Project Review',
        secondary: 'Explore Renovation Costs',
      },
      'Needs review': {
        primary: 'Review My Project Fit',
        secondary: 'See Ontario Renovation Costs',
      },
      Caution: {
        primary: 'Review Planning Risks',
        secondary: 'Explore Renovation Costs',
      },
    };

    const interpretationMap: Record<FitResult['fitLabel'], string> = {
      'Strong fit':
        'The renovation appears reasonably aligned with using home equity, assuming the scope, permits, and cost logic hold up.',
      'Needs review':
        'The project shows some strong signals, but key planning variables should be clarified before equity becomes part of the decision.',
      Caution:
        'The renovation may not be stable or strong enough yet to justify using home equity without closer review.',
    };

    setFitValidationMessage('');
    setFitResult({
      fitLabel,
      fitInterpretation: interpretationMap[fitLabel],
      totalEstimatedEquity,
      estimatedUsableEquity,
      estimatedDrawAmount,
      interestOnlyMonthlyCost,
      budgetPercentOfUsableEquity,
      equityPressureLabel,
      strengths: trimmedStrengths,
      needsReview: trimmedNeedsReview,
      primaryCtaLabel: ctaMap[fitLabel].primary,
      secondaryCtaLabel: ctaMap[fitLabel].secondary,
    });
    setShowFitPreview(true);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#f8fafc_0%,#f4f7fb_34%,#f7f9fc_100%)]">
      <Helmet>
        <title>Using Home Equity for Renovations in Ontario | OntarioReno</title>
        <meta
          name="description"
          content="Ontario renovation financing guide for using home equity: HELOCs, refinance, legal basement apartments, garden suites, grants, permit considerations, renovation costs, and project planning."
        />
        <link
          rel="canonical"
          href="https://ontarioreno.ca/financing/home-equity-renovations-ontario"
        />
        <meta
          property="og:title"
          content="Using Home Equity for Renovations in Ontario | OntarioReno"
        />
        <meta
          property="og:description"
          content="Ontario renovation financing guide for using home equity: HELOCs, refinance, legal basement apartments, garden suites, grants, permit considerations, renovation costs, and project planning."
        />
        <meta
          property="og:url"
          content="https://ontarioreno.ca/financing/home-equity-renovations-ontario"
        />
        <meta property="og:type" content="article" />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      {/* Hero */}
      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#f9fbfe_0%,#eef3f8_55%,#f6f8fb_100%)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_20%_10%,rgba(96,165,250,0.14),transparent_32%)]" />

        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)] lg:items-center lg:gap-14 lg:px-8 lg:py-20">
          <div className="relative z-10 min-w-0">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-100/90 bg-white/80 px-4 py-2 text-sm font-medium text-[#1B3C6C]">
              <Scale className="h-4 w-4" />
              Ontario homeowner planning guide
            </div>

            <h1 className="mt-5 max-w-3xl text-[2.5rem] font-bold leading-[0.98] tracking-[-0.05em] text-slate-950 md:text-[3.6rem] lg:text-[4.2rem]">
              Using Home Equity for Renovations in Ontario
            </h1>

            <p className="mt-5 max-w-xl text-[1.02rem] leading-7 text-slate-600 md:text-[1.15rem] md:leading-8">
              A HELOC or refinance can fund a bigger project. First, make sure
              the renovation itself is worth borrowing against your home for.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#calculator" className={buttonStyles.primary}>
                Check your fit
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
              <Link to="/match" className={buttonStyles.secondary}>
                Start Project Review
              </Link>
            </div>
          </div>

          <div className="relative z-10 mx-auto w-full max-w-[420px] min-w-0">
            <div className="overflow-hidden rounded-[1.8rem] border border-white/70 shadow-[0_30px_70px_rgba(15,23,42,0.14)]">
              <img
                src="/images/planning-image.png"
                alt="Ontario homeowner reviewing renovation planning documents at a table"
                className="aspect-[6/5] w-full object-cover object-[center_top]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Is equity right for this project? */}
      <section id="home-equity-guide" className="scroll-mt-24 bg-white py-16 lg:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
              Before you borrow
            </p>
            <h2 className="mt-3 text-[1.9rem] font-bold leading-[1.08] tracking-[-0.035em] text-slate-950 md:text-[2.5rem]">
              Is equity right for this project?
            </h2>
            <p className="mt-4 text-[1rem] leading-7 text-slate-600 md:text-[1.05rem]">
              Work through these in order. Financing comes last, once the
              renovation itself makes sense.
            </p>
          </div>

          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {decisionSteps.map((item) => (
              <li
                key={item.title}
                className="rounded-[1.25rem] border border-slate-200/80 bg-slate-50/60 p-5"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {item.step}
                </p>
                <h3 className="mt-2 text-[1.08rem] font-semibold tracking-[-0.02em] text-slate-950">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
              </li>
            ))}
          </ol>

          <p className="mt-6 text-sm leading-6 text-slate-500">
            Not sure what the project will cost yet? Start with{' '}
            <Link to="/costs" className="font-medium text-[#1B3C6C] hover:underline">
              Ontario renovation costs
            </Link>
            .
          </p>
        </div>
      </section>

      {/* HELOC renovation fit calculator */}
      <section
        id="calculator"
        className="relative overflow-hidden bg-[radial-gradient(circle_at_76%_18%,rgba(115,136,166,0.32),transparent_28%),radial-gradient(circle_at_16%_84%,rgba(247,236,220,0.72),transparent_30%),linear-gradient(180deg,#e7eef6_0%,#dde7f0_46%,#e8eff6_100%)] py-16 scroll-mt-24 lg:py-24 lg:scroll-mt-28"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-300/85 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-slate-200/55 to-transparent" />
          <div className="absolute left-[4%] top-10 h-[520px] w-[520px] rounded-full bg-white/46 blur-[135px]" />
          <div className="absolute right-[9%] top-8 h-[420px] w-[420px] rounded-full bg-slate-400/22 blur-[135px]" />
          <div className="absolute left-[9%] bottom-6 h-[280px] w-[280px] rounded-full bg-orange-100/78 blur-[120px]" />
            <div className="absolute left-1/2 top-[17%] h-[62%] w-[78%] -translate-x-1/2 border-x border-slate-200/24" />
        </div>

        <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8">
          <div className="min-w-0 max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
              Planning tool
            </p>
            <h2 className="mt-3 break-words text-[1.9rem] font-bold leading-[1.08] tracking-[-0.035em] text-slate-950 md:text-[2.5rem]">
              HELOC Renovation Fit Calculator
            </h2>
            <p className="mt-4 max-w-2xl text-[0.98rem] leading-7 text-slate-600 md:text-[1.08rem] md:leading-8">
              A planning tool to help you judge whether home equity belongs in the
              renovation.
            </p>
          </div>

          <div
            className={`mt-8 md:mt-10 lg:mt-14 ${
              showFitPreview
                ? 'grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(620px,1.12fr)] lg:items-start lg:gap-12'
                : 'flex justify-center'
            }`}
          >
            <div
              className={`relative min-w-0 ${
                showFitPreview ? 'w-full' : 'w-full max-w-[760px]'
              }`}
            >
              <div className="absolute left-0 top-0 hidden h-full w-px bg-gradient-to-b from-transparent via-slate-200 to-transparent lg:block" />
              <div className="min-w-0 pl-0 lg:pl-10">
                  <div className="relative rounded-[1.7rem] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.98),rgba(255,255,255,0.95)_36%),linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(247,250,253,0.96)_58%,rgba(242,246,250,0.98)_100%)] px-4 py-4 shadow-[0_34px_78px_rgba(15,23,42,0.15)] ring-1 ring-slate-300/85 backdrop-blur-[2px] md:rounded-[2rem] md:px-8 md:py-8">
                    <div className="pointer-events-none absolute inset-0 rounded-[1.7rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.46)_0%,transparent_22%,rgba(148,163,184,0.045)_100%)] md:rounded-[2rem]" />
                  <div className="flex flex-wrap items-center justify-between gap-3 md:gap-4">
                    <div className="min-w-0">
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
                        Guided assessment
                      </p>
                      <h3 className="mt-1.5 text-[1.28rem] font-bold tracking-[-0.03em] text-slate-950 md:mt-2 md:text-[1.65rem]">
                        {currentFitStep === 1 && 'Step 1: Property Context'}
                        {currentFitStep === 2 && 'Step 2: Renovation Context'}
                        {currentFitStep === 3 && 'Step 3: Planning Risk'}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1.5 md:gap-2">
                      {[1, 2, 3].map((step) => (
                        <div
                          key={step}
                          className={`h-2.5 w-8 rounded-full transition md:w-10 ${
                            currentFitStep === step
                              ? 'bg-slate-900 shadow-[0_6px_14px_rgba(15,23,42,0.18)]'
                              : currentFitStep > step
                                ? 'bg-slate-400/90'
                                : 'bg-slate-200/90'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                    <div className="mt-5 md:mt-8">
                    {currentFitStep === 1 && (
                      <div className="space-y-4 md:space-y-5">
                        <p className="max-w-xl text-sm leading-6 text-slate-600 md:leading-7">
                          Start with the home and the project budget. This gives the
                          assessment the property context before renovation fit is judged.
                        </p>

                        <div className="grid gap-3.5 md:grid-cols-2 md:gap-5">
                          <label className="block">
                            <span className="text-sm font-semibold tracking-[-0.01em] text-slate-900">
                              Estimated home value
                            </span>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={fitCalculator.homeValue}
                              onChange={(event) =>
                                updateFitField('homeValue', event.target.value)
                              }
                              placeholder="$950,000"
                                className="mt-2 w-full rounded-2xl border border-slate-200/75 bg-[linear-gradient(180deg,#fffdfa_0%,#ffffff_100%)] px-4 py-3 text-base text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_10px_22px_rgba(148,163,184,0.07)] outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-400/28 md:mt-3 md:py-3.5"
                            />
                          </label>

                          <label className="block">
                            <span className="text-sm font-semibold tracking-[-0.01em] text-slate-900">
                              Current mortgage balance
                            </span>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={fitCalculator.mortgageBalance}
                              onChange={(event) =>
                                updateFitField(
                                  'mortgageBalance',
                                  event.target.value
                                )
                              }
                              placeholder="$420,000"
                                className="mt-2 w-full rounded-2xl border border-slate-200/75 bg-[linear-gradient(180deg,#fffdfa_0%,#ffffff_100%)] px-4 py-3 text-base text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_10px_22px_rgba(148,163,184,0.07)] outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-400/28 md:mt-3 md:py-3.5"
                            />
                          </label>

                          <label className="block md:col-span-2">
                            <span className="text-sm font-semibold tracking-[-0.01em] text-slate-900">
                              Planned renovation budget
                            </span>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={fitCalculator.renovationBudget}
                              onChange={(event) =>
                                updateFitField(
                                  'renovationBudget',
                                  event.target.value
                                )
                              }
                              placeholder="$180,000"
                                className="mt-2 w-full rounded-2xl border border-slate-200/75 bg-[linear-gradient(180deg,#fffdfa_0%,#ffffff_100%)] px-4 py-3 text-base text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_10px_22px_rgba(148,163,184,0.07)] outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-400/28 md:mt-3 md:py-3.5"
                            />
                          </label>

                          <label className="block md:col-span-2">
                            <span className="text-sm font-semibold tracking-[-0.01em] text-slate-900">
                              Estimated HELOC interest rate
                            </span>
                            <div className="mt-2 relative max-w-full sm:max-w-[220px] md:mt-3">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={fitCalculator.helocRate}
                                onChange={(event) =>
                                  updateFitField('helocRate', event.target.value)
                                }
                                placeholder="6.4"
                                  className="w-full rounded-2xl border border-slate-200/75 bg-[linear-gradient(180deg,#fffdfa_0%,#ffffff_100%)] px-4 py-3 pr-10 text-base text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_10px_22px_rgba(148,163,184,0.07)] outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-400/28 md:py-3.5"
                              />
                              <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-medium text-slate-400">
                                %
                              </span>
                            </div>
                          </label>
                        </div>

                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => setCurrentFitStep(2)}
                            className={`${buttonStyles.primary} w-full sm:w-auto`}
                          >
                            Continue
                            <ArrowRight className="ml-2 h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {currentFitStep === 2 && (
                      <div className="space-y-4 md:space-y-5">
                        <p className="max-w-xl text-sm leading-6 text-slate-600 md:leading-7">
                          Add the project type and how long it needs to matter.
                          This keeps the tool renovation-first instead of purely financial.
                        </p>

                        <div className="grid gap-3.5 md:grid-cols-2 md:gap-5">
                          <label className="block">
                            <span className="text-sm font-semibold tracking-[-0.01em] text-slate-900">
                              Renovation type
                            </span>
                            <select
                              value={fitCalculator.renovationType}
                              onChange={(event) =>
                                updateFitField(
                                  'renovationType',
                                  event.target.value
                                )
                              }
                                className="mt-2 w-full rounded-2xl border border-slate-200/75 bg-[linear-gradient(180deg,#fffdfa_0%,#ffffff_100%)] px-4 py-3 text-base text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_10px_22px_rgba(148,163,184,0.07)] outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-400/28 md:mt-3 md:py-3.5"
                            >
                              {renovationTypeOptions.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="block">
                            <span className="text-sm font-semibold tracking-[-0.01em] text-slate-900">
                              Ownership timeline
                            </span>
                            <select
                              value={fitCalculator.ownershipTimeline}
                              onChange={(event) =>
                                updateFitField(
                                  'ownershipTimeline',
                                  event.target.value
                                )
                              }
                                className="mt-2 w-full rounded-2xl border border-slate-200/75 bg-[linear-gradient(180deg,#fffdfa_0%,#ffffff_100%)] px-4 py-3 text-base text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_10px_22px_rgba(148,163,184,0.07)] outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-400/28 md:mt-3 md:py-3.5"
                            >
                              {ownershipTimelineOptions.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>

                        <SegmentedControl
                          label="Rental or income potential"
                          options={rentalPotentialOptions}
                          value={fitCalculator.rentalPotential}
                          onChange={(option) =>
                            updateFitField('rentalPotential', option)
                          }
                        />

                        <div className="flex flex-col gap-3 pt-1 sm:flex-row">
                          <button
                            type="button"
                            onClick={() => {
                              setShowFitPreview(false);
                              setFitValidationMessage('');
                              setCurrentFitStep(1);
                            }}
                            className="inline-flex items-center justify-center rounded-[0.8rem] border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                          >
                            Back
                          </button>
                          <button
                            type="button"
                            onClick={() => setCurrentFitStep(3)}
                            className={`${buttonStyles.primary} w-full sm:w-auto`}
                          >
                            Continue
                            <ArrowRight className="ml-2 h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {currentFitStep === 3 && (
                      <div className="space-y-4 md:space-y-5">
                        <p className="max-w-xl text-sm leading-6 text-slate-600 md:leading-7">
                          Finish with the factors that most often change a renovation
                          from a clear fit into something that needs closer review.
                        </p>

                        <div className="space-y-4 md:space-y-5">
                          <SegmentedControl
                            label="Scope clarity"
                            options={scopeClarityOptions}
                            value={fitCalculator.scopeClarity}
                            onChange={(option) =>
                              updateFitField('scopeClarity', option)
                            }
                          />

                          <SegmentedControl
                            label="Permit complexity"
                            options={permitComplexityOptions}
                            value={fitCalculator.permitComplexity}
                            onChange={(option) =>
                              updateFitField('permitComplexity', option)
                            }
                          />

                          <SegmentedControl
                            label="Grant involvement"
                            options={grantInvolvementOptions}
                            value={fitCalculator.grantInvolvement}
                            onChange={(option) =>
                              updateFitField('grantInvolvement', option)
                            }
                          />
                        </div>

                        <div className="flex flex-col gap-3 pt-1 sm:flex-row">
                          <button
                            type="button"
                            onClick={() => {
                              setShowFitPreview(false);
                              setFitValidationMessage('');
                              setCurrentFitStep(2);
                            }}
                            className="inline-flex items-center justify-center rounded-[0.8rem] border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                          >
                            Back
                          </button>
                          <button
                            type="button"
                            onClick={runFitAssessment}
                            className={`${buttonStyles.primary} w-full sm:w-auto`}
                          >
                            See Renovation Fit
                            <ArrowRight className="ml-2 h-5 w-5" />
                          </button>
                        </div>
                        {fitValidationMessage ? (
                          <p className="text-sm leading-7 text-slate-500">
                            {fitValidationMessage}
                          </p>
                        ) : null}
                      </div>
                    )}
                  </div>

                    <p className="mt-5 text-[0.8rem] leading-6 text-slate-500/72 md:mt-7 md:text-[0.88rem] md:leading-7">
                    This tool is for renovation planning and educational use only.
                    It does not provide lending advice, approvals, qualification
                    decisions, or a repayment plan. OntarioReno is not a lender,
                    bank, or mortgage broker.
                  </p>
                </div>
              </div>
            </div>

            {showFitPreview && fitResult && (
              <div ref={fitResultRef} className="relative min-w-0 w-full scroll-mt-24">
                  <div className="rounded-[1.7rem] border border-slate-300/82 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.995),rgba(251,252,254,0.98)_40%),linear-gradient(180deg,rgba(255,255,255,0.985)_0%,rgba(245,248,252,0.985)_100%)] px-4 py-4 shadow-[0_36px_88px_rgba(15,23,42,0.16)] ring-1 ring-white/58 transition-all duration-300 ease-out md:rounded-[2rem] md:px-8 md:py-8">
                  <div className="grid w-full min-w-0 max-w-full gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(300px,0.92fr)] lg:gap-8">
                    <div className="min-w-0">
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
                        Result preview
                      </p>
                      <p className="mt-4 inline-flex rounded-full border border-slate-200 bg-white/85 px-3 py-1.5 text-sm font-semibold text-slate-900">
                        {fitResult.fitLabel}
                      </p>
                      <h3 className="mt-4 break-words text-[1.9rem] font-bold leading-[1.04] tracking-[-0.04em] text-slate-950 md:text-[2.8rem]">
                        {fitResult.fitLabel}
                      </h3>
                      <p className="mt-3 max-w-xl text-[0.98rem] leading-7 text-slate-600 md:mt-4 md:text-[1rem] md:leading-8">
                        {fitResult.fitInterpretation}
                      </p>

                      <div className="mt-5 max-w-full md:mt-7">
                        <p className="text-sm font-semibold tracking-[-0.01em] text-slate-900">
                          Renovation Fit Spectrum
                        </p>
                          <div className="mt-3 w-full max-w-full overflow-hidden rounded-[1.35rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(248,250,252,0.92)_100%)] p-2.5 ring-1 ring-slate-200/82 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] md:mt-4 md:rounded-[1.6rem] md:p-3">
                          <div className="grid w-full min-w-0 grid-cols-[1fr_1.14fr_1fr] gap-2">
                            {[
                              {
                                label: 'Caution',
                                active: fitResult.fitLabel === 'Caution',
                              },
                              {
                                label: 'Needs review',
                                active: fitResult.fitLabel === 'Needs review',
                              },
                              {
                                label: 'Strong fit',
                                active: fitResult.fitLabel === 'Strong fit',
                              },
                            ].map((band) => (
                              <div
                                key={band.label}
                                className={`flex min-h-[52px] min-w-0 items-center justify-center rounded-[0.95rem] px-1.5 py-3 text-center text-[0.72rem] font-semibold leading-tight transition md:min-h-[56px] md:rounded-[1rem] md:px-2 md:text-[0.8rem] md:whitespace-nowrap ${
                                  band.active
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-slate-100/85 text-slate-500'
                                }`}
                              >
                                {band.label}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                  <div className="min-w-0 space-y-5 lg:border-l lg:border-slate-200/80 lg:pl-8 lg:space-y-7">
                      <div>
                        <p className="text-sm font-semibold tracking-[-0.01em] text-slate-900">
                          What strengthens this project
                        </p>
                        <ul className="mt-3 space-y-3 text-sm leading-7 text-slate-600">
                          {fitResult.strengths.map((note) => (
                            <li key={note} className="flex items-start gap-3">
                              <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                              <span>{note}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <p className="text-sm font-semibold tracking-[-0.01em] text-slate-900">
                          What needs review
                        </p>
                        <ul className="mt-3 space-y-3 text-sm leading-7 text-slate-600">
                          {fitResult.needsReview.map((note) => (
                            <li key={note} className="flex items-start gap-3">
                              <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                              <span>{note}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                <div className="mt-5 rounded-[1.3rem] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.82),rgba(244,247,250,0.92)_34%),linear-gradient(180deg,rgba(241,246,250,0.96)_0%,rgba(235,241,246,0.98)_100%)] px-3.5 py-3.5 ring-1 ring-slate-200/58 shadow-[inset_0_1px_0_rgba(255,255,255,0.76)] md:mt-8 md:rounded-[1.6rem] md:px-6 md:py-5">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Supporting numbers
                    </p>
                    <div className="mt-4 space-y-2.5 md:mt-6 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                        <div className="rounded-lg border border-slate-200/38 bg-[linear-gradient(180deg,rgba(255,255,255,0.52)_0%,rgba(247,249,252,0.68)_100%)] px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] md:rounded-2xl md:px-4 md:py-4">
                        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Total estimated equity
                        </p>
                        <p className="mt-3 text-[1.15rem] font-semibold leading-7 tracking-[-0.02em] text-slate-900">
                          {formatCadCurrency(fitResult.totalEstimatedEquity)}
                        </p>
                      </div>
                        <div className="rounded-lg border border-slate-200/38 bg-[linear-gradient(180deg,rgba(255,255,255,0.52)_0%,rgba(247,249,252,0.68)_100%)] px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] md:rounded-2xl md:px-4 md:py-4">
                        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Estimated usable equity
                        </p>
                        <p className="mt-3 text-[1.15rem] font-semibold leading-7 tracking-[-0.02em] text-slate-900">
                          {formatCadCurrency(fitResult.estimatedUsableEquity)}
                        </p>
                        <p className="mt-3 max-w-sm text-[0.88rem] leading-6 text-slate-500">
                          Based on a simplified 80% loan-to-value planning assumption. This is not an approval estimate.
                        </p>
                      </div>
                        <div className="rounded-lg border border-slate-200/38 bg-[linear-gradient(180deg,rgba(255,255,255,0.52)_0%,rgba(247,249,252,0.68)_100%)] px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] md:rounded-2xl md:px-4 md:py-4">
                        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Carrying cost
                        </p>
                        <p className="mt-3 text-[1.15rem] font-semibold leading-7 tracking-[-0.02em] text-slate-900">
                          {formatMonthlyCad(fitResult.interestOnlyMonthlyCost)}
                        </p>
                        <p className="mt-3 max-w-sm text-[0.88rem] leading-6 text-slate-500">
                          This is carrying-cost context only, not a full repayment plan.
                        </p>
                      </div>
                        <div className="rounded-lg border border-slate-200/38 bg-[linear-gradient(180deg,rgba(255,255,255,0.52)_0%,rgba(247,249,252,0.68)_100%)] px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] md:rounded-2xl md:px-4 md:py-4">
                        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Budget pressure
                        </p>
                        {fitResult.budgetPercentOfUsableEquity === null ? (
                          <p className="mt-3 max-w-sm text-[0.96rem] leading-7 text-slate-600">
                            Not enough estimated usable equity based on the planning assumption.
                          </p>
                        ) : (
                          <>
                            <p className="mt-3 text-[1.15rem] font-semibold leading-7 tracking-[-0.02em] text-slate-900">
                              {formatPercent(fitResult.budgetPercentOfUsableEquity)} of usable equity
                            </p>
                            <p className="mt-3 max-w-sm text-[0.88rem] leading-6 text-slate-500">
                              {fitResult.equityPressureLabel}
                            </p>
                          </>
                        )}
                      </div>
                        <div className="rounded-lg border border-slate-200/38 bg-[linear-gradient(180deg,rgba(255,255,255,0.52)_0%,rgba(247,249,252,0.68)_100%)] px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] md:col-span-2 md:rounded-2xl md:px-4 md:py-4">
                        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Estimated draw amount
                        </p>
                        <p className="mt-3 text-[1.15rem] font-semibold leading-7 tracking-[-0.02em] text-slate-900">
                          {formatCadCurrency(fitResult.estimatedDrawAmount)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-slate-200/80 pt-4 md:mt-8 md:pt-6">
                    <div className="grid gap-3 md:grid-cols-2">
                      <Link
                        to="/match"
                        className={buttonStyles.primary}
                      >
                        {fitResult.primaryCtaLabel}
                      </Link>
                      <Link
                        to="/costs"
                        className={buttonStyles.secondary}
                      >
                        {fitResult.secondaryCtaLabel}
                      </Link>
                    </div>
                  </div>

                    <p className="mt-5 text-[0.8rem] leading-6 text-slate-500/72 md:mt-6 md:text-[0.88rem] md:leading-7">
                    This tool is for renovation planning and educational use only.
                    It does not provide lending advice, approvals, qualification
                    decisions, or a repayment plan. OntarioReno is not a lender,
                    bank, or mortgage broker.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Compare your options */}
      <section className="bg-white py-16 lg:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
              Your options
            </p>
            <h2 className="mt-3 text-[1.9rem] font-bold leading-[1.08] tracking-[-0.035em] text-slate-950 md:text-[2.5rem]">
              Compare the ways to pay
            </h2>
            <p className="mt-4 text-[1rem] leading-7 text-slate-600 md:text-[1.05rem]">
              Equity is one path, not the only one. Each guide goes deeper.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {financingPaths.map((path) => {
              const Icon = path.icon;
              return (
                <article
                  key={path.title}
                  className="flex flex-col rounded-[1.25rem] border border-slate-200/80 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-[#1B3C6C]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="text-[1.2rem] font-semibold tracking-[-0.02em] text-slate-950">
                      {path.title}
                    </h3>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-600">{path.body}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    <span className="font-semibold text-slate-700">Best for:</span>{' '}
                    {path.bestFor}
                  </p>
                  <Link
                    to={path.href}
                    className="mt-5 inline-flex items-center text-sm font-semibold text-[#1B3C6C] hover:underline"
                  >
                    {path.linkText}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </article>
              );
            })}
          </div>

          <div className="mt-8 space-y-2 border-t border-slate-200/80 pt-6 text-sm leading-6 text-slate-600">
            <p>
              Building a rental unit? See{' '}
              <Link
                to="/financing/heloc-for-legal-basement-apartment"
                className="font-medium text-[#1B3C6C] hover:underline"
              >
                legal basement apartment financing
              </Link>{' '}
              or{' '}
              <Link
                to="/financing/garden-suite-financing-ontario"
                className="font-medium text-[#1B3C6C] hover:underline"
              >
                garden suite financing
              </Link>
              .
            </p>
            <p>
              Grants can lower how much you need to borrow. See{' '}
              <Link
                to="/financing/grants-and-incentives-with-home-equity"
                className="font-medium text-[#1B3C6C] hover:underline"
              >
                using grants with home equity
              </Link>{' '}
              or{' '}
              <Link to="/grants" className="font-medium text-[#1B3C6C] hover:underline">
                Ontario grants open now
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] py-16 lg:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
            Frequently asked questions
          </p>
          <h2 className="mt-3 text-[1.9rem] font-bold leading-[1.08] tracking-[-0.035em] text-slate-950 md:text-[2.5rem]">
            Questions before using home equity
          </h2>

          <div className="mt-8 divide-y divide-slate-200/80 md:mt-10">
            {faqItems.map((item) => (
              <details
                key={item.question}
                className="group px-0 py-4 md:py-5"
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-left">
                  <span className="max-w-3xl break-words text-[0.98rem] font-semibold leading-7 tracking-[-0.02em] text-slate-950 md:text-[1.08rem]">
                    {item.question}
                  </span>
                  <span className="mt-1 text-sm font-semibold text-slate-400 transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-3xl text-[0.94rem] leading-7 text-slate-600 md:text-[0.98rem]">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.12),transparent_28%),linear-gradient(180deg,#0f172a_0%,#020617_100%)] py-16 text-white lg:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-[1.9rem] font-bold leading-[1.08] tracking-[-0.035em] text-white md:text-[2.6rem]">
            Plan the renovation before you commit the equity
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[1rem] leading-7 text-slate-300">
            We review the scope, permit path and cost with you first, so you
            know whether equity belongs in the plan.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/match" className={buttonStyles.primary}>
              Start Project Review
            </Link>
            <Link
              to="/costs"
              className="inline-flex items-center justify-center rounded-[0.8rem] border border-white/18 bg-white/8 px-7 py-[0.95rem] text-base font-semibold tracking-[-0.015em] text-white transition duration-200 hover:bg-white/12 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20"
            >
              Explore Renovation Costs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
