"use client";

// Graphique des 30 derniers jours (ventes vs dépenses) avec recharts.

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Metrics } from "@/lib/summary";
import { formatDayShort, formatFCFA } from "@/lib/format";

export function SalesChart({ jours }: { jours: Metrics["jours"] }) {
  const data = jours.map((j) => ({
    date: formatDayShort(j.date),
    Ventes: j.ventes,
    Dépenses: j.depenses,
  }));

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 6, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="gVentes" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1B5E5A" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#1B5E5A" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gDep" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#E2A03F" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#E2A03F" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef1f1" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#94a3a0" }}
            interval={Math.ceil(data.length / 6)}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#94a3a0" }}
            tickFormatter={(v) => `${Math.round(v / 1000)}k`}
            tickLine={false}
            axisLine={false}
            width={42}
          />
          <Tooltip
            formatter={(value: number) => formatFCFA(value)}
            labelStyle={{ color: "#1B5E5A", fontWeight: 600 }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #e5eae9",
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="Ventes"
            stroke="#1B5E5A"
            strokeWidth={2}
            fill="url(#gVentes)"
          />
          <Area
            type="monotone"
            dataKey="Dépenses"
            stroke="#E2A03F"
            strokeWidth={2}
            fill="url(#gDep)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
