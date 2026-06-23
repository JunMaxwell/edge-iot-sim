import { WebSocketGateway } from "@nestjs/websockets";

// TODO: Phase 3 — inject RabbitMQ service, broadcast SensorState to connected clients
@WebSocketGateway({ cors: { origin: process.env.CORS_ORIGIN ?? "http://localhost:3003" } })
export class SensorsGateway {}
