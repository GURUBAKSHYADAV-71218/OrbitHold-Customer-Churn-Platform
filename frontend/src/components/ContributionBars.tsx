import type { RiskDriver } from "@/lib/types";

function Bar({ driver, maxAbs, tone }: { driver: RiskDriver; maxAbs: number; tone: "risk" | "protective" }) {
  const pct = maxAbs > 0 ? (Math.abs(driver.contribution) / maxAbs) * 100 : 0;
  const barColor = tone === "risk" ? "bg-dustyred" : "bg-teal";
  return (
    <div className="flex items-center gap-3">
      <span className="w-40 shrink-0 truncate text-sm text-espresso/75" title={driver.label}>
        {driver.label}
      </span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-espresso/8">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${Math.max(pct, 4)}%` }}
        />
      </div>
    </div>
  );
}

export default function ContributionBars({
  drivers,
  protective,
}: {
  drivers: RiskDriver[];
  protective: RiskDriver[];
}) {
  const maxAbs = Math.max(
    1e-6,
    ...drivers.map((d) => Math.abs(d.contribution)),
    ...protective.map((d) => Math.abs(d.contribution))
  );

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <div>
        <h3 className="label-tag text-dustyred">Why churn risk is elevated</h3>
        <div className="mt-3 space-y-2.5">
          {drivers.length > 0 ? (
            drivers.map((d) => <Bar key={d.feature} driver={d} maxAbs={maxAbs} tone="risk" />)
          ) : (
            <p className="text-sm text-espresso/50">No strong risk-increasing factors detected.</p>
          )}
        </div>
      </div>
      <div>
        <h3 className="label-tag text-teal-dark">Protective factors</h3>
        <div className="mt-3 space-y-2.5">
          {protective.length > 0 ? (
            protective.map((d) => <Bar key={d.feature} driver={d} maxAbs={maxAbs} tone="protective" />)
          ) : (
            <p className="text-sm text-espresso/50">No strong protective factors detected.</p>
          )}
        </div>
      </div>
      <p className="sm:col-span-2 text-xs text-espresso/45">
        Model Contribution: each bar is this feature's exact contribution to the churn log-odds
        (coefficient × scaled value) from the trained logistic regression — the same quantity SHAP
        reduces to for a linear model, shown here directly rather than via approximation.
      </p>
    </div>
  );
}
