const progressNode = document.querySelector("[data-checkout-progress]");
const copyNode = document.querySelector("[data-checkout-copy]");
const feedbackNode = document.querySelector("[data-checkout-feedback]");
const actionsNode = document.querySelector("[data-checkout-actions]");

function setProgress(value) {
  if (!progressNode) {
    return;
  }

  progressNode.style.width = `${Math.max(0, Math.min(100, value))}%`;
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

function renderActions(actions = []) {
  if (!actionsNode) {
    return;
  }

  actionsNode.innerHTML = actions
    .map(
      (action) =>
        `<a class="button ${action.variant || "button-secondary"}" href="${action.href}">${action.label}</a>`
    )
    .join("");
}

async function confirmCheckout() {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id");

  if (!sessionId) {
    setProgress(100);
    setFeedback("Session de paiement introuvable.", "error");
    renderActions([
      { label: "Retour au dashboard", href: "/learn/dashboard", variant: "button-secondary" },
      { label: "Voir les formations", href: "/formations.html", variant: "button-primary" },
    ]);
    return;
  }

  setProgress(55);
  setFeedback("Validation du paiement auprès de Stripe…");

  const response = await fetch("/api/student/checkout/confirm", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      session_id: sessionId,
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || "Impossible de finaliser votre accès.");
  }

  setProgress(100);

  if (payload.enrolled) {
    if (copyNode) {
      copyNode.textContent = "Votre formation est activée. Vous pouvez commencer immédiatement.";
    }

    setFeedback("Paiement confirmé. Accès débloqué avec succès.", "success");
    renderActions([
      { label: "Accéder au dashboard", href: "/learn/dashboard", variant: "button-secondary" },
      {
        label: "Ouvrir ma formation",
        href: `/learn/course?course=${encodeURIComponent(payload.course_slug || payload.course_id || "")}`,
        variant: "button-primary",
      },
    ]);
    return;
  }

  if (copyNode) {
    copyNode.textContent =
      "Votre paiement est encore en cours de confirmation. Nous mettons à jour votre accès automatiquement.";
  }

  setFeedback("Paiement en attente de confirmation.", "error");
  renderActions([
    { label: "Revenir au dashboard", href: "/learn/dashboard", variant: "button-secondary" },
    { label: "Support Astra Studio", href: "/contact.html", variant: "button-primary" },
  ]);
}

confirmCheckout().catch((error) => {
  setProgress(100);
  setFeedback(error.message || "Erreur lors de l’activation de l’accès.", "error");
  renderActions([
    { label: "Retour dashboard", href: "/learn/dashboard", variant: "button-secondary" },
    { label: "Voir les formations", href: "/formations.html", variant: "button-primary" },
  ]);
});
