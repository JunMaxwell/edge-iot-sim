import { SensorStatus } from "@repo/shared-types";

// Per-sensor value-history ring buffer length — drives the HUD sparkline.
export const HISTORY_LENGTH = 60;

// Newest-first alert feed cap.
export const MAX_ALERTS = 20;

// System-health penalty weights: health = 100 − warnings·W_WARN − criticals·W_CRIT.
export const HEALTH_WEIGHT_WARNING = 5;
export const HEALTH_WEIGHT_CRITICAL = 15;
export const HEALTH_SCORE_MAX = 100;
export const HEALTH_SCORE_MIN = 0;

// Severity ordering used to detect *degradation* (a move to a worse status).
// Higher number = worse. OFFLINE sits above NORMAL but below active faults.
export const STATUS_SEVERITY: Record<SensorStatus, number> = {
  [SensorStatus.NORMAL]: 0,
  [SensorStatus.OFFLINE]: 1,
  [SensorStatus.WARNING]: 2,
  [SensorStatus.CRITICAL]: 3,
};

// Real sensor positions span roughly x:−4..4, z:−3..3. Spread them out onto the
// 40×40 concept grid so nodes aren't bunched at the origin.
export const SCENE_SCALE = 3;

// A sensor with no update for this long (≈ 8 missed 500 ms ticks) transitions to
// OFFLINE. Evaluated in the R3F render loop (~1 Hz), never in a timer.
export const OFFLINE_AFTER_MS = 4000;
