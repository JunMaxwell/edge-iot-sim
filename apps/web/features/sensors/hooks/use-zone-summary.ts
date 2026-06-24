import { useMemo } from "react";

import { useSensorStore } from "../sensor-store";
import { computeZoneSummary, type ZoneSummary } from "./compute-zone-summary";

export type { ZoneSummary };

// Groups live sensors by zone and aggregates the worst status per zone (drives
// the zone dots + node counts). Thin memoised wrapper over the pure
// `computeZoneSummary`, against the `sensors` record reference.
export function useZoneSummary(): ZoneSummary[] {
  const sensors = useSensorStore((state) => state.sensors);
  return useMemo(() => computeZoneSummary(sensors), [sensors]);
}
