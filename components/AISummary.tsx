// Bloc "Résumé IA" en langage simple (généré par règles, cf. lib/summary).

export function AISummary({ phrases }: { phrases: string[] }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-brand to-brand-700 p-4 text-white shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-xs">
          ✦
        </span>
        <h3 className="text-sm font-semibold">Votre assistant AxiNafa</h3>
      </div>
      <ul className="space-y-2">
        {phrases.map((p, i) => (
          <li key={i} className="flex gap-2 text-sm leading-snug text-white/95">
            <span className="text-accent" aria-hidden>
              •
            </span>
            <span>{p}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[10px] text-white/60">
        Résumé généré automatiquement à partir de vos données (démo par règles).
      </p>
    </div>
  );
}
