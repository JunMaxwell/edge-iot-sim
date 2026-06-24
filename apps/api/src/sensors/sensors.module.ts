import { Module } from "@nestjs/common";

import { RabbitMqModule } from "../rabbitmq/rabbitmq.module";
import { SensorsGateway } from "./sensors.gateway";
import { SensorsService } from "./sensors.service";

@Module({
  imports: [RabbitMqModule],
  providers: [SensorsGateway, SensorsService],
})
export class SensorsModule {}
