const courseTitleNode = document.querySelector("[data-course-title]");
const courseSubtitleNode = document.querySelector("[data-course-subtitle]");
const progressLabelNode = document.querySelector("[data-course-progress-label]");
const progressBarNode = document.querySelector("[data-course-progress-bar]");
const modulesWrap = document.querySelector("[data-course-modules]");
const lessonMetaNode = document.querySelector("[data-lesson-meta]");
const lessonTitleNode = document.querySelector("[data-lesson-title]");
const lessonContentNode = document.querySelector("[data-lesson-content]");
const lessonVideoPlaceholderNode = document.querySelector("[data-lesson-video-placeholder]");
const assignmentPromptNode = document.querySelector("[data-assignment-prompt]");
const assignmentStatusNode = document.querySelector("[data-assignment-status]");
const assignmentForm = document.querySelector("[data-assignment-form]");
const assignmentLessonField = document.querySelector("[data-assignment-lesson-id]");
const submissionsWrap = document.querySelector("[data-submissions-list]");
const markCompleteButton = document.querySelector("[data-mark-complete]");
const feedbackNode = document.querySelector("[data-course-feedback]");
const backButton = document.querySelector("[data-course-back]");

const state = {
  course: null,
  selectedLessonId: "",
  submissions: [],
};

function getCourseSlugFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("course") || "";
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
  if (!feedbackNode) {
    return;
  }

  feedbackNode.textContent = message;
  feedbackNode.classList.remove("is-error", "is-success");
  if (type) {
    feedbackNode.classList.add(`is-${type}`);
  }
}

function flattenLessons(course) {
  return (course.modules || []).flatMap((module) => module.lessons || []);
}

function findLessonById(lessonId) {
  if (!state.course) {
    return null;
  }

  return flattenLessons(state.course).find((lesson) => lesson.id === lessonId) || null;
}

function getLessonSubmission(lessonId) {
  return state.submissions.find((submission) => submission.lesson_id === lessonId) || null;
}

function renderModules() {
  if (!modulesWrap || !state.course) {
    return;
  }

  const html = (state.course.modules || [])
    .map((module, mIndex) => {
      const lessonItems = (module.lessons || [])
        .map((lesson, lIndex) => {
          const status = lesson.progress?.status || "not_started";
          const statusLabel =
            status === "completed" ? "Terminé" : status === "in_progress" ? "En cours" : "À faire";
          const isActive = state.selectedLessonId === lesson.id ? "is-active" : "";

          return `
            <button type="button" class="learn-lesson-link ${isActive}" data-lesson-id="${lesson.id}" style="text-align: left;">
              <span style="font-weight: 500;">${mIndex + 1}.${lIndex + 1} &nbsp;${lesson.title}</span>
              <small>${statusLabel}</small>
            </button>
          `;
        })
        .join("");

      return `
        <article class="learn-module-card">
          <header>
            <span class="meta-label">Module ${mIndex + 1}</span>
            <h3 style="font-family: 'Bodoni Moda', serif; font-size: 1.3rem;">${module.title}</h3>
            <p>${module.description || ""}</p>
          </header>
          <div class="learn-module-lessons">${lessonItems}</div>
        </article>
      `;
    })
    .join("");

  modulesWrap.innerHTML = html || `<p class="subhead">Aucun module disponible pour cette formation.</p>`;

  modulesWrap.querySelectorAll("[data-lesson-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedLessonId = button.dataset.lessonId || "";
      renderModules();
      renderLesson();
    });
  });
}

function renderLesson() {
  const lesson = findLessonById(state.selectedLessonId);

  if (!lesson) {
    if (lessonVideoPlaceholderNode) {
      lessonVideoPlaceholderNode.innerHTML = "";
      lessonVideoPlaceholderNode.style.display = "none";
    }
    if (lessonMetaNode) lessonMetaNode.textContent = "Astra Studio";
    if (lessonTitleNode) lessonTitleNode.textContent = "Bienvenue dans votre programme";
    if (lessonContentNode)
      lessonContentNode.innerHTML = "<p style='color: var(--color-gray-400);'>Choisissez un module dans la colonne de gauche pour amorcer votre progression.</p>";
    if (assignmentPromptNode)
      assignmentPromptNode.textContent = "Le brief du devoir apparaîtra ici dès qu’une leçon requiert votre attention.";
    if (assignmentStatusNode) assignmentStatusNode.textContent = "En attente";
    if (assignmentLessonField) assignmentLessonField.value = "";
    if (markCompleteButton) markCompleteButton.disabled = true;
    return;
  }

  const module = (state.course.modules || []).find((item) => item.id === lesson.module_id);
  const submission = getLessonSubmission(lesson.id);
  const progressStatus = lesson.progress?.status || "not_started";
  const progressLabel =
    progressStatus === "completed"
      ? "Terminée"
      : progressStatus === "in_progress"
        ? "Leçon en cours"
        : "Leçon à démarrer";

  if (lessonMetaNode) lessonMetaNode.textContent = `${module?.title || "Module"} • ${progressLabel}`;
  if (lessonTitleNode) lessonTitleNode.textContent = lesson.title;
  
  if (lessonVideoPlaceholderNode) {
    const videoSrc = lesson.video_url || "/assets/videos/astra-hero-work.mp4"; // Astra premium fallback
    const posterSrc = lesson.video_url ? "" : 'poster="/assets/videos/astra-hero-work-poster.png"';
    lessonVideoPlaceholderNode.style.display = "block";
    if (videoSrc.includes('youtube.com') || videoSrc.includes('vimeo.com')) {
      lessonVideoPlaceholderNode.innerHTML = `<iframe src="${videoSrc}" allowfullscreen style="border-radius:12px; width:100%; height:100%; aspect-ratio:16/9; margin-bottom: 2rem; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 10px 40px rgba(0,0,0,0.4);"></iframe>`;
    } else {
      lessonVideoPlaceholderNode.innerHTML = `<video src="${videoSrc}" ${posterSrc} controls controlsList="nodownload" style="border-radius:12px; width:100%; margin-bottom: 2rem; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 10px 40px rgba(0,0,0,0.4);"></video>`;
    }
  }

  if (lessonContentNode) {
    const rawContent = lesson.content_markdown || "Cette leçon vidéo est conçue pour déconstruire les mécaniques complexes et vous donner une grille d'exécution immédiate.";
    lessonContentNode.innerHTML = `<div style="line-height: 1.7; color: var(--color-gray-400); font-size: 1.05rem;">${rawContent.replace(/\\n\\n/g, '<br><br>')}</div>`;
  }

  if (assignmentPromptNode) {
    assignmentPromptNode.textContent =
      lesson.assignment_prompt || "Aucun devoir obligatoire pour cette leçon.";
  }

  if (assignmentStatusNode) {
    assignmentStatusNode.textContent = submission
      ? submission.status === "validated"
        ? "Validé"
        : submission.status === "revision_requested"
          ? "À revoir"
          : "Envoyé"
      : "Non envoyé";
  }

  if (assignmentLessonField) {
    assignmentLessonField.value = lesson.id;
  }

  if (markCompleteButton) {
    markCompleteButton.disabled = false;
    markCompleteButton.textContent =
      progressStatus === "completed" ? "Leçon déjà terminée" : "Marquer comme terminée";
  }
}

