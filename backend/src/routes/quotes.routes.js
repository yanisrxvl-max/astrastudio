const express = require("express");
const { generateQuotePDF } = require("../services/quote-generator.service");

const router = express.Router();

// Route : POST /api/quotes/generate
router.post("/generate", async (req, res) => {
  try {
    const { client, offer, date } = req.body;
    if (!client || !offer) {
      return res.status(400).json({ error: "Données manquantes" });
    }

    const pdfBuffer = await generateQuotePDF(client, offer, date);

    const baseName = String(client.name || client.company || "Client")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9._-]/g, "") || "Client";

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Devis-Astra-${baseName}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Erreur génération devis:", err);
    res.status(500).json({ error: "Erreur serveur lors de la génération du devis." });
  }
});

module.exports = router;
