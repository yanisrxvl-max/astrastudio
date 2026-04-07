const { createHmac } = require("node:crypto");

const { config } = require("../config/env");
const { safeEqual } = require("../utils/security");

const SESSION_COOKIE_NAME = "astra_admin_session";

function signPayload(payload) {
  return createHmac("sha256", config.admin.sessionSecret).update(payload).digest("base64url");
}

function createSessionToken() {
  const expiresAt = Date.now() + config.admin.sessionTtlHours * 60 * 60 * 1000;
  const payload = Buffer.from(
    JSON.stringify({
      u: config.admin.username,
      e: expiresAt,
    })
  ).toString("base64url");
  const signature = signPayload(payload);

  return {
    token: `${payload}.${signature}`,
    expiresAt,
  };
}

function verifySessionToken(token) {
  if (!token || !token.includes(".")) {
    return null;
  }

  const [payload, signature] = token.split(".");
  const expectedSignature = signPayload(payload);

  if (!safeEqual(signature, expectedSignature)) {
    return null;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));

    if (!data.e || Date.now() > Number(data.e)) {
      return null;
    }

    return {
      username: data.u,
      expiresAt: Number(data.e),
    };
  } catch {
    return null;
  }
}

module.exports = {
  SESSION_COOKIE_NAME,
  createSessionToken,
  verifySessionToken,
};
