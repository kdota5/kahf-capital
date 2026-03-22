"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import type { ChatChartSpec } from "@/lib/types";

const PALETTE = [
  "#0EA5E9",
  "#10B981",
  "#0F172A",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#94A3B8",
];

export function InlineChart({ chartData }: { chartData: ChatChartSpec }) {
  const height = chartData.height || 340;

  const formatVal = (v: unknown) => {
    const n = typeof v === "number" ? v : Number(v);
    if (Number.isNaN(n)) return "";
    if (chartData.format === "currency") return `$${n.toLocaleString()}`;
    if (chartData.format === "percentage") return `${n.toFixed(1)}%`;
    return n.toLocaleString();
  };

  const rechartsData = chartData.data.labels.map((label, i) => {
    const pt: Record<string, string | number> = { name: label };
    chartData.data.datasets.forEach((ds) => {
      pt[ds.label] = ds.values[i] ?? 0;
    });
    return pt;
  });

  const type = chartData.chart_type;

  if (type === "pie" || type === "doughnut") {
    const pieData = chartData.data.labels.map((name, i) => ({
      name,
      value: chartData.data.datasets[0]?.values[i] ?? 0,
    }));
    return (
      <div className="rounded-xl border border-border bg-surface/80 p-4 my-3 max-w-2xl">
        <h4 className="text-sm font-heading font-semibold text-text mb-3 px-1">
          {chartData.title}
        </h4>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={type === "doughnut" ? 50 : 0}
              outerRadius={110}
              paddingAngle={2}
              label
            >
              {pieData.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip formatter={formatVal} />
            {chartData.show_legend !== false && <Legend />}
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === "line" || type === "area") {
    return (
      <div className="rounded-xl border border-border bg-surface/80 p-4 my-3 max-w-3xl">
        <h4 className="text-sm font-heading font-semibold text-text mb-3 px-1">
          {chartData.title}
        </h4>
        <ResponsiveContainer width="100%" height={height}>
          {type === "area" ? (
            <AreaChart data={rechartsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip formatter={formatVal} />
              {chartData.show_legend !== false && <Legend />}
              {chartData.data.datasets.map((ds, i) => (
                <Area
                  key={ds.label}
                  type="monotone"
                  dataKey={ds.label}
                  stroke={ds.color || PALETTE[i % PALETTE.length]}
                  fill={ds.color || PALETTE[i % PALETTE.length]}
                  fillOpacity={0.25}
                />
              ))}
            </AreaChart>
          ) : (
            <LineChart data={rechartsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip formatter={formatVal} />
              {chartData.show_legend !== false && <Legend />}
              {chartData.data.datasets.map((ds, i) => (
                <Line
                  key={ds.label}
                  type="monotone"
                  dataKey={ds.label}
                  stroke={ds.color || PALETTE[i % PALETTE.length]}
                  strokeWidth={2}
                  dot
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    );
  }

  const stacked = type === "stacked_bar";

  return (
    <div className="rounded-xl border border-border bg-surface/80 p-4 my-3 max-w-3xl">
      <h4 className="text-sm font-heading font-semibold text-text mb-3 px-1">
        {chartData.title}
      </h4>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={rechartsData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
          <Tooltip formatter={formatVal} />
          {chartData.show_legend !== false && <Legend />}
          {chartData.data.datasets.map((ds, i) => (
            <Bar
              key={ds.label}
              dataKey={ds.label}
              stackId={stacked ? "a" : undefined}
              fill={ds.color || PALETTE[i % PALETTE.length]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
