const adminView = document.querySelector("[data-admin-view]");
const sectionKicker = document.querySelector("[data-admin-section-kicker]");
const sectionTitle = document.querySelector("[data-admin-section-title]");
const sectionDescription = document.querySelector("[data-admin-section-description]");
const appFeedback = document.querySelector("[data-admin-app-feedback]");
const refreshButton = document.querySelector("[data-admin-global-refresh]");
const logoutButton = document.querySelector("[data-admin-logout]");
const navButtons = document.querySelectorAll("[data-admin-section-target]");
const LEAD_STATUS_OPTIONS = ["new", "contacted", "quote_sent", "won", "lost"];
const FOLLOW_UP_STATUS_OPTIONS = ["none", "to_follow", "waiting_reply", "closed"];
const LEAD_STATUS_LABELS = {
  new: "Lead reçu",
  contacted: "Lead contacté",
  quote_sent: "Devis envoyé",
  won: "Projet gagné",
  lost: "Projet perdu",
};
const FOLLOW_UP_STATUS_LABELS = {
  none: "Aucune relance",
  to_follow: "À relancer",
  waiting_reply: "En attente de réponse",
  closed: "Bouclé",
};

const sectionMeta = {
  dashboard: {
    kicker: "Cockpit",
    title: "Vue d’ensemble",
    description:
      "Une lecture rapide des demandes, du pipeline, des clients actifs et des projets à surveiller.",
  },
  leads: {
    kicker: "Pipeline",
    title: "Leads & demandes",
    description:
      "Filtrer, relancer, annoter et convertir les demandes sérieuses en vrais clients structurés.",
  },
  clients: {
    kicker: "Base clients",
    title: "Clients",
    description:
      "Centraliser les coordonnées, l’historique, les notes et les liens utiles par client ou marque.",
  },
  projects: {
    kicker: "Production",
    title: "Projets & missions",
    description:
      "Suivre les livrables, les deadlines, les budgets, les urgences et les missions en attente.",
  },
  documents: {
    kicker: "Rangement",
    title: "Documents",
    description:
      "Classer briefs, devis, contrats, factures et documents stratégiques par client et par projet.",
  },
  media: {
    kicker: "Bibliothèque",
    title: "Médias",
    description:
      "Retrouver vite les visuels, vidéos et assets créatifs associés à chaque mission.",
  },
  resources: {
    kicker: "Outils",
    title: "Ressources",
    description:
      "Rassembler les outils, templates, liens, ressources et repères utiles au quotidien du studio.",
  },
  settings: {
    kicker: "Configuration",
    title: "Paramètres & structure",
    description:
      "Voir l’état technique de l’admin, la base en place et les modules préparés pour l’évolution future.",
  },
};

const entityMeta = {
  clients: {
    endpoint: "/api/admin/clients",
    label: "client",
    selectionKey: "clients",
  },
  projects: {
    endpoint: "/api/admin/projects",
    label: "projet",
    selectionKey: "projects",
  },
  documents: {
    endpoint: "/api/admin/documents",
    label: "document",
    selectionKey: "documents",
  },
  media: {
    endpoint: "/api/admin/media",
    label: "média",
    selectionKey: "media",
  },
  resources: {
    endpoint: "/api/admin/resources",
    label: "ressource",
    selectionKey: "resources",
  },
};

const state = {
  section: "dashboard",
  filters: {
    leads: { status: "", follow_up_status: "", q: "" },
    clients: { status: "", client_type: "", q: "" },
    projects: { status: "", client_id: "", priority: "", q: "" },
    documents: { client_id: "", project_id: "", category: "", document_type: "", q: "" },
    media: { client_id: "", project_id: "", media_type: "", q: "" },
    resources: { category: "", q: "" },
  },
  data: {
    dashboard: null,
    leads: [],
    leadSummary: null,
    leadDetail: null,
    clients: [],
    clientDetail: null,
    projects: [],
    projectDetail: null,
    documents: [],
    documentDetail: null,
    media: [],
    mediaDetail: null,
    resources: [],
    resourceDetail: null,
    settings: null,
    contentModules: [],
    lookups: {
      clients: [],
      projects: [],
    },
  },
  selection: {
    leads: null,
    clients: null,
    projects: null,
    documents: null,
    media: null,
    resources: null,
  },
};

let searchDebounceId = null;

function getDetailStateKey(sectionName) {
  const mapping = {
    leads: "leadDetail",
    clients: "clientDetail",
    projects: "projectDetail",
    documents: "documentDetail",
    media: "mediaDetail",
    resources: "resourceDetail",
  };

  return mapping[sectionName];
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDate(value) {
  if (!value) {
    return "Non renseigné";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatCurrency(value) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatLeadStatus(status) {
  return LEAD_STATUS_LABELS[status] || status || "Non renseigné";
}

function formatFollowUpStatus(status) {
  return FOLLOW_UP_STATUS_LABELS[status] || status || "Non renseigné";
}

function formatDateOnly(value) {
  if (!value) {
    return "Non renseigné";
  }

  const normalizedValue = String(value).includes("T") ? value : `${value}T12:00:00`;

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
  }).format(new Date(normalizedValue));
}

function getLeadStatusTone(status) {
  return `is-${status || "default"}`;
}

function getFollowUpTone(status) {
  const toneMap = {
    none: "is-muted",
    to_follow: "is-attention",
    waiting_reply: "is-progress",
    closed: "is-success",
  };

  return toneMap[status] || "is-muted";
}

function setFeedback(message, type = "") {
  if (!appFeedback) {
    return;
  }

  appFeedback.textContent = message;
  appFeedback.classList.remove("is-success", "is-error");

  if (type) {
    appFeedback.classList.add(`is-${type}`);
  }
}

function getSectionFromHash() {
  const hash = window.location.hash.replace(/^#/, "");
  return sectionMeta[hash] ? hash : "dashboard";
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    ...options,
  });

  const payload = await response.json().catch(() => ({}));

  if (response.status === 401) {
    window.location.href = "/admin/login";
    throw new Error("Session expirée.");
  }

  if (!response.ok) {
    const error = new Error(payload.message || "La requête a échoué.");
    error.payload = payload;
    throw error;
  }

  return payload;
}

function updateHeader() {
  const meta = sectionMeta[state.section];

  if (sectionKicker) {
    sectionKicker.textContent = meta.kicker;
  }

  if (sectionTitle) {
    sectionTitle.textContent = meta.title;
  }

  if (sectionDescription) {
    sectionDescription.textContent = meta.description;
  }

  navButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.adminSectionTarget === state.section);
  });
}

function renderPill(value, tone = "") {
  return `<span class="admin-pill ${escapeHtml(tone)}">${escapeHtml(value)}</span>`;
}

function renderEmptyState(message) {
  return `<div class="admin-empty-state">${escapeHtml(message)}</div>`;
}

function renderQuickLink(target, title, copy) {
  return `
    <button class="admin-quick-link" type="button" data-admin-go-section="${target}">
      <strong>${escapeHtml(title)}</strong>
      <p>${escapeHtml(copy)}</p>
    </button>
  `;
}

function renderOptions(items, selectedValue, labelBuilder) {
  return items
    .map((item) => {
      const selected = String(item.id) === String(selectedValue) ? "selected" : "";
      return `<option value="${escapeHtml(item.id)}" ${selected}>${escapeHtml(
        labelBuilder(item)
      )}</option>`;
    })
    .join("");
}

function getLookupClientLabel(client) {
  return client.contact_name ? `${client.company} • ${client.contact_name}` : `${client.company}`;
}

function getLookupProjectLabel(project) {
  return `${project.name}`;
}

async function loadLookups(force = false) {
  if (!force && state.data.lookups.clients.length && state.data.lookups.projects.length) {
    return;
  }

  const [clientsPayload, projectsPayload] = await Promise.all([
    apiRequest("/api/admin/clients"),
    apiRequest("/api/admin/projects"),
  ]);

  state.data.lookups.clients = clientsPayload.items || [];
  state.data.lookups.projects = projectsPayload.items || [];
}

async function loadDashboard() {
  const payload = await apiRequest("/api/admin/dashboard");
  state.data.dashboard = payload.data;
}

