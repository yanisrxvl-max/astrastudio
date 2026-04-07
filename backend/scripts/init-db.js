require("dotenv").config();

const { config } = require("../src/config/env");
const { initializeDatabase } = require("../src/db/migrations");

initializeDatabase();
console.info(`[Astra Studio] Base initialisée : ${config.databaseFile}`);
