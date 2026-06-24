import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import {
  deriveStatus,
  RoutingKey,
  SensorPayload,
} from "@repo/shared-types";

import { RabbitMqService } from "../rabbitmq/rabbitmq.service";
import { queueNameFor } from "./constants";

// Whole numbers print as-is; readings keep a single decimal (e.g. 73.4°C).
function formatValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

// Phase 2 scope: subscribe to every sensor queue and log each payload. Phase 3
// will broadcast derived SensorState over Socket.IO instead.
@Injectable()
export class SensorsService implements OnModuleInit {
  private readonly logger = new Logger(SensorsService.name);

  constructor(private readonly rabbitMq: RabbitMqService) {}

  async onModuleInit(): Promise<void> {
    const routingKeys = Object.values(RoutingKey);
    for (const routingKey of routingKeys) {
      await this.rabbitMq.consume({
        queue: queueNameFor(routingKey),
        pattern: routingKey,
        handler: (content, key) => this.handlePayload(content, key),
      });
    }
    this.logger.log(`Subscribed to ${routingKeys.length} sensor queues`);
  }

  // Parse the payload, derive its threshold status, and log a one-line summary.
  private handlePayload(content: Buffer, routingKey: string): void {
    let payload: SensorPayload;
    try {
      payload = JSON.parse(content.toString()) as SensorPayload;
    } catch {
      this.logger.warn(`Discarding non-JSON message on "${routingKey}"`);
      return;
    }

    const status = deriveStatus(payload.type, payload.value);
    this.logger.log(
      `${routingKey} | ${payload.id} | ${formatValue(payload.value)}${payload.unit} | ${status.toUpperCase()}`,
    );
  }
}
