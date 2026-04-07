const { GoogleGenAI } = require("@google/genai");

const { config } = require("../config/env");
const { sanitizeText } = require("../utils/sanitize");

const DIAGNOSTIC_SYSTEM_PROMPT = `
Tu es le moteur d'analyse stratégique d'Astra Studio.

Tu analyses les réponses d'un prospect à un diagnostic de présence digitale, de contenu, de marque personnelle et de maturité business.

Ta mission :
- produire une lecture claire, premium, concise et utile
- identifier le niveau de maturité
- relever les forces
- identifier les principaux blocages
- recommander la suite la plus logique

Contraintes :
- ton premium, crédible, intelligent
- pas de flatterie excessive
- pas de promesse magique
- pas de manipulation
- pas de langage cheap
- pas de jargon inutile
- pas de diagnostic médical ou psychologique
- rester focalisé sur : image, contenu, positionnement, système, exécution, business

Tu dois répondre uniquement en JSON valide avec les champs suivants :
- profile_name
- profile_summary
- strengths
- blockers
- priority
- recommended_path
- cta_title
- cta_text

Valeurs autorisées pour recommended_path :
- formation
- agence
- audit_premium

Le résultat doit être court, clair, précis et actionnable.
`.trim();

const DIAGNOSTIC_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "profile_name",
    "profile_summary",
    "strengths",
    "blockers",
    "priority",
    "recommended_path",
    "cta_title",
    "cta_text",
  ],
  properties: {
    profile_name: {
      type: "string",
      minLength: 6,
      maxLength: 80,
    },
    profile_summary: {
      type: "string",
      minLength: 80,
      maxLength: 430,
    },
    strengths: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "string",
        minLength: 8,
        maxLength: 140,
      },
    },
    blockers: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "string",
        minLength: 8,
        maxLength: 140,
      },
    },
    priority: {
      type: "string",
      minLength: 18,
      maxLength: 180,
    },
    recommended_path: {
      type: "string",
      enum: ["formation", "agence", "audit_premium"],
    },
    cta_title: {
      type: "string",
      minLength: 8,
      maxLength: 80,
    },
    cta_text: {
      type: "string",
      minLength: 18,
      maxLength: 220,
    },
  },
};

const CTA_BY_PATH = {
  formation: {
    href: "formations.html",
    secondary_href: "contact.html?intent=formation",
  },
  agence: {
    href: "contact.html?intent=agence",
    secondary_href: "work.html",
  },
  audit_premium: {
    href: "contact.html?intent=audit-premium",
    secondary_href: "results.html",
  },
};

const RECOMMENDATION_BY_PATH = {
  formation:
    "Structurer une base méthodique claire avant d'augmenter la cadence et la complexité.",
  agence:
    "Prioriser une exécution encadrée pour accélérer sans dilution de l'image ni surcharge interne.",
  audit_premium:
    "Conduire un cadrage stratégique avancé pour arbitrer les leviers avant déploiement.",
};

const CTA_TITLE_FALLBACK_BY_PATH = {
  formation: "Voir le parcours formation",
  agence: "Parler du projet agence",
  audit_premium: "Demander un audit premium",
};

const CTA_TEXT_FALLBACK_BY_PATH = {
  formation:
    "Recevez un plan de progression cadré pour structurer vos contenus et votre positionnement.",
  agence:
    "Définissons un cadre d'exécution premium pour transformer votre présence en traction mesurable.",
  audit_premium:
    "Planifions un audit premium pour hiérarchiser vos leviers de croissance image + performance.",
};

function normalizeList(values, maxItems, fallbackList, maxLength) {
  const cleaned = Array.isArray(values)
    ? values
        .map((value) => sanitizeText(value, { max: maxLength, multiline: true }))
        .filter(Boolean)
        .slice(0, maxItems)
    : [];

  if (cleaned.length === maxItems) {
    return cleaned;
  }

  return fallbackList.slice(0, maxItems);
}

function normalizeRecommendedPath(value) {
  const sanitized = sanitizeText(value, { max: 40 }).toLowerCase();

  if (["formation", "agence", "audit_premium"].includes(sanitized)) {
    return sanitized;
  }

  return "audit_premium";
}

function buildUserPrompt(responses = []) {
  const lines = responses.map((response, index) => {
    return `${index + 1}. ${response.question_label}\nRéponse: ${response.answer_label}`;
  });

  return [
    "Pré-diagnostic Astra Signal.",
    "Analyse les réponses suivantes et retourne le JSON strict demandé.",
    "",
    "Réponses du participant:",
    ...lines,
  ].join("\n");
}

