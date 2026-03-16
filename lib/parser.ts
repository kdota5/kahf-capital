import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { UserMode, PIIWarning, ParseResult } from "./types";

const PII_KEYWORDS = [
  "name",
  "ssn",
  "social",
  "address",
  "email",
  "phone",
  "dob",
  "birth",
  "first_name",
  "last_name",
  "full_name",
];

const HEADER_MAP: Record<string, string> = {
  "client id": "client_id",
  clientid: "client_id",
  "acct type": "account_type",
  "account type": "account_type",
  accounttype: "account_type",
  "filing status": "filing_status",
  filingstatus: "filing_status",
  "risk tolerance": "risk_tolerance",
  risktolerance: "risk_tolerance",
  "investment objective": "investment_objective",
  investmentobjective: "investment_objective",
  "time horizon": "time_horizon",
  timehorizon: "time_horizon",
  "annual income": "annual_income",
  annualincome: "annual_income",
  "liquid net worth": "liquid_net_worth",
  liquidnetworth: "liquid_net_worth",
  "total net worth": "total_net_worth",
  totalnetworth: "total_net_worth",
  "liquidity needs": "liquidity_needs",
  liquidityneeds: "liquidity_needs",
  "federal tax bracket": "federal_tax_bracket",
  federaltaxbracket: "federal_tax_bracket",
  "state tax rate": "state_tax_rate",
  statetaxrate: "state_tax_rate",
  "cost basis": "cost_basis",
  costbasis: "cost_basis",
  "current price": "current_price",
  currentprice: "current_price",
  "date purchased": "date_purchased",
  datepurchased: "date_purchased",
  "annual dividend yield": "annual_dividend_yield",
  annualdividendyield: "annual_dividend_yield",
  "expense ratio": "expense_ratio",
  expenseratio: "expense_ratio",
  "retirement age target": "retirement_age_target",
  retirementagetarget: "retirement_age_target",
  "has pension": "has_pension",
  haspension: "has_pension",
  "social security start age": "social_security_start_age",
  socialsecuritystartage: "social_security_start_age",
  "num dependents": "num_dependents",
  numdependents: "num_dependents",
  "annual expenses": "annual_expenses",
  annualexpenses: "annual_expenses",
  "w2 income": "w2_income",
  w2income: "w2_income",
  "self employment income": "self_employment_income",
  selfemploymentincome: "self_employment_income",
  "business income loss": "business_income_loss",
  businessincomeloss: "business_income_loss",
  "rental income loss": "rental_income_loss",
  rentalincomeloss: "rental_income_loss",
  "capital gains short": "capital_gains_short",
  capitalgainsshort: "capital_gains_short",
  "capital gains long": "capital_gains_long",
  capitalgainslong: "capital_gains_long",
  "interest income": "interest_income",
  interestincome: "interest_income",
  "dividend income qualified": "dividend_income_qualified",
  dividendincomequalified: "dividend_income_qualified",
  "dividend income ordinary": "dividend_income_ordinary",
  dividendincomeordinary: "dividend_income_ordinary",
  "social security income": "social_security_income",
  socialsecurityincome: "social_security_income",
  "pension income": "pension_income",
  pensionincome: "pension_income",
  "ira distributions": "ira_distributions",
  iradistributions: "ira_distributions",
  "other income": "other_income",
  otherincome: "other_income",
  "mortgage interest": "mortgage_interest",
  mortgageinterest: "mortgage_interest",
  "salt paid": "salt_paid",
  saltpaid: "salt_paid",
  "charitable cash": "charitable_cash",
  charitablecash: "charitable_cash",
  "charitable noncash": "charitable_noncash",
  charitablenoncash: "charitable_noncash",
  "medical expenses": "medical_expenses",
  medicalexpenses: "medical_expenses",
  "student loan interest": "student_loan_interest",
  studentloaninterest: "student_loan_interest",
  "business expenses": "business_expenses",
  businessexpenses: "business_expenses",
  "estimated tax payments": "estimated_tax_payments",
  estimatedtaxpayments: "estimated_tax_payments",
  "prior year overpayment": "prior_year_overpayment",
  prioryearoverpayment: "prior_year_overpayment",
  "amt preference items": "amt_preference_items",
  amtpreferenceitems: "amt_preference_items",
  "iso exercise spread": "iso_exercise_spread",
  isoexercisespread: "iso_exercise_spread",
  "state of residence": "state_of_residence",
  stateofresidence: "state_of_residence",
};

