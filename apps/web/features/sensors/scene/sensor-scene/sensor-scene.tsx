"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useShallow } from "zustand/react/shallow";

import { useSensorStore } from "../../sensor-store";
import { FacilityFloor } from "../facility-floor/facility-floor";
import { FacilityWalls } from "../facility-walls/facility-walls";
import { SceneLighting } from "../scene-lighting/scene-lighting";
import { SensorNode } from "../sensor-node/sensor-node";
import { StalenessWatcher } from "../staleness-watcher/staleness-watcher";
import { ZoneRegions } from "../zone-regions/zone-regions";

const CAMERA_POSITION: [number, number, number] = [20, 25, 30];
const CAMERA_FOV = 45;
const FOG_COLOR = "#f8fafc";
const FOG_DENSITY = 0.02;
const MAX_POLAR_ANGLE = Math.PI / 2 - 0.05; // never orbit below the floor
const MIN_DISTANCE = 10;
const MAX_DISTANCE = 60;

// Full-screen R3F scene: floor + lights + one node per live sensor, with damped
// orbit controls. Subscribes only to the set of sensor ids (shallow) so adding/
// removing a sensor re-renders here, but value updates re-render only the node.
export function SensorScene() {
  const sensorIds = useSensorStore(useShallow((state) => Object.keys(state.sensors)));
  const clearSensor = useSensorStore((state) => state.clearSensor);

  return (
    <Canvas
      camera={{ position: CAMERA_POSITION, fov: CAMERA_FOV }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ position: "absolute", inset: 0 }}
      onPointerMissed={() => clearSensor()}
    >
      <fogExp2 attach="fog" args={[FOG_COLOR, FOG_DENSITY]} />
      <SceneLighting />
      <FacilityFloor />
      <ZoneRegions />
      <FacilityWalls />
      <StalenessWatcher />
      {sensorIds.map((id) => (
        <SensorNode key={id} id={id} />
      ))}
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        maxPolarAngle={MAX_POLAR_ANGLE}
        minDistance={MIN_DISTANCE}
        maxDistance={MAX_DISTANCE}
      />
    </Canvas>
  );
}
