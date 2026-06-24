const GRID_SIZE = 40;
const GRID_DIVISIONS = 40;
const GRID_CENTER_COLOR = "#334155";
const GRID_LINE_COLOR = "#1e293b";
const FLOOR_COLOR = "#0f172a";

// Floor grid + a dark plane just beneath it, sized to the concept's 40×40 grid.
// (Glass walls + zone tinting are deferred Phase 4 polish.)
export function FacilityFloor() {
  return (
    <group>
      <gridHelper
        args={[GRID_SIZE, GRID_DIVISIONS, GRID_CENTER_COLOR, GRID_LINE_COLOR]}
        position-y={-0.01}
      />
      <mesh rotation-x={-Math.PI / 2} position-y={-0.05}>
        <planeGeometry args={[GRID_SIZE, GRID_SIZE]} />
        <meshBasicMaterial color={FLOOR_COLOR} />
      </mesh>
    </group>
  );
}
