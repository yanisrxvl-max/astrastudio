const { randomUUID } = require("node:crypto");

const { getDatabase } = require("../db/database");
const { bindNamedParameters } = require("../utils/sqlite");

const ENTITY_DEFINITIONS = {
  clients: {
    table: "clients",
    primaryKey: "id",
    searchFields: ["contact_name", "company", "email", "website", "instagram", "notes"],
    columns: [
      "id",
      "created_at",
      "updated_at",
      "lead_id",
      "contact_name",
      "company",
      "email",
      "phone",
      "website",
      "instagram",
      "client_type",
      "status",
      "estimated_value",
      "useful_links",
      "notes",
      "collaboration_history",
      "last_contact_at",
    ],
    listFilters: ["status", "client_type"],
  },
  projects: {
    table: "projects",
    primaryKey: "id",
    searchFields: ["name", "mission_type", "description", "deliverables", "notes"],
    columns: [
      "id",
      "created_at",
      "updated_at",
      "client_id",
      "name",
      "mission_type",
      "status",
      "priority",
      "start_date",
      "deadline",
      "budget",
      "description",
      "deliverables",
      "useful_links",
      "notes",
    ],
    listFilters: ["status", "client_id", "priority"],
  },
  documents: {
    table: "documents",
    primaryKey: "id",
    searchFields: ["title", "category", "description", "tags"],
    columns: [
      "id",
      "created_at",
      "updated_at",
      "client_id",
      "project_id",
      "title",
      "category",
      "document_type",
      "file_url",
      "description",
      "tags",
      "issued_at",
    ],
    listFilters: ["client_id", "project_id", "category", "document_type"],
  },
  media_items: {
    table: "media_items",
    primaryKey: "id",
    searchFields: ["title", "media_type", "tags", "description"],
    columns: [
      "id",
      "created_at",
      "updated_at",
      "client_id",
      "project_id",
      "title",
      "media_type",
      "preview_url",
      "asset_url",
      "tags",
      "description",
      "captured_at",
    ],
    listFilters: ["client_id", "project_id", "media_type"],
  },
  resources: {
    table: "resources",
    primaryKey: "id",
    searchFields: ["name", "category", "description", "usage_notes", "tags"],
    columns: [
      "id",
      "created_at",
      "updated_at",
      "name",
      "category",
      "url",
      "description",
      "usage_notes",
      "tags",
    ],
    listFilters: ["category"],
  },
};

function getEntityDefinition(entityName) {
  const definition = ENTITY_DEFINITIONS[entityName];

  if (!definition) {
    throw new Error(`Entité inconnue : ${entityName}`);
  }

  return definition;
}

function buildWhereClause(entityName, filters = {}) {
  const definition = getEntityDefinition(entityName);
  const clauses = [];
  const params = {};

  definition.listFilters.forEach((filterKey) => {
    if (filters[filterKey]) {
      clauses.push(`${filterKey} = @${filterKey}`);
      params[filterKey] = filters[filterKey];
    }
  });

  if (filters.q) {
    const queryClauses = definition.searchFields.map((field, index) => {
      const paramName = `query_${index}`;
      params[paramName] = `%${filters.q}%`;
      return `${field} LIKE @${paramName}`;
    });

    clauses.push(`(${queryClauses.join(" OR ")})`);
  }

  return {
    whereClause: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    params,
  };
}

function listEntities(entityName, filters = {}) {
  const db = getDatabase();
  const definition = getEntityDefinition(entityName);
  const { whereClause, params } = buildWhereClause(entityName, filters);

  return db
    .prepare(`
      SELECT *
      FROM ${definition.table}
      ${whereClause}
      ORDER BY datetime(updated_at) DESC
    `)
    .all(bindNamedParameters(params));
}

function getEntityById(entityName, id) {
  const db = getDatabase();
  const definition = getEntityDefinition(entityName);

  return (
    db
      .prepare(`SELECT * FROM ${definition.table} WHERE ${definition.primaryKey} = ?`)
      .get(id) || null
  );
}

