// Pré-score de confiance EXPLICABLE (0-100) pour AxiNafa AI.
//
// Le score combine 3 facteurs lisibles. Chaque facteur expose sa valeur, son
// poids et sa contribution, pour que l'affichage soit transparent et honnête.
// Ce n'est PAS une décision de crédit : voir la mention d'avertissement.

import { Transaction, MerchantProfile } from "./types";
import { Metrics } from "./summary";

export interface ScoreFactor {
  key: "regularite" | "anciennete" | "volume";
  label: string;
  /** Détail lisible affiché à l'utilisateur. */
  detail: string;
  /** Note du facteur sur 100. */
  note: number;
  /** Poids du facteur dans le score final (somme = 1). */
  poids: number;
  /** Contribution effective au score (note * poids). */
  contribution: number;
}

export interface ConfidenceScore {
  total: number; // 0-100
  niveau: "Faible" | "Moyen" | "Bon" | "Excellent";
  factors: ScoreFactor[];
  /** Montant de financement indicatif conseillé (FCFA). */
  financementConseille: number;
}

const POIDS = { regularite: 0.45, anciennete: 0.2, volume: 0.35 };

/** Coefficient de variation -> note de régularité (plus c'est stable, mieux c'est). */
function noteRegularite(jours: Metrics["jours"]): { note: number; detail: string } {
  const ventes = jours.map((j) => j.ventes).filter((v) => v > 0);
  if (ventes.length < 3) {
    return { note: 30, detail: "Trop peu de jours actifs pour juger la régularité." };
  }
  const moyenne = ventes.reduce((s, v) => s + v, 0) / ventes.length;
  const variance =
    ventes.reduce((s, v) => s + (v - moyenne) ** 2, 0) / ventes.length;
  const ecartType = Math.sqrt(variance);
  const cv = moyenne > 0 ? ecartType / moyenne : 1; // coefficient de variation

  // CV faible (<0.25) => très régulier ; CV élevé (>0.9) => irrégulier
  const note = Math.max(0, Math.min(100, Math.round((1 - cv / 0.9) * 100)));
  const joursActifs = ventes.length;
  return {
    note,
    detail: `${joursActifs} jours de ventes, variation ${Math.round(
      cv * 100
    )} % autour de la moyenne.`,
  };
}

/** Ancienneté de l'activité -> note (12 mois ou + = plein pot). */
function noteAnciennete(since: string): { note: number; detail: string } {
  const start = new Date(since + "T00:00:00").getTime();
  const mois = Math.max(0, (Date.now() - start) / (1000 * 60 * 60 * 24 * 30.4));
  const note = Math.max(0, Math.min(100, Math.round((mois / 12) * 100)));
  return {
    note,
    detail: `Activité déclarée depuis environ ${Math.round(mois)} mois.`,
  };
}

/** Volume d'affaires -> note (palier à 300 000 FCFA sur la période). */
function noteVolume(totalVentes: number): { note: number; detail: string } {
  const palier = 300_000;
  const note = Math.max(0, Math.min(100, Math.round((totalVentes / palier) * 100)));
  return {
    note,
    detail: `Chiffre d'affaires de ${new Intl.NumberFormat("fr-FR").format(
      Math.round(totalVentes)
    )} FCFA sur la période.`,
  };
}

export function computeScore(
  transactions: Transaction[],
  profile: MerchantProfile,
  metrics: Metrics
): ConfidenceScore {
  const reg = noteRegularite(metrics.jours);
  const anc = noteAnciennete(profile.since);
  const vol = noteVolume(metrics.totalVentes);

  const factors: ScoreFactor[] = [
    {
      key: "regularite",
      label: "Régularité des revenus",
      detail: reg.detail,
      note: reg.note,
      poids: POIDS.regularite,
      contribution: reg.note * POIDS.regularite,
    },
    {
      key: "anciennete",
      label: "Ancienneté de l'activité",
      detail: anc.detail,
      note: anc.note,
      poids: POIDS.anciennete,
      contribution: anc.note * POIDS.anciennete,
    },
    {
      key: "volume",
      label: "Volume d'affaires",
      detail: vol.detail,
      note: vol.note,
      poids: POIDS.volume,
      contribution: vol.note * POIDS.volume,
    },
  ];

  const total = Math.round(
    factors.reduce((s, f) => s + f.contribution, 0)
  );

  let niveau: ConfidenceScore["niveau"] = "Faible";
  if (total >= 80) niveau = "Excellent";
  else if (total >= 60) niveau = "Bon";
  else if (total >= 40) niveau = "Moyen";

  // Financement indicatif : ~1.5x le bénéfice mensuel estimé, modulé par le score.
  const beneficeMensuel =
    metrics.nbJoursActifs > 0
      ? (metrics.beneficeEstime / metrics.nbJoursActifs) * 26
      : 0;
  const financementConseille =
    Math.round((beneficeMensuel * 1.5 * (total / 100)) / 5000) * 5000;

  return {
    total,
    niveau,
    factors,
    financementConseille: Math.max(0, financementConseille),
  };
}
