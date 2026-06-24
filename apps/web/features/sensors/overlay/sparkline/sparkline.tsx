const VIEW_W = 100;
const VIEW_H = 20;
const STROKE = "#3b82f6";

// Tiny SVG trend line built from a sensor's value history. Normalises the series
// into the viewBox; a flat/empty series renders a centred baseline.
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

// Maps values → "x,y x,y …" within the viewBox. Pure so it stays trivially
// testable and allocation-light.
function buildPoints(values: number[]): string {
  if (values.length === 0) {
    return `0,${VIEW_H / 2} ${VIEW_W},${VIEW_H / 2}`;
  }
  if (values.length === 1) {
    const y = VIEW_H / 2;
    return `0,${y} ${VIEW_W},${y}`;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = VIEW_W / (values.length - 1);

  return values
    .map((value, index) => {
      const x = index * step;
      // Invert Y: SVG origin is top-left, higher value should sit higher.
      const y = VIEW_H - ((value - min) / range) * VIEW_H;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}
