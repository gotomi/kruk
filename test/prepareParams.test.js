import { expect, describe, test } from "@jest/globals";

import { prepareParams } from "../src/prepareParams.js";

describe("prepareParams", () => {
  test("should handle basic parameters", () => {
    const argv = {
      formFactor: "PHONE",
    };

    const result = prepareParams(argv);

    expect(result).toEqual({
      formFactor: "PHONE",
      origin: false,
      history: false,
    });
  });

  test("should handle checkOrigin parameter", () => {
    const argv = {
      formFactor: "PHONE",
      checkOrigin: true,
    };

    const result = prepareParams(argv);

    expect(result).toEqual({
      formFactor: "PHONE",
      origin: true,
      history: false,
    });
  });

  test("should handle history parameter", () => {
    const argv = {
      formFactor: "PHONE",
      history: true,
    };

    const result = prepareParams(argv);

    expect(result).toEqual({
      formFactor: "PHONE",
      origin: false,
      history: true,
    });
  });

  test("should resolve metrics abbreviations", () => {
    const result = prepareParams({
      formFactor: "PHONE",
      metrics: ["CLS", "NAV_TYPES"],
    });

    expect(result.metrics).toEqual([
      "cumulative_layout_shift",
      "navigation_types",
    ]);
  });

  test("should throw for unknown metric", () => {
    expect(() =>
      prepareParams({ formFactor: "PHONE", metrics: ["NOPE"] }),
    ).toThrow(/unknown metric/);
  });

  test("should accept valid periods", () => {
    const result = prepareParams({ formFactor: "PHONE", periods: "12" });

    expect(result.periods).toBe(12);
  });

  test("should throw for invalid periods", () => {
    expect(() => prepareParams({ formFactor: "PHONE", periods: "0" })).toThrow(
      /--periods/,
    );
    expect(() => prepareParams({ formFactor: "PHONE", periods: "41" })).toThrow(
      /--periods/,
    );
    expect(() =>
      prepareParams({ formFactor: "PHONE", periods: "abc" }),
    ).toThrow(/--periods/);
  });
});
