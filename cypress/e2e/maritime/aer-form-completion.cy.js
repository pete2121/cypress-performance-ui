// AER form completion: screen load times.
// The regulator creates an account and invites an operator. The operator fills in the AER.
// Target: each screen loads in 1 second or less.
import BasePage from "../../pageObjects/BasePage";
import CreateOperatorAccountPage from "../../pageObjects/CreateOperatorAccountPage";
import AccountsPage from "../../pageObjects/AccountsPage";
import AccountPage from "../../pageObjects/AccountPage";
import OperatorInvitationApi from "../../pageObjects/OperatorInvitationApi";
import TermsAndConditionsPage from "../../pageObjects/operator/TermsAndConditionsPage";
import OperatorDashboardPage from "../../pageObjects/operator/OperatorDashboardPage";
import AerTaskListPage from "../../pageObjects/aer/AerTaskListPage";
import ReportingObligationPage from "../../pageObjects/aer/ReportingObligationPage";
import OperatorDetailsPage from "../../pageObjects/aer/OperatorDetailsPage";
import MonitoringPlanChangesPage from "../../pageObjects/aer/MonitoringPlanChangesPage";
import ShipsAndEmissionsPage from "../../pageObjects/aer/ShipsAndEmissionsPage";
import AdditionalDocumentsPage from "../../pageObjects/aer/AdditionalDocumentsPage";
import AggregatedDataPage from "../../pageObjects/aer/AggregatedDataPage";
import ReductionClaimPage from "../../pageObjects/aer/ReductionClaimPage";
import TotalEmissionsPage from "../../pageObjects/aer/TotalEmissionsPage";
import { buildCreateAccountData, companyDetails } from "../../support/testData";

const aerYear = Cypress.env("aerYear") || 2026;
const shipCount = Number(Cypress.env("shipCount") || 15);
const shipsFile = `cypress/fixtures/aer-ships-${shipCount}.xml`;
const aggregatedDataFile = `cypress/fixtures/aer-aggregated-data-${shipCount}.xml`;
const documentFile = "cypress/fixtures/additional-document.pdf";

const regulatorScreens = {
  dashboard: new BasePage({ heading: /tasks/i, metricName: "Regulator dashboard" }),
  createAccount: new BasePage({ heading: /add an operator account/i, metricName: "Regulator create operator account" }),
  accounts: new BasePage({ heading: /accounts/i, metricName: "Regulator accounts list" }),
  account: new BasePage({ metricName: "Regulator account page" })
};

describe("AER form completion - screen load performance", () => {
  const account = buildCreateAccountData();
  const operator = { ...account.adminUser, password: Cypress.env("operatorPassword") };

  beforeEach(() => {
    cy.resetScreenLoadBudgets();
  });

  it("regulator creates the account and invites the operator", function () {
    const { regulatorUsername, regulatorPassword } = Cypress.env();
    if (!regulatorUsername || !regulatorPassword || !operator.password) {
      throw new Error("Set regulatorUsername, regulatorPassword and operatorPassword in cypress.env.json");
    }

    cy.loginToMaritime(regulatorUsername, regulatorPassword);
    regulatorScreens.dashboard.visitAndMeasure("/maritime/dashboard");

    regulatorScreens.createAccount.visitAndMeasure("/maritime/accounts/create");
    CreateOperatorAccountPage.createAccount(account);
    CreateOperatorAccountPage.assertOnSuccessPage();
    CreateOperatorAccountPage.assertSuccessMessage();

    regulatorScreens.accounts.visitAndMeasure("/maritime/accounts?page=1");
    AccountsPage.searchAccount(account.imoNumber);
    AccountsPage.openAccount(account.name);
    AccountPage.assertOnAccountPage();

    AccountPage.getCurrentAccountId().then((accountId) => {
      regulatorScreens.account.visitAndMeasure(`/maritime/accounts/${accountId}`);

      AccountPage.openUsersAndContacts();
      AccountPage.clickAddNewOperatorAdmin();
      AccountPage.assertOnOperatorAdminDetailsSection();
      AccountPage.fillOperatorAdminUserDetails(account.adminUser);
      AccountPage.clickContinue();

      const invitationStartMillis = Date.now();
      AccountPage.clickSubmit();

      OperatorInvitationApi.approveCurrentInvitation({
        accountId,
        startedAtMillis: invitationStartMillis,
        expectedRecipient: account.adminUser.email
      }).then(() => OperatorInvitationApi.registerInvitedOperator(operator));

      // The regulator makes the operator active and sets the contacts.
      cy.visit(`/maritime/accounts/${accountId}`);
      AccountPage.assertOnAccountPage();
      AccountPage.openUsersAndContacts();
      AccountPage.configureOperatorAdminContactsAndSave();
    });

    cy.signOut();
    cy.assertScreenLoadBudgets();
  });

  it(`operator completes the ${aerYear} AER form`, () => {
    cy.loginToMaritime(operator.email, operator.password);
    TermsAndConditionsPage.acceptIfShown();

    OperatorDashboardPage.open();
    OperatorDashboardPage.getAerTaskId(aerYear).then((taskId) => {
      AerTaskListPage.open(taskId);

      ReportingObligationPage.complete(taskId);
      OperatorDetailsPage.complete(taskId, companyDetails);
      MonitoringPlanChangesPage.complete(taskId);
      ShipsAndEmissionsPage.complete(taskId, shipsFile, shipCount);
      AdditionalDocumentsPage.complete(taskId, documentFile);
      AggregatedDataPage.complete(taskId, aggregatedDataFile);
      ReductionClaimPage.complete(taskId);
      TotalEmissionsPage.complete(taskId);

      AerTaskListPage.open(taskId);
      [
        "Reporting obligation",
        "Operator details",
        "Monitoring plan changes",
        "Ships and emission details list",
        "Aggregated data",
        "Reduction claim",
        "Additional documents and information",
        "Emissions summary for all ships"
      ].forEach((section) => AerTaskListPage.assertSectionStatus(section, "Completed"));
    });

    cy.assertScreenLoadBudgets();
  });
});
