class AccountsPage {
  assertOnAccountsPage() {
    return cy.location("pathname", { timeout: 30000 }).should("include", "/maritime/accounts");
  }

  searchAccount(searchTerm) {
    return cy.get("body").then(($body) => {
      const label = [...$body.find("label")].find((item) => /Enter Account ID, Operator name, IMO number or Registry ID/i.test((item.textContent || "").trim()));

      if (label) {
        const fieldId = label.getAttribute("for");
        if (fieldId) {
          cy.get(`#${fieldId}`).clear({ force: true }).type(String(searchTerm), { force: true });
        } else {
          cy.wrap(label)
            .parent()
            .find("input")
            .first()
            .clear({ force: true })
            .type(String(searchTerm), { force: true });
        }
      }
    }).then(() => {
      return cy.contains("button, input[type='submit']", /search/i).first().click({ force: true });
    });
  }

  openAccount(searchTerm) {
    return cy.contains("a", String(searchTerm), { timeout: 30000 }).first().click();
  }
}

export default new AccountsPage();