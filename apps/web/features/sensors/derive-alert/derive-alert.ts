import { AlertEvent, SensorState } from "@repo/shared-types";

import { STATUS_SEVERITY } from "../constants";

// Pure degradation detector: returns an AlertEvent when `next` crosses into a
// *worse* severity than `previous`, otherwise null. Recovery (a move to a less
// severe status) and the very first reading (no `previous`) never raise an
// alert. `seq` is supplied by the caller so id generation stays deterministic
// and this function has no module state — making it trivially unit-testable.
export function deriveDegradeAlert({
  previous,
  next,
  seq,
}: {
  previous: SensorState | undefined;
  next: SensorState;
  seq: number;
}): AlertEvent | null {
  if (previous === undefined) return null;
  if (STATUS_SEVERITY[next.status] <= STATUS_SEVERITY[previous.status]) {
    return null;
  }

  return {
    id: `${next.id}-${next.lastUpdated}-${seq}`,
    sensorId: next.id,
    type: next.type,
    fromStatus: previous.status,
    toStatus: next.status,
    value: next.value,
    unit: next.unit,
    timestamp: next.lastUpdated,
  };
}
