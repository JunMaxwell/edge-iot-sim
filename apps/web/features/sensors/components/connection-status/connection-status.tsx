"use client";

import { useSensorStore } from "../../sensor-store";

// Socket connection indicator. Tailwind classes (to match the rest of the
// overlay); colours drawn from the shared palette — emerald-500 (#10b981) for
// live, red-500 (#ef4444) for disconnected.
export function ConnectionStatus() {
  const connected = useSensorStore((state) => state.connected);

  return (
    <span
      className={`font-mono text-sm ${
        connected ? "text-emerald-500" : "text-red-500"
      }`}
    >
      {connected ? "● live" : "○ disconnected"}
    </span>
  );
}
