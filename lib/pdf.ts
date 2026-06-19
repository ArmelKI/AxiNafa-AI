// Génération du "dossier de financement" en PDF, côté client, avec jsPDF.
// Aucune dépendance serveur : le PDF est produit dans le navigateur et téléchargé.

import { jsPDF } from "jspdf";
import { MerchantProfile } from "./types";
import { Metrics } from "./summary";
import { ConfidenceScore } from "./score";
import { formatFCFA, formatDayLong } from "./format";

interface DossierInput {
  profile: MerchantProfile;
  metrics: Metrics;
  score: ConfidenceScore;
  summary: string[];
  periodeDebut: string;
  periodeFin: string;
}

const BRAND = { r: 27, g: 94, b: 90 }; // #1B5E5A

export function genererDossierPDF(input: DossierInput): void {
  const { profile, metrics, score, summary, periodeDebut, periodeFin } = input;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 18;
  let y = 0;

  // --- En-tête bandeau marque ---------------------------------------------
  doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
  doc.rect(0, 0, pageW, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("AxiNafa AI", margin, 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Transformer l'activite informelle en preuve de confiance.", margin, 23);
  y = 42;

  // --- Titre ---------------------------------------------------------------
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("Dossier de financement", margin, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110, 110, 110);
  doc.text(
    `Genere le ${formatDayLong(new Date().toISOString().slice(0, 10))}`,
    margin,
    y
  );
  y += 10;

  // --- Section : identite de l'activite -----------------------------------
  y = sectionTitle(doc, "Identite de l'activite", margin, y);
  y = kv(doc, "Commercant", profile.name, margin, y);
  y = kv(doc, "Activite", profile.activity, margin, y);
  y = kv(doc, "Localite", profile.city, margin, y);
  y = kv(doc, "Debut d'activite", formatDayLong(profile.since), margin, y);
  y = kv(
    doc,
    "Periode analysee",
    `du ${formatDayLong(periodeDebut)} au ${formatDayLong(periodeFin)}`,
    margin,
    y
  );
  y += 4;

  // --- Section : indicateurs financiers -----------------------------------
  y = sectionTitle(doc, "Indicateurs financiers (FCFA)", margin, y);
  y = kv(doc, "Chiffre d'affaires (ventes)", formatFCFA(metrics.totalVentes), margin, y);
  y = kv(doc, "Depenses totales", formatFCFA(metrics.totalDepenses), margin, y);
  y = kv(doc, "Benefice estime", formatFCFA(metrics.beneficeEstime), margin, y);
  y = kv(doc, "Jours d'activite", `${metrics.nbJoursActifs} jours`, margin, y);
  if (metrics.dettesEnCours > 0) {
    y = kv(doc, "Credits clients en cours", formatFCFA(metrics.dettesEnCours), margin, y);
  }
  y += 4;

  // --- Section : pre-score explicable -------------------------------------
  y = sectionTitle(doc, "Pre-score de confiance (indicatif)", margin, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(BRAND.r, BRAND.g, BRAND.b);
  doc.text(`${score.total}/100`, margin, y + 4);
  doc.setFontSize(11);
  doc.text(`Niveau : ${score.niveau}`, margin + 40, y + 4);
  y += 12;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  for (const f of score.factors) {
    doc.setFont("helvetica", "bold");
    doc.text(
      `- ${f.label} : ${Math.round(f.note)}/100 (poids ${Math.round(
        f.poids * 100
      )}%)`,
      margin,
      y
    );
    y += 4.5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(110, 110, 110);
    const lines = doc.splitTextToSize(f.detail, pageW - margin * 2 - 4);
    doc.text(lines, margin + 4, y);
    y += lines.length * 4.2 + 2;
    doc.setTextColor(60, 60, 60);
  }
  y += 2;

  // --- Section : synthese IA ----------------------------------------------
  y = checkPage(doc, y, 40, margin);
  y = sectionTitle(doc, "Synthese de l'activite", margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  for (const phrase of summary) {
    const lines = doc.splitTextToSize(`- ${phrase}`, pageW - margin * 2);
    y = checkPage(doc, y, lines.length * 4.5, margin);
    doc.text(lines, margin, y);
    y += lines.length * 4.5 + 1;
  }
  y += 4;

  // --- Section : recommandation -------------------------------------------
  y = checkPage(doc, y, 30, margin);
  doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
  doc.setDrawColor(BRAND.r, BRAND.g, BRAND.b);
  doc.roundedRect(margin, y, pageW - margin * 2, 18, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Montant de financement conseille :", margin + 4, y + 7);
  doc.setFontSize(14);
  doc.text(formatFCFA(score.financementConseille), margin + 4, y + 14);
  y += 24;

  // --- Avertissement -------------------------------------------------------
  doc.setTextColor(120, 120, 120);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  const disclaimer =
    "Document genere par AxiNafa AI a partir des donnees declarees par le " +
    "commercant. Il constitue une preuve d'activite et un pre-score indicatif : " +
    "il ne remplace pas et n'engage pas la decision d'une institution financiere, " +
    "qui reste seule juge de l'octroi du financement.";
  const dlines = doc.splitTextToSize(disclaimer, pageW - margin * 2);
  y = checkPage(doc, y, dlines.length * 4, margin);
  doc.text(dlines, margin, y);

  // --- Pied de page --------------------------------------------------------
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    "AxiNafa AI - prototype STIC'26",
    pageW / 2,
    doc.internal.pageSize.getHeight() - 8,
    { align: "center" }
  );

  const fileName = `dossier-financement-${profile.name.toLowerCase()}.pdf`;
  doc.save(fileName);
}

// --- Helpers de mise en page -----------------------------------------------

function sectionTitle(doc: jsPDF, text: string, margin: number, y: number): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(BRAND.r, BRAND.g, BRAND.b);
  doc.text(text, margin, y);
  doc.setDrawColor(BRAND.r, BRAND.g, BRAND.b);
  doc.setLineWidth(0.4);
  doc.line(margin, y + 1.5, margin + 40, y + 1.5);
  return y + 8;
}

function kv(doc: jsPDF, key: string, value: string, margin: number, y: number): number {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(110, 110, 110);
  doc.text(`${key} :`, margin, y);
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  const lines = doc.splitTextToSize(value, 110);
  doc.text(lines, margin + 55, y);
  return y + Math.max(6, lines.length * 5);
}

/** Saut de page si l'espace restant est insuffisant. */
function checkPage(doc: jsPDF, y: number, needed: number, margin: number): number {
  const pageH = doc.internal.pageSize.getHeight();
  if (y + needed > pageH - 15) {
    doc.addPage();
    return margin;
  }
  return y;
}
