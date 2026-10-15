const { defineConfig } = require("cypress");

// Use the library from this repo.
const { registerPerformancePlugin } = require("./plugin");

module.exports = defineConfig({
  e2e: {
    baseUrl: "https://prf.manage-emissions-reporting.service.gov.uk",
    specPattern: "cypress/e2e/**/*.cy.js",
    supportFile: "cypress/support/e2e.js",
    defaultCommandTimeout: 15000,
    pageLoadTimeout: 120000,
    video: false,
    screenshotsFolder: "cypress/screenshots",
    setupNodeEvents(on, config) {
      registerPerformancePlugin(on, config);

      const baseUrl = config.baseUrl;
      const authUrl = baseUrl.replace("://", "://authentication.");

      config.env = {
        ...config.env,
        targetUrl: config.env.targetUrl || `${baseUrl}/landing`,
        loginUrl: config.env.loginUrl || `${authUrl}/auth/realms/uk-pmrv/protocol/openid-connect/auth`,
        mailpitApiBaseUrl: config.env.mailpitApiBaseUrl || `${baseUrl}/mailpit/api/v1`,
        mailpitUsername: config.env.mailpitUsername || "",
        mailpitPassword: config.env.mailpitPassword || "",
        regulatorUsername: config.env.regulatorUsername || "",
        regulatorPassword: config.env.regulatorPassword || "",
        operatorPassword: config.env.operatorPassword || "",
        // Test settings. Change with --env name=value
        aerYear: config.env.aerYear || 2026,
        shipCount: config.env.shipCount || 15,
        screenLoadBudgetMs: config.env.screenLoadBudgetMs || 1000,
        assertBaseline: config.env.assertBaseline || false,
        failOnBudget: config.env.failOnBudget || false
      };

      return config;
    }
  }
});
