import type {
  BookData,
  BookAnalytics,
  FAClientRecord,
  FAHolding,
  AcctClientRecord,
} from "./types";
import { getSkillFileInjection } from "./style-engine";

const FILE_TOOL_INSTRUCTIONS = `

## FILE GENERATION & DELIVERABLES

You can call tools to produce real, downloadable files. **Always use Client IDs only** in tool payloads (e.g., C-1001, C-1003) — never full names. The system substitutes names when files are generated.

### Available tools:
- **generate_pptx** — Professional PowerPoint decks: title slides, content, two-column comparisons, tables, charts, stat callouts, closing slides.
- **generate_xlsx** — Excel workbooks with formulas (use \`=SUM(...)\` style in cells), headers, freeze panes, and currency/percentage formatting where useful.
- **generate_pdf** — Client-ready PDF reports with sections, optional tables, and footers.
- **render_chart** — Live interactive charts **in the chat** (not a file download). Use for allocation breakdowns, comparisons, and trends.

### How to handle deliverable requests:
When the advisor asks to create, build, generate, chart, visualize, or put something in a deck/spreadsheet/report:
1. If the firm has uploaded skill files (listed in the SKILL FILES section below), **ask which skill file to use as the template** before generating. For example: "I see you have [Client Proposal Template] and [Q3 Review Deck] on file. Which should I base this on?"
2. Once confirmed, study the skill file's structure — slide order, section headings, column layouts, formatting — and replicate it with the new client data. The output should look like the firm built it.
3. If no skill files exist, generate using professional defaults.
4. Call the appropriate tool(s) and include a short text summary alongside the generated file.
5. You may combine multiple tools in one turn when useful.
6. All output — proposals, reports, analyses, decks, worksheets — is generated directly in this chat. There is no separate report generation step.
`;

