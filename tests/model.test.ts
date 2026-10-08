import { describe, it, expect } from "vitest";
import {
  buildFeatureVector,
  predictProbability,
  riskLevelFor,
  riskScoreFor,
  explain,
  recommend,
} from "../api/_lib/model";
import type { CustomerInput } from "../api/_lib/types";

const baseCustomer: CustomerInput = {
  customerID: "TEST-0001",
  gender: "Female",
  SeniorCitizen: 0,
  Partner: "Yes",
  Dependents: "No",
  tenure: 1,
  PhoneService: "No",
  MultipleLines: "No phone service",
  InternetService: "DSL",
  OnlineSecurity: "No",
  OnlineBackup: "Yes",
  DeviceProtection: "No",
  TechSupport: "No",
  StreamingTV: "No",
  StreamingMovies: "No",
  Contract: "Month-to-month",
  PaperlessBilling: "Yes",
  PaymentMethod: "Electronic check",
  MonthlyCharges: 29.85,
  TotalCharges: 29.85,
};

const loyalCustomer: CustomerInput = {
  ...baseCustomer,
  customerID: "TEST-0002",
  tenure: 70,
  Contract: "Two year",
  PaymentMethod: "Credit card (automatic)",
  OnlineSecurity: "Yes",
  TechSupport: "Yes",
  MonthlyCharges: 50,
  TotalCharges: 3500,
};

describe("buildFeatureVector", () => {
  it("produces a 30-length numeric vector matching the trained feature order", () => {
    const vector = buildFeatureVector(baseCustomer);
    expect(vector).toHaveLength(30);
    expect(vector.every((v) => typeof v === "number" && !Number.isNaN(v))).toBe(true);
  });
});

describe("predictProbability", () => {
  it("is deterministic for the same customer", () => {
    const v1 = buildFeatureVector(baseCustomer);
    const v2 = buildFeatureVector(baseCustomer);
    expect(predictProbability(v1)).toBe(predictProbability(v2));
  });

  it("returns a valid probability in [0, 1]", () => {
    const p = predictProbability(buildFeatureVector(baseCustomer));
    expect(p).toBeGreaterThanOrEqual(0);
    expect(p).toBeLessThanOrEqual(1);
  });

  it("scores a month-to-month, short-tenure, no-support customer higher than a two-year, long-tenure, supported one", () => {
    const highRisk = predictProbability(buildFeatureVector(baseCustomer));
    const lowRisk = predictProbability(buildFeatureVector(loyalCustomer));
    expect(highRisk).toBeGreaterThan(lowRisk);
  });
});

describe("riskLevelFor / riskScoreFor", () => {
  it("classifies below 0.30 as LOW", () => {
    expect(riskLevelFor(0.1)).toBe("LOW");
    expect(riskLevelFor(0.29)).toBe("LOW");
  });
  it("classifies 0.30-0.60 as MEDIUM", () => {
    expect(riskLevelFor(0.3)).toBe("MEDIUM");
    expect(riskLevelFor(0.59)).toBe("MEDIUM");
  });
  it("classifies 0.60+ as HIGH", () => {
    expect(riskLevelFor(0.6)).toBe("HIGH");
    expect(riskLevelFor(0.99)).toBe("HIGH");
  });
  it("converts probability to a 0-100 integer risk score", () => {
    expect(riskScoreFor(0.783)).toBe(78);
    expect(riskScoreFor(0)).toBe(0);
    expect(riskScoreFor(1)).toBe(100);
  });
});

describe("explain", () => {
  it("returns risk drivers with positive contributions and protective factors with negative contributions", () => {
    const { drivers, protective } = explain(buildFeatureVector(baseCustomer));
    expect(drivers.every((d) => d.contribution > 0)).toBe(true);
    expect(protective.every((d) => d.contribution < 0)).toBe(true);
  });

  it("caps drivers and protective factors at 5 each", () => {
    const { drivers, protective } = explain(buildFeatureVector(baseCustomer));
    expect(drivers.length).toBeLessThanOrEqual(5);
    expect(protective.length).toBeLessThanOrEqual(5);
  });
});

describe("recommend", () => {
  it("marks a high-risk, short-tenure, month-to-month customer URGENT", () => {
    const vector = buildFeatureVector(baseCustomer);
    const probability = predictProbability(vector);
    const level = riskLevelFor(probability);
    const { drivers } = explain(vector);
    const rec = recommend(baseCustomer, level, drivers);
    expect(rec.priority).toBe("URGENT");
    expect(rec.actions.length).toBeGreaterThan(0);
  });

  it("suggests a contract incentive for month-to-month customers", () => {
    const vector = buildFeatureVector(baseCustomer);
    const { drivers } = explain(vector);
    const rec = recommend(baseCustomer, "HIGH", drivers);
    expect(rec.actions.some((a) => a.toLowerCase().includes("contract incentive"))).toBe(true);
  });

  it("gives a low-risk, long-tenure, long-contract customer a lower priority", () => {
    const vector = buildFeatureVector(loyalCustomer);
    const probability = predictProbability(vector);
    const level = riskLevelFor(probability);
    const { drivers } = explain(vector);
    const rec = recommend(loyalCustomer, level, drivers);
    expect(["LOW", "MEDIUM"]).toContain(rec.priority);
  });
});
