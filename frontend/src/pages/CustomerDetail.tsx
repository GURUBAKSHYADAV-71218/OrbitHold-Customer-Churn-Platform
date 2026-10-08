import { useParams, NavLink } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useDataset } from "@/lib/DatasetContext";
import CustomerProfilePanel from "@/components/CustomerProfilePanel";

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const { predictions, loading } = useDataset();

  const record = predictions.find((p) => p.customerID === id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <NavLink to="/explorer" className="mb-6 inline-flex items-center gap-1.5 text-sm text-espresso/60 hover:text-terracotta">
        <ArrowLeft className="h-4 w-4" /> Back to Customer Explorer
      </NavLink>

      {loading && <div className="paper-card p-10 text-center text-espresso/50">Loading customer…</div>}

      {!loading && !record && (
        <div className="paper-card p-10 text-center">
          <p className="text-espresso/60">
            No customer with ID <span className="font-mono">{id}</span> in the current dataset.
          </p>
          <NavLink to="/explorer" className="btn-primary mt-4 inline-flex">
            Return to Explorer
          </NavLink>
        </div>
      )}

      {record && <CustomerProfilePanel customer={record.customer} prediction={record} />}
    </div>
  );
}
