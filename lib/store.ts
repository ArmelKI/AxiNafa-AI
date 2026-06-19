// Store de démo : état en mémoire + persistance localStorage côté client.
// Aucune base externe — adapté à un déploiement Vercel sans backend.

import { Transaction, MerchantProfile } from "./types";
import { SEED_PROFILE, buildSeedTransactions } from "./seed";

const STORAGE_KEY = "axinafa.transactions.v1";
const PROFILE_KEY = "axinafa.profile.v1";

/** Charge les transactions depuis localStorage, ou initialise avec le seed. */
export function loadTransactions(): Transaction[] {
  if (typeof window === "undefined") return buildSeedTransactions();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Transaction[];
  } catch {
    /* localStorage indisponible : on retombe sur le seed */
  }
  const seed = buildSeedTransactions();
  saveTransactions(seed);
  return seed;
}

export function saveTransactions(txns: Transaction[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(txns));
  } catch {
    /* quota / mode privé : on ignore, l'état mémoire reste valable */
  }
}

export function loadProfile(): MerchantProfile {
  if (typeof window === "undefined") return SEED_PROFILE;
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (raw) return JSON.parse(raw) as MerchantProfile;
  } catch {
    /* ignore */
  }
  return SEED_PROFILE;
}

/** Réinitialise la démo aux données de seed. */
export function resetDemo(): Transaction[] {
  const seed = buildSeedTransactions();
  saveTransactions(seed);
  return seed;
}

/** Génère un identifiant unique pour une nouvelle transaction. */
export function newId(): string {
  return `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
