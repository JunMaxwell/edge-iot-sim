import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { SensorsGateway } from "../sensors/sensors.gateway";
import { SensorsModule } from "../sensors/sensors.module";
import { Telemetry, TelemetrySchema } from "./telemetry.schema";
import { TelemetryService } from "./telemetry.service";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Telemetry.name, schema: TelemetrySchema }]),
    SensorsModule,
  ],
  providers: [TelemetryService, SensorsGateway],
  exports: [TelemetryService],
})
export class TelemetryModule {}
