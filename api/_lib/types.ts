// Mirrors the columns of the Telco Customer Churn dataset. This is the
// single source of truth for what a "customer" looks like across the
// batch upload validator, the single-customer form, and the model.

export interface CustomerInput {
  customerID?: string;
  gender: "Male" | "Female";
  SeniorCitizen: 0 | 1;
  Partner: "Yes" | "No";
  Dependents: "Yes" | "No";
  tenure: number;
  PhoneService: "Yes" | "No";
  MultipleLines: "Yes" | "No" | "No phone service";
  InternetService: "DSL" | "Fiber optic" | "No";
  OnlineSecurity: "Yes" | "No" | "No internet service";
  OnlineBackup: "Yes" | "No" | "No internet service";
  DeviceProtection: "Yes" | "No" | "No internet service";
  TechSupport: "Yes" | "No" | "No internet service";
  StreamingTV: "Yes" | "No" | "No internet service";
  StreamingMovies: "Yes" | "No" | "No internet service";
  Contract: "Month-to-month" | "One year" | "Two year";
  PaperlessBilling: "Yes" | "No";
  PaymentMethod:
    | "Electronic check"
    | "Mailed check"
    | "Bank transfer (automatic)"
    | "Credit card (automatic)";
  MonthlyCharges: number;
  TotalCharges: number;
}

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface RiskDriver {
  feature: string;
  label: string;
  contribution: number; // signed log-odds contribution; +ve = increases churn risk
}

export interface RetentionAction {
  priority: "URGENT" | "HIGH" | "MEDIUM" | "LOW";
  actions: string[];
  reason: string;
}

export interface CustomerPrediction {
  customerID: string;
  churnProbability: number; // 0..1
  riskScore: number; // 0..100
  riskLevel: RiskLevel;
  topRiskDrivers: RiskDriver[];
  protectiveFactors: RiskDriver[];
  recommendation: RetentionAction;
}

/** Prediction plus the raw customer record it was scored from — what
 * /api/batch and /api/demo return, so the frontend can render a full
 * customer profile (contract, tenure, pricing, …) without a second call. */
export interface ScoredCustomer extends CustomerPrediction {
  customer: CustomerInput;
}

export const REQUIRED_CSV_COLUMNS: (keyof CustomerInput)[] = [
  "gender",
  "SeniorCitizen",
  "Partner",
  "Dependents",
  "tenure",
  "PhoneService",
  "MultipleLines",
  "InternetService",
  "OnlineSecurity",
  "OnlineBackup",
  "DeviceProtection",
  "TechSupport",
  "StreamingTV",
  "StreamingMovies",
  "Contract",
  "PaperlessBilling",
  "PaymentMethod",
  "MonthlyCharges",
  "TotalCharges",
];
