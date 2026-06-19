// Moteur de catégorisation "IA" pour AxiNafa AI.
//
// Pour la démo, la catégorisation est faite par RÈGLES + MOTS-CLÉS, ce qui est
// robuste, déterministe et ne nécessite aucune clé API. Le point d'extension
// `categorizeWithLLM` ci-dessous montre exactement où brancher un appel Mistral
// pour passer en catégorisation par modèle de langage en production.

import { Category, Flow } from "./types";

/** Résultat d'une analyse de saisie libre. */
export interface ParseResult {
  amount: number;
  category: Category;
  flow: Flow;
  label: string;
  /** Confiance heuristique 0-1 sur la catégorie détectée. */
  confidence: number;
}

// Dictionnaires de mots-clés par catégorie. Tolérants aux fautes courantes et
// au vocabulaire local (FR + quelques termes usuels du commerce de rue).
const KEYWORDS: Record<Category, string[]> = {
  vente: [
    "vente",
    "vendu",
    "vendre",
    "vendue",
    "recette",
    "client paye",
    "encaisse",
    "encaissement",
    "jus",
    "gain",
    "entree",
    "vend",
  ],
  achat_stock: [
    "achat",
    "achete",
    "acheter",
    "stock",
    "marchandise",
    "appro",
    "approvisionnement",
    "fournisseur",
    "matiere",
    "ingredient",
    "sucre",
    "fruit",
    "bouteille",
    "glace",
  ],
  transport: [
    "transport",
    "taxi",
    "moto",
    "carburant",
    "essence",
    "deplacement",
    "livraison",
    "bus",
    "trajet",
  ],
  dette_client: [
    "dette",
    "credit",
    "doit",
    "avance",
    "creance",
    "rembourse",
    "remboursement",
    "a payer plus tard",
    "credit client",
  ],
  autre: ["divers", "autre", "frais", "depense", "charge"],
};

// Catégories considérées comme des SORTIES d'argent par défaut.
const SORTIE_CATEGORIES: Category[] = ["achat_stock", "transport"];

/** Normalise une chaîne : minuscules, sans accents, espaces compactés. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Extrait le premier montant numérique d'un texte (gère "5000", "5 000", "5.000", "5k"). */
export function extractAmount(text: string): number {
  const t = normalize(text);

  // Forme "5k" / "5 k" -> 5000
  const kMatch = t.match(/(\d+(?:[.,]\d+)?)\s*k\b/);
  if (kMatch) {
    return Math.round(parseFloat(kMatch[1].replace(",", ".")) * 1000);
  }

  // Nombre éventuellement avec séparateurs de milliers (espace, point)
  const numMatch = t.match(/\d[\d .]*\d|\d/);
  if (numMatch) {
    const cleaned = numMatch[0].replace(/[ .]/g, "");
    const value = parseInt(cleaned, 10);
    if (!Number.isNaN(value)) return value;
  }
  return 0;
}

/** Détecte la catégorie la plus probable d'après les mots-clés présents. */
export function detectCategory(text: string): { category: Category; confidence: number } {
  const t = normalize(text);
  const scores: Record<Category, number> = {
    vente: 0,
    achat_stock: 0,
    transport: 0,
    dette_client: 0,
    autre: 0,
  };

  (Object.keys(KEYWORDS) as Category[]).forEach((cat) => {
    for (const kw of KEYWORDS[cat]) {
      if (t.includes(kw)) scores[cat] += 1;
    }
  });

  let best: Category = "autre";
  let bestScore = 0;
  (Object.keys(scores) as Category[]).forEach((cat) => {
    if (scores[cat] > bestScore) {
      bestScore = scores[cat];
      best = cat;
    }
  });

  if (bestScore === 0) {
    // Aucun mot-clé : on suppose une vente (cas le plus fréquent au quotidien)
    return { category: "vente", confidence: 0.4 };
  }

  // Confiance heuristique : sature vers 0.95
  const confidence = Math.min(0.95, 0.6 + bestScore * 0.15);
  return { category: best, confidence };
}

/** Déduit le sens (entrée/sortie) à partir de la catégorie. */
export function flowForCategory(category: Category): Flow {
  if (category === "vente") return "entree";
  if (SORTIE_CATEGORIES.includes(category)) return "sortie";
  // dette_client = argent attendu, compté comme entrée potentielle ; autre = sortie par défaut
  return category === "dette_client" ? "entree" : "sortie";
}

/**
 * Analyse une saisie libre type "vente jus 5000" ou "achat stock 3000".
 * Combine extraction de montant + détection de catégorie par règles.
 */
export function parseTransactionText(input: string): ParseResult {
  const amount = extractAmount(input);
  const { category, confidence } = detectCategory(input);
  const flow = flowForCategory(category);

  // Libellé propre : on retire le montant brut pour ne garder que la description.
  const label =
    input
      .replace(/\d[\d .,]*k?/gi, "")
      .replace(/\s+/g, " ")
      .trim() || "Transaction";

  return {
    amount,
    category,
    flow,
    label: label.charAt(0).toUpperCase() + label.slice(1),
    confidence,
  };
}

// ---------------------------------------------------------------------------
// TODO LLM — Point d'extension pour brancher un vrai modèle (ex. Mistral).
// ---------------------------------------------------------------------------
// En production, on remplace/complète `detectCategory` par un appel LLM pour
// gérer le langage naturel libre, les fautes, le franco-dioula, etc.
//
// Implémentation cible (côté route API Next.js, jamais exposer la clé au client) :
//
//   export async function categorizeWithLLM(input: string): Promise<ParseResult> {
//     const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
//       },
//       body: JSON.stringify({
//         model: "mistral-small-latest",
//         response_format: { type: "json_object" },
//         messages: [
//           {
//             role: "system",
//             content:
//               "Tu catégorises des transactions de micro-commerce en FCFA. " +
//               "Réponds en JSON: {amount:number, category:'vente'|'achat_stock'|" +
//               "'transport'|'dette_client'|'autre', flow:'entree'|'sortie', label:string}.",
//           },
//           { role: "user", content: input },
//         ],
//       }),
//     });
//     const data = await res.json();
//     return JSON.parse(data.choices[0].message.content);
//   }
//
// Stratégie recommandée : essayer les règles d'abord (gratuit, instantané) et
// n'appeler le LLM qu'en cas de faible confiance (`confidence < 0.6`).
// ---------------------------------------------------------------------------

/**
 * Façade de catégorisation. Aujourd'hui = règles. Demain = règles + fallback LLM.
 * Garder cette signature stable permet de brancher le LLM sans toucher l'UI.
 */
export async function categorize(input: string): Promise<ParseResult> {
  const ruleResult = parseTransactionText(input);

  // if (ruleResult.confidence < 0.6) return categorizeWithLLM(input); // TODO LLM

  return ruleResult;
}
