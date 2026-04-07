const { sanitizeText } = require("../utils/sanitize");

const SUBMISSION_STATUSES = ["submitted", "pending_review", "validated", "revision_requested"];
const LESSON_PROGRESS_STATUSES = ["not_started", "in_progress", "completed"];
const COURSE_LEVELS = ["debutant", "intermediaire", "avance"];
const COURSE_STATUSES = ["draft", "published", "archived"];

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function validateStudentSignupPayload(payload = {}) {
  const errors = {};
  const values = {
    full_name: sanitizeText(payload.full_name, { max: 120 }),
    email: sanitizeText(payload.email, { max: 160 }).toLowerCase(),
    password: String(payload.password || ""),
  };

  if (values.full_name.length < 2) {
    errors.full_name = "Votre nom complet doit contenir au moins 2 caractères.";
  }

  if (!isEmail(values.email)) {
    errors.email = "Adresse e-mail invalide.";
  }

  if (values.password.length < 8) {
    errors.password = "Le mot de passe doit contenir au moins 8 caractères.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    values,
    errors,
  };
}

function validateStudentLoginPayload(payload = {}) {
  const errors = {};
  const values = {
    email: sanitizeText(payload.email, { max: 160 }).toLowerCase(),
    password: String(payload.password || ""),
  };

  if (!isEmail(values.email)) {
    errors.email = "Adresse e-mail invalide.";
  }

  if (!values.password) {
    errors.password = "Mot de passe requis.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    values,
    errors,
  };
}

function validateForgotPasswordPayload(payload = {}) {
  const values = {
    email: sanitizeText(payload.email, { max: 160 }).toLowerCase(),
  };

  const errors = {};
  if (!isEmail(values.email)) {
    errors.email = "Adresse e-mail invalide.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    values,
    errors,
  };
}

function validateResetPasswordPayload(payload = {}) {
  const errors = {};
  const values = {
    token: sanitizeText(payload.token, { max: 320 }),
    password: String(payload.password || ""),
  };

  if (!values.token) {
    errors.token = "Jeton de réinitialisation invalide.";
  }

  if (values.password.length < 8) {
    errors.password = "Le mot de passe doit contenir au moins 8 caractères.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    values,
    errors,
  };
}

function validateCheckoutPayload(payload = {}) {
  const errors = {};
  const values = {
    course_slug: sanitizeText(payload.course_slug, { max: 120 }),
  };

  if (!values.course_slug) {
    errors.course_slug = "Formation invalide.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    values,
    errors,
  };
}

function validateCheckoutConfirmPayload(payload = {}) {
  const errors = {};
  const values = {
    session_id: sanitizeText(payload.session_id, { max: 180 }),
  };

  if (!values.session_id) {
    errors.session_id = "Session de paiement invalide.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    values,
    errors,
  };
}

function validateProgressPayload(payload = {}) {
  const errors = {};
  const values = {
    lesson_id: sanitizeText(payload.lesson_id, { max: 120 }),
    status: sanitizeText(payload.status, { max: 40 }) || "in_progress",
    progress_percent: Number(payload.progress_percent),
    last_position_seconds: Number(payload.last_position_seconds || 0),
  };

  if (!values.lesson_id) {
    errors.lesson_id = "Leçon invalide.";
  }

  if (!LESSON_PROGRESS_STATUSES.includes(values.status)) {
    errors.status = "Statut de progression invalide.";
  }

  if (!Number.isFinite(values.progress_percent)) {
    values.progress_percent = values.status === "completed" ? 100 : 0;
  }

  values.progress_percent = Math.max(0, Math.min(100, Math.round(values.progress_percent)));
  values.last_position_seconds = Number.isFinite(values.last_position_seconds)
    ? Math.max(0, Math.round(values.last_position_seconds))
    : 0;

  return {
    valid: Object.keys(errors).length === 0,
    values,
    errors,
  };
}

function validateSubmissionPayload(payload = {}) {
  const errors = {};
  const values = {
    lesson_id: sanitizeText(payload.lesson_id, { max: 120 }),
    text_response: sanitizeText(payload.text_response, { max: 5000, multiline: true }),
  };

  if (!values.lesson_id) {
    errors.lesson_id = "Leçon invalide.";
  }

  if (values.text_response.length < 10) {
    errors.text_response = "Ajoutez une réponse plus détaillée (minimum 10 caractères).";
  }

  return {
    valid: Object.keys(errors).length === 0,
    values,
    errors,
  };
}

