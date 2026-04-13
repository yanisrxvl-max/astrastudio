/**
 * IntersectionObserver pour .reveal — pages sans app.js (admin, espace élève, etc.).
 * Les pages marketing utilisent la même logique dans js/app.js.
 */
(function () {
  if (window.__astraRevealObserverLoaded) {
    return;
  }

  if (!window.IntersectionObserver) {
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("active"));
    return;
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("active"));
    return;
  }

  window.__astraRevealObserverLoaded = true;

  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("active");
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
})();
