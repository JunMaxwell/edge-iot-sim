import { RoutingKey } from "@repo/shared-types";

// Prefix keeps sensor queues namespaced in the broker's queue list.
export const QUEUE_PREFIX = "iot";

// Durable queue name for a given routing key, e.g.
// "sensor.hvac.temperature" -> "iot.sensor.hvac.temperature".
export function queueNameFor(routingKey: RoutingKey): string {
  return `${QUEUE_PREFIX}.${routingKey}`;
}
