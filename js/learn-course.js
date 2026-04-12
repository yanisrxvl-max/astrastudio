const courseTitleNode = document.querySelector("[data-course-title]");
const courseSubtitleNode = document.querySelector("[data-course-subtitle]");
const courseMetaNode = document.querySelector("[data-course-meta]");
const courseSummaryNode = document.querySelector("[data-course-summary-body]");
const courseProgressLabelNode = document.querySelector("[data-course-progress-label]");
const courseProgressBarNode = document.querySelector("[data-course-progress-bar]");
const modulesWrap = document.querySelector("[data-course-modules]");
const programTitleNode = document.querySelector("[data-program-title]");
const programStatusNode = document.querySelector("[data-program-status]");
const programDescriptionNode = document.querySelector("[data-program-description]");
const programHighlightsNode = document.querySelector("[data-program-highlights]");
const programOutcomeNode = document.querySelector("[data-program-outcome]");
const programNextStepNode = document.querySelector("[data-program-next-step]");
const programAudienceNode = document.querySelector("[data-program-audience]");
const programCadenceNode = document.querySelector("[data-program-cadence]");
const programMethodNode = document.querySelector("[data-program-method]");
const programDeliverableNode = document.querySelector("[data-program-deliverable]");
const programSupportsNode = document.querySelector("[data-program-supports]");
const lessonShellNode = document.querySelector("[data-lesson-shell]");
const lessonMetaNode = document.querySelector("[data-lesson-meta]");
const lessonStatusNode = document.querySelector("[data-lesson-status]");
const lessonTitleNode = document.querySelector("[data-lesson-title]");
const lessonContentNode = document.querySelector("[data-lesson-content]");
const lessonVideoPlaceholderNode = document.querySelector("[data-lesson-video-placeholder]");
const assignmentPromptNode = document.querySelector("[data-assignment-prompt]");
const assignmentStatusNode = document.querySelector("[data-assignment-status]");
const assignmentForm = document.querySelector("[data-assignment-form]");
const assignmentSubmitButton = assignmentForm?.querySelector('button[type="submit"]') || null;
const assignmentLessonField = document.querySelector("[data-assignment-lesson-id]");
const submissionsWrap = document.querySelector("[data-submissions-list]");
const markCompleteButton = document.querySelector("[data-mark-complete]");
const prevLessonButton = document.querySelector("[data-prev-lesson]");
const nextLessonButton = document.querySelector("[data-next-lesson]");
const feedbackNode = document.querySelector("[data-course-feedback]");
const backButton = document.querySelector("[data-course-back]");
const startButton = document.querySelector("[data-course-start]");
const overviewButtons = Array.from(document.querySelectorAll("[data-course-overview-trigger]"));

const state = {
  course: null,
  selectedLessonId: "",
  submissions: [],
};

function getParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    courseSlug: params.get("course") || "",
    lessonId: params.get("lesson") || "",
  };
}

