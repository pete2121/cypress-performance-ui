// Load the library commands from this repo.
require("../../index");

require("./commands");
require("./performance");

// The app sometimes throws a "postMessage" error. Ignore only this error.
Cypress.on("uncaught:exception", (error) => {
  if (/reading 'postMessage'/.test(error.message)) {
    return false;
  }
  return undefined;
});
