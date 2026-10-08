import { ShieldAlert, Clock, CreditCard, Wifi } from "lucide-react";
import RiskGauge from "./RiskGauge";
import RiskBadge from "./RiskBadge";
import ContributionBars from "./ContributionBars";
import type { CustomerInput, CustomerPrediction } from "@/lib/types";

const PRIORITY_STYLE: Record<string, string> = {
  URGENT: "bg-dustyred/10 text-dustyred border-dustyred/30",
  HIGH: "bg-terracotta/10 text-terracotta border-terracotta/30",
  MEDIUM: "bg-mustard/15 text-mustard-dark border-mustard/30",
  LOW: "bg-olive/10 text-olive-light border-olive/30",
};

function AttributeChip({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-espresso/10 bg-parchment px-3 py-2">
      <Icon className="h-4 w-4 text-espresso/50" strokeWidth={1.75} />
      <div>
        <div className="text-[11px] uppercase tracking-wide text-espresso/45">{label}</div>
        <div className="text-sm font-medium text-espresso">{value}</div>
      </div>
    </div>
  );
}

export default function CustomerProfilePanel({
  customer,
  prediction,
}: {
  customer: CustomerInput;
  prediction: CustomerPrediction;
}) {
  return (
    <div className="space-y-6">
      <div className="paper-card p-6">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div>
            <span className="label-tag text-espresso/45">Customer</span>
            <h2 className="font-mono text-2xl text-espresso">{prediction.customerID}</h2>
            <div className="mt-2">
              <RiskBadge level={prediction.riskLevel} />
            </div>
            <div className="mt-3 font-display text-3xl text-espresso">
              {Math.round(prediction.churnProbability * 100)}%
              <span className="ml-2 text-sm font-sans text-espresso/50">churn probability</span>
            </div>
          </div>
          <RiskGauge score={prediction.riskScore} level={prediction.riskLevel} />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <AttributeChip icon={Clock} label="Tenure" value={`${customer.tenure} mo`} />
          <AttributeChip icon={CreditCard} label="Monthly Charges" value={`$${customer.MonthlyCharges.toFixed(2)}`} />
          <AttributeChip icon={ShieldAlert} label="Contract" value={customer.Contract} />
          <AttributeChip icon={Wifi} label="Internet" value={customer.InternetService} />
        </div>
      </div>

      <div className="paper-card p-6">
        <h2 className="font-display text-lg text-espresso">Why?</h2>
        <div className="mt-4">
          <ContributionBars drivers={prediction.topRiskDrivers} protective={prediction.protectiveFactors} />
        </div>
      </div>

      <div className="paper-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-espresso">Recommended Retention Plan</h2>
          <span
            className={`label-tag rounded-full border px-2.5 py-1 ${PRIORITY_STYLE[prediction.recommendation.priority]}`}
          >
            {prediction.recommendation.priority}
          </span>
        </div>
        <p className="mt-2 text-sm text-espresso/65">{prediction.recommendation.reason}</p>
        <ol className="mt-4 space-y-2">
          {prediction.recommendation.actions.map((action, i) => (
            <li key={action} className="flex gap-3 text-sm text-espresso/80">
              <span className="font-display text-terracotta">{i + 1}.</span>
              {action}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