function normalizeHeader(h: string): string {
  const cleaned = h.toLowerCase().trim().replace(/[\s_-]+/g, " ");
  return HEADER_MAP[cleaned] || cleaned.replace(/\s+/g, "_");
}

function detectPII(headers: string[]): PIIWarning[] {
  const warnings: PIIWarning[] = [];
  for (const h of headers) {
    const lower = h.toLowerCase().replace(/[\s_-]+/g, "");
    for (const keyword of PII_KEYWORDS) {
      if (lower.includes(keyword) && lower !== "social_security_income" && lower !== "socialsecurityincome" && lower !== "socialsecuritystartage" && lower !== "social_security_start_age") {
        warnings.push({
          column: h,
          reason: `Column '${h}' may contain PII (matches '${keyword}'). This data will be sent to the AI. Remove it or confirm it's safe.`,
        });
        break;
      }
    }
  }
  return warnings;
}

const FA_REQUIRED = [
  "client_id",
  "age",
  "filing_status",
  "federal_tax_bracket",
  "state_tax_rate",
  "risk_tolerance",
  "investment_objective",
  "time_horizon",
  "annual_income",
  "liquid_net_worth",
  "total_net_worth",
  "liquidity_needs",
];

const FA_HOLDINGS_REQUIRED = [
  "client_id",
  "ticker",
  "shares",
  "cost_basis",
  "current_price",
  "account_type",
];

const ACCT_REQUIRED = [
  "client_id",
  "filing_status",
  "num_dependents",
  "state_of_residence",
  "w2_income",
  "self_employment_income",
  "business_income_loss",
  "rental_income_loss",
  "capital_gains_short",
  "capital_gains_long",
  "interest_income",
  "dividend_income_qualified",
  "dividend_income_ordinary",
  "social_security_income",
  "pension_income",
  "ira_distributions",
  "other_income",
  "mortgage_interest",
  "salt_paid",
  "charitable_cash",
  "charitable_noncash",
  "medical_expenses",
  "student_loan_interest",
  "business_expenses",
  "estimated_tax_payments",
  "withholding",
  "prior_year_overpayment",
];

function normalizeRows(
  rows: Record<string, unknown>[]
): { normalized: Record<string, unknown>[]; headers: string[] } {
  if (rows.length === 0) return { normalized: [], headers: [] };
  const rawHeaders = Object.keys(rows[0]);
  const headerMap = rawHeaders.map((h) => ({
    original: h,
    normalized: normalizeHeader(h),
  }));
  const headers = headerMap.map((h) => h.normalized);

  const normalized = rows.map((row) => {
    const out: Record<string, unknown> = {};
    for (const { original, normalized: norm } of headerMap) {
      out[norm] = row[original];
    }
    return out;
  });

  return { normalized, headers };
}

function validateFields(
  rows: Record<string, unknown>[],
  required: string[],
  label: string
): string[] {
  const errors: string[] = [];
  if (rows.length === 0) {
    errors.push(`${label}: No data rows found.`);
    return errors;
  }
  const headers = Object.keys(rows[0]);
  for (const field of required) {
    if (!headers.includes(field)) {
      errors.push(`${label}: Missing required column '${field}'.`);
    }
  }
  return errors;
}

function parseNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const cleaned = v.replace(/[$,%\s]/g, "");
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

function coerceRow(row: Record<string, unknown>, numericFields: string[]): Record<string, unknown> {
  const out = { ...row };
  for (const field of numericFields) {
    if (field in out) {
      out[field] = parseNumber(out[field]);
    }
  }
  return out;
}

const FA_NUMERIC = [
  "age", "federal_tax_bracket", "state_tax_rate", "annual_income",
  "liquid_net_worth", "total_net_worth", "retirement_age_target",
  "social_security_start_age", "num_dependents", "annual_expenses",
];

