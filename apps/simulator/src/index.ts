import { SimulatorPublisher } from "./publisher";

async function main(): Promise<void> {
  const publisher = new SimulatorPublisher();
  await publisher.connect();
  publisher.start();

  // Graceful shutdown so RabbitMQ sees the connection close cleanly.
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n[simulator] received ${signal}, shutting down…`);
    await publisher.stop();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error("[simulator] fatal:", err instanceof Error ? err.message : err);
  process.exit(1);
});
