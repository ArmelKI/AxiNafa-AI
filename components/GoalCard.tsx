// Carte "Objectif de financement" — relie l'activité au projet concret du
// commerçant (ex. acheter un congélateur) et au montant conseillé par le score.
// C'est le pont narratif : activité → preuve → financement → croissance.

import { FinancingGoal } from "@/lib/types";
import { formatFCFA } from "@/lib/format";

export function GoalCard({
  goal,
  financementConseille,
}: {
  goal: FinancingGoal;
  financementConseille: number;
}) {
  const couverture = Math.min(
    100,
    Math.round((financementConseille / goal.amount) * 100)
  );
  const atteignable = financementConseille >= goal.amount;

  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
      <div className="flex items-center gap-3 border-b border-gray-100 p-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-2xl">
          {goal.emoji ?? "🎯"}
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
            Mon objectif
          </p>
          <p className="truncate text-sm font-bold text-gray-800">{goal.label}</p>
          <p className="text-xs text-gray-500">Estimé à {formatFCFA(goal.amount)}</p>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Financement conseillé par AxiNafa</span>
          <span className="font-bold text-brand">
            {formatFCFA(financementConseille)}
          </span>
        </div>
        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand to-brand-400 transition-all duration-700"
            style={{ width: `${couverture}%` }}
          />
        </div>
        <p className="mt-2 text-[12px] leading-snug text-gray-600">
          {atteignable ? (
            <>
              👍 Votre activité couvre <strong>tout votre objectif</strong>. Votre
              dossier AxiNafa est prêt à être présenté à une microfinance.
            </>
          ) : (
            <>
              Votre activité justifie déjà <strong>{couverture}%</strong> de votre
              objectif. Continuez à enregistrer vos ventes pour renforcer votre
              dossier.
            </>
          )}
        </p>
      </div>
    </section>
  );
}
