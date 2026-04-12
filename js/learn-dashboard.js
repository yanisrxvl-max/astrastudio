const dashboardTitle = document.querySelector("[data-dashboard-title]");
const dashboardSummary = document.querySelector("[data-dashboard-summary]");
const dashboardFeedback = document.querySelector("[data-dashboard-feedback]");
const nextStepWrap = document.querySelector("[data-dashboard-next-step]");
const metricsWrap = document.querySelector("[data-dashboard-metrics]");
const coursesWrap = document.querySelector("[data-dashboard-courses]");
const refreshButton = document.querySelector("[data-student-refresh]");
const logoutButton = document.querySelector("[data-student-logout]");

function formatDate(value) {
  if (!value) {
    return "Aucune activité enregistrée";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatPercent(value) {
  return `${Math.max(0, Math.min(100, Math.round(Number(value || 0))))}%`;
}

function formatDuration(minutes) {
  const totalMinutes = Math.max(0, Math.round(Number(minutes || 0)));
  const hours = Math.floor(totalMinutes / 60);
  const rest = totalMinutes % 60;

  if (hours && rest) {
    return `${hours}h${String(rest).padStart(2, "0")}`;
  }

  if (hours) {
    return `${hours}h`;
  }

  return `${rest} min`;
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

function buildCourseHref(slug, lessonId = "") {
  const params = new URLSearchParams();
  params.set("course", slug);
  if (lessonId) {
    params.set("lesson", lessonId);
  }

  return `/learn/course?${params.toString()}`;
}

function renderMetrics(payload) {
  if (!metricsWrap) {
    return;
  }

  const enrollments = payload.enrollments || [];
  const totalRemainingMinutes = enrollments.reduce(
    (sum, enrollment) => sum + Number(enrollment.remaining_duration_minutes || 0),
    0
  );
  const completedPrograms = enrollments.filter(
    (enrollment) => Number(enrollment.progress_percent || 0) >= 100
  ).length;

  metricsWrap.innerHTML = `
    <article class="panel learn-metric-card">
      <span class="meta-label">Programmes actifs</span>
      <strong>${payload.metrics.total_courses}</strong>
      <p>Formations réellement ouvertes dans votre espace élève.</p>
    </article>
    <article class="panel learn-metric-card">
      <span class="meta-label">Progression moyenne</span>
      <strong>${formatPercent(payload.metrics.average_progress)}</strong>
      <p>Lecture globale de votre avancée sur l'ensemble des programmes achetés.</p>
    </article>
    <article class="panel learn-metric-card">
      <span class="meta-label">Temps restant estimé</span>
      <strong>${formatDuration(totalRemainingMinutes)}</strong>
      <p>Volume de travail restant avant d'avoir parcouru tous vos programmes.</p>
    </article>
    <article class="panel learn-metric-card">
      <span class="meta-label">Programmes terminés</span>
      <strong>${completedPrograms}</strong>
      <p>${payload.metrics.pending_assignments} devoir(s) encore en attente de remise ou de revue.</p>
    </article>
  `;
}

function renderNextStep(nextStep) {
  if (!nextStepWrap) {
    return;
  }

  if (!nextStep) {
    nextStepWrap.innerHTML = `
      <span class="meta-label">Reprise conseillée</span>
      <h2 class="card-title">Aucun programme actif pour le moment.</h2>
      <p class="subhead">
        Le catalogue reste accessible pour débloquer votre premier parcours et démarrer une trajectoire structurée.
      </p>
      <a class="button button-primary" href="/formations.html">Découvrir les programmes</a>
    `;
    return;
  }

  nextStepWrap.innerHTML = `
    <span class="meta-label">Reprise conseillée</span>
    <h2 class="card-title">${nextStep.course_title}</h2>
    <p class="subhead">${nextStep.promise || nextStep.course_subtitle || ""}</p>
    <div class="learn-focus-meta">
      <span>${nextStep.next_lesson?.module_title || "Module"}</span>
      <span>${nextStep.next_lesson?.title || "Leçon suivante"}</span>
      <span>${formatDuration(nextStep.next_lesson?.duration_minutes || 0)}</span>
    </div>
    <div class="learn-progress-wrap">
      <div class="learn-progress-label">
        <span>Progression</span>
        <strong>${formatPercent(nextStep.progress_percent)}</strong>
      </div>
      <div class="diagnostic-progress-bar"><span style="width:${Number(
        nextStep.progress_percent || 0
      )}%"></span></div>
    </div>
    <div class="button-row">
      <a class="button button-primary" href="${buildCourseHref(
        nextStep.course_slug,
        nextStep.next_lesson?.id || ""
      )}">Reprendre la bonne leçon</a>
    </div>
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
      const nextLesson = enrollment.next_lesson;
      const mainHref = buildCourseHref(enrollment.slug, nextLesson?.id || "");

      return `
        <article class="panel learn-course-card learn-course-card-rich">
          <div class="learn-course-card-head">
            <span class="status-pill">${enrollment.level || "Programme"}</span>
            <span class="meta-label">${enrollment.module_count || 0} modules • ${
        enrollment.total_lessons || 0
      } leçons</span>
          </div>
          <h3 class="card-title display">${enrollment.title}</h3>
          <p class="subhead">${enrollment.presentation?.promise || enrollment.subtitle || ""}</p>
          <div class="work-library-meta">
            <span>${formatDuration(enrollment.total_duration_minutes || 0)} de contenu</span>
            <span>${formatDuration(enrollment.remaining_duration_minutes || 0)} restants</span>
            <span>Dernière activité : ${formatDate(enrollment.last_activity_at)}</span>
          </div>
          <div class="learn-progress-wrap">
            <div class="learn-progress-label">
              <span>Progression</span>
              <strong>${formatPercent(progressPercent)}</strong>
            </div>
            <div class="diagnostic-progress-bar"><span style="width:${progressPercent}%"></span></div>
          </div>
          <div class="learn-course-card-body">
            <p class="learn-course-meta">
              ${nextLesson ? `Prochaine leçon : ${nextLesson.title}` : "Programme terminé ou prêt à être revu."}
            </p>
            <p class="learn-course-meta">
              ${enrollment.presentation?.executive_summary || enrollment.presentation?.outcome || enrollment.description || ""}
            </p>
          </div>
          <div class="button-row">
            <a class="button button-primary" href="${mainHref}">${
        progressPercent >= 100 ? "Revoir le programme" : "Reprendre"
      }</a>
            <a class="button button-secondary" href="${buildCourseHref(enrollment.slug)}">Vue programme</a>
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
    dashboardTitle.textContent = `${payload.user.full_name}, voici vos programmes en cours.`;
  }

  if (dashboardSummary) {
    dashboardSummary.textContent =
      payload.next_step && payload.next_step.next_lesson
        ? `Votre prochaine étape prioritaire est déjà identifiée : ${payload.next_step.next_lesson.title.toLowerCase()} dans ${payload.next_step.course_title}.`
        : "Retrouvez vos programmes, relisez vos synthèses et reprenez au bon endroit sans perdre le fil.";
  }

  renderNextStep(payload.next_step || null);
  renderMetrics(payload);
  renderCourses(payload.enrollments || []);
}

async function logout() {
  await requestApi("/api/student/auth/logout", { method: "POST" });
  window.location.href = "/learn/login";
}

if (refreshButton) {
  refreshButton.addEventListener("click", () => {
    loadDashboard().catch((error) => {
      setFeedback(error.message || "Impossible d'actualiser votre espace élève.", "error");
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
