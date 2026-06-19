// Liste des transactions récentes avec pastille de catégorie.

import {
  Transaction,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
} from "@/lib/types";
import { formatFCFA, formatDayShort } from "@/lib/format";

export function TransactionList({
  transactions,
  limit,
}: {
  transactions: Transaction[];
  limit?: number;
}) {
  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));
  const list = limit ? sorted.slice(0, limit) : sorted;

  if (list.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-400">
        Aucune transaction pour le moment.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-gray-100">
      {list.map((t) => {
        const entree = t.flow === "entree";
        return (
          <li key={t.id} className="flex items-center gap-3 py-3">
            <span
              className="mt-0.5 inline-block h-9 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: CATEGORY_COLORS[t.category] }}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-800">
                {t.label}
              </p>
              <p className="text-[11px] text-gray-400">
                {CATEGORY_LABELS[t.category]} · {formatDayShort(t.date)}
                {t.source && t.source !== "seed" ? ` · ${t.source}` : ""}
              </p>
            </div>
            <span
              className={`shrink-0 text-sm font-semibold ${
                entree ? "text-brand" : "text-red-600"
              }`}
            >
              {entree ? "+" : "−"}
              {formatFCFA(t.amount).replace(" FCFA", "")}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
