import { SensorType, SensorZone } from "@repo/shared-types";

// Human-readable display names — single source of truth for the overlay UI so
// the zone panel, alert feed, and HUD all label things identically.
export const ZONE_LABEL: Record<SensorZone, string> = {
  [SensorZone.HVAC]: "HVAC",
  [SensorZone.FLOOR]: "Floor",
};

export const SENSOR_TYPE_LABEL: Record<SensorType, string> = {
  [SensorType.TEMPERATURE]: "Temperature",
  [SensorType.HUMIDITY]: "Humidity",
  [SensorType.MOTION]: "Motion",
  [SensorType.MACHINE_STATUS]: "Machine Status",
};
