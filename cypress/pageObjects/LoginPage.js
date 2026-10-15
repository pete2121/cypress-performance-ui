class LoginPage {
  visit() {
    return cy.visit(Cypress.env("loginUrl"), { failOnStatusCode: false });
  }

  fillUsername(username) {
    return cy.get("input[name='username'], input[type='email']").first().clear().type(username, {
      log: false
    });
  }

  fillPassword(password) {
    return cy.get("input[name='password'], input[type='password']").first().clear().type(password, {
      log: false
    });
  }

  submit() {
    return cy.get("button[type='submit'], input[type='submit']").first().click({ force: true });
  }

  login(username, password) {
    this.fillUsername(username);
    this.fillPassword(password);
    this.submit();
  }
}

export default new LoginPage();
