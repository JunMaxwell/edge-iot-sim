// Sparkline viewBox dimensions — shared by the SVG element and the point maths.
export const VIEW_W = 100;
export const VIEW_H = 20;

// Maps a value series → "x,y x,y …" within the viewBox. Pure (no React, no DOM)
// so it stays trivially testable and allocation-light. An empty or single-point
// series renders a centred baseline; a flat series collapses to mid-height.
export function buildPoints(values: number[]): string {
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
