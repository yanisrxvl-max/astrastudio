const express = require("express");
const path = require("node:path");
const fs = require("node:fs");

const { publicPages, publicRedirects } = require("../config/pages");
const { config } = require("../config/env");

function createStaticRouter() {
  const router = express.Router();

  const staticOptions = {
    index: false,
    dotfiles: "ignore",
  };

  [
    ["", config.publicDir],
    ["/assets", path.join(config.rootDir, "assets")],
    ["/css", path.join(config.rootDir, "css")],
    ["/js", path.join(config.rootDir, "js")],
    ["/videos", path.join(config.rootDir, "videos")],
  ].forEach(([routePrefix, directory]) => {
    if (!fs.existsSync(directory)) {
      return;
    }

    if (routePrefix) {
      router.use(routePrefix, express.static(directory, staticOptions));
      return;
    }

    router.use(express.static(directory, staticOptions));
  });

  router.get("/background-video.mp4", (_req, res) => {
    res.sendFile(path.join(config.rootDir, "assets", "videos", "astra-hero-work.mp4"));
  });

  Object.entries(publicRedirects).forEach(([routePath, destination]) => {
    router.get(routePath, (req, res) => {
      res.redirect(302, destination);
    });
  });

  Object.entries(publicPages).forEach(([routePath, filePath]) => {
    router.get(routePath, (req, res) => {
      res.sendFile(path.join(config.rootDir, filePath));
    });
  });

  return router;
}

module.exports = {
  createStaticRouter,
};
