// Mirrors api/_lib/types.ts. Frontend and API are bundled separately by
// Vercel, so this is intentionally a small, independent copy rather than
// a cross-bundle import.

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
  contribution: number;
}

export interface RetentionAction {
  priority: "URGENT" | "HIGH" | "MEDIUM" | "LOW";
  actions: string[];
  reason: string;
}

export interface CustomerPrediction {
  customerID: string;
  churnProbability: number;
  riskScore: number;
  riskLevel: RiskLevel;
  topRiskDrivers: RiskDriver[];
  protectiveFactors: RiskDriver[];
  recommendation: RetentionAction;
}

export interface ScoredCustomer extends CustomerPrediction {
  customer: CustomerInput;
}

export const DEFAULT_CUSTOMER: CustomerInput = {
  customerID: "",
  gender: "Female",
  SeniorCitizen: 0,
  Partner: "No",
  Dependents: "No",
  tenure: 12,
  PhoneService: "Yes",
  MultipleLines: "No",
  InternetService: "Fiber optic",
  OnlineSecurity: "No",
  OnlineBackup: "No",
  DeviceProtection: "No",
  TechSupport: "No",
  StreamingTV: "No",
  StreamingMovies: "No",
  Contract: "Month-to-month",
  PaperlessBilling: "Yes",
  PaymentMethod: "Electronic check",
  MonthlyCharges: 70,
  TotalCharges: 840,
};

export const YES_NO: CustomerInput["Partner"][] = ["Yes", "No"];
export const YES_NO_NO_PHONE: CustomerInput["MultipleLines"][] = ["Yes", "No", "No phone service"];
export const YES_NO_NO_INTERNET: CustomerInput["OnlineSecurity"][] = [
  "Yes",
  "No",
  "No internet service",
];
export const INTERNET_SERVICE: CustomerInput["InternetService"][] = ["DSL", "Fiber optic", "No"];
export const CONTRACT: CustomerInput["Contract"][] = ["Month-to-month", "One year", "Two year"];
export const PAYMENT_METHOD: CustomerInput["PaymentMethod"][] = [
  "Electronic check",
  "Mailed check",
  "Bank transfer (automatic)",
  "Credit card (automatic)",
];
