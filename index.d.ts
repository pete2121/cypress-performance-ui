/// <reference types="cypress" />

declare namespace CypressPerformanceUI {
  interface PerformanceMetrics {
    duration: number | null;
    responseStart: number | null;
    domContentLoaded: number | null;
    loadEventEnd: number | null;
    firstContentfulPaint: number | null;
    navigationStart: number | null;
  }

  interface Measurement {
    pageName: string;
    timestamp: string;
    url: string;
    metrics: PerformanceMetrics;
  }

  interface W3CMeasurement {
    pageName: string;
    timestamp: string;
    url: string;
    w3cTimings: PerformanceMetrics;
  }

  interface BaselineOptions {
    percentile?: number;
    historyDays?: number;
    minSamples?: number;
    tolerance?: number;
    jsonPath?: string;
    baselineResultsPath?: string;
    reportPath?: string;
  }

  interface BaselineResult {
    pageName: string;
    actual: number;
    baseline: number;
    threshold: number;
    percentile: number;
    tolerance: number;
    sampleCount: number;
    status: "PASS" | "FAIL";
  }

  interface SaveResult {
    filePath: string;
    metric: Measurement;
    rows: Measurement[];
    message: string;
  }

  interface ReportResult {
    filePath: string;
    jsonPath: string;
    rows: Measurement[];
    html: string;
    message: string;
  }
}

declare global {
  namespace Cypress {
    interface Chainable {
      collectPageLoadMetrics(pageName?: string): Chainable<CypressPerformanceUI.Measurement>;
      measureW3CTimings(pageName?: string): Chainable<CypressPerformanceUI.W3CMeasurement>;
      savePerformanceMetrics(pageName?: string, jsonPath?: string): Chainable<CypressPerformanceUI.SaveResult>;
      generatePerformanceReport(filePath?: string, pageName?: string, jsonPath?: string): Chainable<CypressPerformanceUI.ReportResult>;
      assertPageLoadBaseline(pageName: string, options?: CypressPerformanceUI.BaselineOptions): Chainable<CypressPerformanceUI.BaselineResult>;
      clearPerformanceHistory(jsonPath?: string): Chainable<unknown>;
    }
  }
}

export function registerPerformanceCommands(): void;
export function generateHtmlReport(
  rows: CypressPerformanceUI.Measurement[],
  baselineResults?: CypressPerformanceUI.BaselineResult[]
): string;

declare const _default: {
  registerPerformanceCommands: typeof registerPerformanceCommands;
  generateHtmlReport: typeof generateHtmlReport;
};
export default _default;
