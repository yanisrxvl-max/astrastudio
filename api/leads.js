/**
 * Proxy Vercel : POST /api/leads → app Next (même schéma JSON, pas de CORS navigateur).
 * Variables : LEADS_UPSTREAM_URL — mettre l’URL réelle de l’app Next si app.astrastudio.fr
 * n’est pas encore en DNS (ex. https://ton-projet.vercel.app/api/leads).
 */
const UPSTREAM =
  process.env.LEADS_UPSTREAM_URL || "https://app.astrastudio.fr/api/leads";

const UPSTREAM_TIMEOUT_MS = Math.min(
  Math.max(Number(process.env.LEADS_UPSTREAM_TIMEOUT_MS) || 20000, 5000),
  55000
);

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return req.body;
  }
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Méthode non autorisée." });
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (e) {
    console.error("[api/leads] body", e);
    return res.status(400).json({ success: false, error: "Requête invalide." });
  }

  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
    let r;
    try {
      r = await fetch(UPSTREAM, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": "AstraStudio-Static-Proxy/1.0",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(t);
    }

    const text = await r.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = {
        success: false,
        error: text ? text.slice(0, 200) : "Réponse serveur invalide.",
      };
    }

    res.status(r.status).json(data);
  } catch (e) {
    console.error("[api/leads] upstream", e);
    res.status(502).json({
      success: false,
      error:
        "Service temporairement indisponible. Réessayez plus tard ou écrivez à bonjour@astrastudio.fr.",
    });
  }
};
