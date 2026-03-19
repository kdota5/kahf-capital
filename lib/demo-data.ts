import type { FAClientRecord, FAHolding, AcctClientRecord, ClientDirectoryEntry, ChatMessage } from "./types";

export const FA_DEMO_CLIENTS: FAClientRecord[] = [
  {
    // Roth conversion candidate #1: high bracket now, expecting lower in retirement
    client_id: "C-1001",
    age: 58,
    filing_status: "MFJ",
    federal_tax_bracket: 0.32,
    state_tax_rate: 0.05,
    risk_tolerance: "Moderate",
    investment_objective: "Retirement Income",
    time_horizon: "5-10 years",
    annual_income: 285000,
    liquid_net_worth: 1800000,
    total_net_worth: 3200000,
    liquidity_needs: "Low",
    retirement_age_target: 63,
    has_pension: true,
    social_security_start_age: 67,
    notes: "Approaching retirement, wants to travel extensively. Considering downsizing primary residence in 2-3 years. Concerned about healthcare costs before Medicare eligibility.",
  },
  {
    // Roth conversion candidate #2: large Traditional IRA, high bracket
    client_id: "C-1002",
    age: 52,
    filing_status: "Single",
    federal_tax_bracket: 0.35,
    state_tax_rate: 0.0,
    risk_tolerance: "Moderate Aggressive",
    investment_objective: "Growth & Income",
    time_horizon: "10-15 years",
    annual_income: 420000,
    liquid_net_worth: 2400000,
    total_net_worth: 3800000,
    liquidity_needs: "Low",
    retirement_age_target: 60,
    notes: "Dual income household, both in tech. Recently exercised ISOs. Considering starting a family — may reduce to single income within 2 years.",
  },
  {
    // Dangerous tech concentration
    client_id: "C-1003",
    age: 44,
    filing_status: "MFJ",
    federal_tax_bracket: 0.37,
    state_tax_rate: 0.093,
    risk_tolerance: "Aggressive",
    investment_objective: "Capital Appreciation",
    time_horizon: "15+ years",
    annual_income: 650000,
    liquid_net_worth: 3100000,
    total_net_worth: 5200000,
    liquidity_needs: "Low",
    num_dependents: 2,
    notes: "Recently inherited $800k concentrated stock position from deceased spouse. Emotionally attached to the holdings. Needs gentle approach to diversification.",
  },
  {
    // Tax-loss harvesting opportunity
    client_id: "C-1004",
    age: 39,
    filing_status: "MFJ",
    federal_tax_bracket: 0.32,
    state_tax_rate: 0.06,
    risk_tolerance: "Moderate Aggressive",
    investment_objective: "Growth",
    time_horizon: "15+ years",
    annual_income: 310000,
    liquid_net_worth: 950000,
    total_net_worth: 1600000,
    liquidity_needs: "Moderate",
    num_dependents: 3,
    annual_expenses: 180000,
    notes: "Business owner, exploring partial sale to private equity. Liquidity event possible in 12-18 months. Wants to minimize capital gains impact.",
  },
  {
    // Risk mismatch: Conservative stated, aggressive portfolio
    client_id: "C-1005",
    age: 67,
    filing_status: "MFJ",
    federal_tax_bracket: 0.24,
    state_tax_rate: 0.04,
    risk_tolerance: "Conservative",
    investment_objective: "Capital Preservation",
    time_horizon: "5-10 years",
    annual_income: 120000,
    liquid_net_worth: 890000,
    total_net_worth: 1400000,
    liquidity_needs: "High",
    has_pension: false,
    social_security_start_age: 70,
    notes: "Retired teacher with pension. Primary concern is not outliving assets. Very low risk tolerance but current portfolio is misallocated from a DIY phase.",
  },
  {
    // Near retirement, too much equity
    client_id: "C-1006",
    age: 62,
    filing_status: "Single",
    federal_tax_bracket: 0.32,
    state_tax_rate: 0.07,
    risk_tolerance: "Moderate",
    investment_objective: "Retirement Income",
    time_horizon: "3-5 years",
    annual_income: 195000,
    liquid_net_worth: 1100000,
    total_net_worth: 1700000,
    liquidity_needs: "Moderate",
    retirement_age_target: 65,
    annual_expenses: 95000,
    notes: "High-income physician, minimal time for financial management. Has multiple old 401k accounts from prior employers that need consolidation.",
  },
  {
    // Poor asset location
    client_id: "C-1007",
    age: 48,
    filing_status: "MFJ",
    federal_tax_bracket: 0.35,
    state_tax_rate: 0.05,
    risk_tolerance: "Moderate",
    investment_objective: "Balanced Growth",
    time_horizon: "10-15 years",
    annual_income: 380000,
    liquid_net_worth: 1650000,
    total_net_worth: 2900000,
    liquidity_needs: "Low",
    num_dependents: 2,
    notes: "Recently divorced, received taxable brokerage account in settlement. Unfamiliar with investing. Needs complete portfolio restructuring aligned to new financial situation.",
  },
  {
    // Well-optimized benchmark client
    client_id: "C-1008",
    age: 55,
    filing_status: "MFJ",
    federal_tax_bracket: 0.24,
    state_tax_rate: 0.05,
    risk_tolerance: "Moderate",
    investment_objective: "Retirement Income",
    time_horizon: "10-15 years",
    annual_income: 210000,
    liquid_net_worth: 1400000,
    total_net_worth: 2100000,
    liquidity_needs: "Low",
    retirement_age_target: 67,
    has_pension: true,
    social_security_start_age: 67,
    notes: "Young professional, aggressive saver. Maxing all tax-advantaged accounts. Interested in alternative investments but risk label may not fully capture appetite.",
  },
];