function updateUrl(lessonId = "") {
  const { courseSlug } = getParams();
  const params = new URLSearchParams();
  params.set("course", courseSlug);
  if (lessonId) {
    params.set("lesson", lessonId);
  }
  window.history.replaceState({}, "", `/learn/course?${params.toString()}`);
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

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatInline(value) {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.+?)`/g, "<code>$1</code>");
}

function markdownToHtml(markdown) {
  const lines = String(markdown || "")
    .replace(/\r/g, "")
    .split("\n");
  const html = [];
  let index = 0;
  let listType = "";
  let listItems = [];

  const flushList = () => {
    if (!listItems.length) {
      return;
    }

    const tag = listType === "ol" ? "ol" : "ul";
    html.push(`<${tag} class="learn-rich-list">${listItems.map((item) => `<li>${formatInline(item)}</li>`).join("")}</${tag}>`);
    listItems = [];
    listType = "";
  };

  while (index < lines.length) {
    const line = lines[index].trim();

    if (!line) {
      flushList();
      index += 1;
      continue;
    }

    if (line.startsWith("### ")) {
      flushList();
      html.push(`<h4 class="learn-rich-subtitle">${formatInline(line.slice(4))}</h4>`);
      index += 1;
      continue;
    }

    if (line.startsWith("## ")) {
      flushList();
      html.push(`<h3 class="learn-rich-title">${formatInline(line.slice(3))}</h3>`);
      index += 1;
      continue;
    }

    if (line.startsWith("- ")) {
      const nextType = "ul";
      if (listType && listType !== nextType) {
        flushList();
      }
      listType = nextType;
      listItems.push(line.slice(2));
      index += 1;
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const nextType = "ol";
      if (listType && listType !== nextType) {
        flushList();
      }
      listType = nextType;
      listItems.push(line.replace(/^\d+\.\s+/, ""));
      index += 1;
      continue;
    }

    flushList();
    const paragraphLines = [line];
    index += 1;
    while (index < lines.length) {
      const nextLine = lines[index].trim();
      if (!nextLine || nextLine.startsWith("## ") || nextLine.startsWith("### ") || nextLine.startsWith("- ") || /^\d+\.\s+/.test(nextLine)) {
        break;
      }
      paragraphLines.push(nextLine);
      index += 1;
    }
    html.push(`<p>${formatInline(paragraphLines.join(" "))}</p>`);
  }

  flushList();
  return html.join("");
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

function flattenLessons(course) {
  return (course?.modules || []).flatMap((module) => module.lessons || []);
}

function getSelectedLesson() {
  return flattenLessons(state.course).find((lesson) => lesson.id === state.selectedLessonId) || null;
}

function getLessonIndex(lessonId) {
  return flattenLessons(state.course).findIndex((lesson) => lesson.id === lessonId);
}

function getAdjacentLessons(lessonId) {
  const lessons = flattenLessons(state.course);
  const index = getLessonIndex(lessonId);
  return {
    previous: index > 0 ? lessons[index - 1] : null,
    next: index >= 0 && index < lessons.length - 1 ? lessons[index + 1] : null,
  };
}

function getLessonSubmission(lessonId) {
  return state.submissions.find((submission) => submission.lesson_id === lessonId) || null;
}

function setSelectedLesson(lessonId = "") {
  state.selectedLessonId = lessonId;
  updateUrl(lessonId);
  renderHero();
  renderModules();
  renderProgram();
  renderLesson();
}

function renderHero() {
  if (!state.course) {
    return;
  }

  if (courseTitleNode) {
    courseTitleNode.textContent = state.course.title;
  }

  if (courseSubtitleNode) {
    const presentation = state.course.presentation || {};
    courseSubtitleNode.textContent = presentation.promise || state.course.subtitle || state.course.description || "";
  }

  if (courseMetaNode) {
    const stats = state.course.stats || {};
    courseMetaNode.innerHTML = [
      {
        label: "Niveau",
        value: state.course.level || "Programme",
      },
      {
        label: "Structure",
        value: `${state.course.modules?.length || 0} modules • ${stats.total_lessons || 0} leçons`,
      },
      {
        label: "Durée",
        value: formatDuration(stats.total_duration_minutes || 0),
      },
      {
        label: "Reste à parcourir",
        value: formatDuration(stats.remaining_duration_minutes || 0),
      },
    ]
      .map(
        (item) => `
          <article class="learn-course-stat-card">
            <span class="meta-label">${escapeHtml(item.label)}</span>
            <strong>${escapeHtml(item.value)}</strong>
          </article>
        `
      )
      .join("");
  }

  if (courseProgressLabelNode) {
    courseProgressLabelNode.textContent = `${Math.round(Number(state.course.stats?.progress_percent || 0))}%`;
  }

  if (courseProgressBarNode) {
    courseProgressBarNode.style.width = `${Math.round(Number(state.course.stats?.progress_percent || 0))}%`;
  }

  if (courseSummaryNode) {
    const nextLesson = state.course.next_lesson;
    const presentation = state.course.presentation || {};
    courseSummaryNode.innerHTML = nextLesson
      ? `
          <p class="subhead">${presentation.executive_summary || presentation.outcome || state.course.description || ""}</p>
          <div class="learn-focus-meta">
            <span>${nextLesson.module_title || "Module"}</span>
            <span>${nextLesson.title}</span>
            <span>${formatDuration(nextLesson.duration_minutes || 0)}</span>
          </div>
          <p class="learn-course-meta">
            ${formatDuration(state.course.stats?.remaining_duration_minutes || 0)} de contenu restant avant la fin du programme.
          </p>
        `
      : `<p class="subhead">${presentation.executive_summary || presentation.outcome || state.course.description || ""}</p>`;
  }

  if (startButton) {
    const nextLesson = state.course.next_lesson;
    startButton.textContent = state.selectedLessonId
      ? "Reprendre la leçon active"
      : nextLesson
        ? "Démarrer par la bonne leçon"
        : "Ouvrir le programme";
  }
}

function renderModules() {
  if (!modulesWrap || !state.course) {
    return;
  }

  modulesWrap.innerHTML = (state.course.modules || [])
    .map((module, moduleIndex) => {
      const moduleProgress = module.stats?.total_lessons
        ? Math.round((Number(module.stats?.completed_lessons || 0) / Number(module.stats.total_lessons || 1)) * 100)
        : 0;

      const lessonItems = (module.lessons || [])
        .map((lesson, lessonIndex) => {
          const status = lesson.progress?.status || "not_started";
          const statusLabel =
            status === "completed" ? "Terminé" : status === "in_progress" ? "En cours" : "À faire";
          const isActive = state.selectedLessonId === lesson.id ? "is-active" : "";

          return `
            <button type="button" class="learn-lesson-link ${isActive}" data-lesson-id="${lesson.id}">
              <span class="learn-lesson-link-main">
                <span class="learn-lesson-index">${moduleIndex + 1}.${lessonIndex + 1}</span>
                <span class="learn-lesson-link-title">${escapeHtml(lesson.title)}</span>
              </span>
              <span class="learn-lesson-link-meta">
                <small>${statusLabel}</small>
                <small>${formatDuration(lesson.duration_minutes || 0)}</small>
              </span>
            </button>
          `;
        })
        .join("");

      return `
        <article class="learn-module-card">
          <header>
            <div class="learn-module-card-head">
              <span class="meta-label">Module ${moduleIndex + 1}</span>
              <span class="meta-label">${moduleProgress}%</span>
            </div>
            <h3>${escapeHtml(module.title)}</h3>
            <p>${escapeHtml(module.description || "")}</p>
          </header>
          <div class="learn-module-lessons">${lessonItems}</div>
        </article>
      `;
    })
    .join("");

  modulesWrap.querySelectorAll("[data-lesson-id]").forEach((button) => {
    button.addEventListener("click", () => {
      setSelectedLesson(button.dataset.lessonId || "");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

function renderProgram() {
  if (!state.course) {
    return;
  }

  const presentation = state.course.presentation || {};

  if (programTitleNode) {
    programTitleNode.textContent = presentation.promise || state.course.subtitle || state.course.title;
  }

  if (programStatusNode) {
    programStatusNode.textContent =
      Number(state.course.stats?.progress_percent || 0) >= 100 ? "Parcours terminé" : "Programme en cours";
  }

  if (programDescriptionNode) {
    programDescriptionNode.textContent =
      presentation.executive_summary || state.course.description || "";
  }

  if (programHighlightsNode) {
    const highlights = presentation.highlights || [];
    programHighlightsNode.innerHTML = highlights.length
      ? highlights
          .map(
            (item) => `
              <article class="learn-highlight-card">
                <span class="meta-label">À retenir</span>
                <p>${escapeHtml(item)}</p>
              </article>
            `
          )
          .join("")
      : "";
  }

  if (programOutcomeNode) {
    programOutcomeNode.textContent = presentation.outcome || "Aucune synthèse n'est encore disponible.";
  }

  if (programNextStepNode) {
    const nextLesson = state.course.next_lesson;
    programNextStepNode.textContent = nextLesson
      ? `${nextLesson.module_title} • ${nextLesson.title} • ${formatDuration(nextLesson.duration_minutes || 0)}`
      : "Le programme est terminé. Vous pouvez revoir les leçons ou consolider vos devoirs.";
  }

  if (programAudienceNode) {
    programAudienceNode.textContent = presentation.audience || "Audience non précisée.";
  }

  if (programCadenceNode) {
    programCadenceNode.textContent = presentation.cadence || "Cadence non précisée.";
  }

  if (programMethodNode) {
    programMethodNode.textContent = presentation.method || state.course.description || "";
  }

  if (programDeliverableNode) {
    programDeliverableNode.textContent = presentation.deliverable || presentation.outcome || "";
  }

  if (programSupportsNode) {
    const resources = state.course.resources || [];
    programSupportsNode.innerHTML = resources.length
      ? resources
          .map((resource) => {
            return `
              <article class="learn-support-card">
                <div>
                  <span class="meta-label">Support intégré</span>
                  <h4>${escapeHtml(resource.title)}</h4>
                  <p>${escapeHtml(resource.description || "")}</p>
                </div>
              </article>
            `;
          })
          .join("")
      : `<p class="subhead">Les supports du programme sont intégrés directement dans les leçons, les synthèses et les devoirs.</p>`;
  }
}

function renderLesson() {
  const lesson = getSelectedLesson();

  if (!lesson) {
    if (lessonShellNode) {
      lessonShellNode.hidden = true;
    }
    if (assignmentPromptNode) {
      assignmentPromptNode.textContent =
        "Sélectionnez une leçon pour afficher son objectif, sa lecture stratégique, sa synthèse et son exercice.";
    }
    if (assignmentStatusNode) {
      assignmentStatusNode.textContent = "En attente";
    }
    if (assignmentLessonField) {
      assignmentLessonField.value = "";
    }
    if (assignmentSubmitButton) {
      assignmentSubmitButton.disabled = true;
    }
    if (markCompleteButton) {
      markCompleteButton.disabled = true;
      markCompleteButton.textContent = "Marquer comme terminée";
    }
    if (prevLessonButton) {
      prevLessonButton.disabled = true;
    }
    if (nextLessonButton) {
      nextLessonButton.disabled = true;
    }
    return;
  }

  const submission = getLessonSubmission(lesson.id);
  const progressStatus = lesson.progress?.status || "not_started";
  const progressLabel =
    progressStatus === "completed"
      ? "Terminée"
      : progressStatus === "in_progress"
        ? "Leçon en cours"
        : "Leçon à démarrer";
  const adjacentLessons = getAdjacentLessons(lesson.id);

  if (lessonShellNode) {
    lessonShellNode.hidden = false;
  }

  if (lessonMetaNode) {
    lessonMetaNode.textContent = `${lesson.module_title || "Module"} • ${progressLabel} • ${formatDuration(
      lesson.duration_minutes || 0
    )}`;
  }

  if (lessonStatusNode) {
    lessonStatusNode.textContent = progressLabel;
  }

  if (lessonTitleNode) {
    lessonTitleNode.textContent = lesson.title;
  }

  if (lessonVideoPlaceholderNode) {
    if (lesson.video_url) {
      lessonVideoPlaceholderNode.hidden = false;
      lessonVideoPlaceholderNode.innerHTML = lesson.video_url.includes("youtube.com") || lesson.video_url.includes("vimeo.com")
        ? `<iframe src="${lesson.video_url}" allowfullscreen style="border:0; width:100%; aspect-ratio:16/9; border-radius:18px;"></iframe>`
        : `<video src="${lesson.video_url}" controls controlsList="nodownload" style="width:100%; border-radius:18px;"></video>`;
    } else {
      lessonVideoPlaceholderNode.hidden = true;
      lessonVideoPlaceholderNode.innerHTML = "";
    }
  }

  if (lessonContentNode) {
    lessonContentNode.innerHTML = markdownToHtml(lesson.content_markdown || "");
  }

  if (assignmentPromptNode) {
    assignmentPromptNode.textContent =
      lesson.assignment_prompt || "Aucun exercice obligatoire sur cette leçon.";
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

  if (assignmentSubmitButton) {
    assignmentSubmitButton.disabled = false;
  }

  if (markCompleteButton) {
    markCompleteButton.disabled = false;
    markCompleteButton.textContent =
      progressStatus === "completed" ? "Leçon déjà terminée" : "Marquer comme terminée";
  }

  if (prevLessonButton) {
    prevLessonButton.disabled = !adjacentLessons.previous;
    prevLessonButton.dataset.lessonId = adjacentLessons.previous?.id || "";
  }

  if (nextLessonButton) {
    nextLessonButton.disabled = !adjacentLessons.next;
    nextLessonButton.dataset.lessonId = adjacentLessons.next?.id || "";
  }
}

function renderSubmissions() {
  if (!submissionsWrap) {
    return;
  }

  if (!state.submissions.length) {
    submissionsWrap.innerHTML = `<p class="subhead">Aucune remise envoyée pour le moment.</p>`;
    return;
  }

  submissionsWrap.innerHTML = state.submissions
    .map((submission) => {
      const attachmentLinks = (submission.attachments || [])
        .map(
          (attachment) => `
            <a href="/api/student/submissions/attachments/${attachment.id}" class="inline-link">
              ${escapeHtml(attachment.original_name)}
            </a>
          `
        )
        .join("");

      return `
        <article class="learn-submission-card">
          <div>
            <strong>${escapeHtml(submission.lesson_title)}</strong>
            <p>${escapeHtml(submission.text_response)}</p>
            <span class="meta-label">${escapeHtml(submission.status)}</span>
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

async function loadCourse() {
  setFeedback("");
  const { courseSlug, lessonId } = getParams();
  const payload = await requestApi(`/api/student/courses/${encodeURIComponent(courseSlug)}`);
  state.course = payload.course;
  state.submissions = payload.submissions || [];

  const flatLessons = flattenLessons(state.course);
  const hasRequestedLesson = flatLessons.some((lesson) => lesson.id === lessonId);
  state.selectedLessonId = hasRequestedLesson ? lessonId : "";

  renderHero();
  renderModules();
  renderProgram();
  renderLesson();
  renderSubmissions();
}

async function submitAssignment(form) {
  const lesson = getSelectedLesson();

  if (!lesson) {
    throw new Error("Sélectionnez d'abord une leçon.");
  }

  const formData = new FormData(form);
  const response = await fetch("/api/student/submissions", {
    method: "POST",
    credentials: "same-origin",
    body: formData,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || "Impossible d'envoyer votre devoir.");
  }

  state.submissions = [payload.submission, ...state.submissions];
  renderLesson();
  renderSubmissions();
  form.reset();
  if (assignmentLessonField) {
    assignmentLessonField.value = lesson.id;
  }
  setFeedback(payload.message || "Votre devoir a bien été envoyé.", "success");
}

async function markCurrentLessonComplete() {
  const lesson = getSelectedLesson();

  if (!lesson) {
    throw new Error("Sélectionnez d'abord une leçon.");
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
      last_position_seconds: 0,
    }),
  });

  state.course = {
    ...payload.course,
    presentation: state.course.presentation || payload.course.presentation || null,
  };
  renderHero();
  renderModules();
  renderProgram();
  renderLesson();
  setFeedback("La progression a bien été mise à jour.", "success");
}

