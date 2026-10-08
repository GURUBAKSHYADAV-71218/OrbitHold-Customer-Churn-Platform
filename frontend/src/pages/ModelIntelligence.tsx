import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { fetchModelInfo, type ModelMetrics, ApiError } from "@/lib/api";

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="paper-card p-4 text-center">
      <div className="kpi-value text-2xl">{value}</div>
      <div className="label-tag justify-center text-espresso/45">{label}</div>
    </div>
  );
}

const FEATURE_LABELS: Record<string, string> = {
  tenure: "Short tenure",
  MonthlyCharges: "High monthly charges",
  TotalCharges: "Total charges to date",
  gender: "Gender (male)",
  Partner: "Has a partner",
  Dependents: "Has dependents",
  PhoneService: "Has phone service",
  PaperlessBilling: "Paperless billing",
  SeniorCitizen: "Senior citizen",
  "MultipleLines__No phone service": "No phone service",
  "MultipleLines__Yes": "Multiple phone lines",
  "InternetService__Fiber optic": "Fiber optic service",
  "InternetService__No": "No internet service",
  "OnlineSecurity__No internet service": "No internet service",
  "OnlineSecurity__Yes": "Online security add-on",
  "OnlineBackup__No internet service": "No internet service",
  "OnlineBackup__Yes": "Online backup add-on",
  "DeviceProtection__No internet service": "No internet service",
  "DeviceProtection__Yes": "Device protection add-on",
  "TechSupport__No internet service": "No internet service",
  "TechSupport__Yes": "Tech support add-on",
  "StreamingTV__No internet service": "No internet service",
  "StreamingTV__Yes": "Streaming TV",
  "StreamingMovies__No internet service": "No internet service",
  "StreamingMovies__Yes": "Streaming movies",
  "Contract__One year": "One-year contract",
  "Contract__Two year": "Two-year contract",
  "PaymentMethod__Credit card (automatic)": "Pays by credit card (automatic)",
  "PaymentMethod__Electronic check": "Pays by electronic check",
  "PaymentMethod__Mailed check": "Pays by mailed check",
};

export default function ModelIntelligence() {
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModelInfo()
      .then(setMetrics)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load model info."))
      .finally(() => setLoading(false));
  }, []);

  const topFeatures = metrics?.feature_importance.slice(0, 12).map((f) => ({
    name: FEATURE_LABELS[f.feature] ?? f.feature,
    coefficient: Math.round(f.coefficient * 1000) / 1000,
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <span className="label-tag text-terracotta">Technical Transparency</span>
        <h1 className="mt-2 font-display text-4xl text-espresso">Model Intelligence</h1>
        <p className="mt-2 max-w-2xl text-espresso/60">
          What OrbitHold's churn model is, how it was trained, and how well it performs — measured
          on a real held-out test split, not typed in by hand.
        </p>
      </div>

      {loading && <div className="paper-card p-10 text-center text-espresso/50">Loading model intelligence…</div>}
      {error && !loading && (
        <div className="paper-card border-dustyred/30 p-6 text-dustyred" role="alert">
          {error}
        </div>
      )}

      {metrics && !loading && !error && (
        <div className="space-y-8">
          <div className="paper-card p-6">
            <h2 className="font-display text-lg text-espresso">What does this model learn?</h2>
            <p className="mt-2 text-sm text-espresso/70">
              OrbitHold uses a <strong>{metrics.model_type}</strong> trained on{" "}
              {metrics.dataset_size} real customer records ({metrics.train_size} for training,{" "}
              {metrics.test_size} held out for testing). It learns the statistical relationship
              between a customer's account details — contract type, tenure, pricing, service
              add-ons — and whether similar customers in the training data churned. It does not
              memorize individual customers; it generalizes patterns across the dataset.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <MetricTile label="Accuracy" value={`${Math.round(metrics.accuracy * 100)}%`} />
            <MetricTile label="Precision" value={`${Math.round(metrics.precision * 100)}%`} />
            <MetricTile label="Recall" value={`${Math.round(metrics.recall * 100)}%`} />
            <MetricTile label="F1 Score" value={`${Math.round(metrics.f1_score * 100)}%`} />
            <MetricTile label="ROC-AUC" value={`${Math.round(metrics.roc_auc * 100)}%`} />
          </div>

          <div className="paper-card p-6">
            <h2 className="font-display text-lg text-espresso">Confusion Matrix</h2>
            <p className="text-xs text-espresso/45">On the {metrics.test_size}-customer held-out test set</p>
            <div className="mt-4 grid max-w-md grid-cols-2 gap-2 text-center text-sm">
              <div className="rounded-md bg-olive/10 p-4">
                <div className="kpi-value text-xl">{metrics.confusion_matrix.true_negative}</div>
                <div className="text-espresso/50">True Negative</div>
              </div>
              <div className="rounded-md bg-mustard/10 p-4">
                <div className="kpi-value text-xl">{metrics.confusion_matrix.false_positive}</div>
                <div className="text-espresso/50">False Positive</div>
              </div>
              <div className="rounded-md bg-mustard/10 p-4">
                <div className="kpi-value text-xl">{metrics.confusion_matrix.false_negative}</div>
                <div className="text-espresso/50">False Negative</div>
              </div>
              <div className="rounded-md bg-teal/10 p-4">
                <div className="kpi-value text-xl">{metrics.confusion_matrix.true_positive}</div>
                <div className="text-espresso/50">True Positive</div>
              </div>
            </div>
            <p className="mt-3 text-xs text-espresso/45">
              Dataset churn distribution: {metrics.churn_distribution.churned} churned,{" "}
              {metrics.churn_distribution.retained} retained (
              {Math.round(metrics.churn_distribution.churn_rate * 100)}% churn rate).
            </p>
          </div>

          <div className="paper-card p-6">
            <h2 className="font-display text-lg text-espresso">Global Feature Importance</h2>
            <p className="text-xs text-espresso/45">
              Model Contribution — the logistic regression coefficient magnitude for each feature
              (the same quantity SHAP reduces to for a linear model)
            </p>
            <div className="mt-4 h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topFeatures} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,33,27,0.08)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#2A211B99" }} />
                  <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11, fill: "#2A211B99" }} />
                  <Tooltip
                    contentStyle={{ background: "#FAF7F0", border: "1px solid rgba(42,33,27,0.1)", borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="coefficient" radius={[0, 4, 4, 0]}>
                    {topFeatures?.map((f) => (
                      <Cell key={f.name} fill={f.coefficient >= 0 ? "#9B4D3A" : "#557C78"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-espresso/45">
              Positive (terracotta) bars push churn probability up; negative (teal) bars push it down.
            </p>
          </div>

          <p className="border-t border-espresso/10 pt-6 text-sm italic text-espresso/50">
            Model predictions are probabilistic estimates and should support, not replace, business
            judgment.
          </p>
        </div>
      )}
    </div>
  );
}
