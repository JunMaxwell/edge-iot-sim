import { ConnectionStatus } from "../features/sensors/components/connection-status/connection-status";
import { SensorList } from "../features/sensors/components/sensor-list/sensor-list";
import { SensorSocketInit } from "../features/sensors/components/sensor-socket-init/sensor-socket-init";

export default function HomePage() {
  return (
    <main style={{ minHeight: "100vh", padding: "48px 32px", display: "flex", flexDirection: "column", gap: 24 }}>
      <SensorSocketInit />
      <header style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", maxWidth: 460 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Edge IoT Dashboard</h1>
        <ConnectionStatus />
      </header>
      <SensorList />
      <p style={{ fontFamily: "monospace", color: "#444", fontSize: 12 }}>
        3D scene coming in Phase 4
      </p>
    </main>
  );
}
