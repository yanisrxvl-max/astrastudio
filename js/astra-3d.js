/* ═══════════════════════════════════════════════════════
   ASTRA 3D — Premium immersive experience engine
   Pure vanilla JS, zero dependencies, performance-first
   ═══════════════════════════════════════════════════════ */

(function () {
  "use strict";

  const prefersReducedMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasFinePointer =
    window.matchMedia && window.matchMedia("(pointer: fine)").matches;
  const isMobile = window.innerWidth <= 980;

  if (prefersReducedMotion) return;

  /* ─── UTILITIES ─── */

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function clamp(val, min, max) {
    return Math.min(max, Math.max(min, val));
  }

  /* ─── 1. HERO STAGGER ENTRANCE ─── */

  function initHeroStagger() {
    const items = document.querySelectorAll("[data-hero-stagger]");
    if (!items.length) return;

    requestAnimationFrame(() => {
      setTimeout(() => {
        items.forEach((el) => el.classList.add("is-visible"));
      }, 200);
    });
  }

  /* ─── 2. HERO ORB — Lightweight canvas ambient light ─── */

  function initHeroOrb() {
    if (isMobile) return;

    const heroSection = document.querySelector(".hero-section");
    if (!heroSection) return;

    const canvas = document.createElement("canvas");
    canvas.className = "hero-orb-canvas";
    canvas.setAttribute("aria-hidden", "true");

    const container = heroSection.querySelector(".video-background-container");
    if (!container) return;
    container.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    let w, h;
    let mouseX = 0.5;
    let mouseY = 0.5;
    let currentX = 0.5;
    let currentY = 0.5;
    let animId = null;
    let time = 0;
    let isVisible = false;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio, 2);
      const rect = heroSection.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function drawOrb(x, y, radius, color) {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, "transparent");
      ctx.fillStyle = gradient;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }

    function render() {
      time += 0.003;

      currentX = lerp(currentX, mouseX, 0.02);
      currentY = lerp(currentY, mouseY, 0.02);

      ctx.clearRect(0, 0, w, h);

      const cx = currentX * w;
      const cy = currentY * h;
      const drift = Math.sin(time) * 30;

      drawOrb(
        cx + drift,
        cy + Math.cos(time * 0.7) * 20,
        w * 0.35,
        "rgba(212, 175, 55, 0.04)"
      );

      drawOrb(
        w - cx + drift * 0.5,
        h - cy + Math.sin(time * 0.5) * 15,
        w * 0.28,
        "rgba(142, 168, 194, 0.03)"
      );

      drawOrb(
        w * 0.5 + Math.sin(time * 0.4) * 40,
        h * 0.3 + Math.cos(time * 0.6) * 25,
        w * 0.2,
        "rgba(212, 175, 55, 0.025)"
      );

      animId = requestAnimationFrame(render);
    }

    function onMouseMove(e) {
      const rect = heroSection.getBoundingClientRect();
      mouseX = (e.clientX - rect.left) / rect.width;
      mouseY = (e.clientY - rect.top) / rect.height;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            isVisible = true;
            resize();
            render();
            canvas.classList.add("is-ready");
            document.addEventListener("mousemove", onMouseMove, { passive: true });
          } else if (!entry.isIntersecting && isVisible) {
            isVisible = false;
            cancelAnimationFrame(animId);
            canvas.classList.remove("is-ready");
            document.removeEventListener("mousemove", onMouseMove);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(heroSection);

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 200);
    }, { passive: true });
  }

  /* ─── 3. DEPTH CARDS — 3D tilt + shine ─── */

  function initDepthCards() {
    if (!hasFinePointer || isMobile) return;

    const cards = document.querySelectorAll("[data-depth-card]");
    if (!cards.length) return;

    const MAX_TILT = 6;

    cards.forEach((card) => {
      let shine = card.querySelector(".card-shine");
      if (!shine) {
        shine = document.createElement("div");
        shine.className = "card-shine";
        card.prepend(shine);
      }

      let raf = null;
      let targetRx = 0;
      let targetRy = 0;
      let currentRx = 0;
      let currentRy = 0;
      let hovering = false;

      function tick() {
        const ease = hovering ? 0.08 : 0.06;
        currentRx = lerp(currentRx, targetRx, ease);
        currentRy = lerp(currentRy, targetRy, ease);

        if (!hovering && Math.abs(currentRx) < 0.05 && Math.abs(currentRy) < 0.05) {
          currentRx = 0;
          currentRy = 0;
          card.style.setProperty("--rx", "0deg");
          card.style.setProperty("--ry", "0deg");
          card.style.boxShadow = "";
          return;
        }

        card.style.setProperty("--rx", currentRx.toFixed(2) + "deg");
        card.style.setProperty("--ry", currentRy.toFixed(2) + "deg");

        if (hovering) {
          const sx = (-currentRy * 2).toFixed(1);
          const sy = (currentRx * 2).toFixed(1);
          card.style.boxShadow =
            `0 20px 60px rgba(0,0,0,0.35), 0 0 0 1px rgba(212,175,55,0.08), ${sx}px ${sy}px 30px rgba(0,0,0,0.18)`;
        }

        raf = requestAnimationFrame(tick);
      }

      card.addEventListener("pointerenter", () => {
        hovering = true;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(tick);
      });

      card.addEventListener("pointermove", (e) => {
        const rect = card.getBoundingClientRect();
        const relX = (e.clientX - rect.left) / rect.width;
        const relY = (e.clientY - rect.top) / rect.height;
        const cx = clamp(relX, 0, 1);
        const cy = clamp(relY, 0, 1);

        targetRy = (cx - 0.5) * MAX_TILT;
        targetRx = (0.5 - cy) * MAX_TILT;

        card.style.setProperty("--mouse-x", (cx * 100).toFixed(0) + "%");
        card.style.setProperty("--mouse-y", (cy * 100).toFixed(0) + "%");
      });

      card.addEventListener("pointerleave", () => {
        hovering = false;
        targetRx = 0;
        targetRy = 0;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(tick);
      });
    });
  }

  /* ─── 4. DEPTH BUTTONS — Magnetic pull ─── */

  function initMagnetic() {
    if (!hasFinePointer || isMobile) return;

    const elements = document.querySelectorAll("[data-magnetic]");
    if (!elements.length) return;

    const STRENGTH = 0.3;

    elements.forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) * STRENGTH;
        const dy = (e.clientY - cy) * STRENGTH;
        el.style.transform =
          `perspective(600px) translateX(${dx.toFixed(1)}px) translateY(${dy.toFixed(1)}px) translateZ(4px)`;
      });

      el.addEventListener("pointerleave", () => {
        el.style.transform = "";
      });
    });
  }

  /* ─── 5. SCROLL PARALLAX — Lightweight depth layers ─── */

  function initParallax() {
    if (isMobile) return;

    const elements = document.querySelectorAll("[data-parallax]");
    if (!elements.length) return;

    let ticking = false;

    function update() {
      const scrollY = window.scrollY;
      const viewH = window.innerHeight;

      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const speed = parseFloat(el.dataset.parallax) || 0.05;

        if (rect.bottom < -100 || rect.top > viewH + 100) return;

        const center = rect.top + rect.height / 2;
        const offset = (center - viewH / 2) * speed;
        el.style.transform = `translateY(${offset.toFixed(1)}px)`;
      });

      ticking = false;
    }

    window.addEventListener("scroll", () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });

    update();
  }

  /* ─── 6. SCROLL PROGRESS INDICATOR ─── */

  function initScrollProgress() {
    const bar = document.createElement("div");
    bar.setAttribute("aria-hidden", "true");
    Object.assign(bar.style, {
      position: "fixed",
      top: "0",
      left: "0",
      height: "2px",
      width: "0%",
      background: "linear-gradient(90deg, rgba(212,175,55,0.6), rgba(212,175,55,0.9))",
      zIndex: "10000",
      pointerEvents: "none",
      transition: "width 0.15s linear",
      boxShadow: "0 0 8px rgba(212,175,55,0.3)",
    });
    document.body.appendChild(bar);

    let ticking = false;
    window.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        bar.style.width = progress.toFixed(1) + "%";
        ticking = false;
      });
    }, { passive: true });
  }

  /* ─── 7. FLOATING METHOD NUMBERS ─── */

  function initFloatingNumbers() {
    const numbers = document.querySelectorAll(".method-number");
    numbers.forEach((el, i) => {
      el.setAttribute("data-float", "");
      el.style.setProperty("--float-delay", (i * 0.8) + "s");
    });
  }

  /* ─── 8. TESTIMONIAL FLOAT DELAYS ─── */

  function initTestimonialFloat() {
    if (isMobile) return;
    const cards = document.querySelectorAll(".testimonial-card[data-depth-card]");
    cards.forEach((card, i) => {
      card.style.setProperty("--float-delay", (i * 1.5) + "s");
    });
  }

  /* ─── 9. AUTO-APPLY data-depth-card TO ELIGIBLE ELEMENTS ─── */

  function autoApplyDepthCards() {
    const selectors = [
      ".problem-card",
      ".solution-step",
      ".offer-teaser",
      ".testimonial-card",
      ".why-card",
      ".method-panel",
      ".stat-card",
      ".insight-card",
      ".service-preview-card",
      ".offer-card",
      ".process-card",
      ".signal-card",
      ".faq-card",
      ".formation-card",
      ".formation-sheet",
      ".equipment-card",
      ".video-card",
      ".results-case-card",
      ".mastery-card",
      ".platform-card",
      ".period-card",
      ".home-value__card",
    ];

    document.querySelectorAll(selectors.join(",")).forEach((el) => {
      if (!el.hasAttribute("data-depth-card")) {
        el.setAttribute("data-depth-card", "");
      }
    });
  }

  /* ─── 10. AUTO-APPLY data-depth-btn TO BUTTONS ─── */

  function autoApplyDepthButtons() {
    document.querySelectorAll(".button").forEach((btn) => {
      if (!btn.hasAttribute("data-depth-btn")) {
        btn.setAttribute("data-depth-btn", "");
      }
    });
  }

  /* ─── 11. AUTO-APPLY data-magnetic TO CTA BUTTONS ─── */

  function autoApplyMagnetic() {
    document.querySelectorAll(".button-primary, .header-cta").forEach((el) => {
      if (!el.hasAttribute("data-magnetic")) {
        el.setAttribute("data-magnetic", "");
      }
    });
  }

  /* ─── 12. AUTO-APPLY hero stagger ─── */

  function autoApplyHeroStagger() {
    const heroContent = document.querySelector(".hero-content");
    if (!heroContent) return;

    const children = heroContent.querySelectorAll(
      ":scope > .kicker, :scope > h1, :scope > p, :scope > .button-row"
    );

    children.forEach((el, i) => {
      if (!el.hasAttribute("data-hero-stagger")) {
        el.setAttribute("data-hero-stagger", String(i + 1));
      }
    });
  }

  /* ─── 13. AUTO-APPLY parallax to kickers ─── */

  function autoApplyParallax() {
    document.querySelectorAll(".kicker").forEach((el) => {
      if (!el.hasAttribute("data-parallax") && !el.closest(".hero-content")) {
        el.setAttribute("data-parallax", "0.03");
      }
    });

    document.querySelectorAll(".method-number").forEach((el) => {
      if (!el.hasAttribute("data-parallax")) {
        el.setAttribute("data-parallax", "0.04");
      }
    });
  }

  /* ─── 14. SMOOTH SECTION REVEAL WITH DEPTH ─── */

  function initDepthReveal() {
    /* no-op: section reveals are handled by app.js */
  }

  /* ─── INIT ─── */

  function init() {
    autoApplyDepthCards();
    autoApplyDepthButtons();
    autoApplyMagnetic();
    autoApplyHeroStagger();
    autoApplyParallax();
    initFloatingNumbers();
    initDepthReveal();

    initHeroStagger();
    initHeroOrb();
    initDepthCards();
    initMagnetic();
    initParallax();
    initTestimonialFloat();
    initScrollProgress();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
