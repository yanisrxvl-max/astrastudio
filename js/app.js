const body = document.body;
const siteHeader = document.querySelector(".site-header");
const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const headerNavWrap = document.querySelector(".header-nav-wrap");
const mobileNavBreakpoint = 1080;
const scrollHeaderThresholdPx = 100;

const handleHeaderState = () => {
  if (!siteHeader) {
    return;
  }

  siteHeader.classList.toggle("scrolled", window.scrollY > scrollHeaderThresholdPx);
};

handleHeaderState();
window.addEventListener("scroll", handleHeaderState, { passive: true });

if (navToggle && headerNavWrap) {
  const closeNav = () => {
    navToggle.setAttribute("aria-expanded", "false");
    headerNavWrap.classList.remove("is-open");
    body.classList.remove("nav-open");
  };

  navToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const isExpanded = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!isExpanded));
    headerNavWrap.classList.toggle("is-open", !isExpanded);
    body.classList.toggle("nav-open", !isExpanded);
  });

  headerNavWrap.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeNav);
  });

  document.addEventListener("click", (e) => {
    if (!body.classList.contains("nav-open")) {
      return;
    }
    const headerEnd = document.querySelector(".header-end");
    if (headerEnd?.contains(e.target)) {
      return;
    }
    closeNav();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > mobileNavBreakpoint) {
      closeNav();
    }
  });
}

const currentPage = body.dataset.page;
if (currentPage) {
  document.querySelectorAll("[data-page-link]").forEach((link) => {
    const isCurrent = link.dataset.pageLink === currentPage;
    link.classList.toggle("is-active", isCurrent);

    if (isCurrent) {
      link.setAttribute("aria-current", "page");
    }
  });
}

function isInsideOtherReveal(element) {
  let parent = element.parentElement;
  while (parent) {
    if (parent.classList && parent.classList.contains("reveal") && parent !== element) {
      const isSectionShell =
        parent.tagName === "SECTION" &&
        (parent.classList.contains("section") ||
          parent.classList.contains("page-hero") ||
          parent.classList.contains("hero"));
      if (isSectionShell) {
        parent = parent.parentElement;
        continue;
      }
      return true;
    }
    parent = parent.parentElement;
  }
  return false;
}

function initAutoRevealSections() {
  const allowed = new Set(["home", "services", "formations", "work", "contact"]);
  if (!body.dataset.page || !allowed.has(body.dataset.page)) {
    return;
  }

  document.querySelectorAll("main section.section").forEach((el) => {
    if (!el.classList.contains("reveal")) {
      el.classList.add("reveal");
    }
  });
}

function initAutoRevealButtons() {
  const root = document.querySelector("main");
  if (!root) {
    return;
  }

  root.querySelectorAll("a.button, button.button").forEach((el) => {
    if (el.classList.contains("reveal") || isInsideOtherReveal(el)) {
      return;
    }
    el.classList.add("reveal");
  });
}

function initRevealGridStagger() {
  const parents = document.querySelectorAll(
    [
      ".grid-2",
      ".grid-3",
      ".grid-4",
      ".home-proof-metrics",
      ".home-focus-grid",
      ".periods-grid",
      ".periods-grid-x",
      ".video-performance-grid",
      ".pledge-grid",
      ".work-library-grid",
      ".featured-case-grid",
      ".services-list",
      ".portfolio-grid",
      ".case-reading-grid",
      ".case-evidence-grid",
      ".case-phase-grid",
      ".case-axis-grid",
      ".work-overview-grid",
    ].join(",")
  );

  parents.forEach((grid) => {
    grid.querySelectorAll(":scope > .reveal").forEach((el, index) => {
      const delay = el.style.getPropertyValue("--reveal-delay");
      if (delay && delay.trim() !== "") {
        return;
      }
      el.style.setProperty("--reveal-delay", `${Math.min(index * 0.07, 0.49)}s`);
    });
  });
}

