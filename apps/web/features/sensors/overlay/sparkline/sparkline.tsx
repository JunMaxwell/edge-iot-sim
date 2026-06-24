import { buildPoints, VIEW_H, VIEW_W } from "./build-points";

const STROKE = "#3b82f6";

// Tiny SVG trend line built from a sensor's value history. The point maths lives
// in the pure `buildPoints` helper (colocated, unit-tested); this is just markup.
export function Sparkline({ values }: { values: number[] }) {
  const points = buildPoints(values);

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className="h-full w-full"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="sparkline-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={STROKE} stopOpacity="0.4" />
          <stop offset="100%" stopColor={STROKE} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${VIEW_H} ${points} ${VIEW_W},${VIEW_H}`}
        fill="url(#sparkline-fill)"
      />
      <polyline
        points={points}
        fill="none"
        stroke={STROKE}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
