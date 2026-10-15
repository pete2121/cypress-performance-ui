// Login commands.

// Open the landing page and click the Maritime start button.
Cypress.Commands.add("openMaritimeLogin", () => {
  cy.visit(Cypress.env("targetUrl"), { failOnStatusCode: false });
  cy.get("main#main-content", { timeout: 30000 }).within(() => {
    cy.contains("h2.govuk-heading-m", /^maritime$/i)
      .should("be.visible")
      .nextAll("a.govuk-button.govuk-button--start")
      .first()
      .scrollIntoView()
      .click({ force: true });
  });
});

// Sign in with Keycloak (it is on a different domain).
Cypress.Commands.add("loginToMaritime", (username, password) => {
  cy.openMaritimeLogin();

  cy.origin(
    new URL(Cypress.env("loginUrl")).origin,
    { args: { username, password } },
    ({ username, password }) => {
      cy.get("input[name='username'], input[type='email']").first().clear().type(username, { log: false });
      cy.get("input[name='password'], input[type='password']").first().clear().type(password, { log: false });
      cy.get("button[type='submit'], input[type='submit']").first().click({ force: true });
    }
  );

  cy.location("pathname", { timeout: 60000 }).should("include", "/maritime");
});

Cypress.Commands.add("signOut", () => {
  cy.contains("a, button", /sign out/i, { timeout: 30000 }).click({ force: true });
});
