// Types métier partagés pour AxiNafa AI

/** Catégories de transactions reconnues par le moteur de catégorisation. */
export type Category =
  | "vente"
  | "achat_stock"
  | "transport"
  | "dette_client"
  | "autre";

/** Sens financier : une entrée augmente le solde, une sortie le diminue. */
export type Flow = "entree" | "sortie";

export interface Transaction {
  id: string;
  /** Date ISO (YYYY-MM-DD) du jour de la transaction. */
  date: string;
  /** Libellé saisi ou reconstitué. */
  label: string;
  /** Montant TOUJOURS positif (en FCFA). Le sens est porté par `flow`. */
  amount: number;
  category: Category;
  flow: Flow;
  /** Mode de saisie d'origine, utile pour la démo. */
  source?: "texte" | "voix" | "photo" | "seed";
}

export interface MerchantProfile {
  name: string;
  activity: string;
  city: string;
  /** Date ISO de début d'activité — sert au calcul d'ancienneté. */
  since: string;
}

/** Libellés humains pour l'affichage des catégories. */
export const CATEGORY_LABELS: Record<Category, string> = {
  vente: "Vente",
  achat_stock: "Achat de stock",
  transport: "Transport",
  dette_client: "Dette client",
  autre: "Autre",
};

/** Couleurs d'accent par catégorie (cohérentes avec l'identité visuelle). */
export const CATEGORY_COLORS: Record<Category, string> = {
  vente: "#1B5E5A",
  achat_stock: "#E2A03F",
  transport: "#3B82A0",
  dette_client: "#B45454",
  autre: "#8896A0",
};
