class CreateOperatorAccountPage {
  assertOnCreatePage() {
    return cy.location("pathname", { timeout: 30000 }).should("include", "/maritime/accounts/create");
  }

  assertOnSuccessPage() {
    return cy.location("pathname", { timeout: 30000 }).should("include", "/maritime/accounts/create/success");
  }

  assertSuccessMessage() {
    return cy.get("main#main-content", { timeout: 30000 }).contains("h1", /operator account successfully created/i).should("be.visible");
  }

  fillField(labelPattern, value) {
    return cy.get("body").then(($body) => {
      const labels = [...$body.find("label")];
      const label = labels.find((item) => labelPattern.test((item.textContent || "").trim()));

      if (!label || value === undefined || value === null || value === "") {
        return;
      }

      const normalizedValue = String(value);
      const forId = label.getAttribute("for");
      const field = forId ? $body.find(`#${forId}`).first() : Cypress.$(label).find("input, textarea, select").filter(":visible").first();
      const targetField = field.length > 0 ? field : Cypress.$(label).closest(".govuk-form-group, .govuk-fieldset, div").find("input, textarea, select").filter(":visible").first();

      if (targetField.length === 0) {
        return;
      }

      const tagName = (targetField.prop("tagName") || "").toLowerCase();
      const inputType = String(targetField.attr("type") || "").toLowerCase();
      const valueToType = inputType === "date" && normalizedValue.includes("T") ? normalizedValue.slice(0, 10) : normalizedValue;

      if (tagName === "select") {
        cy.wrap(targetField).select(normalizedValue, { force: true });
        return;
      }

      cy.wrap(targetField).clear({ force: true }).type(valueToType, { force: true });
    });
  }

  fillDateField(labelPattern, value) {
    return cy.get("body").then(($body) => {
      const labels = [...$body.find("label, legend, h2, h3, p")];
      const label = labels.find((item) => labelPattern.test((item.textContent || "").trim()));

      if (!label || !value) {
        return;
      }

      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        throw new Error(`Invalid date value: ${value}`);
      }

      const parts = [
        String(date.getUTCDate()),
        String(date.getUTCMonth() + 1),
        String(date.getUTCFullYear())
      ];

      const group = Cypress.$(label)
        .closest(".govuk-form-group, .govuk-fieldset, fieldset, div")
        .find("input")
        .filter(":visible");

      if (group.length >= 3) {
        cy.wrap(group.eq(0)).clear({ force: true }).type(parts[0], { force: true });
        cy.wrap(group.eq(1)).clear({ force: true }).type(parts[1], { force: true });
        cy.wrap(group.eq(2)).clear({ force: true }).type(parts[2], { force: true });
        return;
      }

      const dateInput = Cypress.$(label)
        .closest(".govuk-form-group, .govuk-fieldset, fieldset, div")
        .find("input[type='date']")
        .filter(":visible")
        .first();

      if (dateInput.length > 0) {
        cy.wrap(dateInput).clear({ force: true }).type(`${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`, { force: true });
      }
    });
  }

  fillCreateAccountForm(data) {
    this.fillField(/company IMO number/i, data.imoNumber);
    this.fillField(/operator name/i, data.name);
    this.fillField(/address line 1|line 1/i, data.line1);
    this.fillField(/address line 2|line 2/i, data.line2);
    this.fillField(/town or city|city/i, data.city);
    this.fillField(/country/i, data.country);
    this.fillField(/state/i, data.state);
    this.fillField(/postcode|postal code/i, data.postcode);
    this.fillDateField(/first maritime activity date/i, data.firstMaritimeActivityDate);
    this.fillDateField(/first year of reporting obligation|first year of emissions/i, data.firstReportingYear);
  }

  clickContinue() {
    return cy.contains("button, input[type='submit']", /continue|save and continue|next/i).first().click({ force: true });
  }

  clickConfirmAndComplete() {
    return cy.contains("button, input[type='submit']", /confirm and complete/i).first().click({ force: true });
  }

  createAccount(data, maxSteps = 8) {
    this.fillCreateAccountForm(data);
    this.clickContinue();
    return this.clickConfirmAndComplete();
  }
}

export default new CreateOperatorAccountPage();
