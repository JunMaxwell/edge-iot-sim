"use client";

import { connectSensorSocket } from "../../sensor-socket";

// Renders nothing — its only job is to kick off the socket singleton on the
// first client render. connectSensorSocket() is idempotent and SSR-safe, so
// calling it during render needs no useEffect (project rule: avoid useEffect).
export function SensorSocketInit() {
  connectSensorSocket();
  return null;
}
