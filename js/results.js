const resultsPage = document.body.dataset.page === "results";
const resultsData = window.ASTRA_RESULTS_DATA;

if (resultsPage && resultsData) {
  const metricsRoot = document.querySelector("[data-results-metrics]");
  const signalsRoot = document.querySelector("[data-results-signals]");
  const tikTokPeriodsRoot = document.querySelector("[data-results-tiktok-periods]");
  const videosRoot = document.querySelector("[data-results-videos]");
  const xBreakdownsRoot = document.querySelector("[data-results-x-breakdowns]");
  const chartsRoot = document.querySelector("[data-results-charts]");
  const platformsRoot = document.querySelector("[data-results-platforms]");
  const casesRoot = document.querySelector("[data-results-cases]");

  if (metricsRoot) {
    metricsRoot.innerHTML = resultsData.metrics.map(renderMetricCard).join("");
  }

  if (signalsRoot) {
    signalsRoot.innerHTML = `
      <div class="platform-grid">
        ${resultsData.signals.map(renderSignalCard).join("")}
      </div>
    `;
  }

  if (tikTokPeriodsRoot) {
    tikTokPeriodsRoot.innerHTML = resultsData.tikTokPeriods.map(renderPeriodCard).join("");
  }

  if (videosRoot) {
    videosRoot.innerHTML = resultsData.videos.map(renderVideoCard).join("");
  }

  if (xBreakdownsRoot) {
    xBreakdownsRoot.innerHTML = resultsData.xPeriods.map(renderPeriodCard).join("");
  }

  if (chartsRoot) {
    chartsRoot.innerHTML = resultsData.charts.map(renderChartCard).join("");
  }

  if (platformsRoot) {
    platformsRoot.innerHTML = `
      <div class="platform-grid">
        ${resultsData.platforms.map(renderPlatformCard).join("")}
      </div>
    `;
  }

  if (casesRoot) {
    casesRoot.innerHTML = resultsData.cases.map(renderCaseCard).join("");
  }
}

function renderMetricCard(metric) {
  return `
    <article class="stat-card metric-card">
      <div class="metric-head">
        <span class="card-eyebrow">${escapeHtml(metric.label)}</span>
        ${renderChip(metric.chip)}
      </div>
      <strong class="metric-value">${escapeHtml(metric.value)}</strong>
      <p class="metric-context">${escapeHtml(metric.context)}</p>
      <p class="metric-note">${escapeHtml(metric.note)}</p>
    </article>
  `;
}

function renderSignalCard(item) {
  return `
    <article class="platform-card">
      <div class="platform-head">
        <div>
          <span class="top-content-platform">${escapeHtml(item.name)}</span>
          <p>${escapeHtml(item.detail)}</p>
        </div>
        <div class="platform-value">
          ${renderChip(item.chip)}
          <strong>${escapeHtml(item.value)}</strong>
        </div>
      </div>
      <div class="performance-bar platform-bar">
        <span class="performance-fill" style="--progress:${Number(item.progress) || 0}%"></span>
      </div>
    </article>
  `;
}

function renderPeriodCard(period) {
  return `
    <article class="period-card panel">
      <div class="period-head">
        <div class="period-title-row">
          <span class="card-eyebrow">${escapeHtml(period.eyebrow)}</span>
          <h3 class="card-title">${escapeHtml(period.title)}</h3>
        </div>
        ${renderChip(period.chip)}
      </div>
      <div class="period-stats">
        ${period.stats.map(renderPeriodStat).join("")}
      </div>
      <p class="period-note">${escapeHtml(period.note)}</p>
    </article>
  `;
}

function renderPeriodStat(stat) {
  return `
    <div class="period-stat">
      <span>${escapeHtml(stat.label)}</span>
      <strong>${escapeHtml(stat.value)}</strong>
    </div>
  `;
}

function renderVideoCard(video, index) {
  return `
    <article class="video-card">
      <div class="video-card-head">
        <span class="video-rank">0${index + 1}</span>
        ${renderChip(video.chip)}
      </div>
      <h3 class="card-title">${escapeHtml(video.title)}</h3>
      <strong class="video-value">${escapeHtml(video.value)}</strong>
      <p class="video-note">${escapeHtml(video.note)}</p>
      <div class="performance-bar">
        <span class="performance-fill" style="--progress:${Number(video.progress) || 0}%"></span>
      </div>
    </article>
  `;
}

function renderPlatformCard(item) {
  return `
    <article class="platform-card">
      <div class="platform-head">
        <div>
          <span class="top-content-platform">${escapeHtml(item.name)}</span>
          <p>${escapeHtml(item.detail)}</p>
        </div>
        <div class="platform-value">
          ${renderChip(item.chip)}
          <strong>${escapeHtml(item.value)}</strong>
        </div>
      </div>
      <div class="performance-bar platform-bar">
        <span class="performance-fill" style="--progress:${Number(item.progress) || 0}%"></span>
      </div>
    </article>
  `;
}

