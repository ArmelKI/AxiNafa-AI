"use client";

// Mode "visite guidée" — overlay narratif qui raconte l'ambition d'AxiNafa en
// rejouant le parcours d'Awa. Ce composant est purement présentationnel :
// il affiche l'étape courante et des contrôles ; c'est le dashboard qui pilote
// la progression et déclenche les actions (saisie simulée, génération PDF…).

export interface TourStep {
  /** Titre court de l'étape. */
  title: string;
  /** Texte de narration. */
  text: string;
  /** Libellé éventuel d'action en cours (ex. "Saisie vocale…"). */
  badge?: string;
}

export function GuidedTour({
  steps,
  index,
  onNext,
  onPrev,
  onClose,
}: {
  steps: TourStep[];
  index: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}) {
  const step = steps[index];
  const isLast = index === steps.length - 1;
  const progress = ((index + 1) / steps.length) * 100;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60]">
      {/* Voile léger en bas pour détacher la carte du contenu */}
      <div className="app-shell pointer-events-auto px-4 pb-4">
        <div className="animate-in rounded-2xl bg-gray-900/95 p-4 text-white shadow-2xl backdrop-blur">
          {/* Progression */}
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold text-accent">
              Visite guidée
            </span>
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] text-white/60">
              {index + 1}/{steps.length}
            </span>
          </div>

          {step.badge && (
            <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[11px] text-white/90">
              <span className="animate-listen inline-block h-1.5 w-1.5 rounded-full bg-accent" />
              {step.badge}
            </span>
          )}

          <h3 className="text-base font-bold">{step.title}</h3>
          <p className="mt-1 text-sm leading-snug text-white/85">{step.text}</p>

          {/* Contrôles */}
          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              onClick={onClose}
              className="text-xs font-medium text-white/50 underline-offset-2 hover:underline"
            >
              Quitter
            </button>
            <div className="flex items-center gap-2">
              {index > 0 && (
                <button
                  onClick={onPrev}
                  className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white"
                >
                  ◀ Retour
                </button>
              )}
              <button
                onClick={isLast ? onClose : onNext}
                className="rounded-lg bg-accent px-4 py-2 text-xs font-bold text-gray-900"
              >
                {isLast ? "Terminer ✓" : "Suivant ▶"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
