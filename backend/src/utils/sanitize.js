function sanitizeText(value, options = {}) {
  const { max = 160, multiline = false } = options;

  let sanitized = String(value || "")
    .replace(/\u0000/g, "")
    .replace(/\r\n?/g, "\n");

  if (multiline) {
    sanitized = sanitized
      .split("\n")
      .map((line) => line.replace(/[^\S\n]+/g, " ").trimEnd())
      .join("\n")
      .trim();
  } else {
    sanitized = sanitized.replace(/\s+/g, " ").trim();
  }

  if (sanitized.length > max) {
    sanitized = sanitized.slice(0, max).trim();
  }

  return sanitized;
}

function normalizeOptional(value, options = {}) {
  return sanitizeText(value, options) || "";
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

module.exports = {
  escapeHtml,
  normalizeOptional,
  sanitizeText,
};
