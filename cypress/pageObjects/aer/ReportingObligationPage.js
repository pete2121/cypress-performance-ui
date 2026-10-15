import AerSectionPage from "./AerSectionPage";

// Section 1: Reporting obligation.
class ReportingObligationPage extends AerSectionPage {
  constructor() {
    super({ path: "reporting-obligation", heading: /reporting obligation requirement/i, metricName: "AER 1 Reporting obligation" });
  }

  selectReportingRequired(required = true) {
    return cy.get(required ? "#reportingRequired-option0" : "#reportingRequired-option1").check();
  }

  complete(taskId) {
    this.open(taskId);
    this.selectReportingRequired(true);
    this.clickContinue();
    return this.confirmAndContinue();
  }
}

export default new ReportingObligationPage();
