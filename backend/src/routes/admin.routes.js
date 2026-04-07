const express = require("express");

const { requireAdminSession } = require("../middleware/admin-session");
const { asyncHandler } = require("../utils/async-handler");
const { buildCsv } = require("../utils/csv");
const { createHttpError } = require("../utils/http-error");
const { sanitizeText } = require("../utils/sanitize");
const { getAdminLeads, updateLeadFromAdmin, findLead } = require("../services/lead.service");
const { getAdminContentModules } = require("../services/content.service");
const {
  createActivityLog,
  createEntity,
  deleteEntity,
  getClientRelations,
  getDashboardSnapshot,
  getEntityById,
  getLeadRelations,
  getProjectRelations,
  listActivityLogsForEntity,
  listEntities,
  updateEntity,
} = require("../repositories/business.repository");
const {
  FOLLOW_UP_STATUSES,
  validateLeadUpdatePayload,
} = require("../validation/lead.validation");
const {
  validateClientPayload,
  validateDocumentPayload,
  validateMediaPayload,
  validateProjectPayload,
  validateResourcePayload,
} = require("../validation/business.validation");
const { config } = require("../config/env");

function buildFilters(req, allowedKeys) {
  return allowedKeys.reduce((accumulator, key) => {
    const value = sanitizeText(req.query[key], { max: 120 });

    if (value) {
      accumulator[key] = value;
    }

    return accumulator;
  }, {});
}

function estimateLeadBudget(label) {
  if (label.includes("Moins de 2 000")) {
    return 1500;
  }

  if (label.includes("2 000 à 5 000")) {
    return 3500;
  }

  if (label.includes("5 000 à 10 000")) {
    return 7500;
  }

  if (label.includes("10 000")) {
    return 12000;
  }

  return 0;
}

