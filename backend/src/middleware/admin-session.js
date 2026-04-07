const { config } = require("../config/env");
const { parseCookies } = require("../utils/cookies");
const { safeEqual } = require("../utils/security");
const { SESSION_COOKIE_NAME, verifySessionToken } = require("../services/auth.service");

function isAdminCredentialsValid(username, password) {
  return (
    safeEqual(username, config.admin.username) &&
    safeEqual(password, config.admin.password)
  );
}

function getSessionFromRequest(req) {
  const cookies = parseCookies(req.headers.cookie || "");
  const token = cookies[SESSION_COOKIE_NAME];

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

function requireAdminSession(req, res, next) {
  const session = getSessionFromRequest(req);

  if (!session) {
    if (req.originalUrl.startsWith("/api/")) {
      return res.status(401).json({
        ok: false,
        message: "Authentification requise.",
      });
    }

    return res.redirect("/admin/login");
  }

  req.adminSession = session;
  return next();
}

module.exports = {
  getSessionFromRequest,
  isAdminCredentialsValid,
  requireAdminSession,
};
