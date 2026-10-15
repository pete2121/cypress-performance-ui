import AerSectionPage from "./AerSectionPage";

// Section 4: Ships and emission details. Upload ships with an XML file.
class ShipsAndEmissionsPage extends AerSectionPage {
  constructor() {
    super({ path: "emissions", heading: /add ships and emission details/i, metricName: "AER 4 Ships and emission details list" });
  }

  openUpload(taskId) {
    cy.visit(this.url(taskId, "emissions/upload-ships"));
    this.waitUntilLoaded(/upload the ships and emission details file/i);
    return cy.measureScreen("AER 4a Upload ships file");
  }

  // Wait for the ships table before we click "Confirm and upload".
  waitForShipsPreview(shipCount) {
    cy.contains("main h2, main h3", /check the ships to upload/i, { timeout: 60000 }).should("be.visible");
    return cy.get("main table tbody tr").should("have.length", shipCount);
  }

  uploadShipsFile(fixturePath, shipCount) {
    cy.intercept("POST", "**/tasks/actions").as("saveShips");
    cy.get("main input[type=file]").selectFile(fixturePath, { force: true });
    this.waitForShipsPreview(shipCount);
    this.clickButton(/confirm and upload/i);
    cy.wait("@saveShips", { timeout: 60000 }).its("response.statusCode").should("eq", 200);
    this.assertSuccessBanner(/ships and emission details file has been uploaded/i);
    return cy.recordRequestTiming("AER 4b Save uploaded ships (request)", "/tasks/actions", { budget: 20000 });
  }

  assertShipCount(count) {
    return cy.get("main a[href*='/aer/emissions/ships/']").should("have.length.at.least", Math.min(count, 10));
  }

  complete(taskId, fixturePath, shipCount) {
    this.open(taskId);
    this.openUpload(taskId);
    this.uploadShipsFile(fixturePath, shipCount);
    this.waitUntilLoaded();
    this.assertShipCount(shipCount);
    this.clickContinue();
    // The button is below the ships table.
    return this.confirmAndContinue();
  }
}

export default new ShipsAndEmissionsPage();
