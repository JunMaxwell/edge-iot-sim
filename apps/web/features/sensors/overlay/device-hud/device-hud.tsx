"use client";

import { SensorType, STATUS_COLOR, zoneForRoutingKey } from "@repo/shared-types";

import { formatReading } from "../../format-reading";
import { SENSOR_TYPE_LABEL, ZONE_LABEL } from "../../labels";
import { formatRelative } from "../../relative-time";
import { useSensorStore } from "../../sensor-store";
import { Sparkline } from "../sparkline/sparkline";

// Stable empty-array reference. A selector must never return a fresh literal —
// zustand compares snapshots by identity, so `?? []` inline would loop forever.
const EMPTY_HISTORY: number[] = [];

export function DeviceHud() {
  const selectedId = useSensorStore((state) => state.selectedSensorId);
  const sensor = useSensorStore((state) =>
    selectedId ? state.sensors[selectedId] : undefined,
  );
  const history = useSensorStore((state) =>
    selectedId ? (state.history[selectedId] ?? EMPTY_HISTORY) : EMPTY_HISTORY,
  );
  const clearSensor = useSensorStore((state) => state.clearSensor);

  const visible = Boolean(sensor);
  const color = sensor ? STATUS_COLOR[sensor.status] : STATUS_COLOR.normal;

  return (
    <div
      className={`glass-panel absolute bottom-6 left-1/2 w-96 -translate-x-1/2 rounded-xl p-5 transition-opacity duration-300 ${
        visible ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      {sensor ? (
        <>
          <div className="mb-4 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
                />
                <h3 className="font-mono text-base font-semibold text-slate-900">{sensor.id}</h3>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {ZONE_LABEL[zoneForRoutingKey(sensor.routingKey)]} ·{" "}
                {SENSOR_TYPE_LABEL[sensor.type]}
              </p>
            </div>
            <button
              type="button"
              onClick={() => clearSensor()}
              className="text-slate-400 transition-colors hover:text-slate-700"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <p className="text-[10px] uppercase tracking-wide text-slate-400">
              {SENSOR_TYPE_LABEL[sensor.type]}
            </p>
            <p className="mt-1 font-mono text-2xl text-slate-900">
              {sensor.type === SensorType.MOTION ? (
                formatReading({ type: sensor.type, value: sensor.value, unit: sensor.unit })
              ) : (
                <>
                  {sensor.value}
                  <span className="ml-1 text-sm text-slate-500">{sensor.unit}</span>
                </>
              )}
            </p>
            <p className="mt-1 text-[10px] text-slate-400">
              Updated {formatRelative(sensor.lastUpdated)}
            </p>
          </div>

          <div className="mt-2">
            <p className="mb-2 text-[10px] uppercase tracking-wide text-slate-400">Recent Trend</p>
            <div className="relative h-10 w-full">
              <Sparkline values={history} />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
