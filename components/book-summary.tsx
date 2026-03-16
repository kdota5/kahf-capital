"use client";

import type { BookAnalytics } from "@/lib/types";

interface BookSummaryProps {
  analytics: BookAnalytics;
}

function fmtDollar(n: number): string {
  if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return "$" + (n / 1_000).toFixed(0) + "K";
  return "$" + n.toLocaleString();
}

export default function BookSummary({ analytics }: BookSummaryProps) {
  if (analytics.mode === "financial_advisor") {
    return <FASummary analytics={analytics} />;
  }
  return <AcctSummary analytics={analytics} />;
}

function FASummary({ analytics }: { analytics: BookAnalytics }) {
  const concentrationCount =
    analytics.clientsWithLargeConcentrations?.length || 0;
  const harvestCount = analytics.clientsWithHarvestableLosses?.length || 0;

  return (
    <div className="space-y-4">
      <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-text-muted">
        Book Overview
      </h3>

      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Clients" value={String(analytics.totalClients)} />
        <StatCard label="Total AUM" value={fmtDollar(analytics.totalAUM || 0)} />
        <StatCard label="Avg Age" value={String(analytics.avgClientAge || 0)} />
        <StatCard
          label="Top Holding"
          value={analytics.topHoldings?.[0]?.ticker || "—"}
        />
      </div>

      {analytics.riskDistribution && (
        <div className="bg-surface rounded-lg p-3 space-y-2">
          <p className="text-xs text-text-muted font-medium uppercase tracking-wider">
            Risk Distribution
          </p>
          {Object.entries(analytics.riskDistribution).map(([risk, count]) => (
            <div key={risk} className="flex items-center gap-2">
              <span className="text-xs text-text-secondary flex-1 truncate">
                {risk}
              </span>
              <div className="flex-1 h-1.5 bg-bg rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full"
                  style={{
                    width: `${(count / analytics.totalClients) * 100}%`,
                  }}
                />
              </div>
              <span className="text-xs font-mono text-text-muted w-4 text-right">
                {count}
              </span>
            </div>
          ))}
        </div>
      )}

      {(concentrationCount > 0 || harvestCount > 0) && (
        <div className="space-y-2">
          <p className="text-xs text-text-muted font-medium uppercase tracking-wider">
            Flags
          </p>
          {concentrationCount > 0 && (
            <FlagBadge
              color="warning"
              text={`${concentrationCount} position${concentrationCount > 1 ? "s" : ""} with >30% concentration`}
            />
          )}
          {harvestCount > 0 && (
            <FlagBadge
              color="accent"
              text={`${harvestCount} tax-loss harvesting opportunities`}
            />
          )}
        </div>
      )}
    </div>
  );
}

function AcctSummary({ analytics }: { analytics: BookAnalytics }) {
  const amtCount = analytics.clientsAboveAMTThreshold?.length || 0;

  return (
    <div className="space-y-4">
      <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-text-muted">
        Book Overview
      </h3>

      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Clients" value={String(analytics.totalClients)} />
        <StatCard label="Avg AGI" value={fmtDollar(analytics.avgAGI || 0)} />
        <StatCard
          label="Itemizing"
          value={String(analytics.clientsItemizingVsStandard?.itemizing || 0)}
        />
        <StatCard
          label="Standard"
          value={String(analytics.clientsItemizingVsStandard?.standard || 0)}
        />
      </div>

      {analytics.stateDistribution && (
        <div className="bg-surface rounded-lg p-3 space-y-2">
          <p className="text-xs text-text-muted font-medium uppercase tracking-wider">
            State Distribution
          </p>
          {Object.entries(analytics.stateDistribution).map(
            ([state, count]) => (
              <div key={state} className="flex items-center gap-2">
                <span className="text-xs font-mono text-text-secondary w-6">
                  {state}
                </span>
                <div className="flex-1 h-1.5 bg-bg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full"
                    style={{
                      width: `${(count / analytics.totalClients) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-xs font-mono text-text-muted w-4 text-right">
                  {count}
                </span>
              </div>
            )
          )}
        </div>
      )}

      {amtCount > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-text-muted font-medium uppercase tracking-wider">
            Flags
          </p>
          <FlagBadge
            color="warning"
            text={`${amtCount} client${amtCount > 1 ? "s" : ""} potentially AMT-exposed`}
          />
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface rounded-lg p-3">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="font-heading font-bold text-lg text-text">{value}</p>
    </div>
  );
}

function FlagBadge({ color, text }: { color: string; text: string }) {
  const colorMap: Record<string, string> = {
    warning: "bg-warning-dim text-warning border-warning/20",
    accent: "bg-accent-dim text-accent border-accent/20",
    danger: "bg-danger-dim text-danger border-danger/20",
  };
  return (
    <div
      className={`px-3 py-2 rounded-lg border text-xs font-medium ${colorMap[color] || colorMap.accent}`}
    >
      {text}
    </div>
  );
}
