# AxiNafa AI

> **Transformer l'activité informelle en preuve de confiance.**

Carnet financier intelligent pour micro-commerçants — prototype de démonstration
pour le concours **STIC'26**. L'application montre la chaîne complète :

**Saisie → Catégorisation IA → Tableau de bord → Dossier de financement PDF.**

Interface 100 % en français, devise **FCFA**, pensée **mobile-first** (cible :
smartphone d'entrée de gamme).

---

## ✨ Fonctionnalités

| # | Fonctionnalité | Détail |
|---|----------------|--------|
| 1 | **Page d'accueil** | Problème / solution / impact + bouton « Tester la démo ». |
| 2 | **Tableau de bord** | Ventes du jour, dépenses, bénéfice estimé, solde, graphique 30 jours (recharts), liste des transactions, jours forts. |
| 3 | **Ajout intelligent** | 4 modes : **texte** (« vente jus 5000 »), **voix** (Web Speech API, FR + mode *dioula vocabulaire restreint, démo*), **photo de reçu** (OCR simulé, montant éditable), **Mobile Money** (import simulé Orange/Moov Money). |
| 4 | **Catégorisation IA** | Classement par règles + mots-clés (vente, achat stock, transport, dette client, autre) et estimation du bénéfice. Point d'extension `// TODO LLM` pour brancher Mistral. |
| 5 | **Résumé IA** | Synthèse en langage simple (« Vos ventes montent le week-end… »), par règles. |
| 6 | **Pré-score de confiance explicable** | Score 0-100 à partir de la **régularité**, l'**ancienneté** et le **volume**, avec affichage des facteurs. Mention « indicatif, ne remplace pas la décision d'une institution ». |
| 7 | **Dossier de financement PDF** | Génération client (jsPDF) : identité, période, CA, dépenses, bénéfice, régularité, pré-score, **objectif** (congélateur 150 000 FCFA), montant conseillé, mention de responsabilité. |
| 8 | **Objectif de financement** | Carte reliant l'activité au projet concret du commerçant et au montant conseillé (raconte l'ambition : activité → preuve → croissance). |
| 9 | **Graphique radar** | Vue radar (recharts) des 3 facteurs du pré-score, en complément du score numérique. |
| 10 | **IA responsable** | Encart de positionnement : AxiNafa ne prête pas, l'humain décide, données locales — angle prudent et différenciant. |
| 11 | **Mode Visite guidée** | Bouton « ▶ Visite guidée » qui rejoue le parcours d'Awa (saisie vocale simulée → catégorisation → score → objectif → génération PDF) avec narration et mise en valeur animée de chaque section : le jury comprend toute l'ambition en un clic. |

> **Micro-animations « traitement IA »** : écoute vocale pulsée + transcription en
> effet machine à écrire + badge catégorie en fade-in ; « Lecture du reçu… » puis
> surbrillance du montant ; « Génération de votre dossier… » avant le PDF.

### Données de démonstration (seed)
Profil pré-chargé : **Awa, vendeuse de jus, Bobo-Dioulasso**, avec **30 jours**
de transactions réalistes (ventes variables, pics le week-end, achats de stock,
transport, dettes clients). Tout est parlant dès l'ouverture du dashboard.

---

## 🧱 Stack technique

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS**
- **recharts** (graphique 30 jours)
- **jsPDF** (génération PDF côté client)
- **Aucune base de données** : store en mémoire + `localStorage` côté client
- **Aucune authentification** (démo)

> Accent de marque : **vert-bleu `#1B5E5A`**.

---

## 🚀 Lancer en local

```bash
npm install
npm run dev
```

Ouvrir <http://localhost:3000>.

> 💡 La saisie vocale (Web Speech API) fonctionne mieux sur **Chrome** et requiert
> l'autorisation du microphone. Le mode *dioula* écoute en français puis mappe une
> liste fixe de mots-clés (« vocabulaire restreint — démo »), assumé tel quel.

---

## ☁️ Déploiement Vercel → lien public

### Option A — En une commande (CLI)

```bash
# 1. Installer la CLI Vercel (une seule fois)
npm i -g vercel

# 2. Se connecter
vercel login

# 3. Déployer un aperçu (lien public immédiat)
vercel

# 4. Déployer en production (URL définitive à présenter au jury)
vercel --prod
```

À la fin de `vercel --prod`, la CLI affiche l'**URL publique** de type
`https://axinafa-ai.vercel.app` : c'est le lien à partager.

> Aucune variable d'environnement n'est nécessaire (pas de DB, pas de clé API).
> Vercel détecte automatiquement Next.js — aucune configuration supplémentaire.

### Option B — Via GitHub (déploiement automatique)

```bash
git init && git add -A && git commit -m "AxiNafa AI — prototype STIC'26"
git branch -M main
git remote add origin https://github.com/<vous>/axinafa-ai.git
git push -u origin main
```

Puis sur <https://vercel.com/new> : **Import** du dépôt → **Deploy**.
Chaque `git push` redéploie automatiquement et fournit une URL publique.

---

## 🔌 Brancher un vrai LLM plus tard (Mistral)

La catégorisation et le résumé fonctionnent **par règles** pour la démo
(déterministe, hors-ligne, sans clé). Les points d'extension sont commentés :

- `lib/categorize.ts` → fonction `categorize()` + bloc `// TODO LLM` avec exemple
  d'appel `categorizeWithLLM()` vers l'API Mistral.
- `lib/summary.ts` → bloc `// TODO LLM` pour un résumé génératif.

Stratégie recommandée : exécuter les **règles d'abord** et n'appeler le LLM qu'en
cas de **faible confiance**, depuis une **route API Next.js** (ne jamais exposer la
clé côté client).

---

## 📁 Structure

```
app/
  page.tsx              # Page d'accueil (problème / solution / impact)
  dashboard/page.tsx    # Tableau de bord (cœur de la démo)
  layout.tsx, globals.css
components/
  Logo, StatCard, SalesChart, TransactionList,
  AISummary, ConfidenceCard, AddTransaction
lib/
  types.ts              # Modèles partagés + libellés/couleurs
  format.ts             # Formatage FCFA + dates FR
  categorize.ts         # Catégorisation par règles (+ TODO LLM)
  summary.ts            # Métriques + résumé par règles
  score.ts              # Pré-score explicable
  seed.ts               # 30 jours de données (Awa)
  store.ts              # Persistance localStorage / reset
  pdf.ts                # Dossier de financement jsPDF
types/speech.d.ts       # Typage Web Speech API
```

---

## ⚠️ Avertissement

Prototype de démonstration à **données fictives**. Le pré-score de confiance est
**indicatif** : il constitue une preuve d'activité et **ne remplace pas, n'engage
pas** la décision d'une institution financière, seule juge de l'octroi du crédit.
