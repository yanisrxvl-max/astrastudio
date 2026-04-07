require("dotenv").config();

const { assertConfig, config } = require("./config/env");
const { initializeDatabase } = require("./db/migrations");
const { createApp } = require("./app");

async function startServer() {
  assertConfig();
  initializeDatabase();

  const { app, mailer } = createApp();

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
