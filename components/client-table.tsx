"use client";

import { useState, useMemo } from "react";
import type {
  BookData,
  FAClientRecord,
  FAHolding,
  AcctClientRecord,
} from "@/lib/types";

interface ClientTableProps {
  book: BookData;
  onClientClick: (clientId: string) => void;
  activeFilter?: string | null;
}

type SortKey = string;
type SortDir = "asc" | "desc";

export default function ClientTable({
  book,
  onClientClick,
  activeFilter,
}: ClientTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("client_id");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  if (book.mode === "financial_advisor") {
    return (
      <FATable
        clients={book.clients as FAClientRecord[]}
        holdings={(book.holdings || []) as FAHolding[]}
        search={search}
        setSearch={setSearch}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={handleSort}
        onClientClick={onClientClick}
        activeFilter={activeFilter}
      />
    );
  }

  return (
    <AcctTable
      clients={book.clients as AcctClientRecord[]}
      search={search}
      setSearch={setSearch}
      sortKey={sortKey}
      sortDir={sortDir}
      onSort={handleSort}
      onClientClick={onClientClick}
      activeFilter={activeFilter}
    />
  );
}

interface FATableProps {
  clients: FAClientRecord[];
  holdings: FAHolding[];
  search: string;
  setSearch: (s: string) => void;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  onClientClick: (id: string) => void;
  activeFilter?: string | null;
}

