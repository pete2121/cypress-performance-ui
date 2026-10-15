class AccountPage {
  assertOnAccountPage() {
    return cy.location("pathname", { timeout: 30000 }).should("match", /\/maritime\/accounts\/\d+/);
  }

  getCurrentAccountId() {
    return cy.location("pathname", { timeout: 30000 }).then((pathname) => {
      const match = pathname.match(/\/maritime\/accounts\/(\d+)/);

      if (!match) {
        throw new Error(`Could not extract accountId from path: ${pathname}`);
      }

      return match[1];
    });
  }

  openUsersAndContacts() {
    return cy.get("#tab_users", { timeout: 30000 }).click({ force: true });
  }

  clickAddNewOperatorAdmin() {
    return cy.contains("a, button", /add new operator admin/i, { timeout: 30000 }).click({ force: true });
  }

  assertOnOperatorAdminDetailsSection() {
    return cy.contains("main#main-content", /enter operator admin user details/i, { timeout: 30000 }).should("be.visible");
  }

  fillField(labelPattern, value) {
    return cy.contains("label", labelPattern, { timeout: 30000 }).invoke("attr", "for").then((fieldId) => {
      cy.get(`#${fieldId}`).clear({ force: true }).type(String(value), { force: true });
    });
  }

  fillOperatorAdminUserDetails({ firstName, lastName, email }) {
    this.fillField(/first name/i, firstName);
    this.fillField(/last name/i, lastName);
    this.fillField(/email/i, email);
  }

  clickContinue() {
    return cy.contains("button, input[type='submit']", /^continue$/i).first().click({ force: true });
  }

  clickSubmit() {
    return cy.contains("button, input[type='submit']", /^submit$/i).first().click({ force: true });
  }

  setPrimaryContact() {
    return cy.get("#contactTypes\\.PRIMARY-option0", { timeout: 30000 }).check({ force: true });
  }

  setServiceContact() {
    return cy.get("#contactTypes\\.SERVICE-option0", { timeout: 30000 }).check({ force: true });
  }

  setFinancialContact() {
    return cy.get("#contactTypes\\.FINANCIAL-option0", { timeout: 30000 }).check({ force: true });
  }

  setAuthorityStatusActive() {
    return cy.get("#usersArray\\.0\\.authorityStatus", { timeout: 30000 }).then(($select) => {
      const options = [...$select[0].options].map((option) => ({
        text: (option.textContent || "").trim(),
        value: option.value
      }));

      const activeOption = options.find((option) => /active/i.test(option.text));

      if (activeOption) {
        const pick = activeOption.value || activeOption.text;
        cy.wrap($select).select(pick, { force: true });
        return;
      }

      cy.wrap($select).select("Active", { force: true });
    });
  }

  clickSaveContacts() {
    return cy.contains("button, input[type='submit']", /^save$/i, { timeout: 30000 }).first().click({ force: true });
  }

  assertContactsSaved() {
    return cy.contains("main#main-content", /success|primary contact updated|account status updated/i, { timeout: 30000 }).should("be.visible");
  }

  configureOperatorAdminContactsAndSave() {
    this.setPrimaryContact();
    this.setServiceContact();
    this.setFinancialContact();
    this.setAuthorityStatusActive();
    this.clickSaveContacts();
    return this.assertContactsSaved();
  }

}

export default new AccountPage();