const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

function deliverablesToListItems(deliverablesStr) {
  if (!deliverablesStr) {
    return "";
  }
  return deliverablesStr
    .split("•")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => `<li>${s}</li>`)
    .join("");
}

/**
 * @param {object} client - { name?, contactName?, email?, company? }
 * @param {string} offer - SPARK | SIGNATURE | SCALE
 * @param {string|Date} [date] - date d'émission (optionnel, défaut : aujourd'hui)
 */
async function generateQuotePDF(client, offer, date) {
  const templatePath = path.join(__dirname, "../utils/quote-template.html");
  let html = fs.readFileSync(templatePath, "utf8");

  const offers = {
    SPARK: {
      name: "SPARK — Présence Essentielle",
      price: "497€ HT/mois",
      desc: "Présence digitale cohérente sans effort.",
      deliverables:
        "12 Posts/mois • 4 Vidéos • Calendrier auto • Reporting basique",
    },
    SIGNATURE: {
      name: "SIGNATURE — Direction Artistique",
      price: "1 497€ HT/mois",
      desc: "Stratégie créative complète, shooting mensuel et pilotage éditorial.",
      deliverables:
        "Direction artistique & branding • 25 posts + 8 vidéos • 1 shooting stratégique / mois • 1 workflow d'automatisation • 2 calls stratégiques",
    },
    SCALE: {
      name: "SCALE — Partenaire Stratégique",
      price: "3 497€ HT/mois",
      desc: "Système complet, agent IA dédié et accompagnement premium.",
      deliverables:
        "Tout SIGNATURE • Agent IA dédié • Accès prioritaire • Formation équipe • WhatsApp business",
    },
  };

  const code = String(offer || "SPARK").toUpperCase();
  const plan = offers[code] || offers.SPARK;

  let dateLabel = new Date().toLocaleDateString("fr-FR");
  if (date != null && date !== "") {
    const parsed = new Date(date);
    dateLabel = Number.isNaN(parsed.getTime()) ? String(date) : parsed.toLocaleDateString("fr-FR");
  }

  const clientName = client?.name || client?.contactName || client?.company || "Client";
  const clientEmail = client?.email || "—";

  html = html.replace("{{CLIENT_NAME}}", clientName);
  html = html.replace("{{CLIENT_EMAIL}}", clientEmail);
  html = html.replace("{{DATE}}", dateLabel);
  html = html.replace("{{OFFER_NAME}}", plan.name);
  html = html.replace("{{OFFER_DESCRIPTION}}", plan.desc);
  html = html.replace("{{DELIVERABLES}}", deliverablesToListItems(plan.deliverables));
  html = html.replace("{{TOTAL_PRICE}}", plan.price);

  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
    printBackground: true,
  });

  await browser.close();
  return pdfBuffer;
}

module.exports = { generateQuotePDF };
