class DashBoardPage {
  goToCreateOperatorAccount() {
    return cy.contains("a", /add an operator account/i).click();
  }

  goToAccountsPage() {
    return cy.get("body").then(($body) => {
      const accountsLink = $body.find("a").filter((_, element) => /accounts/i.test((element.textContent || "").trim())).first();

      if (accountsLink.length > 0) {
        cy.wrap(accountsLink).click({ force: true });
        return;
      }

      cy.visit("/maritime/accounts?page=1", { failOnStatusCode: false });
    });
  }
}

export default new DashBoardPage();
