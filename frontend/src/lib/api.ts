import type { CustomerInput, CustomerPrediction, ScoredCustomer } from "./types";

export interface BatchSummary {
  totalCustomers: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  averageChurnProbability: number;
  rowsWithErrors?: number;
}

export interface DemoResponse {
  isDemoData: true;
  label: "Demo Dataset";
  customers: CustomerInput[];
  summary: BatchSummary;
  predictions: ScoredCustomer[];
}

export interface BatchResponse {
  summary: BatchSummary;
  predictions: ScoredCustomer[];
  rowErrors: string[];
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(body.error || `Request to ${url} failed (${res.status})`, res.status);
  }
  return res.json() as Promise<T>;
}

export function fetchDemoDataset() {
  return request<DemoResponse>("/api/demo");
}

export function predictCustomer(customer: CustomerInput) {
  return request<CustomerPrediction>("/api/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(customer),
  });
}

export function uploadBatch(csvText: string) {
  return request<BatchResponse>("/api/batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ csv: csvText }),
  });
}

export interface ModelMetrics {
  model_type: string;
  dataset_size: number;
  train_size: number;
  test_size: number;
  churn_distribution: { churned: number; retained: number; churn_rate: number };
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  confusion_matrix: {
    true_negative: number;
    false_positive: number;
    false_negative: number;
    true_positive: number;
  };
  feature_importance: { feature: string; coefficient: number }[];
}

export function fetchModelInfo() {
  return request<ModelMetrics>("/api/model-info");
}
