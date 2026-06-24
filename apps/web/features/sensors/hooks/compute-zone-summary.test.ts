import { SensorState, SensorStatus, SensorType, SensorZone } from "@repo/shared-types";
import { describe, expect, test } from "bun:test";

import { computeZoneSummary, ZONE_ORDER } from "./compute-zone-summary";

function sensor(
  id: string,
  routingKey: string,
  status: SensorStatus,
): SensorState {
  return {
    id,
    type: SensorType.TEMPERATURE,
    value: 0,
    unit: "°C",
    position: { x: 0, y: 0, z: 0 },
    timestamp: 0,
    routingKey,
    status,
    lastUpdated: 0,
  };
}

function record(...sensors: SensorState[]): Record<string, SensorState> {
  return Object.fromEntries(sensors.map((s) => [s.id, s]));
}

describe("computeZoneSummary", () => {
  test("returns one entry per zone in ZONE_ORDER, even when empty", () => {
    const summary = computeZoneSummary({});
    expect(summary.map((s) => s.zone)).toEqual(ZONE_ORDER);
    expect(summary.every((s) => s.nodeCount === 0)).toBe(true);
    expect(summary.every((s) => s.worstStatus === SensorStatus.NORMAL)).toBe(true);
  });

  test("counts sensors into the correct zone", () => {
    const sensors = record(
      sensor("a", "sensor.hvac.temperature", SensorStatus.NORMAL),
      sensor("b", "sensor.hvac.humidity", SensorStatus.NORMAL),
      sensor("c", "sensor.floor.motion", SensorStatus.NORMAL),
    );
    const summary = computeZoneSummary(sensors);
    const hvac = summary.find((s) => s.zone === SensorZone.HVAC);
    const floor = summary.find((s) => s.zone === SensorZone.FLOOR);
    expect(hvac?.nodeCount).toBe(2);
    expect(floor?.nodeCount).toBe(1);
  });

  test("worst status wins within a zone", () => {
    const sensors = record(
      sensor("a", "sensor.hvac.temperature", SensorStatus.NORMAL),
      sensor("b", "sensor.hvac.humidity", SensorStatus.CRITICAL),
      sensor("c", "sensor.hvac.temperature", SensorStatus.WARNING),
    );
    const hvac = computeZoneSummary(sensors).find((s) => s.zone === SensorZone.HVAC);
    expect(hvac?.worstStatus).toBe(SensorStatus.CRITICAL);
  });

  test("OFFLINE ranks above NORMAL as the worst status", () => {
    const sensors = record(
      sensor("a", "sensor.floor.motion", SensorStatus.NORMAL),
      sensor("b", "sensor.floor.motion", SensorStatus.OFFLINE),
    );
    const floor = computeZoneSummary(sensors).find((s) => s.zone === SensorZone.FLOOR);
    expect(floor?.worstStatus).toBe(SensorStatus.OFFLINE);
  });
});
