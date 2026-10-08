import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useDataset } from "@/lib/DatasetContext";
import RiskBadge from "@/components/RiskBadge";

const PRIORITIES = ["URGENT", "HIGH", "MEDIUM", "LOW"] as const;

const PRIORITY_META: Record<(typeof PRIORITIES)[number], { label: string; tone: string; copy: string }> = {
  URGENT: {
    label: "Urgent Retention",
    tone: "border-dustyred/30 bg-dustyred/5",
    copy: "High risk and either newly onboarded or on a month-to-month contract — act within days.",
  },
  HIGH: {
    label: "High Priority",
    tone: "border-terracotta/30 bg-terracotta/5",
    copy: "High churn risk on a longer-term contract — schedule direct outreach this cycle.",
  },
  MEDIUM: {
    label: "Monitor",
    tone: "border-mustard/30 bg-mustard/5",
    copy: "Moderate risk — worth a check-in, not urgent.",
  },
  LOW: {
    label: "Low Priority",
    tone: "border-olive/30 bg-olive/5",
    copy: "Low churn signal — standard engagement is sufficient.",
  },
};

export default function Retention() {
  const { predictions, loading, error } = useDataset();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ URGENT: true });

  const groups = useMemo(() => {
    return PRIORITIES.map((priority) => {
      const rows = predictions.filter((p) => p.recommendation.priority === priority);
      const avgProbability =
        rows.length > 0 ? rows.reduce((s, r) => s + r.churnProbability, 0) / rows.length : 0;
      return { priority, rows, avgProbability };
    });
  }, [predictions]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <span className="label-tag text-terracotta">Retention Workflow</span>
        <h1 className="mt-2 font-display text-4xl text-espresso">Retention Action Center</h1>
        <p className="mt-2 max-w-2xl text-espresso/60">
          Customers grouped by recommended intervention priority, generated from each customer's
          risk level, tenure, and contract type.
        </p>
      </div>

      {loading && <div className="paper-card p-10 text-center text-espresso/50">Prioritizing customers…</div>}
      {error && !loading && (
        <div className="paper-card border-dustyred/30 p-6 text-dustyred" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-4">
          {groups.map(({ priority, rows, avgProbability }) => {
            const meta = PRIORITY_META[priority];
            const isOpen = !!expanded[priority];
            return (
              <div key={priority} className={`paper-card border p-0 ${meta.tone}`}>
                <button
                  className="flex w-full flex-col gap-3 px-4 py-4 text-left sm:flex-row sm:items-center sm:justify-between sm:px-6"
                  onClick={() => setExpanded((e) => ({ ...e, [priority]: !e[priority] }))}
                  aria-expanded={isOpen}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="label-tag text-espresso">{meta.label}</span>
                    </div>
                    <p className="mt-1 text-xs text-espresso/55">{meta.copy}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="kpi-value text-2xl">{rows.length}</div>
                      <div className="text-[11px] uppercase text-espresso/45">Customers</div>
                    </div>
                    <div className="text-right">
                      <div className="kpi-value text-2xl">{Math.round(avgProbability * 100)}%</div>
                      <div className="text-[11px] uppercase text-espresso/45">Avg. Risk</div>
                    </div>
                    {isOpen ? <ChevronUp className="h-5 w-5 text-espresso/40" /> : <ChevronDown className="h-5 w-5 text-espresso/40" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-espresso/10 px-6 py-4">
                    {rows.length === 0 ? (
                      <p className="py-4 text-sm text-espresso/45">No customers in this group.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="border-b border-espresso/10 text-espresso/50">
                              <th className="py-2 pr-4 font-medium">Customer</th>
                              <th className="py-2 pr-4 font-medium">Risk</th>
                              <th className="py-2 pr-4 font-medium">Contract</th>
                              <th className="py-2 font-medium">Top Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.slice(0, 100).map((r) => (
                              <tr key={r.customerID} className="border-b border-espresso/5">
                                <td className="py-2 pr-4">
                                  <NavLink
                                    to={`/customer/${encodeURIComponent(r.customerID)}`}
                                    className="font-mono text-xs text-terracotta hover:underline"
                                  >
                                    {r.customerID}
                                  </NavLink>
                                </td>
                                <td className="py-2 pr-4">
                                  <RiskBadge level={r.riskLevel} />
                                </td>
                                <td className="py-2 pr-4 text-espresso/70">{r.customer.Contract}</td>
                                <td className="py-2 text-espresso/70">{r.recommendation.actions[0]}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {rows.length > 100 && (
                          <p className="mt-2 text-xs text-espresso/45">
                            Showing the first 100 of {rows.length} customers in this group.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
