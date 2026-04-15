/**
 * Diagnostic Services — scoring par points + règles métier.
 * Données : data/services-quiz.json
 */
(function () {
  const OFFER_IDS = ["starter", "custom", "audit", "direction"];
  const STORAGE_KEY = "astra-services-quiz-v1";

  function loadConfig() {
    return fetch("data/services-quiz.json", { credentials: "same-origin" }).then((r) => {
      if (!r.ok) throw new Error("Config quiz introuvable");
      return r.json();
    });
  }

  function sumScores(config, answers) {
    const scores = Object.fromEntries(OFFER_IDS.map((id) => [id, 0]));
    for (const q of config.questions) {
      const choice = answers[q.id];
      const opt = q.options.find((o) => o.id === choice);
      if (!opt?.scores) continue;
      for (const id of OFFER_IDS) {
        scores[id] += opt.scores[id] ?? 0;
      }
    }
    return scores;
  }

  function applyRules(scores, answers) {
    const s = { ...scores };
    if (answers.q8 === "no") s.direction = Math.max(0, s.direction - 14);
    if (answers.q8 === "unsure") s.direction = Math.max(0, s.direction - 7);
    if (answers.q5 === "low") s.direction = Math.min(s.direction, 10);
    if (answers.q4 === "one_shot" && answers.q2 === "deadline") s.custom += 3;
    if (answers.q5 === "retainer" && answers.q8 === "yes") s.direction += 2;
    return s;
  }

  function pickWinner(scores, tieBreakOrder) {
    const max = Math.max(...OFFER_IDS.map((id) => scores[id]));
    const tops = OFFER_IDS.filter((id) => scores[id] === max);
    if (tops.length === 1) return tops[0];
    for (const id of tieBreakOrder) {
      if (tops.includes(id)) return id;
    }
    return tops[0];
  }

  function adjustWinner(winner, scores) {
    if (winner === "starter" && scores.audit >= scores.starter - 4) return "audit";
    return winner;
  }

  function runnerUp(scores, winner) {
    const rest = OFFER_IDS.filter((id) => id !== winner);
    return rest.sort((a, b) => scores[b] - scores[a])[0];
  }

  function computeResult(config, answers) {
    const raw = sumScores(config, answers);
    const scores = applyRules(raw, answers);
    let winner = pickWinner(scores, config.tieBreakOrder || OFFER_IDS);
    winner = adjustWinner(winner, scores);
    const second = runnerUp(scores, winner);
    return {
      scores,
      winner,
      runnerUp: second,
      runnerUpDelta: scores[winner] - scores[second],
    };
  }

  function formatScores(scores) {
    return OFFER_IDS.map((id) => `${id[0].toUpperCase()}${id.slice(1)}: ${scores[id]}`).join(" · ");
  }

  function buildSummary(config, answers, result) {
    const lines = [
      "Diagnostic Astra Studio",
      `Recommandation: ${config.offers[result.winner].name}`,
      "",
      "Réponses:",
      ...config.questions.map((q) => {
        const v = answers[q.id];
        const opt = q.options.find((o) => o.id === v);
        return `- ${q.prompt} → ${opt ? opt.label : "—"}`;
      }),
      "",
      formatScores(result.scores),
    ];
    return lines.join("\n");
  }

  async function submitLead(config, payload) {
    const url = config.leadEndpoint;
    if (!url) return { ok: false, skipped: true };
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return { ok: r.ok };
    } catch {
      return { ok: false };
    }
  }

  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function renderIntro(root, config, onStart) {
    const intro = el("div", "services-quiz-intro");
    intro.innerHTML = `
      <span class="kicker reveal reveal-tilt">${escapeHtml(config.intro.kicker)}</span>
      <h2 id="diagnostic-heading">${escapeHtml(config.intro.title)}</h2>
      <p class="lead">${escapeHtml(config.intro.lead)}</p>
      <div class="services-quiz-cta-row">
        <button type="button" class="button button-primary" data-quiz-start>${escapeHtml(config.intro.cta)}</button>
      </div>
      <p class="footnote">${escapeHtml(config.intro.footnote)}</p>
    `;
    intro.querySelector("[data-quiz-start]").addEventListener("click", onStart);
    root.appendChild(intro);
    return intro;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderRun(root, config, onDone) {
    const run = el("div", "services-quiz-run");
    run.setAttribute("role", "region");
    run.setAttribute("aria-labelledby", "diagnostic-heading");
    run.hidden = true;

    const answers = {};
    let index = 0;
    const total = config.questions.length;

    const top = el("div", "services-quiz-top");
    const meta = el("div", "services-quiz-meta");
    const stepEl = el("span");
    const pctEl = el("span");
    meta.appendChild(stepEl);
    meta.appendChild(pctEl);

    const progress = el("div", "services-quiz-progress");
    const bar = el("div", "services-quiz-progress-bar");
    progress.appendChild(bar);

    top.appendChild(progress);
    top.appendChild(meta);

    const qTitle = el("h3", "services-quiz-question");
    const opts = el("div", "services-quiz-options");

    const nav = el("div", "services-quiz-nav");
    const back = el("button", "services-quiz-back", "← Question précédente");
    back.type = "button";
    back.disabled = true;
    nav.appendChild(back);

    function updateProgress() {
      const pct = Math.round(((index + 1) / total) * 100);
      bar.style.width = `${pct}%`;
      stepEl.textContent = `Question ${index + 1} / ${total}`;
      pctEl.textContent = `${pct} %`;
      back.disabled = index === 0;
    }

    function showQuestion() {
      const q = config.questions[index];
      qTitle.textContent = q.prompt;
      opts.innerHTML = "";
      q.options.forEach((o) => {
        const btn = el("button", "services-quiz-option");
        btn.type = "button";
        btn.innerHTML = `<span class="services-quiz-option-label">${escapeHtml(o.label)}</span><span class="services-quiz-option-sub">${escapeHtml(o.subtitle || "")}</span>`;
        btn.addEventListener("click", () => {
          answers[q.id] = o.id;
          if (index < total - 1) {
            index += 1;
            updateProgress();
            showQuestion();
            qTitle.focus();
          } else {
            onDone(answers);
          }
        });
        opts.appendChild(btn);
      });
      updateProgress();
    }

    back.addEventListener("click", () => {
      if (index <= 0) return;
      index -= 1;
      updateProgress();
      showQuestion();
    });

    run.appendChild(top);
    run.appendChild(qTitle);
    run.appendChild(opts);
    run.appendChild(nav);

    root.appendChild(run);

    return {
      el: run,
      start() {
        run.hidden = false;
        index = 0;
        Object.keys(answers).forEach((k) => delete answers[k]);
        updateProgress();
        showQuestion();
        qTitle.setAttribute("tabindex", "-1");
        qTitle.focus();
      },
    };
  }

  function renderResult(root, config, answers, result, onRestart) {
    const panel = el("div", "services-quiz-result");
    const offer = config.offers[result.winner];
    const second = config.offers[result.runnerUp];
    const showSecond =
      result.runnerUp !== result.winner &&
      result.runnerUpDelta <= 12 &&
      result.scores[result.runnerUp] >= 16;

    const card = el("div", "services-quiz-result-card");
    card.innerHTML = `
      <p class="services-quiz-result-eyebrow">Recommandation</p>
      <p class="services-quiz-result-profile">${escapeHtml(offer.profileLabel)}</p>
      <h3 class="services-quiz-result-title">${escapeHtml(offer.name)}</h3>
      <p class="services-quiz-result-price">${escapeHtml(offer.priceHint)}</p>
      <p class="services-quiz-result-why">${escapeHtml(offer.why)}</p>
      <ul class="services-quiz-result-list">
        ${offer.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}
      </ul>
      <div class="services-quiz-result-actions">
        <a class="button button-primary" href="${escapeHtml(offer.href)}">${escapeHtml(offer.hrefLabel)}</a>
        <a class="button button-secondary" href="${escapeHtml(offer.secondaryHref)}">${escapeHtml(offer.secondaryHrefLabel)}</a>
      </div>
      ${
        showSecond
          ? `<p class="services-quiz-secondary"><strong>À explorer aussi :</strong> ${escapeHtml(second.name)} (${escapeHtml(second.priceHint)}) — score proche, à valider selon votre calendrier et votre budget.</p>`
          : ""
      }
      <p class="services-quiz-scores" aria-hidden="true">${escapeHtml(formatScores(result.scores))}</p>
      <div class="services-quiz-lead-form">
        <label for="quiz-email">Recevoir ce résumé par email (optionnel)</label>
        <input type="email" id="quiz-email" name="email" autocomplete="email" placeholder="vous@marque.com" />
        <div class="services-quiz-lead-actions">
          <button type="button" class="button button-secondary" data-quiz-copy>Copier le résumé</button>
        </div>
      </div>
      <button type="button" class="services-quiz-restart" data-quiz-restart>Recommencer le diagnostic</button>
    `;

    panel.appendChild(card);
    root.appendChild(panel);

    const summary = buildSummary(config, answers, result);

    card.querySelector("[data-quiz-copy]").addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(summary);
        const btn = card.querySelector("[data-quiz-copy]");
        const t = btn.textContent;
        btn.textContent = "Copié";
        setTimeout(() => {
          btn.textContent = t;
        }, 2000);
      } catch {
        /* noop */
      }
    });

    card.querySelector("[data-quiz-restart]").addEventListener("click", onRestart);

    const emailInput = card.querySelector("#quiz-email");
    emailInput.addEventListener("change", () => {
      const payload = {
        type: "services_quiz",
        email: emailInput.value.trim(),
        winner: result.winner,
        scores: result.scores,
        answers,
        summary,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...payload, at: Date.now() }));
      } catch {
        /* noop */
      }
      submitLead(config, payload);
    });

    return panel;
  }

  function init(root) {
    root.innerHTML = "";
    const loading = el("p", "services-quiz-loading", "Chargement du diagnostic…");
    root.appendChild(loading);

    loadConfig()
      .then((config) => {
        loading.remove();

        let introEl;
        let runCtl;
        let resultEl;

        function backToIntro() {
          if (resultEl) {
            resultEl.remove();
            resultEl = null;
          }
          if (runCtl) runCtl.el.hidden = true;
          introEl.hidden = false;
          introEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }

        function goResult(answers) {
          const result = computeResult(config, answers);
          runCtl.el.hidden = true;
          resultEl = renderResult(root, config, answers, result, backToIntro);
          resultEl.scrollIntoView({ behavior: "smooth", block: "start" });

          const payload = {
            type: "services_quiz",
            winner: result.winner,
            scores: result.scores,
            answers,
            summary: buildSummary(config, answers, result),
          };
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...payload, at: Date.now() }));
          } catch {
            /* noop */
          }
          submitLead(config, payload);
        }

        introEl = renderIntro(root, config, () => {
          introEl.hidden = true;
          runCtl.start();
        });

        runCtl = renderRun(root, config, goResult);
      })
      .catch(() => {
        loading.textContent = "";
        loading.className = "services-quiz-fallback";
        loading.innerHTML = `
          <div style="text-align:center; padding: clamp(32px, 5vw, 56px) clamp(20px, 3vw, 32px); border-radius: 20px; border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.02);">
            <p style="margin: 0 0 8px; font-size: 0.68rem; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(212,175,55,0.85);">Diagnostic express</p>
            <p style="margin: 0 0 12px; font-family: var(--font-display, 'Bodoni Moda', serif); font-size: clamp(1.35rem, 2.4vw, 1.75rem); font-weight: 600; color: rgba(250,245,238,0.94); line-height: 1.18;">Pas besoin de diagnostic pour avancer.</p>
            <p style="margin: 0 auto 24px; max-width: 48ch; font-size: 0.95rem; line-height: 1.65; color: rgba(255,255,255,0.5);">Consultez directement nos offres ci-dessous et choisissez le format qui correspond à votre besoin — ou planifiez un échange pour qu'on en discute ensemble.</p>
            <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 12px;">
              <a class="button button-primary" href="#offres-detail">Voir les offres</a>
              <a class="button button-secondary" href="contact.html">Planifier un échange</a>
            </div>
          </div>
        `;
      });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const root = document.querySelector("[data-services-quiz]");
    if (root) init(root);
  });
})();
