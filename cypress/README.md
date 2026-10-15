# Maritime AER form completion: screen load performance

Cypress tests for the METS maritime **AER form completion** journey. They measure every screen's load time with this repository's own `cypress-performance-ui` commands. They are not part of the published npm package: `package.json` `"files"` lists only the library.

Target, from Performance Test Plan v3.4, section 3:
- Each screen loads in **≤ 1 s at P99**.
- Each file upload completes in **≤ 20 s at P95**.

## Journey

Agreed in the 2026-10-05 "AER form completion" meeting.

1. **Regulator:** signs in, creates an operator account, invites a new operator admin. The invitation is accepted through Mailpit and the API, and the regulator then activates the operator.
2. **Operator:** signs in, accepts the terms, opens "Complete 2026 emissions report" and completes these sections:

   | # | Section | What the test does |
   |---|---|---|
   | 1 | Reporting obligation | Yes |
   | 2 | Operator details | Legal status: company; company details |
   | 3 | Monitoring plan changes | No |
   | 4 | Ships and emission details | **XML upload**, 15 ships |
   | 5 | Additional documents | PDF upload |
   | 6 | Aggregated data | **XML upload** |
   | 7 | Reduction claim | No |
   | 8 | Emissions summary for all ships | Confirm |

   "Send report" is not part of the scenario.

Each screen is opened with `cy.visit()` and then measured with `cy.measureScreen()`, which builds on `cy.generatePerformanceReport()`. When `assertBaseline` is on, it also runs `cy.assertPageLoadBaseline()`. Upload request times come from the browser's Resource Timing API.

## Setup

```bash
npm install
cp cypress.env.example.json cypress.env.json   # then fill in the credentials (never committed)
```

| Setting (`--env name=value`) | Default | Meaning |
|---|---|---|
| `regulatorUsername` / `regulatorPassword` | — | PRF regulator used to create the account |
| `operatorPassword` | — | Password given to the new operator |
| `mailpitUsername` / `mailpitPassword` | — | Mailpit login, used to read the invitation email |
| `aerYear` | `2026` | Which "Complete <year> emissions report" task to fill |
| `shipCount` | `15` | Uses `fixtures/aer-ships-<n>.xml` and `aer-aggregated-data-<n>.xml` |
| `screenLoadBudgetMs` | `1000` | Screen load budget; screens over it are logged as a warning |
| `failOnBudget` | `false` | `true` makes screens over budget fail the test (at the end, after the full journey) |
| `assertBaseline` | `false` | Also compare each screen with its own history (needs ≥ 10 earlier runs) |
| `stepDelayMs` | `0` | Pause before each click, to follow the run in `cypress open` |

The default environment is PRF. Use `--config baseUrl=https://<env>.manage-emissions-reporting.service.gov.uk` for another environment.

## Run

```bash
npm run test:aer          # headless run
npm run test:aer:watch    # Cypress window, slowed down to watch
npm run perf:summary      # P50/P90/P95/P99 per screen vs the targets
```

Output:
- `cypress/performance/results/maritime-aer-results.json`: history, appended on every run
- `cypress/performance/reports/maritime-aer-report.html`: charts

For more ships: `npm run fixtures:ships -- 50`, then `--env shipCount=50`.

If Cypress fails with "bad option: --smoke-test", clear `ELECTRON_RUN_AS_NODE` in that terminal first (`set ELECTRON_RUN_AS_NODE=`).

## Notes found while building this

- **Sections unlock in order.** A locked section's URL redirects to the task list, so the steps must run in sequence.
- **The ships and aggregated-data XML files are parsed in the browser.** The app shows a preview table, and "Confirm and upload" only saves after the preview appears.
- **"Continue" after a document upload stays disabled** until `POST /task-attachments/upload` finishes.
- **The aggregated-data XSD (v1.1) has an error.** It names an element `tn2οeqTotal` with a Greek "ο", but the app reads `tn2oeqTotal` with a Latin "o". Files that follow the XSD are rejected. See `scripts/generate-ships-xml.js`.
