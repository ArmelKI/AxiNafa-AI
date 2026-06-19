// Page d'accueil — présentation courte (problème, solution, impact) + CTA démo.

import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50 to-[#f5f7f7]">
      <div className="app-shell px-5 py-8">
        {/* En-tête */}
        <header className="flex items-center justify-between">
          <Logo />
          <Link
            href="/dashboard"
            className="rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white"
          >
            Démo
          </Link>
        </header>

        {/* Hero */}
        <section className="mt-10 animate-in">
          <p className="inline-block rounded-full bg-brand-100 px-3 py-1 text-[11px] font-medium text-brand-700">
            Prototype STIC&apos;26 · Micro-finance inclusive
          </p>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight text-gray-900">
            Le carnet financier intelligent des micro-commerçants.
          </h1>
          <p className="mt-3 text-base leading-relaxed text-gray-600">
            AxiNafa AI aide les vendeuses et vendeurs de l&apos;économie informelle
            à <strong>noter leurs ventes</strong>, comprendre leur activité et
            obtenir une <strong>preuve de confiance</strong> pour accéder au
            financement.
          </p>
          <p className="mt-3 text-sm font-medium italic text-brand-700">
            « Transformer l&apos;activité informelle en preuve de confiance. »
          </p>

          <Link
            href="/dashboard"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-4 text-base font-semibold text-white shadow-lg shadow-brand/20 transition active:scale-[0.99]"
          >
            Tester la démo →
          </Link>
        </section>

        {/* Problème / Solution / Impact */}
        <section className="mt-12 space-y-4">
          <Card
            badge="Le problème"
            tone="problem"
            title="Une activité réelle, mais invisible"
            text="Des millions de micro-commerçants n'ont aucune trace écrite de leurs ventes. Sans historique, impossible de prouver leur sérieux aux banques et institutions de microfinance : le crédit leur est fermé."
          />
          <Card
            badge="La solution"
            tone="solution"
            title="Un carnet intelligent, simple comme parler"
            text="Saisie en un geste (texte, voix ou photo de reçu), catégorisation automatique des transactions, tableau de bord clair et résumé en langage simple. AxiNafa structure l'activité au quotidien."
          />
          <Card
            badge="L'impact"
            tone="impact"
            title="Un dossier de financement en un clic"
            text="AxiNafa calcule un pré-score de confiance explicable et génère un dossier PDF prêt à présenter : une vraie preuve d'activité pour ouvrir l'accès au financement."
          />
        </section>

        {/* Comment ça marche */}
        <section className="mt-12">
          <h2 className="text-lg font-bold text-gray-900">Comment ça marche</h2>
          <ol className="mt-4 space-y-3">
            {[
              ["1", "Je note", "Une vente, un achat — en parlant ou en tapant."],
              ["2", "L'IA range", "Chaque opération est catégorisée automatiquement."],
              ["3", "Je comprends", "Tableau de bord + conseils en langage simple."],
              ["4", "Je finance", "Un dossier PDF avec mon pré-score de confiance."],
            ].map(([n, t, d]) => (
              <li key={n} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                  {n}
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{t}</p>
                  <p className="text-sm text-gray-500">{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <footer className="mt-12 border-t border-gray-200 pt-6 text-center">
          <Logo />
          <p className="mt-3 text-[11px] text-gray-400">
            Prototype de démonstration — données fictives. Le pré-score est
            indicatif et ne remplace pas la décision d&apos;une institution
            financière.
          </p>
        </footer>
      </div>
    </main>
  );
}

function Card({
  badge,
  title,
  text,
  tone,
}: {
  badge: string;
  title: string;
  text: string;
  tone: "problem" | "solution" | "impact";
}) {
  const toneClass = {
    problem: "bg-red-50 text-red-600",
    solution: "bg-brand-50 text-brand",
    impact: "bg-amber-50 text-amber-700",
  }[tone];

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <span
        className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold ${toneClass}`}
      >
        {badge}
      </span>
      <h3 className="mt-2 text-base font-bold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-gray-600">{text}</p>
    </div>
  );
}
