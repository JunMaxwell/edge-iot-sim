import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

// Extend dayjs once at module load (no useEffect needed). Used by the alert feed
// and device HUD to render "12s ago"-style timestamps.
dayjs.extend(relativeTime);

export function formatRelative(timestamp: number): string {
  return dayjs(timestamp).fromNow();
}

export function formatClock(timestamp: number): string {
  return dayjs(timestamp).format("HH:mm:ss");
}
