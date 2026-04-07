const dashboardTitle = document.querySelector("[data-dashboard-title]");
const dashboardFeedback = document.querySelector("[data-dashboard-feedback]");
const metricsWrap = document.querySelector("[data-dashboard-metrics]");
const coursesWrap = document.querySelector("[data-dashboard-courses]");
const refreshButton = document.querySelector("[data-student-refresh]");
const logoutButton = document.querySelector("[data-student-logout]");

function formatDate(value) {
  if (!value) {
    return "Aucune activité";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatPercent(value) {
  return `${Math.max(0, Math.min(100, Math.round(Number(value || 0))))}%`;
}

function requestApi(url, options = {}) {
  return fetch(url, {
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...(options.headers || {}),
    },
    ...options,
  }).then(async (response) => {
    const payload = await response.json().catch(() => ({}));

    if (response.status === 401) {
      window.location.href = "/learn/login";
      throw new Error("Session expirée.");
    }

    if (!response.ok) {
      throw new Error(payload.message || "La requête a échoué.");
    }

    return payload;
  });
}

function setFeedback(message, type = "") {
  if (!dashboardFeedback) {
    return;
  }

  dashboardFeedback.textContent = message;
  dashboardFeedback.classList.remove("is-error", "is-success");
  if (type) {
    dashboardFeedback.classList.add(`is-${type}`);
  }
}

function renderMetrics(metrics) {
  if (!metricsWrap) {
    return;
  }

  metricsWrap.innerHTML = `
    <article class="panel learn-metric-card">
      <span class="meta-label">Formations actives</span>
      <strong>${metrics.total_courses}</strong>
      <p>Programmes achetés dans votre espace.</p>
    </article>
    <article class="panel learn-metric-card">
      <span class="meta-label">Progression moyenne</span>
      <strong>${formatPercent(metrics.average_progress)}</strong>
      <p>Lecture globale de votre avancement.</p>
    </article>
    <article class="panel learn-metric-card">
      <span class="meta-label">Devoirs en attente</span>
      <strong>${metrics.pending_assignments}</strong>
      <p>Remises à suivre ou à compléter.</p>
    </article>
  `;
}

function renderCourses(enrollments) {
  if (!coursesWrap) {
    return;
  }

  if (!enrollments.length) {
    coursesWrap.innerHTML = `
      <article class="panel learn-course-card">
        <h3 class="card-title">Aucune formation active pour le moment.</h3>
        <p class="subhead">Accédez au catalogue pour débloquer votre premier programme.</p>
        <a class="button button-primary" href="/formations.html">Découvrir les formations</a>
      </article>
    `;
    return;
  }

  coursesWrap.innerHTML = enrollments
    .map((enrollment) => {
      const progressPercent = Number(enrollment.progress_percent || 0);
      return `
        <article class="panel learn-course-card">
          <div class="learn-course-card-head">
            <span class="status-pill">${enrollment.level || "Formation"}</span>
            <span class="meta-label">${enrollment.completed_lessons || 0} / ${
        enrollment.total_lessons || 0
      } leçons</span>
          </div>
          <h3 class="card-title display">${enrollment.title}</h3>
          <p class="subhead">${enrollment.subtitle || ""}</p>
          <div class="learn-progress-wrap">
            <div class="learn-progress-label">
              <span>Progression</span>
              <strong>${formatPercent(progressPercent)}</strong>
            </div>
            <div class="diagnostic-progress-bar"><span style="width:${progressPercent}%"></span></div>
          </div>
          <p class="learn-course-meta">Dernière activité : ${formatDate(enrollment.last_activity_at)}</p>
          <div class="button-row">
            <a class="button button-primary" href="/learn/course?course=${encodeURIComponent(
              enrollment.slug
            )}">Reprendre la formation</a>
          </div>
        </article>
      `;
    })
    .join("");
}

async function loadDashboard() {
  setFeedback("");

  const payload = await requestApi("/api/student/dashboard");
  if (dashboardTitle) {
    dashboardTitle.textContent = `${payload.user.full_name}, votre cockpit formation est prêt.`;
  }

  renderMetrics(payload.metrics || { total_courses: 0, average_progress: 0, pending_assignments: 0 });
  renderCourses(payload.enrollments || []);
}

async function logout() {
  await requestApi("/api/student/auth/logout", { method: "POST" });
  window.location.href = "/learn/login";
}

if (refreshButton) {
  refreshButton.addEventListener("click", () => {
    loadDashboard().catch((error) => {
      setFeedback(error.message || "Impossible d’actualiser le dashboard.", "error");
    });
  });
}

if (logoutButton) {
  logoutButton.addEventListener("click", () => {
    logout().catch((error) => {
      setFeedback(error.message || "Impossible de vous déconnecter.", "error");
    });
  });
}

loadDashboard().catch((error) => {
  setFeedback(error.message || "Impossible de charger votre espace élève.", "error");
});