async function loadLeads() {
  const params = new URLSearchParams();
  const filters = state.filters.leads;

  if (filters.status) {
    params.set("status", filters.status);
  }

  if (filters.follow_up_status) {
    params.set("follow_up_status", filters.follow_up_status);
  }

  if (filters.q) {
    params.set("q", filters.q);
  }

  const payload = await apiRequest(`/api/admin/leads?${params.toString()}`);
  state.data.leads = payload.leads || [];
  state.data.leadSummary = payload.summary;

  if (!state.selection.leads || !state.data.leads.some((lead) => lead.id === state.selection.leads)) {
    state.selection.leads = state.data.leads[0]?.id || null;
  }

  if (state.selection.leads) {
    state.data.leadDetail = await apiRequest(`/api/admin/leads/${state.selection.leads}`);
  } else {
    state.data.leadDetail = null;
  }
}

async function loadEntitySection(sectionName, forceLookups = false) {
  const meta = entityMeta[sectionName];
  const filters = state.filters[sectionName];
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const payload = await apiRequest(`${meta.endpoint}?${params.toString()}`);
  state.data[sectionName] = payload.items || [];

  if (
    state.selection[sectionName] !== "new" &&
    (!state.selection[sectionName] ||
      !state.data[sectionName].some((item) => item.id === state.selection[sectionName]))
  ) {
    state.selection[sectionName] = state.data[sectionName][0]?.id || "new";
  }

  if (["clients", "projects", "documents", "media"].includes(sectionName)) {
    await loadLookups(forceLookups);
  }

  if (state.selection[sectionName] && state.selection[sectionName] !== "new") {
    const detailPayload = await apiRequest(`${meta.endpoint}/${state.selection[sectionName]}`);
    state.data[getDetailStateKey(sectionName)] = detailPayload;
  } else {
    state.data[getDetailStateKey(sectionName)] = null;
  }
}

async function loadSettings() {
  const [settingsPayload, modulesPayload] = await Promise.all([
    apiRequest("/api/admin/settings"),
    apiRequest("/api/admin/content/modules"),
  ]);

  state.data.settings = settingsPayload.settings;
  state.data.contentModules = modulesPayload.modules || [];
}

function getBlankClient() {
  return {
    contact_name: "",
    company: "",
    email: "",
    phone: "",
    website: "",
    instagram: "",
    client_type: "brand",
    status: "active",
    estimated_value: 0,
    useful_links: "",
    notes: "",
    collaboration_history: "",
    last_contact_at: "",
  };
}

function getBlankProject() {
  return {
    client_id: state.data.lookups.clients[0]?.id || "",
    name: "",
    mission_type: "",
    status: "draft",
    priority: "normal",
    start_date: "",
    deadline: "",
    budget: 0,
    description: "",
    deliverables: "",
    useful_links: "",
    notes: "",
  };
}

function getBlankDocument() {
  return {
    client_id: "",
    project_id: "",
    title: "",
    category: "brief",
    document_type: "file",
    file_url: "",
    description: "",
    tags: "",
    issued_at: "",
  };
}

function getBlankMedia() {
  return {
    client_id: "",
    project_id: "",
    title: "",
    media_type: "photo",
    preview_url: "",
    asset_url: "",
    tags: "",
    description: "",
    captured_at: "",
  };
}

function getBlankResource() {
  return {
    name: "",
    category: "outil",
    url: "",
    description: "",
    usage_notes: "",
    tags: "",
  };
}

function renderDashboardSection() {
  const dashboard = state.data.dashboard;

  if (!dashboard) {
    adminView.innerHTML = renderEmptyState("Chargement du cockpit…");
    return;
  }

  adminView.innerHTML = `
    <div class="admin-metrics-grid">
      ${[
        ["Nouveaux leads", dashboard.metrics.new_leads],
        ["Relances à faire", dashboard.metrics.due_follow_ups],
        ["Clients actifs", dashboard.metrics.active_clients],
        ["Projets en cours", dashboard.metrics.active_projects],
        ["CA prévu", formatCurrency(dashboard.metrics.planned_revenue)],
        ["Pipeline estimé", formatCurrency(dashboard.metrics.pipeline_estimate)],
        ["Devis envoyés", dashboard.metrics.quote_sent],
        ["Gagnés", dashboard.metrics.won_leads],
        ["Perdus", dashboard.metrics.lost_leads],
      ]
        .map(
          ([label, value]) => `
            <article class="admin-metric-card panel">
              <span class="kicker">${escapeHtml(label)}</span>
              <strong>${escapeHtml(String(value))}</strong>
              <p>Lecture rapide du business pour arbitrer les priorités du studio.</p>
            </article>
          `
        )
        .join("")}
    </div>

    <div class="admin-dashboard-grid">
      <div class="admin-stack">
        <section class="admin-panel panel">
          <div class="admin-panel-head">
            <div>
              <span class="kicker">Rappels & urgences</span>
              <h3>Ce qui demande une attention rapide.</h3>
            </div>
          </div>
          <div class="admin-simple-list">
            ${
              dashboard.urgent_projects.length
                ? dashboard.urgent_projects
                    .map(
                      (project) => `
                        <article class="admin-list-item">
                          <strong>${escapeHtml(project.name)}</strong>
                          <p>${escapeHtml(project.client_company || "Client non lié")} • ${escapeHtml(project.status)}</p>
                          <span>Deadline : ${escapeHtml(project.deadline || "Non renseignée")}</span>
                        </article>
                      `
                    )
                    .join("")
                : renderEmptyState("Aucun projet urgent ou avec deadline proche pour le moment.")
            }
          </div>
        </section>

        <section class="admin-panel panel">
          <div class="admin-panel-head">
            <div>
              <span class="kicker">Relances</span>
              <h3>Les opportunités à faire avancer.</h3>
            </div>
          </div>
          <div class="admin-simple-list">
            ${
              dashboard.follow_up_leads.length
                ? dashboard.follow_up_leads
                    .map(
                      (lead) => `
                        <article class="admin-list-item">
                          <strong>${escapeHtml(lead.company)}</strong>
                          <p>${escapeHtml(formatLeadStatus(lead.status))} • ${escapeHtml(
                            formatCurrency(lead.estimated_budget_amount || 0)
                          )}</p>
                          <span>${
                            lead.next_follow_up_at
                              ? `Prochaine relance : ${escapeHtml(formatDateOnly(lead.next_follow_up_at))}`
                              : "Relance à planifier"
                          }</span>
                        </article>
                      `
                    )
                    .join("")
                : renderEmptyState("Aucune relance prioritaire pour le moment.")
            }
          </div>
        </section>

        <section class="admin-panel panel">
          <div class="admin-panel-head">
            <div>
              <span class="kicker">Dernières demandes</span>
              <h3>Les leads les plus récents.</h3>
            </div>
          </div>
          <div class="admin-simple-list">
            ${
              dashboard.recent_leads.length
                ? dashboard.recent_leads
                    .map(
                      (lead) => `
                        <article class="admin-list-item">
                          <strong>${escapeHtml(lead.company)}</strong>
                          <p>${escapeHtml(lead.name)} • ${escapeHtml(lead.project_type)}</p>
                          <span>${escapeHtml(formatLeadStatus(lead.status))} • ${escapeHtml(formatDate(lead.created_at))}</span>
                        </article>
                      `
                    )
                    .join("")
                : renderEmptyState("Aucun lead enregistré pour le moment.")
            }
          </div>
        </section>
      </div>

      <div class="admin-stack">
        <section class="admin-panel panel">
          <div class="admin-panel-head">
            <div>
              <span class="kicker">Accès rapides</span>
              <h3>Les zones à ouvrir le plus souvent.</h3>
            </div>
          </div>
          <div class="admin-quick-links">
            ${renderQuickLink("leads", "Suivre les demandes", "Voir les nouveaux leads et changer leurs statuts.")}
            ${renderQuickLink("clients", "Ouvrir les clients", "Retrouver vite les infos, liens et notes utiles.")}
            ${renderQuickLink("projects", "Piloter les projets", "Vérifier l’avancement, les budgets et les deadlines.")}
            ${renderQuickLink("documents", "Ranger les documents", "Classer briefs, devis, contrats et factures.")}
          </div>
        </section>

        <section class="admin-panel panel">
          <div class="admin-panel-head">
            <div>
              <span class="kicker">Activité récente</span>
              <h3>Les dernières actions internes.</h3>
            </div>
          </div>
          <div class="admin-mini-list">
            ${
              dashboard.recent_activity.length
                ? dashboard.recent_activity
                    .map(
                      (entry) => `
                        <article class="admin-mini-card">
                          <strong>${escapeHtml(entry.title)}</strong>
                          <p>${escapeHtml(entry.description || entry.action)}</p>
                          <span>${escapeHtml(formatDate(entry.created_at))}</span>
                        </article>
                      `
                    )
                    .join("")
                : renderEmptyState("Aucune activité interne enregistrée pour le moment.")
            }
          </div>
        </section>
      </div>
    </div>
  `;
}