if (assignmentForm) {
  assignmentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    submitAssignment(assignmentForm).catch((error) => {
      setFeedback(error.message || "Impossible d'envoyer votre devoir.", "error");
    });
  });
}

if (markCompleteButton) {
  markCompleteButton.addEventListener("click", () => {
    markCurrentLessonComplete().catch((error) => {
      setFeedback(error.message || "Impossible de mettre à jour la progression.", "error");
    });
  });
}

if (prevLessonButton) {
  prevLessonButton.addEventListener("click", () => {
    if (prevLessonButton.dataset.lessonId) {
      setSelectedLesson(prevLessonButton.dataset.lessonId);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
}

if (nextLessonButton) {
  nextLessonButton.addEventListener("click", () => {
    if (nextLessonButton.dataset.lessonId) {
      setSelectedLesson(nextLessonButton.dataset.lessonId);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
}

if (startButton) {
  startButton.addEventListener("click", () => {
    const targetLessonId = state.selectedLessonId || state.course?.next_lesson?.id || flattenLessons(state.course)[0]?.id || "";
    if (!targetLessonId) {
      return;
    }
    setSelectedLesson(targetLessonId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

overviewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setSelectedLesson("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

if (backButton) {
  backButton.addEventListener("click", () => {
    window.location.href = "/learn/dashboard";
  });
}

loadCourse().catch((error) => {
  setFeedback(error.message || "Impossible de charger ce programme.", "error");
});
