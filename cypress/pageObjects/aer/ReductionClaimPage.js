import AerSectionPage from "./AerSectionPage";

// Section 7: Reduction claim. The test answers No.
class ReductionClaimPage extends AerSectionPage {
  constructor() {
    super({ path: "smf", heading: /emissions reduction claim/i, metricName: "AER 7 Reduction claim" });
  }

  selectNoClaim() {
    return cy.get("#exist-option1").check();
  }

  complete(taskId) {
    this.open(taskId);
    this.selectNoClaim();
    this.clickContinue();
    return this.confirmAndContinue();
  }
}

export default new ReductionClaimPage();
