import { expect, describe, test, beforeAll, afterAll } from "@jest/globals";

import { convertData } from "../src/crux-convert.js";

// Mock the date for consistent testing
const originalDate = global.Date;
beforeAll(() => {
  // Mock Date to return a fixed date
  global.Date = class extends originalDate {
    constructor() {
      super("2025-02-24T12:00:00Z");
    }
  };
});

afterAll(() => {
  global.Date = originalDate;
});

describe("convertData", () => {
  test("should return error when data is empty", () => {
    const result = convertData([]);
    expect(result).toEqual({ error: "data not found" });
  });

  test("should convert API data to metrics format", () => {
    const mockData = [
      {
        key: {
          url: "https://example.com",
          formFactor: "PHONE",
        },
        collectionPeriod: {
          firstDate: { year: 2024, month: 1, day: 1 },
          lastDate: { year: 2024, month: 1, day: 28 },
        },
        metrics: {
          cumulative_layout_shift: {
            percentiles: { p75: 0.05 },
            histogram: [
              { start: 0, end: 0.1, density: 0.9 },
              { start: 0.1, end: 0.25, density: 0.08 },
              { start: 0.25, density: 0.02 },
            ],
          },
          first_contentful_paint: {
            percentiles: { p75: 1500 },
            histogram: [
              { start: 0, end: 1800, density: 0.8 },
              { start: 1800, end: 3000, density: 0.15 },
              { start: 3000, density: 0.05 },
            ],
          },
        },
      },
    ];

    const result = convertData(mockData);

    expect(result.params).toHaveProperty("url", true);
    expect(result.params).toHaveProperty("formFactor", "PHONE");
    expect(result.params).toHaveProperty("date");

    expect(result.metrics).toHaveLength(1);
    expect(result.metrics[0]).toHaveProperty("url", "example.com");

    // Check CLS metric
    expect(result.metrics[0].CLS).toEqual({
      histogram: [90, 8, 2],
      p75: 0.05,
      rank: "good",
    });

    // Check FCP metric
    expect(result.metrics[0].FCP).toEqual({
      histogram: [80, 15, 5],
      p75: 1500,
      rank: "good",
    });

    // Check other metrics are initialized with empty values
    expect(result.metrics[0].LCP).toEqual({
      histogram: [],
      p75: "-",
      rank: "-",
    });
  });

  test("should group metrics when groupByMetric is true", () => {
    const mockData = [
      {
        key: {
          url: "https://example.com",
          formFactor: "PHONE",
        },
        collectionPeriod: {
          firstDate: { year: 2024, month: 1, day: 1 },
          lastDate: { year: 2024, month: 1, day: 28 },
        },
        metrics: {
          cumulative_layout_shift: {
            percentiles: { p75: 0.05 },
            histogram: [
              { start: 0, end: 0.1, density: 0.9 },
              { start: 0.1, end: 0.25, density: 0.08 },
              { start: 0.25, density: 0.02 },
            ],
          },
          first_contentful_paint: {
            percentiles: { p75: 1500 },
            histogram: [
              { start: 0, end: 1800, density: 0.8 },
              { start: 1800, end: 3000, density: 0.15 },
              { start: 3000, density: 0.05 },
            ],
          },
        },
      },
    ];

    const result = convertData(mockData, true);

    expect(result.metrics).toHaveProperty("CLS");
    expect(result.metrics).toHaveProperty("FCP");
    expect(result.metrics).toHaveProperty("LCP");

    expect(result.metrics.CLS).toHaveLength(1);
    expect(result.metrics.CLS[0]).toHaveProperty("url", "example.com");
    expect(result.metrics.CLS[0]).toHaveProperty("p75", 0.05);
  });
});
