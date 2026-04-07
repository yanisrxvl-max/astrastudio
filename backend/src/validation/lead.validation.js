const { normalizeOptional, sanitizeText } = require("../utils/sanitize");

const LEAD_STATUSES = ["new", "contacted", "quote_sent", "won", "lost"];
const FOLLOW_UP_STATUSES = ["none", "to_follow", "waiting_reply", "closed"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function toInteger(value, fallback = 0) {
  const number = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(number) ? Math.max(0, number) : fallback;
}

function validateLeadPayload(payload) {
  const errors = {};

  const values = {
    name: sanitizeText(payload.name, { max: 80 }),
    email: sanitizeText(payload.email, { max: 160 }).toLowerCase(),
    company: sanitizeText(payload.company, { max: 120 }),
    website_or_instagram: normalizeOptional(payload.website_or_instagram || payload.website, {
      max: 220,
    }),
    phone: normalizeOptional(payload.phone, { max: 40 }),
    project_type: sanitizeText(payload.project_type, { max: 120 }),
    budget: sanitizeText(payload.budget, { max: 120 }),
    timeline: sanitizeText(payload.timeline, { max: 160 }),
    message: sanitizeText(payload.message, { max: 3000, multiline: true }),
    source: normalizeOptional(payload.source, { max: 180 }),
    estimated_budget_amount: toInteger(payload.estimated_budget_amount, 0),
    internal_notes: normalizeOptional(payload.internal_notes, { max: 3000, multiline: true }),
  };

  if (values.name.length < 2) {
    errors.name = "Merci d'indiquer votre nom.";
  }

  if (!EMAIL_PATTERN.test(values.email)) {
    errors.email = "Merci d'indiquer une adresse e-mail valide.";
  }

  if (values.company.length < 2) {
    errors.company = "Merci d'indiquer votre entreprise ou votre marque.";
  }

  if (!values.project_type) {
    errors.project_type = "Merci de sélectionner un type de projet.";
  }

  if (!values.budget) {
    errors.budget = "Merci d'indiquer un budget envisagé.";
  }

  if (!values.timeline) {
    errors.timeline = "Merci d'indiquer un timing souhaité.";
  }

  if (values.message.length < 20) {
    errors.message = "Merci de donner un peu plus de contexte sur le projet.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    values,
    errors,
  };
}

function validateLeadUpdatePayload(payload) {
  const errors = {};
  const values = {};

  if (typeof payload.status !== "undefined") {
    const status = sanitizeText(payload.status, { max: 40 });

    if (!LEAD_STATUSES.includes(status)) {
      errors.status = "Statut invalide.";
    } else {
      values.status = status;
    }
  }

  if (typeof payload.internal_notes !== "undefined") {
    values.internal_notes = sanitizeText(payload.internal_notes, {
      max: 3000,
      multiline: true,
    });
  }

  if (typeof payload.estimated_budget_amount !== "undefined") {
    values.estimated_budget_amount = toInteger(payload.estimated_budget_amount, 0);
  }

  if (typeof payload.quote_sent_at !== "undefined") {
    values.quote_sent_at = normalizeOptional(payload.quote_sent_at, { max: 40 });
  }

  if (typeof payload.last_contact_at !== "undefined") {
    values.last_contact_at = normalizeOptional(payload.last_contact_at, { max: 40 });
  }

  if (typeof payload.next_follow_up_at !== "undefined") {
    values.next_follow_up_at = normalizeOptional(payload.next_follow_up_at, { max: 40 });
  }

  if (typeof payload.follow_up_status !== "undefined") {
    const followUpStatus = sanitizeText(payload.follow_up_status, { max: 40 });

    if (!FOLLOW_UP_STATUSES.includes(followUpStatus)) {
      errors.follow_up_status = "Statut de relance invalide.";
    } else {
      values.follow_up_status = followUpStatus;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    values,
    errors,
  };
}

module.exports = {
  FOLLOW_UP_STATUSES,
  LEAD_STATUSES,
  validateLeadPayload,
  validateLeadUpdatePayload,
};
