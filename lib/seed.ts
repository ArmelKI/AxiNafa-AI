// Données de démonstration pré-chargées (seed).
//
// Profil : Awa, vendeuse de jus à Bobo-Dioulasso. On génère 30 jours de
// transactions réalistes de façon DÉTERMINISTE (pseudo-aléatoire à graine fixe)
// pour que le dashboard et le PDF soient parlants dès l'ouverture, tout en
// finissant sur la date du jour réel.

import { Transaction, MerchantProfile } from "./types";
import { isWeekend } from "./format";

export const SEED_PROFILE: MerchantProfile = {
  name: "Awa",
  activity: "Vente de jus naturels (bissap, gingembre, tamarin)",
  city: "Bobo-Dioulasso",
  since: "2025-02-10", // ~16 mois d'activité au 19/06/2026
  goal: {
    label: "Acheter un congélateur pour vendre frais",
    amount: 150_000,
    emoji: "🧊",
  },
};

/** Générateur pseudo-aléatoire déterministe (mulberry32). */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

let counter = 0;
function id(): string {
  counter += 1;
  return `seed-${counter}`;
}

/**
 * Construit 30 jours de transactions terminant aujourd'hui.
 * Ventes quotidiennes variables, pics le week-end, achats de stock réguliers,
 * transport ponctuel, quelques dettes clients.
 */
export function buildSeedTransactions(): Transaction[] {
  const rnd = mulberry32(20260619); // graine fixe => données stables
  const txns: Transaction[] = [];
  counter = 0;

  for (let i = 29; i >= 0; i--) {
    const date = isoDaysAgo(i);
    const weekend = isWeekend(date);

    // Ventes du jour : base ~12 000, +60 % le week-end, bruit +/-
    const base = weekend ? 19000 : 11500;
    const noise = Math.round((rnd() - 0.5) * 6000);
    const venteJour = Math.max(4000, base + noise);

    // 1 à 2 ventes par jour pour étoffer la liste
    const nbVentes = rnd() > 0.5 ? 2 : 1;
    for (let v = 0; v < nbVentes; v++) {
      const part = nbVentes === 2 ? (v === 0 ? 0.6 : 0.4) : 1;
      txns.push({
        id: id(),
        date,
        label: v === 0 ? "Vente de jus (matinée)" : "Vente de jus (après-midi)",
        amount: Math.round(venteJour * part),
        category: "vente",
        flow: "entree",
        source: "seed",
      });
    }

    // Achat de stock environ tous les 3 jours
    if (i % 3 === 0) {
      txns.push({
        id: id(),
        date,
        label: "Achat fruits + sucre + glace",
        amount: 5000 + Math.round(rnd() * 4000),
        category: "achat_stock",
        flow: "sortie",
        source: "seed",
      });
    }

    // Transport ponctuel (~1 jour sur 4)
    if (rnd() > 0.75) {
      txns.push({
        id: id(),
        date,
        label: "Transport marché / taxi",
        amount: 500 + Math.round(rnd() * 1500),
        category: "transport",
        flow: "sortie",
        source: "seed",
      });
    }

    // Dette client occasionnelle (~1 jour sur 8)
    if (rnd() > 0.88) {
      txns.push({
        id: id(),
        date,
        label: "Crédit accordé à un client habituel",
        amount: 1000 + Math.round(rnd() * 3000),
        category: "dette_client",
        flow: "entree",
        source: "seed",
      });
    }
  }

  return txns;
}
