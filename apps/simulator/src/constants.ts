import { SensorType } from "@repo/shared-types";

// Connection / loop defaults (overridable via env — see .env.example)
export const DEFAULT_RABBITMQ_URL = "amqp://guest:guest@localhost:5672";
export const DEFAULT_EMIT_INTERVAL_MS = 2000;

// Initial-connect retry policy: exponential backoff, capped attempts.
export const MAX_CONNECT_ATTEMPTS = 5;
export const BASE_BACKOFF_MS = 500;

// Inclusive value bounds per sensor type. MOTION is binary and handled
// specially via MOTION_DETECTION_PROBABILITY rather than a uniform range.
export const VALUE_RANGES: Record<SensorType, { min: number; max: number }> = {
  [SensorType.TEMPERATURE]: { min: 50, max: 95 },
  [SensorType.HUMIDITY]: { min: 60, max: 100 },
  [SensorType.MOTION]: { min: 0, max: 1 },
  [SensorType.MACHINE_STATUS]: { min: 20, max: 100 },
};

// Chance that a MOTION sensor reports a detection (value 1) on a given tick.
export const MOTION_DETECTION_PROBABILITY = 0.2;
