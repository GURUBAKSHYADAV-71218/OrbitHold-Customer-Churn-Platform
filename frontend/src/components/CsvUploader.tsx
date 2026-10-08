import { useRef, useState } from "react";
import { UploadCloud, FileText } from "lucide-react";

// Vercel hard-caps a serverless function's request body at 4.5MB
// regardless of any app-level config, so this stays safely under that
// rather than letting the user pick a file that will fail server-side.
const MAX_SIZE_BYTES = 4 * 1024 * 1024; // 4MB

export default function CsvUploader({
  onUpload,
  uploading,
}: {
  onUpload: (csvText: string) => Promise<void>;
  uploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    setLocalError(null);
    if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
      setLocalError("Please upload a .csv file.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setLocalError("File is too large — the limit is 4MB.");
      return;
    }
    if (file.size === 0) {
      setLocalError("That file is empty.");
      return;
    }
    setFileName(file.name);
    const text = await file.text();
    try {
      await onUpload(text);
    } catch {
      // Error surfaced by the dataset context; nothing further to do here.
    }
  };

  return (
    <div>
      <div
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed px-6 py-10 text-center transition-colors ${
          dragOver ? "border-terracotta bg-terracotta/5" : "border-espresso/20 bg-parchment-light"
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        role="button"
        tabIndex={0}
        aria-label="Upload customer CSV"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
      >
        <UploadCloud className="h-7 w-7 text-espresso/40" strokeWidth={1.5} aria-hidden />
        <p className="text-sm text-espresso/70">
          <span className="font-semibold text-terracotta">Upload Customer Data</span> — drag a CSV
          here or click to browse
        </p>
        <p className="text-xs text-espresso/45">Required columns match the Telco Customer Churn schema. Up to 2,000 customers / 4MB per upload.</p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </div>

      {fileName && !localError && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-espresso/55">
          <FileText className="h-3.5 w-3.5" /> {fileName}
          {uploading && " — processing customer dataset…"}
        </p>
      )}
      {localError && (
        <p className="mt-2 text-xs text-dustyred" role="alert">
          {localError}
        </p>
      )}
    </div>
  );
}
