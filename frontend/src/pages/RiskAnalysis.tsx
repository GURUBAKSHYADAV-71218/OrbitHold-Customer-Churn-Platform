import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useDataset } from "@/lib/DatasetContext";
import type { ScoredCustomer } from "@/lib/types";

function groupChurnRate(rows: ScoredCustomer[], keyFn: (r: ScoredCustomer) => string): { name: string; churnRate: number; count: number }[] {
  const buckets = new Map<string, { total: number; churnSum: number }>();
  for (const r of rows) {
    const key = keyFn(r);
    const bucket = buckets.get(key) ?? { total: 0, churnSum: 0 };
    bucket.total += 1;
    bucket.churnSum += r.churnProbability;
    buckets.set(key, bucket);
  }
  return Array.from(buckets.entries())
    .map(([name, { total, churnSum }]) => ({
      name,
      churnRate: Math.round((churnSum / total) * 1000) / 10,
      count: total,
    }))
    .sort((a, b) => b.churnRate - a.churnRate);
}

function tenureBucket(tenure: number): string {
  if (tenure <= 6) return "0-6 mo";
  if (tenure <= 12) return "7-12 mo";
  if (tenure <= 24) return "13-24 mo";
  if (tenure <= 48) return "25-48 mo";
  return "49+ mo";
}

function chargesBucket(charges: number): string {
  if (charges < 35) return "<$35";
  if (charges < 65) return "$35-65";
  if (charges < 90) return "$65-90";
  return "$90+";
}

function ChartCard({ title, data }: { title: string; data: { name: string; churnRate: number; count: number }[] }) {
  return (
    <div className="paper-card p-6">
      <h2 className="font-display text-lg text-espresso">{title}</h2>
      <p className="text-xs text-espresso/45">Average churn probability by segment</p>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,33,27,0.08)" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 11, fill: "#2A211B99" }} />
            <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fill: "#2A211B99" }} />
            <Tooltip
              formatter={(value: number, _name, props) => [`${value}% (n=${props.payload.count})`, "Churn rate"]}
              contentStyle={{ background: "#FAF7F0", border: "1px solid rgba(42,33,27,0.1)", borderRadius: 8, fontSize: 12 }}
            />
            <Bar dataKey="churnRate" fill="#B65F45" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function RiskAnalysis() {
  const { predictions, loading, error, source } = useDataset();

  const byContract = useMemo(() => groupChurnRate(predictions, (r) => r.customer.Contract), [predictions]);
  const byTenure = useMemo(
    () => groupChurnRate(predictions, (r) => tenureBucket(r.customer.tenure)).sort((a, b) => a.name.localeCompare(b.name)),
    [predictions]
  );
  const byCharges = useMemo(
    () => groupChurnRate(predictions, (r) => chargesBucket(r.customer.MonthlyCharges)),
    [predictions]
  );
  const byInternet = useMemo(() => groupChurnRate(predictions, (r) => r.customer.InternetService), [predictions]);
  const byPayment = useMemo(() => groupChurnRate(predictions, (r) => r.customer.PaymentMethod), [predictions]);
  const bySenior = useMemo(
    () => groupChurnRate(predictions, (r) => (r.customer.SeniorCitizen === 1 ? "Senior" : "Non-senior")),
    [predictions]
  );
  const bySupport = useMemo(
    () => groupChurnRate(predictions, (r) => (r.customer.TechSupport === "Yes" ? "Has tech support" : "No tech support")),
    [predictions]
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <span className="label-tag text-terracotta">Portfolio Analytics</span>
        <h1 className="mt-2 font-display text-4xl text-espresso">Risk Analysis</h1>
        <p className="mt-2 max-w-2xl text-espresso/60">
          Churn risk broken down by customer characteristics, computed live from the{" "}
          {source === "demo" ? "Demo Dataset" : "uploaded dataset"} ({predictions.length} customers).
        </p>
      </div>

      {loading && <div className="paper-card p-10 text-center text-espresso/50">Computing risk analytics…</div>}
      {error && !loading && (
        <div className="paper-card border-dustyred/30 p-6 text-dustyred" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && predictions.length === 0 && (
        <div className="paper-card p-10 text-center text-espresso/50">
          No customers loaded yet — visit the Customer Explorer to upload a dataset.
        </div>
      )}

      {!loading && !error && predictions.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Churn by Contract" data={byContract} />
          <ChartCard title="Churn by Tenure" data={byTenure} />
          <ChartCard title="Churn by Monthly Charges" data={byCharges} />
          <ChartCard title="Churn by Internet Service" data={byInternet} />
          <ChartCard title="Churn by Payment Method" data={byPayment} />
          <ChartCard title="Churn by Senior Citizen Status" data={bySenior} />
          <ChartCard title="Churn by Tech Support Coverage" data={bySupport} />
        </div>
      )}
    </div>
  );
}
