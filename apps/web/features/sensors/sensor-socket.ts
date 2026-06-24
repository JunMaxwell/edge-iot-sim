import {
  ClientToServerEvents,
  ServerToClientEvents,
  SOCKET_EVENTS,
} from "@repo/shared-types";
import { io, type Socket } from "socket.io-client";

import { useSensorStore } from "./sensor-store";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000";

// Module-level singleton. The client listens for ServerToClient events and
// (in Phase 3) emits nothing back.
let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

// Idempotent + SSR-safe: connects once in the browser and wires socket events
// straight into the Zustand store. Safe to call on every render.
export function connectSensorSocket(): void {
  if (typeof window === "undefined" || socket) return;

  socket = io(SOCKET_URL);

  socket.on("connect", () => useSensorStore.getState().setConnected(true));
  socket.on("disconnect", () => useSensorStore.getState().setConnected(false));
  socket.on(SOCKET_EVENTS.SENSOR_BATCH, (states) =>
    useSensorStore.getState().applyBatch(states),
  );
  socket.on(SOCKET_EVENTS.SENSOR_UPDATE, (state) =>
    useSensorStore.getState().applyUpdate(state),
  );
}
