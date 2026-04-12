const body = document.body;
const siteHeader = document.querySelector(".site-header");
const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const mobileNavBreakpoint = 1080;

const handleHeaderState = () => {
  if (!siteHeader) {
    return;
  }

  siteHeader.classList.toggle("scrolled", window.scrollY > 18);
};

handleHeaderState();
window.addEventListener("scroll", handleHeaderState, { passive: true });

if (navToggle && siteNav) {
  const closeNav = () => {
    navToggle.setAttribute("aria-expanded", "false");
    siteNav.classList.remove("is-open");
    body.classList.remove("nav-open");
  };

  navToggle.addEventListener("click", () => {
    const isExpanded = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!isExpanded));
    siteNav.classList.toggle("is-open", !isExpanded);
    body.classList.toggle("nav-open", !isExpanded);
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeNav);
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

const revealElements = document.querySelectorAll(".reveal");
if (revealElements.length) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.18,
      rootMargin: "0px 0px -48px 0px",
    }
  );

  revealElements.forEach((element) => {
    revealObserver.observe(element);
  });
}

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

    if (!intent || !projectTypeField || projectTypeField.value) {
      return;
    }

    const intentMap = {
      "systemes-ia": "Systèmes IA de marque",
      "production-mobile": "Production mobile / matériel sur site",
      agence: "Besoin à clarifier ensemble",
      formation: "Besoin à clarifier ensemble",
      "audit-premium": "Besoin à clarifier ensemble",
      audit: "Besoin à clarifier ensemble",
      "image-influence": "Dispositif image & influence",
    };

    const mappedValue = intentMap[intent];

    if (!mappedValue) {
      return;
    }

    const option = Array.from(projectTypeField.options).find(
      (entry) => entry.textContent.trim() === mappedValue
    );

    if (option) {
      projectTypeField.value = option.value || option.textContent.trim();
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
