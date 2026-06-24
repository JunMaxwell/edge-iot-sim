import { Module } from "@nestjs/common";

import { RabbitMqModule } from "./rabbitmq/rabbitmq.module";
import { SensorsModule } from "./sensors/sensors.module";

@Module({
  imports: [RabbitMqModule, SensorsModule],
})
export class AppModule {}
