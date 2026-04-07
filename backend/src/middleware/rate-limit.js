const { config } = require("../config/env");

const leadLimiter = new Map();
let lastSweepAt = 0;

function sweepExpiredEntries(now) {
  if (now - lastSweepAt < config.rateLimit.windowMs) {
    return;
  }

  lastSweepAt = now;

  for (const [ip, entry] of leadLimiter.entries()) {
    if (now > entry.resetAt) {
      leadLimiter.delete(ip);
    }
  }
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];

  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }

  return req.ip || req.socket.remoteAddress || "unknown";
}

function applyLeadRateLimit(req, res, next) {
  const ip = getClientIp(req);
  const now = Date.now();
  sweepExpiredEntries(now);
  const current = leadLimiter.get(ip);

  if (!current || now > current.resetAt) {
    const entry = {
      count: 1,
      resetAt: now + config.rateLimit.windowMs,
    };
    leadLimiter.set(ip, entry);
    res.setHeader("X-RateLimit-Limit", String(config.rateLimit.max));
    res.setHeader("X-RateLimit-Remaining", String(Math.max(config.rateLimit.max - entry.count, 0)));
    return next();
  }

  res.setHeader("X-RateLimit-Limit", String(config.rateLimit.max));
  res.setHeader("X-RateLimit-Remaining", String(Math.max(config.rateLimit.max - current.count, 0)));

  if (current.count >= config.rateLimit.max) {
    const retryAfterSeconds = Math.max(Math.ceil((current.resetAt - now) / 1000), 1);
    res.setHeader("Retry-After", String(retryAfterSeconds));
    return res.status(429).json({
      ok: false,
      message:
        "Trop de tentatives ont été envoyées depuis cette connexion. Merci de réessayer un peu plus tard.",
    });
  }

  current.count += 1;
  leadLimiter.set(ip, current);
  res.setHeader("X-RateLimit-Remaining", String(Math.max(config.rateLimit.max - current.count, 0)));

  return next();
}

module.exports = {
  applyLeadRateLimit,
  getClientIp,
};
