const express = require("express");

const { config } = require("../config/env");
const { getSessionFromRequest, isAdminCredentialsValid } = require("../middleware/admin-session");
const { SESSION_COOKIE_NAME, createSessionToken } = require("../services/auth.service");
const { serializeCookie } = require("../utils/cookies");
const { sanitizeText } = require("../utils/sanitize");

function createAuthRouter() {
  const router = express.Router();

  router.get("/session", (req, res) => {
    const session = getSessionFromRequest(req);

    if (!session) {
      return res.status(401).json({
        ok: false,
        authenticated: false,
      });
    }

    return res.json({
      ok: true,
      authenticated: true,
      session,
    });
  });

  router.post("/login", (req, res) => {
    const username = sanitizeText(req.body.username, { max: 80 });
    const password = String(req.body.password || "");

    if (!isAdminCredentialsValid(username, password)) {
      return res.status(401).json({
        ok: false,
        message: "Identifiants invalides.",
      });
    }

    const { token, expiresAt } = createSessionToken();
    const cookie = serializeCookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "Lax",
      secure: config.env === "production",
      path: "/",
      maxAge: config.admin.sessionTtlHours * 60 * 60,
      expires: new Date(expiresAt),
    });

    res.setHeader("Set-Cookie", cookie);
    return res.json({
      ok: true,
      redirect_to: "/admin",
    });
  });

  router.post("/logout", (req, res) => {
    const cookie = serializeCookie(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      sameSite: "Lax",
      secure: config.env === "production",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });

    res.setHeader("Set-Cookie", cookie);
    return res.json({
      ok: true,
    });
  });

  return router;
}

module.exports = {
  createAuthRouter,
};