function renderSubmissions() {
  if (!submissionsWrap) {
    return;
  }

  if (!state.submissions.length) {
    submissionsWrap.innerHTML = `<p class="subhead">Aucun devoir envoyé pour le moment.</p>`;
    return;
  }

  submissionsWrap.innerHTML = state.submissions
    .map((submission) => {
      const attachmentLinks = (submission.attachments || [])
        .map(
          (attachment) => `
            <a href="/api/student/submissions/attachments/${attachment.id}" class="inline-link">
              ${attachment.original_name}
            </a>
          `
        )
        .join("");

      return `
        <article class="learn-submission-card">
          <div>
            <strong>${submission.lesson_title}</strong>
            <p>${submission.text_response}</p>
            <span class="meta-label">${submission.status}</span>
          </div>
          <div class="learn-submission-meta">
            <small>Envoyé le ${new Intl.DateTimeFormat("fr-FR", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(submission.created_at))}</small>
            ${attachmentLinks ? `<div class="learn-submission-attachments">${attachmentLinks}</div>` : ""}
          </div>
        </article>
      `;
    })
    .join("");
}

function renderCourse() {
  if (!state.course) {
    return;
  }

  if (courseTitleNode) {
    courseTitleNode.textContent = state.course.title;
  }

  if (courseSubtitleNode) {
    courseSubtitleNode.textContent = state.course.subtitle || state.course.description || "";
  }

  if (progressLabelNode) {
    progressLabelNode.textContent = `${state.course.stats?.progress_percent || 0}%`;
  }

  if (progressBarNode) {
    progressBarNode.style.width = `${state.course.stats?.progress_percent || 0}%`;
  }

  if (!state.selectedLessonId) {
    const firstLesson = flattenLessons(state.course)[0];
    state.selectedLessonId = firstLesson?.id || "";
  }

  renderModules();
  renderLesson();
  renderSubmissions();
}

async function loadCourse() {
  const slug = getCourseSlugFromUrl();
  if (!slug) {
    window.location.href = "/learn/dashboard";
    return;
  }

  const payload = await requestApi(`/api/student/courses/${encodeURIComponent(slug)}`);
  state.course = payload.course;
  state.submissions = payload.submissions || [];
  renderCourse();
}

async function markCurrentLessonAsCompleted() {
  const lesson = findLessonById(state.selectedLessonId);
  if (!lesson) {
    return;
  }

  const payload = await requestApi("/api/student/progress", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      lesson_id: lesson.id,
      status: "completed",
      progress_percent: 100,
    }),
  });

  state.course = payload.course;
  setFeedback("Leçon marquée comme terminée.", "success");
  renderCourse();
}

async function submitAssignment(event) {
  event.preventDefault();
  setFeedback("");

  if (!assignmentForm) {
    return;
  }

  if (!assignmentForm.reportValidity()) {
    return;
  }

  const formData = new FormData(assignmentForm);
  const response = await fetch("/api/student/submissions", {
    method: "POST",
    credentials: "same-origin",
    body: formData,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || "Impossible d’envoyer le devoir.");
  }

  const previous = state.submissions.filter((submission) => submission.id !== payload.submission.id);
  state.submissions = [payload.submission, ...previous];
  assignmentForm.reset();
  if (assignmentLessonField) {
    assignmentLessonField.value = state.selectedLessonId;
  }
  renderLesson();
  renderSubmissions();
  setFeedback(payload.message || "Devoir envoyé.", "success");
}

if (backButton) {
  backButton.addEventListener("click", () => {
    window.location.href = "/learn/dashboard";
  });
}

if (markCompleteButton) {
  markCompleteButton.addEventListener("click", () => {
    markCurrentLessonAsCompleted().catch((error) => {
      setFeedback(error.message || "Impossible de mettre à jour la progression.", "error");
    });
  });
}

if (assignmentForm) {
  assignmentForm.addEventListener("submit", (event) => {
    submitAssignment(event).catch((error) => {
      setFeedback(error.message || "Impossible d’envoyer votre devoir.", "error");
    });
  });
}

loadCourse().catch((error) => {
  setFeedback(error.message || "Impossible de charger la formation.", "error");
});
