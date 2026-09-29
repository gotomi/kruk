// Since mocking modules in ESM is challenging, we'll focus on basic structure validation
// For a real test suite, we would need to set up proper ES module mocking
// or consider using a test runner designed for ES modules
import { expect, describe, test } from "@jest/globals";

import { getReports, buildQueryParams } from "../src/crux.js";
import { defaultMetrics } from "../src/crux-convert.js";

describe("crux module structure", () => {
  test("getReports function exists", () => {
    expect(typeof getReports).toBe("function");
  });
});

describe("buildQueryParams", () => {
  test("builds a default record query", () => {
    const params = buildQueryParams(
      { formFactor: "PHONE", origin: false, history: false },
      "https://example.com",
    );

    expect(params).toEqual({
      formFactor: "PHONE",
      url: "https://example.com",
      metrics: defaultMetrics,
    });
  });

  test("omits formFactor for ALL_FORM_FACTORS", () => {
    const params = buildQueryParams(
      { formFactor: "ALL_FORM_FACTORS", origin: false, history: false },
      "https://example.com",
    );

    expect(params).not.toHaveProperty("formFactor");
  });

  test("uses origin instead of url for origin queries", () => {
    const params = buildQueryParams(
      { formFactor: "PHONE", origin: true, history: false },
      "https://example.com",
    );

    expect(params.origin).toBe("https://example.com");
    expect(params).not.toHaveProperty("url");
  });

  test("passes selected metrics through", () => {
    const params = buildQueryParams(
      {
        formFactor: "PHONE",
        origin: false,
        history: false,
        metrics: ["cumulative_layout_shift", "navigation_types"],
      },
      "https://example.com",
    );

    expect(params.metrics).toEqual([
      "cumulative_layout_shift",
      "navigation_types",
    ]);
  });

  test("falls back to default metrics for empty selection", () => {
    const params = buildQueryParams(
      { formFactor: "PHONE", origin: false, history: false, metrics: [] },
      "https://example.com",
    );

    expect(params.metrics).toEqual(defaultMetrics);
  });

  test("adds collectionPeriodCount only for history queries", () => {
    const base = {
      formFactor: "PHONE",
      origin: false,
      metrics: [],
      periods: 12,
    };

    expect(
      buildQueryParams({ ...base, history: true }, "https://example.com")
        .collectionPeriodCount,
    ).toBe(12);
    expect(
      buildQueryParams({ ...base, history: false }, "https://example.com"),
    ).not.toHaveProperty("collectionPeriodCount");
  });
});
