import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { Search, Download, RotateCcw } from "lucide-react";
import { useDataset } from "@/lib/DatasetContext";
import { predictionsToCsv, downloadCsv } from "@/lib/csvExport";
import { predictCustomer, ApiError } from "@/lib/api";
import type { CustomerInput, CustomerPrediction, RiskLevel } from "@/lib/types";
import CsvUploader from "@/components/CsvUploader";
import CustomerForm from "@/components/CustomerForm";
import CustomerProfilePanel from "@/components/CustomerProfilePanel";
import RiskBadge from "@/components/RiskBadge";

type SortKey = "probability" | "tenure" | "monthlyCharges";

export default function Explorer() {
  const { predictions, summary, source, loading, error, uploadError, rowErrors, loadDemo, loadFromCsv } = useDataset();

  const [tab, setTab] = useState<"browse" | "analyze">("browse");

  // Browse/filter state
  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "ALL">("ALL");
  const [contractFilter, setContractFilter] = useState<string>("ALL");
  const [internetFilter, setInternetFilter] = useState<string>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("probability");

  // Ad-hoc analysis state
  const [adHocResult, setAdHocResult] = useState<{ customer: CustomerInput; prediction: CustomerPrediction } | null>(null);
  const [adHocError, setAdHocError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const contracts = useMemo(
    () => Array.from(new Set(predictions.map((p) => p.customer.Contract))),
    [predictions]
  );
  const internetTypes = useMemo(
    () => Array.from(new Set(predictions.map((p) => p.customer.InternetService))),
    [predictions]
  );

  const filtered = useMemo(() => {
    let rows = predictions;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      rows = rows.filter((p) => p.customerID.toLowerCase().includes(q));
    }
    if (riskFilter !== "ALL") rows = rows.filter((p) => p.riskLevel === riskFilter);
    if (contractFilter !== "ALL") rows = rows.filter((p) => p.customer.Contract === contractFilter);
    if (internetFilter !== "ALL") rows = rows.filter((p) => p.customer.InternetService === internetFilter);

    return [...rows].sort((a, b) => {
      if (sortKey === "probability") return b.churnProbability - a.churnProbability;
      if (sortKey === "tenure") return a.customer.tenure - b.customer.tenure;
      return b.customer.MonthlyCharges - a.customer.MonthlyCharges;
    });
  }, [predictions, query, riskFilter, contractFilter, internetFilter, sortKey]);

  const handleAnalyze = async (customer: CustomerInput) => {
    setAnalyzing(true);
    setAdHocError(null);
    setAdHocResult(null);
    try {
      const prediction = await predictCustomer(customer);
      setAdHocResult({ customer, prediction });
    } catch (err) {
      setAdHocError(err instanceof ApiError ? err.message : "Analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <span className="label-tag text-terracotta">Customer Investigation</span>
        <h1 className="mt-2 font-display text-4xl text-espresso">Customer Explorer</h1>
        <p className="mt-2 max-w-2xl text-espresso/60">
          Browse and filter the current dataset, upload your own customer CSV, or analyze a single
          customer on the spot.
        </p>
      </div>

      <div className="mb-6 flex gap-2 border-b border-espresso/10">
        <button
          className={`px-4 py-2 text-sm font-semibold ${tab === "browse" ? "border-b-2 border-terracotta text-terracotta" : "text-espresso/50"}`}
          onClick={() => setTab("browse")}
        >
          Browse &amp; Upload
        </button>
        <button
          className={`px-4 py-2 text-sm font-semibold ${tab === "analyze" ? "border-b-2 border-terracotta text-terracotta" : "text-espresso/50"}`}
          onClick={() => setTab("analyze")}
        >
          Analyze New Customer
        </button>
      </div>

      {tab === "browse" && (
        <div className="space-y-6">
          <div className="paper-card p-6">
            <CsvUploader onUpload={loadFromCsv} uploading={loading} />
            {uploadError && (
              <div className="mt-3 rounded-md border border-dustyred/30 bg-dustyred/5 p-3 text-sm text-dustyred" role="alert">
                {uploadError} Your previous dataset is still loaded.
              </div>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="label-tag text-espresso/45">
                {source === "demo" ? "Demo Dataset" : source === "upload" ? "Uploaded Dataset" : ""}
              </span>
              {source === "upload" && (
                <button className="btn-secondary" onClick={loadDemo}>
                  <RotateCcw className="h-3.5 w-3.5" /> Reset to Demo Dataset
                </button>
              )}
              {rowErrors.length > 0 && (
                <span className="text-xs text-dustyred">{rowErrors.length} row(s) had errors and were skipped.</span>
              )}
            </div>
          </div>

          {error && (
            <div className="paper-card border-dustyred/30 p-6 text-dustyred" role="alert">
              {error}
            </div>
          )}

          {loading && (
            <div className="paper-card p-10 text-center text-espresso/50">Processing customer dataset…</div>
          )}

          {!loading && !error && (
            <>
              {summary && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  <div className="paper-card p-4 text-center">
                    <div className="kpi-value text-2xl">{summary.totalCustomers}</div>
                    <div className="label-tag justify-center text-espresso/45">Total</div>
                  </div>
                  <div className="paper-card p-4 text-center">
                    <div className="kpi-value text-2xl text-dustyred">{summary.highRisk}</div>
                    <div className="label-tag justify-center text-espresso/45">High</div>
                  </div>
                  <div className="paper-card p-4 text-center">
                    <div className="kpi-value text-2xl text-mustard-dark">{summary.mediumRisk}</div>
                    <div className="label-tag justify-center text-espresso/45">Medium</div>
                  </div>
                  <div className="paper-card p-4 text-center">
                    <div className="kpi-value text-2xl text-teal-dark">{summary.lowRisk}</div>
                    <div className="label-tag justify-center text-espresso/45">Low</div>
                  </div>
                  <div className="paper-card p-4 text-center">
                    <div className="kpi-value text-2xl">{Math.round(summary.averageChurnProbability * 100)}%</div>
                    <div className="label-tag justify-center text-espresso/45">Avg. Risk</div>
                  </div>
                </div>
              )}

              <div className="paper-card p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative w-full sm:max-w-xs">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-espresso/35" />
                    <input
                      className="w-full rounded-md border border-espresso/20 bg-parchment-light py-2 pl-9 pr-3 text-sm text-espresso placeholder:text-espresso/35 focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
                      placeholder="Search customer ID…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      aria-label="Search by customer ID"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <select
                      className="rounded-md border border-espresso/20 bg-parchment-light px-3 py-2 text-sm text-espresso"
                      value={riskFilter}
                      onChange={(e) => setRiskFilter(e.target.value as RiskLevel | "ALL")}
                      aria-label="Filter by risk level"
                    >
                      <option value="ALL">All risk levels</option>
                      <option value="HIGH">High risk</option>
                      <option value="MEDIUM">Medium risk</option>
                      <option value="LOW">Low risk</option>
                    </select>
                    <select
                      className="rounded-md border border-espresso/20 bg-parchment-light px-3 py-2 text-sm text-espresso"
                      value={contractFilter}
                      onChange={(e) => setContractFilter(e.target.value)}
                      aria-label="Filter by contract"
                    >
                      <option value="ALL">All contracts</option>
                      {contracts.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <select
                      className="rounded-md border border-espresso/20 bg-parchment-light px-3 py-2 text-sm text-espresso"
                      value={internetFilter}
                      onChange={(e) => setInternetFilter(e.target.value)}
                      aria-label="Filter by internet service"
                    >
                      <option value="ALL">All internet types</option>
                      {internetTypes.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <select
                      className="rounded-md border border-espresso/20 bg-parchment-light px-3 py-2 text-sm text-espresso"
                      value={sortKey}
                      onChange={(e) => setSortKey(e.target.value as SortKey)}
                      aria-label="Sort by"
                    >
                      <option value="probability">Sort: Highest risk first</option>
                      <option value="tenure">Sort: Lowest tenure first</option>
                      <option value="monthlyCharges">Sort: Highest charges first</option>
                    </select>
                    <button
                      className="btn-secondary"
                      onClick={() => downloadCsv("orbithold-results.csv", predictionsToCsv(filtered))}
                      disabled={filtered.length === 0}
                    >
                      <Download className="h-3.5 w-3.5" /> Download Results
                    </button>
                  </div>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-espresso/10 text-espresso/50">
                        <th className="py-2 pr-4 font-medium">Customer ID</th>
                        <th className="py-2 pr-4 font-medium">Probability</th>
                        <th className="py-2 pr-4 font-medium">Risk</th>
                        <th className="py-2 pr-4 font-medium">Contract</th>
                        <th className="py-2 pr-4 font-medium">Tenure</th>
                        <th className="py-2 pr-4 font-medium">Monthly</th>
                        <th className="py-2 font-medium">Internet</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-espresso/45">
                            No customers match these filters.
                          </td>
                        </tr>
                      ) : (
                        filtered.slice(0, 200).map((p) => (
                          <tr key={p.customerID} className="border-b border-espresso/5 hover:bg-espresso/5">
                            <td className="py-2 pr-4">
                              <NavLink
                                to={`/customer/${encodeURIComponent(p.customerID)}`}
                                className="font-mono text-xs text-terracotta hover:underline"
                              >
                                {p.customerID}
                              </NavLink>
                            </td>
                            <td className="py-2 pr-4">{Math.round(p.churnProbability * 100)}%</td>
                            <td className="py-2 pr-4">
                              <RiskBadge level={p.riskLevel} />
                            </td>
                            <td className="py-2 pr-4 text-espresso/70">{p.customer.Contract}</td>
                            <td className="py-2 pr-4 text-espresso/70">{p.customer.tenure} mo</td>
                            <td className="py-2 pr-4 text-espresso/70">${p.customer.MonthlyCharges.toFixed(2)}</td>
                            <td className="py-2 text-espresso/70">{p.customer.InternetService}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                  {filtered.length > 200 && (
                    <p className="mt-2 text-xs text-espresso/45">
                      Showing the first 200 of {filtered.length} matching customers.
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {tab === "analyze" && (
        <div className="space-y-6">
          <div className="paper-card p-6">
            <CustomerForm onSubmit={handleAnalyze} submitting={analyzing} />
          </div>
          {adHocError && (
            <div className="paper-card border-dustyred/30 p-6 text-dustyred" role="alert">
              {adHocError}
            </div>
          )}
          {adHocResult && <CustomerProfilePanel customer={adHocResult.customer} prediction={adHocResult.prediction} />}
        </div>
      )}
    </div>
  );
}
