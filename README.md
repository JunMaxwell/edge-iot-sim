# Edge IoT 3D Spatial Dashboard

A real-time 3D facility dashboard that ingests high-frequency IoT sensor data through RabbitMQ, bridges it over Socket.IO, and renders live sensor states on a Three.js scene.

**Live demo → <https://edge-iot-sim.ydothien.work>**

---

## Architecture

```text
┌─────────────────┐     AMQP      ┌─────────────────┐   Socket.IO   ┌─────────────────┐
│   simulator     │  ──────────►  │      api        │  ──────────►  │      web        │
│  (IoT emitter)  │               │  (edge broker)  │               │  (3D dashboard) │
└─────────────────┘               └─────────────────┘               └─────────────────┘
   Publishes mock                  Consumes queues,                  R3F scene, sensor
   sensor payloads                 applies thresholds,               meshes driven by
   to RabbitMQ                     broadcasts state                  Zustand store
   exchange
```

**Why RabbitMQ?** Sensors fire blindly at high frequency. RabbitMQ buffers that traffic so the WebSocket layer isn't overwhelmed by spikes. Routing keys like `sensor.hvac.temp` and `sensor.security.motion` let consumers subscribe selectively.

**Why Zustand (not useState) for real-time data?** Pumping 60 WebSocket events/s into React state triggers 60 re-renders/s. Zustand's transient update pattern lets Three.js meshes read sensor state directly inside `useFrame` — bypassing the React render cycle entirely.

**Why InstancedMesh?** All sensor orbs share the same geometry. A single draw call updates all of them; individual `<mesh>` nodes would multiply draw calls linearly with sensor count.

---

## Monorepo Structure

```text
edge-iot-sim/
├── apps/
│   ├── web/                  Next.js 15 + React Three Fiber + Zustand + socket.io-client
│   ├── api/                  NestJS + Socket.IO + amqplib (edge broker)
│   └── simulator/            Bun + amqplib (IoT data generator)
├── packages/
│   ├── shared-types/         SensorPayload, SensorState, deriveStatus(), SOCKET_EVENTS
│   ├── tsconfig/             base.json + nextjs.json
│   └── eslint-config/
├── docker-compose.stack.yml  production stack (pre-built images from GHCR)
├── docker-compose.local.yml  local full-stack build (all services from source)
└── turbo.json
```

---

## Production

The `web` app is deployed on Vercel. The `api`, `simulator`, RabbitMQ, and MongoDB run on a private VPS via `docker-compose.stack.yml`. Trigger a production deploy manually with:

```bash
cd apps/web && vercel deploy --prod
```

---

## Running the full stack with Docker (local)

`docker-compose.local.yml` builds every service from source and wires them together — no Vercel, no pre-built images. Use this to test the entire pipeline locally or in CI before pushing.

```bash
docker compose -f docker-compose.local.yml up --build
```

| Service             | URL                                       |
| ------------------- | ----------------------------------------- |
| web (3D dashboard)  | <http://localhost:3003>                   |
| api (Socket.IO)     | <http://localhost:4000>                   |
| RabbitMQ management | <http://localhost:15672> (guest / guest)  |
| MongoDB             | `localhost:27017`                         |

> **`NEXT_PUBLIC_SOCKET_URL`** is baked into the Next.js bundle at build time. The default (`http://localhost:4000`) works as long as the browser and the API are both on your local machine. Override with `NEXT_PUBLIC_SOCKET_URL=http://<your-ip>:4000` if running Docker on a remote host.

---

## Prerequisites

- [Bun](https://bun.sh) ≥ 1.3
- [Docker](https://www.docker.com) (for RabbitMQ and MongoDB)

---

## Dashboard Features

- **3D facility scene** — sensor nodes rendered as instanced meshes (one draw call) positioned in world space across HVAC, security, power, and server zones
- **Live color coding** — orb color shifts green → amber → red as sensor status transitions `normal → warning → critical`; grey when `offline`
- **Zone panels** — per-zone summary of node count and worst-case status
- **Device HUD** — click any sensor node to inspect its live reading, unit, routing key, and last-updated timestamp
- **Alert feed** — scrolling log of threshold-crossing events with relative timestamps
- **Sparkline** — mini history chart per sensor showing the last N readings
- **Staleness detection** — nodes flip to `offline` automatically if no update arrives within the staleness window
- **Connection overlay** — blocks the scene with a reconnecting state if the Socket.IO link drops

---

## Environment Variables

Copy the root `.env.example` and each app's `.env.example` before running locally:

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Key variables:

| Variable                  | App            | Default                               |
| ------------------------- | -------------  | ------------------------------------- |
| `NEXT_PUBLIC_SOCKET_URL`  | web            | `http://localhost:4000`               |
| `CORS_ORIGIN`             | api            | `http://localhost:3003`               |
| `MONGODB_URI`             | api            | `mongodb://localhost:27017/iot`       |
| `RABBITMQ_URL`            | api, simulator | `amqp://guest:guest@localhost:5672`   |

---

## Getting Started

### 1. Install dependencies

```bash
bun install
```

### 2. Start RabbitMQ

```bash
docker compose up -d
```

RabbitMQ Management UI → <http://localhost:15672> (guest / guest)

### 3. Run all apps

```bash
bun run dev
```

Or run each app individually:

```bash
turbo run dev --filter=@repo/simulator
turbo run dev --filter=@repo/api
turbo run dev --filter=@repo/web
```

| App       | URL                        |
|-----------|----------------------------|
| web       | <http://localhost:3003>    |
| api       | <http://localhost:4000>    |
| RabbitMQ  | <http://localhost:15672>   |

---

## Shared Types (`@repo/shared-types`)

All sensor data flowing through the pipeline conforms to these types:

```ts
interface SensorPayload {
  id: string;
  type: "temperature" | "humidity" | "motion" | "machine_status";
  value: number;
  unit: string;
  position: { x: number; y: number; z: number }; // 3D world coords
  timestamp: number;
  routingKey: string; // e.g. "sensor.hvac.temp"
}

interface SensorState extends SensorPayload {
  status: "normal" | "warning" | "critical" | "offline";
  lastUpdated: number;
}
```

Status thresholds are defined in `shared-types/src/index.ts` and used by the api broker — not the frontend.

---

## Implementation Phases

| Phase | Status | Description |
| ------- | -------- | -------- |
| 1 — Infrastructure | ✅ | Turborepo scaffold, shared types, Docker Compose |
| 2 — Data pipeline | ✅ | Simulator publishes to RabbitMQ; api consumes and logs |
| 3 — The bridge | ✅ | api broadcasts via Socket.IO; web receives events |
| 4 — Spatial render | ✅ | R3F scene, sensor meshes, live color updates |

---

## Key Technical Decisions

| Challenge | Solution |
| --- | --- |
| High-frequency state updates | Zustand store + `useFrame` mutation, bypasses React render cycle |
| Traffic spikes from sensors | RabbitMQ buffers between emitter and WebSocket layer |
| Many identical sensor meshes | `<InstancedMesh>` — one draw call for all sensors |
| Type safety across services | `@repo/shared-types` — single source of truth for all payloads |
