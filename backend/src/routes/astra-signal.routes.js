const express = require("express");
const { analyzeWebsite } = require("../services/ai-agent.service");
const { generateAuditPDF } = require("../services/pdf-generator.service");

const router = express.Router();

router.post("/audit", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL requise" });
    }

    const analysis = await analyzeWebsite(url);
    res.json({ ok: true, data: analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/download", async (req, res) => {
  try {
    const { analysis, brandName } = req.body;
    const pdf = await generateAuditPDF(analysis, brandName);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=Astra-Audit.pdf");
    res.send(pdf);
  } catch (err) {
    res.status(500).json({ error: "Erreur PDF" });
  }
});

module.exports = router;
