import { describe, expect, it } from "@jest/globals";
import { toId, toNumber } from "./number";

describe("number helpers", () => {
  it("converts backend numeric values safely", () => {
    expect(toNumber(10)).toBe(10);
    expect(toNumber(Number.NaN, 7)).toBe(7);
    expect(toNumber("42.5")).toBe(42.5);
    expect(toNumber("valor", 7)).toBe(7);
    expect(toNumber(undefined, 3)).toBe(3);
    expect(toId(99)).toBe("99");
  });
});