function validateAdminCoursePayload(payload = {}) {
  const errors = {};
  const values = {
    slug: sanitizeText(payload.slug, { max: 120 }).toLowerCase(),
    title: sanitizeText(payload.title, { max: 160 }),
    subtitle: sanitizeText(payload.subtitle, { max: 240 }),
    description: sanitizeText(payload.description, { max: 1000, multiline: true }),
    level: sanitizeText(payload.level, { max: 40 }) || "debutant",
    status: sanitizeText(payload.status, { max: 40 }) || "published",
    price_cents: Number(payload.price_cents || 0),
    currency: sanitizeText(payload.currency, { max: 8 }) || "EUR",
    order_index: Number(payload.order_index || 0),
  };

  if (!values.slug || values.slug.length < 3) {
    errors.slug = "Slug invalide (minimum 3 caractères).";
  }

  if (!values.title) {
    errors.title = "Titre requis.";
  }

  if (!COURSE_LEVELS.includes(values.level)) {
    errors.level = "Niveau invalide.";
  }

  if (!COURSE_STATUSES.includes(values.status)) {
    errors.status = "Statut invalide.";
  }

  if (!Number.isFinite(values.price_cents) || values.price_cents < 0) {
    errors.price_cents = "Prix invalide.";
  }

  values.price_cents = Math.round(values.price_cents);
  values.order_index = Number.isFinite(values.order_index) ? Math.round(values.order_index) : 0;
  values.currency = values.currency.toUpperCase();

  return {
    valid: Object.keys(errors).length === 0,
    values,
    errors,
  };
}

function validateAdminModulePayload(payload = {}) {
  const errors = {};
  const values = {
    course_id: sanitizeText(payload.course_id, { max: 120 }),
    title: sanitizeText(payload.title, { max: 180 }),
    description: sanitizeText(payload.description, { max: 900, multiline: true }),
    order_index: Number(payload.order_index || 0),
  };

  if (!values.course_id) {
    errors.course_id = "Formation requise.";
  }

  if (!values.title) {
    errors.title = "Titre requis.";
  }

  values.order_index = Number.isFinite(values.order_index) ? Math.round(values.order_index) : 0;

  return {
    valid: Object.keys(errors).length === 0,
    values,
    errors,
  };
}

function validateAdminLessonPayload(payload = {}) {
  const errors = {};
  const values = {
    course_id: sanitizeText(payload.course_id, { max: 120 }),
    module_id: sanitizeText(payload.module_id, { max: 120 }),
    title: sanitizeText(payload.title, { max: 180 }),
    lesson_type: sanitizeText(payload.lesson_type, { max: 40 }) || "mixed",
    duration_minutes: Number(payload.duration_minutes || 0),
    video_url: sanitizeText(payload.video_url, { max: 500 }),
    content_markdown: sanitizeText(payload.content_markdown, { max: 16000, multiline: true }),
    assignment_prompt: sanitizeText(payload.assignment_prompt, { max: 3000, multiline: true }),
    order_index: Number(payload.order_index || 0),
  };

  if (!values.course_id) {
    errors.course_id = "Formation requise.";
  }

  if (!values.module_id) {
    errors.module_id = "Module requis.";
  }

  if (!values.title) {
    errors.title = "Titre requis.";
  }

  if (!["video", "text", "mixed"].includes(values.lesson_type)) {
    errors.lesson_type = "Type de leçon invalide.";
  }

  values.duration_minutes = Number.isFinite(values.duration_minutes)
    ? Math.max(0, Math.round(values.duration_minutes))
    : 0;
  values.order_index = Number.isFinite(values.order_index) ? Math.round(values.order_index) : 0;

  return {
    valid: Object.keys(errors).length === 0,
    values,
    errors,
  };
}

function validateSubmissionReviewPayload(payload = {}) {
  const errors = {};
  const values = {
    status: sanitizeText(payload.status, { max: 40 }),
    admin_feedback: sanitizeText(payload.admin_feedback, { max: 5000, multiline: true }),
  };

  if (!SUBMISSION_STATUSES.includes(values.status)) {
    errors.status = "Statut de devoir invalide.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    values,
    errors,
  };
}

function validateManualEnrollmentPayload(payload = {}) {
  const errors = {};
  const values = {
    email: sanitizeText(payload.email, { max: 160 }).toLowerCase(),
    course_id: sanitizeText(payload.course_id, { max: 120 }),
  };

  if (!isEmail(values.email)) {
    errors.email = "Adresse e-mail invalide.";
  }

  if (!values.course_id) {
    errors.course_id = "Formation requise.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    values,
    errors,
  };
}

module.exports = {
  LESSON_PROGRESS_STATUSES,
  SUBMISSION_STATUSES,
  validateAdminCoursePayload,
  validateAdminLessonPayload,
  validateAdminModulePayload,
  validateCheckoutConfirmPayload,
  validateCheckoutPayload,
  validateForgotPasswordPayload,
  validateManualEnrollmentPayload,
  validateProgressPayload,
  validateResetPasswordPayload,
  validateStudentLoginPayload,
  validateStudentSignupPayload,
  validateSubmissionPayload,
  validateSubmissionReviewPayload,
};
