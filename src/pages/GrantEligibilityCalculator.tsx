import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Helmet } from 'react-helmet-async';
import { AlertTriangle, ArrowRight, Landmark } from 'lucide-react';
import HamiltonGrantCalculator from '../components/HamiltonGrantCalculator';
import StCatharinesGrantCalculator from '../components/StCatharinesGrantCalculator';
import { buttonStyles } from '../lib/uiStyles';
import { cn } from '../lib/utils';

type ProgramKey = 'hamilton' | 'st-catharines';

const programCards: Array<{
  key: ProgramKey;
  eyebrow: string;
  /** Program is no longer taking applications — styled and worded differently. */
  closed?: boolean;
  title: string;
  summary: string;
  note: string;
  cta: string;
  logoSrc: string;
  logoAlt: string;
  logoClassName: string;
}> = [
  {
    key: 'hamilton',
    eyebrow: 'Closed to new applications',
    closed: true,
    title: 'Hamilton Basement Grant',
    summary:
      'For legal secondary suite and basement conversion projects under the Hamilton funding framework.',
    note: 'Hamilton has reached its allocated funding capacity. Kept for reference, and for anyone with an application already submitted.',
    cta: 'Open Hamilton calculator (reference)',
    logoSrc: '/images/hamilton-logo.png',
    logoAlt: 'Hamilton logo',
    logoClassName: 'h-9 w-auto object-contain sm:h-10',
  },
  {
    key: 'st-catharines',
    // Was "Funding active, limited availability" — the HAF ADU cash grant pool
    // is depleted, so that line was telling homeowners the opposite of the truth.
    eyebrow: 'Closed to new applications',
    closed: true,
    title: 'St. Catharines ADU Program',
    summary:
      'Useful for understanding future project economics for basement apartments and detached ADUs.',
    note: 'The HAF-funded ADU cash grant pool is depleted. The cost framework is still useful for planning a project budget.',
    cta: 'Open St. Catharines calculator (reference)',
    logoSrc: '/images/st-catharines-logo.png',
    logoAlt: 'St. Catharines logo',
    logoClassName: 'h-10 w-auto object-contain sm:h-11',
  },
];

const calculatorContent: Record<
  ProgramKey,
  {
    eyebrow: string;
    title: string;
    description: string;
    component: ReactNode;
  }
> = {
  hamilton: {
    eyebrow: 'Hamilton Program',
    title: 'Hamilton Basement Grant Calculator',
    description:
      'Use the Hamilton calculator to estimate how a typical legal secondary suite structure may translate into grant support for your project.',
    component: <HamiltonGrantCalculator />,
  },
  'st-catharines': {
    eyebrow: 'St. Catharines Program',
    title: 'St. Catharines ADU Program Calculator',
    description:
      'Use the St. Catharines calculator to compare eligible and ineligible costs under the published ADU funding framework.',
    component: <StCatharinesGrantCalculator />,
  },
};

