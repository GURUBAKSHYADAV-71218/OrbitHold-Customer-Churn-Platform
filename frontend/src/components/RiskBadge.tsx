import type { RiskLevel } from "@/lib/types";

export default function RiskBadge({ level }: { level: RiskLevel }) {
  const className =
    level === "HIGH" ? "risk-badge-high" : level === "MEDIUM" ? "risk-badge-medium" : "risk-badge-low";
  return <span className={className}>{level} RISK</span>;
}
