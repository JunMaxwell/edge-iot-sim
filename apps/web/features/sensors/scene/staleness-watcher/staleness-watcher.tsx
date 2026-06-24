import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

import { OFFLINE_AFTER_MS } from "../../constants";
import { useSensorStore } from "../../sensor-store";

// Throttle the sweep to ~1 Hz — checking every frame is wasteful and would call
// set() on every frame for stale sensors, causing unnecessary React renders.
const SWEEP_INTERVAL_MS = 1000;

// Headless R3F component that runs a staleness sweep in the animation loop.
// Lives inside <Canvas> to access useFrame — no useEffect, no timers.
// When a sensor's lastUpdated is older than OFFLINE_AFTER_MS, it calls
// markOffline once (the store action guards against double-transitions).
export function StalenessWatcher() {
  const accumulated = useRef(0);

  useFrame((_, delta) => {
    accumulated.current += delta * 1000;
    if (accumulated.current < SWEEP_INTERVAL_MS) return;
    accumulated.current = 0;

    const now = Date.now();
    const { sensors, markOffline } = useSensorStore.getState();

    for (const id of Object.keys(sensors)) {
      const sensor = sensors[id];
      if (sensor && now - sensor.lastUpdated > OFFLINE_AFTER_MS) {
        markOffline(id, now);
      }
    }
  });

  return null;
}
