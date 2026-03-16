"use client";

import type { UserMode } from "@/lib/types";

interface SuggestedQueriesProps {
  mode: UserMode;
  onSelect: (query: string) => void;
  compact?: boolean;
}

const FA_SUGGESTIONS = [
  "Which clients are good Roth conversion candidates this year?",
  "Show me the top 5 clients by concentration risk",
  "Who has the most tax-loss harvesting opportunities?",
  "Which clients have the biggest mismatch between stated risk tolerance and actual portfolio?",
  "If rates drop 100bps, which clients benefit most from their fixed income positioning?",
  "Rank my top 10 clients by estimated annual tax drag",
  "Which clients are underweight international equities?",
  "Who is overweight mega-cap tech by more than 20%?",
];

const ACCT_SUGGESTIONS = [
  "Which clients are at risk for AMT this year?",
  "Who should itemize vs take the standard deduction?",
  "Flag clients who may be underpaying estimated taxes",
  "Which clients have 199A QBI deduction opportunities?",
  "Who would benefit from charitable donation bunching?",
  "Show me clients with the highest effective tax rates",
  "Flag any clients where state residency changes might affect filing requirements",
  "Which clients had capital gains that they might not be aware of?",
];

export default function SuggestedQueries({
  mode,
  onSelect,
  compact,
}: SuggestedQueriesProps) {
  const suggestions = mode === "financial_advisor" ? FA_SUGGESTIONS : ACCT_SUGGESTIONS;
  const displayed = compact ? suggestions.slice(0, 3) : suggestions;

  return (
    <div className={compact ? "flex flex-wrap gap-2" : "space-y-3"}>
      {!compact && (
        <p className="text-xs text-text-muted font-medium uppercase tracking-wider">
          Suggested Questions
        </p>
      )}
      <div className={compact ? "flex flex-wrap gap-2" : "grid grid-cols-1 sm:grid-cols-2 gap-2"}>
        {displayed.map((q) => (
          <button
            key={q}
            onClick={() => onSelect(q)}
            className="text-left px-3 py-2 text-xs sm:text-sm bg-surface border border-border rounded-lg hover:border-accent/40 hover:bg-accent-dim text-text-secondary hover:text-text transition-all"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
