# Changelog

All notable changes to cypress-performance-ui are documented here.

## [1.4.1] - 2026-10-29

### Documentation
- Improved README structure and Network Requests documentation.
- Added a screenshot of the Network Requests dashboard.
- Presented Network Requests as a standard plugin feature.

## [1.4.0] - 2026-10-29

### Added
- Network request tracking using browser Performance APIs.
- New `cy.collectNetworkMetrics()` command.
- New `cy.clearNetworkTimings()` command.
- Network Requests table in the HTML dashboard.
- Filtering by resource type: XHR, Fetch, Images, Scripts, CSS, Fonts, and Other.
- Request duration and configurable SLOW/OK thresholds.

## [1.3.0]

### Added
- TypeScript declarations and autocomplete support.
- Historical Performance Baselines.
- Automatic PASS/FAIL comparisons against historical page load times.
- Baseline Results table in the HTML dashboard.
- PASS vs FAIL pie chart.

## [1.2.0]

### Existing Features
- Browser performance metrics collection.
- W3C performance timings.
- Historical performance results saved in JSON.
- HTML dashboard with performance charts.