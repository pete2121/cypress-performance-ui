# Cypress Performance UI

Performance testing directly inside your Cypress tests.

Collect browser-native performance metrics, persist historical results, and generate visual HTML reports — no Lighthouse required.

## Features

- Browser-native performance metrics using the Performance API
- Persistent JSON performance history
- Visual HTML performance dashboard
- Performance trends across multiple test runs
- First Contentful Paint (FCP)
- Response Start / TTFB
- DOM Content Loaded
- Load Event
- Total page load duration
- Resettable performance history
- No Lighthouse dependency
- Designed specifically for Cypress

## Report Preview

![Page load performance report](./assets/performance-report.svg)

## Install

```bash
npm install --save-dev cypress-performance-ui
```

## Setup

Cypress Performance UI contains two parts:

- Browser-side Cypress commands for collecting performance metrics
- A Node-side plugin for managing persistent performance history

### 1. Register the Node plugin

Update your `cypress.config.js`:

```js
const { defineConfig } = require("cypress");

const {
  registerPerformancePlugin,
} = require("cypress-performance-ui/plugin");

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      registerPerformancePlugin(on, config);

      return config;
    },
  },
});
```

If you already have a `setupNodeEvents()` function, simply call:

```js
registerPerformancePlugin(on, config);
```

inside your existing function.

### 2. Register the Cypress commands

In:

```text
cypress/support/e2e.js
```

add:

```js
import "cypress-performance-ui";
```

or:

```js
require("cypress-performance-ui");
```

## Quick Start

Once configured, generate a performance report directly from your Cypress test:

```js
describe("Performance", () => {
  it("measures landing page performance", () => {
    cy.visit("/landing");

    cy.generatePerformanceReport(
      "cypress/performance/reports/performance-report.html",
      "Landing page"
    );
  });
});
```

That's it.

Each execution automatically:

1. Collects browser performance metrics
2. Reads the existing performance history
3. Appends the new measurement
4. Saves the results to JSON
5. Regenerates the HTML dashboard using the complete history

## Generated Files

By default, performance data is stored under:

```text
cypress/
└── performance/
    ├── results/
    │   └── performance-results.json
    │
    └── reports/
        └── performance-report.html
```

The JSON file contains the historical measurements.

The HTML report visualizes the collected results across multiple test runs.

## Commands

### `cy.collectPageLoadMetrics(pageName)`

Collects browser performance metrics from the current page using `window.performance`.

```js
cy.collectPageLoadMetrics("Landing page").then((result) => {
  console.log(result);
});
```

Example result:

```js
{
  pageName: "Landing page",
  timestamp: "2026-10-07T12:00:00.000Z",
  url: "https://example.com/landing",
  metrics: {
    duration: 1678.2,
    responseStart: 123.5,
    domContentLoaded: 786.3,
    loadEventEnd: 1498.8,
    firstContentfulPaint: 442.4,
    navigationStart: 0
  }
}
```

This command only collects and returns the metrics.

It does not persist them to disk.

---

### `cy.measureW3CTimings(pageName)`

Returns the collected browser performance values in a W3C-style timing object.

```js
cy.measureW3CTimings("Landing page").then((result) => {
  console.log(result.w3cTimings);
});
```

---

### `cy.savePerformanceMetrics(pageName, jsonPath)`

Collects the current page performance metrics and appends them to the persistent JSON history.

```js
cy.savePerformanceMetrics("Landing page");
```

Default JSON location:

```text
cypress/performance/results/performance-results.json
```

You can optionally provide a custom path:

```js
cy.savePerformanceMetrics(
  "Landing page",
  "cypress/results/my-performance-history.json"
);
```

---

### `cy.generatePerformanceReport(filePath, pageName, jsonPath)`

Collects the current performance metrics, saves them to the JSON history, and generates an HTML dashboard using all stored measurements.

```js
cy.generatePerformanceReport(
  "cypress/performance/reports/performance-report.html",
  "Landing page"
);
```

The default paths are:

```text
JSON:
cypress/performance/results/performance-results.json

HTML:
cypress/performance/reports/performance-report.html
```

A custom JSON history path can also be supplied:

```js
cy.generatePerformanceReport(
  "cypress/performance/reports/performance-report.html",
  "Landing page",
  "cypress/performance/results/custom-history.json"
);
```

For most use cases, this is the main command you need.

---

### `cy.clearPerformanceHistory(jsonPath)`

Clears the stored performance history.

```js
cy.clearPerformanceHistory();
```

This is useful when starting a new performance test cycle.

For example:

```js
describe("Performance", () => {
  before(() => {
    cy.clearPerformanceHistory();
  });

  it("measures landing page", () => {
    cy.visit("/landing");

    cy.generatePerformanceReport(
      "cypress/performance/reports/performance-report.html",
      "Landing page"
    );
  });
});
```

## Historical Performance Tracking

Every call to:

```js
cy.generatePerformanceReport(...)
```

adds a new measurement to the JSON history.

For example, after multiple test runs:

```json
[
  {
    "pageName": "Landing page",
    "timestamp": "2026-10-07T10:00:00.000Z",
    "metrics": {
      "duration": 820.4,
      "responseStart": 140.2,
      "firstContentfulPaint": 350.1
    }
  },
  {
    "pageName": "Landing page",
    "timestamp": "2026-10-07T10:05:00.000Z",
    "metrics": {
      "duration": 910.7,
      "responseStart": 152.8,
      "firstContentfulPaint": 381.4
    }
  }
]
```

The HTML dashboard uses this history to visualize performance trends over time.

## Performance Metrics

Cypress Performance UI currently collects:

| Metric | Description |
|---|---|
| `navigationStart` | Navigation entry start time |
| `responseStart` | Time until the browser starts receiving the response |
| `domContentLoaded` | Time until the DOMContentLoaded event completes |
| `loadEventEnd` | Time until the page load event completes |
| `firstContentfulPaint` | First Contentful Paint (FCP) |
| `duration` | Total navigation duration |

Metrics are reported in milliseconds.

## How It Works

```text
Cypress Test
     │
     ▼
Browser Performance API
     │
     ▼
collectPageLoadMetrics()
     │
     ▼
Persistent JSON History
     │
     ▼
generatePerformanceReport()
     │
     ▼
Visual HTML Dashboard
```

The browser-side commands collect performance data using the native browser Performance API.

Filesystem operations are handled separately through the Cypress Node plugin.

This keeps Node APIs such as `fs` out of the browser bundle.

## Why Cypress Performance UI?

Performance testing often requires introducing additional tooling into an existing test stack.

Cypress Performance UI is designed to keep basic page-load performance measurement close to your Cypress tests.

It uses browser-native performance APIs and provides persistent historical data plus a visual report without requiring Lighthouse.

## Example

```js
describe("Application performance", () => {
  before(() => {
    cy.clearPerformanceHistory();
  });

  it("measures home page", () => {
    cy.visit("/");

    cy.generatePerformanceReport(
      "cypress/performance/reports/performance-report.html",
      "Home"
    );
  });

  it("measures login page", () => {
    cy.visit("/login");

    cy.generatePerformanceReport(
      "cypress/performance/reports/performance-report.html",
      "Login"
    );
  });

  it("measures dashboard", () => {
    cy.visit("/dashboard");

    cy.generatePerformanceReport(
      "cypress/performance/reports/performance-report.html",
      "Dashboard"
    );
  });
});
```

All three measurements are stored in the same JSON history and displayed in the generated HTML dashboard.

## Requirements

- Cypress
- A browser with support for the Performance API
- Node.js

## Author

Petros Plakogiannis

## License

MIT