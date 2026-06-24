"use client";

import { SensorStatus, STATUS_COLOR } from "@repo/shared-types";

import { useSystemHealth } from "../../hooks/use-system-health";
import { useZoneSummary } from "../../hooks/use-zone-summary";
import { ZONE_LABEL } from "../../labels";
import { pluralizeNodes } from "./pluralize-nodes";

// Left panel: facility title, per-zone status dots + node counts, and a derived
// system-health bar. All values come from the live store via memoised selectors.
export function ZonePanel() {
  const zones = useZoneSummary();
  const health = useSystemHealth();
  const healthColor = STATUS_COLOR[SensorStatus.NORMAL];

  return (
    <div className="glass-panel pointer-events-auto flex h-fit max-h-full w-full flex-col rounded-xl p-5 md:w-80">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Edge IoT Spatial</h1>
          <p className="text-xs text-slate-400">Facility Alpha · Floor 2</p>
        </div>
      </div>

      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
        Active Zones
      </h2>
      <div className="flex flex-grow flex-col gap-2 overflow-y-auto">
        {zones.map((zone) => (
          <div
            key={zone.zone}
            className="flex items-center justify-between rounded border border-transparent p-2 transition-colors hover:border-slate-700/50 hover:bg-slate-800/50"
          >
            <div className="flex items-center gap-3">
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: STATUS_COLOR[zone.worstStatus],
                  boxShadow: `0 0 8px ${STATUS_COLOR[zone.worstStatus]}`,
                }}
              />
              <span className="text-sm text-slate-300">{ZONE_LABEL[zone.zone]}</span>
            </div>
            <span className="font-mono text-xs text-slate-500">
              {zone.nodeCount} {pluralizeNodes(zone.nodeCount)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 border-t border-slate-700/50 pt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">System Health</span>
          <span className="font-mono" style={{ color: healthColor }}>
            {health.toFixed(1)}%
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full rounded-full bg-slate-800">
          <div
            className="h-1.5 rounded-full transition-all"
            style={{ width: `${health}%`, backgroundColor: healthColor }}
          />
        </div>
      </div>
    </div>
  );
}
