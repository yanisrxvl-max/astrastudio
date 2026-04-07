const { getDatabase } = require("../db/database");

function listContentModules() {
  const db = getDatabase();
  const rows = db
    .prepare(`
      SELECT id, module_key, module_type, title, payload_json, created_at, updated_at
      FROM content_modules
      ORDER BY module_type ASC, module_key ASC
    `)
    .all();

  return rows.map((row) => ({
    id: row.id,
    module_key: row.module_key,
    module_type: row.module_type,
    title: row.title,
    created_at: row.created_at,
    updated_at: row.updated_at,
    payload: JSON.parse(row.payload_json),
  }));
}

function listSettings() {
  const db = getDatabase();
  const rows = db
    .prepare(`
      SELECT setting_key, setting_value, updated_at
      FROM app_settings
      ORDER BY setting_key ASC
    `)
    .all();

  return rows.reduce((accumulator, row) => {
    accumulator[row.setting_key] = row.setting_value;
    return accumulator;
  }, {});
}

module.exports = {
  listContentModules,
  listSettings,
};