function initAutoRevealContainers() {
  const root = document.querySelector("main");
  if (!root) {
    return;
  }

  const containerSelector = [
    "article.panel",
    "article.service-detail",
    "article.partnership-callout",
    "article.metric-card",
    "article.service-preview-card",
    "article.insight-card",
    "article.offer-card",
    "article.stat-card",
    "article.faq-card",
    "article.equipment-card",
    "article.process-card",
    "article.formation-card",
    "article.formation-sheet",
    "article.case-column-card",
    "article.case-product-card",
    "article.signal-card",
    "article.featured-case-hero",
    "article.mastery-card",
    "article.platform-card",
    "article.results-case-card",
    "article.video-card",
    "article.period-card",
    "article.top-content-item",
    "a.work-library-card",
    "figure.case-gallery-card",
    "article.leaderboard-panel",
    "main .cta-banner.panel",
    "main .partnership-shell",
    "main .services-band-note",
  ].join(",");

  root.querySelectorAll(containerSelector).forEach((el) => {
    if (el.classList.contains("reveal") || isInsideOtherReveal(el)) {
      return;
    }
    el.classList.add("reveal");
  });
}

function initAutoRevealTypography() {
  const root = document.querySelector("main");
  if (!root) {
    return;
  }

  root.querySelectorAll("h1, h2, h3").forEach((el) => {
    if (el.classList.contains("reveal") || isInsideOtherReveal(el)) {
      return;
    }
    if (el.closest(".hero-matrix")) {
      return;
    }
    el.classList.add("reveal");
  });

  root.querySelectorAll("p").forEach((el) => {
    if (el.classList.contains("reveal") || isInsideOtherReveal(el)) {
      return;
    }
    if (el.closest(".hero-matrix")) {
      return;
    }
    el.classList.add("reveal");
  });

  root.querySelectorAll(".card, .btn").forEach((el) => {
    if (el.classList.contains("reveal") || isInsideOtherReveal(el)) {
      return;
    }
    if (el.closest(".hero-matrix")) {
      return;
    }
    el.classList.add("reveal");
  });
}

function initRevealObserver() {
  if (!window.IntersectionObserver) {
    document.querySelectorAll(".reveal").forEach((el) => {
      el.classList.add("active");
    });
    return;
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.querySelectorAll(".reveal").forEach((el) => {
      el.classList.add("active");
    });
    return;
  }

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("active");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    }
  );

  document.querySelectorAll(".reveal").forEach((element) => {
    revealObserver.observe(element);
  });

  window.__astraRevealObserverLoaded = true;
}

initAutoRevealSections();
initAutoRevealContainers();
initAutoRevealTypography();
initAutoRevealButtons();
initRevealGridStagger();
initRevealObserver();

document.querySelectorAll("[data-current-year]").forEach((node) => {
  node.textContent = String(new Date().getFullYear());
});

const backgroundVideos = document.querySelectorAll("[data-bg-video]");

if (backgroundVideos.length) {
  backgroundVideos.forEach((video) => {
    const wrapper = video.closest("[data-bg-video-wrap]");

    const setVideoReady = () => {
      if (!wrapper) {
        return;
      }

      wrapper.classList.add("is-video-ready");
    };

    if (video.readyState >= 2) {
      setVideoReady();
    } else {
      video.addEventListener("loadeddata", setVideoReady, { once: true });
      video.addEventListener("canplay", setVideoReady, { once: true });
    }

    video.addEventListener("error", () => {
      if (!wrapper) {
        return;
      }

      wrapper.classList.remove("is-video-ready");
    });

    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  });
}

const contactForm = document.querySelector("[data-contact-form]");
const formFeedback = document.querySelector("[data-form-feedback]");

