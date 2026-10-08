import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  buildFeatureVector,
  predictProbability,
  riskLevelFor,
  riskScoreFor,
  explain,
  recommend,
} from "./_lib/model";
import { REQUIRED_CSV_COLUMNS, type CustomerInput, type CustomerPrediction, type ScoredCustomer } from "./_lib/types";
import { validateCategoricalValues } from "./_lib/validate";

export function validate(body: unknown): { ok: true; customer: CustomerInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Request body must be a JSON object." };
  }
  const record = body as Record<string, unknown>;
  const missing = REQUIRED_CSV_COLUMNS.filter((col) => record[col] === undefined || record[col] === null || record[col] === "");
  if (missing.length > 0) {
    return { ok: false, error: `Missing required fields: ${missing.join(", ")}` };
  }
  const tenure = Number(record.tenure);
  const monthlyCharges = Number(record.MonthlyCharges);
  const totalCharges = Number(record.TotalCharges);
  if (Number.isNaN(tenure) || Number.isNaN(monthlyCharges) || Number.isNaN(totalCharges)) {
    return { ok: false, error: "tenure, MonthlyCharges, and TotalCharges must be numeric." };
  }
  if (tenure < 0 || monthlyCharges < 0 || totalCharges < 0) {
    return { ok: false, error: "tenure, MonthlyCharges, and TotalCharges cannot be negative." };
  }

  const categoricalErrors = validateCategoricalValues(record);
  if (categoricalErrors.length > 0) {
    return { ok: false, error: categoricalErrors.join("; ") };
  }
  const seniorRaw = record.SeniorCitizen;
  if (Number(seniorRaw) !== 0 && Number(seniorRaw) !== 1) {
    return { ok: false, error: `SeniorCitizen must be 0 or 1 (got ${JSON.stringify(seniorRaw)}).` };
  }

  return {
    ok: true,
    customer: {
      customerID: typeof record.customerID === "string" ? record.customerID : undefined,
      gender: record.gender as CustomerInput["gender"],
      SeniorCitizen: (Number(record.SeniorCitizen) === 1 ? 1 : 0) as 0 | 1,
      Partner: record.Partner as CustomerInput["Partner"],
      Dependents: record.Dependents as CustomerInput["Dependents"],
      tenure,
      PhoneService: record.PhoneService as CustomerInput["PhoneService"],
      MultipleLines: record.MultipleLines as CustomerInput["MultipleLines"],
      InternetService: record.InternetService as CustomerInput["InternetService"],
      OnlineSecurity: record.OnlineSecurity as CustomerInput["OnlineSecurity"],
      OnlineBackup: record.OnlineBackup as CustomerInput["OnlineBackup"],
      DeviceProtection: record.DeviceProtection as CustomerInput["DeviceProtection"],
      TechSupport: record.TechSupport as CustomerInput["TechSupport"],
      StreamingTV: record.StreamingTV as CustomerInput["StreamingTV"],
      StreamingMovies: record.StreamingMovies as CustomerInput["StreamingMovies"],
      Contract: record.Contract as CustomerInput["Contract"],
      PaperlessBilling: record.PaperlessBilling as CustomerInput["PaperlessBilling"],
      PaymentMethod: record.PaymentMethod as CustomerInput["PaymentMethod"],
      MonthlyCharges: monthlyCharges,
      TotalCharges: totalCharges,
    },
  };
}

export function scoreCustomer(customer: CustomerInput): CustomerPrediction {
  const vector = buildFeatureVector(customer);
  const probability = predictProbability(vector);
  const riskLevel = riskLevelFor(probability);
  const riskScore = riskScoreFor(probability);
  const { drivers, protective } = explain(vector);
  const recommendation = recommend(customer, riskLevel, drivers);

  return {
    customerID: customer.customerID || "N/A",
    churnProbability: Math.round(probability * 1000) / 1000,
    riskScore,
    riskLevel,
    topRiskDrivers: drivers,
    protectiveFactors: protective,
    recommendation,
  };
}

/** Same scoring, but echoes the raw customer record alongside the
 * prediction — used by /api/batch and /api/demo so the frontend can
 * render a full customer profile from a single response. */
export function scoreCustomerFull(customer: CustomerInput): ScoredCustomer {
  return { ...scoreCustomer(customer), customer };
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const result = validate(req.body);
    if (!result.ok) {
      return res.status(400).json({ error: result.error });
    }
    const prediction = scoreCustomer(result.customer);
    return res.status(200).json(prediction);
  } catch (err) {
    console.error("predict error:", err);
    return res.status(500).json({ error: "Prediction failed due to an internal error." });
  }
}
