/**
 * Formulaire contact → POST https://app.astrastudio.fr/api/leads
 * (localhost / 127.0.0.1 : même chemin sur le port dev Next.js)
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

  const isLocalTest =
    window.location.protocol === "file:" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "localhost";

  const contactEndpoint = isLocalTest
    ? "http://127.0.0.1:3000/api/leads"
    : "https://app.astrastudio.fr/api/leads";

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
            setFeedback("Une erreur est survenue, veuillez réessayer.", "error");
          }
          return;
        }

        setFeedback("Une erreur est survenue, veuillez réessayer.", "error");
        return;
      }

      contactForm.reset();
      clearFieldErrors();
      setSourceValue();
      applyIntentPreset();
      goToStep(1);
      setFeedback("Merci ! Nous revenons vers vous sous 24h.", "success");
    } catch (error) {
      setFeedback("Une erreur est survenue, veuillez réessayer.", "error");
    } finally {
      window.clearTimeout(timeoutId);
      setSubmittingState(false);
    }
  });
})();
