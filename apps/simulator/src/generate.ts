import { SensorPayload, SensorType } from "@repo/shared-types";

import { MOTION_DETECTION_PROBABILITY, VALUE_RANGES } from "./constants";
import { SensorFixture } from "./fixtures";

// Random value within the type's bounds. MOTION is binary; every other type is a
// continuous reading rounded to one decimal place to mirror real sensor output.
function generateValue(type: SensorType): number {
  if (type === SensorType.MOTION) {
    return Math.random() < MOTION_DETECTION_PROBABILITY ? 1 : 0;
  }
  const { min, max } = VALUE_RANGES[type];
  const value = min + Math.random() * (max - min);
  return Math.round(value * 10) / 10;
}

// Pure transform: a fixture plus a fresh random reading and timestamp becomes a
// publishable payload. No side effects, so it is trivial to unit test.
export function generatePayload(fixture: SensorFixture): SensorPayload {
  return {
    id: fixture.id,
    type: fixture.type,
    value: generateValue(fixture.type),
    unit: fixture.unit,
    position: fixture.position,
    timestamp: Date.now(),
    routingKey: fixture.routingKey,
  };
}
