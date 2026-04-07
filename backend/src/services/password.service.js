const { randomBytes, scryptSync, timingSafeEqual } = require("node:crypto");

function hashPassword(password) {
  const normalized = String(password || "");
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(normalized, salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

function verifyPassword(password, hash) {
  const normalizedHash = String(hash || "");
  const [, salt, expectedHex] = normalizedHash.split("$");

  if (!salt || !expectedHex) {
    return false;
  }

  const provided = scryptSync(String(password || ""), salt, 64);
  const expected = Buffer.from(expectedHex, "hex");

  if (provided.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(provided, expected);
}

module.exports = {
  hashPassword,
  verifyPassword,
};
