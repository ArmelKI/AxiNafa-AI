// Carte de statistique réutilisable (mobile-first).

export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "positive" | "negative" | "brand";
  icon?: React.ReactNode;
}) {
  const toneClasses: Record<string, string> = {
    neutral: "text-gray-900",
    positive: "text-brand",
    negative: "text-red-600",
    brand: "text-brand",
  };

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {label}
        </p>
        {icon && <span aria-hidden>{icon}</span>}
      </div>
      <p className={`mt-1 text-lg font-bold leading-tight ${toneClasses[tone]}`}>
        {value}
      </p>
      {hint && <p className="mt-0.5 text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}