if (contactForm) {
  const submitButton = contactForm.querySelector('button[type="submit"]');
  const sourceField = contactForm.querySelector("[data-contact-source]");
  const formShell = contactForm.closest(".contact-form-shell");
  const formFields = Array.from(contactForm.querySelectorAll("input, select, textarea"));
  const projectTypeField = contactForm.querySelector("#project-type");
  const primaryObjectiveFieldset = contactForm.querySelector("[data-primary-objective-fieldset]");
  const defaultSubmitLabel = submitButton ? submitButton.textContent : "";
  const isLocalTest =
    window.location.protocol === "file:" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "localhost";
  const contactEndpoint =
    window.location.protocol === "file:"
      ? "http://127.0.0.1:3000/api/leads"
      : contactForm.action || "/api/leads";

  const setFeedback = (message, type = "") => {
    if (!formFeedback) {
      return;
    }

    formFeedback.textContent = message;
    formFeedback.classList.remove("is-error", "is-success");

    if (type) {
      formFeedback.classList.add(`is-${type}`);
    }

    if (message) {
      formFeedback.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  const clearFieldErrors = () => {
    formFields.forEach((field) => {
      field.classList.remove("is-invalid");
      field.removeAttribute("aria-invalid");
      field.setCustomValidity("");
    });

    if (primaryObjectiveFieldset) {
      primaryObjectiveFieldset.classList.remove("is-invalid");
    }
  };

  const setSourceValue = () => {
    if (!sourceField) {
      return;
    }

    const currentLocation = `${window.location.pathname}${window.location.search}`.replace(
      /^\/+/,
      ""
    );

    sourceField.value = `Site Astra Studio • ${currentLocation || "contact.html"}`;
  };

  const applyIntentPreset = () => {
    const params = new URLSearchParams(window.location.search);
    const intent = params.get("intent");
    const offer = params.get("offer");

    if (projectTypeField && !projectTypeField.value) {
      const offerProjectMap = {
        spark: "Contenu social media (IA + curation humaine)",
        systems: "Automatisation business (workflows, agents IA)",
        signature: "Direction créative complète (SIGNATURE)",
        scale: "Partenariat stratégique (SCALE)",
      };

      const intentProjectMap = {
        systems: "Automatisation business (workflows, agents IA)",
        "systemes-ia": "Automatisation business (workflows, agents IA)",
      };

      const mappedProject =
        (offer && offerProjectMap[offer]) || (intent && intentProjectMap[intent]) || null;

      if (mappedProject) {
        const option = Array.from(projectTypeField.options).find(
          (entry) => entry.textContent.trim() === mappedProject
        );

        if (option) {
          projectTypeField.value = option.value || option.textContent.trim();
        }
      } else if (intent && !offer) {
        const legacyIntentMap = {
          "production-mobile": "Direction artistique & shooting",
          agence: "Autre (à préciser)",
          formation: "Autre (à préciser)",
          "audit-premium": "Audit / Diagnostic",
          audit: "Audit / Diagnostic",
          "image-influence": "Direction artistique & shooting",
        };

        const legacy = legacyIntentMap[intent];

        if (legacy) {
          const option = Array.from(projectTypeField.options).find(
            (entry) => entry.textContent.trim() === legacy
          );

          if (option) {
            projectTypeField.value = option.value || option.textContent.trim();
          }
        }
      }
    }

    if (offer) {
      const match = contactForm.querySelector(
        `input[name="primary_objective"][data-offer="${offer}"]`
      );

      if (match) {
        match.checked = true;
      }
    }
  };

  const setSubmittingState = (isSubmitting) => {
    contactForm.classList.toggle("is-submitting", isSubmitting);

    if (formShell) {
      formShell.classList.toggle("is-submitting", isSubmitting);
    }

    if (!submitButton) {
      return;
    }

    submitButton.disabled = isSubmitting;
    submitButton.textContent = isSubmitting ? "Envoi en cours..." : defaultSubmitLabel;

    if (isSubmitting) {
      submitButton.setAttribute("aria-busy", "true");
    } else {
      submitButton.removeAttribute("aria-busy");
    }
  };

  setSourceValue();
  applyIntentPreset();

  formFields.forEach((field) => {
    const clearCurrentField = () => {
      field.classList.remove("is-invalid");
      field.removeAttribute("aria-invalid");
      field.setCustomValidity("");
    };

    field.addEventListener("input", clearCurrentField);
    field.addEventListener("change", clearCurrentField);
  });

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    clearFieldErrors();
    setFeedback("");

    if (!contactForm.reportValidity()) {
      return;
    }

    const formData = new FormData(contactForm);
    const honeypot = formData.get("company_website");

    if (honeypot) {
      return;
    }

    const payload = Object.fromEntries(formData.entries());

    if (sourceField && !payload.source) {
      payload.source = sourceField.value;
    }

    setSubmittingState(true);

    let timeoutId;

    try {
      const controller = new AbortController();
      timeoutId = window.setTimeout(() => controller.abort(), 12000);

      const response = await fetch(contactEndpoint, {
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
        if (result.field_errors) {
          const fieldErrors = Object.entries(result.field_errors);

          fieldErrors.forEach(([fieldName, message]) => {
            if (fieldName === "primary_objective" && primaryObjectiveFieldset) {
              primaryObjectiveFieldset.classList.add("is-invalid");
              const firstRadio = contactForm.querySelector('input[name="primary_objective"]');

              if (firstRadio && typeof firstRadio.setCustomValidity === "function") {
                firstRadio.setCustomValidity(message);
              }

              return;
            }

            const field = contactForm.elements.namedItem(fieldName);

            if (!field || typeof field.setCustomValidity !== "function") {
              return;
            }

            field.classList.add("is-invalid");
            field.setAttribute("aria-invalid", "true");
            field.setCustomValidity(message);
          });

          const firstInvalidFieldName = fieldErrors[0]?.[0];
          const firstInvalidField = firstInvalidFieldName
            ? contactForm.elements.namedItem(firstInvalidFieldName)
            : null;

          if (firstInvalidField && typeof firstInvalidField.reportValidity === "function") {
            firstInvalidField.reportValidity();
          }
        }

        throw new Error(
          result.message ||
            "Une erreur est survenue lors de l'envoi. Merci de réessayer dans un instant."
        );
      }

      contactForm.reset();
      clearFieldErrors();
      setSourceValue();
      setFeedback(
        result.message ||
          "Votre demande a bien été reçue. Astra Studio revient vers vous sous 48 h ouvrées.",
        "success"
      );
    } catch (error) {
      let errorMessage =
        "Une erreur est survenue lors de l'envoi. Merci de réessayer dans un instant.";

      if (error?.name === "AbortError") {
        errorMessage = isLocalTest
          ? "Le serveur de contact met trop de temps à répondre. Vérifiez qu'il est bien lancé avec npm start, puis rechargez la page."
          : "Le serveur de contact met trop de temps à répondre. Merci de réessayer dans un instant.";
      } else if (error instanceof TypeError) {
        errorMessage = isLocalTest
          ? "Le serveur de contact n'est pas joignable. Lancez npm start, puis ouvrez le site via http://127.0.0.1:3000/contact.html."
          : "Le serveur de contact n'est pas disponible pour le moment. Merci de réessayer un peu plus tard.";
      } else if (error?.message) {
        errorMessage = error.message;
      }

      setFeedback(
        errorMessage,
        "error"
      );
    } finally {
      window.clearTimeout(timeoutId);
      setSubmittingState(false);
    }
  });
}

function initAstraCursor() {
  if (!window.matchMedia("(pointer: fine)").matches) {
    return;
  }
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }
  if (body.classList.contains("admin-body") || body.classList.contains("learn-body")) {
    return;
  }
  if (document.querySelector(".astra-cursor")) {
    return;
  }

  const dot = document.createElement("div");
  dot.className = "astra-cursor";
  dot.setAttribute("aria-hidden", "true");
  document.body.appendChild(dot);
  body.classList.add("astra-cursor-active");

  const interactiveSelector = [
    'a[href]',
    "button",
    'input:not([type="hidden"])',
    "textarea",
    "select",
    "summary",
    '[role="button"]',
    ".button",
    ".nav-toggle",
    "label[for]",
  ].join(",");

  let mx = 0;
  let my = 0;
  let ticking = false;

  function place() {
    dot.style.left = `${mx}px`;
    dot.style.top = `${my}px`;
    ticking = false;
  }

  document.addEventListener(
    "pointermove",
    (e) => {
      mx = e.clientX;
      my = e.clientY;
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(place);
      }
      const t = e.target;
      if (t && typeof t.closest === "function" && t.closest(interactiveSelector)) {
        dot.classList.add("is-hover");
      } else {
        dot.classList.remove("is-hover");
      }
    },
    { passive: true }
  );
}