export const FA_DEMO_HOLDINGS: FAHolding[] = [
  // C-1001 — Roth candidate: large Traditional IRA
  { client_id: "C-1001", ticker: "VTI", shares: 800, cost_basis: 120, current_price: 268, account_type: "Traditional IRA", date_purchased: "2016-03-15" },
  { client_id: "C-1001", ticker: "VXUS", shares: 400, cost_basis: 45, current_price: 58, account_type: "Traditional IRA", date_purchased: "2017-06-10" },
  { client_id: "C-1001", ticker: "BND", shares: 600, cost_basis: 78, current_price: 72, account_type: "Traditional IRA", date_purchased: "2018-01-20" },
  { client_id: "C-1001", ticker: "VTI", shares: 200, cost_basis: 180, current_price: 268, account_type: "Taxable", date_purchased: "2020-04-01" },
  { client_id: "C-1001", ticker: "AAPL", shares: 150, cost_basis: 95, current_price: 192, account_type: "Taxable", date_purchased: "2019-08-12" },
  { client_id: "C-1001", ticker: "BND", shares: 300, cost_basis: 80, current_price: 72, account_type: "Roth IRA", date_purchased: "2019-02-14" },

  // C-1002 — Roth candidate: massive Traditional IRA
  { client_id: "C-1002", ticker: "VOO", shares: 1200, cost_basis: 280, current_price: 512, account_type: "Traditional IRA", date_purchased: "2015-05-20" },
  { client_id: "C-1002", ticker: "QQQ", shares: 500, cost_basis: 180, current_price: 478, account_type: "Traditional IRA", date_purchased: "2016-11-01" },
  { client_id: "C-1002", ticker: "VTI", shares: 300, cost_basis: 200, current_price: 268, account_type: "Roth IRA", date_purchased: "2018-07-15" },
  { client_id: "C-1002", ticker: "MSFT", shares: 200, cost_basis: 110, current_price: 415, account_type: "Taxable", date_purchased: "2017-03-22" },
  { client_id: "C-1002", ticker: "SCHD", shares: 400, cost_basis: 55, current_price: 82, account_type: "Taxable", date_purchased: "2019-09-05", annual_dividend_yield: 0.035 },

  // C-1003 — Dangerous tech concentration (>40% NVDA+AAPL+MSFT)
  { client_id: "C-1003", ticker: "NVDA", shares: 1500, cost_basis: 15, current_price: 138, account_type: "Taxable", date_purchased: "2019-01-10" },
  { client_id: "C-1003", ticker: "AAPL", shares: 600, cost_basis: 45, current_price: 192, account_type: "Taxable", date_purchased: "2018-06-01" },
  { client_id: "C-1003", ticker: "MSFT", shares: 400, cost_basis: 85, current_price: 415, account_type: "Taxable", date_purchased: "2017-09-15" },
  { client_id: "C-1003", ticker: "VOO", shares: 200, cost_basis: 350, current_price: 512, account_type: "401k", date_purchased: "2021-01-05" },
  { client_id: "C-1003", ticker: "AMZN", shares: 100, cost_basis: 95, current_price: 198, account_type: "Taxable", date_purchased: "2020-03-20" },
  { client_id: "C-1003", ticker: "BND", shares: 200, cost_basis: 76, current_price: 72, account_type: "401k", date_purchased: "2021-06-01" },

  // C-1004 — Tax-loss harvesting (bought near 2021 highs)
  { client_id: "C-1004", ticker: "ARKK", shares: 500, cost_basis: 148, current_price: 52, account_type: "Taxable", date_purchased: "2021-11-08" },
  { client_id: "C-1004", ticker: "COIN", shares: 200, cost_basis: 320, current_price: 225, account_type: "Taxable", date_purchased: "2021-10-15" },
  { client_id: "C-1004", ticker: "SQ", shares: 300, cost_basis: 240, current_price: 78, account_type: "Taxable", date_purchased: "2021-08-20" },
  { client_id: "C-1004", ticker: "PYPL", shares: 400, cost_basis: 270, current_price: 68, account_type: "Taxable", date_purchased: "2021-09-01" },
  { client_id: "C-1004", ticker: "VTI", shares: 250, cost_basis: 210, current_price: 268, account_type: "401k", date_purchased: "2020-06-15" },
  { client_id: "C-1004", ticker: "VXUS", shares: 150, cost_basis: 52, current_price: 58, account_type: "401k", date_purchased: "2020-06-15" },

  // C-1005 — Risk mismatch: says Conservative but holds aggressive positions
  { client_id: "C-1005", ticker: "TQQQ", shares: 300, cost_basis: 35, current_price: 72, account_type: "Taxable", date_purchased: "2023-01-10" },
  { client_id: "C-1005", ticker: "NVDA", shares: 200, cost_basis: 25, current_price: 138, account_type: "Taxable", date_purchased: "2020-05-20" },
  { client_id: "C-1005", ticker: "TSLA", shares: 150, cost_basis: 180, current_price: 248, account_type: "Taxable", date_purchased: "2022-06-01" },
  { client_id: "C-1005", ticker: "VOO", shares: 400, cost_basis: 300, current_price: 512, account_type: "Traditional IRA", date_purchased: "2019-04-10" },
  { client_id: "C-1005", ticker: "BND", shares: 100, cost_basis: 78, current_price: 72, account_type: "Traditional IRA", date_purchased: "2020-01-15" },

  // C-1006 — Near retirement, too much equity (90%+ equities)
  { client_id: "C-1006", ticker: "VOO", shares: 600, cost_basis: 250, current_price: 512, account_type: "Traditional IRA", date_purchased: "2017-05-01" },
  { client_id: "C-1006", ticker: "VTI", shares: 400, cost_basis: 170, current_price: 268, account_type: "401k", date_purchased: "2018-03-20" },
  { client_id: "C-1006", ticker: "AAPL", shares: 200, cost_basis: 65, current_price: 192, account_type: "Taxable", date_purchased: "2016-09-10" },
  { client_id: "C-1006", ticker: "MSFT", shares: 100, cost_basis: 75, current_price: 415, account_type: "Taxable", date_purchased: "2016-09-10" },
  { client_id: "C-1006", ticker: "AGG", shares: 50, cost_basis: 105, current_price: 98, account_type: "Traditional IRA", date_purchased: "2021-01-15" },

  // C-1007 — Poor asset location: dividends in taxable, growth in IRA
  { client_id: "C-1007", ticker: "VYM", shares: 500, cost_basis: 85, current_price: 118, account_type: "Taxable", date_purchased: "2019-02-01", annual_dividend_yield: 0.032 },
  { client_id: "C-1007", ticker: "SCHD", shares: 600, cost_basis: 52, current_price: 82, account_type: "Taxable", date_purchased: "2018-07-15", annual_dividend_yield: 0.035 },
  { client_id: "C-1007", ticker: "O", shares: 300, cost_basis: 55, current_price: 58, account_type: "Taxable", date_purchased: "2019-11-20", annual_dividend_yield: 0.056 },
  { client_id: "C-1007", ticker: "QQQ", shares: 200, cost_basis: 220, current_price: 478, account_type: "Traditional IRA", date_purchased: "2020-03-25" },
  { client_id: "C-1007", ticker: "AMZN", shares: 100, cost_basis: 105, current_price: 198, account_type: "Traditional IRA", date_purchased: "2020-03-25" },
  { client_id: "C-1007", ticker: "GOOGL", shares: 150, cost_basis: 90, current_price: 175, account_type: "Roth IRA", date_purchased: "2020-06-10" },

  // C-1008 — Well-optimized benchmark
  { client_id: "C-1008", ticker: "VTI", shares: 400, cost_basis: 180, current_price: 268, account_type: "Taxable", date_purchased: "2018-04-10" },
  { client_id: "C-1008", ticker: "VXUS", shares: 200, cost_basis: 48, current_price: 58, account_type: "Taxable", date_purchased: "2018-04-10" },
  { client_id: "C-1008", ticker: "BND", shares: 500, cost_basis: 80, current_price: 72, account_type: "Traditional IRA", date_purchased: "2019-01-02" },
  { client_id: "C-1008", ticker: "VTIP", shares: 300, cost_basis: 50, current_price: 48, account_type: "Traditional IRA", date_purchased: "2019-01-02" },
  { client_id: "C-1008", ticker: "VTI", shares: 300, cost_basis: 200, current_price: 268, account_type: "Roth IRA", date_purchased: "2020-01-15" },
  { client_id: "C-1008", ticker: "VGT", shares: 100, cost_basis: 280, current_price: 530, account_type: "Roth IRA", date_purchased: "2020-01-15" },
];

