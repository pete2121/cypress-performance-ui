import AerSectionPage from "./AerSectionPage";

// Section 8: Emissions summary. The test does not send the report.
class TotalEmissionsPage extends AerSectionPage {
  constructor() {
    super({ path: "total-emissions", heading: /check your answers/i, metricName: "AER 8 Emissions summary for all ships" });
  }

  assertSummaryShown() {
    return cy.contains("main", /total maritime emissions/i).should("be.visible");
  }

  complete(taskId) {
    this.open(taskId);
    this.assertSummaryShown();
    return this.confirmAndContinue();
  }
}

export default new TotalEmissionsPage();
