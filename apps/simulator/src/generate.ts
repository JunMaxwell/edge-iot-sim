import { SensorPayload, SensorType } from "@repo/shared-types";

import { MOTION_DETECTION_PROBABILITY, VALUE_RANGES } from "./constants";
import { SensorFixture } from "./fixtures";

// Keep track of the last generated value per sensor to simulate realistic continuous data
const previousValues = new Map<string, number>();

// Random value within the type's bounds using a random walk.
// MOTION is binary; every other type is a continuous reading rounded to one decimal place.
function generateValue(type: SensorType, id: string): number {
  if (type === SensorType.MOTION) {
    return Math.random() < MOTION_DETECTION_PROBABILITY ? 1 : 0;
  }
  
  const { min, max } = VALUE_RANGES[type];
  const previous = previousValues.get(id);
  
  if (previous === undefined) {
    const value = min + Math.random() * (max - min);
    const rounded = Math.round(value * 10) / 10;
    previousValues.set(id, rounded);
    return rounded;
  }

  // Max change per tick is 5% of the total range to ensure smooth transitions
  const maxDelta = (max - min) * 0.05;
  const delta = (Math.random() * 2 - 1) * maxDelta;
  
  let newValue = previous + delta;
  
  // Clamp value to min/max range
  if (newValue < min) newValue = min;
  if (newValue > max) newValue = max;
  
  const rounded = Math.round(newValue * 10) / 10;
  previousValues.set(id, rounded);
  return rounded;
}

// Transform: a fixture plus a pseudo-random walk reading and timestamp becomes a publishable payload.
export function generatePayload(fixture: SensorFixture): SensorPayload {
  return {
    id: fixture.id,
    type: fixture.type,
    value: generateValue(fixture.type, fixture.id),
    unit: fixture.unit,
    position: fixture.position,
    timestamp: Date.now(),
    routingKey: fixture.routingKey,
  };
}
