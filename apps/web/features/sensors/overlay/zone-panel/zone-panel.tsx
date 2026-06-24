"use client";

import { STATUS_COLOR } from "@repo/shared-types";

import { useSystemHealth } from "../../hooks/use-system-health";
import { useZoneSummary } from "../../hooks/use-zone-summary";
import { ZONE_LABEL } from "../../labels";
import { pluralizeNodes } from "./pluralize-nodes";

// Left panel: facility title, per-zone status dots + node counts, and a derived
// system-health bar. All values come from the live store via memoised selectors.
export function ZonePanel() {
  const zones = useZoneSummary();
  const health = useSystemHealth();

  return (
    <div className="glass-panel pointer-events-auto flex h-fit max-h-full w-full flex-col rounded-xl p-5 md:w-80">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Edge IoT Spatial</h1>
          <p className="text-xs text-slate-500">Facility Alpha · Floor 2</p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded border border-blue-200 bg-blue-100">
          <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
      </div>

      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Active Zones
      </h2>
      <div className="flex flex-grow flex-col gap-2 overflow-y-auto">
        {zones.map((zone) => (
          <div
            key={zone.zone}
            className="flex items-center justify-between rounded border border-transparent p-2 transition-colors hover:border-slate-200 hover:bg-slate-50"
          >
            <div className="flex items-center gap-3">
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: STATUS_COLOR[zone.worstStatus],
                  boxShadow: `0 0 8px ${STATUS_COLOR[zone.worstStatus]}`,
                }}
              />
              <span className="text-sm text-slate-700">{ZONE_LABEL[zone.zone]}</span>
            </div>
            <span className="font-mono text-xs text-slate-400">
              {zone.nodeCount} {pluralizeNodes(zone.nodeCount)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 border-t border-slate-200 pt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">System Health</span>
          <span className="font-mono text-emerald-600">{health.toFixed(1)}%</span>
        </div>
        <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200">
          <div
            className="h-1.5 rounded-full bg-emerald-500 transition-all"
            style={{ width: `${health}%` }}
          />
        </div>
      </div>
    </div>
  );
}
