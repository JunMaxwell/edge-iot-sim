import { OnModuleDestroy } from "@nestjs/common";
import {
  OnGatewayConnection,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  SOCKET_EVENTS,
} from "@repo/shared-types";
import { Subscription } from "rxjs";
import { Server, Socket } from "socket.io";

import { SensorsService } from "./sensors.service";

// Transport layer: bridges SensorsService's update stream onto Socket.IO.
// Depends on the service (one direction) — sends a snapshot to each new client
// and broadcasts every subsequent reading to all clients.
@WebSocketGateway({
  cors: { origin: process.env.CORS_ORIGIN ?? "http://localhost:3003" },
})
export class SensorsGateway
  implements OnGatewayInit, OnGatewayConnection, OnModuleDestroy
{
  @WebSocketServer()
  private server!: Server<ClientToServerEvents, ServerToClientEvents>;

  private subscription: Subscription | null = null;

  constructor(private readonly sensors: SensorsService) {}

  afterInit(): void {
    // Fan every reading out to all connected clients.
    this.subscription = this.sensors.updates$.subscribe((state) => {
      this.server.emit(SOCKET_EVENTS.SENSOR_UPDATE, state);
    });
  }

  handleConnection(client: Socket<ClientToServerEvents, ServerToClientEvents>): void {
    // Seed the freshly-connected client with the current state of every sensor.
    client.emit(SOCKET_EVENTS.SENSOR_BATCH, this.sensors.getSnapshot());
  }

  onModuleDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
