import BasePage from "../BasePage";

// Terms page. It shows on the first sign-in.
class TermsAndConditionsPage extends BasePage {
  constructor() {
    super({ heading: /terms and conditions/i, metricName: "Operator terms and conditions" });
  }

  // Accept the terms only if the page shows.
  acceptIfShown() {
    return cy.get("main h1", { timeout: 60000 }).should("be.visible").invoke("text").then((heading) => {
      if (!/terms and conditions/i.test(heading)) {
        return;
      }
      cy.get("#terms-0").check();
      this.clickButton(/accept and continue/i);
      cy.location("pathname", { timeout: 60000 }).should("not.include", "/terms");
    });
  }
}

export default new TermsAndConditionsPage();