function sanitizeModelText(value) {
  const text = String(value || "").trim();
  return text
    .replace(/^```json\s*/iu, "")
    .replace(/^```\s*/u, "")
    .replace(/```$/u, "")
    .trim();
}

function parseGeminiJsonResponse(response) {
  const candidateText = sanitizeModelText(response?.text);

  if (!candidateText) {
    throw new Error("Réponse Gemini vide.");
  }

  try {
    return JSON.parse(candidateText);
  } catch (error) {
    const firstBrace = candidateText.indexOf("{");
    const lastBrace = candidateText.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const objectLike = candidateText.slice(firstBrace, lastBrace + 1);
      return JSON.parse(objectLike);
    }

    throw error;
  }
}

function getAnswerById(responses, questionId) {
  return responses.find((response) => response.question_id === questionId) || null;
}

function pickRecommendedPathFromResponses(responses = []) {
  const supportMode = getAnswerById(responses, "support_mode")?.answer_value || "";
  const budgetRange = getAnswerById(responses, "budget_range")?.answer_value || "";
  const weeklyTime = getAnswerById(responses, "weekly_time")?.answer_value || "";

  if (supportMode === "done_for_you") {
    return "agence";
  }

  if (supportMode === "audit") {
    return "audit_premium";
  }

  if (supportMode === "autonomy") {
    return "formation";
  }

  if (budgetRange === "gt10k" || (budgetRange === "5_10k" && weeklyTime === "lt3")) {
    return "agence";
  }

  if (weeklyTime === "lt3") {
    return "audit_premium";
  }

  return "formation";
}

function buildFallbackAnalysis(responses = [], reason = "") {
  const recommendedPath = pickRecommendedPathFromResponses(responses);
  const ctaMeta = CTA_BY_PATH[recommendedPath] || CTA_BY_PATH.audit_premium;
  const fallbackNameByPath = {
    formation: "Fondation à structurer",
    agence: "Accélération pilotée",
    audit_premium: "Arbitrage stratégique",
  };

  const blockerFromQuiz =
    getAnswerById(responses, "main_blocker")?.answer_label || "Absence de système éditorial stable.";
  const strengthFromQuiz =
    getAnswerById(responses, "positioning_clarity")?.answer_label || "Volonté de structurer la présence.";
  const goalFromQuiz =
    getAnswerById(responses, "primary_goal")?.answer_label || "Objectif de croissance plus lisible.";
  const reasonSnippet = sanitizeText(reason, { max: 180, multiline: true });

  return {
    profile_name: fallbackNameByPath[recommendedPath],
    profile_summary:
      "Pré-diagnostic assisté par IA indisponible temporairement. Cette lecture de secours conserve les priorités essentielles entre image, contenu et performance.",
    strengths: normalizeList(
      [
        `Intention claire: ${goalFromQuiz}.`,
        `Niveau de clarté déclaré: ${strengthFromQuiz}.`,
        "Volonté d'améliorer la présence digitale.",
      ],
      3,
      [
        "Base de communication déjà active.",
        "Potentiel de différenciation visible.",
        "Capacité à créer des contenus utiles.",
      ],
      140
    ),
    blockers: normalizeList(
      [
        `Blocage principal déclaré: ${blockerFromQuiz}.`,
        "Système de diffusion encore instable.",
        "Lien contenu → conversion à clarifier.",
      ],
      3,
      [
        "Positionnement encore trop diffus.",
        "Cadence de contenu peu prévisible.",
        "Conversion insuffisamment pilotée.",
      ],
      140
    ),
    priority:
      "Installer une trajectoire 90 jours simple: angle clair, formats répétables, indicateurs de traction utiles.",
    recommended_path: recommendedPath,
    cta_title: CTA_TITLE_FALLBACK_BY_PATH[recommendedPath],
    cta_text: CTA_TEXT_FALLBACK_BY_PATH[recommendedPath],
    cta: {
      label: CTA_TITLE_FALLBACK_BY_PATH[recommendedPath],
      href: ctaMeta.href,
      secondary_href: ctaMeta.secondary_href,
    },
    recommendation: RECOMMENDATION_BY_PATH[recommendedPath],
    profile_type: recommendedPath,
    strategic_summary:
      "Lecture de secours générée localement pour préserver l'expérience. Les recommandations restent alignées avec Astra Studio.",
    transparency_note: reasonSnippet
      ? `Pré-diagnostic de secours. Motif: ${reasonSnippet}`
      : "Pré-diagnostic de secours. L'analyse Gemini est momentanément indisponible.",
    model: "fallback_local",
  };
}

function normalizeDiagnosticResult(raw = {}) {
  const recommendedPath = normalizeRecommendedPath(raw.recommended_path);
  const ctaMeta = CTA_BY_PATH[recommendedPath] || CTA_BY_PATH.audit_premium;
  const fallbackNameByPath = {
    formation: "Base à structurer",
    agence: "Traction à industrialiser",
    audit_premium: "Potentiel à arbitrer",
  };

  const profileSummary =
    sanitizeText(raw.profile_summary, { max: 430, multiline: true }) ||
    "Votre présence montre un potentiel réel, mais l'effet business dépend d'un meilleur alignement entre image, contenu et exécution.";
  const ctaTitle =
    sanitizeText(raw.cta_title, { max: 80, multiline: true }) ||
    CTA_TITLE_FALLBACK_BY_PATH[recommendedPath];
  const ctaText =
    sanitizeText(raw.cta_text, { max: 220, multiline: true }) ||
    CTA_TEXT_FALLBACK_BY_PATH[recommendedPath];

  return {
    profile_name:
      sanitizeText(raw.profile_name, { max: 80, multiline: true }) || fallbackNameByPath[recommendedPath],
    profile_summary: profileSummary,
    strengths: normalizeList(
      raw.strengths,
      3,
      [
        "Base de communication déjà active.",
        "Potentiel de différenciation visible.",
        "Capacité à créer des contenus utiles.",
      ],
      140
    ),
    blockers: normalizeList(
      raw.blockers,
      3,
      [
        "Positionnement encore trop diffus.",
        "Cadence de contenu peu prévisible.",
        "Conversion insuffisamment pilotée.",
      ],
      140
    ),
    priority:
      sanitizeText(raw.priority, { max: 180, multiline: true }) ||
      "Installer un plan éditorial priorisé sur 90 jours avec un angle clair et des formats répétables.",
    recommended_path: recommendedPath,
    cta_title: ctaTitle,
    cta_text: ctaText,
    cta: {
      label: ctaTitle,
      href: ctaMeta.href,
      secondary_href: ctaMeta.secondary_href,
    },
    recommendation: RECOMMENDATION_BY_PATH[recommendedPath],
    profile_type: recommendedPath,
    strategic_summary: profileSummary,
    transparency_note:
      "Pré-diagnostic assisté par IA. La recommandation finale est confirmée après revue stratégique Astra Studio.",
  };
}

async function requestGeminiAnalysis({ responses }) {
  if (!config.ai.apiKey) {
    throw new Error("GEMINI_API_KEY manquante côté serveur.");
  }

  const ai = new GoogleGenAI({ apiKey: config.ai.apiKey });

  const response = await Promise.race([
    ai.models.generateContent({
      model: config.ai.model,
      contents: buildUserPrompt(responses),
      config: {
        systemInstruction: DIAGNOSTIC_SYSTEM_PROMPT,
        temperature: 0.25,
        maxOutputTokens: 900,
        responseMimeType: "application/json",
        responseJsonSchema: DIAGNOSTIC_JSON_SCHEMA,
        thinkingConfig: {
          thinkingBudget: 0,
        },
      },
    }),
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("Timeout Gemini"));
      }, config.ai.timeoutMs);
    }),
  ]);

  return parseGeminiJsonResponse(response);
}

async function analyzeDiagnosticResponses({ responses }) {
  try {
    const parsed = await requestGeminiAnalysis({ responses });
    const normalized = normalizeDiagnosticResult(parsed);

    return {
      ...normalized,
      model: config.ai.model,
    };
  } catch (error) {
    const message = sanitizeText(error?.message || "Erreur Gemini", {
      max: 180,
      multiline: true,
    });

    console.warn("[Astra Studio] Fallback diagnostic actif:", message);
    return buildFallbackAnalysis(responses, message);
  }
}

module.exports = {
  DIAGNOSTIC_JSON_SCHEMA,
  DIAGNOSTIC_SYSTEM_PROMPT,
  analyzeDiagnosticResponses,
};
