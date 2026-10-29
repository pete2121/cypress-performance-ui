function toFixedNumber(value, digits = 2) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return Number(value.toFixed(digits));
}


const DEFAULT_BASELINE_RESULTS_PATH = "cypress/performance/results/baseline-results.json";
const DEFAULT_REPORT_PATH = "cypress/performance/reports/performance-report.html";
const DEFAULT_NETWORK_PATH = "cypress/performance/results/network-results.json";
const DEFAULT_HISTORY_PATH = "cypress/performance/results/performance-results.json";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function generateHtmlReport(rows, baselineResults = [], networkResults = []) {
  const safeRows = rows.map((row) => ({
    pageName: row.pageName,
    timestamp: row.timestamp,
    duration: row.metrics?.duration ?? row.duration ?? null,
    ttfb: row.metrics?.responseStart ?? row.ttfb ?? null,
    domContentLoaded: row.metrics?.domContentLoaded ?? row.domContentLoaded ?? null,
    loadEventEnd: row.metrics?.loadEventEnd ?? row.loadEventEnd ?? null,
    firstContentfulPaint: row.metrics?.firstContentfulPaint ?? row.firstContentfulPaint ?? null
  }));

  const htmlRows = safeRows
    .map(
      (row) => `
        <tr>
          <td>${row.timestamp}</td>
          <td>${row.pageName}</td>
          <td>${row.duration ?? "-"}</td>
          <td>${row.ttfb ?? "-"}</td>
          <td>${row.firstContentfulPaint ?? "-"}</td>
          <td>${row.domContentLoaded ?? "-"}</td>
          <td>${row.loadEventEnd ?? "-"}</td>
        </tr>`
    )
    .join("");

  const chartData = JSON.stringify(safeRows).replace(/</g, "\\u003c");
  const results = Array.isArray(baselineResults) ? baselineResults : [];
  const passCount = results.filter((r) => r.status === "PASS").length;
  const failCount = results.filter((r) => r.status === "FAIL").length;
  const baselineHtmlRows = results.slice().reverse().map((r) => `
    <tr>
      <td>${escapeHtml(r.pageName)}</td>
      <td>${Number(r.baseline).toFixed(2)} ms</td>
      <td>${Number(r.actual).toFixed(2)} ms <strong style="color:${r.status === "PASS" ? "#16803c" : "#b42318"}">${escapeHtml(r.status)}</strong></td>
      <td>${escapeHtml(r.timestamp)}</td>
    </tr>`).join("");

  const networkHtmlRows = (Array.isArray(networkResults) ? networkResults : [])
    .slice().sort((a, b) => b.duration - a.duration)
    .map((r) => {
      const type = r.type || (r.initiatorType === "xmlhttprequest" ? "XHR" : r.initiatorType === "fetch" ? "Fetch" : "Other");
      return `<tr data-network-type="${escapeHtml(type)}"><td>${escapeHtml(r.timestamp)}</td><td>${escapeHtml(r.label)}</td><td>${escapeHtml(type)}</td><td class="network-url" title="${escapeHtml(r.url)}">${escapeHtml(r.url)}</td><td class="network-duration">${Number(r.duration).toFixed(2)} ms</td><td class="network-status" style="color:${r.slow ? "#b42318" : "#16803c"}">${r.slow ? "SLOW" : "OK"}</td></tr>`;
    }).join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Page Load Performance Report</title>
  <script src="https://cdn.plot.ly/plotly-2.35.2.min.js"></script>
  <style>
    :root {
      --bg: #f3f8ff;
      --panel: #ffffff;
      --ink: #0f2d3a;
      --accent: #087e8b;
      --accent2: #f18f01;
      --muted: #6b7c85;
      --border: #d8e3ea;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
      color: var(--ink);
      background:
        radial-gradient(circle at 10% 20%, #d8f0ff, transparent 45%),
        radial-gradient(circle at 85% 10%, #ffe9cc, transparent 40%),
        var(--bg);
    }
    .wrap {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }
    h1 {
      margin: 14px 0 12px;
      font-size: 30px;
      letter-spacing: 0.2px;
    }
    p {
      color: var(--muted);
      margin-top: 0;
    }
    .panel {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 16px;
      margin-bottom: 16px;
      box-shadow: 0 10px 24px rgba(8, 36, 46, 0.07);
    }
    .network-table { width: 100%; table-layout: fixed; border-collapse: collapse; }
    .network-table th, .network-table td { padding: 10px 8px; vertical-align: top; overflow-wrap: anywhere; word-break: normal; }
    .network-table .network-url { overflow-wrap: anywhere; word-break: break-word; font-size: 12px; line-height: 1.5; }
    .network-table .network-duration, .network-table .network-status { white-space: nowrap; overflow-wrap: normal; }
    .network-toolbar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin: 12px 0; }
    .network-toolbar select { padding: 7px 10px; border: 1px solid var(--border); border-radius: 8px; background: white; color: var(--ink); }
    @media (max-width: 700px) { .network-table { min-width: 700px; } }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
      background: white;
    }
    th, td {
      border-bottom: 1px solid var(--border);
      text-align: left;
      padding: 8px;
    }
    th {
      font-weight: 700;
      background: #f7fbff;
    }
    @media (max-width: 900px) {
      .grid { grid-template-columns: 1fr; }
    }
    .footer-credit {
      margin-top: 18px;
      font-size: 12px;
      color: #7d8a92;
      text-align: center;
      letter-spacing: 0.2px;
    }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>Page Load Performance</h1>
    <p>Generated from Cypress performance runs.</p>

    <div class="grid">
      <div class="panel"><div id="durationChart"></div></div>
      <div class="panel"><div id="ttfbChart"></div></div>
      <div class="panel"><div id="fcpChart"></div></div>
      <div class="panel"><div id="domChart"></div></div>
    </div>

    <div class="panel">
      <div id="dailyDurationBarChart"></div>
    </div>

    <div class="panel">
      <h2>Raw Measurements</h2>
      <table>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Page</th>
            <th>Duration (ms)</th>
            <th>TTFB (ms)</th>
            <th>FCP (ms)</th>
            <th>DOMContentLoaded (ms)</th>
            <th>Load Event End (ms)</th>
          </tr>
        </thead>
        <tbody>${htmlRows}</tbody>
      </table>
    </div>

    <div class="grid">
      <div class="panel">
        <h2>Historical Baseline Results</h2>
        <p>Actual values are compared against the baseline plus the configured tolerance.</p>
        <div style="overflow-x:auto">
          <table>
            <thead><tr><th>Page</th><th>Baseline</th><th>Actual / Status</th><th>Date</th></tr></thead>
            <tbody>${baselineHtmlRows || '<tr><td colspan="4">No baseline comparisons yet.</td></tr>'}</tbody>
          </table>
        </div>
      </div>
      <div class="panel">
        <h2>PASS vs FAIL</h2>
        <div id="baselinePieChart"></div>
      </div>
    </div>

    <div class="panel">
      <h2>Network Requests</h2>
      <p>Browser resource timings captured during Cypress actions.</p>
      <div class="network-toolbar">
        <label for="networkTypeFilter">Resource type:</label>
        <select id="networkTypeFilter" aria-label="Filter network requests by type">
          <option value="All">All</option>
          <option value="XHR">XHR</option>
          <option value="Fetch">Fetch</option>
          <option value="Image">Images</option>
          <option value="Script">Scripts</option>
          <option value="CSS">CSS</option>
          <option value="Font">Fonts</option>
          <option value="Other">Other</option>
        </select>
        <span id="networkCount" style="color:var(--muted);font-size:13px"></span>
      </div>
      <div style="overflow-x:auto">
        <table class="network-table">
          <colgroup><col style="width:17%"><col style="width:13%"><col style="width:9%"><col style="width:35%"><col style="width:14%"><col style="width:12%"></colgroup>
          <thead><tr><th>Timestamp</th><th>Action</th><th>Type</th><th>Request URL</th><th>Duration</th><th>Status</th></tr></thead>
          <tbody id="networkTableBody">${networkHtmlRows || '<tr><td colspan="6">No network measurements yet.</td></tr>'}</tbody>
        </table>
      </div>
    </div>
    </div>

    <div class="footer-credit"><strong>Developed by Petros Plakogiannis</strong></div>
  </div>

  <script>
    const networkFilter = document.getElementById("networkTypeFilter");
    const networkRows = Array.from(document.querySelectorAll("#networkTableBody tr[data-network-type]"));
    function applyNetworkFilter() {
      const selected = networkFilter.value;
      let visible = 0;
      networkRows.forEach((row) => {
        const matches = selected === "All" || row.dataset.networkType === selected;
        row.hidden = !matches;
        if (matches) visible++;
      });
      document.getElementById("networkCount").textContent = visible + " request(s)";
    }
    networkFilter.addEventListener("change", applyNetworkFilter);
    applyNetworkFilter();
    const data = ${chartData};
    const baselineCounts = [${passCount}, ${failCount}];
    if (baselineCounts[0] + baselineCounts[1] > 0) {
      Plotly.newPlot("baselinePieChart", [{
        labels: ["PASS", "FAIL"],
        values: baselineCounts,
        type: "pie",
        marker: { colors: ["#16803c", "#b42318"] },
        textinfo: "label+percent"
      }], { margin: { t: 10, r: 10, b: 10, l: 10 }, paper_bgcolor: "white" });
    } else {
      document.getElementById("baselinePieChart").textContent = "No baseline comparisons yet.";
    }

    function buildSeries(metricKey) {
      return {
        x: data.map((d) => d.timestamp),
        y: data.map((d) => d[metricKey]),
        text: data.map((d) => d.pageName),
        mode: "lines+markers",
        type: "scatter"
      };
    }

    function buildDailyAverages(metricKey) {
      const grouped = data.reduce((acc, row) => {
        const metricValue = row[metricKey];
        if (typeof metricValue !== "number") {
          return acc;
        }

        const day = new Date(row.timestamp).toISOString().slice(0, 10);
        if (!acc[day]) {
          acc[day] = { sum: 0, count: 0 };
        }

        acc[day].sum += metricValue;
        acc[day].count += 1;
        return acc;
      }, {});

      const days = Object.keys(grouped).sort();
      const averages = days.map((day) => Number((grouped[day].sum / grouped[day].count).toFixed(2)));

      return { days, averages };
    }

    const commonLayout = {
      margin: { t: 30, r: 20, l: 50, b: 50 },
      paper_bgcolor: "white",
      plot_bgcolor: "white",
      xaxis: { title: "Run Time" },
      yaxis: { title: "Milliseconds" }
    };

    Plotly.newPlot("durationChart", [buildSeries("duration")], {
      ...commonLayout,
      title: "Total Duration"
    });

    Plotly.newPlot("ttfbChart", [buildSeries("ttfb")], {
      ...commonLayout,
      title: "TTFB"
    });

    Plotly.newPlot("fcpChart", [buildSeries("firstContentfulPaint")], {
      ...commonLayout,
      title: "First Contentful Paint"
    });

    Plotly.newPlot("domChart", [buildSeries("domContentLoaded")], {
      ...commonLayout,
      title: "DOMContentLoaded"
    });

    const dailyDuration = buildDailyAverages("duration");
    Plotly.newPlot(
      "dailyDurationBarChart",
      [
        {
          x: dailyDuration.days,
          y: dailyDuration.averages,
          type: "bar",
          marker: { color: "#087e8b" }
        }
      ],
      {
        ...commonLayout,
        title: "Average Total Duration by Date",
        xaxis: { title: "Date" },
        yaxis: { title: "Milliseconds" }
      }
    );
  </script>
</body>
</html>`;
}

function calculatePercentile(values, percentile) {
  if (!values.length) {
    throw new Error("Cannot calculate percentile from empty values");
  }

  const sorted = [...values].sort((a, b) => a - b);
  const position = ((sorted.length - 1) * percentile) / 100;

  const lower = Math.floor(position);
  const upper = Math.ceil(position);

  if (lower === upper) {
    return sorted[lower];
  }

  const weight = position - lower;

  return sorted[lower] +
    (sorted[upper] - sorted[lower]) * weight;
}



function updateDashboardFromHistory(jsonPath, reportPath, baselinePath, networkPath = DEFAULT_NETWORK_PATH) {
  return cy.task("readPerformanceHistory", jsonPath, { log: false }).then((history) =>
    cy.task("readPerformanceHistory", baselinePath, { log: false }).then((results) => {
      return cy.task("readPerformanceHistory", networkPath, { log: false }).then((network) => {
        const html = generateHtmlReport(history || [], results || [], network || []);
        return cy.writeFile(reportPath, html, { log: false }).then(() => html);
      });
    })
  );
}

function registerPerformanceCommands() {
  if (typeof Cypress === "undefined") {
    return;
  }

  // ----------------------------------------
  // Collect metrics
  // ----------------------------------------

  Cypress.Commands.add(
    "collectPageLoadMetrics",
    (pageName = "page") => {
      return cy.window({ log: false }).then((win) => {
        const performance = win.performance || null;

        const navigationEntry =
          performance &&
          typeof performance.getEntriesByType === "function"
            ? performance.getEntriesByType("navigation")[0] || null
            : null;

        const paintEntries =
          performance &&
          typeof performance.getEntriesByType === "function"
            ? performance.getEntriesByType("paint") || []
            : [];

        const firstContentfulPaint =
          paintEntries.find(
            (entry) =>
              entry.name === "first-contentful-paint"
          ) || null;

        return {
          pageName,
          timestamp: new Date().toISOString(),
          url: win.location.href,

          metrics: {
            duration: toFixedNumber(
              navigationEntry?.duration
            ),

            responseStart: toFixedNumber(
              navigationEntry?.responseStart
            ),

            domContentLoaded: toFixedNumber(
              navigationEntry?.domContentLoadedEventEnd
            ),

            loadEventEnd: toFixedNumber(
              navigationEntry?.loadEventEnd
            ),

            firstContentfulPaint: toFixedNumber(
              firstContentfulPaint?.startTime
            ),

            navigationStart: toFixedNumber(
              navigationEntry?.startTime
            ),
          },
        };
      });
    }
  );


  // ----------------------------------------
  // W3C timings
  // ----------------------------------------

  Cypress.Commands.add(
    "measureW3CTimings",
    (pageName = "page") => {
      return cy
        .collectPageLoadMetrics(pageName)
        .then((metrics) => {
          return {
            pageName: metrics.pageName,
            timestamp: metrics.timestamp,
            url: metrics.url,

            w3cTimings: {
              navigationStart:
                metrics.metrics.navigationStart,

              responseStart:
                metrics.metrics.responseStart,

              domContentLoaded:
                metrics.metrics.domContentLoaded,

              loadEventEnd:
                metrics.metrics.loadEventEnd,

              firstContentfulPaint:
                metrics.metrics.firstContentfulPaint,

              duration:
                metrics.metrics.duration,
            },
          };
        });
    }
  );


  // ----------------------------------------
  // Save JSON history
  // ----------------------------------------

  Cypress.Commands.add(
    "savePerformanceMetrics",
    (
      pageName = "page",
      jsonPath =
        "cypress/performance/results/performance-results.json"
    ) => {
      return cy
        .collectPageLoadMetrics(pageName)
        .then((metric) => {

          return cy
            .task(
              "readPerformanceHistory",
              jsonPath,
              {
                log: false,
              }
            )
            .then((existingRows) => {

              const rows =
                Array.isArray(existingRows)
                  ? existingRows
                  : [];

              const updatedRows = [
                ...rows,
                metric,
              ];

              return cy
                .writeFile(
                  jsonPath,
                  updatedRows,
                  {
                    log: false,
                  }
                )
                .then(() => {
                  return {
                    filePath: jsonPath,
                    metric,
                    rows: updatedRows,
                    message:
                      "Performance metrics saved successfully",
                  };
                });
            });
        });
    }
  );


  // Capture browser resource timings after the application action has completed.
  // Call clearNetworkTimings() before the action to isolate that interaction.
  Cypress.Commands.add("clearNetworkTimings", () =>
    cy.window().then((win) => win.performance.clearResourceTimings())
  );

  Cypress.Commands.add("collectNetworkMetrics", (label = "Current action", options = {}) => {
    const { threshold = 500, jsonPath = DEFAULT_NETWORK_PATH,
      reportPath = DEFAULT_REPORT_PATH, historyPath = DEFAULT_HISTORY_PATH,
      baselineResultsPath = DEFAULT_BASELINE_RESULTS_PATH } = options;
    if (!Number.isFinite(threshold) || threshold < 0) {
      throw new Error("collectNetworkMetrics: threshold must be a non-negative number");
    }
    return cy.window().then((win) => {
      const timestamp = new Date().toISOString();
      const entries = win.performance.getEntriesByType("resource")
        .map((r) => {
          const initiator = String(r.initiatorType || "").toLowerCase();
          const type = ({ xmlhttprequest: "XHR", fetch: "Fetch", img: "Image", image: "Image",
            script: "Script", link: "CSS", css: "CSS", font: "Font" })[initiator] || "Other";
          return { timestamp, label, url: r.name, initiatorType: initiator, type,
            duration: toFixedNumber(r.duration), slow: r.duration > threshold };
        });
      return cy.task("readPerformanceHistory", jsonPath, { log: false }).then((history) => {
        const rows = [...(Array.isArray(history) ? history : []), ...entries];
        return cy.writeFile(jsonPath, rows, { log: false })
          .then(() => updateDashboardFromHistory(historyPath, reportPath, baselineResultsPath, jsonPath))
          .then(() => ({ label, threshold, entries, filePath: jsonPath, reportPath }));
      });
    });
  });

  // ----------------------------------------
  // Generate HTML report
  // ----------------------------------------

  Cypress.Commands.add(
    "generatePerformanceReport",
    (
      filePath =
        "cypress/performance/reports/performance-report.html",

      pageName = "Current page",

      jsonPath =
        "cypress/performance/results/performance-results.json"
    ) => {
      return cy
        .savePerformanceMetrics(
          pageName,
          jsonPath
        )
        .then((result) => {
          return cy.task("readPerformanceHistory", DEFAULT_BASELINE_RESULTS_PATH, { log: false })
            .then((baselineResults) => {
              return cy.task("readPerformanceHistory", DEFAULT_NETWORK_PATH, { log: false }).then((network) => {
                const html = generateHtmlReport(result.rows, baselineResults || [], network || []);
                return cy.writeFile(filePath, html, { log: false }).then(() => ({
                filePath,
                jsonPath,
                rows: result.rows,
                html,
                message: "Performance report generated successfully"
                }));
              });
            });
        });
    }
  );

    // ----------------------------------------
  // Assertion For Page Load from Baseline
  // ----------------------------------------


  Cypress.Commands.add(
  "assertPageLoadBaseline",
  (pageName, options = {}) => {
    const {
      percentile = 75,
      historyDays = 30,
      minSamples = 10,
      tolerance = 10,
      jsonPath = DEFAULT_HISTORY_PATH,
      baselineResultsPath = DEFAULT_BASELINE_RESULTS_PATH,
      reportPath = DEFAULT_REPORT_PATH
    } = options;

    if (!pageName || typeof pageName !== "string") {
      throw new Error("pageName must be a non-empty string");
    }

    if (
      !Number.isFinite(percentile) ||
      percentile < 0 ||
      percentile > 100
    ) {
      throw new Error("percentile must be between 0 and 100");
    }

    if (!Number.isFinite(historyDays) || historyDays <= 0) {
      throw new Error("historyDays must be greater than 0");
    }

    if (!Number.isInteger(minSamples) || minSamples < 1) {
      throw new Error("minSamples must be a positive integer");
    }

    if (!Number.isFinite(tolerance) || tolerance < 0) {
      throw new Error("tolerance must be zero or greater");
    }

    const now = Date.now();
    const cutoff = now - historyDays * 24 * 60 * 60 * 1000;

    // Read existing history before collecting current metrics.
    return cy
      .task("readPerformanceHistory", jsonPath, { log: false })
      .then((rows) => {
        const durations = rows
          .filter((row) => {
            const timestamp = Date.parse(row.timestamp);
            const duration = row.metrics?.duration;

            return (
              row.pageName === pageName &&
              Number.isFinite(timestamp) &&
              timestamp >= cutoff &&
              timestamp < now &&
              typeof duration === "number" &&
              Number.isFinite(duration) &&
              duration >= 0
            );
          })
          .map((row) => row.metrics.duration);

        if (durations.length < minSamples) {
          throw new Error(
            `[Performance Baseline] Insufficient history for "${pageName}". ` +
            `Found ${durations.length} samples; need ${minSamples}.`
          );
        }

        const baseline = calculatePercentile(durations, percentile);
        const threshold = baseline * (1 + tolerance / 100);

        return cy.collectPageLoadMetrics(pageName).then((current) => {
          const actual = current.metrics.duration;

          if (!Number.isFinite(actual) || actual < 0) {
            throw new Error(
              `[Performance Baseline] Invalid current duration: ${actual}`
            );
          }

          Cypress.log({
            name: "performance baseline",
            message:
              `${pageName}: ${actual.toFixed(2)} ms | ` +
              `p${percentile}: ${baseline.toFixed(2)} ms | ` +
              `threshold: ${threshold.toFixed(2)} ms | ` +
              `samples: ${durations.length}`
          });

          const status = actual <= threshold ? "PASS" : "FAIL";
          const comparison = {
            pageName,
            timestamp: current.timestamp,
            actual,
            baseline,
            threshold,
            percentile,
            tolerance,
            sampleCount: durations.length,
            status
          };

          // Save both PASS and FAIL before the assertion can throw.
          return cy.task("readPerformanceHistory", baselineResultsPath, { log: false })
            .then((existing) => {
              const updated = [...(Array.isArray(existing) ? existing : []), comparison];
              return cy.writeFile(baselineResultsPath, updated, { log: false });
            })
            .then(() => updateDashboardFromHistory(jsonPath, reportPath, baselineResultsPath))
            .then(() => {
              expect(
                actual,
                `Page Load for "${pageName}" compared against historical ` +
                `p${percentile} + ${tolerance}% ` +
                `(${threshold.toFixed(2)} ms)`
              ).to.be.at.most(threshold);

              return {
                pageName,
                actual,
                baseline,
                threshold,
                percentile,
                tolerance,
                sampleCount: durations.length,
                status
              };
            });
        });
      });
  }
);


  // ----------------------------------------
  // Clear history
  // ----------------------------------------

  Cypress.Commands.add(
    "clearPerformanceHistory",
    (
      jsonPath =
        "cypress/performance/results/performance-results.json"
    ) => {
      return cy.task(
        "clearPerformanceHistory",
        jsonPath,
        {
          log: false,
        }
      );
    }
  );
}


if (
  typeof window !== "undefined" &&
  window.Cypress
) {
  registerPerformanceCommands();
}


module.exports = {
  registerPerformanceCommands,
  generateHtmlReport,
};


module.exports.default = {
  registerPerformanceCommands,
  generateHtmlReport,
};