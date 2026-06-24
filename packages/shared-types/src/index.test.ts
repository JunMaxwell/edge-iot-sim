import { describe, expect, test } from "bun:test";

import {
  deriveStatus,
  SensorStatus,
  SensorType,
  SensorZone,
  zoneForRoutingKey,
} from "./index";

describe("zoneForRoutingKey", () => {
  test("maps the hvac namespace to HVAC", () => {
    expect(zoneForRoutingKey("sensor.hvac.temperature")).toBe(SensorZone.HVAC);
    expect(zoneForRoutingKey("sensor.hvac.humidity")).toBe(SensorZone.HVAC);
  });

  test("maps the floor namespace to FLOOR", () => {
    expect(zoneForRoutingKey("sensor.floor.motion")).toBe(SensorZone.FLOOR);
    expect(zoneForRoutingKey("sensor.floor.machine_status")).toBe(SensorZone.FLOOR);
  });

  test("falls back to FLOOR for an unknown namespace", () => {
    expect(zoneForRoutingKey("sensor.security.motion")).toBe(SensorZone.FLOOR);
    expect(zoneForRoutingKey("garbage")).toBe(SensorZone.FLOOR);
    expect(zoneForRoutingKey("")).toBe(SensorZone.FLOOR);
  });

  test("requires the trailing dot — a prefix match alone is not HVAC", () => {
    // "sensor.hvacuum.x" must not be treated as the hvac zone.
    expect(zoneForRoutingKey("sensor.hvacuum.x")).toBe(SensorZone.FLOOR);
  });
});

describe("deriveStatus", () => {
  test("temperature thresholds (warning 70, critical 85)", () => {
    expect(deriveStatus(SensorType.TEMPERATURE, 20)).toBe(SensorStatus.NORMAL);
    expect(deriveStatus(SensorType.TEMPERATURE, 69.9)).toBe(SensorStatus.NORMAL);
    expect(deriveStatus(SensorType.TEMPERATURE, 70)).toBe(SensorStatus.WARNING);
    expect(deriveStatus(SensorType.TEMPERATURE, 84.9)).toBe(SensorStatus.WARNING);
    expect(deriveStatus(SensorType.TEMPERATURE, 85)).toBe(SensorStatus.CRITICAL);
    expect(deriveStatus(SensorType.TEMPERATURE, 120)).toBe(SensorStatus.CRITICAL);
  });

  test("boundaries are inclusive (>= threshold)", () => {
    expect(deriveStatus(SensorType.HUMIDITY, 80)).toBe(SensorStatus.WARNING);
    expect(deriveStatus(SensorType.HUMIDITY, 95)).toBe(SensorStatus.CRITICAL);
  });

  test("motion collapses warning and critical at the same threshold", () => {
    expect(deriveStatus(SensorType.MOTION, 0)).toBe(SensorStatus.NORMAL);
    // warning === critical === 1, so a hit goes straight to CRITICAL.
    expect(deriveStatus(SensorType.MOTION, 1)).toBe(SensorStatus.CRITICAL);
  });
});
