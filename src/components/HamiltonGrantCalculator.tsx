import { useMemo, useState } from "react";

const formatCurrency = (value: number) =>
  value.toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  });

export default function HamiltonGrantCalculator() {
  const [totalCost, setTotalCost] = useState(80000);

  const eligiblePercent = 80;
  const eligibleCost = useMemo(
    () => Math.round(totalCost * (eligiblePercent / 100)),
    [totalCost]
  );

  const rawGrant = eligibleCost * 0.7;
  const grant = Math.min(rawGrant, 40000);
  const netCost = Math.max(totalCost - grant, 0);
  const fullGrantUnlocked = grant >= 40000;

  const message = useMemo(() => {
    if (fullGrantUnlocked) {
      return "You’re in the ideal range — this project can unlock the full $40,000 grant.";
    }
    if (totalCost >= 60000) {
      return "You’re in a strong range, and a well-structured project can significantly increase your grant.";
    }
    return "This project may qualify for less than the full incentive, but it can still reduce your real cost substantially.";
  }, [fullGrantUnlocked, totalCost]);

  const exampleText = `Example: a ${formatCurrency(
    totalCost
  )} project could receive about ${formatCurrency(
    grant
  )} back based on a typical qualifying structure.`;

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="mb-8">
        <p className="text-base font-semibold text-slate-900 md:text-lg">
          Move the slider to match your project — we’ll calculate everything for you.
        </p>
        <p className="mt-2 text-sm text-slate-600 md:text-base">
          We use a typical estimate that about{" "}
          <span className="font-semibold">80% of a basement project qualifies</span>{" "}
          for the grant. Final numbers may vary depending on your scope, permits,
          and eligible construction costs.
        </p>
      </div>

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

        <div className="mt-3 space-y-1 text-sm text-slate-600">
          <p>
            Estimated qualifying costs:{" "}
            <span className="font-semibold text-slate-900">
              {formatCurrency(eligibleCost)}
            </span>
          </p>
          <p>
            Grant covers 70% of that amount:{" "}
            <span className="font-semibold text-slate-900">
              {formatCurrency(rawGrant)}
            </span>
            {rawGrant > 40000 && (
              <span className="text-slate-500"> (capped at {formatCurrency(40000)})</span>
            )}
          </p>
        </div>
      </div>

      <div className="mt-10">
        <p className="text-base font-semibold text-slate-900 md:text-lg">
          Here’s what your project could look like:
        </p>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
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
            Your Real Cost After Grant
          </p>
          <p className="mt-3 text-3xl font-extrabold text-slate-900">
            {formatCurrency(netCost)}
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-2xl bg-slate-900 px-5 py-4 text-center">
        <p className="text-base font-bold text-white md:text-lg">{message}</p>
        <p className="mt-2 text-sm text-slate-300 md:text-base">
          A properly structured basement project can significantly reduce your real out-of-pocket cost.
        </p>
      </div>

      <div className="mt-6 rounded-2xl bg-slate-50 px-5 py-4 text-center">
        <p className="text-sm font-medium text-slate-700 md:text-base">{exampleText}</p>
      </div>

      <div className="mt-6 text-center text-xs leading-6 text-slate-500 md:text-sm">
        Estimates only. This calculator assumes a typical project structure where
        roughly 80% of costs qualify. Final grant amounts depend on approved eligible
        costs, permits, and City of Hamilton review.
      </div>
    </div>
  );
}
