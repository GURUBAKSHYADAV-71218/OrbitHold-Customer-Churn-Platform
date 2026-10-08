import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Users, AlertTriangle, TrendingDown, Gauge } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useDataset } from "@/lib/DatasetContext";
import RiskBadge from "@/components/RiskBadge";

const RISK_COLORS: Record<string, string> = {
  HIGH: "#9B4D3A",
  MEDIUM: "#C49A45",
  LOW: "#557C78",
};

const TONE_CLASSES: Record<string, string> = {
  espresso: "text-espresso",
  dustyred: "text-dustyred",
  "mustard-dark": "text-mustard-dark",
};

function KpiCard({
  icon: Icon,
  label,
  value,
  tone = "espresso",
}: {
  icon: typeof Users;
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="paper-card p-5">
      <div className="flex items-center gap-2 text-espresso/50">
        <Icon className="h-4 w-4" strokeWidth={1.75} />
        <span className="label-tag">{label}</span>
      </div>
      <div className={`kpi-value mt-2 ${TONE_CLASSES[tone] ?? "text-espresso"}`}>{value}</div>
    </div>
  );
}

export default function Overview() {
  const { predictions, summary, source, loading, error } = useDataset();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <span className="label-tag text-terracotta">Retention Intelligence</span>
        <h1 className="mt-2 font-display text-4xl text-espresso">
          Know who is leaving before they leave.
        </h1>
        <p className="mt-2 max-w-2xl text-espresso/60">
          Showing the {source === "demo" ? <strong>Demo Dataset</strong> : "uploaded dataset"} —
          upload your own customer CSV from the{" "}
          <NavLink to="/explorer" className="text-terracotta hover:underline">
            Customer Explorer
          </NavLink>{" "}
          to replace it.
        </p>
      </div>

      {loading && (
        <div className="paper-card p-10 text-center text-espresso/50">
          Generating risk intelligence…
        </div>
      )}

      {error && !loading && (
        <div className="paper-card border-dustyred/30 p-6 text-dustyred" role="alert">
          Couldn't load the dataset: {error}
        </div>
      )}

      {summary && !loading && !error && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard icon={Users} label="Total Customers" value={String(summary.totalCustomers)} />
            <KpiCard
              icon={AlertTriangle}
              label="High Risk"
              value={String(summary.highRisk)}
              tone="dustyred"
            />
            <KpiCard
              icon={Gauge}
              label="Avg. Churn Risk"
              value={`${Math.round(summary.averageChurnProbability * 100)}%`}
            />
            <KpiCard
              icon={TrendingDown}
              label="Retention Opportunities"
              value={String(summary.highRisk + summary.mediumRisk)}
              tone="mustard-dark"
            />
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="paper-card p-6 lg:col-span-1">
              <h2 className="font-display text-lg text-espresso">Risk Distribution</h2>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "High", value: summary.highRisk },
                        { name: "Medium", value: summary.mediumRisk },
                        { name: "Low", value: summary.lowRisk },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={2}
                    >
                      {["HIGH", "MEDIUM", "LOW"].map((key) => (
                        <Cell key={key} fill={RISK_COLORS[key]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#FAF7F0",
                        border: "1px solid rgba(42,33,27,0.1)",
                        borderRadius: 8,
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="paper-card p-6 lg:col-span-2">
              <h2 className="font-display text-lg text-espresso">Highest-Risk Customers</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-espresso/10 text-espresso/50">
                      <th className="py-2 pr-4 font-medium">Customer</th>
                      <th className="py-2 pr-4 font-medium">Probability</th>
                      <th className="py-2 pr-4 font-medium">Risk</th>
                      <th className="py-2 font-medium">Top Driver</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...predictions]
                      .sort((a, b) => b.churnProbability - a.churnProbability)
                      .slice(0, 6)
                      .map((p) => (
                        <tr key={p.customerID} className="border-b border-espresso/5">
                          <td className="py-2 pr-4">
                            <NavLink
                              to={`/customer/${encodeURIComponent(p.customerID)}`}
                              className="font-mono text-xs text-terracotta hover:underline"
                            >
                              {p.customerID}
                            </NavLink>
                          </td>
                          <td className="py-2 pr-4">{Math.round(p.churnProbability * 100)}%</td>
                          <td className="py-2 pr-4">
                            <RiskBadge level={p.riskLevel} />
                          </td>
                          <td className="py-2 text-espresso/70">
                            {p.topRiskDrivers[0]?.label ?? "—"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
