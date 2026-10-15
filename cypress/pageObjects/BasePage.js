// Common code for all maritime pages.
export default class BasePage {
  constructor({ heading, metricName } = {}) {
    // Page heading (h1). Shows the page is ready.
    this.heading = heading;
    // Screen name in the report.
    this.metricName = metricName;
  }

  // Wait until the heading is shown.
  waitUntilLoaded(heading = this.heading) {
    const h1 = cy.get("main h1", { timeout: 60000 }).should("be.visible");
    return heading ? h1.and(($h) => expect($h.text()).to.match(heading instanceof RegExp ? heading : new RegExp(heading, "i"))) : h1;
  }

  // Open the page, wait for it, then save its load time.
  visitAndMeasure(path) {
    cy.visit(path);
    this.waitUntilLoaded();
    return this.metricName ? cy.measureScreen(this.metricName) : cy.wrap(null);
  }

  // Wait for the button to be enabled, then click it.
  // Use --env stepDelayMs=1500 to slow down the test and watch it.
  clickButton(text) {
    const delay = Number(Cypress.env("stepDelayMs") || 0);
    if (delay > 0) {
      cy.wait(delay, { log: false });
    }
    return cy.contains("main button, main a.govuk-button, main input[type=submit]", text, { timeout: 30000 })
      .should("be.visible")
      .and("not.be.disabled")
      .click();
  }

  clickContinue() {
    return this.clickButton(/^\s*continue\s*$/i);
  }

  assertCheckYourAnswers() {
    return this.waitUntilLoaded(/check your answers/i);
  }

  confirmAndContinue() {
    this.assertCheckYourAnswers();
    return this.clickButton(/confirm and continue/i);
  }

  assertSuccessBanner(text) {
    return cy.contains(".govuk-notification-banner--success, .govuk-notification-banner", text, { timeout: 60000 }).should("be.visible");
  }
}
