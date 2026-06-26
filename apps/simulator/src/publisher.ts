import * as amqp from "amqplib";
import {
  ControlMessage,
  IOT_CONTROL_EXCHANGE,
  IOT_EXCHANGE,
  SimulatorCommand,
} from "@repo/shared-types";

import {
  BASE_BACKOFF_MS,
  DEFAULT_EMIT_INTERVAL_MS,
  DEFAULT_RABBITMQ_URL,
  MAX_CONNECT_ATTEMPTS,
} from "./constants";
import { SENSOR_FIXTURES } from "./fixtures";
import { generatePayload } from "./generate";

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Publishes a payload for every fixture on a fixed interval into the iot.sensors
// topic exchange, keyed by each fixture's routing key. Supports pause/resume via
// the iot.control fanout exchange so the API can silence it when no clients watch.
export class SimulatorPublisher {
  private connection: amqp.ChannelModel | null = null;
  private channel: amqp.Channel | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;

  private readonly url = process.env.RABBITMQ_URL ?? DEFAULT_RABBITMQ_URL;
  private readonly emitIntervalMs = Number(
    process.env.EMIT_INTERVAL_MS ?? DEFAULT_EMIT_INTERVAL_MS,
  );

  // Connect with exponential backoff, then assert the durable topic exchange.
  async connect(): Promise<void> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_CONNECT_ATTEMPTS; attempt++) {
      try {
        this.connection = await amqp.connect(this.url);
        this.connection.on("error", (err) =>
          console.error("[publisher] connection error:", err.message),
        );
        this.channel = await this.connection.createChannel();
        await this.channel.assertExchange(IOT_EXCHANGE, "topic", {
          durable: true,
        });
        console.log(`[publisher] connected to ${this.url}`);
        return;
      } catch (err) {
        lastError = err;
        const backoff = BASE_BACKOFF_MS * 2 ** (attempt - 1);
        const reason = err instanceof Error ? err.message : String(err);
        console.warn(
          `[publisher] connect attempt ${attempt}/${MAX_CONNECT_ATTEMPTS} failed (${reason}); retrying in ${backoff}ms`,
        );
        if (attempt < MAX_CONNECT_ATTEMPTS) await sleep(backoff);
      }
    }

    throw new Error(
      `Failed to connect to RabbitMQ after ${MAX_CONNECT_ATTEMPTS} attempts: ${
        lastError instanceof Error ? lastError.message : String(lastError)
      }`,
    );
  }

  // Start the emit loop. Each tick publishes one payload per fixture.
  start(): void {
    if (!this.channel) {
      throw new Error("Cannot start publishing before connect() succeeds");
    }

    console.log(
      `[publisher] emitting ${SENSOR_FIXTURES.length} sensors every ${this.emitIntervalMs}ms`,
    );

    this.timer = setInterval(() => this.tick(), this.emitIntervalMs);
  }

  // Pause the emit loop without closing the connection.
  pause(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log("[publisher] sleeping — emit loop paused");
    }
  }

  // Resume the emit loop. No-op if already running.
  resume(): void {
    if (!this.channel) {
      console.warn("[publisher] cannot resume: not connected");
      return;
    }
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), this.emitIntervalMs);
    console.log("[publisher] awake — emit loop resumed");
  }

  // Bind an exclusive transient queue to the fanout control exchange and act on
  // WAKE / SLEEP commands published by the API gateway.
  async listenForControl(): Promise<void> {
    if (!this.channel) {
      throw new Error("Cannot listen for control before connect() succeeds");
    }
    const channel = this.channel;

    await channel.assertExchange(IOT_CONTROL_EXCHANGE, "fanout", { durable: false });
    const { queue } = await channel.assertQueue("", { exclusive: true });
    await channel.bindQueue(queue, IOT_CONTROL_EXCHANGE, "");

    await channel.consume(queue, (msg) => {
      if (!msg) return;
      try {
        const { command } = JSON.parse(msg.content.toString()) as ControlMessage;
        if (command === SimulatorCommand.SLEEP) this.pause();
        else if (command === SimulatorCommand.WAKE) this.resume();
      } catch {
        console.warn("[publisher] failed to parse control message");
      }
      channel.ack(msg);
    });

    console.log("[publisher] control listener ready");
  }

  private tick(): void {
    if (!this.channel) return;

    for (const fixture of SENSOR_FIXTURES) {
      const payload = generatePayload(fixture);
      this.channel.publish(
        IOT_EXCHANGE,
        fixture.routingKey,
        Buffer.from(JSON.stringify(payload)),
        { persistent: false, contentType: "application/json" },
      );
    }
  }

  // Stop the loop and tear down the channel/connection cleanly.
  async stop(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    try {
      await this.channel?.close();
      await this.connection?.close();
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      console.warn(`[publisher] error during shutdown: ${reason}`);
    } finally {
      this.channel = null;
      this.connection = null;
    }
  }
}
