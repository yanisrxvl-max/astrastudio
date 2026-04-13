const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..", "..", "..");

function getResolvedRootDir() {
  return process.env.ROOT_DIR ? path.resolve(process.env.ROOT_DIR) : projectRoot;
}

function parseBoolean(value, fallback = false) {
  if (typeof value === "undefined") {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

function parseInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function resolveRootPath(...segments) {
  return path.resolve(getResolvedRootDir(), ...segments);
}

const config = {
  env: process.env.NODE_ENV || "development",
  host: process.env.HOST || "127.0.0.1",
  port: parseInteger(process.env.PORT, 3000),
  trustProxy: parseBoolean(process.env.TRUST_PROXY, false),
  rootDir: getResolvedRootDir(),
  publicDir: resolveRootPath(process.env.PUBLIC_DIR || "public"),
  databaseFile: resolveRootPath(process.env.DB_FILE || "data/astra-studio.sqlite"),
  legacyLeadsFile: resolveRootPath(process.env.LEGACY_LEADS_FILE || "data/leads.json"),
  leadsNotifyEmail: process.env.LEADS_NOTIFY_EMAIL || "",
  admin: {
    username: process.env.ADMIN_USERNAME || "admin",
    password: process.env.ADMIN_PASSWORD || "",
    sessionSecret: process.env.ADMIN_SESSION_SECRET || require("crypto").randomBytes(32).toString("hex"),
    sessionTtlHours: parseInteger(process.env.ADMIN_SESSION_TTL_HOURS, 168),
  },
  student: {
    sessionSecret: process.env.STUDENT_SESSION_SECRET || require("crypto").randomBytes(32).toString("hex"),
    sessionTtlHours: parseInteger(process.env.STUDENT_SESSION_TTL_HOURS, 720),
    passwordResetTtlMinutes: parseInteger(process.env.PASSWORD_RESET_TTL_MINUTES, 60),
    allowDevFakeCheckout: parseBoolean(
      process.env.ALLOW_DEV_FAKE_CHECKOUT,
      (process.env.NODE_ENV || "development") !== "production"
    ),
  },
  uploadsDir: resolveRootPath(process.env.UPLOADS_DIR || "data/uploads"),
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: parseInteger(process.env.SMTP_PORT, 587),
    secure: parseBoolean(process.env.SMTP_SECURE, false),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || "",
    replyTo: process.env.SMTP_REPLY_TO || "",
  },
  ai: {
    provider: "gemini",
    apiKey: process.env.GEMINI_API_KEY || "",
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    timeoutMs: parseInteger(
      process.env.GEMINI_TIMEOUT_MS || process.env.AI_TIMEOUT_MS,
      30000
    ),
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
    currency: process.env.STRIPE_CURRENCY || "eur",
  },
  rateLimit: {
    max: parseInteger(process.env.LEAD_RATE_LIMIT_MAX, 5),
    windowMs: parseInteger(process.env.LEAD_RATE_LIMIT_WINDOW_MS, 60 * 60 * 1000),
  },
  site: {
    baseUrl: process.env.SITE_BASE_URL || `http://${process.env.HOST || "127.0.0.1"}:${parseInteger(process.env.PORT, 3000)}`,
    adminRoute: "/admin",
    adminAcademyRoute: "/admin/academy",
    studentAuthRoute: "/learn/login",
    studentDashboardRoute: "/learn/dashboard",
    studentCourseRoute: "/learn/course",
    studentCheckoutSuccessRoute: "/learn/checkout/success",
    adminJsonExportRoute: "/api/admin/leads/export.json",
    adminCsvExportRoute: "/api/admin/leads/export.csv",
  },
};

function assertConfig() {
  if (config.admin.sessionTtlHours < 1) {
    throw new Error("ADMIN_SESSION_TTL_HOURS doit être supérieur ou égal à 1.");
  }

  if (config.rateLimit.max < 1 || config.rateLimit.windowMs < 1000) {
    throw new Error("La configuration de limitation des leads est invalide.");
  }

  if (config.ai.timeoutMs < 4000) {
    throw new Error("AI_TIMEOUT_MS doit être ≥ 4000.");
  }

  if (config.student.sessionTtlHours < 1) {
    throw new Error("STUDENT_SESSION_TTL_HOURS doit être supérieur ou égal à 1.");
  }

  if (config.student.passwordResetTtlMinutes < 10) {
    throw new Error("PASSWORD_RESET_TTL_MINUTES doit être supérieur ou égal à 10.");
  }

  if (config.env === "production") {
    if (config.admin.password === "") {
      throw new Error("ADMIN_PASSWORD doit être défini et non vide en production.");
    }

    if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
      throw new Error("ADMIN_USERNAME et ADMIN_PASSWORD doivent être définis en production.");
    }

    if (!process.env.ADMIN_SESSION_SECRET) {
      throw new Error("ADMIN_SESSION_SECRET doit être défini en production.");
    }

    if (!process.env.STUDENT_SESSION_SECRET) {
      throw new Error("STUDENT_SESSION_SECRET doit être défini en production.");
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET || !String(config.stripe.webhookSecret || "").trim()) {
      throw new Error("STRIPE_WEBHOOK_SECRET doit être défini et non vide en production (webhooks Stripe).");
    }
  }

  if (config.env === "production" && !process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY est requis en production.");
  }
}

module.exports = {
  assertConfig,
  config,
  parseBoolean,
  parseInteger,
  resolveRootPath,
};