export const ACCT_DEMO_CLIENTS: AcctClientRecord[] = [
  {
    // AMT risk #1: high W-2, ISO exercises
    client_id: "C-2001",
    filing_status: "MFJ",
    num_dependents: 2,
    state_of_residence: "CA",
    w2_income: 425000,
    self_employment_income: 0,
    business_income_loss: 0,
    rental_income_loss: 0,
    capital_gains_short: 15000,
    capital_gains_long: 45000,
    interest_income: 8200,
    dividend_income_qualified: 12000,
    dividend_income_ordinary: 3500,
    social_security_income: 0,
    pension_income: 0,
    ira_distributions: 0,
    other_income: 0,
    mortgage_interest: 28000,
    salt_paid: 52000,
    charitable_cash: 15000,
    charitable_noncash: 5000,
    medical_expenses: 2000,
    student_loan_interest: 0,
    business_expenses: 0,
    estimated_tax_payments: 40000,
    withholding: 95000,
    prior_year_overpayment: 0,
    amt_preference_items: 18000,
    iso_exercise_spread: 120000,
    notes: "Exercised 2,000 ISOs this year. Concerned about AMT impact.",
  },
  {
    // AMT risk #2: high income, large SALT
    client_id: "C-2002",
    filing_status: "MFJ",
    num_dependents: 3,
    state_of_residence: "NY",
    w2_income: 380000,
    self_employment_income: 0,
    business_income_loss: 0,
    rental_income_loss: -12000,
    capital_gains_short: 0,
    capital_gains_long: 85000,
    interest_income: 6500,
    dividend_income_qualified: 18000,
    dividend_income_ordinary: 4200,
    social_security_income: 0,
    pension_income: 0,
    ira_distributions: 0,
    other_income: 0,
    mortgage_interest: 35000,
    salt_paid: 68000,
    charitable_cash: 20000,
    charitable_noncash: 0,
    medical_expenses: 3500,
    student_loan_interest: 0,
    business_expenses: 0,
    estimated_tax_payments: 55000,
    withholding: 82000,
    prior_year_overpayment: 5000,
    amt_preference_items: 25000,
    notes: "NYC resident. Very high SALT. Lost $58k to SALT cap last year.",
  },
  {
    // 199A QBI opportunity
    client_id: "C-2003",
    filing_status: "MFJ",
    num_dependents: 1,
    state_of_residence: "TX",
    w2_income: 0,
    self_employment_income: 95000,
    business_income_loss: 185000,
    rental_income_loss: 22000,
    capital_gains_short: 0,
    capital_gains_long: 12000,
    interest_income: 3200,
    dividend_income_qualified: 4500,
    dividend_income_ordinary: 1200,
    social_security_income: 0,
    pension_income: 0,
    ira_distributions: 0,
    other_income: 0,
    mortgage_interest: 14000,
    salt_paid: 6000,
    charitable_cash: 8000,
    charitable_noncash: 2000,
    medical_expenses: 1500,
    student_loan_interest: 0,
    business_expenses: 35000,
    estimated_tax_payments: 45000,
    withholding: 0,
    prior_year_overpayment: 3000,
    notes: "Owns consulting firm (S-corp). Pass-through income should qualify for 199A. No state income tax.",
  },
  {
    // Charitable bunching candidate
    client_id: "C-2004",
    filing_status: "MFJ",
    num_dependents: 0,
    state_of_residence: "FL",
    w2_income: 175000,
    self_employment_income: 0,
    business_income_loss: 0,
    rental_income_loss: 0,
    capital_gains_short: 5000,
    capital_gains_long: 8000,
    interest_income: 4500,
    dividend_income_qualified: 6000,
    dividend_income_ordinary: 2000,
    social_security_income: 0,
    pension_income: 0,
    ira_distributions: 0,
    other_income: 0,
    mortgage_interest: 12000,
    salt_paid: 4000,
    charitable_cash: 10000,
    charitable_noncash: 3000,
    medical_expenses: 800,
    student_loan_interest: 0,
    business_expenses: 0,
    estimated_tax_payments: 10000,
    withholding: 38000,
    prior_year_overpayment: 0,
    notes: "Typically gives $10-13k/yr to charity. Itemized deductions are close to standard deduction threshold.",
  },
  {
    // Underpayment risk
    client_id: "C-2005",
    filing_status: "Single",
    num_dependents: 0,
    state_of_residence: "WA",
    w2_income: 165000,
    self_employment_income: 0,
    business_income_loss: 0,
    rental_income_loss: 0,
    capital_gains_short: 95000,
    capital_gains_long: 140000,
    interest_income: 12000,
    dividend_income_qualified: 8000,
    dividend_income_ordinary: 5000,
    social_security_income: 0,
    pension_income: 0,
    ira_distributions: 0,
    other_income: 0,
    mortgage_interest: 0,
    salt_paid: 0,
    charitable_cash: 5000,
    charitable_noncash: 0,
    medical_expenses: 0,
    student_loan_interest: 0,
    business_expenses: 0,
    estimated_tax_payments: 8000,
    withholding: 35000,
    prior_year_overpayment: 0,
    notes: "Had an unusually large year of stock sales. No state income tax (WA). Estimated payments seem low relative to gains.",
  },
  {
    // Multi-state complexity
    client_id: "C-2006",
    filing_status: "MFJ",
    num_dependents: 2,
    state_of_residence: "NJ",
    w2_income: 220000,
    self_employment_income: 45000,
    business_income_loss: 0,
    rental_income_loss: 18000,
    capital_gains_short: 8000,
    capital_gains_long: 25000,
    interest_income: 5500,
    dividend_income_qualified: 7000,
    dividend_income_ordinary: 2500,
    social_security_income: 0,
    pension_income: 0,
    ira_distributions: 0,
    other_income: 12000,
    mortgage_interest: 22000,
    salt_paid: 38000,
    charitable_cash: 12000,
    charitable_noncash: 0,
    medical_expenses: 6000,
    student_loan_interest: 2500,
    business_expenses: 15000,
    estimated_tax_payments: 30000,
    withholding: 48000,
    prior_year_overpayment: 2000,
    notes: "Primary residence in NJ, rental property in PA, consulting work sourced in NY. Needs multi-state filing. Moved from NY to NJ mid-year last year.",
  },
  {
    // DAF candidate: high-income year
    client_id: "C-2007",
    filing_status: "Single",
    num_dependents: 0,
    state_of_residence: "MA",
    w2_income: 520000,
    self_employment_income: 0,
    business_income_loss: 0,
    rental_income_loss: 0,
    capital_gains_short: 0,
    capital_gains_long: 200000,
    interest_income: 15000,
    dividend_income_qualified: 22000,
    dividend_income_ordinary: 8000,
    social_security_income: 0,
    pension_income: 0,
    ira_distributions: 0,
    other_income: 75000,
    mortgage_interest: 18000,
    salt_paid: 45000,
    charitable_cash: 25000,
    charitable_noncash: 10000,
    medical_expenses: 1000,
    student_loan_interest: 0,
    business_expenses: 0,
    estimated_tax_payments: 80000,
    withholding: 130000,
    prior_year_overpayment: 0,
    notes: "Received large bonus + stock vesting this year. Historically charitable ($25-35k/yr). Would consider DAF to front-load deductions in this high-income year.",
  },
  {
    // Straightforward baseline
    client_id: "C-2008",
    filing_status: "MFJ",
    num_dependents: 2,
    state_of_residence: "OH",
    w2_income: 135000,
    self_employment_income: 0,
    business_income_loss: 0,
    rental_income_loss: 0,
    capital_gains_short: 0,
    capital_gains_long: 5000,
    interest_income: 2500,
    dividend_income_qualified: 3000,
    dividend_income_ordinary: 1000,
    social_security_income: 0,
    pension_income: 0,
    ira_distributions: 0,
    other_income: 0,
    mortgage_interest: 9000,
    salt_paid: 8500,
    charitable_cash: 6000,
    charitable_noncash: 0,
    medical_expenses: 1500,
    student_loan_interest: 1800,
    business_expenses: 0,
    estimated_tax_payments: 0,
    withholding: 28000,
    prior_year_overpayment: 1200,
    notes: "Straightforward dual-income household. Standard W-2 employment. Itemized deductions are close to standard deduction — worth evaluating.",
  },
];

