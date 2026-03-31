import { useState } from "react";

export default function HamiltonGrantCalculator() {
  const [totalCost, setTotalCost] = useState(100000);
  const [eligibleCost, setEligibleCost] = useState(60000);

  const grant = Math.min(eligibleCost * 0.7, 40000);
  const netCost = totalCost - grant;

  // Simple monthly estimate (rough financing)
  const monthly = Math.round(netCost / 120); // 10 years rough
  const rent = 1600;

  let message = "";
  if (grant >= 40000) {
    message = "You may qualify for the full $40,000 grant.";
  } else if (eligibleCost < 40000) {
    message = "You may not be maximizing the full grant yet.";
  } else {
    message = "You're in a strong range for this incentive.";
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      
      {/* SLIDERS */}
      <div className="grid gap-8 md:grid-cols-2">
        
        {/* Total Project Cost */}
        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-2">
            Total Project Cost: ${totalCost.toLocaleString()}
          </label>
          <input
            type="range"
            min={20000}
            max={150000}
            step={5000}
            value={totalCost}
            onChange={(e) => setTotalCost(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Eligible Cost */}
        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-2">
            Eligible Construction Cost: ${eligibleCost.toLocaleString()}
          </label>
          <input
            type="range"
            min={20000}
            max={100000}
            step={5000}
            value={eligibleCost}
            onChange={(e) => setEligibleCost(Number(e.target.value))}
            className="w-full"
          />
        </div>

      </div>

      {/* RESULTS */}
      <div className="mt-10 grid gap-6 md:grid-cols-4">
        
        <div className="rounded-2xl bg-slate-50 p-6 text-center">
          <p className="text-sm text-slate-500">Estimated Grant</p>
          <p className="mt-2 text-2xl font-bold text-green-600">
            ${grant.toLocaleString()}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-6 text-center">
          <p className="text-sm text-slate-500">Net Cost</p>
          <p className="mt-2 text-2xl font-bold">
            ${netCost.toLocaleString()}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-6 text-center">
          <p className="text-sm text-slate-500">Est. Monthly</p>
          <p className="mt-2 text-2xl font-bold">
            ${monthly}/mo
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-6 text-center">
          <p className="text-sm text-slate-500">Potential Rent</p>
          <p className="mt-2 text-2xl font-bold text-green-600">
            ${rent}/mo
          </p>
        </div>

      </div>

      {/* MESSAGE */}
      <div className="mt-6 text-center">
        <p className="text-sm font-semibold text-slate-700">
          {message}
        </p>
      </div>

      {/* DISCLAIMER */}
      <div className="mt-6 text-xs text-slate-500 text-center">
        Estimates only. Final grant depends on approved eligible costs and City of Hamilton review.
      </div>

    </div>
  );
}