function getLeadPipelineAmount(lead) {
  return Number(lead.estimated_budget_amount || 0) || estimateLeadBudget(lead.budget);
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatLeadStatusLabel(status) {
  const labels = {
    new: "Lead reçu",
    contacted: "Lead contacté",
    quote_sent: "Devis envoyé",
    won: "Projet gagné",
    lost: "Projet perdu",
  };

  return labels[status] || status;
}

function formatFollowUpStatusLabel(status) {
  const labels = {
    none: "Aucune relance",
    to_follow: "À relancer",
    waiting_reply: "En attente de réponse",
    closed: "Bouclé",
  };

  return labels[status] || status;
}

function buildLeadActivityDescription(previousLead, updatedLead, submittedValues) {
  const fragments = [];

  if (submittedValues.status && previousLead.status !== updatedLead.status) {
    fragments.push(`Statut : ${formatLeadStatusLabel(updatedLead.status)}`);
  }

  if (
    typeof submittedValues.estimated_budget_amount !== "undefined" &&
    Number(previousLead.estimated_budget_amount || 0) !== Number(updatedLead.estimated_budget_amount || 0)
  ) {
    fragments.push(`Budget estimé : ${updatedLead.estimated_budget_amount} €`);
  }

  if (typeof submittedValues.quote_sent_at !== "undefined" && updatedLead.quote_sent_at) {
    fragments.push(`Devis envoyé : ${updatedLead.quote_sent_at}`);
  }

  if (typeof submittedValues.last_contact_at !== "undefined" && updatedLead.last_contact_at) {
    fragments.push(`Dernier contact : ${updatedLead.last_contact_at}`);
  }

  if (
    typeof submittedValues.follow_up_status !== "undefined" &&
    previousLead.follow_up_status !== updatedLead.follow_up_status
  ) {
    fragments.push(`Relance : ${formatFollowUpStatusLabel(updatedLead.follow_up_status)}`);
  }

  if (typeof submittedValues.next_follow_up_at !== "undefined" && updatedLead.next_follow_up_at) {
    fragments.push(`Prochaine relance : ${updatedLead.next_follow_up_at}`);
  }

  if (
    typeof submittedValues.internal_notes !== "undefined" &&
    previousLead.internal_notes !== updatedLead.internal_notes
  ) {
    fragments.push("Notes internes mises à jour");
  }

  return fragments.join(" • ") || "Fiche commerciale mise à jour";
}

function createCrudRoutes(router, options) {
  const {
    basePath,
    entityName,
    allowedFilters,
    validatePayload,
    createTitle,
    updateTitle,
  } = options;

  router.get(
    basePath,
    asyncHandler(async (req, res) => {
      const filters = buildFilters(req, allowedFilters);
      const items = listEntities(entityName, filters);

      res.json({
        ok: true,
        items,
        filters,
      });
    })
  );

  router.post(
    basePath,
    asyncHandler(async (req, res) => {
      const validation = validatePayload(req.body);

      if (!validation.valid) {
        throw createHttpError(400, "Les données envoyées sont invalides.", {
          field_errors: validation.errors,
        });
      }

      const item = createEntity(entityName, validation.values);

      createActivityLog({
        entity_type: entityName,
        entity_id: item.id,
        action: "created",
        title: createTitle(item),
        description: "",
      });

      res.status(201).json({
        ok: true,
        item,
      });
    })
  );

  router.get(
    `${basePath}/:itemId`,
    asyncHandler(async (req, res) => {
      const item = getEntityById(entityName, req.params.itemId);

      if (!item) {
        throw createHttpError(404, "Entrée introuvable.");
      }

      let relations = {};

      if (entityName === "clients") {
        relations = getClientRelations(item.id);
      }

      if (entityName === "projects") {
        relations = getProjectRelations(item.id);
      }

      res.json({
        ok: true,
        item,
        relations,
      });
    })
  );

  router.patch(
    `${basePath}/:itemId`,
    asyncHandler(async (req, res) => {
      const validation = validatePayload(req.body);

      if (!validation.valid) {
        throw createHttpError(400, "Les données envoyées sont invalides.", {
          field_errors: validation.errors,
        });
      }

      const item = updateEntity(entityName, req.params.itemId, validation.values);

      if (!item) {
        throw createHttpError(404, "Entrée introuvable.");
      }

      createActivityLog({
        entity_type: entityName,
        entity_id: item.id,
        action: "updated",
        title: updateTitle(item),
        description: "",
      });

      res.json({
        ok: true,
        item,
      });
    })
  );

  router.delete(
    `${basePath}/:itemId`,
    asyncHandler(async (req, res) => {
      const item = getEntityById(entityName, req.params.itemId);

      if (!item) {
        throw createHttpError(404, "Entrée introuvable.");
      }

      const deleted = deleteEntity(entityName, req.params.itemId);

      if (!deleted) {
        throw createHttpError(500, "Suppression impossible.");
      }

      createActivityLog({
        entity_type: entityName,
        entity_id: req.params.itemId,
        action: "deleted",
        title: `${entityName} supprimé`,
        description: "",
      });

      res.json({
        ok: true,
      });
    })
  );
}

function createAdminRouter({ mailer }) {
  const router = express.Router();

  router.use(requireAdminSession);

  router.get(
    "/dashboard",
    asyncHandler(async (req, res) => {
      const snapshot = getDashboardSnapshot();
      const leads = getAdminLeads({}).leads;
      const pipelineEstimate = leads
        .filter((lead) => ["new", "contacted", "quote_sent"].includes(lead.status))
        .reduce((total, lead) => total + getLeadPipelineAmount(lead), 0);

      res.json({
        ok: true,
        data: {
          ...snapshot,
          metrics: {
            ...snapshot.metrics,
            pipeline_estimate: pipelineEstimate,
          },
        },
      });
    })
  );

  router.get(
    "/leads",
    asyncHandler(async (req, res) => {
      const filters = {
        status: sanitizeText(req.query.status, { max: 40 }),
        follow_up_status: sanitizeText(req.query.follow_up_status, { max: 40 }),
        query: sanitizeText(req.query.q, { max: 120 }),
      };

      const payload = getAdminLeads(filters);

      res.json({
        ok: true,
        summary: payload.summary,
        leads: payload.leads,
        email_configured: mailer.isConfigured,
        storage_file: config.databaseFile,
        filters,
      });
    })
  );

  router.get(
    "/leads/export.json",
    asyncHandler(async (req, res) => {
      const filters = {
        status: sanitizeText(req.query.status, { max: 40 }),
        follow_up_status: sanitizeText(req.query.follow_up_status, { max: 40 }),
        query: sanitizeText(req.query.q, { max: 120 }),
      };
      const payload = getAdminLeads(filters);

      res.setHeader("Content-Disposition", 'attachment; filename="astra-studio-leads.json"');
      res.json({
        exported_at: new Date().toISOString(),
        total: payload.leads.length,
        filters,
        leads: payload.leads,
      });
    })
  );

  router.get(
    "/leads/export.csv",
    asyncHandler(async (req, res) => {
      const filters = {
        status: sanitizeText(req.query.status, { max: 40 }),
        follow_up_status: sanitizeText(req.query.follow_up_status, { max: 40 }),
        query: sanitizeText(req.query.q, { max: 120 }),
      };
      const payload = getAdminLeads(filters);
      const csv = buildCsv(payload.leads);

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="astra-studio-leads.csv"');
      res.send(csv);
    })
  );

  router.get(
    "/leads/:leadId",
    asyncHandler(async (req, res) => {
      const lead = findLead(req.params.leadId);

      if (!lead) {
        throw createHttpError(404, "Lead introuvable.");
      }

      res.json({
        ok: true,
        lead,
        relations: getLeadRelations(lead.id),
        activity: listActivityLogsForEntity("leads", lead.id, 12),
      });
    })
  );

  router.patch(
    "/leads/:leadId",
    asyncHandler(async (req, res) => {
      const validation = validateLeadUpdatePayload(req.body);

      if (!validation.valid) {
        throw createHttpError(400, "Les données de mise à jour sont invalides.", {
          field_errors: validation.errors,
        });
      }

      const currentLead = findLead(req.params.leadId);

      if (!currentLead) {
        throw createHttpError(404, "Lead introuvable.");
      }

      const updates = {
        ...validation.values,
      };

      if (updates.status === "contacted" && !updates.last_contact_at && !currentLead.last_contact_at) {
        updates.last_contact_at = getTodayDate();
      }

      if (updates.status === "quote_sent" && !updates.quote_sent_at && !currentLead.quote_sent_at) {
        updates.quote_sent_at = getTodayDate();
      }

      if (
        typeof updates.next_follow_up_at !== "undefined" &&
        updates.next_follow_up_at &&
        typeof updates.follow_up_status === "undefined"
      ) {
        updates.follow_up_status = "to_follow";
      }

      if (["won", "lost"].includes(updates.status || currentLead.status)) {
        updates.follow_up_status = "closed";
      }

      if (
        typeof updates.follow_up_status !== "undefined" &&
        !FOLLOW_UP_STATUSES.includes(updates.follow_up_status)
      ) {
        throw createHttpError(400, "Statut de relance invalide.");
      }

      const updatedLead = updateLeadFromAdmin(req.params.leadId, updates);

      if (!updatedLead) {
        throw createHttpError(404, "Lead introuvable.");
      }

      createActivityLog({
        entity_type: "leads",
        entity_id: updatedLead.id,
        action: "updated",
        title: `Lead mis à jour • ${updatedLead.company}`,
        description: buildLeadActivityDescription(currentLead, updatedLead, updates),
      });

      res.json({
        ok: true,
        lead: updatedLead,
      });
    })
  );

  router.post(
    "/leads/:leadId/convert",
    asyncHandler(async (req, res) => {
      const lead = findLead(req.params.leadId);

      if (!lead) {
        throw createHttpError(404, "Lead introuvable.");
      }

      const existingClient = listEntities("clients", { q: lead.company }).find(
        (client) => client.lead_id === lead.id || client.email === lead.email
      );

      if (existingClient) {
        return res.json({
          ok: true,
          item: existingClient,
          message: "Ce lead est déjà relié à un client existant.",
        });
      }

      const client = createEntity("clients", {
        lead_id: lead.id,
        contact_name: lead.name,
        company: lead.company,
        email: lead.email,
        phone: lead.phone || "",
        website: lead.website_or_instagram || "",
        instagram: "",
        client_type: "brand",
        status: "onboarding",
        estimated_value: getLeadPipelineAmount(lead),
        useful_links: lead.website_or_instagram || "",
        notes: lead.internal_notes || "",
        collaboration_history: `Client créé à partir du lead du ${lead.created_at}.`,
        last_contact_at: lead.last_contact_at || getTodayDate(),
      });

      createActivityLog({
        entity_type: "clients",
        entity_id: client.id,
        action: "created_from_lead",
        title: `Client créé depuis un lead • ${client.company}`,
        description: `Lead source : ${lead.id}`,
      });

      const updatedLead = updateLeadFromAdmin(lead.id, {
        status: "won",
        last_contact_at: getTodayDate(),
        follow_up_status: "closed",
      });

      createActivityLog({
        entity_type: "leads",
        entity_id: lead.id,
        action: "converted",
        title: `Lead gagné • ${lead.company}`,
        description: `Converti en client${updatedLead?.estimated_budget_amount ? ` • ${updatedLead.estimated_budget_amount} € estimés` : ""}`,
      });

      res.status(201).json({
        ok: true,
        item: client,
      });
    })
  );

  createCrudRoutes(router, {
    basePath: "/clients",
    entityName: "clients",
    allowedFilters: ["status", "client_type", "q"],
    validatePayload: validateClientPayload,
    createTitle: (item) => `Client créé • ${item.company}`,
    updateTitle: (item) => `Client mis à jour • ${item.company}`,
  });

  createCrudRoutes(router, {
    basePath: "/projects",
    entityName: "projects",
    allowedFilters: ["status", "client_id", "priority", "q"],
    validatePayload: validateProjectPayload,
    createTitle: (item) => `Projet créé • ${item.name}`,
    updateTitle: (item) => `Projet mis à jour • ${item.name}`,
  });

  createCrudRoutes(router, {
    basePath: "/documents",
    entityName: "documents",
    allowedFilters: ["client_id", "project_id", "category", "document_type", "q"],
    validatePayload: validateDocumentPayload,
    createTitle: (item) => `Document créé • ${item.title}`,
    updateTitle: (item) => `Document mis à jour • ${item.title}`,
  });

  createCrudRoutes(router, {
    basePath: "/media",
    entityName: "media_items",
    allowedFilters: ["client_id", "project_id", "media_type", "q"],
    validatePayload: validateMediaPayload,
    createTitle: (item) => `Média créé • ${item.title}`,
    updateTitle: (item) => `Média mis à jour • ${item.title}`,
  });

  createCrudRoutes(router, {
    basePath: "/resources",
    entityName: "resources",
    allowedFilters: ["category", "q"],
    validatePayload: validateResourcePayload,
    createTitle: (item) => `Ressource créée • ${item.name}`,
    updateTitle: (item) => `Ressource mise à jour • ${item.name}`,
  });

  router.get(
    "/content/modules",
    asyncHandler(async (req, res) => {
      res.json({
        ok: true,
        modules: getAdminContentModules(),
      });
    })
  );

  router.get("/settings", (req, res) => {
    res.json({
      ok: true,
      settings: {
        admin_user: req.adminSession?.username || config.admin.username,
        email_configured: mailer.isConfigured,
        database_file: config.databaseFile,
      },
    });
  });

  return router;
}

module.exports = {
  createAdminRouter,
};
