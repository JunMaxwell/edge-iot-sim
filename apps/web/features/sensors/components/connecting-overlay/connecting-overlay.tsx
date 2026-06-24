"use client";

import { useSensorStore } from "../../sensor-store";

// Cold-load affordance shown before the scene has anything to render. Driven
// purely off store state (no useEffect): the socket singleton flips `connected`
// and the first SENSOR_BATCH fills `sensors`, which hides this layer.
//   - not connected      → "Connecting to telemetry…"
//   - connected, no data  → "Awaiting first reading…"
//   - sensors present     → render nothing (scene + panels take over)
// Centred and pointer-events-none so it never blocks orbit/drag on the canvas.
export function ConnectingOverlay() {
  const connected = useSensorStore((state) => state.connected);
  // Select a primitive (boolean), not a fresh array/object, so the snapshot is
  // referentially stable across renders (avoids the zustand snapshot warning).
  const hasSensors = useSensorStore(
    (state) => Object.keys(state.sensors).length > 0,
  );

  if (hasSensors) return null;

  const message = connected
    ? "Awaiting first reading…"
    : "Connecting to telemetry…";

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
      <div className="glass-panel flex items-center gap-3 rounded-xl px-6 py-4">
        <span
          className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600"
          role="status"
          aria-label="Loading"
        />
        <span className="font-mono text-sm text-slate-600">{message}</span>
      </div>
    </div>
  );
}
