const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

async function generateAuditPDF(analysis, brandName) {
  const templatePath = path.join(__dirname, "../utils/audit-template.html");
  let html = fs.readFileSync(templatePath, "utf8");

  // Remplacement des données
  html = html.replace("{{BRAND}}", brandName || "Marque");
  html = html.replace("{{SCORE}}", analysis.score);
  html = html.replace("{{VERDICT}}", analysis.verdict);
  html = html.replace("{{OFFER}}", analysis.suggested_offer || "SIGNATURE");

  const toList = (arr) => (arr || []).map((i) => `<li>${i}</li>`).join("");
  html = html.replace("{{STRENGTHS}}", toList(analysis.strengths));
  html = html.replace("{{WEAKNESSES}}", toList(analysis.weaknesses));
  html = html.replace("{{RECOMMENDATIONS}}", toList(analysis.recommendations));

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

module.exports = { generateAuditPDF };
