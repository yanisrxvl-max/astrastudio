const { GoogleGenAI } = require("@google/genai");

const { config } = require("../config/env");
const { sanitizeText } = require("../utils/sanitize");

const WEBSITE_AUDIT_SYSTEM_PROMPT = `
Tu es Astra Signal, moteur de pré-audit digital d'Astra Studio.

Ta mission :
- analyser rapidement une URL de marque
- produire une lecture concise, crédible et utile
- rester professionnel, sans promesse miracle

Tu dois répondre uniquement en JSON valide avec ce schéma exact :
{
  "score": 0-100,
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "recommendations": ["...", "...", "..."],
  "verdict": "...",
  "suggested_offer": "SPARK" | "SIGNATURE" | "SCALE"
}

Contraintes :
- ton premium, sobre, orienté business
- pas de jargon inutile
- pas de formulation agressive
- pas de claims non vérifiables
`.trim();

const WEBSITE_AUDIT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "score",
    "strengths",
    "weaknesses",
    "recommendations",
    "verdict",
    "suggested_offer",
  ],
  properties: {
    score: {
      type: "integer",
      minimum: 0,
      maximum: 100,
    },
    strengths: {
      type: "array",
      minItems: 2,
      maxItems: 2,
      items: {
        type: "string",
        minLength: 6,
        maxLength: 160,
      },
    },
    weaknesses: {
      type: "array",
      minItems: 2,
      maxItems: 2,
      items: {
        type: "string",
        minLength: 6,
        maxLength: 160,
      },
    },
    recommendations: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "string",
        minLength: 8,
        maxLength: 200,
      },
    },
    verdict: {
      type: "string",
      minLength: 12,
      maxLength: 220,
    },
    suggested_offer: {
      type: "string",
      enum: ["SPARK", "SIGNATURE", "SCALE"],
    },
  },
};

function sanitizeModelText(value) {
  return String(value || "")
    .replace(/^```json\s*/iu, "")
    .replace(/^```\s*/u, "")
    .replace(/```$/u, "")
    .trim();
}

function parseModelJsonResponse(response) {
  const modelText = sanitizeModelText(response?.text);

  if (!modelText) {
    throw new Error("Réponse IA vide.");
  }

  try {
    return JSON.parse(modelText);
  } catch (error) {
    const firstBrace = modelText.indexOf("{");
    const lastBrace = modelText.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(modelText.slice(firstBrace, lastBrace + 1));
    }

    throw error;
  }
}

function normalizeAudit(raw = {}) {
  const score = Math.max(0, Math.min(100, Number.parseInt(raw.score, 10) || 0));
  const strengths = Array.isArray(raw.strengths) ? raw.strengths.slice(0, 2) : [];
  const weaknesses = Array.isArray(raw.weaknesses) ? raw.weaknesses.slice(0, 2) : [];
  const recommendations = Array.isArray(raw.recommendations)
    ? raw.recommendations.slice(0, 3)
    : [];
  const suggestedOffer = ["SPARK", "SIGNATURE", "SCALE"].includes(raw.suggested_offer)
    ? raw.suggested_offer
    : "SIGNATURE";

  return {
    score,
    strengths:
      strengths.length === 2
        ? strengths.map((value) => sanitizeText(value, { max: 160, multiline: true }))
        : ["Positionnement de marque identifiable.", "Base éditoriale déjà exploitable."],
    weaknesses:
      weaknesses.length === 2
        ? weaknesses.map((value) => sanitizeText(value, { max: 160, multiline: true }))
        : ["Hiérarchie de message encore inégale.", "Conversion peu guidée sur les points clés."],
    recommendations:
      recommendations.length === 3
        ? recommendations.map((value) => sanitizeText(value, { max: 200, multiline: true }))
        : [
            "Clarifier la promesse principale au-dessus de la ligne de flottaison.",
            "Structurer des preuves concrètes par offre et par segment client.",
            "Renforcer les CTA de conversion avec une logique de parcours plus nette.",
          ],
    verdict:
      sanitizeText(raw.verdict, { max: 220, multiline: true }) ||
      "Le potentiel est réel, mais la structure éditoriale et conversion doit être resserrée.",
    suggested_offer: suggestedOffer,
  };
}

function buildFallbackAudit(reason = "") {
  const reasonSnippet = sanitizeText(reason, { max: 120, multiline: true });

  return {
    score: 72,
    strengths: [
      "Univers de marque premium déjà perceptible.",
      "Base de contenu exploitable pour accélérer la traction.",
    ],
    weaknesses: [
      "Proposition de valeur encore trop diffuse sur certaines sections.",
      "Parcours de conversion pas assez lisible de bout en bout.",
    ],
    recommendations: [
      "Resserrer les messages clés en priorisant la clarté commerciale.",
      "Aligner les preuves, cas clients et CTA sur chaque page stratégique.",
      "Standardiser les blocs critiques pour un rendu plus homogène et plus crédible.",
    ],
    verdict: "Base solide, mais la lisibilité business peut être nettement renforcée.",
    suggested_offer: "SIGNATURE",
    transparency_note: reasonSnippet
      ? `Pré-audit de secours (IA indisponible temporairement : ${reasonSnippet}).`
      : "Pré-audit de secours (IA indisponible temporairement).",
  };
}

async function analyzeWebsite(url) {
  try {
    if (!config.ai.apiKey) {
      throw new Error("Clé Gemini absente côté serveur.");
    }

    const ai = new GoogleGenAI({ apiKey: config.ai.apiKey });
    const response = await Promise.race([
      ai.models.generateContent({
        model: config.ai.model,
        contents: `Analyse ce site web : ${url}`,
        config: {
          systemInstruction: WEBSITE_AUDIT_SYSTEM_PROMPT,
          temperature: 0.2,
          maxOutputTokens: 800,
          responseMimeType: "application/json",
          responseJsonSchema: WEBSITE_AUDIT_SCHEMA,
          thinkingConfig: {
            thinkingBudget: 0,
          },
        },
      }),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Timeout Gemini")), config.ai.timeoutMs);
      }),
    ]);

    return normalizeAudit(parseModelJsonResponse(response));
  } catch (error) {
    const safeError = sanitizeText(error?.message || "Erreur IA", {
      max: 140,
      multiline: true,
    });
    console.warn("[Astra Signal] Fallback audit activé:", safeError);
    return buildFallbackAudit(safeError);
  }
}

module.exports = { analyzeWebsite };
