// Résumé "IA" en langage simple, généré par RÈGLES pour la démo.
// Même logique que la catégorisation : un point d'extension LLM est prévu.

import { Transaction } from "./types";
import { isWeekend, weekdayName, formatFCFA } from "./format";

export interface Metrics {
  totalVentes: number;
  totalDepenses: number;
  beneficeEstime: number;
  solde: number;
  ventesAujourdhui: number;
  depensesAujourdhui: number;
  jours: { date: string; ventes: number; depenses: number; benefice: number }[];
  joursForts: { jour: string; moyenne: number }[];
  nbJoursActifs: number;
  dettesEnCours: number;
}

/**
 * Agrège les transactions en métriques exploitables par le dashboard, le PDF,
 * le score et le résumé. Source de vérité unique des calculs financiers.
 */
export function computeMetrics(
  transactions: Transaction[],
  today: string
): Metrics {
  const byDay = new Map<string, { ventes: number; depenses: number }>();

  let totalVentes = 0;
  let totalDepenses = 0;
  let dettesEnCours = 0;

  for (const t of transactions) {
    if (!byDay.has(t.date)) byDay.set(t.date, { ventes: 0, depenses: 0 });
    const day = byDay.get(t.date)!;

    if (t.category === "dette_client") {
      dettesEnCours += t.amount;
      continue; // une dette n'est ni une vente encaissée ni une dépense
    }

    if (t.flow === "entree") {
      day.ventes += t.amount;
      totalVentes += t.amount;
    } else {
      day.depenses += t.amount;
      totalDepenses += t.amount;
    }
  }

  const jours = Array.from(byDay.entries())
    .map(([date, v]) => ({
      date,
      ventes: v.ventes,
      depenses: v.depenses,
      benefice: v.ventes - v.depenses,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Moyenne des ventes par jour de la semaine -> "jours forts"
  const byWeekday = new Map<string, { total: number; count: number }>();
  for (const j of jours) {
    const wd = weekdayName(j.date);
    if (!byWeekday.has(wd)) byWeekday.set(wd, { total: 0, count: 0 });
    const slot = byWeekday.get(wd)!;
    slot.total += j.ventes;
    slot.count += 1;
  }
  const joursForts = Array.from(byWeekday.entries())
    .map(([jour, v]) => ({ jour, moyenne: v.count ? v.total / v.count : 0 }))
    .sort((a, b) => b.moyenne - a.moyenne);

  const todayRow = byDay.get(today);

  return {
    totalVentes,
    totalDepenses,
    beneficeEstime: totalVentes - totalDepenses,
    solde: totalVentes - totalDepenses,
    ventesAujourdhui: todayRow?.ventes ?? 0,
    depensesAujourdhui: todayRow?.depenses ?? 0,
    jours,
    joursForts,
    nbJoursActifs: jours.filter((j) => j.ventes > 0 || j.depenses > 0).length,
    dettesEnCours,
  };
}

/**
 * Génère 2 à 4 phrases de synthèse en français simple à partir des métriques.
 * Règles déterministes — voir TODO LLM en bas pour la version générative.
 */
export function generateSummary(
  transactions: Transaction[],
  metrics: Metrics
): string[] {
  const phrases: string[] = [];

  // 1) Tendance week-end vs semaine
  const weekendDays = metrics.jours.filter((j) => isWeekend(j.date));
  const weekDays = metrics.jours.filter((j) => !isWeekend(j.date));
  const avgWeekend = weekendDays.length
    ? weekendDays.reduce((s, j) => s + j.ventes, 0) / weekendDays.length
    : 0;
  const avgWeek = weekDays.length
    ? weekDays.reduce((s, j) => s + j.ventes, 0) / weekDays.length
    : 0;

  if (avgWeekend > avgWeek * 1.15) {
    phrases.push(
      `Vos ventes montent le week-end : en moyenne ${formatFCFA(
        avgWeekend
      )} le samedi/dimanche contre ${formatFCFA(avgWeek)} en semaine.`
    );
  } else if (avgWeek > avgWeekend * 1.15) {
    phrases.push(
      `Vos ventes sont plus fortes en semaine (${formatFCFA(
        avgWeek
      )}/jour) que le week-end (${formatFCFA(avgWeekend)}/jour).`
    );
  } else {
    phrases.push(
      `Votre activité est régulière sur toute la semaine, autour de ${formatFCFA(
        avgWeek
      )} de ventes par jour.`
    );
  }

  // 2) Meilleur jour
  if (metrics.joursForts.length > 0 && metrics.joursForts[0].moyenne > 0) {
    const top = metrics.joursForts[0];
    phrases.push(
      `Votre meilleur jour est le ${top.jour} (${formatFCFA(
        top.moyenne
      )} de ventes en moyenne). Pensez à bien préparer votre stock la veille.`
    );
  }

  // 3) Rentabilité
  const marge =
    metrics.totalVentes > 0
      ? (metrics.beneficeEstime / metrics.totalVentes) * 100
      : 0;
  if (metrics.beneficeEstime > 0) {
    phrases.push(
      `Sur la période, vous dégagez un bénéfice estimé de ${formatFCFA(
        metrics.beneficeEstime
      )} (marge d'environ ${Math.round(marge)} %).`
    );
  } else {
    phrases.push(
      `Sur la période, vos dépenses approchent vos ventes : surveillez vos achats de stock.`
    );
  }

  // 4) Dettes clients
  if (metrics.dettesEnCours > 0) {
    phrases.push(
      `Attention : ${formatFCFA(
        metrics.dettesEnCours
      )} de crédits clients sont encore à recouvrer.`
    );
  }

  return phrases;

  // ---------------------------------------------------------------------------
  // TODO LLM — Pour un résumé plus naturel et personnalisé, envoyer `metrics`
  // à Mistral via une route API et demander 2-3 conseils actionnables en FCFA.
  // Garder la version par règles comme repli hors-ligne / sans clé API.
  // ---------------------------------------------------------------------------
}
