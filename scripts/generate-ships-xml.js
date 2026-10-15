// Makes the two AER XML files (ships, aggregated data) for the same ships.
// Usage: node scripts/generate-ships-xml.js [shipCount=15] [outDir=cypress/fixtures]
const fs = require("fs");
const path = require("path");

const count = Number(process.argv[2] || 15);
const outDir = process.argv[3] || path.join(__dirname, "..", "cypress", "fixtures");

if (!Number.isInteger(count) || count < 1 || count > 1000) {
  throw new Error("shipCount must be an integer between 1 and 1000 (XSD limit)");
}

// An IMO number has 7 digits. The last digit is a check digit.
function imoNumber(index) {
  const six = String(900000 + index * 137).slice(0, 6).padStart(6, "9");
  const check = [...six].reduce((sum, digit, i) => sum + Number(digit) * (7 - i), 0) % 10;
  return `${six}${check}`;
}

const shipTypes = ["OIL", "BULK", "CONT", "CHEM", "GENERAL"];

function ship(index) {
  return `  <emissionReport>
    <shipImoNumber>${imoNumber(index)}</shipImoNumber>
    <name>CYPRESS SHIP ${String(index).padStart(3, "0")}</name>
    <shipType>${shipTypes[index % shipTypes.length]}</shipType>
    <grossTonnage>${25000 + index * 100}</grossTonnage>
    <flag>GR</flag>
    <iceClassPolarCode>NA</iceClassPolarCode>
    <allYear>true</allYear>
    <company>
      <nature>SHIPOWNER</nature>
    </company>
    <fuelTypes>
      <fuelTypeEntry>
        <fuelOriginCode>FOSSIL</fuelOriginCode>
        <fuelTypeCode>HFO</fuelTypeCode>
        <emissionFactors><factorReferenceCode>DEFAULT</factorReferenceCode><ghgCode>CO2</ghgCode></emissionFactors>
        <emissionFactors><factorReferenceCode>DEFAULT</factorReferenceCode><ghgCode>CH4</ghgCode></emissionFactors>
        <emissionFactors><factorReferenceCode>DEFAULT</factorReferenceCode><ghgCode>N2O</ghgCode></emissionFactors>
      </fuelTypeEntry>
    </fuelTypes>
    <emissionSources>
      <emissionSourceEntry>
        <name>Main Engine 1</name>
        <emissionSourceTypeCode>MAIN_ENGINE</emissionSourceTypeCode>
        <emissionSourceClassCode>ICE</emissionSourceClassCode>
        <monitoringMethodCode>BDN</monitoringMethodCode>
        <fuelTypeCodes>
          <fuelTypeCode>HFO</fuelTypeCode>
        </fuelTypeCodes>
      </emissionSourceEntry>
    </emissionSources>
    <monitoringMethods>
      <monitoringMethodEntry>
        <monitoringMethodCode>BDN</monitoringMethodCode>
        <levelOfUncertaintyTypeCode>DEFAULT</levelOfUncertaintyTypeCode>
      </monitoringMethodEntry>
    </monitoringMethods>
    <additionalInformation>
      <exemptionPerVoyageMonitoring>false</exemptionPerVoyageMonitoring>
    </additionalInformation>
  </emissionReport>`;
}

const shipsXml = `<?xml version="1.0" encoding="UTF-8"?>
<emissionReportsList>
${Array.from({ length: count }, (_, i) => ship(i + 1)).join("\n")}
</emissionReportsList>
`;

// The XSD uses a Greek "ο" here, but the app needs a normal "o".
// If we follow the XSD, the upload fails.
const N2O_TOTAL = "tn2oeqTotal";

function emissionsGroup(name, co2) {
  return `      <${name}>
        <tco2Total>${co2}</tco2Total>
        <tch4eqTotal>0.5</tch4eqTotal>
        <${N2O_TOTAL}>0.25</${N2O_TOTAL}>
      </${name}>`;
}

function aggregated(index) {
  return `  <shipEmissions shipImoNumber="${imoNumber(index)}">
    <annualEmission>
      <emissions>
        <fuelOriginCode>FOSSIL</fuelOriginCode>
        <fuelTypeCode>HFO</fuelTypeCode>
        <amount>${1000 + index * 10}</amount>
      </emissions>
${emissionsGroup("etsEmissionsWithinUkPort", 100)}
${emissionsGroup("etsEmissionsBetweenUkPort", 200)}
${emissionsGroup("etsEmissionsBetweenUkAndNiPort", 50)}
    </annualEmission>
  </shipEmissions>`;
}

const aggregatedXml = `<?xml version="1.0" encoding="UTF-8"?>
<emissions>
${Array.from({ length: count }, (_, i) => aggregated(i + 1)).join("\n")}
</emissions>
`;

fs.mkdirSync(outDir, { recursive: true });
for (const [name, xml] of [[`aer-ships-${count}.xml`, shipsXml], [`aer-aggregated-data-${count}.xml`, aggregatedXml]]) {
  fs.writeFileSync(path.join(outDir, name), xml, "utf8");
  console.log(`Wrote ${count} ships to ${path.join(outDir, name)} (${Buffer.byteLength(xml)} bytes)`);
}
