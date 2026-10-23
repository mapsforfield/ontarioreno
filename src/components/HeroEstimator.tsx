import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Banknote, FileCheck2, Ruler } from 'lucide-react';

/**
 * The home hero's "instant value" card: pick a project, see the cost range,
 * the permit position and the financing that applies — without leaving the
 * fold — then book the visit for that project.
 *
 * EVERY FIGURE HERE IS ALREADY PUBLISHED ELSEWHERE ON THE SITE, and must stay
 * that way. A homeowner who books off a number in the hero holds us to it.
 *  - Cost ranges: /costs (basement, legal suite) and /garden-suite-cost-ontario.
 *    Change them there first, then here.
 *  - Financing: lib/program-config.ts. The basement's "$399" is its own
 *    displayAmountLabel (a ~$42,000 project at the lowest rate on file), so it
 *    is a starting point and is never shown for the legal suite, whose range
 *    starts higher. The garden suite program deliberately quotes no monthly
 *    figure — its loan covers part of a much larger build — so this card
 *    states the cap instead, exactly as that program's terms do.
 * "On approved credit" stays on the card whatever tab is active.
 */
type ProjectKey = 'basement' | 'suite' | 'garden';

const PROJECTS: Record<
  ProjectKey,
  {
    tab: string;
    range: string;
    typical: string;
    permit: string;
    permitDetail: string;
    finance: string;
    financeDetail: string;
    href: string;
  }
> = {
  basement: {
    tab: 'Finished Basement',
    range: '$45,000 – $85,000+',
    typical: 'Most land between $50,000 and $70,000',
    permit: 'Permit required',
    permitDetail: 'In almost every Ontario municipality, once walls, plumbing or electrical change.',
    finance: 'From $399/month',
    financeDetail: 'Open loan · nothing upfront · no lien on your home',
    href: '/consultation/basement',
  },
  suite: {
    tab: 'Legal Second Suite',
    range: '$60,000 – $140,000+',
    typical: 'Most land between $70,000 and $110,000',
    permit: 'Permit and drawings required',
    permitDetail: 'A legal unit has to meet fire separation, egress and code rules before it can be rented.',
    finance: 'Financed in full',
    financeDetail: 'Open loan · nothing upfront · no lien · your payment is set at the visit',
    href: '/consultation/basement',
  },
  garden: {
    tab: 'Garden Suite',
    range: '$250,000 – $400,000+',
    typical: 'Most land between $260,000 and $350,000',
    permit: 'Permit and zoning review',
    permitDetail: 'Setbacks, servicing and lot access decide whether the yard can take one.',
    finance: 'Open loan up to $100,000',
    financeDetail: 'Toward the build · no lien · the balance is arranged by you',
    href: '/consultation/garden-suite',
  },
};

const ORDER: ProjectKey[] = ['basement', 'suite', 'garden'];

export function HeroEstimator() {
  const [active, setActive] = useState<ProjectKey>('basement');
  const project = PROJECTS[active];

  return (
    <div className="hero-estimator group relative rounded-[1.7rem] p-px transition duration-300 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <div className="relative overflow-hidden rounded-[calc(1.7rem-1px)] bg-[linear-gradient(180deg,rgba(15,23,42,0.92)_0%,rgba(7,11,20,0.96)_100%)] p-5 shadow-[0_30px_80px_rgba(2,6,23,0.6)] backdrop-blur-xl sm:p-6">
        <div aria-hidden className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/60 to-transparent" />

        <div className="flex items-center justify-between gap-3">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-sky-300">
            Test your project
          </p>
          <span className="flex items-center gap-1.5 text-[0.7rem] font-medium text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            Ontario 2026 ranges
          </span>
        </div>

        <div role="tablist" aria-label="Project type" className="mt-4 grid grid-cols-3 gap-1.5 rounded-2xl bg-white/[0.04] p-1.5 ring-1 ring-white/[0.06]">
          {ORDER.map((key) => {
            const selected = key === active;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                id={`hero-tab-${key}`}
                aria-selected={selected}
                aria-controls="hero-estimate"
                onClick={() => setActive(key)}
                className={`min-h-[2.75rem] rounded-xl px-2 text-[0.8rem] font-semibold leading-tight tracking-[-0.01em] transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70 sm:text-[0.85rem] ${
                  selected
                    ? 'bg-sky-400 text-[#070B14] shadow-[0_6px_18px_rgba(56,189,248,0.35)]'
                    : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                {PROJECTS[key].tab}
              </button>
            );
          })}
        </div>

        {/* Keyed so the readout re-enters on every switch: a 220ms fade/rise,
            off under reduced motion. Nothing loads; the numbers are local. */}
        <div
          key={active}
          id="hero-estimate"
          role="tabpanel"
          aria-labelledby={`hero-tab-${active}`}
          aria-live="polite"
          className="hero-estimate-in mt-5"
        >
          <div className="flex items-start gap-3">
            <Ruler className="mt-1 h-4 w-4 shrink-0 text-slate-500" />
            <div>
              <p className="text-xs font-medium text-slate-400">Estimated cost range</p>
              <p className="mt-0.5 text-[1.9rem] font-bold leading-none tracking-[-0.035em] tabular-nums text-white sm:text-[2.1rem]">
                {project.range}
              </p>
              <p className="mt-1.5 text-xs text-slate-500">{project.typical}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/[0.035] p-4 ring-1 ring-white/[0.06]">
              <p className="flex items-center gap-2 text-xs font-medium text-slate-400">
                <FileCheck2 className="h-3.5 w-3.5 text-amber-300" />
                Permits
              </p>
              <p className="mt-1.5 text-[0.95rem] font-semibold text-white">{project.permit}</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">{project.permitDetail}</p>
            </div>
            <div className="rounded-2xl bg-sky-400/[0.07] p-4 ring-1 ring-sky-300/15">
              <p className="flex items-center gap-2 text-xs font-medium text-slate-400">
                <Banknote className="h-3.5 w-3.5 text-sky-300" />
                Financing
              </p>
              <p className="mt-1.5 text-[0.95rem] font-semibold text-white">{project.finance}</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">{project.financeDetail}</p>
            </div>
          </div>
        </div>

        <Link
          to={project.href}
          className="mt-6 inline-flex min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-xl bg-sky-400 px-5 text-[0.98rem] font-bold tracking-[-0.01em] text-[#070B14] shadow-[0_0_0_1px_rgba(125,211,252,0.4),0_12px_30px_rgba(56,189,248,0.35)] transition hover:bg-sky-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300/40"
        >
          Lock in this scope with a free site visit
          <ArrowRight className="h-5 w-5" />
        </Link>
        <p className="mt-3 text-center text-[0.7rem] leading-5 text-slate-500">
          Financing on approved credit. Ranges from our{' '}
          <Link to="/costs" className="-my-2 inline-block py-2 font-medium text-slate-300 hover:underline">
            Ontario cost guides
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
