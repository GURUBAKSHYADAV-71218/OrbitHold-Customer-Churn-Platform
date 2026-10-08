// Production inference engine.
//
// This re-implements the exact scoring of the trained scikit-learn
// LogisticRegression model (see ml/training/train.py) in TypeScript, using
// the coefficients/scaler stats exported to ml/models/model.json. That
// means the deployed Vercel functions never need to spawn a Python
// process or load a pickle at request time — model.json is a plain JSON
// file bundled with the function, read once per cold start.

import modelArtifact from "../../ml/models/model.json";
import type { CustomerInput, RiskDriver, RiskLevel, RetentionAction } from "./types";

interface ModelArtifact {
  model_type: string;
  intercept: number;
  feature_names: string[];
  coefficients: number[];
  numeric_features: string[];
  scaler: { mean: Record<string, number>; scale: Record<string, number> };
  binary_features: Record<string, Record<string, number>>;
  categorical_features: Record<string, { baseline: string; levels: string[] }>;
  risk_thresholds: { low_max: number; medium_max: number };
}

const model = modelArtifact as unknown as ModelArtifact;

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

function labelFor(feature: string): string {
  return FEATURE_LABELS[feature] ?? feature;
}

/** Builds the exact same 30-column feature vector used at training time. */
export function buildFeatureVector(customer: CustomerInput): number[] {
  const raw: Record<string, number> = {};

  raw.tenure = customer.tenure;
  raw.MonthlyCharges = customer.MonthlyCharges;
  raw.TotalCharges = customer.TotalCharges;

  raw.gender = customer.gender === "Male" ? 1 : 0;
  raw.Partner = customer.Partner === "Yes" ? 1 : 0;
  raw.Dependents = customer.Dependents === "Yes" ? 1 : 0;
  raw.PhoneService = customer.PhoneService === "Yes" ? 1 : 0;
  raw.PaperlessBilling = customer.PaperlessBilling === "Yes" ? 1 : 0;
  raw.SeniorCitizen = customer.SeniorCitizen;

  const categoricalMap: Record<string, string> = {
    MultipleLines: customer.MultipleLines,
    InternetService: customer.InternetService,
    OnlineSecurity: customer.OnlineSecurity,
    OnlineBackup: customer.OnlineBackup,
    DeviceProtection: customer.DeviceProtection,
    TechSupport: customer.TechSupport,
    StreamingTV: customer.StreamingTV,
    StreamingMovies: customer.StreamingMovies,
    Contract: customer.Contract,
    PaymentMethod: customer.PaymentMethod,
  };

  for (const [col, vocab] of Object.entries(model.categorical_features)) {
    const value = categoricalMap[col];
    for (const level of vocab.levels) {
      raw[`${col}__${level}`] = value === level ? 1 : 0;
    }
  }

  // z-score the numeric columns with the training-time mean/std — must
  // mirror sklearn's StandardScaler exactly, or predictions drift.
  for (const col of model.numeric_features) {
    const mean = model.scaler.mean[col];
    const scale = model.scaler.scale[col] || 1;
    raw[col] = (raw[col] - mean) / scale;
  }

  return model.feature_names.map((name) => raw[name] ?? 0);
}

function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

export function predictProbability(vector: number[]): number {
  let z = model.intercept;
  for (let i = 0; i < vector.length; i++) z += model.coefficients[i] * vector[i];
  return sigmoid(z);
}

export function riskLevelFor(probability: number): RiskLevel {
  if (probability < model.risk_thresholds.low_max) return "LOW";
  if (probability < model.risk_thresholds.medium_max) return "MEDIUM";
  return "HIGH";
}

export function riskScoreFor(probability: number): number {
  return Math.round(probability * 100);
}

/**
 * Linear model contribution explanation. For a logistic regression,
 * coefficient x (scaled feature value) is the exact per-feature
 * contribution to the log-odds of churn — mathematically what SHAP
 * reduces to for a linear model. We label it "Model Contribution"
 * rather than "SHAP" since no sampling/approximation is used here.
 */
export function explain(vector: number[]): { drivers: RiskDriver[]; protective: RiskDriver[] } {
  const contributions: RiskDriver[] = model.feature_names.map((name, i) => ({
    feature: name,
    label: labelFor(name),
    contribution: model.coefficients[i] * vector[i],
  }));

  const drivers = contributions
    .filter((c) => c.contribution > 0.001)
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 5);

  const protective = contributions
    .filter((c) => c.contribution < -0.001)
    .sort((a, b) => a.contribution - b.contribution)
    .slice(0, 5);

  return { drivers, protective };
}

export function recommend(
  customer: CustomerInput,
  riskLevel: RiskLevel,
  drivers: RiskDriver[]
): RetentionAction {
  const actions: string[] = [];
  const driverFeatures = new Set(drivers.map((d) => d.feature));

  if (customer.Contract === "Month-to-month") {
    actions.push("Offer a long-term contract incentive (1-year or 2-year discount).");
  }
  if (driverFeatures.has("MonthlyCharges") || customer.MonthlyCharges > 80) {
    actions.push("Review monthly pricing with the customer; consider a loyalty discount.");
  }
  if (customer.TechSupport === "No" && customer.InternetService !== "No") {
    actions.push("Offer a complimentary tech support add-on.");
  }
  if (customer.OnlineSecurity === "No" && customer.InternetService !== "No") {
    actions.push("Offer an online security add-on bundle.");
  }
  if (customer.tenure <= 6) {
    actions.push("Enroll in an early-tenure onboarding / check-in campaign.");
  }
  if (customer.PaymentMethod === "Electronic check") {
    actions.push("Review billing/payment friction; suggest switching to autopay.");
  }
  if (riskLevel === "HIGH") {
    actions.push("Prioritize this customer for direct retention outreach.");
  }
  if (actions.length === 0) {
    actions.push("Continue standard engagement; no urgent intervention indicated.");
  }

  const priority: RetentionAction["priority"] =
    riskLevel === "HIGH"
      ? customer.tenure <= 6 || customer.Contract === "Month-to-month"
        ? "URGENT"
        : "HIGH"
      : riskLevel === "MEDIUM"
        ? "MEDIUM"
        : "LOW";

  const topDriverLabels = drivers.slice(0, 3).map((d) => d.label).join(", ");
  const reason =
    drivers.length > 0
      ? `Elevated churn risk driven primarily by: ${topDriverLabels}.`
      : "No strong risk drivers detected; low overall churn signal.";

  return { priority, actions: [...new Set(actions)], reason };
}

export function getModelMeta() {
  return { model_type: model.model_type, risk_thresholds: model.risk_thresholds };
}
