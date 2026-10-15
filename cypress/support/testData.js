// Test data for the maritime tests.

// An IMO number has 7 digits. The last digit is a check digit.
export function generateValidImoNumber() {
  const digits = Array.from({ length: 6 }, () => Math.floor(Math.random() * 10));
  const checksum = digits.reduce((sum, digit, index) => sum + digit * (7 - index), 0) % 10;
  return `${digits.join("")}${checksum}`;
}

// New account and operator for each run, so each run gets new AER tasks.
export function buildCreateAccountData() {
  const imoNumber = generateValidImoNumber();

  return {
    imoNumber,
    name: `Cypress_${imoNumber}`,
    firstMaritimeActivityDate: "2025-01-01T00:00:00.000Z",
    line1: "Athens2121",
    line2: "Athen2121",
    city: "Athens",
    country: "Greece",
    state: "Attica",
    postcode: `${Math.floor(10000 + Math.random() * 90000)}`,
    firstReportingYear: "2025-01-01T00:00:00.000Z",
    adminUser: {
      firstName: `Cypress_${imoNumber}`,
      lastName: `Operator_${imoNumber}`,
      email: `cypress.operator.${imoNumber}@test.gr`
    }
  };
}

export const companyDetails = {
  registrationNumber: "REG-12345"
};