function initTiltCards() {
  const cards = document.querySelectorAll("[data-tilt-card]");

  if (!cards.length) {
    return;
  }

  const prefersReducedMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasFinePointer = window.matchMedia && window.matchMedia("(pointer: fine)").matches;

  if (prefersReducedMotion || !hasFinePointer) {
    cards.forEach((card) => {
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
    });
    return;
  }

  cards.forEach((card) => {
    let frame = null;
    let lastX = 0;
    let lastY = 0;

    const applyTilt = () => {
      const rect = card.getBoundingClientRect();
      const relativeX = (lastX - rect.left) / rect.width;
      const relativeY = (lastY - rect.top) / rect.height;
      const clampedX = Math.min(1, Math.max(0, relativeX));
      const clampedY = Math.min(1, Math.max(0, relativeY));
      const rotateY = (clampedX - 0.5) * 7;
      const rotateX = (0.5 - clampedY) * 7;

      card.style.setProperty("--tilt-x", `${rotateX.toFixed(2)}deg`);
      card.style.setProperty("--tilt-y", `${rotateY.toFixed(2)}deg`);
      frame = null;
    };

    card.addEventListener("pointermove", (event) => {
      lastX = event.clientX;
      lastY = event.clientY;

      if (frame !== null) {
        return;
      }

      frame = requestAnimationFrame(applyTilt);
    });

    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
    });
  });
}

