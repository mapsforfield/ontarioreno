import { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Home,
  Landmark,
  Receipt,
  Warehouse,
} from 'lucide-react';

const formatCurrency = (value: number) =>
  value.toLocaleString('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  });

type UnitType = 'interior' | 'exterior';

const defaultProjectCost: Record<UnitType, number> = {
  interior: 85000,
  exterior: 220000,
};

const unitConfig = {
  interior: {
    label: 'Interior ADU / basement apartment',
    icon: Home,
    cap: 40000,
  },
  exterior: {
    label: 'Exterior ADU / detached garden suite',
    icon: Warehouse,
    cap: 80000,
  },
} satisfies Record<UnitType, { label: string; icon: typeof Home; cap: number }>;

export default function StCatharinesGrantCalculator() {
  const [unitType, setUnitType] = useState<UnitType>('interior');
  const [totalProjectCost, setTotalProjectCost] = useState(defaultProjectCost.interior);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [appliances, setAppliances] = useState(0);
  const [decorativeAmenities, setDecorativeAmenities] = useState(0);
  const [financingCosts, setFinancingCosts] = useState(0);
  const [consultingFees, setConsultingFees] = useState(0);
  const [permitPlanFees, setPermitPlanFees] = useState(0);
  const [otherIncentives, setOtherIncentives] = useState(0);

  const ineligibleCosts =
    appliances +
    decorativeAmenities +
    financingCosts +
    consultingFees +
    permitPlanFees;

  const calculations = useMemo(() => {
    const eligibleCosts = Math.max(totalProjectCost - ineligibleCosts, 0);
    const seventyPercentOfEligible = eligibleCosts * 0.7;
    const unitCap = unitConfig[unitType].cap;
    const propertyCap = 80000;
    const grantBeforeOtherIncentives = Math.min(
      seventyPercentOfEligible,
      unitCap,
      propertyCap
    );

    const finalGrant =
      otherIncentives > 0
        ? Math.min(
            grantBeforeOtherIncentives,
            Math.max(totalProjectCost - otherIncentives, 0)
          )
        : grantBeforeOtherIncentives;

    const netCost = Math.max(totalProjectCost - finalGrant, 0);
    const ineligibleShare =
      totalProjectCost > 0 ? ineligibleCosts / totalProjectCost : 0;
    const reachedCap = finalGrant >= unitCap;
    const belowCapThreshold = seventyPercentOfEligible < unitCap;

    return {
      eligibleCosts,
      seventyPercentOfEligible,
      unitCap,
      propertyCap,
      grantBeforeOtherIncentives,
      finalGrant,
      netCost,
      ineligibleShare,
      reachedCap,
      belowCapThreshold,
    };
  }, [ineligibleCosts, otherIncentives, totalProjectCost, unitType]);

  const dynamicMessage = useMemo(() => {
    if (calculations.reachedCap) {
      return {
        tone: 'success',
        title: 'Maximum program cap reached',
        body: `At this project structure, the estimate reaches the ${formatCurrency(
          calculations.unitCap
        )} program cap for this unit type.`,
      };
    }

    if (calculations.ineligibleShare >= 0.25) {
      return {
        tone: 'warning',
        title: 'Ineligible costs are reducing the grant base',
        body: 'A larger share of the budget is being excluded from the 70% calculation, which lowers the estimated grant.',
      };
    }

    if (calculations.belowCapThreshold) {
      return {
        tone: 'info',
        title: 'This project may qualify without reaching the full cap',
        body: `The current eligible-cost level supports an estimated grant below the maximum ${formatCurrency(
          calculations.unitCap
        )} cap.`,
      };
    }

    return {
      tone: 'info',
      title: 'This is a planning estimate, not an approval result',
      body: 'Use this to understand how eligible versus ineligible costs change the program economics before formal review.',
    };
  }, [calculations]);

  const summarySentence = useMemo(() => {
    return `For this ${unitConfig[unitType].label.toLowerCase()} example, a ${formatCurrency(
      totalProjectCost
    )} project with ${formatCurrency(
      ineligibleCosts
    )} in ineligible costs could produce an estimated City grant of ${formatCurrency(
      calculations.finalGrant
    )}, leaving about ${formatCurrency(calculations.netCost)} after grant.`;
  }, [calculations.finalGrant, calculations.netCost, ineligibleCosts, totalProjectCost, unitType]);

  const messageToneClasses =
    dynamicMessage.tone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
      : dynamicMessage.tone === 'warning'
        ? 'border-amber-200 bg-amber-50 text-amber-950'
        : 'border-slate-200 bg-slate-50 text-slate-900';

  const breakdownFields = [
    {
      label: 'Appliances',
      value: appliances,
      setValue: setAppliances,
    },
    {
      label: 'Decorative finishes / non-eligible amenities',
      value: decorativeAmenities,
      setValue: setDecorativeAmenities,
    },
    {
      label: 'Financing costs',
      value: financingCosts,
      setValue: setFinancingCosts,
    },
    {
      label: 'Consulting / design',
      value: consultingFees,
      setValue: setConsultingFees,
    },
    {
      label: 'Permit plan fees',
      value: permitPlanFees,
      setValue: setPermitPlanFees,
    },
  ];

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.06)] md:p-8">
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-start gap-3">
          <Landmark className="mt-1 h-5 w-5 shrink-0 text-amber-700" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-900">
              Planning Notice
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-700 md:text-base">
              The St. Catharines ADU Program intake is currently closed due to
              depleted funding. This calculator is for understanding the published
              program framework and future project economics if funding becomes
              available again.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold tracking-[-0.03em] text-slate-900 md:text-3xl">
          St. Catharines ADU Grant Calculator
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
          This tool estimates grant impact by separating eligible construction
          costs from ineligible costs. It is designed for project planning, not
          live program intake.
        </p>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 md:p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
              1. Unit Type
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(Object.keys(unitConfig) as UnitType[]).map((type) => {
                const config = unitConfig[type];
                const Icon = config.icon;
                const active = unitType === type;

                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setUnitType(type);
                      setTotalProjectCost(defaultProjectCost[type]);
                    }}
                    className={`rounded-3xl border px-5 py-5 text-left transition ${
                      active
                        ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                        : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${active ? 'text-blue-200' : 'text-[#1B3C6C]'}`} />
                    <p className="mt-3 text-base font-bold">{config.label}</p>
                    <p className={`mt-2 text-sm leading-6 ${active ? 'text-slate-300' : 'text-slate-600'}`}>
                      Program cap: {formatCurrency(config.cap)}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 md:p-6">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                2. Total Project Cost
              </p>
              <p className="text-xl font-bold tracking-[-0.02em] text-slate-900">
                {formatCurrency(totalProjectCost)}
              </p>
            </div>

            <input
              type="range"
              min={30000}
              max={350000}
              step={5000}
              value={totalProjectCost}
              onChange={(e) => setTotalProjectCost(Number(e.target.value))}
              className="slider-blue mt-5 h-4 w-full cursor-pointer appearance-none rounded-full bg-slate-200"
            />

            <div className="mt-3 flex items-center justify-between text-xs font-medium text-slate-500 md:text-sm">
              <span>{formatCurrency(30000)}</span>
              <span>{formatCurrency(350000)}</span>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                  3. Ineligible Costs
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Eligible costs generally include building materials, labour,
                  required HVAC, and permit-related plumbing scope. Ineligible
                  items generally include appliances, decorative amenities,
                  financing costs, consulting fees, and permit-plan fees.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBreakdown((current) => !current)}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
              >
                {showBreakdown ? 'Hide' : 'Edit'}
                {showBreakdown ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-slate-600">
                  Total ineligible costs
                </span>
                <span className="text-lg font-bold text-slate-900">
                  {formatCurrency(ineligibleCosts)}
                </span>
              </div>
            </div>

            {showBreakdown && (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {breakdownFields.map((field) => (
                  <label key={field.label} className="block">
                    <span className="text-sm font-medium text-slate-700">
                      {field.label}
                    </span>
                    <div className="mt-2 flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <span className="text-sm font-medium text-slate-500">$</span>
                      <input
                        type="number"
                        min={0}
                        step={500}
                        value={field.value}
                        onChange={(e) =>
                          field.setValue(Math.max(Number(e.target.value) || 0, 0))
                        }
                        className="ml-2 w-full bg-transparent text-base font-semibold text-slate-900 outline-none"
                      />
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 md:p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
              4. Other Incentives
            </p>
            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700">
                Other confirmed incentives
              </span>
              <div className="mt-2 flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <span className="text-sm font-medium text-slate-500">$</span>
                <input
                  type="number"
                  min={0}
                  step={500}
                  value={otherIncentives}
                  onChange={(e) =>
                    setOtherIncentives(Math.max(Number(e.target.value) || 0, 0))
                  }
                  className="ml-2 w-full bg-transparent text-base font-semibold text-slate-900 outline-none"
                />
              </div>
            </label>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              If other incentives plus the City grant exceed total project cost,
              the City grant may be reduced.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="flex items-center gap-3">
              <Receipt className="h-5 w-5 text-[#1B3C6C]" />
              <h3 className="text-xl font-bold tracking-[-0.02em] text-slate-900">
                Grant Breakdown
              </h3>
            </div>

            <div className="mt-6 space-y-3">
              {[
                ['Total project cost', formatCurrency(totalProjectCost)],
                ['Ineligible costs', formatCurrency(ineligibleCosts)],
                ['Estimated eligible costs', formatCurrency(calculations.eligibleCosts)],
                ['70% of eligible costs', formatCurrency(calculations.seventyPercentOfEligible)],
                ['Program cap', formatCurrency(calculations.unitCap)],
                ['Property-level City incentive cap', formatCurrency(calculations.propertyCap)],
                ['Estimated grant', formatCurrency(calculations.finalGrant)],
                ['Estimated real cost after grant', formatCurrency(calculations.netCost)],
              ].map(([label, value], index) => (
                <div
                  key={label}
                  className={`flex items-center justify-between gap-4 rounded-2xl px-4 py-4 ${
                    index >= 6 ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'
                  }`}
                >
                  <span
                    className={`text-sm font-medium ${
                      index >= 6 ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    {label}
                  </span>
                  <span className="text-lg font-bold">{value}</span>
                </div>
              ))}
            </div>

            {calculations.reachedCap && (
              <div className="mt-5 text-center">
                <span className="inline-flex rounded-full bg-emerald-600 px-4 py-2 text-[11px] font-extrabold uppercase tracking-wide text-white md:text-xs">
                  Maximum program cap reached
                </span>
              </div>
            )}
          </div>

          <div className={`rounded-3xl border p-5 md:p-6 ${messageToneClasses}`}>
            <div className="flex items-start gap-3">
              {dynamicMessage.tone === 'success' ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              ) : (
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              )}
              <div>
                <h3 className="text-lg font-bold tracking-[-0.02em]">
                  {dynamicMessage.title}
                </h3>
                <p className="mt-2 text-sm leading-7 md:text-base">
                  {dynamicMessage.body}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 md:p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
              Current example
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-700 md:text-base">
              {summarySentence}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 md:p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
              Program Notes
            </p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600 md:text-base">
              <p>Estimates only.</p>
              <p>
                Based on published St. Catharines ADU Program guidelines and the
                current understanding of eligible versus ineligible cost categories.
              </p>
              <p>
                Final grant depends on approved eligible costs, permit timing,
                formal approval, and City review.
              </p>
              <p>
                Program intake is currently closed due to depleted funding;
                homeowners should verify whether future funding becomes available.
              </p>
              <p>Grant is paid after project completion, not upfront.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
