"use client";

// Ajout intelligent d'une transaction — 3 modes :
//   a) texte   : saisie libre -> parsing + catégorisation par règles
//   b) voix    : Web Speech API (FR) + mode "dioula (vocabulaire restreint) (démo)"
//   c) photo   : upload de reçu -> OCR SIMULÉ (montant pré-rempli, éditable)
//
// À la validation, on construit une Transaction et on remonte au parent.

import { useRef, useState } from "react";
import {
  Transaction,
  Category,
  CATEGORY_LABELS,
} from "@/lib/types";
import {
  parseTransactionText,
  detectCategory,
  flowForCategory,
} from "@/lib/categorize";
import { parseDioula, DIOULA_VOCAB } from "@/lib/dioula";
import { newId } from "@/lib/store";
import { todayISO } from "@/lib/format";

type Mode = "texte" | "voix" | "photo";

interface Draft {
  label: string;
  amount: number;
  category: Category;
}

export function AddTransaction({
  onAdd,
  onClose,
}: {
  onAdd: (t: Transaction) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<Mode>("texte");

  // -- état commun du brouillon (toujours éditable avant validation) --------
  const [draft, setDraft] = useState<Draft>({
    label: "",
    amount: 0,
    category: "vente",
  });

  // -- mode texte ----------------------------------------------------------
  const [textInput, setTextInput] = useState("");
  const [parsedHint, setParsedHint] = useState<string | null>(null);

  function handleTextParse(value: string) {
    setTextInput(value);
    if (!value.trim()) {
      setParsedHint(null);
      return;
    }
    const r = parseTransactionText(value);
    setDraft({ label: r.label, amount: r.amount, category: r.category });
    setParsedHint(
      `Détecté : ${CATEGORY_LABELS[r.category]} · ${r.amount.toLocaleString(
        "fr-FR"
      )} FCFA (confiance ${Math.round(r.confidence * 100)} %)`
    );
  }

  // -- mode voix -----------------------------------------------------------
  const [voiceLang, setVoiceLang] = useState<"fr-FR" | "dioula">("fr-FR");
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recogRef = useRef<SpeechRecognitionLike | null>(null);

  function startVoice() {
    setVoiceError(null);
    const Ctor =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : undefined;
    if (!Ctor) {
      setVoiceError(
        "La reconnaissance vocale n'est pas disponible sur ce navigateur. Essayez Chrome."
      );
      return;
    }
    const recog = new Ctor();
    // Le dioula n'est pas supporté par les navigateurs : on écoute en français
    // puis on mappe les mots-clés (mode vocabulaire restreint).
    recog.lang = "fr-FR";
    recog.continuous = false;
    recog.interimResults = true;

    recog.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
      }
      setTranscript(text);
      applyVoiceTranscript(text);
    };
    recog.onerror = () => {
      setVoiceError("Erreur micro. Vérifiez l'autorisation du microphone.");
      setListening(false);
    };
    recog.onend = () => setListening(false);

    recogRef.current = recog;
    setListening(true);
    setTranscript("");
    recog.start();
  }

  function stopVoice() {
    recogRef.current?.stop();
    setListening(false);
  }

  function applyVoiceTranscript(text: string) {
    if (voiceLang === "dioula") {
      const d = parseDioula(text);
      const r = parseTransactionText(text); // pour récupérer un montant en chiffres FR
      const amount = d.amount || r.amount;
      const category = d.category ?? r.category;
      setDraft({
        label: d.motReconnu ? `Saisie dioula (${d.motReconnu})` : text || "Transaction",
        amount,
        category,
      });
    } else {
      const r = parseTransactionText(text);
      setDraft({ label: r.label, amount: r.amount, category: r.category });
    }
  }

  // -- mode photo (OCR simulé) ---------------------------------------------
  const [fileName, setFileName] = useState<string | null>(null);
  const [ocrRunning, setOcrRunning] = useState(false);

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setOcrRunning(true);
    // OCR SIMULÉ : on simule un délai d'analyse puis on pré-remplit un montant
    // plausible (éditable). En production : OCR réel (Tesseract / API vision).
    setTimeout(() => {
      const fakeAmount = 1500 + Math.floor(Math.random() * 12) * 500;
      setDraft({
        label: "Reçu : achat de stock",
        amount: fakeAmount,
        category: "achat_stock",
      });
      setOcrRunning(false);
    }, 1100);
  }

  // -- validation ----------------------------------------------------------
  function submit() {
    if (draft.amount <= 0) return;
    const flow = flowForCategory(draft.category);
    const t: Transaction = {
      id: newId(),
      date: todayISO(),
      label: draft.label.trim() || CATEGORY_LABELS[draft.category],
      amount: Math.abs(draft.amount),
      category: draft.category,
      flow,
      source: mode,
    };
    onAdd(t);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="app-shell animate-in max-h-[92vh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">
            Nouvelle transaction
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Sélecteur de mode */}
        <div className="mb-4 grid grid-cols-3 gap-2">
          {(
            [
              { k: "texte", label: "Texte", icon: "⌨️" },
              { k: "voix", label: "Voix", icon: "🎤" },
              { k: "photo", label: "Reçu", icon: "📷" },
            ] as { k: Mode; label: string; icon: string }[]
          ).map((m) => (
            <button
              key={m.k}
              onClick={() => setMode(m.k)}
              className={`flex flex-col items-center gap-1 rounded-xl border py-2.5 text-xs font-medium transition ${
                mode === m.k
                  ? "border-brand bg-brand-50 text-brand"
                  : "border-gray-200 text-gray-500"
              }`}
            >
              <span className="text-lg">{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>

        {/* --- Mode texte --- */}
        {mode === "texte" && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600">
              Décrivez la transaction
            </label>
            <input
              autoFocus
              value={textInput}
              onChange={(e) => handleTextParse(e.target.value)}
              placeholder='ex : "vente jus 5000" ou "achat stock 3000"'
              className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-100"
            />
            {parsedHint && (
              <p className="rounded-lg bg-brand-50 px-3 py-2 text-[12px] text-brand">
                {parsedHint}
              </p>
            )}
          </div>
        )}

        {/* --- Mode voix --- */}
        {mode === "voix" && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-600">
                Langue de saisie
              </label>
              <select
                value={voiceLang}
                onChange={(e) =>
                  setVoiceLang(e.target.value as "fr-FR" | "dioula")
                }
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand"
              >
                <option value="fr-FR">Français</option>
                <option value="dioula">Dioula — vocabulaire restreint (démo)</option>
              </select>
              {voiceLang === "dioula" && (
                <p className="mt-1 rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-snug text-amber-800">
                  Mode <strong>vocabulaire restreint (démo)</strong> : le
                  navigateur écoute en français, puis AxiNafa reconnaît une liste
                  fixe de mots-clés dioula ({DIOULA_VOCAB.map((d) => d.mot).join(", ")}).
                </p>
              )}
            </div>

            <button
              onClick={listening ? stopVoice : startVoice}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition ${
                listening ? "bg-red-500" : "bg-brand"
              }`}
            >
              {listening ? "● Écoute en cours… (toucher pour arrêter)" : "🎤 Parler"}
            </button>

            {transcript && (
              <p className="rounded-lg bg-gray-50 px-3 py-2 text-[12px] italic text-gray-600">
                « {transcript} »
              </p>
            )}
            {voiceError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-600">
                {voiceError}
              </p>
            )}
          </div>
        )}

        {/* --- Mode photo --- */}
        {mode === "photo" && (
          <div className="space-y-3">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 py-8 text-center text-sm text-gray-500 hover:border-brand">
              <span className="text-2xl">📷</span>
              <span>{fileName ?? "Prendre / choisir une photo du reçu"}</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhoto}
              />
            </label>
            {ocrRunning && (
              <p className="text-center text-[12px] text-brand">
                Analyse du reçu en cours… (OCR simulé)
              </p>
            )}
            <p className="text-center text-[11px] text-gray-400">
              OCR simulé pour la démo — le montant extrait reste éditable.
            </p>
          </div>
        )}

        {/* --- Brouillon éditable (commun aux 3 modes) --- */}
        <div className="mt-5 space-y-3 rounded-2xl bg-gray-50 p-3">
          <p className="text-xs font-semibold text-gray-500">
            Vérifier et corriger avant d&apos;enregistrer
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-gray-500">Montant (FCFA)</label>
              <input
                type="number"
                value={draft.amount || ""}
                onChange={(e) =>
                  setDraft({ ...draft, amount: parseInt(e.target.value, 10) || 0 })
                }
                className="mt-0.5 w-full rounded-lg border border-gray-200 px-2 py-2 text-sm outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="text-[11px] text-gray-500">Catégorie</label>
              <select
                value={draft.category}
                onChange={(e) =>
                  setDraft({ ...draft, category: e.target.value as Category })
                }
                className="mt-0.5 w-full rounded-lg border border-gray-200 px-2 py-2 text-sm outline-none focus:border-brand"
              >
                {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[11px] text-gray-500">Libellé</label>
            <input
              value={draft.label}
              onChange={(e) => setDraft({ ...draft, label: e.target.value })}
              placeholder="Description"
              className="mt-0.5 w-full rounded-lg border border-gray-200 px-2 py-2 text-sm outline-none focus:border-brand"
            />
          </div>
        </div>

        <button
          onClick={submit}
          disabled={draft.amount <= 0}
          className="mt-4 w-full rounded-xl bg-brand py-3 text-sm font-semibold text-white transition disabled:opacity-40"
        >
          Enregistrer la transaction
        </button>
      </div>
    </div>
  );
}
