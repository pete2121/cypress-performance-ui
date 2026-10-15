import AerSectionPage from "./AerSectionPage";

// Section 3: Monitoring plan changes.
class MonitoringPlanChangesPage extends AerSectionPage {
  constructor() {
    super({ path: "monitoring-plan-changes", heading: /changes to the emissions monitoring plan/i, metricName: "AER 3 Monitoring plan changes" });
  }

  selectNoChanges() {
    return cy.get("#changesExist-option1").check();
  }

  complete(taskId) {
    this.open(taskId);
    this.selectNoChanges();
    this.clickContinue();
    return this.confirmAndContinue();
  }
}

export default new MonitoringPlanChangesPage();
