"use client";

// Tableau de bord commerçant — cœur de la démo.
// Charge l'état (seed ou localStorage), calcule métriques / résumé / score,
// permet d'ajouter une transaction et de générer le dossier PDF.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { StatCard } from "@/components/StatCard";
import { SalesChart } from "@/components/SalesChart";
import { TransactionList } from "@/components/TransactionList";
import { AISummary } from "@/components/AISummary";
import { ConfidenceCard } from "@/components/ConfidenceCard";
import { AddTransaction } from "@/components/AddTransaction";

import { Transaction, MerchantProfile } from "@/lib/types";
import {
  loadTransactions,
  saveTransactions,
  loadProfile,
  resetDemo,
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
  const today = todayISO();

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

  function handleGeneratePDF() {
    if (!profile || !score) return;
    const dates = metrics.jours.map((j) => j.date);
    genererDossierPDF({
      profile,
      metrics,
      score,
      summary,
      periodeDebut: dates[0] ?? today,
      periodeFin: dates[dates.length - 1] ?? today,
    });
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
        <div className="app-shell px-5 pb-6 pt-6">
          <div className="flex items-center justify-between">
            <Logo variant="light" />
            <button
              onClick={handleReset}
              className="rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-medium text-white"
            >
              ↺ Réinitialiser
            </button>
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
        <AISummary phrases={summary} />

        {/* Graphique 30 jours */}
        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
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
        <ConfidenceCard score={score} />

        {/* Génération du dossier de financement */}
        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
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
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-semibold text-white"
          >
            📄 Générer mon dossier de financement
          </button>
        </section>

        {/* Transactions */}
        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
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

        <p className="px-1 text-center text-[11px] text-gray-400">
          Données de démonstration (Awa, vendeuse de jus). Vos ajouts sont
          stockés localement dans ce navigateur.
        </p>
      </div>

      {/* Bouton flottant d'ajout */}
      <div className="fixed inset-x-0 bottom-0 z-40">
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
    </main>
  );
}
