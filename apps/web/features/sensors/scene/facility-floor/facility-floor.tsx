const GRID_SIZE = 40;
const GRID_DIVISIONS = 40;
const GRID_CENTER_COLOR = "#94a3b8";
const GRID_LINE_COLOR = "#e2e8f0";
const FLOOR_COLOR = "#f8fafc";

// Floor grid + a light plane beneath it, matching the concept's light theme.
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
