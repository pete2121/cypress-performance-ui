function toFixedNumber(value, digits = 2) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return Number(value.toFixed(digits));
}


function generateHtmlReport(rows) {
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

  const chartData = JSON.stringify(safeRows);

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

    <div class="footer-credit"><strong>Developed by Petros Plakogiannis</strong></div>
  </div>

  <script>
    const data = ${chartData};

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

          const html =
            generateHtmlReport(result.rows);

          return cy
            .writeFile(
              filePath,
              html,
              {
                log: false,
              }
            )
            .then(() => {
              return {
                filePath,
                jsonPath,
                rows: result.rows,
                html,
                message:
                  "Performance report generated successfully",
              };
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