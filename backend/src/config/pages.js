const publicPages = {
  "/": "index.html",
  "/index.html": "index.html",
  "/vision": "vision.html",
  "/vision.html": "vision.html",
  "/services": "services.html",
  "/services.html": "services.html",
  "/formations": "formations.html",
  "/formations.html": "formations.html",
  "/diagnostic": "diagnostic.html",
  "/diagnostic.html": "diagnostic.html",
  "/work": "work.html",
  "/work.html": "work.html",
  "/glowy-glow": "glowy-glow.html",
  "/glowy-glow.html": "glowy-glow.html",
  "/results": "results.html",
  "/results.html": "results.html",
  "/contact": "contact.html",
  "/contact.html": "contact.html",
};

const publicRedirects = {
  "/about": "/vision.html",
  "/about.html": "/vision.html",
  "/learn": "/learn/login",
};

module.exports = {
  publicPages,
  publicRedirects,
};
