const feedbackNode = document.querySelector("[data-formations-feedback]");
const buyButtons = Array.from(document.querySelectorAll("[data-course-buy]"));

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
    throw new Error(payload.message || "La requête a échoué.");
  }

  return payload;
}

function setButtonLoading(button, value) {
  if (!button) {
    return;
  }

  button.disabled = value;
  button.classList.toggle("is-loading", value);
}

async function handleBuy(courseSlug, button) {
  const session = await requestApi("/api/student/session");

  if (!session.authenticated) {
    const nextTarget = encodeURIComponent("/formations.html");
    const course = encodeURIComponent(courseSlug);
    window.location.href = `/learn/login?mode=login&next=${nextTarget}&course=${course}`;
    return;
  }

  const checkout = await requestApi("/api/student/checkout/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      course_slug: courseSlug,
    }),
  });

  if (checkout.already_enrolled && checkout.redirect_to) {
    if (checkout.fake_checkout) {
      setFeedback(
        checkout.message || "Mode démo actif : paiement simulé validé, accès en cours d’ouverture…",
        "success"
      );
      window.setTimeout(() => {
        window.location.href = checkout.redirect_to;
      }, 650);
      return;
    }

    window.location.href = checkout.redirect_to;
    return;
  }

  if (!checkout.checkout_url) {
    throw new Error("Impossible de démarrer le paiement pour le moment.");
  }

  setFeedback("Redirection vers le paiement sécurisé…", "success");
  window.location.href = checkout.checkout_url;
}

buyButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const courseSlug = button.dataset.courseBuy;
    if (!courseSlug) {
      return;
    }

    setFeedback("");
    setButtonLoading(button, true);

    handleBuy(courseSlug, button).catch((error) => {
      setFeedback(error.message || "Le paiement n'a pas pu être lancé.", "error");
    }).finally(() => {
      setButtonLoading(button, false);
    });
  });
});