function createEntity(entityName, input) {
  const db = getDatabase();
  const definition = getEntityDefinition(entityName);
  const timestamp = new Date().toISOString();
  const record = {
    id: randomUUID(),
    created_at: timestamp,
    updated_at: timestamp,
    ...input,
  };

  const columns = definition.columns;
  const placeholders = columns.map((column) => `@${column}`).join(", ");

  db.prepare(`
    INSERT INTO ${definition.table} (${columns.join(", ")})
    VALUES (${placeholders})
  `).run(bindNamedParameters(record));

  return record;
}

function updateEntity(entityName, id, updates) {
  const db = getDatabase();
  const definition = getEntityDefinition(entityName);
  const current = getEntityById(entityName, id);

  if (!current) {
    return null;
  }

  const next = {
    ...current,
    ...updates,
    id: current.id,
    created_at: current.created_at,
    updated_at: new Date().toISOString(),
  };

  const assignments = definition.columns
    .filter((column) => column !== "id" && column !== "created_at")
    .map((column) => `${column} = @${column}`)
    .join(",\n      ");

  const statementPayload = definition.columns
    .filter((column) => column !== "created_at")
    .reduce(
      (accumulator, column) => {
        accumulator[column] = next[column];
        return accumulator;
      },
      { id: current.id }
    );

  db.prepare(`
    UPDATE ${definition.table}
    SET ${assignments}
    WHERE ${definition.primaryKey} = @id
  `).run(bindNamedParameters(statementPayload));

  return next;
}

function deleteEntity(entityName, id) {
  const db = getDatabase();
  const definition = getEntityDefinition(entityName);
  const existing = getEntityById(entityName, id);

  if (!existing) {
    return false;
  }

  db.prepare(`DELETE FROM ${definition.table} WHERE ${definition.primaryKey} = ?`).run(id);
  return true;
}

