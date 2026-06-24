import { AlertEvent, SensorState, SensorStatus } from "@repo/shared-types";
import { create } from "zustand";

import { HISTORY_LENGTH, MAX_ALERTS } from "./constants";
import { deriveDegradeAlert } from "./derive-alert/derive-alert";

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
  // Transitions a sensor to OFFLINE and emits an alert. `now` is passed in from
  // the staleness watcher so Date.now() is called once per sweep, not inside the
  // reducer (workflow scripts disallow Date.now() inside pure functions).
  markOffline: (id: string, now: number) => void;
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

      // Raise an alert only when the status degrades to a worse severity level.
      const alert = deriveDegradeAlert({
        previous,
        next: state,
        seq: alertSeq,
      });
      if (alert) alertSeq += 1;

      const alerts = alert
        ? [alert, ...prev.alerts].slice(0, MAX_ALERTS)
        : prev.alerts;

      return {
        sensors: { ...prev.sensors, [state.id]: state },
        history: { ...prev.history, [state.id]: nextHistory },
        alerts,
      };
    }),

  selectSensor: (id) => set({ selectedSensorId: id }),
  clearSensor: () => set({ selectedSensorId: null }),

  markOffline: (id, now) =>
    set((prev) => {
      const sensor = prev.sensors[id];
      // Guard: only transition once, never re-raise if already OFFLINE.
      if (!sensor || sensor.status === SensorStatus.OFFLINE) return prev;
      const offlineSensor: SensorState = { ...sensor, status: SensorStatus.OFFLINE };
      const alert: AlertEvent = {
        id: `${id}-offline-${alertSeq++}`,
        sensorId: id,
        type: sensor.type,
        fromStatus: sensor.status,
        toStatus: SensorStatus.OFFLINE,
        value: sensor.value,
        unit: sensor.unit,
        timestamp: now,
      };
      return {
        sensors: { ...prev.sensors, [id]: offlineSensor },
        alerts: [alert, ...prev.alerts].slice(0, MAX_ALERTS),
      };
    }),
}));
