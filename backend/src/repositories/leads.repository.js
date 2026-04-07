const { randomUUID } = require("node:crypto");

const { getDatabase } = require("../db/database");
const { bindNamedParameters } = require("../utils/sqlite");

function estimateBudgetAmountFromLabel(label) {
  const text = String(label || "");

  if (text.includes("Moins de 2 000")) {
    return 1500;
  }

  if (text.includes("2 000 à 5 000")) {
    return 3500;
  }

  if (text.includes("5 000 à 10 000")) {
    return 7500;
  }

  if (text.includes("10 000")) {
    return 12000;
  }

  return 0;
}

function mapLead(row) {
  if (!row) {
    return null;
  }

  return {
    ...row,
  };
}

function buildFilterClause(filters) {
  const clauses = [];
  const params = {};

  if (filters.status) {
    clauses.push("status = @status");
    params.status = filters.status;
  }

  if (filters.follow_up_status) {
    clauses.push("follow_up_status = @follow_up_status");
    params.follow_up_status = filters.follow_up_status;
  }

  if (filters.query) {
    clauses.push(`
      (
        name LIKE @query
        OR email LIKE @query
        OR company LIKE @query
        OR project_type LIKE @query
        OR budget LIKE @query
        OR internal_notes LIKE @query
        OR message LIKE @query
      )
    `);
    params.query = `%${filters.query}%`;
  }

  return {
    whereClause: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    params,
  };
}

function listLeads(filters = {}) {
  const db = getDatabase();
  const { whereClause, params } = buildFilterClause(filters);
  const rows = db
    .prepare(`
      SELECT *
      FROM leads
      ${whereClause}
      ORDER BY datetime(created_at) DESC
    `)
    .all(bindNamedParameters(params));

  return rows.map(mapLead);
}

function countLeadsByStatus(filters = {}) {
  const db = getDatabase();
  const { whereClause, params } = buildFilterClause(filters);
  const rows = db
    .prepare(`
      SELECT status, COUNT(*) AS total
      FROM leads
      ${whereClause}
      GROUP BY status
    `)
    .all(bindNamedParameters(params));

  return rows.reduce((accumulator, row) => {
    accumulator[row.status] = row.total;
    return accumulator;
  }, {});
}

function getLeadById(id) {
  const db = getDatabase();
  const row = db.prepare("SELECT * FROM leads WHERE id = ?").get(id);
  return mapLead(row);
}

function createLead(input) {
  const db = getDatabase();
  const lead = {
    id: randomUUID(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: "new",
    quote_sent_at: "",
    last_contact_at: "",
    follow_up_status: "none",
    next_follow_up_at: "",
    internal_notes: "",
    notification_status: "pending",
    confirmation_status: "pending",
    notification_error: "",
    confirmation_error: "",
    ...input,
  };

  lead.estimated_budget_amount =
    Number(lead.estimated_budget_amount || 0) || estimateBudgetAmountFromLabel(lead.budget);

  db.prepare(`
    INSERT INTO leads (
      id, created_at, updated_at, status, name, email, phone, company,
      website_or_instagram, project_type, budget, timeline, message,
      source, referer, ip, user_agent, estimated_budget_amount, quote_sent_at,
      last_contact_at, follow_up_status, next_follow_up_at, internal_notes,
      notification_status, confirmation_status, notification_error, confirmation_error
    ) VALUES (
      @id, @created_at, @updated_at, @status, @name, @email, @phone, @company,
      @website_or_instagram, @project_type, @budget, @timeline, @message,
      @source, @referer, @ip, @user_agent, @estimated_budget_amount, @quote_sent_at,
      @last_contact_at, @follow_up_status, @next_follow_up_at, @internal_notes,
      @notification_status, @confirmation_status, @notification_error, @confirmation_error
    )
  `).run(bindNamedParameters(lead));

  return lead;
}

function updateLead(id, updates) {
  const db = getDatabase();
  const current = getLeadById(id);

  if (!current) {
    return null;
  }

  const nextLead = {
    ...current,
    ...updates,
    id: current.id,
    created_at: current.created_at,
    updated_at: new Date().toISOString(),
  };

  const updateParams = {
    id: nextLead.id,
    updated_at: nextLead.updated_at,
    status: nextLead.status,
    name: nextLead.name,
    email: nextLead.email,
    phone: nextLead.phone,
    company: nextLead.company,
    website_or_instagram: nextLead.website_or_instagram,
    project_type: nextLead.project_type,
    budget: nextLead.budget,
    timeline: nextLead.timeline,
    message: nextLead.message,
    source: nextLead.source,
    referer: nextLead.referer,
    ip: nextLead.ip,
    user_agent: nextLead.user_agent,
    estimated_budget_amount: nextLead.estimated_budget_amount,
    quote_sent_at: nextLead.quote_sent_at,
    last_contact_at: nextLead.last_contact_at,
    follow_up_status: nextLead.follow_up_status,
    next_follow_up_at: nextLead.next_follow_up_at,
    internal_notes: nextLead.internal_notes,
    notification_status: nextLead.notification_status,
    confirmation_status: nextLead.confirmation_status,
    notification_error: nextLead.notification_error,
    confirmation_error: nextLead.confirmation_error,
  };

  db.prepare(`
    UPDATE leads SET
      updated_at = @updated_at,
      status = @status,
      name = @name,
      email = @email,
      phone = @phone,
      company = @company,
      website_or_instagram = @website_or_instagram,
      project_type = @project_type,
      budget = @budget,
      timeline = @timeline,
      message = @message,
      source = @source,
      referer = @referer,
      ip = @ip,
      user_agent = @user_agent,
      estimated_budget_amount = @estimated_budget_amount,
      quote_sent_at = @quote_sent_at,
      last_contact_at = @last_contact_at,
      follow_up_status = @follow_up_status,
      next_follow_up_at = @next_follow_up_at,
      internal_notes = @internal_notes,
      notification_status = @notification_status,
      confirmation_status = @confirmation_status,
      notification_error = @notification_error,
      confirmation_error = @confirmation_error
    WHERE id = @id
  `).run(bindNamedParameters(updateParams));

  return nextLead;
}

module.exports = {
  countLeadsByStatus,
  createLead,
  estimateBudgetAmountFromLabel,
  getLeadById,
  listLeads,
  updateLead,
};
