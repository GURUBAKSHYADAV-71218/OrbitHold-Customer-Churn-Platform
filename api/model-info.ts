import type { VercelRequest, VercelResponse } from "@vercel/node";
import metrics from "../ml/models/metrics.json";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed. Use GET." });
  }
  return res.status(200).json(metrics);
}