function renderLeadRelations(relations) {
  if (!relations) {
    return "";
  }

  const linkedClient = relations.client
    ? `
        <article class="admin-mini-card">
          <strong>${escapeHtml(relations.client.company)}</strong>
          <p>${escapeHtml(relations.client.contact_name || relations.client.email || "Client lié")}</p>
          <span>${escapeHtml(relations.client.status || "prospect")}</span>
        </article>
      `
    : renderEmptyState("Aucun client encore relié à cette demande.");

  return `
    <section class="admin-section-block">
      <span class="kicker">Rattachements</span>
      <div class="admin-related-grid is-lead-relations">
        <div class="admin-mini-list">
          <strong class="admin-related-title">Client lié</strong>
          ${linkedClient}
        </div>
        <div class="admin-mini-list">
          <strong class="admin-related-title">Projets liés</strong>
          ${
            relations.projects?.length
              ? relations.projects
                  .slice(0, 4)
                  .map(
                    (project) => `
                      <article class="admin-mini-card">
                        <strong>${escapeHtml(project.name)}</strong>
                        <p>${escapeHtml(project.mission_type || "Mission")}</p>
                        <span>${escapeHtml(project.status || "draft")}</span>
                      </article>
                    `
                  )
                  .join("")
              : renderEmptyState("Aucun projet lié pour le moment.")
          }
        </div>
        <div class="admin-mini-list">
          <strong class="admin-related-title">Documents / devis</strong>
          ${
            relations.documents?.length
              ? relations.documents
                  .slice(0, 4)
                  .map(
                    (document) => `
                      <article class="admin-mini-card">
                        <strong>${escapeHtml(document.title)}</strong>
                        <p>${escapeHtml(document.category || "Document")}</p>
                        <span>${escapeHtml(document.issued_at || "Sans date")}</span>
                      </article>
                    `
                  )
                  .join("")
              : renderEmptyState("Aucun document lié pour le moment.")
          }
        </div>
      </div>
    </section>
  `;
}

function renderLeadActivity(activity) {
  return `
    <section class="admin-section-block">
      <span class="kicker">Historique simple</span>
      <div class="admin-mini-list">
        ${
          activity?.length
            ? activity
                .map(
                  (entry) => `
                    <article class="admin-mini-card">
                      <strong>${escapeHtml(entry.title)}</strong>
                      <p>${escapeHtml(entry.description || entry.action)}</p>
                      <span>${escapeHtml(formatDate(entry.created_at))}</span>
                    </article>
                  `
                )
                .join("")
            : renderEmptyState("Aucune action enregistrée sur cette opportunité pour le moment.")
        }
      </div>
    </section>
  `;
}

function renderLeadDetail(detailPayload, fallbackLead) {
  const lead = detailPayload?.lead || fallbackLead;

  if (!lead) {
    return renderEmptyState("Sélectionnez une demande pour voir son détail, changer son statut et ajouter une note.");
  }

  return `
    <div class="admin-detail-secondary">
      <section class="admin-section-block">
        <span class="kicker">Fiche lead</span>
        <h3 class="admin-detail-title">${escapeHtml(lead.company)}</h3>
        <div class="admin-tag-list">
          ${renderPill(formatLeadStatus(lead.status), getLeadStatusTone(lead.status))}
          ${renderPill(lead.project_type)}
          ${renderPill(lead.budget)}
          ${renderPill(formatFollowUpStatus(lead.follow_up_status || "none"), getFollowUpTone(lead.follow_up_status))}
        </div>
      </section>

      <section class="admin-section-block">
        <div class="admin-commercial-grid">
          <article class="admin-mini-card">
            <strong>Budget estimé</strong>
            <p>${escapeHtml(formatCurrency(lead.estimated_budget_amount || 0))}</p>
            <span>Lecture interne du potentiel commercial.</span>
          </article>
          <article class="admin-mini-card">
            <strong>Dernier contact</strong>
            <p>${escapeHtml(formatDateOnly(lead.last_contact_at))}</p>
            <span>Dernière date de prise de contact enregistrée.</span>
          </article>
          <article class="admin-mini-card">
            <strong>Devis envoyé</strong>
            <p>${escapeHtml(formatDateOnly(lead.quote_sent_at))}</p>
            <span>Date d’envoi du devis ou de la proposition.</span>
          </article>
          <article class="admin-mini-card">
            <strong>Prochaine relance</strong>
            <p>${escapeHtml(formatDateOnly(lead.next_follow_up_at))}</p>
            <span>Prochain point de contact prévu.</span>
          </article>
        </div>
      </section>

      <section class="admin-section-block">
        <div class="admin-form-grid">
          <div class="admin-form-field"><span>Contact</span><input value="${escapeHtml(lead.name)}" disabled /></div>
          <div class="admin-form-field"><span>E-mail</span><input value="${escapeHtml(lead.email)}" disabled /></div>
          <div class="admin-form-field"><span>Téléphone</span><input value="${escapeHtml(lead.phone || "")}" disabled /></div>
          <div class="admin-form-field"><span>Site / Instagram</span><input value="${escapeHtml(
            lead.website_or_instagram || ""
          )}" disabled /></div>
          <div class="admin-form-field"><span>Source</span><input value="${escapeHtml(lead.source || "Direct")}" disabled /></div>
          <div class="admin-form-field"><span>Timing</span><input value="${escapeHtml(lead.timeline || "Non renseigné")}" disabled /></div>
          <div class="admin-form-field full"><span>Message</span><textarea disabled>${escapeHtml(
            lead.message
          )}</textarea></div>
        </div>
      </section>

      <form class="admin-detail-form" data-lead-update-form data-lead-id="${escapeHtml(lead.id)}">
        <div class="admin-form-grid">
          <label class="admin-form-field">
            <span>Statut</span>
            <select name="status">
              ${LEAD_STATUS_OPTIONS
                .map(
                  (status) =>
                    `<option value="${status}" ${lead.status === status ? "selected" : ""}>${escapeHtml(
                      formatLeadStatus(status)
                    )}</option>`
                )
                .join("")}
            </select>
          </label>
          <label class="admin-form-field">
            <span>Statut de relance</span>
            <select name="follow_up_status">
              ${FOLLOW_UP_STATUS_OPTIONS
                .map(
                  (status) =>
                    `<option value="${status}" ${
                      (lead.follow_up_status || "none") === status ? "selected" : ""
                    }>${escapeHtml(formatFollowUpStatus(status))}</option>`
                )
                .join("")}
            </select>
          </label>
          <label class="admin-form-field">
            <span>Budget estimé</span>
            <input name="estimated_budget_amount" type="number" min="0" value="${escapeHtml(
              String(lead.estimated_budget_amount || 0)
            )}" />
          </label>
          <label class="admin-form-field">
            <span>Dernier contact</span>
            <input name="last_contact_at" type="date" value="${escapeHtml(lead.last_contact_at || "")}" />
          </label>
          <label class="admin-form-field">
            <span>Devis envoyé le</span>
            <input name="quote_sent_at" type="date" value="${escapeHtml(lead.quote_sent_at || "")}" />
          </label>
          <label class="admin-form-field">
            <span>Prochaine relance</span>
            <input name="next_follow_up_at" type="date" value="${escapeHtml(
              lead.next_follow_up_at || ""
            )}" />
          </label>
          <div class="admin-form-field full">
            <span>Date de réception</span>
            <input value="${escapeHtml(formatDate(lead.created_at))}" disabled />
          </div>
          <label class="admin-form-field full">
            <span>Note interne</span>
            <textarea name="internal_notes" placeholder="Ajouter un contexte commercial, un rappel ou un prochain pas…">${escapeHtml(
              lead.internal_notes || ""
            )}</textarea>
          </label>
        </div>

        <div class="admin-detail-actions">
          <div class="admin-header-actions">
            <button class="button button-secondary" type="button" data-convert-lead="${escapeHtml(
              lead.id
            )}">Convertir en client</button>
          </div>
          <div class="admin-header-actions">
            <button class="button button-primary" type="submit">Enregistrer le lead</button>
          </div>
        </div>
      </form>

      ${renderLeadRelations(detailPayload?.relations)}
      ${renderLeadActivity(detailPayload?.activity)}
    </div>
  `;
}

