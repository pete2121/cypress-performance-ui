class LandingPage {
  visit() {
    return cy.visit(Cypress.env("targetUrl"), { failOnStatusCode: false });
  }

  isVisible() {
    return cy.location("href").should("include", "/landing");
  }

  continueToLogin() {
    // Simple selector for now.
    return cy.contains("a,button", /sign in|login|continue/i).first().click({ force: true });
  }
}

export default new LandingPage();