function FATable({
  clients,
  holdings,
  search,
  setSearch,
  sortKey,
  sortDir,
  onSort,
  onClientClick,
  activeFilter,
}: FATableProps) {
  const clientAUM = useMemo(() => {
    const map: Record<string, number> = {};
    for (const h of holdings) {
      map[h.client_id] = (map[h.client_id] || 0) + h.shares * h.current_price;
    }
    return map;
  }, [holdings]);

  const filtered = useMemo(() => {
    let list = clients.filter(
      (c) =>
        c.client_id.toLowerCase().includes(search.toLowerCase()) ||
        c.risk_tolerance.toLowerCase().includes(search.toLowerCase())
    );

    if (activeFilter === "concentration") {
      const holdingsByClient: Record<string, FAHolding[]> = {};
      for (const h of holdings) {
        if (!holdingsByClient[h.client_id]) holdingsByClient[h.client_id] = [];
        holdingsByClient[h.client_id].push(h);
      }
      list = list.filter((c) => {
        const ch = holdingsByClient[c.client_id] || [];
        const total = ch.reduce(
          (s, h) => s + h.shares * h.current_price,
          0
        );
        return ch.some(
          (h) => total > 0 && (h.shares * h.current_price) / total > 0.3
        );
      });
    } else if (activeFilter === "harvesting") {
      list = list.filter((c) =>
        holdings.some(
          (h) =>
            h.client_id === c.client_id &&
            h.shares * h.current_price - h.shares * h.cost_basis < -1000
        )
      );
    } else if (activeFilter === "roth") {
      list = list.filter(
        (c) =>
          c.federal_tax_bracket >= 0.32 &&
          holdings.some(
            (h) =>
              h.client_id === c.client_id &&
              h.account_type === "Traditional IRA"
          )
      );
    } else if (activeFilter === "retirement") {
      list = list.filter((c) => c.age >= 58);
    }

    list.sort((a, b) => {
      let av: number | string, bv: number | string;
      if (sortKey === "aum") {
        av = clientAUM[a.client_id] || 0;
        bv = clientAUM[b.client_id] || 0;
      } else {
        av = (a as Record<string, any>)[sortKey] ?? "";
        bv = (b as Record<string, any>)[sortKey] ?? "";
      }
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });

    return list;
  }, [clients, holdings, search, sortKey, sortDir, clientAUM, activeFilter]);

  const riskColor: Record<string, string> = {
    Conservative: "bg-blue-500/20 text-blue-400",
    Moderate: "bg-emerald-500/20 text-emerald-400",
    "Moderate Aggressive": "bg-amber-500/20 text-amber-400",
    Aggressive: "bg-red-500/20 text-red-400",
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-text-muted">
          Clients
        </h3>
        <span className="text-xs text-text-muted font-mono">
          {filtered.length}/{clients.length}
        </span>
      </div>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by ID or risk..."
        className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
      />
      <div className="overflow-auto max-h-[400px] rounded-lg border border-border">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-surface-hover z-10">
            <tr>
              {[
                { key: "client_id", label: "ID" },
                { key: "age", label: "Age" },
                { key: "risk_tolerance", label: "Risk" },
                { key: "aum", label: "AUM" },
              ].map((col) => (
                <th
                  key={col.key}
                  onClick={() => onSort(col.key)}
                  className="px-2 py-2 text-left text-text-muted font-medium cursor-pointer hover:text-text transition-colors"
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span className="ml-1">
                      {sortDir === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr
                key={c.client_id}
                onClick={() => onClientClick(c.client_id)}
                className="border-t border-border hover:bg-surface-hover cursor-pointer transition-colors"
              >
                <td className="px-2 py-2 font-mono text-accent">
                  {c.client_id}
                </td>
                <td className="px-2 py-2 text-text-secondary">{c.age}</td>
                <td className="px-2 py-2">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${riskColor[c.risk_tolerance] || ""}`}
                  >
                    {c.risk_tolerance.replace("Moderate Aggressive", "Mod Agg")}
                  </span>
                </td>
                <td className="px-2 py-2 font-mono text-text-secondary">
                  {formatCompact(clientAUM[c.client_id] || 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface AcctTableProps {
  clients: AcctClientRecord[];
  search: string;
  setSearch: (s: string) => void;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  onClientClick: (id: string) => void;
  activeFilter?: string | null;
}

function AcctTable({
  clients,
  search,
  setSearch,
  sortKey,
  sortDir,
  onSort,
  onClientClick,
  activeFilter,
}: AcctTableProps) {
  const filtered = useMemo(() => {
    let list = clients.filter(
      (c) =>
        c.client_id.toLowerCase().includes(search.toLowerCase()) ||
        c.state_of_residence.toLowerCase().includes(search.toLowerCase())
    );

    if (activeFilter === "amt") {
      list = list.filter(
        (c) =>
          (c.amt_preference_items && c.amt_preference_items > 0) ||
          (c.iso_exercise_spread && c.iso_exercise_spread > 0)
      );
    } else if (activeFilter === "salt") {
      list = list.filter((c) => c.salt_paid > 10000);
    } else if (activeFilter === "bunching") {
      list = list.filter((c) => {
        const itemized =
          c.mortgage_interest +
          Math.min(c.salt_paid, 10000) +
          c.charitable_cash +
          c.charitable_noncash +
          c.medical_expenses;
        const std =
          c.filing_status === "MFJ" || c.filing_status === "QSS"
            ? 30000
            : 15000;
        return Math.abs(itemized - std) < 8000;
      });
    } else if (activeFilter === "underpayment") {
      list = list.filter((c) => {
        const agi =
          c.w2_income +
          c.self_employment_income +
          c.business_income_loss +
          c.capital_gains_short +
          c.capital_gains_long +
          c.interest_income +
          c.dividend_income_qualified +
          c.dividend_income_ordinary +
          c.other_income;
        const totalPaid =
          c.estimated_tax_payments + c.withholding + c.prior_year_overpayment;
        return agi > 200000 && totalPaid < agi * 0.2;
      });
    }

    list.sort((a, b) => {
      const av = (a as Record<string, any>)[sortKey] ?? "";
      const bv = (b as Record<string, any>)[sortKey] ?? "";
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });

    return list;
  }, [clients, search, sortKey, sortDir, activeFilter]);

  const filingColor: Record<string, string> = {
    Single: "bg-purple-500/20 text-purple-400",
    MFJ: "bg-emerald-500/20 text-emerald-400",
    MFS: "bg-amber-500/20 text-amber-400",
    HoH: "bg-blue-500/20 text-blue-400",
    QSS: "bg-cyan-500/20 text-cyan-400",
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-text-muted">
          Clients
        </h3>
        <span className="text-xs text-text-muted font-mono">
          {filtered.length}/{clients.length}
        </span>
      </div>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by ID or state..."
        className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
      />
      <div className="overflow-auto max-h-[400px] rounded-lg border border-border">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-surface-hover z-10">
            <tr>
              {[
                { key: "client_id", label: "ID" },
                { key: "filing_status", label: "Filing" },
                { key: "state_of_residence", label: "State" },
                { key: "w2_income", label: "W-2" },
              ].map((col) => (
                <th
                  key={col.key}
                  onClick={() => onSort(col.key)}
                  className="px-2 py-2 text-left text-text-muted font-medium cursor-pointer hover:text-text transition-colors"
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span className="ml-1">
                      {sortDir === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr
                key={c.client_id}
                onClick={() => onClientClick(c.client_id)}
                className="border-t border-border hover:bg-surface-hover cursor-pointer transition-colors"
              >
                <td className="px-2 py-2 font-mono text-accent">
                  {c.client_id}
                </td>
                <td className="px-2 py-2">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${filingColor[c.filing_status] || ""}`}
                  >
                    {c.filing_status}
                  </span>
                </td>
                <td className="px-2 py-2 font-mono text-text-secondary">
                  {c.state_of_residence}
                </td>
                <td className="px-2 py-2 font-mono text-text-secondary">
                  {formatCompact(c.w2_income)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return "$" + (n / 1_000).toFixed(0) + "K";
  return "$" + n.toString();
}
