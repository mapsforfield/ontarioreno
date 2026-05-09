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

const mapNavItems = [
  {
    step: '01',
    title: 'Define the renovation',
    body: 'Clarify the scope before financing decisions start to distort the project.',
    href: '#define-the-renovation',
    type: 'anchor' as const,
  },
  {
    step: '02',
    title: 'Test feasibility',
    body: 'Check the permit path, compliance load, and hidden complexity risk.',
    href: '#test-feasibility',
    type: 'anchor' as const,
  },
  {
    step: '03',
    title: 'Check value or income logic',
    body: 'Pressure-test whether the renovation truly earns the equity.',
    href: '#value-income-logic',
    type: 'anchor' as const,
  },
  {
    step: '04',
    title: 'Choose the financing path',
    body: 'Compare the path only after the renovation itself makes sense.',
    href: '#choose-the-financing-path',
    type: 'anchor' as const,
  },
];

const guideCoverageItems = [
  {
    label: 'Ontario renovation costs',
    href: '/costs',
  },
  {
    label: 'Basement renovation planning',
    href: '/basements',
  },
  {
    label: 'Legal basement apartment planning',
    href: '/legal-suites',
  },
  {
    label: 'Garden suite planning',
    href: '/garden-suites',
  },
  {
    label: 'HELOC vs refinance',
    href: '/financing/heloc-vs-refinance-for-renovations',
  },
  {
    label: 'HELOC vs renovation financing',
    href: '/financing/heloc-vs-contractor-financing',
  },
  {
    label: 'Grants and incentives',
    href: '/grant-eligibility-calculator',
  },
  {
    label: 'Project review',
    href: '/match',
  },
];

const projectFitStrong = [
  {
    title: 'Legal basement apartment',
    body:
      'Often carries stronger rental and property-value logic when the suite can actually be built to a legal standard.',
    href: '/financing/heloc-for-legal-basement-apartment',
    linkText: 'Explore legal suite financing',
  },
  {
    title: 'Garden suite',
    body:
      'Can justify equity more naturally when site fit, servicing, and income logic are all strong enough to support the build.',
    href: '/financing/garden-suite-financing-ontario',
    linkText: 'Explore garden suite financing',
  },
  {
    title: 'Home addition',
    body:
      'Larger, long-term household projects often make more sense for equity use when the ownership horizon is meaningful.',
    href: '/financing/heloc-vs-refinance-for-renovations',
    linkText: 'Compare larger-project financing',
  },
];

const projectFitCaution = [
  'Mostly cosmetic upgrades with weak long-term project logic.',
  'Renovations where the scope is still moving too much to price responsibly.',
  'Projects tied to a short ownership horizon or speculative payoff assumptions.',
];