function renderCaseCard(item) {
  return `
    <article class="results-case-card panel">
      <div class="results-case-head">
        <span class="project-tag">${escapeHtml(item.project)}</span>
        ${renderChip(item.chip)}
      </div>
      <h3 class="card-title">${escapeHtml(item.context)}</h3>
      <div class="results-case-list">
        <div class="results-case-item">
          <strong>Lecture</strong>
          <span>${escapeHtml(item.mission)}</span>
        </div>
        <div class="results-case-item">
          <strong>Support observe</strong>
          <span>${escapeHtml(item.content)}</span>
        </div>
        <div class="results-case-item">
          <strong>Resultat</strong>
          <span>${escapeHtml(item.result)}</span>
        </div>
        <div class="results-case-item">
          <strong>Enseignement</strong>
          <span>${escapeHtml(item.learning)}</span>
        </div>
      </div>
    </article>
  `;
}

function renderChartCard(chart) {
  return `
    <article class="chart-card panel">
      <div class="chart-head">
        <div class="chart-copy">
          <span class="card-eyebrow">${escapeHtml(chart.title)}</span>
          <p>${escapeHtml(chart.context)}</p>
        </div>
        <div class="chart-kpi">
          ${renderChip(chart.chip)}
          <strong>${escapeHtml(chart.highlight)}</strong>
        </div>
      </div>
      <div class="chart-shell">
        ${buildLineChart(chart)}
      </div>
      <div class="chart-callouts">
        ${chart.callouts.map((text) => `<p>${escapeHtml(text)}</p>`).join("")}
      </div>
    </article>
  `;
}

function buildLineChart(chart) {
  const width = 620;
  const height = 300;
  const padding = { top: 24, right: 22, bottom: 38, left: 22 };
  const values = chart.values.map((value) => Number(value) || 0);
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const range = Math.max(maxValue - minValue, 1);
  const usableWidth = width - padding.left - padding.right;
  const usableHeight = height - padding.top - padding.bottom;
  const baseline = height - padding.bottom;
  const accent = chart.accent === "cool" ? "#8EA8C2" : "#C8A76A";
  const softAccent =
    chart.accent === "cool"
      ? "rgba(142, 168, 194, 0.18)"
      : "rgba(200, 167, 106, 0.22)";
  const gradientId = `gradient-${chart.key}`;

  const points = values.map((value, index) => {
    const x =
      padding.left +
      (values.length === 1 ? usableWidth / 2 : (usableWidth / (values.length - 1)) * index);
    const y =
      padding.top +
      usableHeight -
      ((value - minValue) / range) * usableHeight;

    return { x, y, label: chart.labels[index] || "" };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");

  const areaPath = [
    `M ${points[0].x.toFixed(2)} ${baseline.toFixed(2)}`,
    ...points.map((point) => `L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`),
    `L ${points[points.length - 1].x.toFixed(2)} ${baseline.toFixed(2)}`,
    "Z",
  ].join(" ");

  const gridLines = Array.from({ length: 4 }, (_, index) => {
    const y = padding.top + (usableHeight / 3) * index;
    return `<line x1="${padding.left}" y1="${y.toFixed(2)}" x2="${width - padding.right}" y2="${y.toFixed(2)}" stroke="rgba(255,255,255,0.08)" stroke-width="1" />`;
  }).join("");

  const labels = points
    .map(
      (point) => `
        <text x="${point.x.toFixed(2)}" y="${(height - 14).toFixed(2)}" text-anchor="middle" fill="#8F8A80" font-size="11" font-family="Sora, sans-serif">
          ${escapeHtml(point.label)}
        </text>
      `
    )
    .join("");

  const dots = points
    .map(
      (point) => `
        <circle cx="${point.x.toFixed(2)}" cy="${point.y.toFixed(2)}" r="4.5" fill="#050608" stroke="${accent}" stroke-width="2" />
      `
    )
    .join("");

  return `
    <svg class="chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(chart.title)}">
      <defs>
        <linearGradient id="${gradientId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${accent}" stop-opacity="0.32" />
          <stop offset="100%" stop-color="${accent}" stop-opacity="0" />
        </linearGradient>
      </defs>
      <rect x="${padding.left}" y="${padding.top}" width="${usableWidth}" height="${usableHeight}" rx="20" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.04)" />
      ${gridLines}
      <path d="${areaPath}" fill="url(#${gradientId})" />
      <path d="${linePath}" fill="none" stroke="${accent}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
      ${dots}
      ${labels}
      <line x1="${padding.left}" y1="${baseline}" x2="${width - padding.right}" y2="${baseline}" stroke="${softAccent}" stroke-width="1" />
    </svg>
  `;
}

function renderChip(value) {
  if (!value) {
    return "";
  }

  return `<span class="placeholder-chip">${escapeHtml(value)}</span>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
