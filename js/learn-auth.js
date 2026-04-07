const feedbackNode = document.querySelector("[data-auth-feedback]");
const tabButtons = Array.from(document.querySelectorAll("[data-auth-tab]"));
const formNodes = Array.from(document.querySelectorAll("[data-auth-form]"));

function getUrlParams() {
  return new URLSearchParams(window.location.search);
}

function getSafeRedirectTarget() {
  const params = getUrlParams();
  const next = params.get("next") || "/learn/dashboard";

  if (!next.startsWith("/")) {
    return "/learn/dashboard";
  }

  if (next.startsWith("//")) {
    return "/learn/dashboard";
  }

  return next;
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

function setMode(mode) {
  const currentMode = mode || "login";

  tabButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.authTab === currentMode);
  });

  formNodes.forEach((form) => {
    form.classList.toggle("is-hidden", form.dataset.authForm !== currentMode);
  });
}

async function requestApi(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload.message || "Une erreur est survenue.");
    error.payload = payload;
    throw error;
  }

  return payload;
}

function attachTabs() {
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const mode = button.dataset.authTab;
      const params = getUrlParams();
      params.set("mode", mode);
      if (mode !== "reset") {
        params.delete("token");
      }
      window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
      setFeedback("");
      setMode(mode);
    });
  });
}

function handleFieldErrors(form, payload) {
  if (!payload?.field_errors || !form) {
    return;
  }

  Object.entries(payload.field_errors).forEach(([fieldName, message]) => {
    const field = form.elements.namedItem(fieldName);

    if (!field || typeof field.setCustomValidity !== "function") {
      return;
    }

    field.setCustomValidity(message);
    field.reportValidity();
  });
}

function clearFieldErrors(form) {
  if (!form) {
    return;
  }

  Array.from(form.elements).forEach((field) => {
    if (field && typeof field.setCustomValidity === "function") {
      field.setCustomValidity("");
    }
  });
}

function setSubmitting(form, value) {
  if (!form) {
    return;
  }

  form.classList.toggle("is-submitting", value);
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = value;
    submitButton.setAttribute("aria-busy", value ? "true" : "false");
  }
}

function attachFormHandlers() {
  const loginForm = document.querySelector('[data-auth-form="login"]');
  const signupForm = document.querySelector('[data-auth-form="signup"]');
  const forgotForm = document.querySelector('[data-auth-form="forgot"]');
  const resetForm = document.querySelector('[data-auth-form="reset"]');

  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      clearFieldErrors(loginForm);
      setFeedback("");

      if (!loginForm.reportValidity()) {
        return;
      }

      const payload = Object.fromEntries(new FormData(loginForm).entries());
      setSubmitting(loginForm, true);

      try {
        await requestApi("/api/student/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        window.location.href = getSafeRedirectTarget();
      } catch (error) {
        handleFieldErrors(loginForm, error.payload);
        setFeedback(error.message || "Connexion impossible.", "error");
      } finally {
        setSubmitting(loginForm, false);
      }
    });
  }

  if (signupForm) {
    signupForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      clearFieldErrors(signupForm);
      setFeedback("");

      if (!signupForm.reportValidity()) {
        return;
      }

      const payload = Object.fromEntries(new FormData(signupForm).entries());
      setSubmitting(signupForm, true);

      try {
        await requestApi("/api/student/auth/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        window.location.href = getSafeRedirectTarget();
      } catch (error) {
        handleFieldErrors(signupForm, error.payload);
        setFeedback(error.message || "Inscription impossible.", "error");
      } finally {
        setSubmitting(signupForm, false);
      }
    });
  }

  if (forgotForm) {
    forgotForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      clearFieldErrors(forgotForm);
      setFeedback("");

      if (!forgotForm.reportValidity()) {
        return;
      }

      const payload = Object.fromEntries(new FormData(forgotForm).entries());
      setSubmitting(forgotForm, true);

      try {
        const result = await requestApi("/api/student/auth/forgot-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        let message = result.message;
        if (result.debug_reset_token) {
          message = `${message} (Dev token: ${result.debug_reset_token})`;
        }
        setFeedback(message, "success");
      } catch (error) {
        handleFieldErrors(forgotForm, error.payload);
        setFeedback(error.message || "Envoi impossible.", "error");
      } finally {
        setSubmitting(forgotForm, false);
      }
    });
  }

  if (resetForm) {
    resetForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      clearFieldErrors(resetForm);
      setFeedback("");

      if (!resetForm.reportValidity()) {
        return;
      }

      const params = getUrlParams();
      const token = params.get("token") || "";
      const formValues = Object.fromEntries(new FormData(resetForm).entries());
      const payload = {
        token,
        password: formValues.password,
      };

      setSubmitting(resetForm, true);

      try {
        const result = await requestApi("/api/student/auth/reset-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        setFeedback(result.message || "Mot de passe mis à jour.", "success");
        setMode("login");
      } catch (error) {
        handleFieldErrors(resetForm, error.payload);
        setFeedback(error.message || "Réinitialisation impossible.", "error");
      } finally {
        setSubmitting(resetForm, false);
      }
    });
  }
}

async function bootstrapAuthPage() {
  attachTabs();
  attachFormHandlers();

  const params = getUrlParams();
  const initialMode = params.get("mode");
  const hasResetToken = Boolean(params.get("token"));

  if (initialMode === "reset" && hasResetToken) {
    setMode("reset");
  } else if (["signup", "forgot"].includes(initialMode)) {
    setMode(initialMode);
  } else {
    setMode("login");
  }

  try {
    const session = await requestApi("/api/student/session");
    if (session.authenticated) {
      window.location.href = getSafeRedirectTarget();
    }
  } catch (_error) {
    // Ignoré volontairement : on reste sur la page d’auth.
  }
}

bootstrapAuthPage();
