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
  const allowed = new Set(["home", "services", "formations", "work", "contact", "about", "portfolio", "casting"]);
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
    if (el.closest(".home-hero")) {
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
    if (el.closest(".hero-matrix") || el.closest(".home-hero")) {
      return;
    }
    el.classList.add("reveal");
  });

  root.querySelectorAll("p").forEach((el) => {
    if (el.classList.contains("reveal") || isInsideOtherReveal(el)) {
      return;
    }
    if (el.closest(".hero-matrix") || el.closest(".home-hero")) {
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

/** Fond galaxie (CSS) sur les pages secondaires — pas de video, leger et premium */
function initSecondaryPagesGalaxyBackground() {
  if (!body || body.dataset.page === "home") {
    return;
  }

  if (body.classList.contains("admin-body") || body.classList.contains("learn-body")) {
    return;
  }

  if (document.querySelector(".site-galaxy-bg")) {
    return;
  }

  const root = document.createElement("div");
  root.className = "site-galaxy-bg";
  root.setAttribute("aria-hidden", "true");
  root.innerHTML = [
    '<div class="site-galaxy-bg__deep"></div>',
    '<div class="site-galaxy-bg__nebula site-galaxy-bg__nebula--a"></div>',
    '<div class="site-galaxy-bg__nebula site-galaxy-bg__nebula--b"></div>',
    '<div class="site-galaxy-bg__halo"></div>',
    '<div class="site-galaxy-bg__dust"></div>',
    '<div class="site-galaxy-bg__vignette"></div>',
  ].join("");

  body.prepend(root);
  body.classList.add("has-page-galaxy");

  requestAnimationFrame(() => {
    root.classList.add("is-ready");
  });
}

initSecondaryPagesGalaxyBackground();

/** Hero home : micro-parallaxe sur le calque vidéo (scroll, très subtil) */
function initHomeHeroParallax() {
  const root = document.querySelector("[data-home-hero]");
  const mediaInner = document.querySelector("[data-home-hero-media]");
  if (!root || !mediaInner) {
    return;
  }
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  let ticking = false;
  const update = () => {
    ticking = false;
    const rect = root.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    const visible = rect.bottom > 0 && rect.top < vh;
    if (!visible) {
      return;
    }
    const t = Math.max(0, Math.min(1, (vh - rect.top) / (rect.height + vh * 0.35)));
    const y = (t - 0.5) * 18;
    const sc = 1 + t * 0.012;
    mediaInner.style.setProperty("--hero-parallax-y", `${y}px`);
    mediaInner.style.setProperty("--hero-parallax-scale", String(sc));
  };

  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };

  update();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
}

initHomeHeroParallax();

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

/* -------------------------------------------------- */
/*  Logo premium tilt — cursor-tracking parallax      */
/* -------------------------------------------------- */

(function initLogoTilt() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (window.matchMedia("(pointer: coarse)").matches) return;

  const MAX_DEG = 6;
  const brands = document.querySelectorAll(".brand");
  let raf = 0;

  brands.forEach((brand) => {
    const logo = brand.querySelector(".brand-logo-3d");
    if (!logo) return;

    let targetRx = 0;
    let targetRy = 0;
    let currentRx = 0;
    let currentRy = 0;
    let hovering = false;

    function lerp(a, b, t) {
      return a + (b - a) * t;
    }

    function tick() {
      if (!hovering && Math.abs(currentRx) < 0.01 && Math.abs(currentRy) < 0.01) {
        currentRx = 0;
        currentRy = 0;
        logo.style.setProperty("--logo-rx", "0deg");
        logo.style.setProperty("--logo-ry", "0deg");
        return;
      }

      const ease = hovering ? 0.10 : 0.08;
      currentRx = lerp(currentRx, targetRx, ease);
      currentRy = lerp(currentRy, targetRy, ease);

      logo.style.setProperty("--logo-rx", currentRx.toFixed(2) + "deg");
      logo.style.setProperty("--logo-ry", currentRy.toFixed(2) + "deg");

      raf = requestAnimationFrame(tick);
    }

    brand.addEventListener("mouseenter", () => {
      hovering = true;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    });

    brand.addEventListener("mousemove", (e) => {
      const rect = brand.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const px = (e.clientX - cx) / (rect.width / 2);
      const py = (e.clientY - cy) / (rect.height / 2);

      targetRy = px * MAX_DEG;
      targetRx = -py * MAX_DEG;
    });

    brand.addEventListener("mouseleave", () => {
      hovering = false;
      targetRx = 0;
      targetRy = 0;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    });
  });
})();

/* -------------------------------------------------- */
/*  PWA Service Worker Registration                   */
/* -------------------------------------------------- */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

/* -------------------------------------------------- */
/*  CINEMATIC INTRO & LANGUAGE SELECT                 */
/* -------------------------------------------------- */
(function initCinematicIntro() {
  const introOverlay = document.getElementById("astra-intro");
  if (!introOverlay) return;

  // À chaque chargement, on bloque le scroll et affiche l'intro
  document.body.classList.add("has-intro-locked");

  const viewer = introOverlay.querySelector("model-viewer");

  function enterExperience(langChoice = 'fr') {
    // Animer la sortie de l'Overlay (le site derrière est déjà prêt)
    introOverlay.classList.add("is-fading-out");
    
    // Attendre la fin de la transition pour retirer le verrou et détruire l'overlay
    setTimeout(() => {
      document.body.classList.remove("has-intro-locked");
      if (introOverlay.parentNode) introOverlay.parentNode.removeChild(introOverlay);
    }, 1200); // 1.2s match la duration CSS fadeIn
  }

  const langBtns = introOverlay.querySelectorAll(".astra-intro__btn");
  langBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      enterExperience(btn.getAttribute("data-lang") || 'fr');
    });
  });

  // Rendre le logo 3D interactif au clic
  if (viewer) {
    viewer.addEventListener("click", () => enterExperience('fr'));
    
    // Touch handler on mobile to ensure tap works even if click is absorbed
    let touchMoved = false;
    viewer.addEventListener("touchstart", () => { touchMoved = false; }, { passive: true });
    viewer.addEventListener("touchmove", () => { touchMoved = true; }, { passive: true });
    viewer.addEventListener("touchend", (e) => {
      if (!touchMoved) {
        enterExperience('fr');
      }
    });
  }

})();
