import AerSectionPage from "./AerSectionPage";

// Section 5: Additional documents.
// The file uploads at once. Continue works only after the upload ends.
class AdditionalDocumentsPage extends AerSectionPage {
  constructor() {
    super({ path: "additional-documents", heading: /upload any additional documents or information/i, metricName: "AER 5 Additional documents" });
  }

  uploadDocument(fixturePath) {
    cy.intercept("POST", "**/task-attachments/upload").as("documentUpload");
    cy.get("#exist-option0").check();
    cy.get("#documents").selectFile(fixturePath, { force: true });
    cy.wait("@documentUpload", { timeout: 60000 }).its("response.statusCode").should("eq", 200);
    return cy.recordRequestTiming("AER 5a Upload additional document (request)", "/task-attachments/upload", { budget: 20000 });
  }

  complete(taskId, fixturePath) {
    this.open(taskId);
    this.uploadDocument(fixturePath);
    this.clickContinue();
    return this.confirmAndContinue();
  }
}

export default new AdditionalDocumentsPage();
