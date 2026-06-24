import { useMemo } from "react";

import { useSensorStore } from "../sensor-store";
import { computeSystemHealth } from "./compute-system-health";

// Derived system-health score. Reads the `sensors` record (a stable reference
// between updates) and memoises the pure reduction so the maths only re-runs
// when the map actually changes.
export function useSystemHealth(): number {
  const sensors = useSensorStore((state) => state.sensors);
  return useMemo(() => computeSystemHealth(sensors), [sensors]);
}
