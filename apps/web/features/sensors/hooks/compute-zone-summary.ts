import {
  SensorState,
  SensorStatus,
  SensorZone,
  zoneForRoutingKey,
} from "@repo/shared-types";

import { STATUS_SEVERITY } from "../constants";

export interface ZoneSummary {
  zone: SensorZone;
  nodeCount: number;
  worstStatus: SensorStatus;
}

// Stable, deterministic order for the zone list in the left panel.
export const ZONE_ORDER: SensorZone[] = [SensorZone.HVAC, SensorZone.FLOOR];

// Pure aggregation: groups live sensors by zone, counts them, and derives the
// worst status per zone (drives the zone dots + node counts). No React —
// wrapped by `useZoneSummary` and unit-tested directly. Always returns one entry
// per zone in ZONE_ORDER, even for empty zones.
export function computeZoneSummary(
  sensors: Record<string, SensorState>,
): ZoneSummary[] {
  const byZone = new Map<SensorZone, { count: number; worst: SensorStatus }>();
  for (const zone of ZONE_ORDER) {
    byZone.set(zone, { count: 0, worst: SensorStatus.NORMAL });
  }

  for (const sensor of Object.values(sensors)) {
    if (!sensor) continue;
    const zone = zoneForRoutingKey(sensor.routingKey);
    const entry = byZone.get(zone) ?? { count: 0, worst: SensorStatus.NORMAL };
    entry.count += 1;
    if (STATUS_SEVERITY[sensor.status] > STATUS_SEVERITY[entry.worst]) {
      entry.worst = sensor.status;
    }
    byZone.set(zone, entry);
  }

  return ZONE_ORDER.map((zone) => {
    const entry = byZone.get(zone) ?? { count: 0, worst: SensorStatus.NORMAL };
    return { zone, nodeCount: entry.count, worstStatus: entry.worst };
  });
}
