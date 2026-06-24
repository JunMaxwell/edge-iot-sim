import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { useSensorStore } from "../../sensor-store";
import { computeZoneBounds } from "./zone-bounds";
import { ZONE_TINT } from "./zone-tint";

const REGION_Y = 0.002; // just above the grid (y=-0.01) — avoids z-fighting

// Faint per-zone floor patches that visually group HVAC vs Floor sensors.
// Bounds are computed from live sensor positions so they adapt if positions ever
// change. depthWrite=false + low opacity prevents z-fighting with the grid plane.
export function ZoneRegions() {
  const sensors = useSensorStore(useShallow((s) => s.sensors));
  const bounds = useMemo(() => computeZoneBounds(sensors), [sensors]);

  return (
    <group>
      {bounds.map(({ zone, width, depth, centerX, centerZ }) => (
        <mesh
          key={zone}
          rotation-x={-Math.PI / 2}
          position={[centerX, REGION_Y, centerZ]}
          raycast={() => null}
        >
          <planeGeometry args={[width, depth]} />
          <meshBasicMaterial
            color={ZONE_TINT[zone]}
            transparent
            opacity={0.12}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
