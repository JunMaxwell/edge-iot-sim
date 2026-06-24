import { SensorStatus } from "@repo/shared-types";
import { useMemo } from "react";

import {
  HEALTH_SCORE_MAX,
  HEALTH_SCORE_MIN,
  HEALTH_WEIGHT_CRITICAL,
  HEALTH_WEIGHT_WARNING,
} from "../constants";
import { useSensorStore } from "../sensor-store";

// Derived system-health score: 100 penalised per active fault, clamped to 0–100.
// Reads the `sensors` record (a stable reference between updates) and memoises
// the reduction so the maths only re-runs when the map actually changes.
export function useSystemHealth(): number {
  const sensors = useSensorStore((state) => state.sensors);

  return useMemo(() => {
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
  }, [sensors]);
}
