import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import {
  deriveStatus,
  RoutingKey,
  SensorPayload,
  SensorState,
} from "@repo/shared-types";
import { Observable, Subject } from "rxjs";

import { RabbitMqService } from "../rabbitmq/rabbitmq.service";
import { queueNameFor } from "./constants";

// Source of truth for live sensor state: consumes every sensor queue, keeps the
// latest derived SensorState per sensor, and publishes each update on an
// observable that the gateway broadcasts. Transport (Socket.IO) lives in the
// gateway — this service has no knowledge of it, keeping the dependency
// one-directional (gateway → service).
@Injectable()
export class SensorsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SensorsService.name);
  private readonly state = new Map<string, SensorState>();
  private readonly updates = new Subject<SensorState>();

  // Stream of individual sensor updates, one per incoming reading.
  readonly updates$: Observable<SensorState> = this.updates.asObservable();

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

  onModuleDestroy(): void {
    this.updates.complete();
  }

  // Current state of every known sensor — used to seed a newly-connected client.
  getSnapshot(): SensorState[] {
    return [...this.state.values()];
  }

  // Parse the payload, derive its status, store it, and publish the update.
  private handlePayload(content: Buffer, routingKey: string): void {
    let payload: SensorPayload;
    try {
      payload = JSON.parse(content.toString()) as SensorPayload;
    } catch {
      this.logger.warn(`Discarding non-JSON message on "${routingKey}"`);
      return;
    }

    const next: SensorState = {
      ...payload,
      status: deriveStatus(payload.type, payload.value),
      lastUpdated: Date.now(),
    };
    this.state.set(next.id, next);
    this.updates.next(next);
  }
}
