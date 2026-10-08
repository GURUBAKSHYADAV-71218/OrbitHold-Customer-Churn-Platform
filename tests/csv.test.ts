import { describe, it, expect } from "vitest";
import { parseCsv } from "../api/_lib/csv";
import { rowToCustomer } from "../api/batch";

describe("parseCsv", () => {
  it("parses headers and rows", () => {
    const { headers, rows } = parseCsv("a,b,c\n1,2,3\n4,5,6");
    expect(headers).toEqual(["a", "b", "c"]);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ a: "1", b: "2", c: "3" });
  });

  it("handles quoted fields containing commas", () => {
    const { rows } = parseCsv('name,note\n"Smith, John","says ""hi"""');
    expect(rows[0].name).toBe("Smith, John");
    expect(rows[0].note).toBe('says "hi"');
  });

  it("returns empty headers/rows for empty input", () => {
    const { headers, rows } = parseCsv("");
    expect(headers).toEqual([]);
    expect(rows).toEqual([]);
  });

  it("ignores blank lines", () => {
    const { rows } = parseCsv("a,b\n1,2\n\n3,4\n");
    expect(rows).toHaveLength(2);
  });
});

const validRow: Record<string, string> = {
  customerID: "1001-ABCDE",
  gender: "Female",
  SeniorCitizen: "0",
  Partner: "Yes",
  Dependents: "No",
  tenure: "12",
  PhoneService: "Yes",
  MultipleLines: "No",
  InternetService: "DSL",
  OnlineSecurity: "Yes",
  OnlineBackup: "No",
  DeviceProtection: "No",
  TechSupport: "No",
  StreamingTV: "No",
  StreamingMovies: "No",
  Contract: "One year",
  PaperlessBilling: "Yes",
  PaymentMethod: "Mailed check",
  MonthlyCharges: "55.5",
  TotalCharges: "666.0",
};

describe("rowToCustomer", () => {
  it("accepts a fully valid row", () => {
    const result = rowToCustomer(validRow, 0);
    expect("customer" in result).toBe(true);
  });

  it("treats a blank TotalCharges as 0 (new-customer convention)", () => {
    const result = rowToCustomer({ ...validRow, TotalCharges: "" }, 0);
    expect("customer" in result).toBe(true);
    if ("customer" in result) expect(result.customer.TotalCharges).toBe(0);
  });

  it("rejects a row missing a required column", () => {
    const { Contract, ...rest } = validRow;
    const result = rowToCustomer(rest as Record<string, string>, 0);
    expect("error" in result).toBe(true);
  });

  it("rejects non-numeric tenure", () => {
    const result = rowToCustomer({ ...validRow, tenure: "N/A" }, 0);
    expect("error" in result).toBe(true);
  });

  it("rejects an unknown categorical value with a row-numbered error", () => {
    const result = rowToCustomer({ ...validRow, gender: "Unknown" }, 4);
    expect("error" in result).toBe(true);
    if ("error" in result) expect(result.error).toContain("Row 6");
  });

  it("rejects negative charges", () => {
    expect("error" in rowToCustomer({ ...validRow, MonthlyCharges: "-5" }, 0)).toBe(true);
  });

  it("rejects an invalid SeniorCitizen value", () => {
    const result = rowToCustomer({ ...validRow, SeniorCitizen: "maybe" }, 0);
    expect("error" in result).toBe(true);
  });
});
