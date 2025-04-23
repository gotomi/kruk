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
});