export default function GrantEligibilityCalculator() {
  const [selectedProgram, setSelectedProgram] = useState<ProgramKey | null>(null);
  const calculatorRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!selectedProgram || !calculatorRef.current) {
      return;
    }

    calculatorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [selectedProgram]);

  const activeCalculator = selectedProgram
    ? calculatorContent[selectedProgram]
    : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>Grant Eligibility Calculator | OntarioReno</title>
        <meta
          name="description"
          content="Estimate Ontario renovation grant eligibility by selecting your program. Compare funding rules, project assumptions, and available incentives for legal basement suites, ADUs, and garden suites."
        />
        <link
          rel="canonical"
          href="https://ontarioreno.ca/grant-eligibility-calculator"
        />
      </Helmet>

      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/15 px-4 py-2 text-sm font-medium text-blue-200 ring-1 ring-white/10">
              <Landmark className="h-4 w-4" />
              OntarioReno calculator hub
            </div>

            <h1 className="mt-5 text-4xl font-bold leading-[1.02] tracking-[-0.035em] md:text-6xl">
              Grant Eligibility Calculator
            </h1>

            <p className="mt-5 max-w-3xl text-xl leading-8 text-slate-300">
              Select the program you want to calculate. OntarioReno will show
              the rules, estimated funding, and project assumptions for that
              specific program.
            </p>
          </div>
        </div>
      </section>

      {/* Both calculators on this page cover programs that have now closed.
          Saying so at the top — before anyone works through a funding estimate
          they cannot act on — is the whole point of this block. Remove it if a
          program here reopens or an open one is added. */}
      <section className="bg-amber-50">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="rounded-2xl border-2 border-amber-300 bg-white p-5 md:p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-amber-600" aria-hidden="true" />
              <div className="min-w-0">
                <h2 className="text-lg font-extrabold text-slate-900 md:text-xl">
                  Both programs below are closed to new applications
                </h2>
                <p className="mt-2 text-base leading-7 text-slate-700">
                  Hamilton has reached its allocated funding capacity, and the St. Catharines
                  HAF-funded ADU cash grant pool is depleted. These calculators are kept for
                  planning and for anyone with an application already submitted — they will not
                  tell you about funding you can apply for today.
                </p>
                <a
                  href="/grants"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#1B3C6C] px-6 py-3.5 text-base font-extrabold text-white transition hover:bg-[#153158]"
                >
                  See Ontario grants that are still open
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
              Select a program
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-slate-900 md:text-4xl">
              Start with the calculator that matches your project path
            </h2>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {programCards.map((program) => {
              const active = selectedProgram === program.key;

              return (
                <div
                  key={program.key}
                  className={cn(
                    'flex h-full flex-col rounded-[1.8rem] border p-8 shadow-[0_18px_50px_rgba(15,23,42,0.06)] transition',
                    active
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-900'
                  )}
                >
                  <div
                    className={cn(
                      'mb-6 rounded-[1.05rem] border px-4 py-3',
                      active
                        ? 'border-white/12 bg-white/8'
                        : 'border-slate-200 bg-slate-50'
                    )}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <img
                        src={program.logoSrc}
                        alt={program.logoAlt}
                        className={program.logoClassName}
                      />
                      <div className="text-right">
                        <p
                          className={cn(
                            'text-[11px] font-semibold uppercase tracking-[0.18em]',
                            active ? 'text-blue-200' : 'text-slate-500'
                          )}
                        >
                          Local program
                        </p>
                        <p
                          className={cn(
                            'mt-1 text-sm font-medium',
                            active ? 'text-slate-200' : 'text-slate-700'
                          )}
                        >
                          {program.key === 'hamilton'
                            ? 'Hamilton funding context'
                            : 'St. Catharines funding context'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div>
                      {/* A closed program reads amber, not brand navy — the
                          eyebrow is the first thing scanned, and navy here says
                          "offer" when it needs to say "warning". */}
                      <p
                        className={cn(
                          'text-sm font-semibold uppercase tracking-[0.18em]',
                          program.closed
                            ? (active ? 'text-amber-300' : 'text-amber-700')
                            : (active ? 'text-blue-200' : 'text-[#1B3C6C]')
                        )}
                      >
                        {program.eyebrow}
                      </p>
                      <h3 className="mt-3 text-2xl font-bold tracking-[-0.03em]">
                        {program.title}
                      </h3>
                    </div>
                  </div>

                  <p
                    className={cn(
                      'mt-5 text-base leading-8',
                      active ? 'text-slate-200' : 'text-slate-600'
                    )}
                  >
                    {program.summary}
                  </p>
                  <p
                    className={cn(
                      'mt-4 text-sm leading-7',
                      active ? 'text-slate-300' : 'text-slate-500'
                    )}
                  >
                    {program.note}
                  </p>

                  <div className="mt-auto pt-8">
                    <button
                      type="button"
                      onClick={() => setSelectedProgram(program.key)}
                      className={cn(
                        active ? buttonStyles.ghostDark : buttonStyles.primary,
                        'w-full justify-center'
                      )}
                    >
                      {program.cta}
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {activeCalculator && (
        <section
          id="calculator"
          ref={calculatorRef}
          className="bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] py-16 md:py-20"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
                {activeCalculator.eyebrow}
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-slate-900 md:text-4xl">
                {activeCalculator.title}
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                {activeCalculator.description}
              </p>
            </div>

            {activeCalculator.component}
          </div>
        </section>
      )}
    </div>
  );
}
