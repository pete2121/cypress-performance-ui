import AerSectionPage from "./AerSectionPage";

// Section 6: Aggregated data. Upload with an XML file.
// It opens after section 4 is completed.
class AggregatedDataPage extends AerSectionPage {
  constructor() {
    super({ path: "aggregated-data", heading: /aggregated data for ships/i, metricName: "AER 6 Aggregated data" });
  }

  openUpload(taskId) {
    cy.visit(this.url(taskId, "aggregated-data/upload-aggregated-data"));
    this.waitUntilLoaded(/upload the aggregated data for ships file/i);
    return cy.measureScreen("AER 6a Upload aggregated data file");
  }

  // Wait for the table before we click "Confirm and upload".
  uploadAggregatedDataFile(fixturePath) {
    cy.intercept("POST", "**/tasks/actions").as("saveAggregatedData");
    cy.get("main input[type=file]").selectFile(fixturePath, { force: true });
    cy.get("main table tbody tr", { timeout: 60000 }).should("have.length.at.least", 1);
    this.clickButton(/confirm and upload/i);
    cy.wait("@saveAggregatedData", { timeout: 60000 }).its("response.statusCode").should("eq", 200);
    this.assertSuccessBanner(/aggregated data file has been uploaded/i);
    return cy.recordRequestTiming("AER 6b Save uploaded aggregated data (request)", "/tasks/actions", { budget: 20000 });
  }

  complete(taskId, fixturePath) {
    this.open(taskId);
    this.openUpload(taskId);
    this.uploadAggregatedDataFile(fixturePath);
    this.waitUntilLoaded();
    this.clickContinue();
    return this.confirmAndContinue();
  }
}

export default new AggregatedDataPage();
