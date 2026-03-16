import type {
  BookData,
  BookAnalytics,
  FAClientRecord,
  FAHolding,
  AcctClientRecord,
} from "./types";

export function computeAnalytics(book: BookData): BookAnalytics {
  if (book.mode === "financial_advisor") {
    return computeFAAnalytics(book);
  }
  return computeAcctAnalytics(book);
}

function computeFAAnalytics(book: BookData): BookAnalytics {
  const clients = book.clients as FAClientRecord[];
  const holdings = book.holdings || ([] as FAHolding[]);

  const totalAUM = holdings.reduce(
    (s, h) => s + h.shares * h.current_price,
    0
  );
  const avgAge =
    clients.length > 0
      ? Math.round(clients.reduce((s, c) => s + c.age, 0) / clients.length)
      : 0;

  const riskDist: Record<string, number> = {};
  for (const c of clients) {
    riskDist[c.risk_tolerance] = (riskDist[c.risk_tolerance] || 0) + 1;
  }

  const tickerAgg: Record<string, { totalMV: number; clients: Set<string> }> =
    {};
  for (const h of holdings) {
    const mv = h.shares * h.current_price;
    if (!tickerAgg[h.ticker]) {
      tickerAgg[h.ticker] = { totalMV: 0, clients: new Set() };
    }
    tickerAgg[h.ticker].totalMV += mv;
    tickerAgg[h.ticker].clients.add(h.client_id);
  }

  const topHoldings = Object.entries(tickerAgg)
    .map(([ticker, data]) => ({
      ticker,
      totalMV: data.totalMV,
      clientCount: data.clients.size,
    }))
    .sort((a, b) => b.totalMV - a.totalMV)
    .slice(0, 10);

  const acctBreakdown: Record<string, number> = {};
  for (const h of holdings) {
    const mv = h.shares * h.current_price;
    acctBreakdown[h.account_type] = (acctBreakdown[h.account_type] || 0) + mv;
  }

  const concentrations: BookAnalytics["clientsWithLargeConcentrations"] = [];
  const clientHoldingsMap: Record<string, FAHolding[]> = {};
  for (const h of holdings) {
    if (!clientHoldingsMap[h.client_id]) clientHoldingsMap[h.client_id] = [];
    clientHoldingsMap[h.client_id].push(h);
  }

  for (const [clientId, cHoldings] of Object.entries(clientHoldingsMap)) {
    const totalMV = cHoldings.reduce(
      (s, h) => s + h.shares * h.current_price,
      0
    );
    for (const h of cHoldings) {
      const mv = h.shares * h.current_price;
      const weight = totalMV > 0 ? mv / totalMV : 0;
      if (weight > 0.3) {
        concentrations.push({
          client_id: clientId,
          ticker: h.ticker,
          weight: Math.round(weight * 1000) / 10,
        });
      }
    }
  }

  const harvestableLosses: BookAnalytics["clientsWithHarvestableLosses"] = [];
  for (const h of holdings) {
    const mv = h.shares * h.current_price;
    const cost = h.shares * h.cost_basis;
    const gl = mv - cost;
    if (gl < -1000) {
      let holdingPeriod = "Unknown";
      if (h.date_purchased) {
        const purchaseDate = new Date(h.date_purchased);
        const now = new Date();
        const diffMs = now.getTime() - purchaseDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        holdingPeriod = diffDays > 365 ? "Long-term" : "Short-term";
      }
      harvestableLosses.push({
        client_id: h.client_id,
        ticker: h.ticker,
        unrealizedLoss: Math.round(gl),
        holdingPeriod,
      });
    }
  }

  return {
    mode: "financial_advisor",
    totalClients: clients.length,
    totalAUM: Math.round(totalAUM),
    avgClientAge: avgAge,
    riskDistribution: riskDist,
    topHoldings,
    accountTypeBreakdown: acctBreakdown,
    clientsWithLargeConcentrations: concentrations,
    clientsWithHarvestableLosses: harvestableLosses,
  };
}

function computeAcctAnalytics(book: BookData): BookAnalytics {
  const clients = book.clients as AcctClientRecord[];

  const agis = clients.map((c) => {
    return (
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
      c.other_income
    );
  });

  const avgAGI =
    agis.length > 0
      ? Math.round(agis.reduce((s, a) => s + a, 0) / agis.length)
      : 0;

  const stateDist: Record<string, number> = {};
  for (const c of clients) {
    stateDist[c.state_of_residence] =
      (stateDist[c.state_of_residence] || 0) + 1;
  }

  const amtThreshold = 88100;
  const amtClients: string[] = [];
  for (let i = 0; i < clients.length; i++) {
    const c = clients[i];
    const agi = agis[i];
    if (
      agi > 200000 &&
      ((c.amt_preference_items && c.amt_preference_items > 0) ||
        (c.iso_exercise_spread && c.iso_exercise_spread > 0) ||
        c.salt_paid > 10000)
    ) {
      amtClients.push(c.client_id);
    }
  }

  let itemizing = 0;
  let standard = 0;
  for (const c of clients) {
    const totalItemized =
      c.mortgage_interest +
      Math.min(c.salt_paid, 10000) +
      c.charitable_cash +
      c.charitable_noncash +
      c.medical_expenses;
    const stdDeduction =
      c.filing_status === "MFJ" || c.filing_status === "QSS" ? 30000 : 15000;
    if (totalItemized > stdDeduction) {
      itemizing++;
    } else {
      standard++;
    }
  }

  return {
    mode: "accountant",
    totalClients: clients.length,
    avgAGI: avgAGI,
    stateDistribution: stateDist,
    clientsAboveAMTThreshold: amtClients,
    clientsItemizingVsStandard: { itemizing, standard },
  };
}
