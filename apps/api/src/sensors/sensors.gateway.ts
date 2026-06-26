import { OnModuleDestroy } from "@nestjs/common";
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  SimulatorCommand,
  SOCKET_EVENTS,
} from "@repo/shared-types";
import { Subscription } from "rxjs";
import { Server, Socket } from "socket.io";

import { RabbitMqService } from "../rabbitmq/rabbitmq.service";
import { TelemetryService } from "../telemetry/telemetry.service";
import { SensorsService } from "./sensors.service";

// How long (ms) all connections must be absent before the simulator is told to sleep.
const SLEEP_DELAY_MS = 60_000;

// Transport layer: bridges the throttled TelemetryService stream onto Socket.IO.
// Also owns the wake/sleep lifecycle — publishing control signals to RabbitMQ so
// the simulator stops burning CPU when no clients are watching.
@WebSocketGateway({
  cors: { origin: process.env.CORS_ORIGIN ?? "http://localhost:3003" },
})
export class SensorsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy
{
  @WebSocketServer()
  private server!: Server<ClientToServerEvents, ServerToClientEvents>;

  private subscription: Subscription | null = null;
  private activeConnections = 0;
  private sleepTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly sensors: SensorsService,
    private readonly telemetry: TelemetryService,
    private readonly rabbitmq: RabbitMqService,
  ) {}

  afterInit(): void {
    this.subscription = this.telemetry.aggregatedUpdates$.subscribe((state) => {
      this.server.emit(SOCKET_EVENTS.SENSOR_UPDATE, state);
    });
  }

  handleConnection(client: Socket<ClientToServerEvents, ServerToClientEvents>): void {
    const wasIdle = this.activeConnections === 0;
    this.activeConnections++;

    // Cancel any pending sleep — a client just arrived.
    if (this.sleepTimer) {
      clearTimeout(this.sleepTimer);
      this.sleepTimer = null;
    }

    // First connection after idle: wake the simulator.
    if (wasIdle) {
      this.rabbitmq.publishControl(SimulatorCommand.WAKE);
    }

    client.emit(SOCKET_EVENTS.SENSOR_BATCH, this.sensors.getSnapshot());
  }

  handleDisconnect(): void {
    this.activeConnections = Math.max(0, this.activeConnections - 1);

    if (this.activeConnections === 0) {
      this.sleepTimer = setTimeout(() => {
        this.rabbitmq.publishControl(SimulatorCommand.SLEEP);
        this.sleepTimer = null;
      }, SLEEP_DELAY_MS);
    }
  }

  onModuleDestroy(): void {
    this.subscription?.unsubscribe();
    if (this.sleepTimer) {
      clearTimeout(this.sleepTimer);
    }
  }
}
