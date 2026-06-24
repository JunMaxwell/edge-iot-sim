import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { RabbitMqModule } from "./rabbitmq/rabbitmq.module";
import { SensorsModule } from "./sensors/sensors.module";
import { TelemetryModule } from "./telemetry/telemetry.module";

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI ?? "mongodb://localhost:27017/iot"),
    RabbitMqModule,
    SensorsModule,
    TelemetryModule,
  ],
})
export class AppModule {}
