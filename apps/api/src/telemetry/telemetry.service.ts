import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { SensorState } from "@repo/shared-types";
import { Model } from "mongoose";
import { bufferTime, filter, Subject, Subscription } from "rxjs";

import { SensorsService } from "../sensors/sensors.service";
import { Telemetry } from "./telemetry.schema";

@Injectable()
export class TelemetryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelemetryService.name);
  private subscription: Subscription | null = null;
  private readonly aggregatedUpdates = new Subject<SensorState>();

  // Throttled stream emitting 1 state per sensor per second maximum
  readonly aggregatedUpdates$ = this.aggregatedUpdates.asObservable();

  constructor(
    private readonly sensors: SensorsService,
    @InjectModel(Telemetry.name) private readonly telemetryModel: Model<Telemetry>,
  ) {}

  onModuleInit(): void {
    // 1000ms tumbling window
    this.subscription = this.sensors.updates$
      .pipe(
        bufferTime(1000),
        filter((buffer) => buffer.length > 0),
      )
      .subscribe(async (buffer) => {
        // Group raw readings by sensor ID
        const grouped = new Map<string, SensorState[]>();
        for (const state of buffer) {
          if (!grouped.has(state.id)) grouped.set(state.id, []);
          grouped.get(state.id)!.push(state);
        }

        const mongoDocs: { timestamp: Date; metadata: { sensorId: string; type: string; zone: string }; value: number }[] = [];
        const now = new Date();

        for (const [id, states] of grouped.entries()) {
          const avgValue = states.reduce((sum, s) => sum + s.value, 0) / states.length;
          const latestState = states[states.length - 1]!;
          const averagedState: SensorState = { ...latestState, value: avgValue };

          mongoDocs.push({
            timestamp: now,
            metadata: { sensorId: id, type: latestState.type, zone: latestState.routingKey },
            value: avgValue,
          });

          this.aggregatedUpdates.next(averagedState);
        }

        try {
          await this.telemetryModel.insertMany(mongoDocs);
        } catch (err) {
          this.logger.error("Failed to bulk insert telemetry data", err);
        }
      });
  }

  onModuleDestroy(): void {
    this.subscription?.unsubscribe();
    this.aggregatedUpdates.complete();
  }
}
