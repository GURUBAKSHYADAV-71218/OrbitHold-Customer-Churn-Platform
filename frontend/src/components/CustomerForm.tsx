import { useState } from "react";
import type { ReactNode, FormEvent } from "react";
import type { CustomerInput } from "@/lib/types";
import {
  DEFAULT_CUSTOMER,
  YES_NO,
  YES_NO_NO_PHONE,
  YES_NO_NO_INTERNET,
  INTERNET_SERVICE,
  CONTRACT,
  PAYMENT_METHOD,
} from "@/lib/types";

const inputClass =
  "w-full rounded-md border border-espresso/20 bg-parchment-light px-3 py-2 text-sm text-espresso " +
  "placeholder:text-espresso/35 focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta " +
  "disabled:bg-espresso/5 disabled:text-espresso/40";

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-xs font-medium uppercase tracking-wide text-espresso/55">
        {label}
      </label>
      {children}
    </div>
  );
}

function Select<T extends string>({
  id,
  value,
  onChange,
  options,
}: {
  id: string;
  value: T;
  onChange: (v: T) => void;
  options: readonly T[];
}) {
  return (
    <select id={id} className={inputClass} value={value} onChange={(e) => onChange(e.target.value as T)}>
      {options.map((opt) => (
        <option key={opt} value={opt} className="bg-parchment-light text-espresso">
          {opt}
        </option>
      ))}
    </select>
  );
}

export default function CustomerForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (customer: CustomerInput) => void;
  submitting: boolean;
}) {
  const [customer, setCustomer] = useState<CustomerInput>(DEFAULT_CUSTOMER);
  const [errors, setErrors] = useState<string[]>([]);

  const update = <K extends keyof CustomerInput>(key: K, value: CustomerInput[K]) =>
    setCustomer((c) => ({ ...c, [key]: value }));

  const validate = (): string[] => {
    const errs: string[] = [];
    if (customer.tenure < 0 || customer.tenure > 100) errs.push("Tenure should be between 0 and 100 months.");
    if (customer.MonthlyCharges <= 0) errs.push("Monthly charges must be greater than 0.");
    if (customer.TotalCharges < 0) errs.push("Total charges cannot be negative.");
    return errs;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (errs.length === 0) onSubmit(customer);
  };

  const internetDisabled = customer.InternetService === "No";

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {errors.length > 0 && (
        <div className="rounded-md border border-dustyred/30 bg-dustyred/5 p-3 text-sm text-dustyred" role="alert">
          <ul className="list-inside list-disc">
            {errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Customer ID (optional)" htmlFor="customerID">
          <input
            id="customerID"
            className={inputClass}
            placeholder="e.g. 7590-VHVEG"
            value={customer.customerID}
            onChange={(e) => update("customerID", e.target.value)}
          />
        </Field>
        <Field label="Gender" htmlFor="gender">
          <Select id="gender" value={customer.gender} onChange={(v) => update("gender", v)} options={["Female", "Male"]} />
        </Field>
        <Field label="Senior Citizen" htmlFor="senior">
          <Select
            id="senior"
            value={customer.SeniorCitizen === 1 ? "Yes" : "No"}
            onChange={(v) => update("SeniorCitizen", v === "Yes" ? 1 : 0)}
            options={YES_NO}
          />
        </Field>
        <Field label="Partner" htmlFor="partner">
          <Select id="partner" value={customer.Partner} onChange={(v) => update("Partner", v)} options={YES_NO} />
        </Field>
        <Field label="Dependents" htmlFor="dependents">
          <Select id="dependents" value={customer.Dependents} onChange={(v) => update("Dependents", v)} options={YES_NO} />
        </Field>
        <Field label="Tenure (months)" htmlFor="tenure">
          <input
            id="tenure"
            type="number"
            min={0}
            max={100}
            className={inputClass}
            value={customer.tenure}
            onChange={(e) => update("tenure", Number(e.target.value))}
          />
        </Field>

        <Field label="Phone Service" htmlFor="phoneService">
          <Select
            id="phoneService"
            value={customer.PhoneService}
            onChange={(v) => update("PhoneService", v)}
            options={YES_NO}
          />
        </Field>
        <Field label="Multiple Lines" htmlFor="multipleLines">
          <Select
            id="multipleLines"
            value={customer.MultipleLines}
            onChange={(v) => update("MultipleLines", v)}
            options={YES_NO_NO_PHONE}
          />
        </Field>
        <Field label="Internet Service" htmlFor="internetService">
          <Select
            id="internetService"
            value={customer.InternetService}
            onChange={(v) => {
              update("InternetService", v);
              if (v === "No") {
                update("OnlineSecurity", "No internet service");
                update("OnlineBackup", "No internet service");
                update("DeviceProtection", "No internet service");
                update("TechSupport", "No internet service");
                update("StreamingTV", "No internet service");
                update("StreamingMovies", "No internet service");
              } else if (customer.InternetService === "No") {
                update("OnlineSecurity", "No");
                update("OnlineBackup", "No");
                update("DeviceProtection", "No");
                update("TechSupport", "No");
                update("StreamingTV", "No");
                update("StreamingMovies", "No");
              }
            }}
            options={INTERNET_SERVICE}
          />
        </Field>

        {(
          [
            ["OnlineSecurity", "Online Security"],
            ["OnlineBackup", "Online Backup"],
            ["DeviceProtection", "Device Protection"],
            ["TechSupport", "Tech Support"],
            ["StreamingTV", "Streaming TV"],
            ["StreamingMovies", "Streaming Movies"],
          ] as const
        ).map(([key, label]) => (
          <Field key={key} label={label} htmlFor={key}>
            <select
              id={key}
              disabled={internetDisabled}
              className={inputClass}
              value={customer[key]}
              onChange={(e) => update(key, e.target.value as CustomerInput[typeof key])}
            >
              {YES_NO_NO_INTERNET.map((opt) => (
                <option key={opt} value={opt} disabled={opt !== "No internet service" && internetDisabled}>
                  {opt}
                </option>
              ))}
            </select>
          </Field>
        ))}

        <Field label="Contract" htmlFor="contract">
          <Select id="contract" value={customer.Contract} onChange={(v) => update("Contract", v)} options={CONTRACT} />
        </Field>
        <Field label="Paperless Billing" htmlFor="paperless">
          <Select
            id="paperless"
            value={customer.PaperlessBilling}
            onChange={(v) => update("PaperlessBilling", v)}
            options={YES_NO}
          />
        </Field>
        <Field label="Payment Method" htmlFor="paymentMethod">
          <Select
            id="paymentMethod"
            value={customer.PaymentMethod}
            onChange={(v) => update("PaymentMethod", v)}
            options={PAYMENT_METHOD}
          />
        </Field>
        <Field label="Monthly Charges ($)" htmlFor="monthlyCharges">
          <input
            id="monthlyCharges"
            type="number"
            min={0}
            step="0.01"
            className={inputClass}
            value={customer.MonthlyCharges}
            onChange={(e) => update("MonthlyCharges", Number(e.target.value))}
          />
        </Field>
        <Field label="Total Charges ($)" htmlFor="totalCharges">
          <input
            id="totalCharges"
            type="number"
            min={0}
            step="0.01"
            className={inputClass}
            value={customer.TotalCharges}
            onChange={(e) => update("TotalCharges", Number(e.target.value))}
          />
        </Field>
      </div>

      <button type="submit" className="btn-primary" disabled={submitting}>
        {submitting ? "Analyzing…" : "Analyze Customer"}
      </button>
    </form>
  );
}
