import { AlertEvent, SensorState } from "@repo/shared-types";
import { create } from "zustand";

import { HISTORY_LENGTH, MAX_ALERTS, STATUS_SEVERITY } from "./constants";

interface SensorStoreState {
  sensors: Record<string, SensorState>;
  history: Record<string, number[]>; // capped value ring buffer per sensor (sparkline)
  alerts: AlertEvent[]; // capped, newest first
  connected: boolean;
  selectedSensorId: string | null;
  // actions
  setConnected: (connected: boolean) => void;
  applyBatch: (states: SensorState[]) => void;
  applyUpdate: (state: SensorState) => void;
  selectSensor: (id: string) => void;
  clearSensor: () => void;
}

// Monotonic counter so alert ids stay unique even when two updates share a
// millisecond timestamp. Module-scoped — alert ids never need to survive reload.
let alertSeq = 0;

// Live sensor state, written directly by the socket singleton (outside React)
// and read by components via selector hooks — so no component owns the
// connection and no useEffect is needed (project rule: avoid useEffect).
export const useSensorStore = create<SensorStoreState>((set) => ({
  sensors: {},
  history: {},
  alerts: [],
  connected: false,
  selectedSensorId: null,

  setConnected: (connected) => set({ connected }),

  // Replaces the whole map — also handles re-seeding after a reconnect. Seeds
  // each sensor's history with its current value so sparklines aren't empty.
  applyBatch: (states) =>
    set({
      sensors: Object.fromEntries(states.map((state) => [state.id, state])),
      history: Object.fromEntries(states.map((state) => [state.id, [state.value]])),
    }),

  // Upsert the sensor, append to its history (capped), and raise an alert when
  // the status degrades to a worse severity level.
  applyUpdate: (state) =>
    set((prev) => {
      const previous = prev.sensors[state.id];

      const prevHistory = prev.history[state.id] ?? [];
      const nextHistory = [...prevHistory, state.value].slice(-HISTORY_LENGTH);

      const degraded =
        previous !== undefined &&
        STATUS_SEVERITY[state.status] > STATUS_SEVERITY[previous.status];

      const alerts = degraded
        ? [
            {
              id: `${state.id}-${state.lastUpdated}-${alertSeq++}`,
              sensorId: state.id,
              type: state.type,
              fromStatus: previous.status,
              toStatus: state.status,
              value: state.value,
              unit: state.unit,
              timestamp: state.lastUpdated,
            },
            ...prev.alerts,
          ].slice(0, MAX_ALERTS)
        : prev.alerts;

      return {
        sensors: { ...prev.sensors, [state.id]: state },
        history: { ...prev.history, [state.id]: nextHistory },
        alerts,
      };
    }),

  selectSensor: (id) => set({ selectedSensorId: id }),
  clearSensor: () => set({ selectedSensorId: null }),
}));
