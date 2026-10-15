// Shows P50/P90/P95/P99 for each screen, and PASS or FAIL.
// Targets: screen load 1 s or less (P99), upload 20 s or less (P95).
// Usage: node scripts/performance-summary.js [resultsJson] [--budget=1000] [--upload-budget=20000]
const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const option = (name, fallback) => Number((args.find((a) => a.startsWith(`--${name}=`)) || "").split("=")[1] || fallback);
const file = args.find((a) => !a.startsWith("--")) || path.join(__dirname, "..", "cypress", "performance", "results", "maritime-aer-results.json");
const screenBudget = option("budget", 1000);
const uploadBudget = option("upload-budget", 20000);

if (!fs.existsSync(file)) {
  console.error(`No results file: ${file}. Run the Cypress tests first.`);
  process.exit(1);
}

// Same percentile method as index.js.
function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  const position = ((sorted.length - 1) * p) / 100;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

const rows = JSON.parse(fs.readFileSync(file, "utf8"));
const byPage = new Map();
for (const row of rows) {
  const duration = row.metrics && row.metrics.duration;
  if (typeof duration === "number" && Number.isFinite(duration)) {
    if (!byPage.has(row.pageName)) byPage.set(row.pageName, []);
    byPage.get(row.pageName).push(duration);
  }
}

const fmt = (n) => Math.round(n).toString().padStart(7);
console.log(`Results: ${file}\n`);
console.log(`${"Screen".padEnd(50)}${"n".padStart(4)}${"P50".padStart(8)}${"P90".padStart(8)}${"P95".padStart(8)}${"P99".padStart(8)}  Target          Result`);

let failures = 0;
for (const [page, values] of byPage) {
  const isUpload = /\(request\)/i.test(page);
  const p = { 50: percentile(values, 50), 90: percentile(values, 90), 95: percentile(values, 95), 99: percentile(values, 99) };
  const measured = isUpload ? p[95] : p[99];
  const budget = isUpload ? uploadBudget : screenBudget;
  const pass = measured <= budget;
  if (!pass) failures += 1;
  const target = `${isUpload ? "P95" : "P99"} <= ${budget} ms`;
  console.log(`${page.padEnd(50)}${String(values.length).padStart(4)}${fmt(p[50])} ${fmt(p[90])} ${fmt(p[95])} ${fmt(p[99])}  ${target.padEnd(16)}${pass ? "PASS" : "FAIL"}`);
}

const minSamples = Math.min(...[...byPage.values()].map((v) => v.length));
console.log(`\n${byPage.size} screens, ${failures} over target.`);
if (minSamples < 20) {
  console.log(`Note: some screens have only ${minSamples} sample(s); P95/P99 need more runs to be meaningful.`);
}
process.exitCode = failures ? 1 : 0;
