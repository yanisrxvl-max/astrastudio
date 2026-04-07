const express = require("express");
const path = require("node:path");

const { publicPages, publicRedirects } = require("../config/pages");
const { config } = require("../config/env");

function createStaticRouter() {
  const router = express.Router();

  router.use("/assets", express.static(path.join(config.publicDir, "assets")));
  router.use("/css", express.static(path.join(config.publicDir, "css")));
  router.use("/js", express.static(path.join(config.publicDir, "js")));

  Object.entries(publicRedirects).forEach(([routePath, destination]) => {
    router.get(routePath, (req, res) => {
      res.redirect(302, destination);
    });
  });

  Object.entries(publicPages).forEach(([routePath, filePath]) => {
    router.get(routePath, (req, res) => {
      res.sendFile(path.join(config.publicDir, filePath));
    });
  });

  return router;
}

module.exports = {
  createStaticRouter,
};
