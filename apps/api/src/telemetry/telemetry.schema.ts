import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({
  timeseries: {
    timeField: "timestamp",
    metaField: "metadata",
    granularity: "seconds",
  },
})
export class Telemetry extends Document {
  @Prop({ required: true })
  timestamp!: Date;

  @Prop({ type: Object })
  metadata!: {
    sensorId: string;
    type: string;
    zone: string;
  };

  @Prop({ required: true })
  value!: number;
}

export const TelemetrySchema = SchemaFactory.createForClass(Telemetry);
