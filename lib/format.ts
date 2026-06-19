// Helpers de formatage (devise, dates) — interface 100% française, devise FCFA.

/** Formate un montant en FCFA avec séparateur de milliers à la française. */
export function formatFCFA(amount: number): string {
  const rounded = Math.round(amount);
  const formatted = new Intl.NumberFormat("fr-FR").format(Math.abs(rounded));
  return `${rounded < 0 ? "-" : ""}${formatted} FCFA`;
}

/** Date ISO -> "12 juin" (court, pour les graphiques et listes). */
export function formatDayShort(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

/** Date ISO -> "jeudi 12 juin 2026" (long, pour le PDF). */
export function formatDayLong(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Renvoie le nom du jour de la semaine ("samedi"). */
export function weekdayName(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { weekday: "long" });
}

/** true si la date tombe un samedi ou dimanche. */
export function isWeekend(iso: string): boolean {
  const day = new Date(iso + "T00:00:00").getDay();
  return day === 0 || day === 6;
}

/** Date ISO du jour (YYYY-MM-DD), heure locale. */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
