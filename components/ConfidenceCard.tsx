// Carte du pré-score de confiance EXPLICABLE + facteurs détaillés.

import { ConfidenceScore } from "@/lib/score";
import { ConfidenceRadar } from "./ConfidenceRadar";

export function ConfidenceCard({ score }: { score: ConfidenceScore }) {
  const pct = Math.max(0, Math.min(100, score.total));
  // Demi-cercle de jauge : on calcule l'offset du tracé.
  const radius = 52;
  const circumference = Math.PI * radius; // demi-cercle
  const offset = circumference * (1 - pct / 100);

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">
          Pré-score de confiance
        </h3>
        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand">
          {score.niveau}
        </span>
      </div>

      {/* Jauge demi-cercle */}
      <div className="relative mx-auto mt-2 h-[72px] w-[140px]">
        <svg viewBox="0 0 120 64" className="h-full w-full">
          <path
            d="M 8 60 A 52 52 0 0 1 112 60"
            fill="none"
            stroke="#eef1f1"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M 8 60 A 52 52 0 0 1 112 60"
            fill="none"
            stroke="#1B5E5A"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <span className="text-2xl font-extrabold text-brand">{pct}</span>
          <span className="text-[10px] text-gray-400">sur 100</span>
        </div>
      </div>

      {/* Vue radar des 3 facteurs (en complément du score numérique) */}
      <div className="mt-2 border-t border-gray-100 pt-2">
        <p className="mb-1 text-center text-[11px] font-medium text-gray-500">
          Profil de confiance (3 facteurs)
        </p>
        <ConfidenceRadar score={score} />
      </div>

      {/* Facteurs explicables */}
      <div className="mt-3 space-y-3">
        {score.factors.map((f) => (
          <div key={f.key}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-gray-700">{f.label}</span>
              <span className="text-gray-500">
                {Math.round(f.note)}/100 · poids {Math.round(f.poids * 100)}%
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-brand transition-all"
                style={{ width: `${f.note}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] leading-snug text-gray-400">
              {f.detail}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-snug text-amber-800">
        ⚠️ Score <strong>indicatif</strong> : il ne remplace pas la décision
        d&apos;une institution financière.
      </p>
    </div>
  );
}
