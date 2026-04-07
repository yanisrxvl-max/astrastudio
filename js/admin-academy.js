const viewNode = document.querySelector("[data-academy-view]");
const feedbackNode = document.querySelector("[data-academy-feedback]");
const refreshButton = document.querySelector("[data-academy-refresh]");
const logoutButton = document.querySelector("[data-academy-logout]");
const sectionButtons = Array.from(document.querySelectorAll("[data-academy-section]"));
const kickerNode = document.querySelector("[data-academy-kicker]");
const titleNode = document.querySelector("[data-academy-title]");
const descriptionNode = document.querySelector("[data-academy-description]");

const sectionMeta = {
  overview: {
    kicker: "Pilotage",
    title: "Vue d’ensemble",
    description: "Lecture instantanée des ventes, élèves actifs, accès et devoirs en attente.",
  },
  courses: {
    kicker: "Catalogue",
    title: "Formations & structure",
    description: "Créer, modifier et organiser les formations, modules et leçons.",
  },
  submissions: {
    kicker: "Suivi pédagogique",
    title: "Devoirs élèves",
    description: "Traiter les remises, valider les livrables et envoyer des retours clairs.",
  },
  purchases: {
    kicker: "Revenue",
    title: "Paiements",
    description: "Suivre les sessions Stripe, les paiements validés et l’historique commercial.",
  },
  users: {
    kicker: "Élèves",
    title: "Comptes étudiants",
    description: "Consulter les élèves inscrits et attribuer des accès manuels si besoin.",
  },
};

const state = {
  section: "overview",
  overview: null,
  courses: [],
  courseModulesMap: {},
  users: [],
  purchases: [],
  submissions: [],
};

function setFeedback(message, type = "") {
  if (!feedbackNode) {
    return;
  }

  feedbackNode.textContent = message;
  feedbackNode.classList.remove("is-error", "is-success");

  if (type) {
    feedbackNode.classList.add(`is-${type}`);
  }
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));

  if (response.status === 401) {
    window.location.href = "/admin/login";
    throw new Error("Session expirée.");
  }

  if (!response.ok) {
    throw new Error(payload.message || "La requête a échoué.");
  }

  return payload;
}

function updateHeader() {
  const meta = sectionMeta[state.section];
  if (kickerNode) kickerNode.textContent = meta.kicker;
  if (titleNode) titleNode.textContent = meta.title;
  if (descriptionNode) descriptionNode.textContent = meta.description;

  sectionButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.academySection === state.section);
  });
}

function formatCurrency(cents, currency = "EUR") {
  const amount = Number(cents || 0) / 100;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: String(currency || "EUR").toUpperCase(),
    maximumFractionDigits: 2,
  }).format(amount);
}

function renderOverview() {
  if (!viewNode) {
    return;
  }

  const data = state.overview || {
    total_students: 0,
    total_enrollments: 0,
    paid_purchases: 0,
    revenue_cents: 0,
    pending_submissions: 0,
  };

  viewNode.innerHTML = `
    <section class="admin-metrics-grid">
      <article class="panel admin-metric-card">
        <span class="meta-label">Élèves</span>
        <strong>${data.total_students}</strong>
        <p>Comptes étudiants actifs.</p>
      </article>
      <article class="panel admin-metric-card">
        <span class="meta-label">Inscriptions</span>
        <strong>${data.total_enrollments}</strong>
        <p>Accès formations actifs.</p>
      </article>
      <article class="panel admin-metric-card">
        <span class="meta-label">Paiements confirmés</span>
        <strong>${data.paid_purchases}</strong>
        <p>Commandes validées via Stripe.</p>
      </article>
      <article class="panel admin-metric-card">
        <span class="meta-label">Revenu cumulé</span>
        <strong>${formatCurrency(data.revenue_cents, "EUR")}</strong>
        <p>Vision brute des ventes formations.</p>
      </article>
      <article class="panel admin-metric-card">
        <span class="meta-label">Devoirs à traiter</span>
        <strong>${data.pending_submissions}</strong>
        <p>Soumissions en attente de revue.</p>
      </article>
    </section>
  `;
}

