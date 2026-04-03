import { describe, expect, it } from "vitest";
import { calcTrend } from "./metrics.js";

describe("calcTrend", () => {
  it("returns up trend for positive diff", () => {
    expect(calcTrend(10, 8)).toEqual({
      diff: 2,
      pct: 25,
      direction: "up",
    });
  });

  it("returns down trend for negative diff", () => {
    expect(calcTrend(5, 10)).toEqual({
      diff: -5,
      pct: 50,
      direction: "down",
    });
  });

  it("does not fail when previous value is zero", () => {
    expect(() => calcTrend(5, 0)).not.toThrow();
    expect(calcTrend(5, 0)).toEqual({
      diff: 5,
      pct: 0,
      direction: "up",
    });
  });
});
