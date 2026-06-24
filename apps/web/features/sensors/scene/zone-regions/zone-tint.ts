import { SensorZone } from "@repo/shared-types";

// Calm per-zone backdrop hues — not status colours, just a spatial grouping cue.
// Lives web-side only (purely presentational; unlike STATUS_COLOR it isn't shared
// with the API or any non-UI consumer).
export const ZONE_TINT: Record<SensorZone, string> = {
  [SensorZone.HVAC]: "#1e3a8a",  // deep blue
  [SensorZone.FLOOR]: "#134e4a", // teal
};
