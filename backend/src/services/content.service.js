const { listContentModules, listSettings } = require("../repositories/content.repository");

function getSiteBootstrap() {
  const settings = listSettings();
  const modules = listContentModules().map((module) => ({
    key: module.module_key,
    type: module.module_type,
    title: module.title,
    updated_at: module.updated_at,
  }));

  return {
    settings,
    modules,
  };
}

function getAdminContentModules() {
  return listContentModules();
}

module.exports = {
  getAdminContentModules,
  getSiteBootstrap,
};
