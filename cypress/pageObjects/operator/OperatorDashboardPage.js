import BasePage from "../BasePage";

// Operator dashboard with the task list.
class OperatorDashboardPage extends BasePage {
  constructor() {
    super({ heading: /^\s*tasks\s*$/i, metricName: "Operator dashboard" });
  }

  open() {
    return this.visitAndMeasure("/maritime/dashboard");
  }

  // Get the task id of the AER for this year.
  getAerTaskId(year) {
    return cy.contains("main a", new RegExp(`complete\\s+${year}\\s+emissions\\s+report`, "i"), { timeout: 60000 })
      .invoke("attr", "href")
      .then((href) => {
        const match = String(href).match(/\/tasks\/(\d+)/);
        if (!match) {
          throw new Error(`No AER task id in link: ${href}`);
        }
        return match[1];
      });
  }
}

export default new OperatorDashboardPage();
