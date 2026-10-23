import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { HeroHouse } from '../components/HeroHouse';
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  Landmark,
  Layers3,
  Scale,
  Wrench,
} from 'lucide-react';
import { buttonStyles, eyebrowStyles } from '../lib/uiStyles';

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

const heroPoints = [
  'Borrow up to 80% of your home’s value, minus what you still owe.',
  'With a HELOC, you pay interest only on what you actually draw.',
];

// Qualitative on purpose: no ROI, rent, or payback figures without a source.
const projectScenarios = [
  {
    title: 'Legal secondary suite',
    tag: 'Rental income',
    body: 'A legal unit can bring in rent and add lasting value, the strongest case for using equity.',
    href: '/financing/heloc-for-legal-basement-apartment',
    linkText: 'Legal suite financing',
    image: '/images/after-image-hero.jpg',
    alt: 'Finished basement suite with living and dining area',
  },
  {
    title: 'Garden suite',
    tag: 'Rental or family',
    body: 'A backyard unit for rent or family. Servicing and site fit decide whether it pencils out.',
    href: '/financing/garden-suite-financing-ontario',
    linkText: 'Garden suite financing',
    image: '/images/garden-suite.jpg',
    alt: 'Detached garden suite in an Ontario backyard',
  },
  {
    title: 'Basement finish',
    tag: 'Living space',
    body: 'More usable space for the household. Works best when the scope is clear and you plan to stay.',
    href: '/basements',
    linkText: 'Plan a basement',
    image: '/images/workspace-renovation-interior.jpg',
    alt: 'Finished basement with built-in office storage',
  },
  {
    title: 'Addition or major overhaul',
    tag: 'Long-term value',
    body: 'Large structural projects on a home you will keep are where a refinance is often compared.',
    href: '/financing/heloc-vs-refinance-for-renovations',
    linkText: 'HELOC vs refinance',
    image: '/images/unfinished-basement-framing.jpg',
    alt: 'Wood framing during a major renovation',
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
              className={`max-w-full min-w-0 whitespace-normal break-words rounded-full border px-4 py-2 text-center text-sm font-medium leading-5 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 ${
                isActive
                  ? 'border-slate-900 bg-slate-900 text-white shadow-[0_10px_22px_rgba(15,23,42,0.12)]'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-[#2b5a96] hover:text-[#1B3C6C]'
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
  const [quickHomeValue, setQuickHomeValue] = useState(950000);
  const [quickMortgage, setQuickMortgage] = useState(420000);
  const quickUsableEquity = Math.max(quickHomeValue * 0.8 - quickMortgage, 0);

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

      {/* A · Hero — white, 60/40. The right card is live: drag the sliders and
          the usable-equity figure updates, so the page gives value before it
          asks for anything. */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-center lg:gap-14 lg:px-8 lg:pb-24 lg:pt-20">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-[0.8rem] font-medium text-[#1B3C6C]">
              <Scale className="h-3.5 w-3.5" />
              Ontario homeowner planning guide
            </p>

            <h1 className="mt-6 max-w-2xl text-[2.45rem] font-bold leading-[1.02] tracking-[-0.045em] text-slate-950 md:text-[3.4rem] lg:text-[3.9rem]">
              Using Home Equity for Renovations in Ontario
            </h1>

            <p className="mt-6 max-w-xl text-[1.05rem] leading-8 text-slate-600 md:text-[1.15rem]">
              A HELOC or refinance can fund a bigger project. First, make sure
              the renovation itself is worth borrowing against your home for.
            </p>

            <ul className="mt-7 space-y-3">
              {heroPoints.map((point) => (
                <li key={point} className="flex items-start gap-3 text-[0.98rem] leading-7 text-slate-700">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[#2b5a96]" />
                  {point}
                </li>
              ))}
            </ul>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a href="#calculator" className={buttonStyles.primary}>
                Calculate my equity limit
                <ArrowRight className="h-5 w-5" />
              </a>
              <Link to="/match" className={buttonStyles.secondary}>
                Start Project Review
              </Link>
            </div>
          </div>

          <div className="min-w-0">
            <HeroHouse>
            <div className="rounded-[1.6rem] bg-[#0F172A] p-6 text-white shadow-[0_30px_70px_rgba(15,23,42,0.28)] ring-1 ring-slate-900/5 sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-blue-200">
                  Quick equity check
                </p>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[0.7rem] font-medium text-slate-300">
                  Estimate
                </span>
              </div>

              <div className="mt-6 space-y-6">
                <label className="block">
                  <span className="flex items-baseline justify-between gap-4 text-sm">
                    <span className="text-slate-300">Home value</span>
                    <span className="font-semibold tabular-nums">{formatCadCurrency(quickHomeValue)}</span>
                  </span>
                  <input
                    type="range"
                    min={300000}
                    max={3000000}
                    step={10000}
                    value={quickHomeValue}
                    onChange={(event) => setQuickHomeValue(Number(event.target.value))}
                    aria-label="Home value"
                    style={{ '--fill': `${((quickHomeValue - 300000) / 2700000) * 100}%` } as CSSProperties}
                    className="equity-range mt-4 w-full"
                  />
                </label>

                <label className="block">
                  <span className="flex items-baseline justify-between gap-4 text-sm">
                    <span className="text-slate-300">Mortgage owing</span>
                    <span className="font-semibold tabular-nums">{formatCadCurrency(quickMortgage)}</span>
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={2500000}
                    step={5000}
                    value={quickMortgage}
                    onChange={(event) => setQuickMortgage(Number(event.target.value))}
                    aria-label="Mortgage owing"
                    style={{ '--fill': `${((quickMortgage - 0) / 2500000) * 100}%` } as CSSProperties}
                    className="equity-range mt-4 w-full"
                  />
                </label>
              </div>

              <div className="mt-7 rounded-2xl bg-white/[0.06] p-5 ring-1 ring-white/10">
                <p className="text-sm text-slate-300">Estimated equity access</p>
                <p className="mt-1 text-[2.4rem] font-bold leading-none tracking-[-0.04em] tabular-nums md:text-[2.7rem]">
                  <span key={quickUsableEquity} className="equity-pop">
                    {formatCadCurrency(quickUsableEquity)}
                  </span>
                </p>
                <p className="mt-3 text-xs leading-5 text-slate-400">
                  80% of value minus your mortgage. Your real limit depends on
                  appraisal and lender approval.
                </p>
              </div>

              <a
                href="#calculator"
                className="mt-5 inline-flex items-center text-sm font-semibold text-sky-300 hover:underline"
              >
                Is this project worth it? Run the full fit check
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </div>
            </HeroHouse>
          </div>
        </div>
      </section>

      {/* B · HELOC fit calculator — dark band so the tool reads as a tool: the
          light card inside it is the highest-contrast object on the page. */}
      <section
        id="calculator"
        className="relative scroll-mt-24 overflow-hidden bg-[#0F172A] py-20 lg:scroll-mt-28 lg:py-28"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(56,189,248,0.16),transparent_70%)]" />

        <div className="relative mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8">
          <div className="mx-auto min-w-0 max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-300">
              Planning tool
            </p>
            <h2 className="mt-3 break-words text-[1.9rem] font-bold leading-[1.08] tracking-[-0.035em] text-white md:text-[2.6rem]">
              HELOC Renovation Fit Calculator
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[1.05rem] leading-7 text-slate-300 md:text-[1.08rem] md:leading-8">
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
              <div className="min-w-0">
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
                                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_10px_22px_rgba(148,163,184,0.07)] outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-[#2b5a96] focus:bg-white focus:ring-4 focus:ring-blue-100 md:mt-3 md:py-3.5"
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
                                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_10px_22px_rgba(148,163,184,0.07)] outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-[#2b5a96] focus:bg-white focus:ring-4 focus:ring-blue-100 md:mt-3 md:py-3.5"
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
                                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_10px_22px_rgba(148,163,184,0.07)] outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-[#2b5a96] focus:bg-white focus:ring-4 focus:ring-blue-100 md:mt-3 md:py-3.5"
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
                                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 pr-10 text-base text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_10px_22px_rgba(148,163,184,0.07)] outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-[#2b5a96] focus:bg-white focus:ring-4 focus:ring-blue-100 md:py-3.5"
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
                                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_10px_22px_rgba(148,163,184,0.07)] outline-none transition hover:border-slate-400 focus:border-[#2b5a96] focus:bg-white focus:ring-4 focus:ring-blue-100 md:mt-3 md:py-3.5"
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
                                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_10px_22px_rgba(148,163,184,0.07)] outline-none transition hover:border-slate-400 focus:border-[#2b5a96] focus:bg-white focus:ring-4 focus:ring-blue-100 md:mt-3 md:py-3.5"
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

      {/* C · Compare — three columns, HELOC highlighted. Phased stays linked
          underneath so that guide keeps its link from this page. */}
      <section className="bg-[#F8FAFC] py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className={eyebrowStyles}>Your options</p>
            <h2 className="mt-3 text-[2rem] font-bold leading-[1.1] tracking-[-0.035em] text-slate-950 md:text-[2.6rem]">
              Compare the ways to pay
            </h2>
            <p className="mt-4 text-[1.05rem] leading-7 text-slate-600">
              Equity is one path, not the only one. Each guide goes deeper.
            </p>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3 lg:items-stretch">
            {financingPaths
              .filter((path) => path.title !== 'Phased approach')
              .map((path) => {
                const Icon = path.icon;
                const featured = path.title === 'HELOC';
                return (
                  <Link
                    key={path.title}
                    to={path.href}
                    className={`group relative flex flex-col rounded-[1.4rem] border bg-white p-7 transition-all duration-200 hover:-translate-y-1 ${
                      featured
                        ? 'border-[#2b5a96] shadow-[0_24px_50px_rgba(43,90,150,0.18)] ring-1 ring-[#2b5a96] lg:-mt-3 lg:pb-10'
                        : 'border-slate-200 shadow-sm hover:shadow-md'
                    }`}
                  >
                    {featured && (
                      <span className="absolute -top-3 left-7 rounded-full bg-[#2b5a96] px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-white">
                        Most flexible for phased builds
                      </span>
                    )}
                    <span
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                        featured ? 'bg-[#2b5a96] text-white' : 'bg-slate-100 text-[#1B3C6C]'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-5 text-[1.35rem] font-semibold tracking-[-0.02em] text-slate-950">
                      {path.title}
                    </h3>
                    <p className="mt-3 flex-1 text-[0.97rem] leading-7 text-slate-600">{path.body}</p>
                    <p className="mt-6 border-t border-slate-100 pt-5 text-sm leading-6 text-slate-600">
                      <span className="block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Best for
                      </span>
                      <span className="mt-1 block font-medium text-slate-800">{path.bestFor}</span>
                    </p>
                    <span className="mt-6 inline-flex items-center text-sm font-semibold text-[#1B3C6C]">
                      {path.linkText}
                      <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
                    </span>
                  </Link>
                );
              })}
          </div>

          <p className="mt-10 text-center text-sm text-slate-600">
            Rather stage the work than borrow more up front?{' '}
            <Link
              to="/financing/phased-renovation-financing"
              className="font-semibold text-[#1B3C6C] hover:underline"
            >
              Phased renovation financing
            </Link>
          </p>
        </div>
      </section>

      {/* D · Project scenarios — 2×2, image-led. No ROI or income figures: we
          don't have a source for them, and this page must not promise money. */}
      <section className="bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className={eyebrowStyles}>Project scenarios</p>
            <h2 className="mt-3 text-[2rem] font-bold leading-[1.1] tracking-[-0.035em] text-slate-950 md:text-[2.6rem]">
              Where equity tends to make sense
            </h2>
            <p className="mt-4 text-[1.05rem] leading-7 text-slate-600">
              The strongest cases add rental income or lasting value. Each still
              has to pass permits and cost first.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {projectScenarios.map((scenario) => (
              <Link
                key={scenario.title}
                to={scenario.href}
                className="group overflow-hidden rounded-[1.4rem] border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(15,23,42,0.1)]"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                  <img
                    src={scenario.image}
                    alt={scenario.alt}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-white/92 px-3 py-1 text-[0.72rem] font-semibold text-[#1B3C6C] shadow-sm">
                    {scenario.tag}
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="text-[1.2rem] font-semibold tracking-[-0.02em] text-slate-950">
                    {scenario.title}
                  </h3>
                  <p className="mt-2 text-[0.95rem] leading-7 text-slate-600">{scenario.body}</p>
                  <span className="mt-4 inline-flex items-center text-sm font-semibold text-[#1B3C6C]">
                    {scenario.linkText}
                    <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <p className="mt-10 text-sm text-slate-600">
            Grants can lower what you borrow. See{' '}
            <Link
              to="/financing/grants-and-incentives-with-home-equity"
              className="font-semibold text-[#1B3C6C] hover:underline"
            >
              using grants with home equity
            </Link>{' '}
            or{' '}
            <Link to="/grants" className="font-semibold text-[#1B3C6C] hover:underline">
              Ontario grants open now
            </Link>
            .
          </p>
        </div>
      </section>

      {/* E · Conversion module — a branded box on a light band, so it reads as
          the one place to act rather than another paragraph. */}
      <section className="bg-[#F8FAFC] py-20 lg:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2rem] bg-[#1B3C6C] text-white shadow-[0_40px_80px_rgba(27,60,108,0.3)]">
            <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-sky-400/20 blur-3xl" />
            <div className="relative grid gap-10 p-8 md:p-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14 lg:p-14">
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-sky-200">
                  Free project review
                </p>
                <h2 className="mt-3 text-[1.9rem] font-bold leading-[1.1] tracking-[-0.035em] md:text-[2.4rem]">
                  Know the project is sound before you borrow a dollar
                </h2>
                <p className="mt-4 max-w-md text-[1.02rem] leading-7 text-blue-100">
                  Tell us about the renovation and we'll look at it with you
                  before any financing decision.
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

              <ol className="space-y-3">
                {decisionSteps.map((item) => (
                  <li
                    key={item.title}
                    className="flex gap-4 rounded-2xl bg-white/[0.07] p-4 ring-1 ring-white/10"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/12 text-sm font-bold">
                      {item.step}
                    </span>
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="mt-0.5 text-sm leading-6 text-blue-100">{item.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-20 lg:py-28">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16 lg:px-8">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className={eyebrowStyles}>Frequently asked questions</p>
            <h2 className="mt-3 text-[2rem] font-bold leading-[1.1] tracking-[-0.035em] text-slate-950 md:text-[2.6rem]">
              Questions before using home equity
            </h2>
            <p className="mt-4 text-[1rem] leading-7 text-slate-600">
              Not sure what the project will cost yet?{' '}
              <Link to="/costs" className="font-semibold text-[#1B3C6C] hover:underline">
                See Ontario renovation costs
              </Link>
              .
            </p>
          </div>

          <div className="divide-y divide-slate-200 rounded-[1.4rem] border border-slate-200 bg-white px-6 shadow-sm md:px-8">
            {faqItems.map((item) => (
              <details key={item.question} className="group py-5">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-5 text-left">
                  <span className="text-[1rem] font-semibold leading-7 tracking-[-0.015em] text-slate-950 md:text-[1.05rem]">
                    {item.question}
                  </span>
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-200 text-sm text-slate-500 transition group-open:rotate-45 group-open:border-[#1B3C6C] group-open:text-[#1B3C6C]">
                    +
                  </span>
                </summary>
                <p className="mt-3 pr-8 text-[0.96rem] leading-7 text-slate-600">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA — dark slate, bookends the calculator band. */}
      <section className="bg-[#0F172A] py-20 text-white lg:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-[2rem] font-bold leading-[1.1] tracking-[-0.035em] md:text-[2.6rem]">
            Plan the renovation before you commit the equity
          </h2>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/match" className={buttonStyles.primary}>
              Start Project Review
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link to="/costs" className={buttonStyles.ghostDark}>
              Explore Renovation Costs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
