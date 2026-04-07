const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const { config } = require("../config/env");

let database = null;

function getDatabase() {
  if (database) {
    return database;
  }

  fs.mkdirSync(path.dirname(config.databaseFile), { recursive: true });
  database = new DatabaseSync(config.databaseFile);
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
  `);

  return database;
}

module.exports = {
  getDatabase,
};
