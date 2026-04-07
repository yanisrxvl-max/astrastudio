const loginForm = document.querySelector("[data-admin-login-form]");
const feedback = document.querySelector("[data-admin-login-feedback]");

function setFeedback(message, type = "") {
  if (!feedback) {
    return;
  }

  feedback.textContent = message;
  feedback.classList.remove("is-error", "is-success");

  if (type) {
    feedback.classList.add(`is-${type}`);
  }
}

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = loginForm.querySelector('button[type="submit"]');
    const payload = Object.fromEntries(new FormData(loginForm).entries());

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Connexion...";
    }

    setFeedback("");

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Connexion impossible.");
      }

      setFeedback("Connexion réussie. Redirection en cours…", "success");
      window.location.href = result.redirect_to || "/admin";
    } catch (error) {
      setFeedback(error.message || "Connexion impossible.", "error");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Entrer dans l’admin";
      }
    }
  });
}
