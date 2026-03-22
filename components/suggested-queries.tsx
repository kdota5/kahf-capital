"use client";

import type { UserMode, ChatMessage } from "@/lib/types";

interface SuggestedQueriesProps {
  mode: UserMode;
  onSelect: (query: string) => void;
  compact?: boolean;
  suggestions?: string[];
}

const FA_OPENERS = [
  "Which clients are good Roth conversion candidates this year?",
  "Create a portfolio comparison deck for my top 3 clients by AUM",
  "Chart the allocation breakdown across my entire book",
  "Build a tax-loss harvesting worksheet for all clients with material losses",
];

const ACCT_OPENERS = [
  "Which clients are at risk for AMT this year?",
  "Build a tax liability estimate worksheet for all clients",
  "Chart the income distribution across my book",
  "Create a summary report of AMT-risk clients",
];

export function generateSuggestions(
  messages: ChatMessage[],
  mode: UserMode
): string[] {
  if (messages.length === 0) {
    return mode === "financial_advisor" ? FA_OPENERS : ACCT_OPENERS;
  }

  const assistantMsgs = messages.filter((m) => m.role === "assistant" && m.content.length > 0);
  const lastAssistant = assistantMsgs[assistantMsgs.length - 1];
  if (!lastAssistant) {
    return mode === "financial_advisor" ? FA_OPENERS : ACCT_OPENERS;
  }

  const content = lastAssistant.content.toLowerCase();
  const mentionedIds = Array.from(
    new Set((lastAssistant.content.match(/C-\d{3,5}/g) || []))
  );

  const suggestions: string[] = [];

  if (mentionedIds.length > 0) {
    suggestions.push(
      `Deep dive on ${mentionedIds[0]} — full portfolio breakdown`
    );
  }

  if (mentionedIds.length >= 2) {
    suggestions.push(
      `Compare ${mentionedIds[0]} and ${mentionedIds[1]} side by side`
    );
  }

  if (content.includes("roth") && !content.includes("harvesting")) {
    suggestions.push("Now show me tax-loss harvesting opportunities");
  }
  if (content.includes("concentration") && !content.includes("rebalance")) {
    suggestions.push(
      "Suggest a rebalancing plan for the concentrated positions"
    );
  }
  if (content.includes("tax") && !content.includes("estate")) {
    suggestions.push("Any estate planning considerations I should flag?");
  }
  if (content.includes("risk") && !content.includes("rebalance")) {
    suggestions.push(
      "Which clients need an allocation adjustment based on their risk profile?"
    );
  }
  if (content.includes("retire") && !content.includes("income")) {
    suggestions.push(
      "What does the income plan look like for the near-retirement clients?"
    );
  }

  if (suggestions.length < 4) {
    suggestions.push("What other risks or opportunities am I missing?");
  }

  return suggestions.slice(0, 4);
}

export default function SuggestedQueries({
  mode,
  onSelect,
  compact,
  suggestions: customSuggestions,
}: SuggestedQueriesProps) {
  const displayed = customSuggestions
    ? customSuggestions.slice(0, compact ? 3 : 4)
    : (mode === "financial_advisor" ? FA_OPENERS : ACCT_OPENERS).slice(
        0,
        compact ? 3 : 4
      );

  return (
    <div className="flex flex-wrap gap-2 animate-fade-in">
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
  );
}
