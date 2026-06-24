import { ConnectingOverlay } from "../features/sensors/components/connecting-overlay/connecting-overlay";
import { ConnectionStatus } from "../features/sensors/components/connection-status/connection-status";
import { SensorSocketInit } from "../features/sensors/components/sensor-socket-init/sensor-socket-init";
import { AlertFeed } from "../features/sensors/overlay/alert-feed/alert-feed";
import { DeviceHud } from "../features/sensors/overlay/device-hud/device-hud";
import { ZonePanel } from "../features/sensors/overlay/zone-panel/zone-panel";
import { SensorScene } from "../features/sensors/scene/sensor-scene/sensor-scene";

// Full-screen 3D facility view with a glass-panel overlay. The overlay layer is
// click-through (pointer-events-none) except for its panels, so orbit/drag on
// the canvas works everywhere else.
export default function HomePage() {
  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <SensorSocketInit />
      <SensorScene />

      <ConnectingOverlay />

      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between gap-6 p-6 md:flex-row">
        <ZonePanel />
        <AlertFeed />
      </div>

      <DeviceHud />

      <div className="pointer-events-auto absolute left-1/2 top-6 z-20 -translate-x-1/2">
        <ConnectionStatus />
      </div>
    </main>
  );
}
