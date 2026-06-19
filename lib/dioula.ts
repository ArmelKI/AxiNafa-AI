// Mode "dioula (vocabulaire restreint)" — DÉMO HONNÊTE.
//
// Il ne s'agit PAS d'une vraie reconnaissance vocale dioula. L'API Web Speech
// du navigateur ne supporte pas le dioula. Pour la démo, on reconnaît la voix
// en français puis on mappe une LISTE FIXE de mots-clés financiers transcrits
// phonétiquement vers nos catégories. L'UI affiche clairement la mention
// "vocabulaire restreint (démo)" pour rester transparent vis-à-vis du jury.

import { Category } from "./types";

interface DioulaEntry {
  /** Mot-clé dioula (graphie simplifiée / phonétique). */
  mot: string;
  /** Traduction française indicative. */
  fr: string;
  category: Category;
}

/** Liste fixe et restreinte de mots-clés financiers simulés. */
export const DIOULA_VOCAB: DioulaEntry[] = [
  { mot: "feere", fr: "vendre / vente", category: "vente" },
  { mot: "songo", fr: "prix / argent reçu", category: "vente" },
  { mot: "sara", fr: "paiement", category: "vente" },
  { mot: "san", fr: "acheter", category: "achat_stock" },
  { mot: "marasen", fr: "marchandise / stock", category: "achat_stock" },
  { mot: "bololamafen", fr: "stock", category: "achat_stock" },
  { mot: "mobili", fr: "transport / véhicule", category: "transport" },
  { mot: "taama", fr: "déplacement", category: "transport" },
  { mot: "juru", fr: "dette / crédit", category: "dette_client" },
  { mot: "kalan", fr: "crédit client", category: "dette_client" },
];

/** Nombres usuels en dioula simplifié pour saisie vocale du montant. */
export const DIOULA_NUMBERS: Record<string, number> = {
  kelen: 1,
  fila: 2,
  saba: 3,
  naani: 4,
  duuru: 5,
  wooro: 6,
  tan: 10,
  mugan: 20,
  keme: 100,
  waga: 1000,
};

/** Normalise (minuscules, sans accents). */
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

export interface DioulaParse {
  category: Category | null;
  motReconnu?: string;
  /** Montant si un nombre dioula a été détecté (sinon 0). */
  amount: number;
}

/**
 * Analyse une transcription en cherchant les mots-clés dioula connus.
 * Retourne la catégorie + un montant éventuel reconstruit additivement.
 */
export function parseDioula(transcript: string): DioulaParse {
  const t = norm(transcript);

  let category: Category | null = null;
  let motReconnu: string | undefined;
  for (const entry of DIOULA_VOCAB) {
    if (t.includes(entry.mot)) {
      category = entry.category;
      motReconnu = entry.mot;
      break;
    }
  }

  // Reconstruction simple d'un montant : on additionne les nombres reconnus.
  // (suffisant pour la démo : "waga duuru" ~ 1000 + 5 ; on garde le plus grand
  //  multiplicateur comme ordre de grandeur si présent)
  let amount = 0;
  const words = t.split(/\s+/);
  for (const w of words) {
    if (DIOULA_NUMBERS[w] !== undefined) amount += DIOULA_NUMBERS[w];
  }
  // chiffres arabes éventuels dans la transcription
  const digits = t.match(/\d[\d ]*\d|\d/);
  if (digits) amount = parseInt(digits[0].replace(/\s/g, ""), 10) || amount;

  return { category, motReconnu, amount };
}
