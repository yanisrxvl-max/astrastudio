/**
 * Test POST /api/astra-signal/audit (réponse { ok, data }).
 * Usage : node backend/scripts/test-astra-signal-flow.js
 */
require("dotenv").config();

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");

const tempDatabaseFile = path.resolve(process.cwd(), "data", "astra-signal.flow-test.sqlite");

process.env.DB_FILE = tempDatabaseFile;
process.env.NODE_ENV = process.env.NODE_ENV || "development";

const { assertConfig } = require("../src/config/env");
const { initializeDatabase } = require("../src/db/migrations");
const { createApp } = require("../src/app");

function cleanup() {
  try {
    fs.unlinkSync(tempDatabaseFile);
  } catch {
    // ignore
  }
}

async function requestJson(port, method, pathname, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path: pathname,
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(data ? { "Content-Length": Buffer.byteLength(data) } : {}),
        },
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const buf = Buffer.concat(chunks);
          const text = buf.toString("utf8");
          const contentType = res.headers["content-type"] || "";
          if (contentType.includes("application/json")) {
            try {
              resolve({ status: res.statusCode, payload: JSON.parse(text || "{}") });
            } catch (e) {
              reject(e);
            }
          } else {
            resolve({ status: res.statusCode, buffer: buf, contentType });
          }
        });
      }
    );
    req.on("error", reject);
    if (data) {
      req.write(data);
    }
    req.end();
  });
}

async function main() {
  cleanup();
  assertConfig();
  await initializeDatabase();
  const { app } = createApp();

  const server = await new Promise((resolve, reject) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
    s.on("error", reject);
  });

  const port = server.address().port;

  try {
    const audit = await requestJson(port, "POST", "/api/astra-signal/audit", {
      url: "https://example.com",
    });

    if (audit.status === 200 && audit.payload.ok && audit.payload.data) {
      assert.ok(typeof audit.payload.data.score === "number");
      console.info("OK flux Astra Signal : audit IA.");
    } else {
      assert.equal(audit.status, 500);
      console.warn(
        `[test] Audit IA indisponible (status ${audit.status}). Définissez QWEN_API_KEY valide pour un test complet.`
      );
    }
  } finally {
    await new Promise((r) => server.close(r));
    cleanup();
  }
}

main().catch((err) => {
  console.error(err);
  cleanup();
  process.exitCode = 1;
});
