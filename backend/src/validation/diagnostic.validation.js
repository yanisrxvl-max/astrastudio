const { normalizeOptional, sanitizeText } = require("../utils/sanitize");

function sanitizeResponseItem(item = {}) {
  return {
    question_id: sanitizeText(item.question_id || item.questionId, { max: 80 }),
    question_label: sanitizeText(item.question_label || item.questionLabel, {
      max: 220,
      multiline: true,
    }),
    answer_value: sanitizeText(item.answer_value || item.answerValue, { max: 80 }),
    answer_label: sanitizeText(item.answer_label || item.answerLabel, {
      max: 220,
      multiline: true,
    }),
  };
}

function validateDiagnosticPayload(payload) {
  const errors = {};
  const responsesInput = Array.isArray(payload.responses) ? payload.responses : [];
  const responses = responsesInput.map((item) => sanitizeResponseItem(item));

  if (responses.length < 8) {
    errors.responses = "Le diagnostic doit contenir au moins 8 réponses.";
  }

  const questionIds = new Set();

  responses.forEach((response, index) => {
    if (!response.question_id) {
      errors.responses = "Certaines réponses sont incomplètes.";
      return;
    }

    if (questionIds.has(response.question_id)) {
      errors.responses = "Des réponses dupliquées ont été détectées.";
      return;
    }

    questionIds.add(response.question_id);

    if (!response.question_label || !response.answer_label) {
      errors.responses = "Certaines réponses sont incomplètes.";
      return;
    }

    if (!response.answer_value) {
      errors.responses = "Certaines réponses sont incomplètes.";
      return;
    }

    if (index > 31) {
      errors.responses = "Le format du diagnostic est invalide.";
    }
  });

  const values = {
    responses,
    source: normalizeOptional(payload.source, { max: 220 }),
  };

  return {
    valid: Object.keys(errors).length === 0,
    values,
    errors,
  };
}

module.exports = {
  validateDiagnosticPayload,
};
