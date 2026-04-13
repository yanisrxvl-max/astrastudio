require("dotenv").config();

const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const { assertConfig, config } = require("./config/env");
const { initializeDatabase } = require("./db/migrations");
const { createApp } = require("./app");

async function startServer() {
  assertConfig();
  await initializeDatabase();

  const { app, mailer } = createApp();

  // Middlewares de sécurité globaux
  app.use(
    helmet({
      contentSecurityPolicy: false, // Désactivé pour le dev, à activer en prod
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(
    cors({
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true,
    })
  );

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // 100 requêtes par 15min
      message: "Trop de requêtes, veuillez réessayer plus tard.",
    })
  );

  if (mailer.hasPartialConfiguration) {
    console.warn(
      `[Astra Studio] SMTP partiellement configuré : variables manquantes -> ${mailer.missingKeys.join(", ")}`
    );
  }

  if (!mailer.isConfigured) {
    console.warn(
      "[Astra Studio] SMTP non configuré : les leads seront stockés en base, mais aucun e-mail réel ne partira tant que les variables SMTP ne seront pas renseignées."
    );
  } else {
    try {
      await mailer.verify();
      console.info("[Astra Studio] SMTP vérifié avec succès.");
    } catch (error) {
      console.warn("[Astra Studio] Vérification SMTP impossible :", error.message);
    }
  }

  app.listen(config.port, config.host, () => {
    console.info(`[Astra Studio] Site disponible sur http://${config.host}:${config.port}`);
    console.info(`[Astra Studio] Admin sur http://${config.host}:${config.port}${config.site.adminRoute}`);
    console.info(
      `[Astra Studio] Admin formations sur http://${config.host}:${config.port}${config.site.adminAcademyRoute}`
    );
    console.info(
      `[Astra Studio] Espace élève sur http://${config.host}:${config.port}${config.site.studentAuthRoute}`
    );
    console.info(`[Astra Studio] Base SQLite : ${config.databaseFile}`);
  });
}

startServer().catch((error) => {
  console.error("[Astra Studio] Impossible de démarrer le serveur :", error);
  process.exitCode = 1;
});
