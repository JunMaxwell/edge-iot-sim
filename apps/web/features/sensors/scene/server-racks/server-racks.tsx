// Decorative server rack props — ported from the BMS concept's addServerRack().
// Racks are purely physical context (non-interactive); they sit in the HVAC
// cluster area and use the same coordinate space as the scaled sensor nodes.

interface RackPosition {
  x: number;
  z: number;
}

// Three racks near the back-left HVAC sensor cluster (hvac-temp-1 at −12, −9).
// Positions chosen to look natural inside the perimeter walls (±17 on x, ±12 on z).
const RACK_POSITIONS: RackPosition[] = [
  { x: -11, z: -7 },
  { x: -11, z: -5 },
  { x: -9, z: -7 },
];

function ServerRack({ x, z }: RackPosition) {
  return (
    <group position={[x, 0, z]} raycast={() => null}>
      {/* Cabinet body */}
      <mesh position-y={1.75}>
        <boxGeometry args={[1.5, 3.5, 2]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.3} roughness={0.5} />
      </mesh>
      {/* Blue LED accent strip on the right-front edge */}
      <mesh position={[0.76, 1.75, -0.8]}>
        <boxGeometry args={[0.1, 3, 0.1]} />
        <meshBasicMaterial color="#3b82f6" />
      </mesh>
    </group>
  );
}

export function ServerRacks() {
  return (
    <group>
      {RACK_POSITIONS.map((pos, i) => (
        <ServerRack key={i} {...pos} />
      ))}
    </group>
  );
}
