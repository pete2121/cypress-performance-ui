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

  interface NetworkOptions {
    threshold?: number;
    jsonPath?: string;
    reportPath?: string;
    historyPath?: string;
    baselineResultsPath?: string;
  }

  interface NetworkEntry {
    timestamp: string;
    label: string;
    url: string;
    initiatorType?: string;
    type?: "XHR" | "Fetch" | "Image" | "Script" | "CSS" | "Font" | "Other";
    duration: number;
    slow: boolean;
  }

  interface NetworkResult {
    label: string;
    threshold: number;
    entries: NetworkEntry[];
    filePath: string;
    reportPath: string;
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
      clearNetworkTimings(): Chainable<void>;
      collectNetworkMetrics(label?: string, options?: CypressPerformanceUI.NetworkOptions): Chainable<CypressPerformanceUI.NetworkResult>;
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
  baselineResults?: CypressPerformanceUI.BaselineResult[],
  networkResults?: CypressPerformanceUI.NetworkEntry[]
): string;

declare const _default: {
  registerPerformanceCommands: typeof registerPerformanceCommands;
  generateHtmlReport: typeof generateHtmlReport;
};
export default _default;
