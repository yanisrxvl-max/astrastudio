const { normalizeOptional, sanitizeText } = require("../utils/sanitize");

const PROJECT_STATUSES = [
  "draft",
  "planned",
  "in_progress",
  "waiting_feedback",
  "delivered",
  "archived",
  "cancelled",
];

const CLIENT_STATUSES = ["prospect", "onboarding", "active", "paused", "archived"];
const PROJECT_PRIORITIES = ["low", "normal", "high", "urgent"];

function toInteger(value, fallback = 0) {
  const number = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(number) ? Math.max(0, number) : fallback;
}

function validateClientPayload(payload) {
  const errors = {};
  const values = {
    lead_id: normalizeOptional(payload.lead_id, { max: 80 }),
    contact_name: sanitizeText(payload.contact_name, { max: 120 }),
    company: sanitizeText(payload.company, { max: 120 }),
    email: sanitizeText(payload.email, { max: 160 }).toLowerCase(),
    phone: normalizeOptional(payload.phone, { max: 40 }),
    website: normalizeOptional(payload.website, { max: 220 }),
    instagram: normalizeOptional(payload.instagram, { max: 220 }),
    client_type: sanitizeText(payload.client_type, { max: 80 }) || "brand",
    status: sanitizeText(payload.status, { max: 40 }) || "active",
    estimated_value: toInteger(payload.estimated_value, 0),
    useful_links: sanitizeText(payload.useful_links, { max: 2000, multiline: true }),
    notes: sanitizeText(payload.notes, { max: 4000, multiline: true }),
    collaboration_history: sanitizeText(payload.collaboration_history, {
      max: 4000,
      multiline: true,
    }),
    last_contact_at: normalizeOptional(payload.last_contact_at, { max: 40 }),
  };

  if (values.contact_name.length < 2) {
    errors.contact_name = "Merci d'indiquer un contact.";
  }

  if (values.company.length < 2) {
    errors.company = "Merci d'indiquer le nom du client ou de la marque.";
  }

  if (!values.email) {
    errors.email = "Merci d'indiquer une adresse e-mail.";
  }

  if (!CLIENT_STATUSES.includes(values.status)) {
    errors.status = "Statut client invalide.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    values,
  };
}

function validateProjectPayload(payload) {
  const errors = {};
  const values = {
    client_id: sanitizeText(payload.client_id, { max: 80 }),
    name: sanitizeText(payload.name, { max: 160 }),
    mission_type: sanitizeText(payload.mission_type, { max: 120 }),
    status: sanitizeText(payload.status, { max: 40 }) || "draft",
    priority: sanitizeText(payload.priority, { max: 20 }) || "normal",
    start_date: normalizeOptional(payload.start_date, { max: 40 }),
    deadline: normalizeOptional(payload.deadline, { max: 40 }),
    budget: toInteger(payload.budget, 0),
    description: sanitizeText(payload.description, { max: 4000, multiline: true }),
    deliverables: sanitizeText(payload.deliverables, { max: 4000, multiline: true }),
    useful_links: sanitizeText(payload.useful_links, { max: 2000, multiline: true }),
    notes: sanitizeText(payload.notes, { max: 4000, multiline: true }),
  };

  if (!values.client_id) {
    errors.client_id = "Merci de lier le projet à un client.";
  }

  if (values.name.length < 2) {
    errors.name = "Merci d'indiquer le nom du projet.";
  }

  if (!values.mission_type) {
    errors.mission_type = "Merci d'indiquer le type de mission.";
  }

  if (!PROJECT_STATUSES.includes(values.status)) {
    errors.status = "Statut projet invalide.";
  }

  if (!PROJECT_PRIORITIES.includes(values.priority)) {
    errors.priority = "Priorité invalide.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    values,
  };
}

function validateDocumentPayload(payload) {
  const errors = {};
  const values = {
    client_id: normalizeOptional(payload.client_id, { max: 80 }),
    project_id: normalizeOptional(payload.project_id, { max: 80 }),
    title: sanitizeText(payload.title, { max: 180 }),
    category: sanitizeText(payload.category, { max: 80 }),
    document_type: sanitizeText(payload.document_type, { max: 40 }) || "file",
    file_url: normalizeOptional(payload.file_url, { max: 280 }),
    description: sanitizeText(payload.description, { max: 3000, multiline: true }),
    tags: sanitizeText(payload.tags, { max: 300 }),
    issued_at: normalizeOptional(payload.issued_at, { max: 40 }),
  };

  if (values.title.length < 2) {
    errors.title = "Merci d'indiquer un titre de document.";
  }

  if (!values.category) {
    errors.category = "Merci d'indiquer une catégorie.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    values,
  };
}

function validateMediaPayload(payload) {
  const errors = {};
  const values = {
    client_id: normalizeOptional(payload.client_id, { max: 80 }),
    project_id: normalizeOptional(payload.project_id, { max: 80 }),
    title: sanitizeText(payload.title, { max: 180 }),
    media_type: sanitizeText(payload.media_type, { max: 40 }),
    preview_url: normalizeOptional(payload.preview_url, { max: 280 }),
    asset_url: normalizeOptional(payload.asset_url, { max: 280 }),
    tags: sanitizeText(payload.tags, { max: 300 }),
    description: sanitizeText(payload.description, { max: 3000, multiline: true }),
    captured_at: normalizeOptional(payload.captured_at, { max: 40 }),
  };

  if (values.title.length < 2) {
    errors.title = "Merci d'indiquer un titre de média.";
  }

  if (!values.media_type) {
    errors.media_type = "Merci d'indiquer un type de média.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    values,
  };
}

function validateResourcePayload(payload) {
  const errors = {};
  const values = {
    name: sanitizeText(payload.name, { max: 160 }),
    category: sanitizeText(payload.category, { max: 80 }),
    url: normalizeOptional(payload.url, { max: 280 }),
    description: sanitizeText(payload.description, { max: 3000, multiline: true }),
    usage_notes: sanitizeText(payload.usage_notes, { max: 3000, multiline: true }),
    tags: sanitizeText(payload.tags, { max: 300 }),
  };

  if (values.name.length < 2) {
    errors.name = "Merci d'indiquer un nom de ressource.";
  }

  if (!values.category) {
    errors.category = "Merci d'indiquer une catégorie.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    values,
  };
}

module.exports = {
  CLIENT_STATUSES,
  PROJECT_PRIORITIES,
  PROJECT_STATUSES,
  validateClientPayload,
  validateDocumentPayload,
  validateMediaPayload,
  validateProjectPayload,
  validateResourcePayload,
};
