import { SensorState, SensorStatus, SensorType } from "@repo/shared-types";
import { describe, expect, test } from "bun:test";

import { deriveDegradeAlert } from "./derive-alert";

function sensor(status: SensorStatus, overrides: Partial<SensorState> = {}): SensorState {
  return {
    id: "hvac-temp-1",
    type: SensorType.TEMPERATURE,
    value: 72,
    unit: "°C",
    position: { x: 0, y: 0, z: 0 },
    timestamp: 1000,
    routingKey: "sensor.hvac.temperature",
    status,
    lastUpdated: 1000,
    ...overrides,
  };
}

describe("deriveDegradeAlert", () => {
  test("no previous reading → no alert (first reading never alerts)", () => {
    const alert = deriveDegradeAlert({
      previous: undefined,
      next: sensor(SensorStatus.CRITICAL),
      seq: 0,
    });
    expect(alert).toBeNull();
  });

  test("raises on NORMAL → WARNING", () => {
    const alert = deriveDegradeAlert({
      previous: sensor(SensorStatus.NORMAL),
      next: sensor(SensorStatus.WARNING),
      seq: 7,
    });
    expect(alert).not.toBeNull();
    expect(alert?.fromStatus).toBe(SensorStatus.NORMAL);
    expect(alert?.toStatus).toBe(SensorStatus.WARNING);
    expect(alert?.id).toBe("hvac-temp-1-1000-7");
  });

  test("does NOT raise on recovery CRITICAL → WARNING", () => {
    const alert = deriveDegradeAlert({
      previous: sensor(SensorStatus.CRITICAL),
      next: sensor(SensorStatus.WARNING),
      seq: 0,
    });
    expect(alert).toBeNull();
  });

  test("does NOT raise when status is unchanged", () => {
    const alert = deriveDegradeAlert({
      previous: sensor(SensorStatus.WARNING),
      next: sensor(SensorStatus.WARNING),
      seq: 0,
    });
    expect(alert).toBeNull();
  });

  test("raises on WARNING → CRITICAL and carries the new value/unit", () => {
    const alert = deriveDegradeAlert({
      previous: sensor(SensorStatus.WARNING, { value: 75 }),
      next: sensor(SensorStatus.CRITICAL, { value: 90, lastUpdated: 2000 }),
      seq: 3,
    });
    expect(alert?.toStatus).toBe(SensorStatus.CRITICAL);
    expect(alert?.value).toBe(90);
    expect(alert?.timestamp).toBe(2000);
  });
});
