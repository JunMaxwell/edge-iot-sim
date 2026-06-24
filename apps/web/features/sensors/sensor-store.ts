import { SensorState } from "@repo/shared-types";
import { create } from "zustand";

interface SensorStoreState {
  sensors: Record<string, SensorState>;
  connected: boolean;
  setConnected: (connected: boolean) => void;
  applyBatch: (states: SensorState[]) => void;
  applyUpdate: (state: SensorState) => void;
}

// Live sensor state, written directly by the socket singleton (outside React)
// and read by components via selector hooks — so no component owns the
// connection and no useEffect is needed (project rule: avoid useEffect).
export const useSensorStore = create<SensorStoreState>((set) => ({
  sensors: {},
  connected: false,
  setConnected: (connected) => set({ connected }),
  // Replaces the whole map — also handles re-seeding after a reconnect.
  applyBatch: (states) =>
    set({ sensors: Object.fromEntries(states.map((state) => [state.id, state])) }),
  applyUpdate: (state) =>
    set((prev) => ({ sensors: { ...prev.sensors, [state.id]: state } })),
}));
