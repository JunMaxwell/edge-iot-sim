import { SensorState, SensorStatus } from "@repo/shared-types";

import {
  HEALTH_SCORE_MAX,
  HEALTH_SCORE_MIN,
  HEALTH_WEIGHT_CRITICAL,
  HEALTH_WEIGHT_WARNING,
} from "../constants";

// Pure system-health score: 100 penalised per active fault, clamped to 0–100.
// WARNING and CRITICAL are the only penalised states (OFFLINE = unknown, not a
// fault). No React — wrapped by `useSystemHealth` and unit-tested directly.
export function computeSystemHealth(sensors: Record<string, SensorState>): number {
  let warnings = 0;
  let criticals = 0;
  for (const sensor of Object.values(sensors)) {
    if (sensor?.status === SensorStatus.WARNING) warnings += 1;
    else if (sensor?.status === SensorStatus.CRITICAL) criticals += 1;
  }
  const score =
    HEALTH_SCORE_MAX -
    warnings * HEALTH_WEIGHT_WARNING -
    criticals * HEALTH_WEIGHT_CRITICAL;
  return Math.max(HEALTH_SCORE_MIN, Math.min(HEALTH_SCORE_MAX, score));
}
