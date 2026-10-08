import type { VercelRequest, VercelResponse } from "@vercel/node";
import { parseCsv } from "./_lib/csv";
import { REQUIRED_CSV_COLUMNS, type CustomerInput } from "./_lib/types";
import { validateCategoricalValues } from "./_lib/validate";
import { scoreCustomerFull } from "./predict";

// Each scored customer serializes to ~1.8KB (drivers, protective factors,
// recommendation, echoed record). Vercel caps a function's response body at
// 4.5MB, so 2000 rows (~3.6MB) is the largest batch that reliably fits.
const MAX_ROWS = 2000;

// Note: this is a plain Vercel Function (not Next.js), so the Next.js
// `export const config = { api: { bodyParser } }` convention has no
// effect here and is intentionally not used — it would silently do
// nothing. Vercel's platform itself hard-caps a serverless function's
// request body at 4.5MB regardless of any app-level config, so the
// client-side upload limit (see CsvUploader.tsx) is set safely under
// that, and this handler also checks the parsed row count as a second,
// independent guard.

export function rowToCustomer(row: Record<string, string>, index: number): { customer: CustomerInput } | { error: string } {
  const missing = REQUIRED_CSV_COLUMNS.filter((col) => row[col] === undefined || row[col] === "");
  // TotalCharges is allowed to be blank (matches the source dataset's
  // convention for brand-new, tenure === 0 customers) and is treated as 0.
  const missingExcludingTotalCharges = missing.filter((c) => c !== "TotalCharges");
  if (missingExcludingTotalCharges.length > 0) {
    return { error: `Row ${index + 2}: missing ${missingExcludingTotalCharges.join(", ")}` };
  }

  const tenure = Number(row.tenure);
  const monthlyCharges = Number(row.MonthlyCharges);
  const totalChargesRaw = row.TotalCharges?.trim();
  const totalCharges = totalChargesRaw ? Number(totalChargesRaw) : 0;

  if (Number.isNaN(tenure) || Number.isNaN(monthlyCharges) || Number.isNaN(totalCharges)) {
    return { error: `Row ${index + 2}: tenure, MonthlyCharges, and TotalCharges must be numeric.` };
  }
  if (tenure < 0 || monthlyCharges < 0 || totalCharges < 0) {
    return { error: `Row ${index + 2}: tenure, MonthlyCharges, and TotalCharges cannot be negative.` };
  }

  const senior = row.SeniorCitizen?.trim();
  if (senior !== "0" && senior !== "1") {
    return { error: `Row ${index + 2}: SeniorCitizen must be 0 or 1 (got "${row.SeniorCitizen}").` };
  }

  const categoricalErrors = validateCategoricalValues(row);
  if (categoricalErrors.length > 0) {
    return { error: `Row ${index + 2}: ${categoricalErrors.join("; ")}` };
  }

  return {
    customer: {
      customerID: row.customerID || `ROW-${index + 1}`,
      gender: row.gender as CustomerInput["gender"],
      SeniorCitizen: (Number(senior) === 1 ? 1 : 0) as 0 | 1,
      Partner: row.Partner as CustomerInput["Partner"],
      Dependents: row.Dependents as CustomerInput["Dependents"],
      tenure,
      PhoneService: row.PhoneService as CustomerInput["PhoneService"],
      MultipleLines: row.MultipleLines as CustomerInput["MultipleLines"],
      InternetService: row.InternetService as CustomerInput["InternetService"],
      OnlineSecurity: row.OnlineSecurity as CustomerInput["OnlineSecurity"],
      OnlineBackup: row.OnlineBackup as CustomerInput["OnlineBackup"],
      DeviceProtection: row.DeviceProtection as CustomerInput["DeviceProtection"],
      TechSupport: row.TechSupport as CustomerInput["TechSupport"],
      StreamingTV: row.StreamingTV as CustomerInput["StreamingTV"],
      StreamingMovies: row.StreamingMovies as CustomerInput["StreamingMovies"],
      Contract: row.Contract as CustomerInput["Contract"],
      PaperlessBilling: row.PaperlessBilling as CustomerInput["PaperlessBilling"],
      PaymentMethod: row.PaymentMethod as CustomerInput["PaymentMethod"],
      MonthlyCharges: monthlyCharges,
      TotalCharges: totalCharges,
    },
  };
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const csvText: unknown = typeof req.body === "string" ? req.body : req.body?.csv;
  if (typeof csvText !== "string" || csvText.trim().length === 0) {
    return res.status(400).json({ error: "Request must include CSV text in the 'csv' field." });
  }

  const { headers, rows } = parseCsv(csvText);
  if (rows.length === 0) {
    return res.status(400).json({ error: "The uploaded file has no data rows." });
  }
  if (rows.length > MAX_ROWS) {
    return res.status(400).json({ error: `File has ${rows.length} rows; the limit is ${MAX_ROWS} per upload.` });
  }

  const missingColumns = REQUIRED_CSV_COLUMNS.filter((col) => !headers.includes(col));
  if (missingColumns.length > 0) {
    return res.status(400).json({
      error: `CSV is missing required columns: ${missingColumns.join(", ")}`,
    });
  }

  const errors: string[] = [];
  const predictions = [];
  for (let i = 0; i < rows.length; i++) {
    const result = rowToCustomer(rows[i], i);
    if ("error" in result) {
      errors.push(result.error);
      continue;
    }
    predictions.push(scoreCustomerFull(result.customer));
  }

  if (predictions.length === 0) {
    return res.status(400).json({ error: "No valid rows could be scored.", rowErrors: errors.slice(0, 20) });
  }

  const total = predictions.length;
  const high = predictions.filter((p) => p.riskLevel === "HIGH").length;
  const medium = predictions.filter((p) => p.riskLevel === "MEDIUM").length;
  const low = predictions.filter((p) => p.riskLevel === "LOW").length;
  const avgProbability =
    predictions.reduce((sum, p) => sum + p.churnProbability, 0) / total;

  return res.status(200).json({
    summary: {
      totalCustomers: total,
      highRisk: high,
      mediumRisk: medium,
      lowRisk: low,
      averageChurnProbability: Math.round(avgProbability * 1000) / 1000,
      rowsWithErrors: errors.length,
    },
    predictions,
    rowErrors: errors.slice(0, 50),
  });
}
