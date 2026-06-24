import { RoutingKey, SensorPosition, SensorType } from "@repo/shared-types";

// A simulated sensor. Positions are 3D world coordinates used later (Phase 4) to
// place meshes in the scene; ids are stable so the dashboard can track a sensor
// across reconnects.
export interface SensorFixture {
  id: string;
  type: SensorType;
  routingKey: RoutingKey;
  position: SensorPosition;
  unit: string;
}

// Fixed set of 8 sensors — two of each type, mirrored across the room.
export const SENSOR_FIXTURES: SensorFixture[] = [
  {
    id: "hvac-temp-1",
    type: SensorType.TEMPERATURE,
    routingKey: RoutingKey.HVAC_TEMPERATURE,
    position: { x: -4, y: 2, z: -3 },
    unit: "°C",
  },
  {
    id: "hvac-temp-2",
    type: SensorType.TEMPERATURE,
    routingKey: RoutingKey.HVAC_TEMPERATURE,
    position: { x: 4, y: 2, z: -3 },
    unit: "°C",
  },
  {
    id: "hvac-hum-1",
    type: SensorType.HUMIDITY,
    routingKey: RoutingKey.HVAC_HUMIDITY,
    position: { x: -4, y: 2, z: 3 },
    unit: "%",
  },
  {
    id: "hvac-hum-2",
    type: SensorType.HUMIDITY,
    routingKey: RoutingKey.HVAC_HUMIDITY,
    position: { x: 4, y: 2, z: 3 },
    unit: "%",
  },
  {
    id: "motion-1",
    type: SensorType.MOTION,
    routingKey: RoutingKey.FLOOR_MOTION,
    position: { x: -2, y: 0.5, z: 0 },
    unit: "binary",
  },
  {
    id: "motion-2",
    type: SensorType.MOTION,
    routingKey: RoutingKey.FLOOR_MOTION,
    position: { x: 2, y: 0.5, z: 0 },
    unit: "binary",
  },
  {
    id: "machine-1",
    type: SensorType.MACHINE_STATUS,
    routingKey: RoutingKey.FLOOR_MACHINE_STATUS,
    position: { x: -3, y: 1, z: 2 },
    unit: "%",
  },
  {
    id: "machine-2",
    type: SensorType.MACHINE_STATUS,
    routingKey: RoutingKey.FLOOR_MACHINE_STATUS,
    position: { x: 3, y: 1, z: 2 },
    unit: "%",
  },
];
