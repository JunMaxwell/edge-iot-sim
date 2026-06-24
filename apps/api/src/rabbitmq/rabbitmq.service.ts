import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import * as amqp from "amqplib";
import { IOT_EXCHANGE } from "@repo/shared-types";

import {
  BASE_BACKOFF_MS,
  DEFAULT_RABBITMQ_URL,
  MAX_CONNECT_ATTEMPTS,
} from "./constants";

// Handler receives the raw message body and the routing key it arrived on.
export type MessageHandler = (
  content: Buffer,
  routingKey: string,
) => void | Promise<void>;

export interface ConsumeOptions {
  queue: string;
  pattern: string;
  handler: MessageHandler;
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Domain-agnostic RabbitMQ access: owns the connection/channel and the
// iot.sensors exchange. Feature modules call consume() to bind a queue and
// register their own handler — keeping sensor-specific knowledge out of here.
@Injectable()
export class RabbitMqService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMqService.name);
  private connection: amqp.ChannelModel | null = null;
  private channel: amqp.Channel | null = null;

  private readonly url = process.env.RABBITMQ_URL ?? DEFAULT_RABBITMQ_URL;

  async onModuleInit(): Promise<void> {
    await this.connect();
    await this.channel?.assertExchange(IOT_EXCHANGE, "topic", {
      durable: true,
    });
    this.logger.log(`Connected to ${this.url}, exchange "${IOT_EXCHANGE}" ready`);
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.channel?.close();
      await this.connection?.close();
    } catch (err) {
      this.logger.warn(
        `Error during shutdown: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      this.channel = null;
      this.connection = null;
    }
  }

  // Assert a durable queue, bind it to the exchange with the given pattern, and
  // start consuming. Messages are acked on success and dead-dropped (nack, no
  // requeue) on handler failure so a poison message can't loop forever.
  async consume({ queue, pattern, handler }: ConsumeOptions): Promise<void> {
    if (!this.channel) {
      throw new Error("RabbitMQ channel is not initialised");
    }
    const channel = this.channel;

    await channel.assertQueue(queue, { durable: true });
    await channel.bindQueue(queue, IOT_EXCHANGE, pattern);
    await channel.consume(queue, async (msg) => {
      if (!msg) return;
      try {
        await handler(msg.content, msg.fields.routingKey);
        channel.ack(msg);
      } catch (err) {
        this.logger.error(
          `Handler failed for queue "${queue}": ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
        channel.nack(msg, false, false);
      }
    });

    this.logger.log(`Consuming "${queue}" bound to "${pattern}"`);
  }

  // Connect with exponential backoff up to MAX_CONNECT_ATTEMPTS.
  private async connect(): Promise<void> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_CONNECT_ATTEMPTS; attempt++) {
      try {
        this.connection = await amqp.connect(this.url);
        this.connection.on("error", (err) =>
          this.logger.error(`Connection error: ${err.message}`),
        );
        this.channel = await this.connection.createChannel();
        return;
      } catch (err) {
        lastError = err;
        const backoff = BASE_BACKOFF_MS * 2 ** (attempt - 1);
        const reason = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Connect attempt ${attempt}/${MAX_CONNECT_ATTEMPTS} failed (${reason}); retrying in ${backoff}ms`,
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
}
