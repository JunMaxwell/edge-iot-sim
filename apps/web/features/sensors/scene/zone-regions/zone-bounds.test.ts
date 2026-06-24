import { SensorState, SensorStatus, SensorType, SensorZone } from "@repo/shared-types";
import { describe, expect, test } from "bun:test";

import { SCENE_SCALE } from "../../constants";
import { computeZoneBounds } from "./zone-bounds";

const PADDING = 2;

function sensor(id: string, routingKey: string, x: number, z: number): SensorState {
  return {
    id,
    type: SensorType.TEMPERATURE,
    value: 0,
    unit: "°C",
    position: { x, y: 0, z },
    timestamp: 0,
    routingKey,
    status: SensorStatus.NORMAL,
    lastUpdated: 0,
  };
}

function record(...sensors: SensorState[]): Record<string, SensorState> {
  return Object.fromEntries(sensors.map((s) => [s.id, s]));
}

describe("computeZoneBounds", () => {
  test("no sensors → no bounds", () => {
    expect(computeZoneBounds({})).toEqual([]);
  });

  test("skips zones with no sensors", () => {
    const bounds = computeZoneBounds(
      record(sensor("a", "sensor.hvac.temperature", 1, 1)),
    );
    expect(bounds).toHaveLength(1);
    expect(bounds[0]?.zone).toBe(SensorZone.HVAC);
  });

  test("scales positions by SCENE_SCALE and pads the extents", () => {
    // Two HVAC sensors at x = -2 and x = 2 (z = 0) → scaled span 6·SCENE? compute.
    const bounds = computeZoneBounds(
      record(
        sensor("a", "sensor.hvac.temperature", -2, -1),
        sensor("b", "sensor.hvac.humidity", 2, 1),
      ),
    );
    const hvac = bounds.find((b) => b.zone === SensorZone.HVAC);
    // x spans [-2, 2]·SCALE = [-6, 6], padded → width 12 + 2·PADDING.
    expect(hvac?.width).toBe(4 * SCENE_SCALE + 2 * PADDING);
    expect(hvac?.depth).toBe(2 * SCENE_SCALE + 2 * PADDING);
    // Centre is the midpoint (0 here on both axes).
    expect(hvac?.centerX).toBe(0);
    expect(hvac?.centerZ).toBe(0);
  });

  test("separates HVAC and FLOOR sensors into distinct bounds", () => {
    const bounds = computeZoneBounds(
      record(
        sensor("a", "sensor.hvac.temperature", 0, 0),
        sensor("b", "sensor.floor.motion", 5, 5),
      ),
    );
    expect(bounds.map((b) => b.zone).sort()).toEqual(
      [SensorZone.FLOOR, SensorZone.HVAC].sort(),
    );
  });
});