// ── Demo Client Directories ──

export const FA_DEMO_DIRECTORY: ClientDirectoryEntry[] = [
  { client_id: "C-1001", full_name: "James & Patricia Morrison", email: "james@morrisonwealth.com", phone: "212-555-0142", company: "Morrison & Associates" },
  { client_id: "C-1002", full_name: "Kevin & Priya Ramanathan", email: "kevin.ramanathan@gmail.com", phone: "646-555-0298", company: "Ramanathan Family Trust" },
  { client_id: "C-1003", full_name: "Margaret Holloway", email: "margaret.holloway@gmail.com", phone: "212-555-0187", company: "" },
  { client_id: "C-1004", full_name: "David Okonkwo", email: "david@okonkwo-enterprises.com", phone: "917-555-0334", company: "Okonkwo Enterprises" },
  { client_id: "C-1005", full_name: "Barbara Fitzgerald", email: "bfitzgerald@retired.net", phone: "212-555-0456", company: "" },
  { client_id: "C-1006", full_name: "Dr. Amir Hassan", email: "a.hassan@nycmedical.org", phone: "917-555-0512", company: "NYC Medical Group" },
  { client_id: "C-1007", full_name: "Nicole Brennan", email: "nicole.brennan@gmail.com", phone: "347-555-0623", company: "" },
  { client_id: "C-1008", full_name: "Ethan Park", email: "ethan.park@techcorp.io", phone: "646-555-0789", company: "TechCorp" },
];

