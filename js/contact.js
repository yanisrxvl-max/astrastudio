/**
 * Formulaire contact → POST /api/leads (proxy Vercel) ou API Next en direct.
 * Dev local Next : http://127.0.0.1:3000/api/leads
 */
(function () {
  const contactForm = document.querySelector("[data-contact-form]");
  const formFeedback = document.querySelector("[data-form-feedback]");

  if (!contactForm) return;

  const submitButton = contactForm.querySelector('button[type="submit"]');
  const sourceField = contactForm.querySelector("[data-contact-source]");
  const offerContextField = contactForm.querySelector("[data-offer-context]");
  const formShell = contactForm.closest(".contact-form-shell");
  const formFields = Array.from(contactForm.querySelectorAll("input, select, textarea"));
  const defaultSubmitLabel = submitButton ? submitButton.textContent : "";

  /** API Next (CORS *.vercel.app). Surcharge : <form data-leads-api-url="https://…/api/leads"> si le domaine app n’est pas encore en DNS. */
  const UPSTREAM_API =
    (contactForm.getAttribute("data-leads-api-url") || "").trim() ||
    "https://app.studioastraparis.fr/api/leads";

  /** Même origine : proxy Vercel /api/leads ou route Next si le site tourne sur le même host. */
  function getContactEndpoint() {
    if (window.location.protocol === "file:") {
      return UPSTREAM_API;
    }
    return "/api/leads";
  }

  const formSteps = contactForm.querySelectorAll("[data-form-step]");
  const stepDots = contactForm.querySelectorAll("[data-step-dot]");
  const nextBtn = contactForm.querySelector("[data-step-next]");
  const prevBtn = contactForm.querySelector("[data-step-prev]");
  const skipBtn = contactForm.querySelector("[data-step-skip]");
  const intentBadge = document.querySelector("[data-intent-badge]");
  let currentStep = 1;

  const goToStep = (step) => {
    formSteps.forEach((s) => s.classList.remove("is-active"));
    const target = contactForm.querySelector(`[data-form-step="${step}"]`);
    if (target) target.classList.add("is-active");

    stepDots.forEach((dot) => {
      const dotStep = Number(dot.dataset.stepDot);
      dot.classList.toggle("is-current", dotStep === step);
    });

    currentStep = step;
  };

  const validateStep1 = () => {
    let valid = true;

    const nameField = contactForm.querySelector('[name="name"]');
    const emailField = contactForm.querySelector('[name="email"]');
    const messageField = contactForm.querySelector('[name="message"]');

    const markInvalid = (field, msg) => {
      field.classList.add("is-invalid");
      field.setAttribute("aria-invalid", "true");
      if (msg) field.setCustomValidity(msg);
      valid = false;
    };

    if (nameField) {
      const val = nameField.value.trim();
      if (!val) {
        markInvalid(nameField, "Le prénom est requis.");
      } else if (val.length < 2) {
        markInvalid(nameField, "Le prénom doit contenir au moins 2 caractères.");
      }
    }

    if (emailField) {
      const val = emailField.value.trim();
      if (!val) {
        markInvalid(emailField, "L'e-mail est requis.");
      } else if (!emailField.validity.valid) {
        markInvalid(emailField, "Veuillez entrer un email valide.");
      }
    }

    if (messageField) {
      const val = messageField.value.trim();
      if (!val) {
        markInvalid(messageField, "Le message est requis.");
      } else if (val.length < 10) {
        markInvalid(messageField, "Le message doit contenir au moins 10 caractères.");
      }
    }

    if (!valid) {
      const firstInvalid = contactForm.querySelector('[data-form-step="1"] .is-invalid');
      if (firstInvalid) {
        firstInvalid.focus();
        if (typeof firstInvalid.reportValidity === "function") {
          firstInvalid.reportValidity();
        }
      }
    }

    return valid;
  };

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (validateStep1()) goToStep(2);
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", () => goToStep(1));
  }

  if (skipBtn) {
    skipBtn.addEventListener("click", () => {
      if (validateStep1()) contactForm.requestSubmit();
    });
  }

  const setFeedback = (message, type = "") => {
    if (!formFeedback) return;

    formFeedback.textContent = message;
    formFeedback.classList.remove("is-error", "is-success");

    if (type) formFeedback.classList.add(`is-${type}`);
    if (message) formFeedback.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const clearFieldErrors = () => {
    formFields.forEach((field) => {
      field.classList.remove("is-invalid");
      field.removeAttribute("aria-invalid");
      field.setCustomValidity("");
    });
  };

  const setSourceValue = () => {
    if (!sourceField) return;

    const currentLocation = `${window.location.pathname}${window.location.search}`.replace(
      /^\/+/,
      ""
    );

    sourceField.value = `Site Astra Studio • ${currentLocation || "contact.html"}`;
  };

  /** ?offer=audit | direction, ?intent=custom, etc. */
  const applyIntentPreset = () => {
    const params = new URLSearchParams(window.location.search);
    const intent = params.get("intent");
    const offer = params.get("offer");

    const badgeLabels = {
      audit: "Audit Stratégique de Marque — 690 €",
      direction: "Direction Créative Premium — 1 800 €/mois",
      custom: "Projet sur mesure",
    };

    const badgeKey = offer || intent;
    if (intentBadge && badgeKey && badgeLabels[badgeKey]) {
      intentBadge.textContent = badgeLabels[badgeKey];
    }

    if (offerContextField) {
      offerContextField.value = offer || intent || "";
    }
  };

  const setSubmittingState = (isSubmitting) => {
    contactForm.classList.toggle("is-submitting", isSubmitting);

    if (formShell) formShell.classList.toggle("is-submitting", isSubmitting);
    if (!submitButton) return;

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

  async function postLead(url, payload, signal) {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      signal,
    });
    const text = await res.text();
    let result = {};
    try {
      result = text ? JSON.parse(text) : {};
    } catch {
      result = {
        parseError: true,
        raw: text.slice(0, 300),
      };
    }
    return { res, result };
  }

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    clearFieldErrors();
    setFeedback("");

    if (!validateStep1()) return;

    const formData = new FormData(contactForm);
    const honeypot = formData.get("company_website");

    if (honeypot) return;

    const payload = Object.fromEntries(formData.entries());

    if (sourceField && !payload.source) {
      payload.source = sourceField.value;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const offerFromUrl = urlParams.get("offer") || urlParams.get("intent");
    if (offerFromUrl) {
      payload.offer_interest = offerFromUrl;
    } else if (payload.offer_context) {
      payload.offer_interest = payload.offer_context;
    }

    setSubmittingState(true);

    let timeoutId;
    const primaryUrl = getContactEndpoint();

    try {
      const controller = new AbortController();
      timeoutId = window.setTimeout(() => controller.abort(), 25000);

      let { res, result } = await postLead(primaryUrl, payload, controller.signal);

      /** Proxy HS (502/503/504) : souvent fetch serveur→upstream qui échoue ; le navigateur peut joindre l’API Next directement. */
      const fallbackToUpstream =
        primaryUrl.startsWith("/") &&
        UPSTREAM_API &&
        (res.status === 404 ||
          res.status === 405 ||
          res.status === 502 ||
          res.status === 503 ||
          res.status === 504 ||
          (result.parseError && res.status === 404));

      if (fallbackToUpstream) {
        const second = await postLead(UPSTREAM_API, payload, controller.signal);
        res = second.res;
        result = second.result;
      }

      window.clearTimeout(timeoutId);

      if (result.parseError) {
        console.error("[contact] JSON invalide", result.raw);
        setFeedback(
          `Réponse serveur inattendue (${res.status}). Si le problème persiste, écrivez à bonjour@studioastraparis.fr.`,
          "error"
        );
        return;
      }

      if (!res.ok) {
        if (result.field_errors && typeof result.field_errors === "object") {
          const fieldErrors = Object.entries(result.field_errors);

          fieldErrors.forEach(([fieldName, message]) => {
            const field = contactForm.elements.namedItem(fieldName);

            if (!field || typeof field.setCustomValidity !== "function") return;

            field.classList.add("is-invalid");
            field.setAttribute("aria-invalid", "true");
            field.setCustomValidity(message);
          });

          const firstInvalidFieldName = fieldErrors[0]?.[0];
          const firstInvalidField = firstInvalidFieldName
            ? contactForm.elements.namedItem(firstInvalidFieldName)
            : null;

          if (firstInvalidField) {
            const fieldStep = firstInvalidField.closest("[data-form-step]");
            if (fieldStep) goToStep(Number(fieldStep.dataset.formStep));
            if (typeof firstInvalidField.reportValidity === "function") {
              firstInvalidField.reportValidity();
            }
          }

          const firstMsg =
            typeof result.error === "string" && result.error.trim()
              ? result.error
              : String(fieldErrors[0]?.[1] || "");
          if (firstMsg) {
            setFeedback(firstMsg, "error");
          } else {
            setFeedback("Merci de corriger les champs indiqués.", "error");
          }
          return;
        }

        const serverMsg =
          typeof result.error === "string" && result.error.trim()
            ? result.error
            : null;
        setFeedback(
          serverMsg ||
            (res.status >= 500
              ? "Le serveur ne peut pas enregistrer la demande pour le moment. Réessayez plus tard ou écrivez à bonjour@studioastraparis.fr."
              : `Envoi impossible (${res.status}). Réessayez ou contactez bonjour@studioastraparis.fr.`),
          "error"
        );
        return;
      }

      contactForm.reset();
      clearFieldErrors();
      setSourceValue();
      applyIntentPreset();
      goToStep(1);
      setFeedback("Merci ! Nous revenons vers vous sous 24h.", "success");
    } catch (error) {
      const isAbort = error && error.name === "AbortError";
      console.error("[contact]", error);
      setFeedback(
        isAbort
          ? "Délai dépassé. Vérifiez votre connexion ou écrivez à bonjour@studioastraparis.fr."
          : "Impossible d’envoyer le formulaire (réseau). Réessayez ou écrivez à bonjour@studioastraparis.fr.",
        "error"
      );
    } finally {
      window.clearTimeout(timeoutId);
      setSubmittingState(false);
    }
  });
})();
