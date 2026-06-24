import { Module } from "@nestjs/common";

import { RabbitMqModule } from "../rabbitmq/rabbitmq.module";
import { SensorsService } from "./sensors.service";

@Module({
  imports: [RabbitMqModule],
  providers: [SensorsService],
  exports: [SensorsService],
})
export class SensorsModule {}