export const ACCT_DEMO_DIRECTORY: ClientDirectoryEntry[] = [
  { client_id: "C-2001", full_name: "Richard Huang", email: "rhuang@huangtech.com", phone: "415-555-0101", company: "Huang Technologies" },
  { client_id: "C-2002", full_name: "Margaret Sullivan", email: "msullivan@sullivanlaw.com", phone: "212-555-0202", company: "Sullivan & Associates" },
  { client_id: "C-2003", full_name: "Carlos Mendez", email: "carlos@mendezadvisors.com", phone: "512-555-0303", company: "Mendez Consulting" },
  { client_id: "C-2004", full_name: "Jennifer Walsh", email: "jwalsh@walshfamily.net", phone: "305-555-0404", company: "Walsh Family Office" },
  { client_id: "C-2005", full_name: "Alexander Petrov", email: "apetrov@petrovventures.com", phone: "206-555-0505", company: "Petrov Ventures" },
  { client_id: "C-2006", full_name: "Priya Sharma", email: "priya@sharmapartners.com", phone: "201-555-0606", company: "Sharma & Partners" },
  { client_id: "C-2007", full_name: "Thomas Bradley", email: "tbradley@bradleygroup.com", phone: "617-555-0707", company: "Bradley Capital Group" },
  { client_id: "C-2008", full_name: "Nicole Foster", email: "nfoster@fosterfinancial.com", phone: "614-555-0808", company: "Foster Financial Planning" },
];