const financingPaths = [
  {
    title: 'HELOC',
    icon: Compass,
    body:
      'Usually the most natural path when the renovation already makes strategic sense and the homeowner wants flexible access to equity.',
    bestFor: 'Defined, higher-value renovations with stronger long-term logic.',
    href: '/open-loan-financing',
    linkText: 'See financing flexibility',
  },
  {
    title: 'Refinance',
    icon: Landmark,
    body:
      'Can make more sense when the renovation is large enough to justify a broader borrowing reset and the property will likely be held for longer.',
    bestFor: 'Bigger projects with a longer ownership horizon.',
    href: '/financing/heloc-vs-refinance-for-renovations',
    linkText: 'Compare HELOC vs refinance',
  },
  {
    title: 'Renovation financing',
    icon: Wrench,
    body:
      'Can make sense for cleaner project scopes where payment structure, staged funding, or renovation-specific flexibility matters more than long-term borrowing access.',
    bestFor: 'Cleaner project scopes with more emphasis on funding structure.',
    href: '/financing/heloc-vs-contractor-financing',
    linkText: 'Compare HELOC vs renovation financing',
  },
  {
    title: 'Phased approach',
    icon: Layers3,
    body:
      'Sometimes the smartest answer is not more financing, but a better sequence that handles must-do work first and leaves finish upgrades for later.',
    bestFor: 'Permit-heavy or evolving projects that benefit from staging.',
    href: '/financing/phased-renovation-financing',
    linkText: 'Explore phased renovation planning',
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

const ontarioLinks = [
  {
    title: 'Hamilton grant guide',
    body:
      "See how Hamilton's secondary suite funding can change the economics of a legal basement apartment project.",
    href: '/hamilton-grant-guide',
    linkText: 'Review Hamilton funding',
  },
  {
    title: 'Grant eligibility calculator',
    body:
      'Check whether a project appears to fit a real program path before incentives become part of the financing story.',
    href: '/grant-eligibility-calculator',
    linkText: 'Use the grant calculator',
  },
  {
    title: 'Using grants with home equity',
    body:
      'Understand how incentives can support a project without replacing the need for a viable renovation plan.',
    href: '/financing/grants-and-incentives-with-home-equity',
    linkText: 'Explore the planning guide',
  },
];

const confirmChecklist = [
  'A realistic renovation cost range based on actual Ontario project conditions.',
  'The likely permit path and what the renovation may trigger.',
  'Scope stability, including where the project could expand mid-project.',
  'Whether rental income or resale logic is truly strong enough to matter.',
  'Whether grants or incentives are actually available and relevant.',
  'How long you expect to keep the property after the renovation is complete.',
];

const ontarioRenoMethod = [
  {
    step: '01',
    title: 'Review project',
    body:
      'Start with the renovation itself, not the borrowing limit. Define what is being built, what may need to be legalized, and what could materially change the project path.',
  },
  {
    step: '02',
    title: 'Clarify cost and permit feasibility',
    body:
      'Pressure-test cost, permit, compliance, and scope assumptions before financing becomes the center of the conversation.',
  },
  {
    step: '03',
    title: 'Decide next step',
    body:
      'Move forward with clearer context about whether equity belongs in the plan and which renovation path actually fits the property.',
  },
];

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
  const [helocPath, refinancePath, renovationFinancingPath, phasedPath] =
    financingPaths;
  const HelocIcon = helocPath.icon;
  const RefinanceIcon = refinancePath.icon;
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
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_20%_10%,rgba(96,165,250,0.18),transparent_32%),radial-gradient(circle_at_78%_18%,rgba(148,163,184,0.12),transparent_34%)]" />
          <div className="absolute inset-y-0 right-[8%] w-px bg-gradient-to-b from-transparent via-white/70 to-transparent" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />
        </div>

          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,0.96fr)_minmax(380px,0.92fr)] lg:items-center lg:gap-14 lg:px-8 lg:py-20">
          <div className="relative z-10 min-w-0">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-100/90 bg-white/80 px-4 py-2 text-sm font-medium text-[#1B3C6C] backdrop-blur-sm">
              <Scale className="h-4 w-4" />
              Ontario homeowner planning guide
            </div>

            <h1 className="mt-5 max-w-4xl text-[2.7rem] font-bold leading-[0.93] tracking-[-0.055em] text-slate-950 md:text-[4.2rem] lg:text-[5.2rem]">
              Using Home Equity for Renovations in Ontario
            </h1>

            <p className="mt-4 max-w-2xl text-[0.98rem] leading-7 text-slate-600 md:text-[1.1rem] md:leading-8 lg:text-[1.42rem] lg:leading-9">
              Decide whether the renovation itself justifies using equity before
              you treat financing as the answer.
            </p>

            <p className="mt-3 max-w-xl text-[0.92rem] leading-6 text-slate-500 md:text-[0.98rem] md:leading-7">
              This guide is built for Ontario homeowners planning larger renovation
              projects where scope, permits, value, or rental logic may make using
              home equity part of the conversation.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link to="/match" className={buttonStyles.primary}>
                Start Project Review
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link to="/costs" className={buttonStyles.secondary}>
                Explore Renovation Costs
              </Link>
            </div>

            <div className="mt-5 flex flex-wrap gap-x-3 gap-y-2 text-[0.64rem] uppercase tracking-[0.18em] text-slate-500 sm:text-[0.68rem]">
              <span>Scope</span>
              <span className="text-slate-300">/</span>
              <span>Permits</span>
              <span className="text-slate-300">/</span>
              <span>Value</span>
              <span className="text-slate-300">/</span>
              <span>Financing fit</span>
            </div>
          </div>

            <div className="relative z-10 min-w-0">
              <div className="relative mx-auto w-full max-w-[380px] lg:max-w-[580px]">
                <div className="pointer-events-none absolute inset-x-[8%] bottom-4 h-28 rounded-full bg-slate-300/18 blur-3xl" />

                <div className="relative overflow-hidden rounded-[2.2rem] border border-white/60 bg-white/36 shadow-[0_35px_90px_rgba(15,23,42,0.16)] backdrop-blur-sm">
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0.04)_52%,rgba(15,23,42,0.08)_100%)]" />

                  <div className="relative p-4 md:p-5">
                    <div className="relative overflow-hidden rounded-[1.8rem]">
                      <img
                        src="/images/planning-image.png"
                        alt="Ontario homeowner reviewing renovation planning documents at a table"
                        className="aspect-[1.28/1] w-full object-cover object-[center_top] md:aspect-[6/5]"
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.04)_0%,rgba(15,23,42,0.08)_32%,rgba(15,23,42,0.18)_100%)]" />

                      <div className="absolute left-5 top-5 rounded-full border border-white/35 bg-white/66 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 backdrop-blur-sm">
                        Planning-led
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 px-2 text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:justify-between sm:text-[0.68rem]">
                <span>Architectural planning</span>
                <span>Ontario renovation authority</span>
              </div>
            </div>
        </div>
      </section>

      {/* Minimal Transition Strip */}
      <section className="border-y border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.9)_0%,rgba(255,255,255,0.74)_100%)] backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex max-w-full items-center gap-3 overflow-x-auto whitespace-nowrap pb-1 pr-4 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-500 [scrollbar-width:none] [-ms-overflow-style:none]">
            <span className="text-slate-400">Decision map</span>
            {mapNavItems.map((item, index) => (
              <div key={item.title} className="flex items-center gap-3">
                <a
                  href={item.href}
                  className="transition hover:text-slate-900"
                >
                  <span className="text-slate-400">{item.step}</span>{' '}
                  <span className="text-slate-600">{item.title}</span>
                </a>
                {index < mapNavItems.length - 1 && (
                  <span className="text-slate-300">/</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What this guide covers */}
      <section className="bg-[linear-gradient(180deg,#ffffff_0%,#fbfcfe_100%)] py-10 lg:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
                What this guide covers
              </p>
              <h2 className="mt-3 text-[1.7rem] font-bold leading-[1.08] tracking-[-0.03em] text-slate-950 md:text-[2.25rem] lg:text-[2.5rem]">
                Ontario renovation financing, grounded in the project itself
              </h2>
              <p className="mt-4 text-[0.98rem] leading-7 text-slate-600 md:text-[1.02rem]">
                This Ontario renovation financing guide looks at{' '}
                <Link
                  to="/financing/heloc-vs-refinance-for-renovations"
                  className="font-medium text-[#1B3C6C] hover:underline"
                >
                  HELOCs for renovations
                </Link>
                , refinance comparisons, renovation financing, legal suites,
                garden suites, grants, project feasibility, permit
                considerations, and realistic renovation costs before equity
                becomes part of the plan.
              </p>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2">
              {guideCoverageItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className="rounded-2xl border border-slate-200/75 bg-white/72 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Editorial statement */}
      <section id="home-equity-guide" className="scroll-mt-24 overflow-hidden bg-white py-16 lg:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.72fr)] lg:items-end lg:gap-10 lg:px-8">
          <div className="relative z-10">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
              The real question
            </p>
            <div className="mt-6 max-w-4xl">
              <p className="text-[1rem] font-medium uppercase tracking-[0.16em] text-slate-500 md:text-[1.05rem]">
                The goal is not to borrow more.
              </p>
              <h2 className="mt-3 max-w-3xl text-[2.1rem] font-bold leading-[1.02] tracking-[-0.04em] text-slate-950 md:text-[3.2rem] lg:text-[4.1rem]">
                It is to know whether the renovation deserves the equity.
              </h2>
            </div>
            <div className="mt-7 max-w-3xl space-y-4 text-base leading-7 text-slate-600 md:text-[1.12rem] md:leading-8 lg:text-[1.28rem] lg:leading-9">
              <p>
                A HELOC, refinance, or renovation financing path can all look
                available before the Ontario renovation itself is actually ready
                for that kind of commitment.
              </p>
              <p>
                What matters first is whether the project is big enough, clear
                enough, and feasible enough to justify using the property as part
                of the plan. That is the real decision map for Ontario renovation
                planning.
              </p>
            </div>
          </div>

          <div className="pointer-events-none relative mt-6 mx-auto w-full max-w-[210px] opacity-95 sm:mt-7 sm:max-w-[250px] lg:mt-0 lg:mx-auto lg:w-full lg:max-w-none lg:opacity-100 lg:-ml-4">
            <div className="relative overflow-hidden">
              <img
                src="/images/heloc-image.png"
                alt="Illustration of a hand placing a coin into a house, representing home equity planning for renovations"
                className="mx-auto w-full object-contain lg:max-w-[380px]"
              />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white via-white/82 to-transparent sm:h-24 lg:h-32" />
            </div>
          </div>
        </div>
      </section>

      {/* Core Decision Map */}
      <section className="relative bg-[linear-gradient(180deg,#f3f6fb_0%,#f6f8fb_100%)] py-16 lg:py-32">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/70 to-transparent" />
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[230px_minmax(0,1fr)] lg:px-8">
          <aside className="hidden lg:block">
            <div className="sticky top-28 pl-1">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
                Core journey
              </p>
              <div className="mt-6 border-l border-slate-200 pl-4">
                {mapNavItems.slice(0, 4).map((item, index) => (
                  <a key={item.title} href={item.href} className="block py-4 first:pt-0">
                    <div className="flex gap-3">
                      <div className="w-8 shrink-0 pt-0.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        {item.step}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                        <p className="mt-1 text-xs leading-6 text-slate-500">{item.body}</p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </aside>

          <div className="min-w-0 w-full max-w-full space-y-8 md:space-y-10 lg:space-y-12">
            <div className="w-full min-w-0 max-w-full lg:hidden">
              <div className="flex w-full max-w-full gap-3 overflow-x-auto overscroll-x-contain pb-1 pr-4 [scrollbar-width:none] [-ms-overflow-style:none]">
                {mapNavItems.slice(0, 4).map((item) => (
                  <a
                    key={item.title}
                    href={item.href}
                    className="block max-w-[78vw] min-w-[170px] shrink-0 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 sm:min-w-[180px]"
                  >
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {item.step}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{item.title}</p>
                  </a>
                ))}
              </div>
            </div>
            <div className="min-w-0 w-full max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
                A practical path
              </p>
              <h2 className="mt-3 break-words text-[2rem] font-bold leading-[1.04] tracking-[-0.035em] text-slate-950 md:text-[2.9rem] lg:text-[3.6rem]">
                Deciding whether equity belongs in the renovation
              </h2>
              <p className="mt-4 max-w-2xl break-words text-[0.98rem] leading-7 text-slate-600 md:text-[1.02rem] md:leading-8 lg:text-[1.06rem]">
                Move through the renovation in order: define the project, pressure-test feasibility,
                check the long-term logic, and only then compare financing paths.
              </p>
            </div>

            <section id="define-the-renovation" className="w-full max-w-full scroll-mt-24 overflow-hidden rounded-[1.75rem] bg-white/74 ring-1 ring-slate-200/75 lg:rounded-none lg:bg-transparent lg:ring-0">
              <div className="grid w-full min-w-0 max-w-full gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
                <div className="min-w-0 px-5 py-6 md:px-8 md:py-8 lg:px-10 lg:py-11">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#1B3C6C]">
                    Step 1
                  </p>
                  <h3 className="mt-4 max-w-2xl break-words text-[1.7rem] font-bold leading-[1.08] tracking-[-0.03em] text-slate-950 md:text-[2.2rem] lg:text-[2.75rem]">
                    Define the renovation
                  </h3>
                  <div className="mt-5 max-w-2xl min-w-0 space-y-4 break-words text-[0.98rem] leading-7 text-slate-600 md:text-[1.02rem] md:leading-8 lg:text-[1.05rem]">
                    <p>
                      Before financing is even on the table, the renovation needs
                      a real shape. What is being built? What may need to be
                      legalized? What systems or structural work could change the
                      scope?
                    </p>
                    <p>
                      If that answer is still too blurry, home equity tends to
                      mask uncertainty rather than solve it. That is especially
                      true for an Ontario{' '}
                      <Link
                        to="/basements"
                        className="font-medium text-[#1B3C6C] hover:underline"
                      >
                        basement renovation
                      </Link>{' '}
                      that may later become a{' '}
                      <Link
                        to="/legal-suites"
                        className="font-medium text-[#1B3C6C] hover:underline"
                      >
                        legal basement apartment
                      </Link>
                      .
                    </p>
                  </div>
                </div>

                  <div className="mt-0 min-w-0 border-t border-slate-200 px-5 py-5 lg:mt-0 lg:border-l lg:border-t-0 lg:py-10 lg:pl-8 lg:pr-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      What to pin down first
                    </p>
                    <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-700">
                      {[
                        'Actual room program and layout needs',
                        'Major mechanical, plumbing, or structural changes',
                        'Whether the project may become a legal suite path',
                        'Where the project is most likely to expand midstream',
                      ].map((point) => (
                        <li key={point} className="flex items-start gap-3">
                          <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
              </div>
            </section>

            <section
              id="test-feasibility"
              className="relative w-full max-w-full scroll-mt-24 overflow-hidden rounded-[1.75rem] bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.14),transparent_28%),linear-gradient(180deg,#0f172a_0%,#020617_100%)] text-white"
            >
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <div className="absolute left-[14%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/8 to-transparent" />
              </div>
              <div className="grid w-full min-w-0 max-w-full gap-0 lg:grid-cols-[360px_minmax(0,1fr)]">
                <div className="min-w-0 border-b border-white/10 px-5 py-6 lg:border-b-0 lg:border-r lg:border-white/10 lg:py-10">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-200">
                    Step 2
                  </p>
                  <div className="mt-6">
                    <p className="break-words text-lg font-semibold leading-8 text-white">
                      Feasibility is where the renovation starts becoming real.
                    </p>
                    <p className="mt-4 max-w-full text-sm leading-7 text-slate-300 lg:max-w-[18rem]">
                      Permit-heavy work, basement code upgrades, zoning questions,
                      servicing, and compliance obligations all live here.
                    </p>
                  </div>
                </div>

                <div className="min-w-0 px-5 py-6 md:px-8 md:py-8 lg:px-10 lg:py-11">
                  <h3 className="max-w-2xl break-words text-[1.7rem] font-bold leading-[1.08] tracking-[-0.03em] text-white md:text-[2.2rem] lg:text-[2.75rem]">
                    Test feasibility
                  </h3>
                  <div className="mt-5 max-w-2xl min-w-0 space-y-4 break-words text-[0.98rem] leading-7 text-slate-300 md:text-[1.02rem] md:leading-8 lg:text-[1.05rem]">
                    <p>
                      Many Ontario projects start feeling expensive only after the
                      permit path becomes clearer. That is especially true for{' '}
                      <Link
                        to="/legal-suites"
                        className="font-medium text-blue-200 hover:underline"
                      >
                        legal suites
                      </Link>{' '}
                      and{' '}
                      <Link
                        to="/garden-suites"
                        className="font-medium text-blue-200 hover:underline"
                      >
                        garden suites
                      </Link>{' '}
                      with heavier compliance or servicing demands.
                    </p>
                    <p>
                      If the Ontario permit and feasibility side of the project is
                      still vague, financing decisions are usually happening too
                      early.
                    </p>
                  </div>
                  <div className="mt-6 min-w-0 border-l border-white/12 pl-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
                      Pressure test
                    </p>
                    <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
                      Ask whether the current budget still makes sense once
                      approvals, code obligations, consultant work, and hidden
                      scope are taken seriously.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section id="value-income-logic" className="w-full max-w-full scroll-mt-24 overflow-hidden rounded-[1.75rem] bg-white/74 ring-1 ring-slate-200/75 lg:rounded-none lg:bg-transparent lg:ring-0">
              <div className="grid w-full min-w-0 max-w-full gap-0 lg:grid-cols-[minmax(0,1fr)_380px]">
                <div className="min-w-0 px-5 py-6 md:px-8 md:py-8 lg:px-10 lg:py-11">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#1B3C6C]">
                    Step 3
                  </p>
                  <h3 className="mt-4 max-w-2xl break-words text-[1.7rem] font-bold leading-[1.08] tracking-[-0.03em] text-slate-950 md:text-[2.2rem] lg:text-[2.75rem]">
                    Check value or income logic
                  </h3>
                  <div className="mt-5 max-w-2xl min-w-0 space-y-4 break-words text-[0.98rem] leading-7 text-slate-600 md:text-[1.02rem] md:leading-8 lg:text-[1.05rem]">
                    <p>
                      Home equity tends to make more sense when the renovation has
                      a clear long-term purpose. That may be household function,
                      property value, or realistic rental income.
                    </p>
                    <p>
                      The key word is realistic. Equity becomes much harder to
                      justify when the renovation only works because the upside is
                      being overstated. That is why{' '}
                      <Link
                        to="/costs"
                        className="font-medium text-[#1B3C6C] hover:underline"
                      >
                        Ontario renovation costs
                      </Link>{' '}
                      and believable rental logic need to be pressure-tested early.
                    </p>
                  </div>
                </div>

                  <div className="mt-0 min-w-0 border-t border-slate-200 px-5 py-5 lg:mt-0 lg:border-l lg:border-t-0 lg:py-10 lg:pl-8 lg:pr-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Stronger signals
                    </p>
                  <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                    {[
                      'The project materially improves how the property functions',
                      'A legal suite or garden suite has believable rental logic',
                      'The property will likely be held long enough for the project to matter',
                    ].map((point) => (
                      <li key={point} className="flex items-start gap-3">
                        <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section id="choose-the-financing-path" className="w-full max-w-full scroll-mt-24 overflow-hidden rounded-[1.75rem] bg-white/74 ring-1 ring-slate-200/75 lg:rounded-none lg:bg-transparent lg:ring-0">
              <div className="min-w-0 px-5 py-6 md:px-8 md:py-8 lg:px-10 lg:py-11">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#1B3C6C]">
                  Step 4
                </p>
                <h3 className="mt-4 max-w-3xl break-words text-[1.7rem] font-bold leading-[1.08] tracking-[-0.03em] text-slate-950 md:text-[2.2rem] lg:text-[2.75rem]">
                  Choose the financing path last
                </h3>
                <div className="mt-5 max-w-3xl min-w-0 space-y-4 break-words text-[0.98rem] leading-7 text-slate-600 md:text-[1.02rem] md:leading-8 lg:text-[1.05rem]">
                  <p>
                    Once the renovation has shape, feasibility, and believable
                    value logic, then it becomes useful to compare whether a
                    HELOC, refinance, renovation financing, or phased approach
                    fits best.
                  </p>
                  <p>
                    That comparison is a lot cleaner when the project has already
                    earned the right to be financed. This is where guides such as{' '}
                    <Link
                      to="/financing/heloc-vs-refinance-for-renovations"
                      className="font-medium text-[#1B3C6C] hover:underline"
                    >
                      HELOC vs refinance
                    </Link>
                    ,{' '}
                    <Link
                      to="/financing/heloc-vs-contractor-financing"
                      className="font-medium text-[#1B3C6C] hover:underline"
                    >
                      HELOC vs renovation financing
                    </Link>
                    , or{' '}
                    <Link
                      to="/financing/phased-renovation-financing"
                      className="font-medium text-[#1B3C6C] hover:underline"
                    >
                      phased renovation financing
                    </Link>{' '}
                    become useful instead of distracting.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>

      {/* Project fit */}
      <section className="relative bg-[linear-gradient(180deg,#ffffff_0%,#fbfcfe_100%)] py-16 lg:py-28">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-slate-100/60 to-transparent" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="min-w-0 max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
              Project fit
            </p>
            <h2 className="mt-4 max-w-3xl break-words text-[2rem] font-bold leading-[1.06] tracking-[-0.04em] text-slate-950 md:text-[3rem] lg:text-[3.65rem]">
              Some projects justify equity more naturally
            </h2>
            <p className="mt-4 max-w-2xl text-[0.98rem] leading-7 text-slate-600 md:text-[1.02rem] md:leading-8">
              In Ontario, larger projects such as a legal basement apartment, a
              garden suite, or a major addition often create a clearer case for
              using home equity than lighter finish upgrades alone.
            </p>
          </div>

          <div className="mt-8 grid w-full min-w-0 max-w-full gap-7 lg:mt-12 lg:gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <div className="px-1 py-1 md:px-2">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1B3C6C]">
                Stronger fit
              </p>
              <div className="mt-4 space-y-4 lg:mt-6 lg:space-y-5">
                {projectFitStrong.map((item) => (
                  <article key={item.title} className="border-t border-slate-200 pt-4 first:border-t-0 first:pt-0 lg:pt-5">
                    <h3 className="break-words text-[1.38rem] font-bold leading-[1.1] tracking-[-0.03em] text-slate-950 md:text-[1.55rem] lg:text-[1.65rem]">
                      {item.title}
                    </h3>
                    <p className="mt-2.5 max-w-xl text-[0.94rem] leading-6 text-slate-600 md:text-[0.98rem] md:leading-7">{item.body}</p>
                    <Link
                      to={item.href}
                      className="mt-4 inline-flex items-center text-sm font-semibold text-[#1B3C6C] hover:underline"
                    >
                      {item.linkText}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </article>
                ))}
              </div>
            </div>

            <div className="rounded-[1.5rem] bg-slate-950 px-5 py-6 text-white md:px-7 md:py-8 lg:rounded-none lg:bg-slate-950 lg:px-8 lg:py-10">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-200">
                Needs more caution
              </p>
              <ul className="mt-4 space-y-3 text-[0.98rem] leading-7 text-slate-200 md:mt-5 md:text-base md:leading-8">
                {projectFitCaution.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-1.5 h-5 w-5 shrink-0 text-blue-200" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Financing selector */}
        <section className="relative bg-[linear-gradient(180deg,#eff4f8_0%,#edf2f7_100%)] py-16 lg:pt-28 lg:pb-24">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200/80 to-transparent" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mt-2 w-full max-w-full rounded-[2.2rem] bg-white/74 px-5 pt-6 pb-5 ring-1 ring-slate-200/80 md:px-8 md:pt-8 md:pb-7">
              <div className="border-b border-slate-200/80 pb-6 md:pb-8">
                <div className="min-w-0 max-w-3xl">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
                    Financing path selector
                </p>
                  <h2 className="mt-4 max-w-3xl break-words text-[2rem] font-bold leading-[1.05] tracking-[-0.04em] text-slate-950 md:text-[3rem] lg:text-[3.45rem]">
                    Compare the main financing paths
                  </h2>
                  <p className="mt-4 max-w-2xl text-[0.98rem] leading-7 text-slate-600 md:text-[1.02rem] md:leading-8">
                    This part comes after the renovation passes the earlier tests.
                    The financing path should follow the renovation, not lead it.
                  </p>
                </div>
              </div>

            <div className="mt-6 grid w-full min-w-0 max-w-full gap-5 lg:mt-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)] lg:gap-8">
                <article className="min-w-0 self-start rounded-[1.6rem] bg-white/62 px-4 py-4 ring-1 ring-slate-200/72 md:px-6 md:py-6 lg:border-r lg:border-slate-200/70 lg:pr-8">
                <div className="flex min-w-0 items-start justify-between gap-5">
                  <div className="min-w-0">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[#1B3C6C]">
                      Primary path
                    </p>
                    <h3 className="mt-3 break-words text-[1.7rem] font-bold leading-[1.06] tracking-[-0.035em] text-slate-950 md:text-[2.1rem] lg:text-[2.4rem]">
                      {helocPath.title}
                    </h3>
                  </div>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white">
                    <HelocIcon className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-5 max-w-2xl min-w-0 space-y-3 break-words text-[0.94rem] leading-7 text-slate-600 md:text-[0.98rem] md:leading-8">
                  <p>{helocPath.body}</p>
                  <p>
                    It tends to be the cleanest comparison point when the renovation
                    already has a defined scope, a believable long-term purpose, and
                    enough clarity to justify pulling equity into the plan.
                  </p>
                </div>

                  <div className="mt-5 grid w-full min-w-0 max-w-full gap-4 border-t border-slate-200/78 pt-4 md:mt-7 md:gap-5 md:pt-5 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Usually best for
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-700">
                      {helocPath.bestFor}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Compare deeper when
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-700">
                      You need to decide whether flexibility matters more than a
                      broader borrowing reset or a renovation-specific funding structure.
                    </p>
                  </div>
                </div>

                <Link
                  to={helocPath.href}
                  className="mt-4 inline-flex items-center text-sm font-semibold text-[#1B3C6C] hover:underline md:mt-5"
                >
                  {helocPath.linkText}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </article>

                <aside className="min-w-0 w-full max-w-full rounded-[1.5rem] bg-white/48 px-4 pt-4 pb-3 ring-1 ring-slate-200/68 md:px-5 md:pt-5 md:pb-4 lg:px-6 lg:pt-6 lg:pb-5">
                  <div className="divide-y divide-slate-200/72">
                    <article className="pb-5 md:pb-6">
                    <div className="flex min-w-0 items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
                          Secondary path
                        </p>
                        <h3 className="mt-2 break-words text-[1.28rem] font-semibold tracking-[-0.03em] text-slate-950 md:text-[1.45rem]">
                          {refinancePath.title}
                        </h3>
                      </div>
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/92 text-slate-600 ring-1 ring-slate-200/88">
                        <RefinanceIcon className="h-4.5 w-4.5" />
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600 md:mt-4 md:leading-7">
                      {refinancePath.body}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-slate-700 md:mt-4 md:leading-7">
                      <span className="font-semibold text-slate-900">Usually best for:</span>{' '}
                      {refinancePath.bestFor}
                    </p>
                    <Link
                      to={refinancePath.href}
                      className="mt-4 inline-flex items-center text-sm font-semibold text-[#1B3C6C] hover:underline"
                    >
                      {refinancePath.linkText}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </article>

                  {[renovationFinancingPath, phasedPath].map((path, index) => {
                    const Icon = path.icon;

                    return (
                      <article
                        key={path.title}
                        className={`grid gap-4 py-5 md:grid-cols-[52px_minmax(0,1fr)] md:gap-5 md:py-6 ${
                          index === 0 ? 'pt-6' : ''
                        }`}
                      >
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/94 text-slate-600 ring-1 ring-slate-200/88">
                          <Icon className="h-4.5 w-4.5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="break-words text-[1.08rem] font-semibold tracking-[-0.02em] text-slate-950 md:text-[1.15rem]">
                            {path.title}
                          </h3>
                          <p className="mt-2.5 text-sm leading-6 text-slate-600 md:mt-3 md:leading-7">
                            {path.body}
                          </p>
                          <p className="mt-3 text-sm leading-6 text-slate-700 md:mt-4 md:leading-7">
                            <span className="font-semibold text-slate-900">Usually best for:</span>{' '}
                            {path.bestFor}
                          </p>
                          <Link
                            to={path.href}
                            className="mt-4 inline-flex items-center text-sm font-semibold text-[#1B3C6C] hover:underline"
                          >
                            {path.linkText}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </aside>
            </div>
          </div>
        </div>
      </section>

      {/* HELOC renovation fit calculator */}
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_76%_18%,rgba(115,136,166,0.32),transparent_28%),radial-gradient(circle_at_16%_84%,rgba(247,236,220,0.72),transparent_30%),linear-gradient(180deg,#e7eef6_0%,#dde7f0_46%,#e8eff6_100%)] py-16 lg:py-32">
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
            <h2 className="mt-4 break-words text-[2rem] font-bold leading-[1.04] tracking-[-0.045em] text-slate-950 md:text-[3rem] lg:text-[3.7rem]">
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

      {/* Ontario-specific advantage */}
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_24%),linear-gradient(180deg,#0f172a_0%,#020617_100%)] py-16 lg:py-32 text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/16 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="absolute right-[12%] top-16 h-48 w-48 rounded-full bg-blue-300/6 blur-3xl" />
        </div>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid w-full min-w-0 max-w-full gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.95fr)] lg:items-start lg:gap-10">
            <div className="min-w-0 max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-200">
                Ontario-specific advantage
              </p>
              <h2 className="mt-4 max-w-4xl break-words text-[2rem] font-bold leading-[1.05] tracking-[-0.045em] text-white md:text-[3.1rem] lg:text-[3.9rem]">
                Ontario projects make the equity decision more layered
              </h2>
              <div className="mt-5 max-w-2xl space-y-4 text-[0.98rem] leading-7 text-slate-300 md:mt-8 md:text-[1.05rem] md:leading-8">
                  <p>
                    This is where OntarioReno should feel different from generic bank
                    or finance content. Basement suites, garden suites, permit-heavy
                    renovations, and grant-supported projects all change how home
                    equity should be judged for an Ontario homeowner.
                  </p>
                  <p>
                    The financing story is only useful when it stays connected to
                    actual Ontario renovation complexity, including permits, suite
                    rules, servicing, and realistic project costs.
                  </p>
              </div>
            </div>

            <div className="space-y-4 md:space-y-5">
              {ontarioLinks.map((item) => (
                <article
                  key={item.title}
                  className="border-t border-white/12 pt-4 first:border-t-0 first:pt-0 md:pt-5"
                >
                  <h3 className="text-[1.15rem] font-semibold tracking-[-0.02em] text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300 md:leading-7">{item.body}</p>
                  <Link
                    to={item.href}
                    className="mt-4 inline-flex items-center text-sm font-semibold text-blue-200 hover:underline"
                  >
                    {item.linkText}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final checklist */}
      <section
        id="confirm-first"
        className="relative bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] py-16 lg:py-32"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-slate-100/55 to-transparent" />
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
            Before you commit
          </p>
          <h2 className="mt-4 max-w-3xl break-words text-[2rem] font-bold leading-[1.06] tracking-[-0.04em] text-slate-950 md:text-[3rem] lg:text-[3.55rem]">
            Confirm these before using equity
          </h2>

          <div className="mt-8 px-1 py-1 md:mt-12 md:px-2">
            <div className="grid gap-4 md:grid-cols-2">
              {confirmChecklist.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-slate-400" />
                  <p className="text-[0.98rem] leading-7 text-slate-700 md:text-base">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* OntarioReno method */}
      <section className="relative bg-[linear-gradient(180deg,#f5f7fb_0%,#eef3f7_100%)] py-16 lg:py-28">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200/85 to-transparent" />
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
              OntarioReno method
            </p>
            <h2 className="mt-4 max-w-3xl break-words text-[1.95rem] font-bold leading-[1.06] tracking-[-0.04em] text-slate-950 md:text-[2.8rem] lg:text-[3.35rem]">
              Review the renovation before financing takes over
            </h2>
            <p className="mt-4 max-w-2xl text-[0.98rem] leading-7 text-slate-600 md:text-[1.02rem] md:leading-8">
              If you want a structured next step after this guide, start with an{' '}
              <Link to="/match" className="font-medium text-[#1B3C6C] hover:underline">
                Ontario project review
              </Link>{' '}
              before committing the renovation to a HELOC, refinance, or another
              financing path.
            </p>

            <div className="mt-8 grid gap-5 md:mt-12 md:gap-6 md:grid-cols-3">
            {ontarioRenoMethod.map((item) => (
              <article
                key={item.title}
                className="border-t border-slate-200 px-1 py-4 first:border-t-0 md:border-l md:border-t-0 md:px-5 md:py-5 md:first:border-l-0"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {item.step}
                </p>
                <h3 className="mt-3 text-[1.2rem] font-semibold tracking-[-0.02em] text-slate-950">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[linear-gradient(180deg,#ffffff_0%,#fbfcfd_100%)] py-16 lg:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
            Frequently asked questions
          </p>
          <h2 className="mt-4 max-w-3xl break-words text-[1.95rem] font-bold leading-[1.06] tracking-[-0.04em] text-slate-950 md:text-[2.75rem] lg:text-[3.1rem]">
            Questions before using home equity
          </h2>

          <div className="mt-8 divide-y divide-slate-200/80 md:mt-12">
            {faqItems.map((item) => (
              <details
                key={item.question}
                className="group px-0 py-4 md:py-5"
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-left">
                  <span className="max-w-3xl break-words text-[0.98rem] font-semibold leading-7 tracking-[-0.02em] text-slate-950 md:text-[1.12rem]">
                    {item.question}
                  </span>
                  <span className="mt-1 text-sm font-semibold text-slate-400 transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-3xl text-[0.94rem] leading-7 text-slate-600 md:mt-4 md:text-[0.98rem] md:leading-8">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.12),transparent_28%),linear-gradient(180deg,#0f172a_0%,#020617_100%)] py-16 text-white lg:py-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/16 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="absolute left-[18%] top-14 h-32 w-32 rounded-full bg-blue-300/8 blur-3xl" />
        </div>
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-blue-200/80">
              Next step
            </p>
            <h2 className="mx-auto mt-4 max-w-4xl break-words text-[2rem] font-bold leading-[1.05] tracking-[-0.04em] text-white md:text-[3rem] lg:text-[3.7rem]">
              Plan the renovation before you commit the equity
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[0.98rem] leading-7 text-slate-300 md:mt-6 md:text-[1.08rem] md:leading-8">
              Review the project scope, the likely permit path, the cost logic,
              and the next step before treating home equity as the answer.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row md:mt-12 md:gap-4">
              <Link to="/match" className={buttonStyles.primary}>
                Start Project Review
              </Link>
              <Link
                to="/costs"
                className="inline-flex items-center justify-center rounded-[0.8rem] border border-white/18 bg-white/8 px-7 py-[0.95rem] text-base font-semibold tracking-[-0.015em] text-white shadow-[0_10px_24px_rgba(15,23,42,0.10)] transition duration-200 hover:bg-white/12 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20"
              >
                Explore Renovation Costs
              </Link>
            </div>
            <div className="mx-auto mt-8 h-px max-w-xl bg-gradient-to-r from-transparent via-white/16 to-transparent md:mt-12" />
          </div>
        </div>
      </section>
    </div>
  );
}
