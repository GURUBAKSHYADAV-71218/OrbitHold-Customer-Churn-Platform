import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { fetchDemoDataset, uploadBatch, ApiError, type BatchSummary } from "./api";
import type { ScoredCustomer } from "./types";

interface DatasetState {
  predictions: ScoredCustomer[];
  summary: BatchSummary | null;
  source: "demo" | "upload" | "none";
  loading: boolean;
  error: string | null;
  /** Last upload failure — kept separate so a bad file never hides the dataset already loaded. */
  uploadError: string | null;
  rowErrors: string[];
  loadDemo: () => void;
  loadFromCsv: (csvText: string) => Promise<void>;
}

const DatasetContext = createContext<DatasetState | null>(null);

export function DatasetProvider({ children }: { children: ReactNode }) {
  const [predictions, setPredictions] = useState<ScoredCustomer[]>([]);
  const [summary, setSummary] = useState<BatchSummary | null>(null);
  const [source, setSource] = useState<"demo" | "upload" | "none">("none");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<string[]>([]);

  const loadDemo = useCallback(() => {
    setLoading(true);
    setError(null);
    setUploadError(null);
    setRowErrors([]);
    fetchDemoDataset()
      .then((res) => {
        setPredictions(res.predictions);
        setSummary(res.summary);
        setSource("demo");
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const loadFromCsv = useCallback(async (csvText: string) => {
    setLoading(true);
    setUploadError(null);
    try {
      const res = await uploadBatch(csvText);
      setPredictions(res.predictions);
      setSummary(res.summary);
      setRowErrors(res.rowErrors ?? []);
      setSource("upload");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Couldn't reach the server — check your connection and try again.";
      setUploadError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

 useEffect(() => {
  loadDemo();
}, []);

  return (
    <DatasetContext.Provider
      value={{ predictions, summary, source, loading, error, uploadError, rowErrors, loadDemo, loadFromCsv }}
    >
      {children}
    </DatasetContext.Provider>
  );
}

export function useDataset() {
  const ctx = useContext(DatasetContext);
  if (!ctx) throw new Error("useDataset must be used within a DatasetProvider");
  return ctx;
}
