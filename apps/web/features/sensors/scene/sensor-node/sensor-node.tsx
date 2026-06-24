import { STATUS_COLOR } from "@repo/shared-types";
import { type ThreeEvent, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Color, type Mesh, type MeshBasicMaterial, type MeshStandardMaterial } from "three";

import { SCENE_SCALE } from "../../constants";
import { useSensorStore } from "../../sensor-store";

const COLOR_LERP_FACTOR = 0.05; // smooth status-colour easing (matches concept)
const CORE_SPIN_SPEED = 2; // rad/s
const RING_PULSE_SPEED = 6;
const RING_PULSE_AMPLITUDE = 0.1;
const SELECTED_RING_OPACITY = 0.8;
const HOVER_EMISSIVE_INTENSITY = 1.2;
const BASE_EMISSIVE_INTENSITY = 0.8;

// One sensor in 3D: metallic base + spinning glowing core + selection ring.
// Subscribes to only its own store slice so a SENSOR_UPDATE re-renders just this
// node, and eases colour/pulse in useFrame (no per-frame React renders).
export function SensorNode({ id }: { id: string }) {
  const sensor = useSensorStore((state) => state.sensors[id]);
  const selected = useSensorStore((state) => state.selectedSensorId === id);
  const selectSensor = useSensorStore((state) => state.selectSensor);

  const coreRef = useRef<Mesh>(null);
  const coreMatRef = useRef<MeshStandardMaterial>(null);
  const ringRef = useRef<Mesh>(null);
  const ringMatRef = useRef<MeshBasicMaterial>(null);
  const hovered = useRef(false);
  // Reused target colour to avoid allocating a Color every frame.
  const target = useRef(new Color());

  // Drive spin, colour easing, and ring pulse imperatively — the animation loop,
  // not a React render. R3F's useFrame is not an effect (project rule: no useEffect).
  useFrame((_, delta) => {
    if (coreRef.current) coreRef.current.rotation.y += CORE_SPIN_SPEED * delta;

    if (coreMatRef.current && sensor) {
      target.current.set(STATUS_COLOR[sensor.status]);
      coreMatRef.current.color.lerp(target.current, COLOR_LERP_FACTOR);
      coreMatRef.current.emissive.lerp(target.current, COLOR_LERP_FACTOR);
      coreMatRef.current.emissiveIntensity = hovered.current
        ? HOVER_EMISSIVE_INTENSITY
        : BASE_EMISSIVE_INTENSITY;
    }

    if (ringMatRef.current && ringRef.current) {
      ringMatRef.current.opacity = selected ? SELECTED_RING_OPACITY : 0;
      if (selected) {
        const scale = 1 + Math.sin(performance.now() * 0.001 * RING_PULSE_SPEED) * RING_PULSE_AMPLITUDE;
        ringRef.current.scale.set(scale, scale, 1);
      }
      ringRef.current.rotation.z -= delta * 0.5;
    }
  });

  if (!sensor) return null;

  const initialColor = STATUS_COLOR[sensor.status];
  const position: [number, number, number] = [
    sensor.position.x * SCENE_SCALE,
    sensor.position.y,
    sensor.position.z * SCENE_SCALE,
  ];

  // Click selects this sensor; stop propagation so empty-space deselect (handled
  // on the floor/canvas) doesn't immediately fire too.
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    selectSensor(id);
  };

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    hovered.current = true;
    document.body.style.cursor = "pointer";
  };

  const handlePointerOut = () => {
    hovered.current = false;
    document.body.style.cursor = "default";
  };

  return (
    <group
      position={position}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <mesh>
        <cylinderGeometry args={[0.5, 0.6, 0.4, 16]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.5} roughness={0.3} />
      </mesh>

      <mesh ref={coreRef} position-y={0.2}>
        <cylinderGeometry args={[0.3, 0.3, 0.5, 16]} />
        <meshStandardMaterial
          ref={coreMatRef}
          color={initialColor}
          emissive={initialColor}
          emissiveIntensity={BASE_EMISSIVE_INTENSITY}
        />
      </mesh>

      <mesh ref={ringRef} rotation-x={-Math.PI / 2} position-y={-0.15}>
        <ringGeometry args={[0.8, 0.9, 32]} />
        <meshBasicMaterial ref={ringMatRef} color="#334155" transparent opacity={0} />
      </mesh>
    </group>
  );
}
