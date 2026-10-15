import AerSectionPage from "./AerSectionPage";

// Section 2: Operator details, legal status and company details.
class OperatorDetailsPage extends AerSectionPage {
  constructor() {
    super({ path: "operator-details", heading: /check maritime operator details/i, metricName: "AER 2 Operator details" });
  }

  selectLegalStatusCompany() {
    this.waitUntilLoaded(/legal status of your organisation/i);
    return cy.get("#legalStatusType-option0").check();
  }

  fillCompanyDetails({ registrationNumber }) {
    this.waitUntilLoaded(/enter company details/i);
    cy.get("#registrationNumber").clear().type(registrationNumber);
    return cy.get("#sameAsContactAddress-0").check({ force: true });
  }

  complete(taskId, company) {
    this.open(taskId);
    this.clickContinue();
    this.selectLegalStatusCompany();
    this.clickContinue();
    this.fillCompanyDetails(company);
    this.clickContinue();
    return this.confirmAndContinue();
  }
}

export default new OperatorDetailsPage();
