import { describe, it, expect } from "vitest";
import { validate, scoreCustomer } from "../api/predict";

const validBody = {
  customerID: "9999-ZZZZZ",
  gender: "Male",
  SeniorCitizen: 0,
  Partner: "No",
  Dependents: "No",
  tenure: 5,
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
  MonthlyCharges: 85,
  TotalCharges: 425,
};

describe("validate", () => {
  it("accepts a complete, correctly-typed body", () => {
    const result = validate(validBody);
    expect(result.ok).toBe(true);
  });

  it("rejects a non-object body", () => {
    expect(validate(null).ok).toBe(false);
    expect(validate("hello").ok).toBe(false);
  });

  it("rejects a body missing required fields", () => {
    const { Contract, ...rest } = validBody;
    const result = validate(rest);
    expect(result.ok).toBe(false);
  });

  it("rejects an unknown categorical value instead of silently coercing it", () => {
    const result = validate({ ...validBody, Contract: "Weekly" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("Contract");
  });

  it("rejects wrong-case categorical values", () => {
    expect(validate({ ...validBody, InternetService: "fiber optic" }).ok).toBe(false);
  });

  it("rejects negative numeric fields and invalid SeniorCitizen", () => {
    expect(validate({ ...validBody, tenure: -3 }).ok).toBe(false);
    expect(validate({ ...validBody, SeniorCitizen: 2 }).ok).toBe(false);
  });

  it("rejects non-numeric tenure/charges", () => {
    const result = validate({ ...validBody, MonthlyCharges: "not a number" });
    expect(result.ok).toBe(false);
  });
});

describe("scoreCustomer", () => {
  it("returns a complete prediction object for a valid customer", () => {
    const result = validate(validBody);
    if (!result.ok) throw new Error("expected valid body");
    const prediction = scoreCustomer(result.customer);
    expect(prediction.customerID).toBe("9999-ZZZZZ");
    expect(["LOW", "MEDIUM", "HIGH"]).toContain(prediction.riskLevel);
    expect(prediction.churnProbability).toBeGreaterThanOrEqual(0);
    expect(prediction.churnProbability).toBeLessThanOrEqual(1);
    expect(prediction.recommendation.actions.length).toBeGreaterThan(0);
  });
});
