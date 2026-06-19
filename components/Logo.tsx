// Logo texte "AxiNafa AI" + baseline. Pas d'image : 100% typographique, léger.

export function Logo({
  showBaseline = false,
  variant = "dark",
}: {
  showBaseline?: boolean;
  variant?: "dark" | "light";
}) {
  const main = variant === "light" ? "text-white" : "text-brand";
  const dot = variant === "light" ? "text-accent" : "text-accent";
  const base = variant === "light" ? "text-white/80" : "text-brand-600/70";

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-extrabold ${
            variant === "light" ? "bg-white text-brand" : "bg-brand text-white"
          }`}
          aria-hidden
        >
          A
        </span>
        <span className={`text-xl font-extrabold tracking-tight ${main}`}>
          AxiNafa<span className={dot}> AI</span>
        </span>
      </div>
      {showBaseline && (
        <p className={`mt-1 text-xs ${base}`}>
          Transformer l&apos;activité informelle en preuve de confiance.
        </p>
      )}
    </div>
  );
}