initAstraCursor();
initTiltCards();

function initHomeResultsCounters() {
  const root = document.querySelector("[data-home-results]");

  if (!root) {
    return;
  }

  const counters = root.querySelectorAll("[data-count]");

  if (!counters.length) {
    return;
  }

  const formatCount = (mode, value) => {
    if (mode === "int") {
      return String(Math.round(value));
    }

    if (mode === "decimal-m") {
      return `${value.toFixed(1).replace(".", ",")}M`;
    }

    if (mode === "decimal-m-plus") {
      return `${value.toFixed(1).replace(".", ",")}M+`;
    }

    return String(value);
  };

  const setFinalValues = () => {
    counters.forEach((counter) => {
      const mode = counter.getAttribute("data-count-mode");
      const end = Number.parseFloat(counter.getAttribute("data-count-end") || "0");
      counter.textContent = formatCount(mode, end);
    });
  };

  if (!window.IntersectionObserver) {
    setFinalValues();
    return;
  }

  const prefersReducedMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const easeCubicBezier = (value) => {
    const x1 = 0.5;
    const y1 = 0;
    const x2 = 0;
    const y2 = 1;
    let low = 0;
    let high = 1;

    for (let index = 0; index < 16; index += 1) {
      const mid = (low + high) / 2;
      const x =
        3 * (1 - mid) ** 2 * mid * x1 +
        3 * (1 - mid) * mid ** 2 * x2 +
        mid ** 3;

      if (x < value) {
        low = mid;
      } else {
        high = mid;
      }
    }

    const t = (low + high) / 2;
    return 3 * (1 - t) ** 2 * t * y1 + 3 * (1 - t) * t ** 2 * y2 + t ** 3;
  };

  const durationMs = 2000;
  let started = false;

  const run = () => {
    if (started) {
      return;
    }

    started = true;

    if (prefersReducedMotion) {
      setFinalValues();
      return;
    }

    const startTime = performance.now();

    const frame = (now) => {
      const linear = Math.min(1, (now - startTime) / durationMs);
      const eased = easeCubicBezier(linear);

      counters.forEach((counter) => {
        const mode = counter.getAttribute("data-count-mode");
        const end = Number.parseFloat(counter.getAttribute("data-count-end") || "0");
        counter.textContent = formatCount(mode, end * eased);
      });

      if (linear < 1) {
        requestAnimationFrame(frame);
      } else {
        setFinalValues();
      }
    };

    requestAnimationFrame(frame);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        run();
        observer.disconnect();
      });
    },
    {
      root: null,
      rootMargin: "0px 0px -8% 0px",
      threshold: 0.15,
    }
  );

  observer.observe(root);
}

