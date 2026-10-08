import type { VercelRequest, VercelResponse } from "@vercel/node";
import demoCustomers from "../ml/data/demo-customers.json";
import { scoreCustomerFull } from "./predict";
import type { CustomerInput } from "./_lib/types";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed. Use GET." });
  }

  const predictions = (demoCustomers as CustomerInput[]).map((c) => scoreCustomerFull(c));
  const total = predictions.length;
  const high = predictions.filter((p) => p.riskLevel === "HIGH").length;
  const medium = predictions.filter((p) => p.riskLevel === "MEDIUM").length;
  const low = predictions.filter((p) => p.riskLevel === "LOW").length;
  const avgProbability = predictions.reduce((sum, p) => sum + p.churnProbability, 0) / total;

  return res.status(200).json({
    isDemoData: true,
    label: "Demo Dataset",
    customers: demoCustomers,
    summary: {
      totalCustomers: total,
      highRisk: high,
      mediumRisk: medium,
      lowRisk: low,
      averageChurnProbability: Math.round(avgProbability * 1000) / 1000,
    },
    predictions,
  });
}
