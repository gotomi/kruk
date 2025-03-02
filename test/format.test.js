import { expect, describe, test } from "@jest/globals";
import { green, red, yellow, bold } from "../src/utils/format.js";

describe("format utility functions", () => {
  test("green function adds ANSI color codes for green text", () => {
    const text = "test text";
    const result = green(text);
    expect(result).toBe("\u001b[32mtest text\u001b[0m");
  });

  test("red function adds ANSI color codes for red text", () => {
    const text = "test text";
    const result = red(text);
    expect(result).toBe("\u001b[31mtest text\u001b[0m");
  });

  test("yellow function adds ANSI color codes for yellow text", () => {
    const text = "test text";
    const result = yellow(text);
    expect(result).toBe("\u001b[33mtest text\u001b[0m");
  });

  test("bold function adds ANSI codes for bold text", () => {
    const text = "test text";
    const result = bold(text);
    expect(result).toBe("\u001b[1mtest text \u001b[0m");
  });
});
