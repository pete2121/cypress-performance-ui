// Commands to measure how fast each screen loads.
// We open each screen with cy.visit(), so the browser records a real page load.

export const RESULTS_JSON = "cypress/performance/results/maritime-aer-results.json";
export const REPORT_HTML = "cypress/performance/reports/maritime-aer-report.html";

// Slow screens in this test. We check them at the end, so the test does not stop early.
let budgetBreaches = [];

const budgetMs = () => Number(Cypress.env("screenLoadBudgetMs") || 1000);

// Measure the current screen and compare it with the budget.
// If assertBaseline is on, also compare it with old runs (before saving this run).
Cypress.Commands.add("measureScreen", (pageName) => {
  if (Cypress.env("assertBaseline")) {
    cy.assertPageLoadBaseline(pageName, {
      percentile: Number(Cypress.env("baselinePercentile") || 75),
      tolerance: Number(Cypress.env("baselineTolerance") || 10),
      minSamples: Number(Cypress.env("baselineMinSamples") || 10),
      historyDays: Number(Cypress.env("baselineHistoryDays") || 30),
      jsonPath: RESULTS_JSON
    });
  }

  return cy.generatePerformanceReport(REPORT_HTML, pageName, RESULTS_JSON).then(({ rows }) => {
    const duration = rows[rows.length - 1].metrics.duration;
    const limit = budgetMs();
    const over = !Number.isFinite(duration) || duration > limit;

    Cypress.log({
      name: "screen load",
      message: `${pageName}: ${duration} ms (budget ${limit} ms)${over ? " - OVER BUDGET" : ""}`
    });

    if (over) {
      budgetBreaches.push(`${pageName}: ${duration} ms > ${limit} ms`);
    }

    return duration;
  });
});

// Save the time of a request (for example a file upload) in the same results file.
Cypress.Commands.add("recordRequestTiming", (pageName, urlPart, { budget } = {}) => {
  const latestEntry = (win) => win.performance
    .getEntriesByType("resource")
    .filter((e) => e.name.includes(urlPart) && e.responseEnd > 0)
    .pop();

  // The timing can appear a little late, so retry.
  return cy.window({ log: false }).should((win) => {
    expect(latestEntry(win), `resource timing for "${urlPart}"`).to.exist;
  }).then((win) => {
    const entry = latestEntry(win);
    const duration = Number(entry.duration.toFixed(2));
    const row = { pageName, timestamp: new Date().toISOString(), url: entry.name, metrics: { duration } };

    return cy
      .task("readPerformanceHistory", RESULTS_JSON, { log: false })
      .then((existing) => cy.writeFile(RESULTS_JSON, [...existing, row], { log: false }))
      .then(() => {
        const over = budget && duration > budget;
        Cypress.log({ name: "request timing", message: `${pageName}: ${duration} ms${budget ? ` (budget ${budget} ms)` : ""}${over ? " - OVER BUDGET" : ""}` });
        if (over) {
          budgetBreaches.push(`${pageName}: ${duration} ms > ${budget} ms`);
        }

        return duration;
      });
  });
});

Cypress.Commands.add("resetScreenLoadBudgets", () => {
  budgetBreaches = [];
});

// By default, slow screens only show a warning.
// Use --env failOnBudget=true to fail the test.
Cypress.Commands.add("assertScreenLoadBudgets", () => {
  cy.then(() => {
    if (!budgetBreaches.length) {
      return;
    }
    if (Cypress.env("failOnBudget")) {
      expect(budgetBreaches, `Screens over budget:\n${budgetBreaches.join("\n")}`).to.be.empty;
    } else {
      Cypress.log({ name: "WARNING", message: `Screens over budget (not failing, failOnBudget=false):\n${budgetBreaches.join("\n")}` });
    }
  });
});
