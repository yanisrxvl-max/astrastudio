require("dotenv").config();

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const tempDatabaseFile = path.resolve(process.cwd(), "data", "astra-studio.verify.sqlite");
const tempLegacyFile = path.resolve(process.cwd(), "data", "leads.verify.json");

process.env.NODE_ENV = process.env.NODE_ENV || "development";
process.env.DB_FILE = tempDatabaseFile;
process.env.LEGACY_LEADS_FILE = tempLegacyFile;
process.env.LEADS_NOTIFY_EMAIL = "";
process.env.SMTP_HOST = "";
process.env.SMTP_PORT = "587";
process.env.SMTP_SECURE = "false";
process.env.SMTP_USER = "";
process.env.SMTP_PASS = "";
process.env.SMTP_FROM = "";
process.env.SMTP_REPLY_TO = "";
process.env.ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "astra-verify-e2e-only";
process.env.ADMIN_SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET || "astra-studio-verify-secret";

const { assertConfig } = require("../src/config/env");
const { initializeDatabase } = require("../src/db/migrations");
const { createApp } = require("../src/app");

function cleanupTemporaryFiles() {
  [
    tempDatabaseFile,
    `${tempDatabaseFile}-shm`,
    `${tempDatabaseFile}-wal`,
    tempLegacyFile,
  ].forEach((filePath) => {
    if (fs.existsSync(filePath)) {
      fs.rmSync(filePath, { force: true });
    }
  });
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => ({}));

  return {
    response,
    payload,
  };
}

function extractSessionCookie(response) {
  if (typeof response.headers.getSetCookie === "function") {
    const cookies = response.headers.getSetCookie();
    if (cookies[0]) {
      return cookies[0].split(";")[0];
    }
  }

  const header = response.headers.get("set-cookie");
  return header ? header.split(";")[0] : "";
}

async function main() {
  cleanupTemporaryFiles();
  assertConfig();
  initializeDatabase();

  const { app } = createApp();
  const server = await new Promise((resolve) => {
    const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
  });

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const health = await requestJson(`${baseUrl}/api/health`);
    assert.equal(health.response.status, 200);
    assert.equal(health.payload.ok, true);

    const bootstrap = await requestJson(`${baseUrl}/api/site/bootstrap`);
    assert.equal(bootstrap.response.status, 200);
    assert.equal(bootstrap.payload.ok, true);

    const invalidLead = await requestJson(`${baseUrl}/api/leads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name: "A",
        email: "invalide",
        company: "",
        project_type: "",
        budget: "",
        timeline: "",
        message: "Trop court",
      }),
    });
    assert.equal(invalidLead.response.status, 400);

    const validLead = await requestJson(`${baseUrl}/api/leads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name: "Vérification Astra",
        email: "verify@example.com",
        phone: "0600000002",
        company: "Astra Verify",
        website_or_instagram: "https://example.com",
        project_type: "Direction artistique",
        budget: "2 000 à 5 000 €",
        timeline: "Sous 30 jours",
        message:
          "Nous voulons vérifier le pipeline commercial et la stabilité du système de contact.",
      }),
    });
    assert.equal(validLead.response.status, 200);
    assert.equal(validLead.payload.ok, true);

    const login = await requestJson(`${baseUrl}/api/admin/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        username: process.env.ADMIN_USERNAME,
        password: process.env.ADMIN_PASSWORD,
      }),
    });
    assert.equal(login.response.status, 200);
    const sessionCookie = extractSessionCookie(login.response);
    assert.ok(sessionCookie);

    const dashboard = await requestJson(`${baseUrl}/api/admin/dashboard`, {
      headers: {
        Cookie: sessionCookie,
      },
    });
    assert.equal(dashboard.response.status, 200);
    assert.equal(dashboard.payload.ok, true);

    const leads = await requestJson(`${baseUrl}/api/admin/leads`, {
      headers: {
        Cookie: sessionCookie,
      },
    });
    assert.equal(leads.response.status, 200);
    assert.equal(leads.payload.summary.total, 1);
    const leadId = leads.payload.leads[0]?.id;
    assert.ok(leadId);

    const patchedLead = await requestJson(`${baseUrl}/api/admin/leads/${leadId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        status: "quote_sent",
        estimated_budget_amount: 5200,
        follow_up_status: "to_follow",
        next_follow_up_at: "2026-04-12",
      }),
    });
    assert.equal(patchedLead.response.status, 200);
    assert.equal(patchedLead.payload.lead.status, "quote_sent");

    const leadDetail = await requestJson(`${baseUrl}/api/admin/leads/${leadId}`, {
      headers: {
        Cookie: sessionCookie,
      },
    });
    assert.equal(leadDetail.response.status, 200);
    assert.equal(leadDetail.payload.lead.follow_up_status, "to_follow");
    assert.ok(Array.isArray(leadDetail.payload.activity));

    const convertedLead = await requestJson(`${baseUrl}/api/admin/leads/${leadId}/convert`, {
      method: "POST",
      headers: {
        Cookie: sessionCookie,
      },
    });
    assert.equal(convertedLead.response.status, 201);
    assert.equal(convertedLead.payload.item.estimated_value, 5200);

    const clients = await requestJson(`${baseUrl}/api/admin/clients?q=Astra%20Verify`, {
      headers: {
        Cookie: sessionCookie,
      },
    });
    assert.equal(clients.response.status, 200);
    assert.equal(clients.payload.items.length, 1);

    console.info("Verification terminee : stack, admin et pipeline commercial OK.");
  } finally {
    await new Promise((resolve) => server.close(resolve));
    cleanupTemporaryFiles();
  }
}

main().catch((error) => {
  console.error("Verification echouee :", error);
  cleanupTemporaryFiles();
  process.exitCode = 1;
});