function createActivityLog(entry) {
  const db = getDatabase();

  db.prepare(`
    INSERT INTO activity_logs (entity_type, entity_id, action, title, description, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    entry.entity_type,
    entry.entity_id,
    entry.action,
    entry.title,
    entry.description || "",
    entry.created_at || new Date().toISOString()
  );
}

function listActivityLogs(limit = 8) {
  const db = getDatabase();
  return db
    .prepare(`
      SELECT *
      FROM activity_logs
      ORDER BY datetime(created_at) DESC
      LIMIT ?
    `)
    .all(limit);
}

function listActivityLogsForEntity(entityType, entityId, limit = 10) {
  const db = getDatabase();
  return db
    .prepare(`
      SELECT *
      FROM activity_logs
      WHERE entity_type = ?
        AND entity_id = ?
      ORDER BY datetime(created_at) DESC
      LIMIT ?
    `)
    .all(entityType, entityId, limit);
}

function getLeadRelations(leadId) {
  const db = getDatabase();
  const lead = db.prepare("SELECT * FROM leads WHERE id = ?").get(leadId);

  if (!lead) {
    return {
      client: null,
      projects: [],
      documents: [],
    };
  }

  const client =
    db
      .prepare(`
        SELECT *
        FROM clients
        WHERE lead_id = ?
           OR (lead_id = '' AND email = ?)
        ORDER BY CASE WHEN lead_id = ? THEN 0 ELSE 1 END, datetime(updated_at) DESC
        LIMIT 1
      `)
      .get(lead.id, lead.email, lead.id) || null;

  if (!client) {
    return {
      client: null,
      projects: [],
      documents: [],
    };
  }

  return {
    client,
    projects: db
      .prepare(
        "SELECT * FROM projects WHERE client_id = ? ORDER BY datetime(updated_at) DESC LIMIT 6"
      )
      .all(client.id),
    documents: db
      .prepare(
        "SELECT * FROM documents WHERE client_id = ? ORDER BY datetime(updated_at) DESC LIMIT 6"
      )
      .all(client.id),
  };
}

function getClientRelations(clientId) {
  const db = getDatabase();

  return {
    projects: db.prepare("SELECT * FROM projects WHERE client_id = ? ORDER BY datetime(updated_at) DESC").all(clientId),
    documents: db.prepare("SELECT * FROM documents WHERE client_id = ? ORDER BY datetime(updated_at) DESC").all(clientId),
    media_items: db.prepare("SELECT * FROM media_items WHERE client_id = ? ORDER BY datetime(updated_at) DESC").all(clientId),
  };
}

function getProjectRelations(projectId) {
  const db = getDatabase();

  return {
    documents: db.prepare("SELECT * FROM documents WHERE project_id = ? ORDER BY datetime(updated_at) DESC").all(projectId),
    media_items: db.prepare("SELECT * FROM media_items WHERE project_id = ? ORDER BY datetime(updated_at) DESC").all(projectId),
  };
}

function getDashboardSnapshot() {
  const db = getDatabase();

  const leadCountsRows = db
    .prepare(`
      SELECT status, COUNT(*) AS total
      FROM leads
      GROUP BY status
    `)
    .all();

  const leadCounts = leadCountsRows.reduce((accumulator, row) => {
    accumulator[row.status] = row.total;
    return accumulator;
  }, {});

  const activeClients =
    db.prepare("SELECT COUNT(*) AS total FROM clients WHERE status IN ('active', 'onboarding')").get()
      .total || 0;
  const activeProjects =
    db.prepare("SELECT COUNT(*) AS total FROM projects WHERE status IN ('planned', 'in_progress', 'waiting_feedback')").get()
      .total || 0;
  const plannedRevenue =
    db.prepare("SELECT COALESCE(SUM(budget), 0) AS total FROM projects WHERE status IN ('planned', 'in_progress', 'waiting_feedback')").get()
      .total || 0;
  const clientsCount =
    db.prepare("SELECT COUNT(*) AS total FROM clients").get().total || 0;
  const projectsCount =
    db.prepare("SELECT COUNT(*) AS total FROM projects").get().total || 0;
  const recentLeads = db
    .prepare("SELECT * FROM leads ORDER BY datetime(created_at) DESC LIMIT 5")
    .all();
  const followUpLeads = db
    .prepare(`
      SELECT *
      FROM leads
      WHERE status IN ('new', 'contacted', 'quote_sent')
        AND follow_up_status = 'to_follow'
      ORDER BY
        CASE WHEN next_follow_up_at = '' THEN 1 ELSE 0 END,
        date(next_follow_up_at) ASC,
        datetime(updated_at) DESC
      LIMIT 5
    `)
    .all();
  const recentProjects = db
    .prepare(`
      SELECT projects.*, clients.company AS client_company
      FROM projects
      LEFT JOIN clients ON clients.id = projects.client_id
      ORDER BY datetime(projects.updated_at) DESC
      LIMIT 5
    `)
    .all();
  const urgentProjects = db
    .prepare(`
      SELECT projects.*, clients.company AS client_company
      FROM projects
      LEFT JOIN clients ON clients.id = projects.client_id
      WHERE projects.status IN ('planned', 'in_progress', 'waiting_feedback')
        AND projects.deadline != ''
      ORDER BY date(projects.deadline) ASC
      LIMIT 5
    `)
    .all();
  const dueFollowUps =
    db.prepare(`
      SELECT COUNT(*) AS total
      FROM leads
      WHERE status IN ('new', 'contacted', 'quote_sent')
        AND follow_up_status = 'to_follow'
    `).get().total || 0;

  return {
    metrics: {
      new_leads: Number(leadCounts.new || 0),
      contacted_leads: Number(leadCounts.contacted || 0),
      quote_sent: Number(leadCounts.quote_sent || 0),
      won_leads: Number(leadCounts.won || 0),
      lost_leads: Number(leadCounts.lost || 0),
      due_follow_ups: Number(dueFollowUps),
      total_clients: Number(clientsCount),
      total_projects: Number(projectsCount),
      active_clients: Number(activeClients),
      active_projects: Number(activeProjects),
      planned_revenue: Number(plannedRevenue),
    },
    recent_leads: recentLeads,
    follow_up_leads: followUpLeads,
    recent_projects: recentProjects,
    urgent_projects: urgentProjects,
    recent_activity: listActivityLogs(),
  };
}

module.exports = {
  createActivityLog,
  createEntity,
  deleteEntity,
  getClientRelations,
  getDashboardSnapshot,
  getEntityById,
  getLeadRelations,
  getProjectRelations,
  listActivityLogs,
  listActivityLogsForEntity,
  listEntities,
  updateEntity,
};
