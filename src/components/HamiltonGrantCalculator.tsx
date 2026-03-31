import { useMemo, useState } from "react";

const formatCurrency = (value: number) =>
  value.toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  });

export default function HamiltonGrantCalculator() {
  const [totalCost, setTotalCost] = useState(100000);
  const [eligiblePercent, setEligiblePercent] = useState(80);

  const eligibleCost = useMemo(
    () => Math.round((totalCost * eligiblePercent) / 100),
    [totalCost, eligiblePercent]
  );

  const grant = Math.min(eligibleCost * 0.7, 40000);
  const netCost = Math.max(totalCost - grant, 0);
  const monthly = Math.round(netCost / 120);
  const rent = 1600;
  const monthlySurplus = rent - monthly;
  const fullGrantUnlocked = grant >= 40000;

  const message = useMemo(() => {
    if (fullGrantUnlocked) {
      return "You’re in the ideal range — this project can unlock the full $40,000 grant.";
    }
    if (eligiblePercent >= 70 && eligiblePercent < 80) {
      return "You’re in a solid range, but increasing the qualifying portion could boost your grant.";
    }
    return "This project may not be fully taking advantage of the incentive yet.";
  }, [fullGrantUnlocked, eligiblePercent]);

  const exampleText = `Example: a ${formatCurrency(
    totalCost
  )} project with ${eligiblePercent}% qualifying costs could receive about ${formatCurrency(
    grant
  )} back.`;

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="mb-8">
        <p className="text-base font-semibold text-slate-900 md:text-lg">
          Move the sliders to match your project — we’ll calculate everything for you.
        </p>
        <p className="mt-2 text-sm text-slate-600 md:text-base">
          Most basement projects have about <span className="font-semibold">70% to 90%</span> of
          costs that qualify for the grant.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center justify-between gap-4">
            <label className="text-sm font-semibold text-slate-700 md:text-base">
              Total Project Cost
            </label>
            <span className="text-base font-extrabold text-slate-900 md:text-lg">
              {formatCurrency(totalCost)}
            </span>
          </div>

          <input
            type="range"
            min={20000}
            max={150000}
            step={5000}
            value={totalCost}
            onChange={(e) => setTotalCost(Number(e.target.value))}
            className="slider-blue h-4 w-full cursor-pointer appearance-none rounded-full bg-slate-200"
          />
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between gap-4">
            <label className="text-sm font-semibold text-slate-700 md:text-base">
              Portion of Your Project That Qualifies
            </label>
            <span className="text-base font-extrabold text-slate-900 md:text-lg">
              {eligiblePercent}%
            </span>
          </div>

          <input
            type="range"
            min={50}
            max={100}
            step={5}
            value={eligiblePercent}
            onChange={(e) => setEligiblePercent(Number(e.target.value))}
            className="slider-blue h-4 w-full cursor-pointer appearance-none rounded-full bg-slate-200"
          />

          <p className="mt-3 text-sm text-slate-600">
            Estimated qualifying amount:{" "}
            <span className="font-semibold text-slate-900">{formatCurrency(eligibleCost)}</span>
          </p>
        </div>
      </div>

      <div className="mt-10">
        <p className="text-base font-semibold text-slate-900 md:text-lg">
          Here’s what your project could look like:
        </p>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <div
          className={`relative rounded-3xl border-2 border-green-200 bg-green-50 text-center ${
            fullGrantUnlocked ? "pt-14 pb-6 px-6" : "p-6"
          }`}
        >
          {fullGrantUnlocked && (
            <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-green-600 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-sm md:text-xs">
              Max Grant Unlocked
            </div>
          )}

          <p className="text-sm font-semibold uppercase tracking-wide text-slate-600">
            Estimated Grant
          </p>
          <p className="mt-3 text-3xl font-extrabold text-green-600">
            {formatCurrency(grant)}
          </p>
        </div>

        <div className="rounded-3xl bg-slate-50 p-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-600">
            Your Real Cost
          </p>
          <p className="mt-3 text-3xl font-extrabold text-slate-900">
            {formatCurrency(netCost)}
          </p>
        </div>

        <div className="rounded-3xl bg-slate-50 p-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-600">
            Est. Monthly Cost
          </p>
          <p className="mt-3 text-3xl font-extrabold text-slate-900">
            {formatCurrency(monthly)}/mo
          </p>
        </div>

        <div className="rounded-3xl bg-slate-50 p-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-600">
            Potential Rent
          </p>
          <p className="mt-3 text-3xl font-extrabold text-green-600">
            {formatCurrency(rent)}/mo
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-2xl bg-slate-900 px-5 py-4 text-center">
        <p className="text-base font-bold text-white md:text-lg">{message}</p>
        <p className="mt-2 text-sm text-slate-300 md:text-base">
          In many cases, your rental income can cover or exceed your monthly cost.
        </p>
        <p className="mt-2 text-sm font-semibold text-yellow-300 md:text-base">
          Potential monthly surplus: {formatCurrency(monthlySurplus)}
        </p>
      </div>

      <div className="mt-6 rounded-2xl bg-slate-50 px-5 py-4 text-center">
        <p className="text-sm font-medium text-slate-700 md:text-base">{exampleText}</p>
      </div>

      <div className="mt-6 text-center text-xs leading-6 text-slate-500 md:text-sm">
        Estimates only. Final grant depends on approved eligible costs, permits, and City of
        Hamilton review.
      </div>
    </div>
  );
}
