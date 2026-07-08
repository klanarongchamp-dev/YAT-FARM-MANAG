/**
 * Sensor Router
 * Handles sensor data ingestion and retrieval.
 */
import { z } from "zod";
import {
  createActivityLog,
  createAlert,
  getDeviceById,
  getLatestSensorReading,
  getSensorHistory,
  insertSensorReading,
  upsertDevice,
} from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

/** Thresholds for automatic alert generation */
const THRESHOLDS = {
  temperature: { max: 40 },
  humidity: { min: 20 },
  soilMoisture: { min: 20 },
  light: { min: 0 },
};

export const sensorRouter = router({
  /** Get latest sensor reading for a device */
  getLatest: publicProcedure
    .input(z.object({ deviceId: z.string().min(1, "deviceId required") }))
    .query(async ({ input }) => {
      return getLatestSensorReading(input.deviceId);
    }),

  /** Get sensor history for the last N hours */
  getHistory: protectedProcedure
    .input(z.object({ deviceId: z.string().min(1, "deviceId required"), hours: z.number().min(1).max(168).default(24) }))
    .query(async ({ input }) => {
      return getSensorHistory(input.deviceId, input.hours);
    }),

  /** Post a new sensor reading (used internally; ESP8266 uses REST endpoint) */
  postReading: publicProcedure
    .input(
      z.object({
        deviceId: z.string().min(1, "deviceId required"),
        temperature: z.number().optional(),
        humidity: z.number().optional(),
        soilMoisture: z.number().optional(),
        light: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Upsert device record
      await upsertDevice({ deviceId: input.deviceId, status: "online", lastSeen: new Date() });

      // Insert reading
      await insertSensorReading({
        deviceId: input.deviceId,
        temperature: input.temperature,
        humidity: input.humidity,
        soilMoisture: input.soilMoisture,
        light: input.light,
      });

      // Auto-generate alerts
      if (input.temperature !== undefined && input.temperature > THRESHOLDS.temperature.max) {
        await createAlert({
          type: "high_temp",
          message: `อุณหภูมิสูงเกินกำหนด: ${input.temperature}°C (เกณฑ์: ${THRESHOLDS.temperature.max}°C)`,
          value: input.temperature,
          threshold: THRESHOLDS.temperature.max,
        });
      }
      if (input.soilMoisture !== undefined && input.soilMoisture < THRESHOLDS.soilMoisture.min) {
        await createAlert({
          type: "low_soil",
          message: `ความชื้นดินต่ำเกินเกณฑ์: ${input.soilMoisture}% (เกณฑ์: ${THRESHOLDS.soilMoisture.min}%)`,
          value: input.soilMoisture,
          threshold: THRESHOLDS.soilMoisture.min,
        });
      }
      if (input.humidity !== undefined && input.humidity < THRESHOLDS.humidity.min) {
        await createAlert({
          type: "low_humidity",
          message: `ความชื้นอากาศต่ำเกินเกณฑ์: ${input.humidity}% (เกณฑ์: ${THRESHOLDS.humidity.min}%)`,
          value: input.humidity,
          threshold: THRESHOLDS.humidity.min,
        });
      }

      return { success: true };
    }),
});
