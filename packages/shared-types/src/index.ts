export enum SensorType {
  TEMPERATURE = "temperature",
  HUMIDITY = "humidity",
  MOTION = "motion",
  MACHINE_STATUS = "machine_status",
}

export enum SensorStatus {
  NORMAL = "normal",
  WARNING = "warning",
  CRITICAL = "critical",
  OFFLINE = "offline",
}

export interface SensorPosition {
  x: number;
  y: number;
  z: number;
}

export interface SensorPayload {
  id: string;
  type: SensorType;
  value: number;
  unit: string;
  position: SensorPosition;
  timestamp: number;
  routingKey: string; // e.g. "sensor.hvac.temp", "sensor.security.motion"
}

export interface SensorState extends SensorPayload {
  status: SensorStatus;
  lastUpdated: number;
}

export const THRESHOLDS: Record<SensorType, { warning: number; critical: number }> = {
  [SensorType.TEMPERATURE]: { warning: 70, critical: 85 },
  [SensorType.HUMIDITY]: { warning: 80, critical: 95 },
  [SensorType.MOTION]: { warning: 1, critical: 1 },
  [SensorType.MACHINE_STATUS]: { warning: 50, critical: 80 },
};

export function deriveStatus(type: SensorType, value: number): SensorStatus {
  const t = THRESHOLDS[type];
  if (value >= t.critical) return SensorStatus.CRITICAL;
  if (value >= t.warning) return SensorStatus.WARNING;
  return SensorStatus.NORMAL;
}

// Socket.IO event names — single source of truth
export const SOCKET_EVENTS = {
  SENSOR_UPDATE: "sensor:update",
  SENSOR_BATCH: "sensor:batch",
} as const;
