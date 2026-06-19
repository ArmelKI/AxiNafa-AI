"use client";

// Graphique radar des 3 facteurs du pré-score (régularité, ancienneté, volume).
// Purement visuel : il lit les notes déjà calculées par lib/score, sans changer
// aucune logique métier.

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { ConfidenceScore } from "@/lib/score";

export function ConfidenceRadar({ score }: { score: ConfidenceScore }) {
  // Libellés courts pour tenir sur mobile.
  const shortLabel: Record<string, string> = {
    regularite: "Régularité",
    anciennete: "Ancienneté",
    volume: "Volume",
  };

  const data = score.factors.map((f) => ({
    facteur: shortLabel[f.key] ?? f.label,
    note: Math.round(f.note),
  }));

  return (
    <div className="h-44 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="#e5eae9" />
          <PolarAngleAxis
            dataKey="facteur"
            tick={{ fontSize: 11, fill: "#5b6b68" }}
          />
          <PolarRadiusAxis
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          <Radar
            name="Note"
            dataKey="note"
            stroke="#1B5E5A"
            fill="#1B5E5A"
            fillOpacity={0.35}
            strokeWidth={2}
            isAnimationActive
            animationDuration={900}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