function renderLeadsSection() {
  const summary = state.data.leadSummary;
  const leads = state.data.leads;
  const selectedLead = leads.find((lead) => lead.id === state.selection.leads) || null;
  const leadDetail = state.data.leadDetail;
  const statusCounts = summary?.by_status || {};
  const exportParams = new URLSearchParams();

  if (state.filters.leads.status) {
    exportParams.set("status", state.filters.leads.status);
  }

  if (state.filters.leads.follow_up_status) {
    exportParams.set("follow_up_status", state.filters.leads.follow_up_status);
  }

  if (state.filters.leads.q) {
    exportParams.set("q", state.filters.leads.q);
  }

  adminView.innerHTML = `
    <section class="admin-toolbar panel">
      <label class="admin-toolbar-field" style="grid-column: span 3;">
        <span>Statut</span>
        <select data-admin-filter-section="leads" data-filter-name="status">
          <option value="">Tous</option>
          ${LEAD_STATUS_OPTIONS
            .map(
              (status) =>
                `<option value="${status}" ${state.filters.leads.status === status ? "selected" : ""}>${escapeHtml(
                  formatLeadStatus(status)
                )}</option>`
            )
            .join("")}
        </select>
      </label>
      <label class="admin-toolbar-field" style="grid-column: span 3;">
        <span>Relance</span>
        <select data-admin-filter-section="leads" data-filter-name="follow_up_status">
          <option value="">Toutes</option>
          ${FOLLOW_UP_STATUS_OPTIONS
            .map(
              (status) =>
                `<option value="${status}" ${
                  state.filters.leads.follow_up_status === status ? "selected" : ""
                }>${escapeHtml(formatFollowUpStatus(status))}</option>`
            )
            .join("")}
        </select>
      </label>
      <label class="admin-toolbar-field" style="grid-column: span 4;">
        <span>Recherche</span>
        <input
          type="search"
          value="${escapeHtml(state.filters.leads.q)}"
          placeholder="Nom, marque, e-mail, notes…"
          data-admin-filter-section="leads"
          data-filter-name="q"
        />
      </label>
      <div class="admin-toolbar-actions" style="grid-column: span 2;">
        ${summary ? renderPill(`${summary.total} lead${summary.total > 1 ? "s" : ""}`) : ""}
        <a class="button button-secondary" href="/api/admin/leads/export.csv?${escapeHtml(
          exportParams.toString()
        )}">Exporter CSV</a>
        <a class="button button-secondary" href="/api/admin/leads/export.json?${escapeHtml(
          exportParams.toString()
        )}">Exporter JSON</a>
      </div>
    </section>

    <section class="admin-summary-strip">
      ${[
        ["Nouveaux", statusCounts.new || 0],
        ["Contactés", statusCounts.contacted || 0],
        ["Devis envoyés", statusCounts.quote_sent || 0],
        ["Gagnés", statusCounts.won || 0],
        ["Perdus", statusCounts.lost || 0],
        ["Relances à faire", summary?.due_followups || 0],
        ["Pipeline", formatCurrency(summary?.pipeline_estimate || 0)],
      ]
        .map(
          ([label, value]) => `
            <article class="admin-summary-chip panel">
              <span class="kicker">${escapeHtml(label)}</span>
              <strong>${escapeHtml(String(value))}</strong>
            </article>
          `
        )
        .join("")}
    </section>

    <section class="admin-entity-layout">
      <div class="admin-entity-list panel">
        <div class="admin-panel-head">
          <div>
            <span class="kicker">Demandes reçues</span>
            <h3>Pipeline commercial</h3>
          </div>
        </div>
        <div class="admin-entity-list-grid">
          ${
            leads.length
              ? leads
                  .map(
                    (lead) => `
                      <article class="admin-entity-card ${
                        state.selection.leads === lead.id ? "is-active" : ""
                      }" data-select-lead="${escapeHtml(lead.id)}">
                        <div class="admin-entity-card-header">
                          <div>
                            <h4>${escapeHtml(lead.company)}</h4>
                            <p>${escapeHtml(lead.name)}</p>
                          </div>
                          ${renderPill(formatLeadStatus(lead.status), getLeadStatusTone(lead.status))}
                        </div>
                        <div class="admin-card-meta-row">
                          ${renderPill(lead.project_type)}
                          ${renderPill(formatCurrency(lead.estimated_budget_amount || 0))}
                          ${
                            lead.follow_up_status && lead.follow_up_status !== "none"
                              ? renderPill(
                                  formatFollowUpStatus(lead.follow_up_status),
                                  getFollowUpTone(lead.follow_up_status)
                                )
                              : ""
                          }
                        </div>
                        <p>${escapeHtml(lead.budget)}</p>
                        <p>${
                          lead.next_follow_up_at
                            ? `Relance : ${escapeHtml(formatDateOnly(lead.next_follow_up_at))}`
                            : escapeHtml(formatDate(lead.created_at))
                        }</p>
                      </article>
                    `
                  )
                  .join("")
              : renderEmptyState("Aucun lead pour ce filtre.")
          }
        </div>
      </div>

      <div class="admin-entity-detail panel">
        ${renderLeadDetail(leadDetail, selectedLead)}
      </div>
    </section>
  `;
}

function renderClientRelations(relations) {
  const relationGroups = [
    ["Projets liés", relations?.projects || []],
    ["Documents liés", relations?.documents || []],
    ["Médias liés", relations?.media_items || []],
  ];

  return `
    <div class="admin-related-grid">
      ${relationGroups
        .map(
          ([title, items]) => `
            <section class="admin-section-block">
              <span class="kicker">${escapeHtml(title)}</span>
              <div class="admin-mini-list">
                ${
                  items.length
                    ? items
                        .slice(0, 4)
                        .map(
                          (item) => `
                            <article class="admin-mini-card">
                              <strong>${escapeHtml(item.name || item.title)}</strong>
                              <p>${escapeHtml(item.status || item.category || item.media_type || "")}</p>
                            </article>
                          `
                        )
                        .join("")
                    : renderEmptyState("Aucun élément lié.")
                }
              </div>
            </section>
          `
        )
        .join("")}
    </div>
  `;
}