const HOLDING_NUMERIC = [
  "shares", "cost_basis", "current_price", "annual_dividend_yield", "expense_ratio",
];

const ACCT_NUMERIC = [
  "num_dependents", "w2_income", "self_employment_income", "business_income_loss",
  "rental_income_loss", "capital_gains_short", "capital_gains_long", "interest_income",
  "dividend_income_qualified", "dividend_income_ordinary", "social_security_income",
  "pension_income", "ira_distributions", "other_income", "mortgage_interest",
  "salt_paid", "charitable_cash", "charitable_noncash", "medical_expenses",
  "student_loan_interest", "business_expenses", "estimated_tax_payments",
  "withholding", "prior_year_overpayment", "amt_preference_items", "iso_exercise_spread",
];

function parseCSVText(text: string): Record<string, unknown>[] {
  const result = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });
  return result.data as Record<string, unknown>[];
}

function parseExcelSheets(buffer: ArrayBuffer): Record<string, Record<string, unknown>[]> {
  const wb = XLSX.read(buffer, { type: "array" });
  const sheets: Record<string, Record<string, unknown>[]> = {};
  for (const name of wb.SheetNames) {
    sheets[name] = XLSX.utils.sheet_to_json(wb.Sheets[name]);
  }
  return sheets;
}

export async function parseUpload(
  file: File,
  mode: UserMode,
  holdingsFile?: File
): Promise<ParseResult> {
  const errors: string[] = [];
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (!ext || !["csv", "xlsx", "xls"].includes(ext)) {
    return { clients: [], headers: [], errors: ["Unsupported file format. Use .csv, .xlsx, or .xls"], piiWarnings: [] };
  }

  let clientRows: Record<string, unknown>[] = [];
  let holdingRows: Record<string, unknown>[] | undefined;
  let allRawHeaders: string[] = [];

  if (ext === "csv") {
    const text = await file.text();
    const raw = parseCSVText(text);
    const { normalized, headers } = normalizeRows(raw);
    clientRows = normalized;
    allRawHeaders = headers;

    if (holdingsFile && mode === "financial_advisor") {
      const hText = await holdingsFile.text();
      const hRaw = parseCSVText(hText);
      const { normalized: hNorm, headers: hHeaders } = normalizeRows(hRaw);
      holdingRows = hNorm;
      allRawHeaders = Array.from(new Set(allRawHeaders.concat(hHeaders)));
    }
  } else {
    const buffer = await file.arrayBuffer();
    const sheets = parseExcelSheets(buffer);
    const sheetNames = Object.keys(sheets);

    if (mode === "financial_advisor" && sheetNames.length >= 2) {
      const { normalized: cNorm, headers: cH } = normalizeRows(sheets[sheetNames[0]]);
      const { normalized: hNorm, headers: hH } = normalizeRows(sheets[sheetNames[1]]);
      clientRows = cNorm;
      holdingRows = hNorm;
      allRawHeaders = Array.from(new Set(cH.concat(hH)));
    } else {
      const { normalized, headers } = normalizeRows(sheets[sheetNames[0]]);
      clientRows = normalized;
      allRawHeaders = headers;
    }
  }

  const piiWarnings = detectPII(allRawHeaders);

  if (mode === "financial_advisor") {
    errors.push(...validateFields(clientRows, FA_REQUIRED, "Clients"));
    clientRows = clientRows.map((r) => coerceRow(r, FA_NUMERIC));
    if (holdingRows) {
      errors.push(...validateFields(holdingRows, FA_HOLDINGS_REQUIRED, "Holdings"));
      holdingRows = holdingRows.map((r) => coerceRow(r, HOLDING_NUMERIC));
    }
  } else {
    errors.push(...validateFields(clientRows, ACCT_REQUIRED, "Clients"));
    clientRows = clientRows.map((r) => coerceRow(r, ACCT_NUMERIC));
  }

  return {
    clients: clientRows,
    holdings: holdingRows,
    headers: allRawHeaders,
    errors,
    piiWarnings,
  };
}
