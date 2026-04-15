/**
 * Astra Casting — formulaires, liste missions, fiche mission
 */
(function () {
  const API =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
      ? "http://127.0.0.1:3000/api/casting/inquiry"
      : "https://app.astrastudio.fr/api/casting/inquiry";

  const JSON_MISSIONS = "../js/casting-missions.json";

  function setFeedback(el, message, type) {
    if (!el) return;
    el.textContent = message || "";
    el.classList.remove("is-error", "is-success");
    if (type) el.classList.add("is-" + type);
  }

  function bindForm(formSelector, type, fieldMap) {
    const form = document.querySelector(formSelector);
    if (!form) return;

    const feedback = form.querySelector("[data-cast-feedback]");
    const submitBtn = form.querySelector('button[type="submit"]');
    const defaultLabel = submitBtn ? submitBtn.textContent : "";

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      setFeedback(feedback, "");

      const fd = new FormData(form);
      if (fd.get("company_website")) return;

      const payload = { type: type };
      fieldMap.forEach(function (key) {
        const v = fd.get(key);
        if (v !== null && v !== undefined) payload[key] = String(v).trim();
      });

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Envoi en cours...";
      }

      try {
        const res = await fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(function () {
          return {};
        });

        if (!res.ok) {
          if (data.field_errors) {
            const first = data.error || Object.values(data.field_errors)[0];
            setFeedback(feedback, first || "Merci de vérifier les champs.", "error");
          } else {
            setFeedback(feedback, "Une erreur est survenue, veuillez réessayer.", "error");
          }
          return;
        }

        form.reset();
        setFeedback(
          feedback,
          "Merci ! Nous revenons vers vous sous 24h.",
          "success"
        );
      } catch (err) {
        setFeedback(feedback, "Une erreur est survenue, veuillez réessayer.", "error");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = defaultLabel;
        }
      }
    });
  }

  bindForm("[data-cast-form-brief]", "brand", [
    "first_name",
    "email",
    "phone",
    "company",
    "mission_type",
    "city",
    "dates",
    "profiles_count",
    "budget",
    "brief",
  ]);

  bindForm("[data-cast-form-talent]", "talent", [
    "first_name",
    "email",
    "phone",
    "age",
    "city",
    "styles",
    "experience",
    "availability",
    "mobility",
    "social",
    "motivation",
  ]);

  function escapeHtml(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function formatDate(iso) {
    try {
      const d = new Date(iso + "T12:00:00");
      return d.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch (e) {
      return iso;
    }
  }

  const statusLabels = {
    open: { className: "cast-mission-status--open", label: "Ouverte" },
    selection: {
      className: "cast-mission-status--selection",
      label: "En sélection",
    },
    done: { className: "cast-mission-status--done", label: "Terminée" },
  };

  const listRoot = document.querySelector("[data-cast-missions-list]");
  if (listRoot) {
    fetch(JSON_MISSIONS)
      .then(function (r) {
        return r.json();
      })
      .then(function (missions) {
        listRoot.innerHTML = missions
          .map(function (m) {
            const st = statusLabels[m.status] || statusLabels.open;
            return (
              '<a class="cast-mission-card" href="mission.html?slug=' +
              encodeURIComponent(m.slug) +
              '">' +
              '<span class="cast-mission-status ' +
              st.className +
              '">' +
              st.label +
              "</span>" +
              "<h3>" +
              escapeHtml(m.title) +
              "</h3>" +
              '<div class="cast-mission-meta">' +
              escapeHtml(m.city) +
              " · " +
              formatDate(m.date) +
              "<br/><strong>" +
              escapeHtml(m.compensation) +
              "</strong></div>" +
              "<p>" +
              escapeHtml(m.description) +
              "</p>" +
              '<span class="cast-card-cta">Voir la fiche →</span>' +
              "</a>"
            );
          })
          .join("");
      })
      .catch(function () {
        listRoot.innerHTML =
          '<p class="cast-lead">Impossible de charger les missions.</p>';
      });
  }

  const detailRoot = document.querySelector("[data-cast-mission-detail]");
  if (detailRoot) {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("slug");
    if (!slug) {
      detailRoot.innerHTML =
        '<p class="cast-lead">Mission introuvable. <a href="missions.html">Voir les missions</a></p>';
    } else {
      fetch(JSON_MISSIONS)
        .then(function (r) {
          return r.json();
        })
        .then(function (missions) {
          const m = missions.find(function (x) {
            return x.slug === slug;
          });
          if (!m) {
            detailRoot.innerHTML =
              '<p class="cast-lead">Mission introuvable. <a href="missions.html">Retour</a></p>';
            return;
          }

          const st = statusLabels[m.status] || statusLabels.open;

          function row(label, value) {
            return (
              '<div class="cast-detail-row"><span>' +
              escapeHtml(label) +
              "</span><span>" +
              escapeHtml(value) +
              "</span></div>"
            );
          }

          detailRoot.innerHTML =
            '<div class="cast-detail-hero">' +
            '<span class="cast-mission-status ' +
            st.className +
            '">' +
            st.label +
            "</span>" +
            '<h1 class="cast-h1" style="margin-top:12px">' +
            escapeHtml(m.title) +
            "</h1>" +
            '<p class="cast-lead">' +
            escapeHtml(m.type) +
            " · " +
            escapeHtml(m.city) +
            "</p></div>" +
            '<div class="cast-detail-panel">' +
            '<div class="cast-detail-grid">' +
            row("Date", formatDate(m.date)) +
            row("Rémunération", m.compensation) +
            row("Durée", m.duration) +
            row("Profils recherchés", String(m.profiles)) +
            row("Style / critères", m.style) +
            row("Marque / agence", m.brand) +
            "</div>" +
            '<p style="margin:24px 0 0;font-size:0.95rem;line-height:1.7;color:rgba(255,255,255,0.55)">' +
            escapeHtml(m.description) +
            "</p>" +
            (m.status === "open"
              ? '<p style="margin:28px 0 0"><a class="button button-primary" href="rejoindre.html">Candidater →</a></p>'
              : '<p style="margin:28px 0 0;font-size:0.88rem;color:rgba(255,255,255,0.4)">Les candidatures pour cette mission sont closes ou en cours de traitement.</p>') +
            "</div>";
        })
        .catch(function () {
          detailRoot.innerHTML =
            '<p class="cast-lead">Impossible de charger la mission.</p>';
        });
    }
  }
})();
