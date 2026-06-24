import { SensorState, SensorStatus, SensorType } from "@repo/shared-types";
import { describe, expect, test } from "bun:test";

import {
  HEALTH_SCORE_MAX,
  HEALTH_WEIGHT_CRITICAL,
  HEALTH_WEIGHT_WARNING,
} from "../constants";
import { computeSystemHealth } from "./compute-system-health";

// Minimal SensorState factory — only `status` matters to the health maths.
function sensor(id: string, status: SensorStatus): SensorState {
  return {
    id,
    type: SensorType.TEMPERATURE,
    value: 0,
    unit: "°C",
    position: { x: 0, y: 0, z: 0 },
    timestamp: 0,
    routingKey: "sensor.hvac.temperature",
    status,
    lastUpdated: 0,
  };
}

function record(...sensors: SensorState[]): Record<string, SensorState> {
  return Object.fromEntries(sensors.map((s) => [s.id, s]));
}

describe("computeSystemHealth", () => {
  test("no sensors → full score", () => {
    expect(computeSystemHealth({})).toBe(HEALTH_SCORE_MAX);
  });

  test("all normal → full score (OFFLINE is not penalised)", () => {
    const sensors = record(
      sensor("a", SensorStatus.NORMAL),
      sensor("b", SensorStatus.OFFLINE),
    );
    expect(computeSystemHealth(sensors)).toBe(HEALTH_SCORE_MAX);
  });

  test("subtracts the warning weight per warning", () => {
    const sensors = record(
      sensor("a", SensorStatus.WARNING),
      sensor("b", SensorStatus.WARNING),
    );
    expect(computeSystemHealth(sensors)).toBe(
      HEALTH_SCORE_MAX - 2 * HEALTH_WEIGHT_WARNING,
    );
  });

  test("subtracts the critical weight per critical", () => {
    const sensors = record(sensor("a", SensorStatus.CRITICAL));
    expect(computeSystemHealth(sensors)).toBe(
      HEALTH_SCORE_MAX - HEALTH_WEIGHT_CRITICAL,
    );
  });

  test("clamps at 0 when faults exceed the max penalty", () => {
    const sensors = record(
      ...Array.from({ length: 20 }, (_, i) =>
        sensor(`c${i}`, SensorStatus.CRITICAL),
      ),
    );
    expect(computeSystemHealth(sensors)).toBe(0);
  });
});
