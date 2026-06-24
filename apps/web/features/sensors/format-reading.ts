import { SensorType } from "@repo/shared-types";

// Renders a sensor reading as a human phrase. Motion is a binary sensor —
// its raw payload is value: 1, unit: "binary", which must not be shown as
// "1binary". Everything else is a numeric measurement with a unit suffix.
export function formatReading({
  type,
  value,
  unit,
}: {
  type: SensorType;
  value: number;
  unit: string;
}): string {
  if (type === SensorType.MOTION) {
    return value >= 1 ? "Motion detected" : "No motion";
  }
  return `${value}${unit}`;
}