function renderClientForm(client, detailPayload) {
  const isNew = state.selection.clients === "new";

  return `
    <form class="admin-detail-form" data-entity-form="clients" data-entity-id="${
      isNew ? "" : escapeHtml(client.id)
    }">
      <section class="admin-section-block">
        <span class="kicker">${isNew ? "Nouveau client" : "Fiche client"}</span>
        <h3 class="admin-detail-title">${escapeHtml(client.company || "Créer un client")}</h3>
      </section>

      <div class="admin-form-grid">
        <label class="admin-form-field"><span>Contact</span><input name="contact_name" value="${escapeHtml(
          client.contact_name || ""
        )}" required /></label>
        <label class="admin-form-field"><span>Marque / entreprise</span><input name="company" value="${escapeHtml(
          client.company || ""
        )}" required /></label>
        <label class="admin-form-field"><span>E-mail</span><input name="email" type="email" value="${escapeHtml(
          client.email || ""
        )}" required /></label>
        <label class="admin-form-field"><span>Téléphone</span><input name="phone" value="${escapeHtml(
          client.phone || ""
        )}" /></label>
        <label class="admin-form-field"><span>Site</span><input name="website" value="${escapeHtml(
          client.website || ""
        )}" /></label>
        <label class="admin-form-field"><span>Instagram</span><input name="instagram" value="${escapeHtml(
          client.instagram || ""
        )}" /></label>
        <label class="admin-form-field"><span>Type de client</span><input name="client_type" value="${escapeHtml(
          client.client_type || "brand"
        )}" /></label>
        <label class="admin-form-field">
          <span>Statut</span>
          <select name="status">
            ${["prospect", "onboarding", "active", "paused", "archived"]
              .map(
                (status) =>
                  `<option value="${status}" ${client.status === status ? "selected" : ""}>${status}</option>`
              )
              .join("")}
          </select>
        </label>
        <label class="admin-form-field"><span>Valeur estimée</span><input name="estimated_value" type="number" min="0" value="${escapeHtml(
          String(client.estimated_value || 0)
        )}" /></label>
        <label class="admin-form-field"><span>Dernier contact</span><input name="last_contact_at" type="date" value="${escapeHtml(
          client.last_contact_at || ""
        )}" /></label>
        <label class="admin-form-field full"><span>Liens utiles</span><textarea name="useful_links">${escapeHtml(
          client.useful_links || ""
        )}</textarea></label>
        <label class="admin-form-field full"><span>Notes internes</span><textarea name="notes">${escapeHtml(
          client.notes || ""
        )}</textarea></label>
        <label class="admin-form-field full"><span>Historique de collaboration</span><textarea name="collaboration_history">${escapeHtml(
          client.collaboration_history || ""
        )}</textarea></label>
      </div>

      <div class="admin-detail-actions">
        <div class="admin-header-actions">
          ${
            !isNew
              ? `<button class="button button-secondary" type="button" data-delete-entity="clients" data-entity-id="${escapeHtml(
                  client.id
                )}">Supprimer</button>`
              : ""
          }
        </div>
        <div class="admin-header-actions">
          <button class="button button-primary" type="submit">${
            isNew ? "Créer le client" : "Enregistrer"
          }</button>
        </div>
      </div>
    </form>
    ${!isNew ? renderClientRelations(detailPayload?.relations) : ""}
  `;
}

function renderClientsSection() {
  const clients = state.data.clients;
  const detailPayload = state.data.clientDetail;
  const selectedClient =
    state.selection.clients === "new"
      ? getBlankClient()
      : detailPayload?.item || clients.find((item) => item.id === state.selection.clients) || getBlankClient();

  adminView.innerHTML = `
    <section class="admin-toolbar panel">
      <label class="admin-toolbar-field" style="grid-column: span 3;">
        <span>Statut</span>
        <select data-admin-filter-section="clients" data-filter-name="status">
          <option value="">Tous</option>
          ${["prospect", "onboarding", "active", "paused", "archived"]
            .map(
              (status) =>
                `<option value="${status}" ${
                  state.filters.clients.status === status ? "selected" : ""
                }>${status}</option>`
            )
            .join("")}
        </select>
      </label>
      <label class="admin-toolbar-field" style="grid-column: span 3;">
        <span>Type</span>
        <input
          value="${escapeHtml(state.filters.clients.client_type)}"
          placeholder="brand, PME, fondateur…"
          data-admin-filter-section="clients"
          data-filter-name="client_type"
        />
      </label>
      <label class="admin-toolbar-field" style="grid-column: span 4;">
        <span>Recherche</span>
        <input
          type="search"
          value="${escapeHtml(state.filters.clients.q)}"
          placeholder="Nom, marque, e-mail…"
          data-admin-filter-section="clients"
          data-filter-name="q"
        />
      </label>
      <div class="admin-toolbar-actions" style="grid-column: span 2;">
        <button class="button button-primary" type="button" data-create-entity="clients">Nouveau client</button>
      </div>
    </section>

    <section class="admin-entity-layout">
      <div class="admin-entity-list panel">
        <div class="admin-panel-head">
          <div>
            <span class="kicker">Base clients</span>
            <h3>Contacts et marques</h3>
          </div>
        </div>
        <div class="admin-entity-list-grid">
          ${
            clients.length
              ? clients
                  .map(
                    (client) => `
                      <article class="admin-entity-card ${
                        state.selection.clients === client.id ? "is-active" : ""
                      }" data-select-entity="clients" data-entity-id="${escapeHtml(client.id)}">
                        <div class="admin-entity-card-header">
                          <div>
                            <h4>${escapeHtml(client.company)}</h4>
                            <p>${escapeHtml(client.contact_name)}</p>
                          </div>
                          ${renderPill(client.status)}
                        </div>
                        <p>${escapeHtml(client.email)}</p>
                        <p>${escapeHtml(client.client_type)} • ${escapeHtml(formatCurrency(client.estimated_value || 0))}</p>
                      </article>
                    `
                  )
                  .join("")
              : renderEmptyState("Aucun client enregistré pour ce filtre.")
          }
        </div>
      </div>

      <div class="admin-entity-detail panel">
        ${renderClientForm(selectedClient, detailPayload)}
      </div>
    </section>
  `;
}

function renderProjectForm(project, detailPayload) {
  const isNew = state.selection.projects === "new";

  return `
    <form class="admin-detail-form" data-entity-form="projects" data-entity-id="${
      isNew ? "" : escapeHtml(project.id)
    }">
      <section class="admin-section-block">
        <span class="kicker">${isNew ? "Nouveau projet" : "Fiche projet"}</span>
        <h3 class="admin-detail-title">${escapeHtml(project.name || "Créer une mission")}</h3>
      </section>
      <div class="admin-form-grid">
        <label class="admin-form-field">
          <span>Client</span>
          <select name="client_id" required>
            <option value="">Sélectionner</option>
            ${renderOptions(state.data.lookups.clients, project.client_id, getLookupClientLabel)}
          </select>
        </label>
        <label class="admin-form-field"><span>Nom du projet</span><input name="name" value="${escapeHtml(
          project.name || ""
        )}" required /></label>
        <label class="admin-form-field"><span>Type de mission</span><input name="mission_type" value="${escapeHtml(
          project.mission_type || ""
        )}" required /></label>
        <label class="admin-form-field">
          <span>Statut</span>
          <select name="status">
            ${["draft", "planned", "in_progress", "waiting_feedback", "delivered", "archived", "cancelled"]
              .map(
                (status) =>
                  `<option value="${status}" ${project.status === status ? "selected" : ""}>${status}</option>`
              )
              .join("")}
          </select>
        </label>
        <label class="admin-form-field">
          <span>Priorité</span>
          <select name="priority">
            ${["low", "normal", "high", "urgent"]
              .map(
                (priority) =>
                  `<option value="${priority}" ${
                    project.priority === priority ? "selected" : ""
                  }>${priority}</option>`
              )
              .join("")}
          </select>
        </label>
        <label class="admin-form-field"><span>Budget</span><input name="budget" type="number" min="0" value="${escapeHtml(
          String(project.budget || 0)
        )}" /></label>
        <label class="admin-form-field"><span>Date de début</span><input name="start_date" type="date" value="${escapeHtml(
          project.start_date || ""
        )}" /></label>
        <label class="admin-form-field"><span>Deadline</span><input name="deadline" type="date" value="${escapeHtml(
          project.deadline || ""
        )}" /></label>
        <label class="admin-form-field full"><span>Description</span><textarea name="description">${escapeHtml(
          project.description || ""
        )}</textarea></label>
        <label class="admin-form-field full"><span>Livrables</span><textarea name="deliverables">${escapeHtml(
          project.deliverables || ""
        )}</textarea></label>
        <label class="admin-form-field full"><span>Liens utiles</span><textarea name="useful_links">${escapeHtml(
          project.useful_links || ""
        )}</textarea></label>
        <label class="admin-form-field full"><span>Notes internes</span><textarea name="notes">${escapeHtml(
          project.notes || ""
        )}</textarea></label>
      </div>
      <div class="admin-detail-actions">
        <div class="admin-header-actions">
          ${
            !isNew
              ? `<button class="button button-secondary" type="button" data-delete-entity="projects" data-entity-id="${escapeHtml(
                  project.id
                )}">Supprimer</button>`
              : ""
          }
        </div>
        <div class="admin-header-actions">
          <button class="button button-primary" type="submit">${
            isNew ? "Créer le projet" : "Enregistrer"
          }</button>
        </div>
      </div>
    </form>
    ${
      !isNew
        ? renderClientRelations({
            projects: [],
            documents: detailPayload?.relations?.documents || [],
            media_items: detailPayload?.relations?.media_items || [],
          })
        : ""
    }
  `;
}

function renderProjectsSection() {
  const projects = state.data.projects;
  const detailPayload = state.data.projectDetail;
  const selectedProject =
    state.selection.projects === "new"
      ? getBlankProject()
      : detailPayload?.item || projects.find((item) => item.id === state.selection.projects) || getBlankProject();

  adminView.innerHTML = `
    <section class="admin-toolbar panel">
      <label class="admin-toolbar-field" style="grid-column: span 3;">
        <span>Statut</span>
        <select data-admin-filter-section="projects" data-filter-name="status">
          <option value="">Tous</option>
          ${["draft", "planned", "in_progress", "waiting_feedback", "delivered", "archived", "cancelled"]
            .map(
              (status) =>
                `<option value="${status}" ${
                  state.filters.projects.status === status ? "selected" : ""
                }>${status}</option>`
            )
            .join("")}
        </select>
      </label>
      <label class="admin-toolbar-field" style="grid-column: span 3;">
        <span>Priorité</span>
        <select data-admin-filter-section="projects" data-filter-name="priority">
          <option value="">Toutes</option>
          ${["low", "normal", "high", "urgent"]
            .map(
              (priority) =>
                `<option value="${priority}" ${
                  state.filters.projects.priority === priority ? "selected" : ""
                }>${priority}</option>`
            )
            .join("")}
        </select>
      </label>
      <label class="admin-toolbar-field" style="grid-column: span 3;">
        <span>Client</span>
        <select data-admin-filter-section="projects" data-filter-name="client_id">
          <option value="">Tous</option>
          ${renderOptions(state.data.lookups.clients, state.filters.projects.client_id, getLookupClientLabel)}
        </select>
      </label>
      <label class="admin-toolbar-field" style="grid-column: span 4;">
        <span>Recherche</span>
        <input type="search" value="${escapeHtml(
          state.filters.projects.q
        )}" placeholder="Projet, mission, description…" data-admin-filter-section="projects" data-filter-name="q" />
      </label>
      <div class="admin-toolbar-actions" style="grid-column: span 2;">
        <button class="button button-primary" type="button" data-create-entity="projects">Nouveau projet</button>
      </div>
    </section>

    <section class="admin-entity-layout">
      <div class="admin-entity-list panel">
        <div class="admin-panel-head">
          <div>
            <span class="kicker">Missions</span>
            <h3>Projets actifs et archivés</h3>
          </div>
        </div>
        <div class="admin-entity-list-grid">
          ${
            projects.length
              ? projects
                  .map((project) => {
                    const client = state.data.lookups.clients.find((item) => item.id === project.client_id);
                    return `
                      <article class="admin-entity-card ${
                        state.selection.projects === project.id ? "is-active" : ""
                      }" data-select-entity="projects" data-entity-id="${escapeHtml(project.id)}">
                        <div class="admin-entity-card-header">
                          <div>
                            <h4>${escapeHtml(project.name)}</h4>
                            <p>${escapeHtml(client?.company || "Client non lié")}</p>
                          </div>
                          ${renderPill(project.status)}
                        </div>
                        <p>${escapeHtml(project.mission_type)} • ${escapeHtml(project.priority)}</p>
                        <p>${escapeHtml(project.deadline || "Pas de deadline")}</p>
                      </article>
                    `;
                  })
                  .join("")
              : renderEmptyState("Aucun projet pour ce filtre.")
          }
        </div>
      </div>

      <div class="admin-entity-detail panel">
        ${renderProjectForm(selectedProject, detailPayload)}
      </div>
    </section>
  `;
}

function renderSimpleEntitySection(sectionName, options) {
  const items = state.data[sectionName];
  const detailPayload = state.data[getDetailStateKey(sectionName)];
  const selectedItem =
    state.selection[sectionName] === "new"
      ? options.blankItem()
      : detailPayload?.item || items.find((item) => item.id === state.selection[sectionName]) || options.blankItem();
  const isNew = state.selection[sectionName] === "new";

  adminView.innerHTML = `
    <section class="admin-toolbar panel">
      ${options.toolbarHtml()}
      <div class="admin-toolbar-actions" style="grid-column: span 2;">
        <button class="button button-primary" type="button" data-create-entity="${sectionName}">${escapeHtml(
          options.createLabel
        )}</button>
      </div>
    </section>

    <section class="admin-entity-layout">
      <div class="admin-entity-list panel">
        <div class="admin-panel-head">
          <div>
            <span class="kicker">${escapeHtml(options.listKicker)}</span>
            <h3>${escapeHtml(options.listTitle)}</h3>
          </div>
        </div>
        <div class="admin-entity-list-grid">
          ${
            items.length
              ? items
                  .map((item) => options.renderCard(item, state.selection[sectionName] === item.id))
                  .join("")
              : renderEmptyState(options.emptyMessage)
          }
        </div>
      </div>
      <div class="admin-entity-detail panel">
        ${options.renderForm(selectedItem, isNew)}
      </div>
    </section>
  `;
}

function renderDocumentsSection() {
  renderSimpleEntitySection("documents", {
    createLabel: "Nouveau document",
    listKicker: "Bibliothèque",
    listTitle: "Documents classés",
    emptyMessage: "Aucun document enregistré pour ce filtre.",
    blankItem: getBlankDocument,
    toolbarHtml: () => `
      <label class="admin-toolbar-field" style="grid-column: span 3;">
        <span>Client</span>
        <select data-admin-filter-section="documents" data-filter-name="client_id">
          <option value="">Tous</option>
          ${renderOptions(state.data.lookups.clients, state.filters.documents.client_id, getLookupClientLabel)}
        </select>
      </label>
      <label class="admin-toolbar-field" style="grid-column: span 3;">
        <span>Projet</span>
        <select data-admin-filter-section="documents" data-filter-name="project_id">
          <option value="">Tous</option>
          ${renderOptions(state.data.lookups.projects, state.filters.documents.project_id, getLookupProjectLabel)}
        </select>
      </label>
      <label class="admin-toolbar-field" style="grid-column: span 2;">
        <span>Catégorie</span>
        <input value="${escapeHtml(state.filters.documents.category)}" placeholder="brief, devis, facture…" data-admin-filter-section="documents" data-filter-name="category" />
      </label>
      <label class="admin-toolbar-field" style="grid-column: span 2;">
        <span>Type</span>
        <input value="${escapeHtml(state.filters.documents.document_type)}" placeholder="file, link…" data-admin-filter-section="documents" data-filter-name="document_type" />
      </label>
      <label class="admin-toolbar-field" style="grid-column: span 2;">
        <span>Recherche</span>
        <input type="search" value="${escapeHtml(state.filters.documents.q)}" placeholder="Titre, tags, catégorie…" data-admin-filter-section="documents" data-filter-name="q" />
      </label>
    `,
    renderCard: (item, isActive) => `
      <article class="admin-entity-card ${isActive ? "is-active" : ""}" data-select-entity="documents" data-entity-id="${escapeHtml(item.id)}">
        <div class="admin-entity-card-header">
          <div>
            <h4>${escapeHtml(item.title)}</h4>
            <p>${escapeHtml(item.category)}</p>
          </div>
          ${renderPill(item.document_type)}
        </div>
        <p>${escapeHtml(item.tags || "Sans tags")}</p>
      </article>
    `,
    renderForm: (item, isNew) => `
      <form class="admin-detail-form" data-entity-form="documents" data-entity-id="${isNew ? "" : escapeHtml(item.id)}">
        <section class="admin-section-block">
          <span class="kicker">${isNew ? "Nouveau document" : "Fiche document"}</span>
          <h3 class="admin-detail-title">${escapeHtml(item.title || "Créer un document")}</h3>
        </section>
        <div class="admin-form-grid">
          <label class="admin-form-field"><span>Titre</span><input name="title" value="${escapeHtml(item.title || "")}" required /></label>
          <label class="admin-form-field"><span>Catégorie</span><input name="category" value="${escapeHtml(item.category || "")}" required /></label>
          <label class="admin-form-field"><span>Type</span><input name="document_type" value="${escapeHtml(item.document_type || "file")}" /></label>
          <label class="admin-form-field"><span>URL / lien</span><input name="file_url" value="${escapeHtml(item.file_url || "")}" /></label>
          <label class="admin-form-field"><span>Client lié</span><select name="client_id"><option value="">Aucun</option>${renderOptions(
            state.data.lookups.clients,
            item.client_id,
            getLookupClientLabel
          )}</select></label>
          <label class="admin-form-field"><span>Projet lié</span><select name="project_id"><option value="">Aucun</option>${renderOptions(
            state.data.lookups.projects,
            item.project_id,
            getLookupProjectLabel
          )}</select></label>
          <label class="admin-form-field"><span>Date</span><input name="issued_at" type="date" value="${escapeHtml(item.issued_at || "")}" /></label>
          <label class="admin-form-field"><span>Tags</span><input name="tags" value="${escapeHtml(item.tags || "")}" /></label>
          <label class="admin-form-field full"><span>Description</span><textarea name="description">${escapeHtml(
            item.description || ""
          )}</textarea></label>
        </div>
        <div class="admin-detail-actions">
          <div class="admin-header-actions">${!isNew ? `<button class="button button-secondary" type="button" data-delete-entity="documents" data-entity-id="${escapeHtml(
            item.id
          )}">Supprimer</button>` : ""}</div>
          <div class="admin-header-actions"><button class="button button-primary" type="submit">${
            isNew ? "Créer le document" : "Enregistrer"
          }</button></div>
        </div>
      </form>
    `,
  });
}

function renderMediaSection() {
  renderSimpleEntitySection("media", {
    createLabel: "Nouveau média",
    listKicker: "Médiathèque",
    listTitle: "Assets créatifs",
    emptyMessage: "Aucun média enregistré pour ce filtre.",
    blankItem: getBlankMedia,
    toolbarHtml: () => `
      <label class="admin-toolbar-field" style="grid-column: span 3;">
        <span>Client</span>
        <select data-admin-filter-section="media" data-filter-name="client_id">
          <option value="">Tous</option>
          ${renderOptions(state.data.lookups.clients, state.filters.media.client_id, getLookupClientLabel)}
        </select>
      </label>
      <label class="admin-toolbar-field" style="grid-column: span 3;">
        <span>Projet</span>
        <select data-admin-filter-section="media" data-filter-name="project_id">
          <option value="">Tous</option>
          ${renderOptions(state.data.lookups.projects, state.filters.media.project_id, getLookupProjectLabel)}
        </select>
      </label>
      <label class="admin-toolbar-field" style="grid-column: span 2;">
        <span>Type</span>
        <input value="${escapeHtml(state.filters.media.media_type)}" placeholder="photo, vidéo…" data-admin-filter-section="media" data-filter-name="media_type" />
      </label>
      <label class="admin-toolbar-field" style="grid-column: span 2;">
        <span>Recherche</span>
        <input type="search" value="${escapeHtml(state.filters.media.q)}" placeholder="Titre, tags, description…" data-admin-filter-section="media" data-filter-name="q" />
      </label>
    `,
    renderCard: (item, isActive) => `
      <article class="admin-entity-card ${isActive ? "is-active" : ""}" data-select-entity="media" data-entity-id="${escapeHtml(item.id)}">
        <div class="admin-entity-card-header">
          <div>
            <h4>${escapeHtml(item.title)}</h4>
            <p>${escapeHtml(item.media_type)}</p>
          </div>
          ${renderPill(item.tags || "asset")}
        </div>
        <p>${escapeHtml(item.asset_url || item.preview_url || "Sans lien")}</p>
      </article>
    `,
    renderForm: (item, isNew) => `
      <form class="admin-detail-form" data-entity-form="media" data-entity-id="${isNew ? "" : escapeHtml(item.id)}">
        <section class="admin-section-block">
          <span class="kicker">${isNew ? "Nouveau média" : "Fiche média"}</span>
          <h3 class="admin-detail-title">${escapeHtml(item.title || "Créer un média")}</h3>
        </section>
        <div class="admin-form-grid">
          <label class="admin-form-field"><span>Titre</span><input name="title" value="${escapeHtml(item.title || "")}" required /></label>
          <label class="admin-form-field"><span>Type</span><input name="media_type" value="${escapeHtml(
            item.media_type || "photo"
          )}" required /></label>
          <label class="admin-form-field"><span>Aperçu</span><input name="preview_url" value="${escapeHtml(
            item.preview_url || ""
          )}" /></label>
          <label class="admin-form-field"><span>Lien asset</span><input name="asset_url" value="${escapeHtml(
            item.asset_url || ""
          )}" /></label>
          <label class="admin-form-field"><span>Client lié</span><select name="client_id"><option value="">Aucun</option>${renderOptions(
            state.data.lookups.clients,
            item.client_id,
            getLookupClientLabel
          )}</select></label>
          <label class="admin-form-field"><span>Projet lié</span><select name="project_id"><option value="">Aucun</option>${renderOptions(
            state.data.lookups.projects,
            item.project_id,
            getLookupProjectLabel
          )}</select></label>
          <label class="admin-form-field"><span>Tags</span><input name="tags" value="${escapeHtml(item.tags || "")}" /></label>
          <label class="admin-form-field"><span>Date</span><input name="captured_at" type="date" value="${escapeHtml(
            item.captured_at || ""
          )}" /></label>
          <label class="admin-form-field full"><span>Description</span><textarea name="description">${escapeHtml(
            item.description || ""
          )}</textarea></label>
        </div>
        <div class="admin-detail-actions">
          <div class="admin-header-actions">${!isNew ? `<button class="button button-secondary" type="button" data-delete-entity="media" data-entity-id="${escapeHtml(
            item.id
          )}">Supprimer</button>` : ""}</div>
          <div class="admin-header-actions"><button class="button button-primary" type="submit">${
            isNew ? "Créer le média" : "Enregistrer"
          }</button></div>
        </div>
      </form>
    `,
  });
}

function renderResourcesSection() {
  renderSimpleEntitySection("resources", {
    createLabel: "Nouvelle ressource",
    listKicker: "Ressources",
    listTitle: "Outils & liens utiles",
    emptyMessage: "Aucune ressource enregistrée pour ce filtre.",
    blankItem: getBlankResource,
    toolbarHtml: () => `
      <label class="admin-toolbar-field" style="grid-column: span 3;">
        <span>Catégorie</span>
        <input value="${escapeHtml(state.filters.resources.category)}" placeholder="outil, template, idée…" data-admin-filter-section="resources" data-filter-name="category" />
      </label>
      <label class="admin-toolbar-field" style="grid-column: span 5;">
        <span>Recherche</span>
        <input type="search" value="${escapeHtml(state.filters.resources.q)}" placeholder="Nom, catégorie, usage…" data-admin-filter-section="resources" data-filter-name="q" />
      </label>
    `,
    renderCard: (item, isActive) => `
      <article class="admin-entity-card ${isActive ? "is-active" : ""}" data-select-entity="resources" data-entity-id="${escapeHtml(item.id)}">
        <div class="admin-entity-card-header">
          <div>
            <h4>${escapeHtml(item.name)}</h4>
            <p>${escapeHtml(item.category)}</p>
          </div>
          ${renderPill(item.tags || "ressource")}
        </div>
        <p>${escapeHtml(item.url || "Sans lien")}</p>
      </article>
    `,
    renderForm: (item, isNew) => `
      <form class="admin-detail-form" data-entity-form="resources" data-entity-id="${isNew ? "" : escapeHtml(item.id)}">
        <section class="admin-section-block">
          <span class="kicker">${isNew ? "Nouvelle ressource" : "Fiche ressource"}</span>
          <h3 class="admin-detail-title">${escapeHtml(item.name || "Créer une ressource")}</h3>
        </section>
        <div class="admin-form-grid">
          <label class="admin-form-field"><span>Nom</span><input name="name" value="${escapeHtml(item.name || "")}" required /></label>
          <label class="admin-form-field"><span>Catégorie</span><input name="category" value="${escapeHtml(
            item.category || ""
          )}" required /></label>
          <label class="admin-form-field full"><span>URL</span><input name="url" value="${escapeHtml(
            item.url || ""
          )}" /></label>
          <label class="admin-form-field"><span>Tags</span><input name="tags" value="${escapeHtml(item.tags || "")}" /></label>
          <label class="admin-form-field full"><span>Description</span><textarea name="description">${escapeHtml(
            item.description || ""
          )}</textarea></label>
          <label class="admin-form-field full"><span>Usage / notes</span><textarea name="usage_notes">${escapeHtml(
            item.usage_notes || ""
          )}</textarea></label>
        </div>
        <div class="admin-detail-actions">
          <div class="admin-header-actions">${!isNew ? `<button class="button button-secondary" type="button" data-delete-entity="resources" data-entity-id="${escapeHtml(
            item.id
          )}">Supprimer</button>` : ""}</div>
          <div class="admin-header-actions"><button class="button button-primary" type="submit">${
            isNew ? "Créer la ressource" : "Enregistrer"
          }</button></div>
        </div>
      </form>
    `,
  });
}

function renderSettingsSection() {
  const settings = state.data.settings || {};
  const modules = state.data.contentModules || [];

  adminView.innerHTML = `
    <section class="admin-panel panel">
      <div class="admin-panel-head">
        <div>
          <span class="kicker">Technique</span>
          <h3>Base interne de l’admin</h3>
        </div>
      </div>
      <div class="admin-settings-grid">
        <article class="admin-settings-card">
          <span class="kicker">Utilisateur</span>
          <h4>${escapeHtml(settings.admin_user || "admin")}</h4>
          <p>Compte connecté à l’espace interne.</p>
        </article>
        <article class="admin-settings-card">
          <span class="kicker">Base</span>
          <h4>${escapeHtml(settings.database_file || "Non renseignée")}</h4>
          <p>Fichier SQLite utilisé pour le cockpit.</p>
        </article>
        <article class="admin-settings-card">
          <span class="kicker">SMTP</span>
          <h4>${settings.email_configured ? "Configuré" : "À configurer"}</h4>
          <p>Le système d’e-mails du studio.</p>
        </article>
      </div>
    </section>

    <section class="admin-panel panel">
      <div class="admin-panel-head">
        <div>
          <span class="kicker">Évolution future</span>
          <h3>Modules déjà préparés dans l’architecture</h3>
        </div>
      </div>
      <div class="admin-module-grid">
        ${modules
          .map(
            (module) => `
              <article class="admin-module-card">
                <span class="kicker">${escapeHtml(module.module_type)}</span>
                <h4>${escapeHtml(module.title)}</h4>
                <p>${escapeHtml(module.payload?.purpose || "Module métier préparé.")}</p>
                <p class="admin-module-meta">${escapeHtml(module.module_key)}</p>
              </article>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderSection() {
  switch (state.section) {
    case "dashboard":
      renderDashboardSection();
      break;
    case "leads":
      renderLeadsSection();
      break;
    case "clients":
      renderClientsSection();
      break;
    case "projects":
      renderProjectsSection();
      break;
    case "documents":
      renderDocumentsSection();
      break;
    case "media":
      renderMediaSection();
      break;
    case "resources":
      renderResourcesSection();
      break;
    case "settings":
      renderSettingsSection();
      break;
    default:
      renderDashboardSection();
  }
}

async function loadCurrentSection(forceLookups = false) {
  switch (state.section) {
    case "dashboard":
      await loadDashboard();
      break;
    case "leads":
      await loadLeads();
      break;
    case "clients":
      await loadEntitySection("clients", forceLookups);
      break;
    case "projects":
      await loadEntitySection("projects", forceLookups);
      break;
    case "documents":
      await loadEntitySection("documents", forceLookups);
      break;
    case "media":
      await loadEntitySection("media", forceLookups);
      break;
    case "resources":
      await loadEntitySection("resources");
      break;
    case "settings":
      await loadSettings();
      break;
    default:
      await loadDashboard();
  }
}

async function switchSection(nextSection, forceReload = false) {
  state.section = nextSection;
  window.location.hash = nextSection;
  updateHeader();

  try {
    if (refreshButton) {
      refreshButton.disabled = true;
      refreshButton.textContent = "Chargement...";
    }

    setFeedback("");
    if (forceReload && ["clients", "projects", "documents", "media"].includes(nextSection)) {
      await loadLookups(true);
    }
    await loadCurrentSection(forceReload);
    renderSection();
  } catch (error) {
    setFeedback(error.message || "Impossible de charger cette section.", "error");
  } finally {
    if (refreshButton) {
      refreshButton.disabled = false;
      refreshButton.textContent = "Actualiser";
    }
  }
}

function handleSelection(sectionName, itemId) {
  state.selection[sectionName] = itemId;
  switchSection(sectionName);
}

async function handleEntitySave(sectionName, form) {
  const meta = entityMeta[sectionName];
  const formData = Object.fromEntries(new FormData(form).entries());
  const entityId = form.dataset.entityId;
  const isUpdate = Boolean(entityId);
  const url = isUpdate ? `${meta.endpoint}/${entityId}` : meta.endpoint;

  const payload = await apiRequest(url, {
    method: isUpdate ? "PATCH" : "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(formData),
  });

  setFeedback(
    `${meta.label.charAt(0).toUpperCase() + meta.label.slice(1)} ${isUpdate ? "mis à jour" : "créé"} avec succès.`,
    "success"
  );

  state.selection[sectionName] = payload.item.id;
  await loadLookups(true);
  await switchSection(sectionName, true);
}

async function handleDelete(sectionName, entityId) {
  const meta = entityMeta[sectionName];
  const confirmed = window.confirm(`Supprimer ce ${meta.label} ?`);

  if (!confirmed) {
    return;
  }

  await apiRequest(`${meta.endpoint}/${entityId}`, {
    method: "DELETE",
  });

  setFeedback(`${meta.label.charAt(0).toUpperCase() + meta.label.slice(1)} supprimé.`, "success");
  state.selection[sectionName] = "new";
  await switchSection(sectionName, true);
}

async function handleLeadUpdate(form) {
  const leadId = form.dataset.leadId;
  const payload = Object.fromEntries(new FormData(form).entries());

  await apiRequest(`/api/admin/leads/${leadId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  setFeedback("Lead mis à jour.", "success");
  await switchSection("leads", true);
}

async function handleLeadConversion(leadId) {
  const payload = await apiRequest(`/api/admin/leads/${leadId}/convert`, {
    method: "POST",
  });

  setFeedback(payload.message || "Lead converti en client.", "success");
  state.selection.clients = payload.item.id;
  await switchSection("clients", true);
}

async function handleLogout() {
  await apiRequest("/api/admin/auth/logout", {
    method: "POST",
  });

  window.location.href = "/admin/login";
}

function bindStaticEvents() {
  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      switchSection(button.dataset.adminSectionTarget);
    });
  });

  if (refreshButton) {
    refreshButton.addEventListener("click", () => {
      switchSection(state.section, true);
    });
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      handleLogout().catch((error) => {
        setFeedback(error.message || "Déconnexion impossible.", "error");
      });
    });
  }

  window.addEventListener("hashchange", () => {
    const nextSection = getSectionFromHash();

    if (nextSection !== state.section) {
      switchSection(nextSection);
    }
  });
}

