const diagnosticApp = document.querySelector("[data-diagnostic-app]");

if (diagnosticApp) {
  const stageElement = diagnosticApp.querySelector("[data-diagnostic-stage]");
  const backButton = diagnosticApp.querySelector("[data-diagnostic-back]");
  const progressFill = diagnosticApp.querySelector("[data-progress-fill]");
  const progressLabel = diagnosticApp.querySelector("[data-progress-label]");
  const progressValue = diagnosticApp.querySelector("[data-progress-value]");
  const isLocalTest =
    window.location.protocol === "file:" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "localhost";
  const diagnosticEndpoint =
    window.location.protocol === "file:"
      ? "http://127.0.0.1:3000/api/diagnostic/analyze"
      : "/api/diagnostic/analyze";

  const questions = [
    {
      id: "profile_type",
      title: "Votre profil aujourd'hui",
      description: "On calibre le pré-diagnostic sur votre réalité opérationnelle.",
      options: [
        { value: "creator", label: "Créateur solo" },
        { value: "freelance", label: "Freelance / consultant" },
        { value: "brand", label: "Marque e-commerce" },
        { value: "pme", label: "PME / structure installée" },
        { value: "founder", label: "Fondateur en personal branding" },
      ],
    },
    {
      id: "primary_goal",
      title: "Votre priorité sur les 90 prochains jours",
      description: "Le bon plan dépend d'abord de votre enjeu principal.",
      options: [
        { value: "credibility", label: "Rendre ma présence plus crédible" },
        { value: "demand", label: "Générer plus de demandes qualifiées" },
        { value: "consistency", label: "Publier avec plus de régularité" },
        { value: "visibility", label: "Accélérer ma visibilité" },
      ],
    },
    {
      id: "positioning_clarity",
      title: "Votre positionnement est-il vraiment clair ?",
      description: "Si c'est flou pour vous, c'est flou pour le marché.",
      options: [
        { value: "very_clear", label: "Très clair" },
        { value: "fairly_clear", label: "Assez clair" },
        { value: "unstable", label: "Instable selon les contenus" },
        { value: "blurred", label: "Flou" },
      ],
    },
    {
      id: "value_readability",
      title: "En 5 secondes, on comprend ce que vous apportez ?",
      description: "La lisibilité immédiate influence directement la conversion.",
      options: [
        { value: "yes_clear", label: "Oui, nettement" },
        { value: "partly", label: "Partiellement" },
        { value: "rarely", label: "Rarement" },
        { value: "no", label: "Pas vraiment" },
      ],
    },
    {
      id: "content_rhythm",
      title: "Votre rythme de contenu actuel",
      description: "La régularité crée de la traction si elle reste soutenable.",
      options: [
        { value: "4_plus", label: "4 contenus ou plus par semaine" },
        { value: "2_3", label: "2 à 3 contenus par semaine" },
        { value: "1_week", label: "Environ 1 contenu par semaine" },
        { value: "irregular", label: "Très irrégulier" },
      ],
    },
    {
      id: "main_platform",
      title: "Votre canal principal aujourd'hui",
      description: "On part de votre terrain réel, pas d'un modèle théorique.",
      options: [
        { value: "tiktok", label: "TikTok" },
        { value: "instagram", label: "Instagram" },
        { value: "youtube", label: "YouTube" },
        { value: "x_linkedin", label: "X / LinkedIn" },
        { value: "multi", label: "Multi-plateformes" },
      ],
    },
    {
      id: "performance_health",
      title: "Vos performances actuelles ressemblent à quoi ?",
      description: "On regarde la qualité d'attention, pas seulement les vues.",
      options: [
        { value: "stable_growth", label: "Croissance stable et lisible" },
        { value: "irregular_spikes", label: "Des pics, mais peu de répétabilité" },
        { value: "low_reach", label: "Portée globalement faible" },
        { value: "reach_no_conversion", label: "Bonne portée, conversion faible" },
      ],
    },
    {
      id: "main_blocker",
      title: "Votre frein principal",
      description: "Le diagnostic doit pointer un blocage prioritaire, pas un symptôme.",
      options: [
        { value: "no_system", label: "Je n'ai pas de système clair" },
        { value: "no_angle", label: "Mes contenus manquent d'angle" },
        { value: "no_time", label: "Je manque de temps" },
        { value: "camera_discomfort", label: "Je ne suis pas à l'aise face caméra" },
        { value: "no_conversion", label: "Je n'arrive pas à convertir" },
      ],
    },
    {
      id: "brand_consistency",
      title: "Votre image et votre ligne éditoriale sont cohérentes ?",
      description: "Image, message et offre doivent raconter la même marque.",
      options: [
        { value: "very_consistent", label: "Très cohérentes" },
        { value: "mostly_consistent", label: "Plutôt cohérentes" },
        { value: "uneven", label: "Inégales" },
        { value: "dispersed", label: "Dispersées" },
      ],
    },
    {
      id: "offer_clarity",
      title: "Votre offre est-elle monétisable clairement ?",
      description: "Sans offre lisible, la traction plafonne rapidement.",
      options: [
        { value: "clear_and_selling", label: "Oui, claire et déjà vendue" },
        { value: "clear_low_sales", label: "Claire, mais peu vendue" },
        { value: "blurred_offer", label: "Encore floue" },
        { value: "no_offer", label: "Pas encore d'offre structurée" },
      ],
    },
    {
      id: "weekly_time",
      title: "Temps disponible par semaine",
      description: "Le bon plan est celui que vous pouvez tenir dans la durée.",
      options: [
        { value: "10_plus", label: "10 h et plus" },
        { value: "6_10", label: "6 à 10 h" },
        { value: "3_5", label: "3 à 5 h" },
        { value: "lt3", label: "Moins de 3 h" },
      ],
    },
    {
      id: "ambition_level",
      title: "Niveau d'ambition à 6 mois",
      description: "On ajuste la trajectoire à la hauteur de votre ambition réelle.",
      options: [
        { value: "stabilize", label: "Stabiliser une présence propre" },
        { value: "upgrade", label: "Monter en gamme" },
        { value: "accelerate", label: "Accélérer fortement" },
        { value: "scale", label: "Changer de dimension" },
      ],
    },
    {
      id: "support_mode",
      title: "Quel type d'accompagnement vous conviendrait le mieux ?",
      description: "Cette réponse oriente la suite la plus utile.",
      options: [
        { value: "autonomy", label: "Un cadre autonome (formation / méthode)" },
        { value: "audit", label: "Un audit stratégique approfondi" },
        { value: "done_for_you", label: "Une exécution done-for-you (agence)" },
        { value: "hybrid", label: "Un mode hybride (audit + déploiement)" },
      ],
    },
    {
      id: "budget_range",
      title: "Budget envisagé pour structurer votre présence",
      description: "Une fourchette suffit pour calibrer la recommandation.",
      options: [
        { value: "lt2k", label: "Moins de 2 000 €" },
        { value: "2_5k", label: "2 000 à 5 000 €" },
        { value: "5_10k", label: "5 000 à 10 000 €" },
        { value: "gt10k", label: "10 000 € et plus" },
        { value: "to_define", label: "À définir ensemble" },
      ],
    },
    {
      id: "timeline",
      title: "Timing souhaité",
      description: "On priorise différemment selon votre horizon.",
      options: [
        { value: "asap", label: "Urgent / dès que possible" },
        { value: "2_4_weeks", label: "Dans les 2 à 4 semaines" },
        { value: "1_3_months", label: "Dans 1 à 3 mois" },
        { value: "later", label: "Projet à planifier plus tard" },
        { value: "discuss", label: "À discuter ensemble" },
      ],
    },
  ];

  const loadingCopies = [
    "Lecture du positionnement et des signaux de perception.",
    "Analyse des frictions entre image, contenu et conversion.",
    "Priorisation des leviers à plus fort impact business.",
    "Rédaction de votre pré-diagnostic assisté par IA.",
  ];

  const loadingPhases = [
    "Positionnement",
    "Attention & diffusion",
    "Recommandation",
  ];

  const secondaryCtaByProfile = {
    formation: {
      label: "Voir les formations",
      href: "formations.html",
    },
    agence: {
      label: "Voir les réalisations",
      href: "work.html",
    },
    audit_premium: {
      label: "Voir les réalisations",
      href: "work.html",
    },
  };

  const catalogByProfile = {
    formation: {
      title: "Formations recommandées",
      items: [
        { name: "Croissance", desc: "Algorithmes et distribution organique.", href: "formations.html#fondations" },
        { name: "Ingénierie", desc: "Hooks, rétention et psychologie virale.", href: "formations.html#impact" },
        { name: "Marque Premium", desc: "Autorité de marché et luxe digital.", href: "formations.html#elevation" },
      ],
    },
    agence: {
      title: "Services adaptés à votre profil",
      items: [
        { name: "Construire", desc: "Poser un cadre visuel et éditorial.", href: "services.html" },
        { name: "Produire", desc: "Scripts, tournage et post-production.", href: "services.html" },
        { name: "Déployer", desc: "Diffusion, ads et assets marketing.", href: "services.html" },
      ],
    },
    audit_premium: {
      title: "Prochaines étapes recommandées",
      items: [
        { name: "Audit stratégique", desc: "Lecture complète de votre positionnement.", href: "contact.html?intent=audit" },
        { name: "Réalisations", desc: "Voir comment le studio lit une marque.", href: "work.html" },
        { name: "Contact direct", desc: "Échanger sur votre cas précis.", href: "contact.html" },
      ],
    },
  };

  const steps = [{ type: "intro" }];

  questions.forEach((question, index) => {
    if (index === 9) {
      steps.push({ type: "transition" });
    }

    steps.push({
      type: "question",
      questionIndex: index,
      questionId: question.id,
    });
  });

  const loadingStepIndex = steps.push({ type: "loading" }) - 1;
  const resultStepIndex = steps.push({ type: "result" }) - 1;
  let lastQuestionStepIndex = 0;
  const funnelStepIndices = [];

  steps.forEach((step, index) => {
    if (step.type === "question") {
      lastQuestionStepIndex = index;
    }

    if (!["loading", "result"].includes(step.type)) {
      funnelStepIndices.push(index);
    }
  });

  const state = {
    stepIndex: 0,
    answers: {},
    isAnalyzing: false,
    analysis: null,
    analysisError: "",
    loadingMessageIndex: 0,
    loadingTicker: null,
  };

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function getQuestionById(questionId) {
    return questions.find((question) => question.id === questionId) || null;
  }

  function getQuestionChoice(questionId, choiceValue) {
    const question = getQuestionById(questionId);

    if (!question) {
      return null;
    }

    return question.options.find((option) => option.value === choiceValue) || null;
  }

  function getProgress(stepIndex) {
    const step = steps[stepIndex];

    if (step.type === "result") {
      return {
        label: "Pré-diagnostic prêt",
        percentage: 100,
      };
    }

    if (step.type === "loading") {
      return {
        label: "Analyse assistée par IA",
        percentage: 96,
      };
    }

    const funnelPosition = funnelStepIndices.indexOf(stepIndex);
    const denominator = Math.max(funnelStepIndices.length - 1, 1);
    const percentage = Math.round((funnelPosition / denominator) * 90);

    if (step.type === "intro") {
      return {
        label: "Préparation",
        percentage: 0,
      };
    }

    if (step.type === "transition") {
      return {
        label: "Profil initialisé",
        percentage,
      };
    }

    const questionPosition = step.questionIndex + 1;
    return {
      label: `Question ${questionPosition}/${questions.length}`,
      percentage,
    };
  }

  function renderProgress() {
    const progress = getProgress(state.stepIndex);

    if (progressFill) {
      progressFill.style.width = `${progress.percentage}%`;
    }

    if (progressLabel) {
      progressLabel.textContent = progress.label;
    }

    if (progressValue) {
      progressValue.textContent = `${progress.percentage}%`;
    }
  }

  function renderIntro() {
    stageElement.innerHTML = `
      <div class="diagnostic-screen diagnostic-screen-intro">
        <span class="kicker">Diagnostic offert • Astra Studio</span>
        <h1 class="display-title">Astra Signal</h1>
        <p class="subhead">
          Un pré-diagnostic assisté par IA pour clarifier votre positionnement, vos blocages et la suite la plus utile.
        </p>
        <div class="diagnostic-intro-grid">
          <article class="surface-note">
            <span class="meta-label">Durée</span>
            <p>4 à 6 minutes, une question à la fois.</p>
          </article>
          <article class="surface-note">
            <span class="meta-label">Résultat immédiat</span>
            <p>Profil, forces, blocages et priorité stratégique.</p>
          </article>
          <article class="surface-note">
            <span class="meta-label">Suite</span>
            <p>Orientation claire vers la meilleure prochaine étape.</p>
          </article>
        </div>
        <div class="button-row">
          <button class="button button-primary" type="button" data-action="start">Lancer mon diagnostic</button>
          <a class="button button-secondary" href="work.html">Voir les réalisations</a>
        </div>
      </div>
    `;
  }

  function renderTransition() {
    stageElement.innerHTML = `
      <div class="diagnostic-screen diagnostic-screen-transition">
        <span class="kicker">Profil initialisé</span>
        <h2 class="section-title">On affine maintenant votre lecture stratégique.</h2>
        <p class="subhead">
          Vos bases sont captées. Les prochaines réponses servent à identifier le meilleur levier business.
        </p>
        <div class="button-row">
          <button class="button button-primary" type="button" data-action="continue">Continuer</button>
        </div>
      </div>
    `;
  }

  function renderQuestion(questionIndex) {
    const question = questions[questionIndex];
    const selected = state.answers[question.id];

    stageElement.innerHTML = `
      <div class="diagnostic-screen diagnostic-screen-question">
        <span class="kicker">Astra Signal</span>
        <h2 class="section-title">${escapeHtml(question.title)}</h2>
        <p class="subhead">${escapeHtml(question.description)}</p>
        <div class="diagnostic-choice-grid" role="radiogroup" aria-label="${escapeHtml(question.title)}">
          ${question.options
        .map(
          (option) => `
                <button
                  class="diagnostic-choice${selected === option.value ? " is-selected" : ""}"
                  type="button"
                  role="radio"
                  aria-checked="${selected === option.value ? "true" : "false"}"
                  data-action="pick"
                  data-question-id="${escapeHtml(question.id)}"
                  data-choice-value="${escapeHtml(option.value)}"
                >
                  <span>${escapeHtml(option.label)}</span>
                </button>
              `
        )
        .join("")}
        </div>
      </div>
    `;
  }

  function renderLoading() {
    if (state.analysisError) {
      stageElement.innerHTML = `
        <div class="diagnostic-screen diagnostic-screen-loading">
          <span class="kicker">Analyse indisponible</span>
          <h2 class="section-title">Le pré-diagnostic n'a pas pu être finalisé.</h2>
          <p class="subhead">${escapeHtml(state.analysisError)}</p>
          <article class="diagnostic-error-card panel">
            <p>
              Vous pouvez relancer l'analyse immédiatement, ou revenir à la dernière question pour ajuster vos réponses.
            </p>
            <div class="button-row">
              <button class="button button-primary" type="button" data-action="retry-analysis">Relancer l'analyse</button>
              <button class="button button-secondary" type="button" data-action="edit-last-answer">Modifier mes réponses</button>
              <a class="button button-ghost" href="contact.html">Parler directement du projet</a>
            </div>
          </article>
        </div>
      `;
      return;
    }

    const activePhase = state.loadingMessageIndex % loadingPhases.length;
    const copy = loadingCopies[state.loadingMessageIndex % loadingCopies.length];

    stageElement.innerHTML = `
      <div class="diagnostic-screen diagnostic-screen-loading">
        <span class="kicker">Analyse assistée par IA</span>
        <h2 class="section-title">Construction de votre pré-diagnostic...</h2>
        <p class="subhead" data-loading-copy>${escapeHtml(copy)}</p>
        <div class="diagnostic-loader" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div class="diagnostic-loading-stack" data-loading-phases>
          ${loadingPhases
        .map(
          (phase, index) => `
                <span class="diagnostic-loading-phase${index <= activePhase ? " is-active" : ""}">
                  ${escapeHtml(phase)}
                </span>
              `
        )
        .join("")}
        </div>
        <p class="diagnostic-transparency-note">
          Analyse assistée par IA. Ce résultat est une lecture stratégique initiale, sans promesse automatique.
        </p>
      </div>
    `;
  }

  function normalizeAnalysis(raw = {}) {
    const rawType = String(raw.recommended_path || raw.profile_type || "").toLowerCase();
    const recommendedPath = ["formation", "agence", "audit_premium"].includes(rawType)
      ? rawType
      : "audit_premium";
    const fallbackSecondary = secondaryCtaByProfile[recommendedPath];

    const safeList = (input, fallbackValues) => {
      if (!Array.isArray(input)) {
        return fallbackValues;
      }

      const cleaned = input
        .map((value) => String(value || "").trim())
        .filter(Boolean)
        .slice(0, 3);

      if (cleaned.length === 3) {
        return cleaned;
      }

      return fallbackValues;
    };

    return {
      profile_name: String(raw.profile_name || "Trajectoire à clarifier").trim(),
      recommended_path: recommendedPath,
      profile_summary: String(raw.profile_summary || raw.strategic_summary || "").trim(),
      strengths: safeList(raw.strengths, [
        "Présence digitale déjà active.",
        "Volonté de structuration réelle.",
        "Potentiel de différenciation visible.",
      ]),
      blockers: safeList(raw.blockers, [
        "Positionnement encore diffus.",
        "Rythme de production instable.",
        "Conversion insuffisamment pilotée.",
      ]),
      priority: String(raw.priority || "").trim(),
      cta_title: String(raw.cta_title || raw.cta?.label || "Activer la suite recommandée").trim(),
      cta_text: String(raw.cta_text || raw.recommendation || "").trim(),
      cta: {
        label: String(raw.cta?.label || raw.cta_title || "Activer la suite recommandée").trim(),
        href: String(raw.cta?.href || "contact.html").trim(),
        secondary_href: String(raw.cta?.secondary_href || fallbackSecondary.href).trim(),
      },
      transparency_note: String(
        raw.transparency_note ||
        "Pré-diagnostic assisté par IA. La recommandation finale est confirmée après revue stratégique Astra Studio."
      ).trim(),
    };
  }

  function renderResult() {
    const analysis = state.analysis ? normalizeAnalysis(state.analysis) : null;

    if (!analysis) {
      stageElement.innerHTML = `
        <div class="diagnostic-screen diagnostic-screen-result">
          <span class="kicker">Résultat indisponible</span>
          <h2 class="section-title">Le pré-diagnostic n'a pas pu être affiché.</h2>
          <div class="button-row">
            <button class="button button-primary" type="button" data-action="restart">Relancer le diagnostic</button>
          </div>
        </div>
      `;
      return;
    }

    const profileLabelByType = {
      formation: "Profil orienté formation",
      agence: "Profil orienté agence",
      audit_premium: "Profil orienté audit premium",
    };

    const secondaryCta = secondaryCtaByProfile[analysis.recommended_path] || {
      label: "Parler du projet",
      href: "contact.html",
    };

    const catalog = catalogByProfile[analysis.recommended_path] || catalogByProfile.audit_premium;
    const catalogHtml = catalog
      ? `
        <article class="diagnostic-catalog panel">
          <span class="meta-label">${escapeHtml(catalog.title)}</span>
          <div class="diagnostic-catalog-grid">
            ${catalog.items
        .map(
          (item) => `
                  <a class="diagnostic-catalog-item" href="${escapeHtml(item.href)}">
                    <strong>${escapeHtml(item.name)}</strong>
                    <span>${escapeHtml(item.desc)}</span>
                  </a>
                `
        )
        .join("")}
          </div>
        </article>
      `
      : "";

    stageElement.innerHTML = `
      <div class="diagnostic-screen diagnostic-screen-result">
        <span class="kicker">Pré-diagnostic Astra Signal</span>
        <h2 class="section-title">${escapeHtml(analysis.profile_name)}</h2>
        <p class="subhead">${escapeHtml(analysis.profile_summary)}</p>

        <article class="diagnostic-profile-chip panel">
          <span class="meta-label">Orientation détectée</span>
          <p>${escapeHtml(profileLabelByType[analysis.recommended_path] || "Profil stratégique")}</p>
        </article>

        <div class="diagnostic-result-columns">
          <article class="surface-note">
            <span class="meta-label">3 forces</span>
            <ul class="diagnostic-result-list">
              ${analysis.strengths.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
            </ul>
          </article>
          <article class="surface-note">
            <span class="meta-label">3 blocages</span>
            <ul class="diagnostic-result-list">
              ${analysis.blockers.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
            </ul>
          </article>
          <article class="surface-note">
            <span class="meta-label">Priorité immédiate</span>
            <p>${escapeHtml(
      analysis.priority ||
      "Clarifier le positionnement et installer un système éditorial stable sur 90 jours."
    )}</p>
          </article>
        </div>

        ${catalogHtml}

        <article class="diagnostic-next-step panel">
          <span class="meta-label">Recommandation</span>
          <h3>${escapeHtml(
      analysis.cta_text ||
      "Activer une stratégie de contenu plus lisible, plus régulière et mieux orientée conversion."
    )}</h3>
          <p>${escapeHtml(analysis.transparency_note)}</p>
          <div class="button-row">
            <a class="button button-primary" href="${escapeHtml(analysis.cta.href)}">${escapeHtml(
      analysis.cta_title || analysis.cta.label
    )}</a>
            <a class="button button-secondary" href="${escapeHtml(analysis.cta.secondary_href || secondaryCta.href)}">${escapeHtml(
      secondaryCta.label
    )}</a>
            <button class="button button-ghost" type="button" data-action="restart">Refaire le diagnostic</button>
          </div>
        </article>
      </div>
    `;
  }

  function stopLoadingTicker() {
    if (state.loadingTicker) {
      window.clearInterval(state.loadingTicker);
      state.loadingTicker = null;
    }
  }

  function startLoadingTicker() {
    stopLoadingTicker();

    state.loadingTicker = window.setInterval(() => {
      state.loadingMessageIndex = (state.loadingMessageIndex + 1) % loadingCopies.length;

      const copyElement = stageElement.querySelector("[data-loading-copy]");
      if (copyElement) {
        copyElement.textContent = loadingCopies[state.loadingMessageIndex];
      }

      const phases = stageElement.querySelectorAll(".diagnostic-loading-phase");
      if (phases.length) {
        const activePhase = state.loadingMessageIndex % loadingPhases.length;
        phases.forEach((phase, index) => {
          phase.classList.toggle("is-active", index <= activePhase);
        });
      }
    }, 1180);
  }

  function renderStep() {
    const step = steps[state.stepIndex];

    if (backButton) {
      const canGoBack =
        state.stepIndex > 0 &&
        !state.isAnalyzing &&
        step.type !== "loading" &&
        step.type !== "result";
      backButton.disabled = !canGoBack;
      backButton.classList.toggle("is-hidden", !canGoBack);
    }

    renderProgress();

    if (step.type === "intro") {
      stopLoadingTicker();
      renderIntro();
      return;
    }

    if (step.type === "transition") {
      stopLoadingTicker();
      renderTransition();
      return;
    }

    if (step.type === "question") {
      stopLoadingTicker();
      renderQuestion(step.questionIndex);
      return;
    }

    if (step.type === "loading") {
      renderLoading();
      return;
    }

    stopLoadingTicker();
    renderResult();
  }

  function goNext() {
    state.stepIndex = Math.min(state.stepIndex + 1, steps.length - 1);
    renderStep();
  }

  function goBack() {
    state.stepIndex = Math.max(state.stepIndex - 1, 0);
    renderStep();
  }

  function restartFlow() {
    stopLoadingTicker();
    state.stepIndex = 0;
    state.answers = {};
    state.isAnalyzing = false;
    state.analysis = null;
    state.analysisError = "";
    state.loadingMessageIndex = 0;
    renderStep();
  }

  function buildDiagnosticPayload() {
    const source = `Astra Signal • ${`${window.location.pathname}${window.location.search}`.replace(/^\/+/u, "") ||
      "diagnostic.html"
      }`;

    const responses = questions
      .map((question) => {
        const answerValue = state.answers[question.id];
        const answerChoice = getQuestionChoice(question.id, answerValue);

        if (!answerChoice) {
          return null;
        }

        return {
          question_id: question.id,
          question_label: question.title,
          answer_value: answerChoice.value,
          answer_label: answerChoice.label,
        };
      })
      .filter(Boolean);

    return {
      source,
      responses,
    };
  }

  async function runAiAnalysis() {
    if (state.isAnalyzing) {
      return;
    }

    state.isAnalyzing = true;
    state.analysisError = "";
    state.analysis = null;
    state.loadingMessageIndex = 0;
    renderStep();
    startLoadingTicker();

    const payload = buildDiagnosticPayload();

    let timeoutId;

    try {
      const controller = new AbortController();
      timeoutId = window.setTimeout(() => controller.abort(), 25000);

      const response = await fetch(diagnosticEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      window.clearTimeout(timeoutId);

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.message ||
          "Le service d'analyse est indisponible pour le moment. Merci de réessayer."
        );
      }

      if (!result.data || typeof result.data !== "object") {
        throw new Error(
          "Le pré-diagnostic n'a pas pu être généré correctement. Merci de relancer l'analyse."
        );
      }

      state.analysis = normalizeAnalysis(result.data);
      state.stepIndex = resultStepIndex;
      renderStep();
    } catch (error) {
      let errorMessage =
        "Le pré-diagnostic n'a pas pu être finalisé. Merci de réessayer dans un instant.";

      if (error?.name === "AbortError") {
        errorMessage = isLocalTest
          ? "Le serveur répond trop lentement. Vérifiez qu'il est bien lancé avec npm start."
          : "L'analyse prend trop de temps. Merci de réessayer.";
      } else if (error instanceof TypeError) {
        errorMessage = isLocalTest
          ? "Le serveur n'est pas joignable. Lancez npm start puis rechargez la page."
          : "Le service d'analyse est momentanément indisponible.";
      } else if (error?.message) {
        errorMessage = error.message;
      }

      state.analysisError = errorMessage;
      renderStep();
    } finally {
      window.clearTimeout(timeoutId);
      state.isAnalyzing = false;
      if (state.stepIndex !== loadingStepIndex) {
        stopLoadingTicker();
      }
    }
  }

  stageElement.addEventListener("click", (event) => {
    const actionTarget = event.target.closest("[data-action]");

    if (!actionTarget) {
      return;
    }

    const action = actionTarget.dataset.action;

    if (action === "start" || action === "continue") {
      goNext();
      return;
    }

    if (action === "restart") {
      restartFlow();
      return;
    }

    if (action === "retry-analysis") {
      void runAiAnalysis();
      return;
    }

    if (action === "edit-last-answer") {
      stopLoadingTicker();
      state.analysisError = "";
      state.stepIndex = lastQuestionStepIndex;
      renderStep();
      return;
    }

    if (action === "pick") {
      const questionId = actionTarget.dataset.questionId;
      const choiceValue = actionTarget.dataset.choiceValue;

      if (!questionId || !choiceValue) {
        return;
      }

      state.answers[questionId] = choiceValue;
      actionTarget.classList.add("is-selected");

      const currentStep = steps[state.stepIndex];
      const isLastQuestion =
        currentStep.type === "question" && currentStep.questionIndex === questions.length - 1;

      window.setTimeout(() => {
        if (isLastQuestion) {
          state.stepIndex = loadingStepIndex;
          renderStep();
          void runAiAnalysis();
          return;
        }

        goNext();
      }, 150);
    }
  });

  if (backButton) {
    backButton.addEventListener("click", () => {
      goBack();
    });
  }

  renderStep();
}
