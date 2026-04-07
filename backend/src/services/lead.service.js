const { createActivityLog } = require("../repositories/business.repository");
const {
  countLeadsByStatus,
  createLead,
  getLeadById,
  listLeads,
  updateLead,
} = require("../repositories/leads.repository");
const { LEAD_STATUSES } = require("../validation/lead.validation");

function getLeadSummary(leads, filters = {}) {
  const counts = countLeadsByStatus(filters);
  const byStatus = LEAD_STATUSES.reduce((accumulator, status) => {
    accumulator[status] = Number(counts[status] || 0);
    return accumulator;
  }, {});

  return {
    total: leads.length,
    latest_submission: leads[0]?.created_at || null,
    due_followups: leads.filter((lead) => lead.follow_up_status === "to_follow").length,
    pipeline_estimate: leads
      .filter((lead) => ["new", "contacted", "quote_sent"].includes(lead.status))
      .reduce((total, lead) => total + Number(lead.estimated_budget_amount || 0), 0),
    by_status: byStatus,
  };
}

async function registerLead(input, mailer) {
  const lead = createLead(input);
  createActivityLog({
    entity_type: "leads",
    entity_id: lead.id,
    action: "received",
    title: `Lead reçu • ${lead.company}`,
    description: `${lead.project_type} • ${lead.budget}`,
  });
  const deliveryUpdates = {};

  try {
    const notification = await mailer.sendLeadNotification(lead);
    deliveryUpdates.notification_status = notification.status;
    deliveryUpdates.notification_error = "";
  } catch (error) {
    deliveryUpdates.notification_status = "failed";
    deliveryUpdates.notification_error = error.message || "Erreur d'envoi";
  }

  try {
    const confirmation = await mailer.sendLeadConfirmation(lead);
    deliveryUpdates.confirmation_status = confirmation.status;
    deliveryUpdates.confirmation_error = "";
  } catch (error) {
    deliveryUpdates.confirmation_status = "failed";
    deliveryUpdates.confirmation_error = error.message || "Erreur d'envoi";
  }

  return updateLead(lead.id, deliveryUpdates);
}

function getAdminLeads(filters) {
  const leads = listLeads(filters);

  return {
    leads,
    summary: getLeadSummary(leads, filters),
  };
}

function updateLeadFromAdmin(leadId, updates) {
  return updateLead(leadId, updates);
}

function findLead(leadId) {
  return getLeadById(leadId);
}

module.exports = {
  findLead,
  getAdminLeads,
  registerLead,
  updateLeadFromAdmin,
};