function bindViewEvents() {
  if (!adminView) {
    return;
  }

  adminView.addEventListener("click", (event) => {
    const goSectionButton = event.target.closest("[data-admin-go-section]");
    if (goSectionButton) {
      switchSection(goSectionButton.dataset.adminGoSection);
      return;
    }

    const selectLead = event.target.closest("[data-select-lead]");
    if (selectLead) {
      handleSelection("leads", selectLead.dataset.selectLead);
      return;
    }

    const selectEntity = event.target.closest("[data-select-entity]");
    if (selectEntity) {
      handleSelection(selectEntity.dataset.selectEntity, selectEntity.dataset.entityId);
      return;
    }

    const createEntityButton = event.target.closest("[data-create-entity]");
    if (createEntityButton) {
      const entity = createEntityButton.dataset.createEntity;
      state.selection[entity] = "new";
      renderSection();
      return;
    }

    const deleteEntityButton = event.target.closest("[data-delete-entity]");
    if (deleteEntityButton) {
      handleDelete(deleteEntityButton.dataset.deleteEntity, deleteEntityButton.dataset.entityId).catch(
        (error) => {
          setFeedback(error.message || "Suppression impossible.", "error");
        }
      );
      return;
    }

    const convertLeadButton = event.target.closest("[data-convert-lead]");
    if (convertLeadButton) {
      handleLeadConversion(convertLeadButton.dataset.convertLead).catch((error) => {
        setFeedback(error.message || "Conversion impossible.", "error");
      });
    }
  });

  adminView.addEventListener("submit", (event) => {
    const leadForm = event.target.closest("[data-lead-update-form]");
    if (leadForm) {
      event.preventDefault();
      handleLeadUpdate(leadForm).catch((error) => {
        setFeedback(error.message || "Mise à jour impossible.", "error");
      });
      return;
    }

    const entityForm = event.target.closest("[data-entity-form]");
    if (entityForm) {
      event.preventDefault();
      handleEntitySave(entityForm.dataset.entityForm, entityForm).catch((error) => {
        const fieldErrors = error.payload?.field_errors;
        const firstMessage = fieldErrors ? Object.values(fieldErrors)[0] : null;
        setFeedback(firstMessage || error.message || "Enregistrement impossible.", "error");
      });
    }
  });

  adminView.addEventListener("input", (event) => {
    const filterField = event.target.closest("[data-admin-filter-section]");
    if (!filterField) {
      return;
    }

    const section = filterField.dataset.adminFilterSection;
    const name = filterField.dataset.filterName;
    state.filters[section][name] = filterField.value;

    window.clearTimeout(searchDebounceId);
    searchDebounceId = window.setTimeout(() => {
      switchSection(section);
    }, 220);
  });

  adminView.addEventListener("change", (event) => {
    const filterField = event.target.closest("[data-admin-filter-section]");
    if (!filterField) {
      return;
    }

    const section = filterField.dataset.adminFilterSection;
    const name = filterField.dataset.filterName;
    state.filters[section][name] = filterField.value;
    switchSection(section);
  });
}

async function bootstrapAdmin() {
  bindStaticEvents();
  bindViewEvents();
  state.section = getSectionFromHash();
  updateHeader();
  await switchSection(state.section);
}

bootstrapAdmin().catch((error) => {
  setFeedback(error.message || "Impossible d’initialiser l’admin.", "error");
});
