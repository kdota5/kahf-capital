// ── Financial Advisor Schema ──

export interface FAClientRecord {
  client_id: string;
  age: number;
  filing_status: "Single" | "MFJ" | "MFS" | "HoH" | "QSS";
  federal_tax_bracket: number;
  state_tax_rate: number;
  risk_tolerance:
    | "Conservative"
    | "Moderate"
    | "Moderate Aggressive"
    | "Aggressive";
  investment_objective: string;
  time_horizon: string;
  annual_income: number;
  liquid_net_worth: number;
  total_net_worth: number;
  liquidity_needs: "Low" | "Moderate" | "High";
  retirement_age_target?: number;
  has_pension?: boolean;
  social_security_start_age?: number;
  num_dependents?: number;
  annual_expenses?: number;
  notes?: string;
}

export interface FAHolding {
  client_id: string;
  ticker: string;
  shares: number;
  cost_basis: number;
  current_price: number;
  account_type:
    | "Taxable"
    | "Traditional IRA"
    | "Roth IRA"
    | "401k"
    | "403b"
    | "SEP IRA"
    | "Trust"
    | "529"
    | "HSA";
  date_purchased?: string;
  annual_dividend_yield?: number;
  expense_ratio?: number;
}

// ── Accountant Schema ──

export interface AcctClientRecord {
  client_id: string;
  filing_status: "Single" | "MFJ" | "MFS" | "HoH" | "QSS";
  num_dependents: number;
  state_of_residence: string;
  w2_income: number;
  self_employment_income: number;
  business_income_loss: number;
  rental_income_loss: number;
  capital_gains_short: number;
  capital_gains_long: number;
  interest_income: number;
  dividend_income_qualified: number;
  dividend_income_ordinary: number;
  social_security_income: number;
  pension_income: number;
  ira_distributions: number;
  other_income: number;
  mortgage_interest: number;
  salt_paid: number;
  charitable_cash: number;
  charitable_noncash: number;
  medical_expenses: number;
  student_loan_interest: number;
  business_expenses: number;
  estimated_tax_payments: number;
  withholding: number;
  prior_year_overpayment: number;
  amt_preference_items?: number;
  iso_exercise_spread?: number;
  notes?: string;
}

// ── Unified types ──

export type UserMode = "financial_advisor" | "accountant";

export interface BookData {
  mode: UserMode;
  clients: FAClientRecord[] | AcctClientRecord[];
  holdings?: FAHolding[];
  rawHeaders: string[];
  rowCount: number;
  uploadedAt: string;
}

export interface BookAnalytics {
  mode: UserMode;
  totalClients: number;
  totalAUM?: number;
  avgClientAge?: number;
  riskDistribution?: Record<string, number>;
  topHoldings?: { ticker: string; totalMV: number; clientCount: number }[];
  accountTypeBreakdown?: Record<string, number>;
  clientsWithLargeConcentrations?: {
    client_id: string;
    ticker: string;
    weight: number;
  }[];
  clientsWithHarvestableLosses?: {
    client_id: string;
    ticker: string;
    unrealizedLoss: number;
    holdingPeriod: string;
  }[];
  avgAGI?: number;
  stateDistribution?: Record<string, number>;
  clientsAboveAMTThreshold?: string[];
  clientsItemizingVsStandard?: { itemizing: number; standard: number };
  totalEstimatedLiability?: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface PIIWarning {
  column: string;
  reason: string;
}

export interface ParseResult {
  clients: Record<string, unknown>[];
  holdings?: Record<string, unknown>[];
  headers: string[];
  errors: string[];
  piiWarnings: PIIWarning[];
}
