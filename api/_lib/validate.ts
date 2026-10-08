// Allowed values for every categorical CustomerInput field. Both
// /api/predict and /api/batch run every record through
// validateCategoricalValues() before scoring — without this, an invalid
// value (a typo, different capitalization, a stray space) would silently
// fall through buildFeatureVector()'s `=== level` comparisons as all-zero
// one-hot columns, i.e. silently treated as the baseline category, with
// no error surfaced to the person uploading the data.

export const ALLOWED_VALUES = {
  gender: ["Male", "Female"],
  Partner: ["Yes", "No"],
  Dependents: ["Yes", "No"],
  PhoneService: ["Yes", "No"],
  MultipleLines: ["Yes", "No", "No phone service"],
  InternetService: ["DSL", "Fiber optic", "No"],
  OnlineSecurity: ["Yes", "No", "No internet service"],
  OnlineBackup: ["Yes", "No", "No internet service"],
  DeviceProtection: ["Yes", "No", "No internet service"],
  TechSupport: ["Yes", "No", "No internet service"],
  StreamingTV: ["Yes", "No", "No internet service"],
  StreamingMovies: ["Yes", "No", "No internet service"],
  Contract: ["Month-to-month", "One year", "Two year"],
  PaperlessBilling: ["Yes", "No"],
  PaymentMethod: [
    "Electronic check",
    "Mailed check",
    "Bank transfer (automatic)",
    "Credit card (automatic)",
  ],
} as const;

export type CategoricalField = keyof typeof ALLOWED_VALUES;

/** Checks every categorical field in `record` against its allowed value
 * list. Returns one human-readable error per invalid field (empty array
 * if everything is valid). Values are compared exactly (case-sensitive),
 * matching the dataset's own convention, since silently normalizing case
 * would mask real data-quality problems rather than surface them. */
export function validateCategoricalValues(record: Record<string, unknown>): string[] {
  const errors: string[] = [];
  for (const field of Object.keys(ALLOWED_VALUES) as CategoricalField[]) {
    const value = record[field];
    const allowed = ALLOWED_VALUES[field] as readonly string[];
    if (typeof value !== "string" || !allowed.includes(value)) {
      errors.push(`${field} must be one of: ${allowed.join(", ")} (got ${JSON.stringify(value)})`);
    }
  }
  return errors;
}
