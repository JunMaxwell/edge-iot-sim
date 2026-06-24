"use client";

import { AlertEvent, STATUS_COLOR } from "@repo/shared-types";

import { SENSOR_TYPE_LABEL } from "../../labels";
import { formatClock } from "../../relative-time";
import { useSensorStore } from "../../sensor-store";

// Right panel: live status-degradation events, newest first. Clicking a row
// selects the offending sensor (focuses its node + opens the HUD).
export function AlertFeed() {
  const alerts = useSensorStore((state) => state.alerts);

  return (
    <div className="glass-panel pointer-events-auto flex h-96 w-full flex-col rounded-xl p-5 md:h-auto md:max-h-[calc(100vh-3rem)] md:w-80">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          Live Telemetry Events
        </h2>
        <span className="rounded bg-slate-800 px-2 py-1 font-mono text-[10px] text-slate-400">
          LIVE
        </span>
      </div>

      <div className="flex flex-grow flex-col gap-3 overflow-y-auto pr-2">
        {alerts.length === 0 ? (
          <p className="mt-10 text-center text-xs text-slate-400">Waiting for events…</p>
        ) : (
          alerts.map((alert) => <AlertRow key={alert.id} alert={alert} />)
        )}
      </div>
    </div>
  );
}

function AlertRow({ alert }: { alert: AlertEvent }) {
  const selectSensor = useSensorStore((state) => state.selectSensor);
  const color = STATUS_COLOR[alert.toStatus];

  // Select the sensor this alert refers to.
  const handleClick = () => selectSensor(alert.sensorId);

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex cursor-pointer flex-col gap-1 rounded border p-3 text-left transition-all"
      style={{
        borderColor: `${color}4d`,
        backgroundColor: `${color}1a`,
      }}
    >
      <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
        <span>[{formatClock(alert.timestamp)}]</span>
        <span>{alert.sensorId}</span>
      </div>
      <div className="text-sm font-medium" style={{ color }}>
        Status degraded to {alert.toStatus.toUpperCase()}
      </div>
      <div className="text-xs text-slate-400">
        {SENSOR_TYPE_LABEL[alert.type]} at {alert.value}
        {alert.unit}
      </div>
    </button>
  );
}