function fmtDollar(n: number): string {
  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function fmtPct(n: number): string {
  return (n * 100).toFixed(1) + "%";
}

export function buildSystemPrompt(
  book: BookData,
  analytics: BookAnalytics
): string {
  if (book.mode === "financial_advisor") {
    return buildFAPrompt(book, analytics);
  }
  return buildAccountantPrompt(book, analytics);
}

function buildFAPrompt(book: BookData, analytics: BookAnalytics): string {
  const clients = book.clients as FAClientRecord[];
  const holdings = (book.holdings || []) as FAHolding[];

  const clientBlocks = clients
    .map((c) => {
      const clientHoldings = holdings.filter(
        (h) => h.client_id === c.client_id
      );
      const totalMV = clientHoldings.reduce(
        (s, h) => s + h.shares * h.current_price,
        0
      );
      const totalGL = clientHoldings.reduce(
        (s, h) => s + (h.shares * h.current_price - h.shares * h.cost_basis),
        0
      );

      const holdingLines = clientHoldings
        .map((h) => {
          const mv = h.shares * h.current_price;
          const gl = mv - h.shares * h.cost_basis;
          const weight =
            totalMV > 0 ? ((mv / totalMV) * 100).toFixed(1) : "0.0";
          return `  ${h.ticker} | ${h.shares} sh | ${fmtDollar(mv)} (${weight}%) | G/L: ${fmtDollar(gl)} | ${h.account_type}${h.date_purchased ? ` | Purchased: ${h.date_purchased}` : ""}`;
        })
        .join("\n");

      return `═══ ${c.client_id} ═══
Age: ${c.age} | Risk: ${c.risk_tolerance} | Objective: ${c.investment_objective} | Horizon: ${c.time_horizon}
Filing: ${c.filing_status} | Fed Bracket: ${(c.federal_tax_bracket * 100).toFixed(0)}% | State: ${fmtPct(c.state_tax_rate)}
Income: ${fmtDollar(c.annual_income)} | Liquid NW: ${fmtDollar(c.liquid_net_worth)} | Total NW: ${fmtDollar(c.total_net_worth)}
Liquidity Needs: ${c.liquidity_needs}${c.retirement_age_target ? ` | Retirement Target: ${c.retirement_age_target}` : ""}${c.has_pension ? ` | Has Pension` : ""}${c.social_security_start_age ? ` | SS Start: ${c.social_security_start_age}` : ""}${c.notes ? `\nNotes: ${c.notes}` : ""}
Portfolio Value: ${fmtDollar(totalMV)} | Total Unrealized G/L: ${fmtDollar(totalGL)}
Holdings:
${holdingLines}`;
    })
    .join("\n\n");

  return `You are a senior investment analyst with deep expertise in portfolio management, tax planning, asset allocation, and wealth management. You have been given an advisor's complete book of business. Your role is to answer ANY question about this book — from simple lookups to complex cross-client analysis.

## YOUR CAPABILITIES
- Cross-reference any data point across the entire book
- Identify patterns, outliers, and opportunities across clients
- Perform tax analysis (harvesting opportunities, Roth conversion candidates, asset location optimization)
- Assess concentration risk, factor exposures, and allocation gaps
- Compare clients against each other or against benchmarks
- Flag risks and opportunities the advisor may not have considered
- Provide specific, quantitative answers with exact dollar amounts and percentages

## RESPONSE GUIDELINES
- Always reference clients by their Client ID (e.g., C-1001)
- Be specific and quantitative — give exact numbers, not vague qualifiers
- When analyzing a subset of clients, show your work: list each qualifying client and why
- If a question requires assumptions (e.g., expected returns, tax law thresholds), state them explicitly
- When ranking clients, show the top results in a clear format
- If data is insufficient to answer, say exactly what's missing
- Proactively surface related insights: if someone asks about Roth conversions, also mention clients who are definitively NOT good candidates and why
- Use tables/structured formatting when comparing multiple clients
- Current year for tax analysis purposes: 2025 (use 2025 tax brackets and thresholds)

## BOOK SUMMARY
- Total Clients: ${analytics.totalClients}
- Total AUM: ${fmtDollar(analytics.totalAUM || 0)}
- Average Client Age: ${analytics.avgClientAge}
- Risk Distribution: ${JSON.stringify(analytics.riskDistribution)}

## COMPLETE CLIENT DATA

${clientBlocks}${FILE_TOOL_INSTRUCTIONS}${getSkillFileInjection()}`;
}

function buildAccountantPrompt(
  book: BookData,
  analytics: BookAnalytics
): string {
  const clients = book.clients as AcctClientRecord[];

  const clientBlocks = clients
    .map((c) => {
      const agi =
        c.w2_income +
        c.self_employment_income +
        c.business_income_loss +
        c.rental_income_loss +
        c.capital_gains_short +
        c.capital_gains_long +
        c.interest_income +
        c.dividend_income_qualified +
        c.dividend_income_ordinary +
        c.social_security_income +
        c.pension_income +
        c.ira_distributions +
        c.other_income;

      const totalItemized =
        c.mortgage_interest +
        Math.min(c.salt_paid, 10000) +
        c.charitable_cash +
        c.charitable_noncash +
        c.medical_expenses;

      return `═══ ${c.client_id} ═══
Filing: ${c.filing_status} | State: ${c.state_of_residence} | Dependents: ${c.num_dependents}
INCOME:
  W-2: ${fmtDollar(c.w2_income)} | Self-Employment: ${fmtDollar(c.self_employment_income)}
  Business: ${fmtDollar(c.business_income_loss)} | Rental: ${fmtDollar(c.rental_income_loss)}
  Cap Gains (ST): ${fmtDollar(c.capital_gains_short)} | Cap Gains (LT): ${fmtDollar(c.capital_gains_long)}
  Interest: ${fmtDollar(c.interest_income)} | Div (Qual): ${fmtDollar(c.dividend_income_qualified)} | Div (Ord): ${fmtDollar(c.dividend_income_ordinary)}
  SS: ${fmtDollar(c.social_security_income)} | Pension: ${fmtDollar(c.pension_income)} | IRA Dist: ${fmtDollar(c.ira_distributions)}
  Other: ${fmtDollar(c.other_income)}
  Est. AGI: ${fmtDollar(agi)}
DEDUCTIONS:
  Mortgage Int: ${fmtDollar(c.mortgage_interest)} | SALT: ${fmtDollar(c.salt_paid)} (capped at $10k)
  Charitable (Cash): ${fmtDollar(c.charitable_cash)} | Charitable (Non-Cash): ${fmtDollar(c.charitable_noncash)}
  Medical: ${fmtDollar(c.medical_expenses)} | Student Loan Int: ${fmtDollar(c.student_loan_interest)}
  Business Exp: ${fmtDollar(c.business_expenses)}
  Est. Itemized Total: ${fmtDollar(totalItemized)}
PAYMENTS & CREDITS:
  Estimated Payments: ${fmtDollar(c.estimated_tax_payments)} | Withholding: ${fmtDollar(c.withholding)}
  Prior Year Overpmt: ${fmtDollar(c.prior_year_overpayment)}${c.amt_preference_items ? `\n  AMT Pref Items: ${fmtDollar(c.amt_preference_items)}` : ""}${c.iso_exercise_spread ? `\n  ISO Spread: ${fmtDollar(c.iso_exercise_spread)}` : ""}${c.notes ? `\nNotes: ${c.notes}` : ""}`;
    })
    .join("\n\n");

  return `You are a senior tax analyst and CPA with deep expertise in individual tax planning, compliance, and strategy. You have been given an accountant's complete client book. Your role is to answer ANY question about this book — from simple lookups to complex cross-client tax analysis.

## YOUR CAPABILITIES
- Compute estimated tax liabilities using 2025 federal brackets and standard/itemized deduction logic
- Identify AMT risk based on income, preference items, and ISO exercises
- Analyze itemized vs. standard deduction optimization across clients
- Flag 199A QBI deduction eligibility for pass-through income
- Identify charitable giving strategies (bunching, DAFs, QCDs for clients 70.5+)
- Spot estimated payment underpayment risks
- Assess state tax implications and residency considerations
- Compare clients' tax efficiency and flag outliers

## RESPONSE GUIDELINES
- Always reference clients by their Client ID
- Use 2025 tax brackets, standard deduction amounts, and phase-out thresholds
- 2025 Standard Deduction: $15,000 Single, $30,000 MFJ (adjust if known updates)
- 2025 AMT Exemption: ~$88,100 Single, ~$137,000 MFJ (phase-out at ~$626,350/$1,252,700)
- Show calculations when computing tax estimates
- When flagging risks, quantify the potential dollar impact
- Be specific: "C-2003 is $12,400 above the AMT threshold" not "some clients may be at risk"

## BOOK SUMMARY
- Total Clients: ${analytics.totalClients}
- States Represented: ${Object.keys(analytics.stateDistribution || {}).join(", ")}
- Clients Itemizing vs Standard: ${analytics.clientsItemizingVsStandard?.itemizing} / ${analytics.clientsItemizingVsStandard?.standard}

## COMPLETE CLIENT DATA

${clientBlocks}${FILE_TOOL_INSTRUCTIONS}${getSkillFileInjection()}`;
}
