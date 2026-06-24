import { describe, expect, test } from "bun:test";

import { buildPoints, VIEW_H, VIEW_W } from "./build-points";

const MID = VIEW_H / 2;

describe("buildPoints", () => {
  test("empty series → centred baseline spanning the full width", () => {
    expect(buildPoints([])).toBe(`0,${MID} ${VIEW_W},${MID}`);
  });

  test("single point → centred baseline (no range to normalise)", () => {
    expect(buildPoints([42])).toBe(`0,${MID} ${VIEW_W},${MID}`);
  });

  test("flat series → range falls back to 1, all points sit at the bottom", () => {
    // min === max, so (value - min) / range === 0 → y === VIEW_H for every point.
    const points = buildPoints([5, 5, 5]);
    const ys = points.split(" ").map((p) => Number(p.split(",")[1]));
    expect(ys.every((y) => y === VIEW_H)).toBe(true);
  });

  test("normal ascending series maps min→bottom and max→top", () => {
    const points = buildPoints([0, 50, 100]);
    const pairs = points.split(" ").map((p) => p.split(",").map(Number));

    // x spans 0 → VIEW_W in equal steps.
    expect(pairs[0]?.[0]).toBe(0);
    expect(pairs[2]?.[0]).toBeCloseTo(VIEW_W);
    expect(pairs[1]?.[0]).toBeCloseTo(VIEW_W / 2);

    // y is inverted: the lowest value sits at VIEW_H, the highest at 0.
    expect(pairs[0]?.[1]).toBe(VIEW_H);
    expect(pairs[2]?.[1]).toBe(0);
  });

  test("emits one coordinate pair per value", () => {
    const points = buildPoints([1, 2, 3, 4]);
    expect(points.split(" ")).toHaveLength(4);
  });
});
