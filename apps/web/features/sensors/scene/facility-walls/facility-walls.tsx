import { Edges } from "@react-three/drei";
import { DoubleSide } from "three";

interface WallSpec {
  w: number;
  h: number;
  d: number;
  x: number;
  y: number;
  z: number;
}

const WALL_HEIGHT = 4;
const WALL_Y = WALL_HEIGHT / 2;

// Perimeter around the sensor spread (node positions × SCENE_SCALE=3 gives ±12 on
// x and ±9 on z). Walls are sized to contain all nodes with comfortable padding.
const FACILITY_WALLS: WallSpec[] = [
  { w: 34, h: WALL_HEIGHT, d: 0.3, x: 0, y: WALL_Y, z: -12 },
  { w: 34, h: WALL_HEIGHT, d: 0.3, x: 0, y: WALL_Y, z: 12 },
  { w: 0.3, h: WALL_HEIGHT, d: 24, x: -17, y: WALL_Y, z: 0 },
  { w: 0.3, h: WALL_HEIGHT, d: 24, x: 17, y: WALL_Y, z: 0 },
];

// Decorative translucent glass perimeter. Non-raycastable so wall surfaces never
// intercept clicks meant for sensor nodes behind them.
export function FacilityWalls() {
  return (
    <group>
      {FACILITY_WALLS.map((wall, i) => (
        <mesh
          key={i}
          position={[wall.x, wall.y, wall.z]}
          // Exclude from R3F's raycast system — purely decorative, must not block
          // pointer events on sensor nodes.
          raycast={() => null}
        >
          <boxGeometry args={[wall.w, wall.h, wall.d]} />
          <meshPhysicalMaterial
            color="#e2e8f0"
            metalness={0.1}
            roughness={0.1}
            transmission={0.9}
            transparent
            side={DoubleSide}
          />
          <Edges color="#94a3b8" />
        </mesh>
      ))}
    </group>
  );
}
