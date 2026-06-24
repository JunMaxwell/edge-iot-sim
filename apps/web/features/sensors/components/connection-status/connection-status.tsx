"use client";

import { useSensorStore } from "../../sensor-store";

export function ConnectionStatus() {
  const connected = useSensorStore((state) => state.connected);

  return (
    <span
      style={{
        fontFamily: "monospace",
        fontSize: 14,
        color: connected ? "#059669" : "#dc2626",
      }}
    >
      {connected ? "● live" : "○ disconnected"}
    </span>
  );
}
