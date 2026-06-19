"use client";

// Tableau de bord commerçant — cœur de la démo.
// Charge l'état (seed ou localStorage), calcule métriques / résumé / score,
// permet d'ajouter une transaction et de générer le dossier PDF.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Logo } from "@/components/Logo";
import { StatCard } from "@/components/StatCard";
import { SalesChart } from "@/components/SalesChart";
import { TransactionList } from "@/components/TransactionList";
import { AISummary } from "@/components/AISummary";
import { ConfidenceCard } from "@/components/ConfidenceCard";
import { AddTransaction } from "@/components/AddTransaction";
import { GoalCard } from "@/components/GoalCard";
import { ResponsibleAI } from "@/components/ResponsibleAI";
import { GuidedTour, TourStep } from "@/components/GuidedTour";

import { Transaction, MerchantProfile } from "@/lib/types";
import {
  loadTransactions,
  saveTransactions,
  loadProfile,
  resetDemo,
  newId,
} from "@/lib/store";
import { computeMetrics, generateSummary } from "@/lib/summary";
import { computeScore } from "@/lib/score";
import { genererDossierPDF } from "@/lib/pdf";
import { formatFCFA, todayISO } from "@/lib/format";

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [profile, setProfile] = useState<MerchantProfile | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [ready, setReady] = useState(false);
  const [generating, setGenerating] = useState(false);
  const today = todayISO();

  // -- Visite guidée -------------------------------------------------------
  const [tourIndex, setTourIndex] = useState<number | null>(null);
  const [highlightKey, setHighlightKey] = useState<string | null>(null);
  const refs = {
    top: useRef<HTMLDivElement>(null),
    summary: useRef<HTMLDivElement>(null),
    chart: useRef<HTMLDivElement>(null),
    score: useRef<HTMLDivElement>(null),
    goal: useRef<HTMLDivElement>(null),
    pdf: useRef<HTMLDivElement>(null),
    tx: useRef<HTMLDivElement>(null),
  };
  const hl = (key: string) => (highlightKey === key ? " tour-highlight" : "");

  // Chargement initial côté client (localStorage / seed).
  useEffect(() => {
    setTransactions(loadTransactions());
    setProfile(loadProfile());
    setReady(true);
  }, []);

  // Recalculs dérivés mémoïsés.
  const metrics = useMemo(
    () => computeMetrics(transactions, today),
    [transactions, today]
  );
  const summary = useMemo(
    () => generateSummary(transactions, metrics),
    [transactions, metrics]
  );
  const score = useMemo(
    () => (profile ? computeScore(transactions, profile, metrics) : null),
    [transactions, profile, metrics]
  );

  function addTransaction(t: Transaction) {
    const next = [...transactions, t];
    setTransactions(next);
    saveTransactions(next);
  }

  function handleReset() {
    setTransactions(resetDemo());
  }

  // Étapes de la visite guidée : narration + cible à mettre en valeur + action.
  const tourConfig: (TourStep & {
    focus: keyof typeof refs;
    action?: "voice" | "pdf";
  })[] = [
    {
      focus: "top",
      title: "Voici Awa, vendeuse de jus à Bobo-Dioulasso",
      text: "Comme des millions de commerçants, elle vend chaque jour mais reste invisible pour les banques. Suivons comment AxiNafa transforme son activité en preuve de confiance.",
    },
    {
      focus: "tx",
      badge: "Saisie vocale en cours…",
      title: "1. Elle note sa vente, en parlant",
      text: "« J'ai vendu 5000 de jus aujourd'hui. » AxiNafa comprend, catégorise et enregistre — sans paperasse, sans compétence comptable.",
      action: "voice",
    },
    {
      focus: "summary",
      title: "2. L'IA range et explique",
      text: "Chaque opération est classée automatiquement, et un résumé en langage simple lui dit ce qui marche : « Vos ventes montent le week-end… »",
    },
    {
      focus: "chart",
      title: "3. Elle comprend son activité",
      text: "Tendance des 30 jours et jours forts apparaissent clairement. Awa pilote enfin son commerce avec des chiffres.",
    },
    {
      focus: "score",
      title: "4. Un pré-score de confiance explicable",
      text: "Régularité, ancienneté, volume : AxiNafa calcule un score transparent. Pas de boîte noire — chaque facteur est justifié.",
    },
    {
      focus: "goal",
      title: "5. Un objectif concret",
      text: "Awa veut un congélateur pour vendre frais et gagner plus. AxiNafa relie son activité à ce projet de financement.",
    },
    {
      focus: "pdf",
      badge: "Génération du dossier…",
      title: "6. Un dossier de financement en un clic",
      text: "AxiNafa produit un PDF crédible, prêt à présenter à une microfinance. La décision reste humaine : nous fournissons la preuve, pas le crédit.",
      action: "pdf",
    },
    {
      focus: "top",
      title: "Voilà l'ambition : rendre visibles les invisibles",
      text: "AxiNafa AI, c'est la passerelle entre l'économie informelle et l'inclusion financière. Une solution africaine, pour des problèmes africains.",
    },
  ];

  const tourSteps: TourStep[] = tourConfig.map(({ title, text, badge }) => ({
    title,
    text,
    badge,
  }));

  // Garde-fous : déclencher les actions (saisie/PDF) une seule fois par visite.
  const voiceDoneRef = useRef(false);
  const pdfDoneRef = useRef(false);

  function startTour() {
    voiceDoneRef.current = false;
    pdfDoneRef.current = false;
    setTourIndex(0);
  }

  function endTour() {
    setTourIndex(null);
    setHighlightKey(null);
  }

  // À chaque changement d'étape : on défile vers la cible, on la met en valeur,
  // et on exécute l'éventuelle action (saisie vocale simulée / génération PDF).
  const runTourStep = useCallback(
    (i: number) => {
      const cfg = tourConfig[i];
      if (!cfg) return;
      setHighlightKey(cfg.focus);
      const el = refs[cfg.focus].current;
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });

      if (cfg.action === "voice" && !voiceDoneRef.current) {
        voiceDoneRef.current = true;
        // Saisie vocale simulée : on ajoute une vente de 5000 FCFA datée du jour.
        const t: Transaction = {
          id: newId(),
          date: today,
          label: "Vente de jus (saisie vocale)",
          amount: 5000,
          category: "vente",
          flow: "entree",
          source: "voix",
        };
        setTimeout(() => addTransaction(t), 600);
      }
      if (cfg.action === "pdf" && !pdfDoneRef.current) {
        pdfDoneRef.current = true;
        setTimeout(() => handleGeneratePDF(), 800);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [today]
  );

  useEffect(() => {
    if (tourIndex !== null) runTourStep(tourIndex);
  }, [tourIndex, runTourStep]);

  function handleGeneratePDF() {
    if (!profile || !score || generating) return;
    // Petit délai "Génération de votre dossier…" avant le téléchargement,
    // pour matérialiser le travail de l'IA (logique PDF inchangée).
    setGenerating(true);
    const dates = metrics.jours.map((j) => j.date);
    setTimeout(() => {
      genererDossierPDF({
        profile,
        metrics,
        score,
        summary,
        periodeDebut: dates[0] ?? today,
        periodeFin: dates[dates.length - 1] ?? today,
      });
      setGenerating(false);
    }, 1000);
  }

  if (!ready || !profile || !score) {
    return (
      <main className="flex min-h-screen items-center justify-center text-sm text-gray-400">
        Chargement de la démo…
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-28">
      {/* En-tête */}
      <header className="bg-brand text-white">
        <div ref={refs.top} className={`app-shell px-5 pb-6 pt-6${hl("top")}`}>
          <div className="flex items-center justify-between gap-2">
            <Logo variant="light" />
            <div className="flex items-center gap-2">
              <button
                onClick={startTour}
                className="rounded-full bg-accent px-3 py-1.5 text-[11px] font-bold text-gray-900"
              >
                ▶ Visite guidée
              </button>
              <button
                onClick={handleReset}
                className="rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-medium text-white"
              >
                ↺
              </button>
            </div>
          </div>

          <div className="mt-5">
            <p className="text-xs text-white/70">Bonjour,</p>
            <h1 className="text-xl font-bold">
              {profile.name} · {profile.activity.split("(")[0].trim()}
            </h1>
            <p className="text-xs text-white/70">{profile.city}</p>
          </div>

          {/* Solde principal */}
          <div className="mt-5 rounded-2xl bg-white/10 p-4 backdrop-blur">
            <p className="text-xs text-white/70">Bénéfice estimé (30 jours)</p>
            <p className="text-3xl font-extrabold">
              {formatFCFA(metrics.beneficeEstime)}
            </p>
            <div className="mt-2 flex gap-4 text-xs text-white/80">
              <span>Ventes : {formatFCFA(metrics.totalVentes)}</span>
              <span>Dépenses : {formatFCFA(metrics.totalDepenses)}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="app-shell space-y-5 px-5 pt-5">
        {/* Statistiques du jour */}
        <section className="grid grid-cols-2 gap-3">
          <StatCard
            label="Ventes du jour"
            value={formatFCFA(metrics.ventesAujourdhui)}
            tone="positive"
            icon={<span>📈</span>}
          />
          <StatCard
            label="Dépenses du jour"
            value={formatFCFA(metrics.depensesAujourdhui)}
            tone="negative"
            icon={<span>🧾</span>}
          />
          <StatCard
            label="Solde estimé"
            value={formatFCFA(metrics.solde)}
            tone="brand"
            icon={<span>💰</span>}
          />
          <StatCard
            label="Crédits clients"
            value={formatFCFA(metrics.dettesEnCours)}
            hint="à recouvrer"
            icon={<span>🤝</span>}
          />
        </section>

        {/* Résumé IA */}
        <div ref={refs.summary} className={`rounded-2xl${hl("summary")}`}>
          <AISummary phrases={summary} />
        </div>

        {/* Graphique 30 jours */}
        <section
          ref={refs.chart}
          className={`rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5${hl(
            "chart"
          )}`}
        >
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">
              Activité des 30 derniers jours
            </h3>
          </div>
          <div className="mb-2 flex gap-4 text-[11px] text-gray-500">
            <span className="flex items-center gap-1">
              <i className="inline-block h-2 w-2 rounded-full bg-brand" /> Ventes
            </span>
            <span className="flex items-center gap-1">
              <i className="inline-block h-2 w-2 rounded-full bg-accent" /> Dépenses
            </span>
          </div>
          <SalesChart jours={metrics.jours} />
        </section>

        {/* Jours forts */}
        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <h3 className="text-sm font-semibold text-gray-800">Vos jours forts</h3>
          <div className="mt-3 space-y-2">
            {metrics.joursForts.slice(0, 4).map((j) => {
              const max = metrics.joursForts[0]?.moyenne || 1;
              return (
                <div key={j.jour} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-xs capitalize text-gray-600">
                    {j.jour}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${(j.moyenne / max) * 100}%` }}
                    />
                  </div>
                  <span className="w-24 shrink-0 text-right text-[11px] text-gray-500">
                    {formatFCFA(j.moyenne)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Pré-score de confiance */}
        <div ref={refs.score} className={`rounded-2xl${hl("score")}`}>
          <ConfidenceCard score={score} />
        </div>

        {/* Objectif de financement (raconte l'ambition) */}
        {profile.goal && (
          <div ref={refs.goal} className={`rounded-2xl${hl("goal")}`}>
            <GoalCard
              goal={profile.goal}
              financementConseille={score.financementConseille}
            />
          </div>
        )}

        {/* Génération du dossier de financement */}
        <section
          ref={refs.pdf}
          className={`rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5${hl(
            "pdf"
          )}`}
        >
          <h3 className="text-sm font-semibold text-gray-800">
            Dossier de financement
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            Générez un PDF récapitulant votre activité, votre pré-score et un
            montant de financement conseillé de{" "}
            <strong className="text-brand">
              {formatFCFA(score.financementConseille)}
            </strong>
            .
          </p>
          <button
            onClick={handleGeneratePDF}
            disabled={generating}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-semibold text-white transition disabled:opacity-80"
          >
            {generating ? (
              <>
                <span className="animate-listen inline-block h-2.5 w-2.5 rounded-full bg-white" />
                Génération de votre dossier
                <span className="dot">.</span>
                <span className="dot">.</span>
                <span className="dot">.</span>
              </>
            ) : (
              <>📄 Générer mon dossier de financement</>
            )}
          </button>
        </section>

        {/* Transactions */}
        <section
          ref={refs.tx}
          className={`rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5${hl(
            "tx"
          )}`}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">
              Dernières transactions
            </h3>
            <span className="text-[11px] text-gray-400">
              {transactions.length} au total
            </span>
          </div>
          <TransactionList transactions={transactions} limit={12} />
        </section>

        {/* Encart IA responsable */}
        <ResponsibleAI />

        <p className="px-1 text-center text-[11px] text-gray-400">
          Données de démonstration (Awa, vendeuse de jus). Vos ajouts sont
          stockés localement dans ce navigateur.
        </p>
      </div>

      {/* Bouton flottant d'ajout (masqué pendant la visite guidée) */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 ${
          tourIndex !== null ? "hidden" : ""
        }`}
      >
        <div className="app-shell px-5 pb-5">
          <button
            onClick={() => setShowAdd(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-4 text-base font-semibold text-white shadow-xl shadow-brand/30"
          >
            ＋ Ajouter une transaction
          </button>
        </div>
      </div>

      {showAdd && (
        <AddTransaction onAdd={addTransaction} onClose={() => setShowAdd(false)} />
      )}

      {/* Overlay de visite guidée */}
      {tourIndex !== null && (
        <GuidedTour
          steps={tourSteps}
          index={tourIndex}
          onNext={() =>
            setTourIndex((i) =>
              i === null ? null : Math.min(i + 1, tourSteps.length - 1)
            )
          }
          onPrev={() =>
            setTourIndex((i) => (i === null ? null : Math.max(i - 1, 0)))
          }
          onClose={endTour}
        />
      )}
    </main>
  );
}
