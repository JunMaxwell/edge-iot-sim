"use client";

import { SensorState, SensorStatus } from "@repo/shared-types";

import { useSensorStore } from "../../sensor-store";

// Status → colour. Keyed by the SensorStatus enum so adding a status is one edit.
const STATUS_COLOR: Record<SensorStatus, string> = {
  [SensorStatus.NORMAL]: "#8a8a99",
  [SensorStatus.WARNING]: "#e0a020",
  [SensorStatus.CRITICAL]: "#e03030",
  [SensorStatus.OFFLINE]: "#555566",
};

// Whole numbers print as-is; readings keep a single decimal (e.g. 73.4).
function formatValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function SensorRow({ sensor }: { sensor: SensorState }) {
  return (
    <tr style={{ borderBottom: "1px solid #1c1c26" }}>
      <td style={{ padding: "8px 12px", fontFamily: "monospace" }}>{sensor.id}</td>
      <td style={{ padding: "8px 12px", color: "#8a8a99" }}>{sensor.type}</td>
      <td style={{ padding: "8px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
        {formatValue(sensor.value)}
        {sensor.unit}
      </td>
      <td
        style={{
          padding: "8px 12px",
          fontWeight: 600,
          color: STATUS_COLOR[sensor.status],
        }}
      >
        {sensor.status.toUpperCase()}
      </td>
    </tr>
  );
}

export function SensorList() {
  const sensors = useSensorStore((state) => state.sensors);
  const rows = Object.values(sensors).sort((a, b) => a.id.localeCompare(b.id));

  if (rows.length === 0) {
    return (
      <p style={{ fontFamily: "monospace", color: "#666" }}>
        Waiting for sensor data…
      </p>
    );
  }

  return (
    <table style={{ borderCollapse: "collapse", minWidth: 420 }}>
      <thead>
        <tr style={{ textAlign: "left", color: "#666", fontSize: 12 }}>
          <th style={{ padding: "8px 12px" }}>Sensor</th>
          <th style={{ padding: "8px 12px" }}>Type</th>
          <th style={{ padding: "8px 12px", textAlign: "right" }}>Value</th>
          <th style={{ padding: "8px 12px" }}>Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((sensor) => (
          <SensorRow key={sensor.id} sensor={sensor} />
        ))}
      </tbody>
    </table>
  );
}