initHomeResultsCounters();

function initHomeProofBoard() {
  const root = document.querySelector("[data-proof-board]");

  if (!root) {
    return;
  }

  const counters = root.querySelectorAll("[data-proof-count]");
  const rates = root.querySelectorAll("[data-proof-rate]");

  const prefersReducedMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const easeOut = (value) => 1 - (1 - value) ** 3;

  const formatProofCount = (mode, value) => {
    if (mode === "int") {
      return String(Math.round(value));
    }

    if (mode === "decimal-m") {
      return `${value.toFixed(1).replace(".", ",")}M`;
    }

    if (mode === "decimal-m-plus") {
      return `${value.toFixed(1).replace(".", ",")}M+`;
    }

    if (mode === "range-k") {
      const rounded = Math.round(value);
      return `10K→${rounded}K`;
    }

    return String(value);
  };

  const setFinalValues = () => {
    counters.forEach((counter) => {
      const mode = counter.getAttribute("data-proof-mode");
      const end = Number.parseFloat(counter.getAttribute("data-proof-end") || "0");

      if (mode === "range-k") {
        counter.textContent = formatProofCount(mode, end);
        return;
      }

      counter.textContent = formatProofCount(mode, end);
    });

    rates.forEach((rate) => {
      const target = Number.parseFloat(rate.getAttribute("data-proof-rate") || "0");
      const valueNode = rate.querySelector("[data-proof-rate-value]");
      const decimals = Number.isInteger(target) ? 0 : 1;

      if (valueNode) {
        valueNode.textContent = `${target.toFixed(decimals).replace(".", ",")}%`;
      }

      rate.style.setProperty("--proof-rate-progress", String(target));
    });

    root.classList.add("is-animated");
  };

  const run = () => {
    if (prefersReducedMotion) {
      setFinalValues();
      return;
    }

    const durationMs = 1900;
    const startTime = performance.now();

    const frame = (now) => {
      const linear = Math.min(1, (now - startTime) / durationMs);
      const eased = easeOut(linear);

      counters.forEach((counter) => {
        const mode = counter.getAttribute("data-proof-mode");
        const end = Number.parseFloat(counter.getAttribute("data-proof-end") || "0");

        if (mode === "range-k") {
          const animated = 10 + (end - 10) * eased;
          counter.textContent = formatProofCount(mode, animated);
          return;
        }

        counter.textContent = formatProofCount(mode, end * eased);
      });

      rates.forEach((rate) => {
        const target = Number.parseFloat(rate.getAttribute("data-proof-rate") || "0");
        const current = target * eased;
        const valueNode = rate.querySelector("[data-proof-rate-value]");
        const decimals = Number.isInteger(target) ? 0 : 1;

        rate.style.setProperty("--proof-rate-progress", String(current));

        if (valueNode) {
          valueNode.textContent = `${current.toFixed(decimals).replace(".", ",")}%`;
        }
      });

      if (linear < 1) {
        requestAnimationFrame(frame);
      } else {
        setFinalValues();
      }
    };

    root.classList.add("is-animated");
    requestAnimationFrame(frame);
  };

  if (!window.IntersectionObserver) {
    setFinalValues();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        observer.disconnect();
        run();
      });
    },
    {
      root: null,
      rootMargin: "0px 0px -10% 0px",
      threshold: 0.2,
    }
  );

  observer.observe(root);
}

initHomeProofBoard();
