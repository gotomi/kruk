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
      effectiveConnectionType: "",
    });
  });

  test("should handle effectiveConnectionType parameter", () => {
    const argv = {
      formFactor: "DESKTOP",
      ect: "4G",
    };

    const result = prepareParams(argv);

    expect(result).toEqual({
      formFactor: "DESKTOP",
      origin: false,
      history: false,
      effectiveConnectionType: "4G",
    });
  });

  test("should handle both ect and effectiveConnectionType parameters", () => {
    const argv = {
      formFactor: "DESKTOP",
      ect: "4G",
      effectiveConnectionType: "3G",
    };

    const result = prepareParams(argv);

    expect(result).toEqual({
      formFactor: "DESKTOP",
      origin: false,
      history: false,
      effectiveConnectionType: "3G",
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
      effectiveConnectionType: "",
    });
  });

  test("should handle history parameter", () => {
    const argv = {
      formFactor: "PHONE",
      history: true,
      ect: "4G",
    };

    const result = prepareParams(argv);

    expect(result).toEqual({
      formFactor: "PHONE",
      origin: false,
      history: true,
    });
  });
});