function renderCourses() {
  if (!viewNode) {
    return;
  }

  const coursesRows = state.courses
    .map(
      (course) => `
        <tr>
          <td>${course.title}</td>
          <td>${course.slug}</td>
          <td>${course.level}</td>
          <td>${formatCurrency(course.price_cents, course.currency)}</td>
          <td>${course.module_count || 0}</td>
          <td>${course.lesson_count || 0}</td>
          <td>${course.enrollment_count || 0}</td>
        </tr>
      `
    )
    .join("");

  viewNode.innerHTML = `
    <article class="panel admin-panel">
      <div class="admin-panel-head">
        <div>
          <span class="meta-label">Catalogue</span>
          <h3>Formations existantes</h3>
        </div>
      </div>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Titre</th>
              <th>Slug</th>
              <th>Niveau</th>
              <th>Prix</th>
              <th>Modules</th>
              <th>Leçons</th>
              <th>Élèves</th>
            </tr>
          </thead>
          <tbody>${coursesRows || '<tr><td colspan="7">Aucune formation.</td></tr>'}</tbody>
        </table>
      </div>
    </article>

    <article class="panel admin-panel">
      <div class="admin-panel-head">
        <div>
          <span class="meta-label">Création rapide</span>
          <h3>Ajouter une formation</h3>
        </div>
      </div>
      <form data-create-course-form class="admin-toolbar">
        <label class="admin-toolbar-field" style="grid-column: span 3;">
          <span>Slug</span>
          <input type="text" name="slug" required placeholder="astra-nom" />
        </label>
        <label class="admin-toolbar-field" style="grid-column: span 3;">
          <span>Titre</span>
          <input type="text" name="title" required />
        </label>
        <label class="admin-toolbar-field" style="grid-column: span 2;">
          <span>Niveau</span>
          <select name="level">
            <option value="debutant">Débutant</option>
            <option value="intermediaire">Intermédiaire</option>
            <option value="avance">Avancé</option>
          </select>
        </label>
        <label class="admin-toolbar-field" style="grid-column: span 2;">
          <span>Prix (centimes)</span>
          <input type="number" name="price_cents" min="0" value="11900" />
        </label>
        <label class="admin-toolbar-field" style="grid-column: span 2;">
          <span>Ordre</span>
          <input type="number" name="order_index" min="0" value="10" />
        </label>
        <label class="admin-toolbar-field" style="grid-column: span 12;">
          <span>Sous-titre</span>
          <input type="text" name="subtitle" />
        </label>
        <label class="admin-toolbar-field" style="grid-column: span 12;">
          <span>Description</span>
          <textarea name="description" rows="4"></textarea>
        </label>
        <div class="admin-toolbar-actions" style="grid-column: span 12;">
          <button type="submit" class="button button-primary">Créer la formation</button>
        </div>
      </form>
    </article>

    <article class="panel admin-panel">
      <div class="admin-panel-head">
        <div>
          <span class="meta-label">Attribution manuelle</span>
          <h3>Offrir un accès</h3>
        </div>
      </div>
      <form data-manual-enrollment-form class="admin-toolbar">
        <label class="admin-toolbar-field" style="grid-column: span 5;">
          <span>E-mail élève</span>
          <input type="email" name="email" required />
        </label>
        <label class="admin-toolbar-field" style="grid-column: span 5;">
          <span>Formation</span>
          <select name="course_id" required>
            ${state.courses
              .map((course) => `<option value="${course.id}">${course.title}</option>`)
              .join("")}
          </select>
        </label>
        <div class="admin-toolbar-actions" style="grid-column: span 2;">
          <button type="submit" class="button button-secondary">Attribuer</button>
        </div>
      </form>
    </article>

    <article class="panel admin-panel">
      <div class="admin-panel-head">
        <div>
          <span class="meta-label">Structure pédagogique</span>
          <h3>Créer un module</h3>
        </div>
      </div>
      <form data-create-module-form class="admin-toolbar">
        <label class="admin-toolbar-field" style="grid-column: span 4;">
          <span>Formation</span>
          <select name="course_id" required>
            ${state.courses
              .map((course) => `<option value="${course.id}">${course.title}</option>`)
              .join("")}
          </select>
        </label>
        <label class="admin-toolbar-field" style="grid-column: span 6;">
          <span>Titre du module</span>
          <input type="text" name="title" required />
        </label>
        <label class="admin-toolbar-field" style="grid-column: span 2;">
          <span>Ordre</span>
          <input type="number" name="order_index" min="0" value="10" />
        </label>
        <label class="admin-toolbar-field" style="grid-column: span 12;">
          <span>Description</span>
          <textarea name="description" rows="3"></textarea>
        </label>
        <div class="admin-toolbar-actions" style="grid-column: span 12;">
          <button type="submit" class="button button-secondary">Créer le module</button>
        </div>
      </form>
    </article>

    <article class="panel admin-panel">
      <div class="admin-panel-head">
        <div>
          <span class="meta-label">Structure pédagogique</span>
          <h3>Créer une leçon</h3>
        </div>
      </div>
      <form data-create-lesson-form class="admin-toolbar">
        <label class="admin-toolbar-field" style="grid-column: span 4;">
          <span>Formation</span>
          <select name="course_id" required data-lesson-course>
            ${state.courses
              .map((course) => `<option value="${course.id}">${course.title}</option>`)
              .join("")}
          </select>
        </label>
        <label class="admin-toolbar-field" style="grid-column: span 4;">
          <span>Module</span>
          <select name="module_id" required data-lesson-module></select>
        </label>
        <label class="admin-toolbar-field" style="grid-column: span 4;">
          <span>Type</span>
          <select name="lesson_type">
            <option value="mixed">Mixte</option>
            <option value="video">Vidéo</option>
            <option value="text">Texte</option>
          </select>
        </label>
        <label class="admin-toolbar-field" style="grid-column: span 8;">
          <span>Titre de la leçon</span>
          <input type="text" name="title" required />
        </label>
        <label class="admin-toolbar-field" style="grid-column: span 2;">
          <span>Durée (min)</span>
          <input type="number" name="duration_minutes" min="0" value="20" />
        </label>
        <label class="admin-toolbar-field" style="grid-column: span 2;">
          <span>Ordre</span>
          <input type="number" name="order_index" min="0" value="10" />
        </label>
        <label class="admin-toolbar-field" style="grid-column: span 12;">
          <span>URL vidéo (optionnel)</span>
          <input type="url" name="video_url" />
        </label>
        <label class="admin-toolbar-field" style="grid-column: span 12;">
          <span>Contenu / notes</span>
          <textarea name="content_markdown" rows="3"></textarea>
        </label>
        <label class="admin-toolbar-field" style="grid-column: span 12;">
          <span>Brief devoir</span>
          <textarea name="assignment_prompt" rows="3"></textarea>
        </label>
        <div class="admin-toolbar-actions" style="grid-column: span 12;">
          <button type="submit" class="button button-secondary">Créer la leçon</button>
        </div>
      </form>
    </article>
  `;

  const createCourseForm = viewNode.querySelector("[data-create-course-form]");
  if (createCourseForm) {
    createCourseForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = Object.fromEntries(new FormData(createCourseForm).entries());
      payload.price_cents = Number(payload.price_cents || 0);
      payload.order_index = Number(payload.order_index || 0);
      payload.currency = "EUR";
      payload.status = "published";

      try {
        await apiRequest("/api/admin/academy/courses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        setFeedback("Formation créée avec succès.", "success");
        await loadSectionData("courses");
        renderCurrentSection();
      } catch (error) {
        setFeedback(error.message, "error");
      }
    });
  }

  const manualEnrollmentForm = viewNode.querySelector("[data-manual-enrollment-form]");
  if (manualEnrollmentForm) {
    manualEnrollmentForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = Object.fromEntries(new FormData(manualEnrollmentForm).entries());

      try {
        await apiRequest("/api/admin/academy/enrollments/manual", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        setFeedback("Accès manuel attribué avec succès.", "success");
      } catch (error) {
        setFeedback(error.message, "error");
      }
    });
  }

  const createModuleForm = viewNode.querySelector("[data-create-module-form]");
  if (createModuleForm) {
    createModuleForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = Object.fromEntries(new FormData(createModuleForm).entries());
      payload.order_index = Number(payload.order_index || 0);

      try {
        await apiRequest("/api/admin/academy/modules", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        setFeedback("Module créé.", "success");
        await loadSectionData("courses");
        renderCurrentSection();
      } catch (error) {
        setFeedback(error.message, "error");
      }
    });
  }

  const lessonForm = viewNode.querySelector("[data-create-lesson-form]");
  if (lessonForm) {
    const courseSelect = lessonForm.querySelector("[data-lesson-course]");
    const moduleSelect = lessonForm.querySelector("[data-lesson-module]");

    const hydrateModulesSelect = () => {
      const courseId = courseSelect?.value || "";
      const modules = state.courseModulesMap[courseId] || [];

      if (moduleSelect) {
        moduleSelect.innerHTML = modules.length
          ? modules.map((module) => `<option value="${module.id}">${module.title}</option>`).join("")
          : '<option value="">Aucun module</option>';
      }
    };

    if (courseSelect) {
      courseSelect.addEventListener("change", hydrateModulesSelect);
    }

    hydrateModulesSelect();

    lessonForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = Object.fromEntries(new FormData(lessonForm).entries());
      payload.duration_minutes = Number(payload.duration_minutes || 0);
      payload.order_index = Number(payload.order_index || 0);

      try {
        await apiRequest("/api/admin/academy/lessons", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        setFeedback("Leçon créée.", "success");
        await loadSectionData("courses");
        renderCurrentSection();
      } catch (error) {
        setFeedback(error.message, "error");
      }
    });
  }
}

