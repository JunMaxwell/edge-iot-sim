import { Global, Module } from "@nestjs/common";

import { RabbitMqService } from "./rabbitmq.service";

// Global so any feature module can inject RabbitMqService without re-importing.
// Feature modules that depend on it (e.g. SensorsModule) still import it
// explicitly to guarantee its onModuleInit runs first.
@Global()
@Module({
  providers: [RabbitMqService],
  exports: [RabbitMqService],
})
export class RabbitMqModule {}
