"use client";

import { STATUS_COLOR, zoneForRoutingKey } from "@repo/shared-types";

import { SENSOR_TYPE_LABEL, ZONE_LABEL } from "../../labels";
import { formatRelative } from "../../relative-time";
import { useSensorStore } from "../../sensor-store";
import { Sparkline } from "../sparkline/sparkline";

// Stable empty-array reference. A selector must never return a fresh literal —
// zustand compares snapshots by identity, so `?? []` inline would loop forever.
const EMPTY_HISTORY: number[] = [];

// Bottom-centre HUD for the selected sensor: status, id, zone, the single live
// metric, relative last-updated, and a value sparkline. Stays mounted and fades
// via opacity (per concept) so there's no layout jump on open/close.
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
                <h3 className="font-mono text-base font-semibold text-white">{sensor.id}</h3>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {ZONE_LABEL[zoneForRoutingKey(sensor.routingKey)]} ·{" "}
                {SENSOR_TYPE_LABEL[sensor.type]}
              </p>
            </div>
            <button
              type="button"
              onClick={() => clearSensor()}
              className="text-slate-500 transition-colors hover:text-white"
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

          <div className="mb-4 rounded-lg border border-slate-700/50 bg-slate-800/50 p-3">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">
              {SENSOR_TYPE_LABEL[sensor.type]}
            </p>
            <p className="mt-1 font-mono text-2xl text-white">
              {sensor.value}
              <span className="ml-1 text-sm text-slate-400">{sensor.unit}</span>
            </p>
            <p className="mt-1 text-[10px] text-slate-500">
              Updated {formatRelative(sensor.lastUpdated)}
            </p>
          </div>

          <div className="mt-2">
            <p className="mb-2 text-[10px] uppercase tracking-wide text-slate-500">Recent Trend</p>
            <div className="relative h-10 w-full">
              <Sparkline values={history} />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
