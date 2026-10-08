import type { ScoredCustomer } from "./types";

export function predictionsToCsv(rows: ScoredCustomer[]): string {
  const headers = [
    "customerID",
    "churnProbability",
    "riskScore",
    "riskLevel",
    "Contract",
    "tenure",
    "MonthlyCharges",
    "InternetService",
    "PaymentMethod",
    "recommendationPriority",
    "topRiskDriver",
  ];

  const escape = (val: string | number) => {
    const s = String(val);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.customerID,
        row.churnProbability,
        row.riskScore,
        row.riskLevel,
        row.customer.Contract,
        row.customer.tenure,
        row.customer.MonthlyCharges,
        row.customer.InternetService,
        row.customer.PaymentMethod,
        row.recommendation.priority,
        row.topRiskDrivers[0]?.label ?? "",
      ]
        .map(escape)
        .join(",")
    );
  }
  return lines.join("\n");
}

export function downloadCsv(filename: string, csvText: string) {
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
