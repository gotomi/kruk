import { expect, describe, test, beforeAll, afterAll } from "@jest/globals";

import { convertData, resolveMetrics } from "../src/crux-convert.js";

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

  test("should convert fraction metrics", () => {
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
          navigation_types: {
            fractions: {
              Navigate: 0.9221,
              Reload: 0.0527,
              Prerender: 0.0252,
            },
          },
        },
      },
    ];

    const result = convertData(mockData);

    expect(result.metrics[0].NAV_TYPES).toEqual({
      fractions: {
        Navigate: 92.21,
        Reload: 5.27,
        Prerender: 2.52,
      },
      p75: null,
      rank: "-",
    });
  });

  test("should convert percentile-only metrics without histogram", () => {
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
          largest_contentful_paint_image_resource_load_delay: {
            percentiles: { p75: 210 },
          },
        },
      },
    ];

    const result = convertData(mockData);

    expect(result.metrics[0]["LCP-LD"]).toEqual({
      histogram: [],
      p75: 210,
      rank: "-",
    });
  });

  test("should convert experimental soft-navigation CWV metrics", () => {
    const mockData = [
      {
        key: {
          url: "https://allegro.pl",
          formFactor: "PHONE",
        },
        collectionPeriod: {
          firstDate: { year: 2026, month: 9, day: 14 },
          lastDate: { year: 2026, month: 10, day: 11 },
        },
        metrics: {
          cumulative_layout_shift: {
            percentiles: { p75: "0.00" },
            histogram: [
              { start: "0.00", end: "0.10", density: 0.9468 },
              { start: "0.10", end: "0.25", density: 0.031 },
              { start: "0.25", density: 0.0222 },
            ],
          },
          largest_contentful_paint: {
            percentiles: { p75: 1601 },
            histogram: [
              { start: 0, end: 2500, density: 0.9125 },
              { start: 2500, end: 4000, density: 0.0567 },
              { start: 4000, density: 0.0308 },
            ],
          },
          experimental_cumulative_layout_shift_with_softnavs: {
            percentiles: { p75: "0.00" },
            histogram: [
              { start: "0.00", end: "0.10", density: 0.956 },
              { start: "0.10", end: "0.25", density: 0.0261 },
              { start: "0.25", density: 0.0179 },
            ],
          },
          experimental_largest_contentful_paint_with_softnavs: {
            percentiles: { p75: 1518 },
            histogram: [
              { start: 0, end: 2500, density: 0.9226 },
              { start: 2500, end: 4000, density: 0.0507 },
              { start: 4000, density: 0.0267 },
            ],
          },
          experimental_interaction_to_next_paint_with_softnavs: {
            percentiles: { p75: 107 },
            histogram: [
              { start: 0, end: 200, density: 0.9249 },
              { start: 200, end: 500, density: 0.0637 },
              { start: 500, density: 0.0114 },
            ],
          },
        },
      },
    ];

    const result = convertData(mockData);

    expect(result.metrics[0]["CLS-SN"]).toEqual({
      histogram: [95.6, 2.61, 1.79],
      p75: "0.00",
      rank: "good",
    });
    expect(result.metrics[0]["LCP-SN"]).toEqual({
      histogram: [92.26, 5.07, 2.67],
      p75: 1518,
      rank: "good",
    });
    expect(result.metrics[0]["INP-SN"]).toEqual({
      histogram: [92.49, 6.37, 1.14],
      p75: 107,
      rank: "good",
    });

    // experimental variants must not feed minimalGood (stable CWV only)
    expect(result.metrics[0].minimalGood).toBe(91.25);

    // -SN columns line up after the stable defaults, before other opt-ins
    expect(Object.keys(result.metrics[0])).toEqual([
      "url",
      "CLS",
      "FCP",
      "LCP",
      "TTFB",
      "INP",
      "RTT",
      "CLS-SN",
      "LCP-SN",
      "INP-SN",
      "minimalGood",
    ]);
  });

  test("should convert experimental ad metrics as p75 only", () => {
    const mockData = [
      {
        key: {
          url: "https://allegro.pl",
          formFactor: "PHONE",
        },
        collectionPeriod: {
          firstDate: { year: 2026, month: 9, day: 14 },
          lastDate: { year: 2026, month: 10, day: 11 },
        },
        metrics: {
          experimental_ad_count: { percentiles: { p75: "0.33" } },
          experimental_ad_density: { percentiles: { p75: 4 } },
          experimental_ad_cpu: { percentiles: { p75: 321 } },
          experimental_ad_kilobytes: { percentiles: { p75: 20 } },
        },
      },
    ];

    const result = convertData(mockData);

    expect(result.metrics[0]["AD-COUNT"]).toEqual({
      histogram: [],
      p75: "0.33",
      rank: "-",
    });
    expect(result.metrics[0]["AD-CPU"]).toEqual({
      histogram: [],
      p75: 321,
      rank: "-",
    });
    expect(result.metrics[0]["AD-DENSITY"]).toEqual({
      histogram: [],
      p75: 4,
      rank: "-",
    });
    expect(result.metrics[0]["AD-KB"]).toEqual({
      histogram: [],
      p75: 20,
      rank: "-",
    });
  });

  test("should ignore metrics unknown to kruk", () => {
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
          first_input_delay: {
            percentiles: { p75: 50 },
            histogram: [
              { start: 0, end: 100, density: 0.8 },
              { start: 100, end: 300, density: 0.15 },
              { start: 300, density: 0.05 },
            ],
          },
        },
      },
    ];

    const result = convertData(mockData);

    expect(result.metrics[0]).not.toHaveProperty("first_input_delay");
    expect(result.metrics[0]).not.toHaveProperty("FID");
  });

  test("should group fraction metrics when groupByMetric is true", () => {
    const mockData = [
      {
        key: {
          url: "https://example.com",
          formFactor: "ALL_FORM_FACTORS",
        },
        collectionPeriod: {
          firstDate: { year: 2024, month: 1, day: 1 },
          lastDate: { year: 2024, month: 1, day: 28 },
        },
        metrics: {
          navigation_types: {
            fractions: {
              Navigate: 0.9221,
              Reload: 0.0527,
              Prerender: 0.0252,
            },
          },
        },
      },
    ];

    const result = convertData(mockData, true);

    expect(result.metrics).toHaveProperty("NAV_TYPES");
    expect(result.metrics.NAV_TYPES).toHaveLength(1);
    expect(result.metrics.NAV_TYPES[0]).toHaveProperty("url", "example.com");
    expect(result.metrics.NAV_TYPES[0].fractions).toEqual({
      Navigate: 92.21,
      Reload: 5.27,
      Prerender: 2.52,
    });
  });
});

describe("resolveMetrics", () => {
  test("should resolve abbreviations and full names", () => {
    expect(resolveMetrics(["CLS", "navigation_types", "LCP-TTFB"])).toEqual([
      "cumulative_layout_shift",
      "navigation_types",
      "largest_contentful_paint_image_time_to_first_byte",
    ]);
  });

  test("should resolve experimental metric abbreviations and full names", () => {
    expect(resolveMetrics(["LCP-SN", "experimental_ad_count"])).toEqual([
      "experimental_largest_contentful_paint_with_softnavs",
      "experimental_ad_count",
    ]);
  });

  test("should deduplicate metrics", () => {
    expect(resolveMetrics(["CLS", "cumulative_layout_shift"])).toEqual([
      "cumulative_layout_shift",
    ]);
    expect(
      resolveMetrics([
        "INP-SN",
        "experimental_interaction_to_next_paint_with_softnavs",
      ]),
    ).toEqual(["experimental_interaction_to_next_paint_with_softnavs"]);
  });

  test("should throw for unknown metric", () => {
    expect(() => resolveMetrics(["NOPE"])).toThrow(/unknown metric "NOPE"/);
  });
});