function renderSubmissions() {
  if (!viewNode) {
    return;
  }

  viewNode.innerHTML = `
    <article class="panel admin-panel">
      <div class="admin-panel-head">
        <div>
          <span class="meta-label">Revue des rendus</span>
          <h3>Devoirs élèves</h3>
        </div>
      </div>
      <div class="admin-simple-list">
        ${
          state.submissions.length
            ? state.submissions
                .map(
                  (submission) => `
                    <article class="admin-list-item">
                      <strong>${submission.user_name} • ${submission.course_title}</strong>
                      <p>${submission.lesson_title}</p>
                      <p>${submission.text_response}</p>
                      <div class="button-row" style="margin-top:0.75rem;">
                        <select data-submission-status="${submission.id}">
                          <option value="submitted" ${submission.status === "submitted" ? "selected" : ""}>Soumis</option>
                          <option value="pending_review" ${submission.status === "pending_review" ? "selected" : ""}>En revue</option>
                          <option value="validated" ${submission.status === "validated" ? "selected" : ""}>Validé</option>
                          <option value="revision_requested" ${submission.status === "revision_requested" ? "selected" : ""}>À revoir</option>
                        </select>
                        <button class="button button-secondary" type="button" data-save-submission="${submission.id}">Mettre à jour</button>
                        ${
                          (submission.attachments || [])
                            .map(
                              (attachment) =>
                                `<a class="button button-secondary" href="/api/admin/academy/submissions/attachments/${attachment.id}">${attachment.original_name}</a>`
                            )
                            .join("")
                        }
                      </div>
                    </article>
                  `
                )
                .join("")
            : "<p>Aucune soumission pour le moment.</p>"
        }
      </div>
    </article>
  `;

  viewNode.querySelectorAll("[data-save-submission]").forEach((button) => {
    button.addEventListener("click", async () => {
      const submissionId = button.dataset.saveSubmission;
      const statusField = viewNode.querySelector(`[data-submission-status="${submissionId}"]`);
      if (!statusField) {
        return;
      }

      try {
        await apiRequest(`/api/admin/academy/submissions/${submissionId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: statusField.value,
          }),
        });
        setFeedback("Statut du devoir mis à jour.", "success");
        await loadSectionData("submissions");
        renderCurrentSection();
      } catch (error) {
        setFeedback(error.message, "error");
      }
    });
  });
}

function renderPurchases() {
  if (!viewNode) {
    return;
  }

  const rows = state.purchases
    .map(
      (purchase) => `
        <tr>
          <td>${purchase.user_name}</td>
          <td>${purchase.user_email}</td>
          <td>${purchase.course_title}</td>
          <td>${formatCurrency(purchase.amount_cents, purchase.currency)}</td>
          <td>${purchase.status}</td>
          <td>${purchase.provider_session_id || "-"}</td>
        </tr>
      `
    )
    .join("");

  viewNode.innerHTML = `
    <article class="panel admin-panel">
      <div class="admin-panel-head">
        <div>
          <span class="meta-label">Transactions</span>
          <h3>Paiements formations</h3>
        </div>
      </div>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>E-mail</th>
              <th>Formation</th>
              <th>Montant</th>
              <th>Statut</th>
              <th>Session Stripe</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="6">Aucune transaction.</td></tr>'}</tbody>
        </table>
      </div>
    </article>
  `;
}

function renderUsers() {
  if (!viewNode) {
    return;
  }

  const rows = state.users
    .map(
      (user) => `
        <tr>
          <td>${user.full_name}</td>
          <td>${user.email}</td>
          <td>${user.enrollment_count || 0}</td>
          <td>${user.last_login_at || "Jamais"}</td>
          <td>${user.status}</td>
        </tr>
      `
    )
    .join("");

  viewNode.innerHTML = `
    <article class="panel admin-panel">
      <div class="admin-panel-head">
        <div>
          <span class="meta-label">Base élèves</span>
          <h3>Comptes étudiants</h3>
        </div>
      </div>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>E-mail</th>
              <th>Inscriptions</th>
              <th>Dernière connexion</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="5">Aucun élève.</td></tr>'}</tbody>
        </table>
      </div>
    </article>
  `;
}

function renderCurrentSection() {
  if (state.section === "overview") {
    renderOverview();
    return;
  }

  if (state.section === "courses") {
    renderCourses();
    return;
  }

  if (state.section === "submissions") {
    renderSubmissions();
    return;
  }

  if (state.section === "purchases") {
    renderPurchases();
    return;
  }

  if (state.section === "users") {
    renderUsers();
  }
}

async function loadSectionData(section) {
  if (section === "overview") {
    const payload = await apiRequest("/api/admin/academy/overview");
    state.overview = payload.data;
    return;
  }

  if (section === "courses") {
    const payload = await apiRequest("/api/admin/academy/courses");
    state.courses = payload.courses || [];
    state.courseModulesMap = {};

    await Promise.all(
      state.courses.map(async (course) => {
        const modulesPayload = await apiRequest(`/api/admin/academy/courses/${course.id}/modules`);
        state.courseModulesMap[course.id] = modulesPayload.modules || [];
      })
    );
    return;
  }

  if (section === "submissions") {
    const payload = await apiRequest("/api/admin/academy/submissions");
    state.submissions = payload.submissions || [];
    return;
  }

  if (section === "purchases") {
    const payload = await apiRequest("/api/admin/academy/purchases");
    state.purchases = payload.purchases || [];
    return;
  }

  if (section === "users") {
    const payload = await apiRequest("/api/admin/academy/users");
    state.users = payload.users || [];
  }
}

async function setSection(section) {
  state.section = section;
  updateHeader();
  setFeedback("");
  await loadSectionData(section);
  renderCurrentSection();
}

async function logout() {
  await apiRequest("/api/admin/auth/logout", {
    method: "POST",
  });
  window.location.href = "/admin/login";
}

sectionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setSection(button.dataset.academySection).catch((error) => {
      setFeedback(error.message, "error");
    });
  });
});

if (refreshButton) {
  refreshButton.addEventListener("click", () => {
    setSection(state.section).catch((error) => {
      setFeedback(error.message, "error");
    });
  });
}

if (logoutButton) {
  logoutButton.addEventListener("click", () => {
    logout().catch((error) => {
      setFeedback(error.message, "error");
    });
  });
}

setSection("overview").catch((error) => {
  setFeedback(error.message, "error");
});
