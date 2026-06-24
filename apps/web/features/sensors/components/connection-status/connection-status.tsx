"use client";

import { useSensorStore } from "../../sensor-store";

export function ConnectionStatus() {
  const connected = useSensorStore((state) => state.connected);

  return (
    <span
      style={{
        fontFamily: "monospace",
        fontSize: 14,
        color: connected ? "#3ad07a" : "#e03030",
      }}
    >
      {connected ? "● live" : "○ disconnected"}
    </span>
  );
}