// ── Demo Firm Context ──

export const DEMO_FIRM_CONTEXT = {
  name: "Midtown Advisory Partners",
  clients: 8,
  aum: "$12.4M",
  region: "New York Metro",
};

// ── Preloaded Demo Conversation ──

export const PRELOADED_CONVERSATION: ChatMessage[] = [
  {
    role: "assistant",
    content: `Here are the most actionable findings from an initial scan of your 8-client book:

### Roth Conversion Window — C-1001

C-1001 is 58, in the 32% federal bracket, with a pension covering a significant portion of future expenses. With retirement targeted at 63, there's a **5-year Roth conversion window** where we can systematically convert Traditional IRA assets ($214,400 in VTI + $23,200 in VXUS + $43,200 in BND = ~$280,800) at the current bracket before RMDs begin. The pension income means their post-retirement bracket could actually stay elevated — making the window *now* particularly valuable.

### Dangerous Concentration — C-1003

C-1003 has an extremely concentrated equity position: **NVDA alone is $207,000** (1,500 shares at $138), plus $115,200 in AAPL and $166,000 in MSFT. That's roughly **$488,200 in three mega-cap tech names** — well over 40% of their liquid net worth of $3.1M. The notes indicate this was inherited from a deceased spouse and there's emotional attachment. This requires a careful, phased diversification approach — possibly using charitable remainder trusts or systematic selling with tax-loss offsets from C-1004's positions.

### Tax-Loss Harvesting — C-1004

C-1004 has significant unrealized losses from 2021-era purchases: **ARKK is down ~$48,000** (cost $148, current $52), **SQ down ~$48,600** (cost $240, current $78), and **PYPL down ~$80,800** (cost $270, current $68). Total harvestable losses exceed **$177,000**. Given their 32% bracket, this represents potential tax savings of $56,000+. These should be harvested before year-end and replaced with similar-but-not-identical positions to maintain market exposure.

### Risk Profile Mismatch — C-1005

C-1005 states "Conservative" risk tolerance and "Capital Preservation" objective, but holds **TQQQ (3x leveraged NASDAQ)**, NVDA, and TSLA in taxable accounts. This is a serious mismatch — a retiree with high liquidity needs holding a leveraged ETF. The TQQQ position alone has daily volatility that could swing 10-15% in a week. Recommend immediate discussion about reallocating to match stated risk profile.

### Near-Retirement Equity Overweight — C-1006

C-1006 is 62, targeting retirement at 65 with no pension. Their portfolio is approximately **93% equities** (VOO, VTI, AAPL, MSFT) with only $4,900 in bonds (AGG). With a 3-year runway and reliance on portfolio + Social Security, they need a significant increase in fixed income allocation to protect against sequence-of-returns risk.`,
    isInitialScan: true,
    scanDuration: 8.2,
  },
  {
    role: "user",
    content: "Walk me through the Roth conversion math for C-1001",
  },
  {
    role: "assistant",
    content: `## Roth Conversion Analysis — C-1001

### Current Situation
- **Age:** 58, targeting retirement at 63
- **Filing Status:** MFJ
- **Current Federal Bracket:** 32% ($285,000 income)
- **State Tax Rate:** 5%
- **Traditional IRA Assets:** ~$280,800 (VTI $214,400 + VXUS $23,200 + BND $43,200)
- **Has Pension:** Yes, covering ~40% of expenses
- **Social Security Start:** Age 67

### The Conversion Window

The key insight is the **5-year gap between retirement (63) and Social Security (67)**. During years 63-67, C-1001's taxable income drops significantly — pension income only, no W-2. This creates a window where conversions could happen at the **22% or 24% bracket** instead of the current 32%.

However, there's a counter-argument: the pension will cover ~40% of expenses, which means post-retirement income isn't as low as typical retirees. Let's model both scenarios:

**Scenario A: Convert now (age 58-63) at 32%**
- Convert $56,000/year over 5 years = $280,000 total
- Federal tax cost: $56,000 × 32% = $17,920/year = **$89,600 total**
- State tax cost: $56,000 × 5% = $2,800/year = **$14,000 total**
- **Total cost: $103,600**

**Scenario B: Convert during gap years (age 63-67) at 22-24%**
- Pension income estimated at ~$50,000-60,000/year
- Remaining 22% bracket space: ~$130,000 (MFJ 2026 estimates)
- Could convert ~$70,000/year at 22-24% over 4 years = $280,000 total
- Federal tax cost: ~$70,000 × 23% avg = $16,100/year = **$64,400 total**
- State tax cost: $70,000 × 5% = $3,500/year = **$14,000 total**
- **Total cost: $78,400**

### Recommendation

**Wait for Scenario B.** The 4-year gap window saves approximately **$25,200 in federal taxes** compared to converting now. The pension keeps their gap-year income moderate but not high enough to push them above 24%.

Additional considerations:
- Converting now increases current-year AGI, potentially affecting Medicare Part B premiums (IRMAA) when C-1001 hits 63
- The BND position ($43,200) has a slight loss — consider selling rather than converting in-kind
- If market drops significantly before age 63, accelerating some conversion could be advantageous (converting depressed assets means lower tax on same number of shares)`,
  },
  {
    role: "user",
    content: "What about Margaret Holloway's concentrated position? Best approach?",
  },
  {
    role: "assistant",
    content: `## Concentration Risk — C-1003 (Margaret Holloway)

*Note: I'm referencing this client as C-1003 per the book data.*

### The Problem

C-1003's portfolio has a severe single-sector concentration in mega-cap tech:

| Holding | Shares | Cost Basis | Current Value | Unrealized Gain | Weight |
|---------|--------|-----------|---------------|-----------------|--------|
| NVDA | 1,500 | $22,500 | $207,000 | $184,500 | ~28% |
| AAPL | 600 | $27,000 | $115,200 | $88,200 | ~16% |
| MSFT | 400 | $34,000 | $166,000 | $132,000 | ~22% |
| **Total Top 3** | | **$83,500** | **$488,200** | **$404,700** | **~66%** |

The cost basis is extremely low — meaning selling triggers massive capital gains. At a 37% federal + 9.3% CA state rate, selling the full NVDA position would cost roughly **$85,700 in taxes** on $184,500 of gains.

### The Emotional Factor

The notes indicate these holdings were inherited from a deceased spouse. This is critical context — the emotional attachment isn't about conviction in the stocks, it's about grief. A heavy-handed "sell everything" approach will backfire. The strategy needs to respect the emotional weight while protecting the portfolio.

### Phased Approach

**Phase 1 — Reframe (Month 1-2)**
Position the conversation around "honoring the legacy by protecting it." The spouse built this wealth — the best way to honor it is ensuring it endures.

**Phase 2 — Trim the Edges (Month 3-6)**
- Start with AMZN ($19,800 value, $9,500 basis, ~$10,300 gain) — the least emotionally significant position
- Harvest any available losses from other positions or use C-1004's $177,000 in losses if accounts allow (different clients, but demonstrates the strategy)
- Sell 200 shares of AAPL ($38,400 value, $9,000 basis) — partial reduction, not elimination
- Redirect proceeds into a diversified ETF like VTI or VXUS

**Phase 3 — Structured Diversification (Month 6-18)**
- **Exchange fund:** If C-1003 qualifies (typically $500k+ in a single low-basis position), an exchange fund allows contributing NVDA shares into a diversified partnership, deferring capital gains
- **Charitable giving:** If C-1003 has charitable intent, donating appreciated NVDA shares avoids capital gains entirely while providing a deduction at the 37% bracket — each $100 donated saves $37 in tax plus avoids ~$23 in capital gains tax
- **Collar strategy:** Buy protective puts and sell covered calls on NVDA to lock in a price range while deferring the tax event

**Phase 4 — Ongoing Monitoring (Quarterly)**
- Target reducing the top-3 tech concentration from 66% to under 30% over 18-24 months
- Each quarter, evaluate whether market conditions favor accelerating or pausing the diversification
- Track the total tax cost of each tranche and compare against the risk reduction benefit

### Tax Impact Estimate

Assuming we diversify $250,000 of the $488,200 concentration over 18 months:
- Average cost basis: ~17% of value (very low basis)
- Taxable gain: ~$207,500
- Federal + state tax (46.3% combined): **~$96,000**
- Net proceeds reinvested: ~$154,000

This is painful, but a 40%+ drawdown in tech (which has happened twice in 25 years) would cost C-1003 **~$195,000** — more than the tax cost, and without the benefit of diversification.`,
  },
];
