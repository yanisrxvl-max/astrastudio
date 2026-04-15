const publicPages = {
  "/": "index.html",
  "/index.html": "index.html",

  /* ─── Navigation principale ─── */
  "/services": "services.html",
  "/services.html": "services.html",
  "/portfolio": "portfolio.html",
  "/portfolio.html": "portfolio.html",
  "/a-propos": "a-propos.html",
  "/a-propos.html": "a-propos.html",
  "/contact": "contact.html",
  "/contact.html": "contact.html",

  /* ─── Offres ─── */
  "/offre-audit-marque": "offre-audit-marque.html",
  "/offre-audit-marque.html": "offre-audit-marque.html",
  "/offre-direction-creative": "offre-direction-creative.html",
  "/offre-direction-creative.html": "offre-direction-creative.html",
  "/offre-sur-mesure": "offre-sur-mesure.html",
  "/offre-sur-mesure.html": "offre-sur-mesure.html",

  /* ─── Univers de marque ─── */
  "/vision": "vision.html",
  "/vision.html": "vision.html",
  "/systemes-ia": "systemes-ia.html",
  "/systemes-ia.html": "systemes-ia.html",
  "/creative-influence": "creative-influence.html",
  "/creative-influence.html": "creative-influence.html",
  "/production": "production.html",
  "/production.html": "production.html",
  "/work": "work.html",
  "/work.html": "work.html",

  /* ─── Outils ─── */
  "/formations": "formations.html",
  "/formations.html": "formations.html",
  "/diagnostic": "diagnostic.html",
  "/diagnostic.html": "diagnostic.html",
  "/glowy-glow": "glowy-glow.html",
  "/glowy-glow.html": "glowy-glow.html",
  "/results": "results.html",
  "/results.html": "results.html",

  /* ─── Légal ─── */
  "/mentions-legales": "mentions-legales.html",
  "/mentions-legales.html": "mentions-legales.html",
  "/politique-confidentialite": "politique-confidentialite.html",
  "/politique-confidentialite.html": "politique-confidentialite.html",

  /* ─── Erreur ─── */
  "/404": "404.html",
  "/404.html": "404.html",
};

const publicRedirects = {
  "/about": "/a-propos",
  "/about.html": "/a-propos",
  "/learn": "/learn/login",
};

module.exports = {
  publicPages,
  publicRedirects,
};
