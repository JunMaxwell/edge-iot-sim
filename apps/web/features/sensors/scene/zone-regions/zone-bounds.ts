import { type SensorState, SensorZone, zoneForRoutingKey } from "@repo/shared-types";

import { SCENE_SCALE } from "../../constants";

export interface ZoneBounds {
  zone: SensorZone;
  width: number;
  depth: number;
  centerX: number;
  centerZ: number;
}

// Padding added to the min/max sensor extents so the tinted region extends
// slightly beyond the outermost node in each zone.
const PADDING = 2;

// Pure function: compute a padded bounding rectangle per zone from the live
// sensor positions. Exported for unit testing in Phase 6.
export function computeZoneBounds(sensors: Record<string, SensorState>): ZoneBounds[] {
  const points: Record<SensorZone, { xs: number[]; zs: number[] }> = {
    [SensorZone.HVAC]: { xs: [], zs: [] },
    [SensorZone.FLOOR]: { xs: [], zs: [] },
  };

  for (const sensor of Object.values(sensors)) {
    const zone = zoneForRoutingKey(sensor.routingKey);
    points[zone].xs.push(sensor.position.x * SCENE_SCALE);
    points[zone].zs.push(sensor.position.z * SCENE_SCALE);
  }

  const result: ZoneBounds[] = [];
  for (const zoneKey of Object.values(SensorZone)) {
    const { xs, zs } = points[zoneKey];
    if (xs.length === 0) continue;

    const minX = Math.min(...xs) - PADDING;
    const maxX = Math.max(...xs) + PADDING;
    const minZ = Math.min(...zs) - PADDING;
    const maxZ = Math.max(...zs) + PADDING;

    result.push({
      zone: zoneKey,
      width: maxX - minX,
      depth: maxZ - minZ,
      centerX: (minX + maxX) / 2,
      centerZ: (minZ + maxZ) / 2,
    });
  }

  return result;
}
