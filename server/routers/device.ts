/**
 * Device Router
 * Manages IoT device status and pump control.
 */
import { z } from "zod";
import { createActivityLog, getAllDevices, getDeviceById, updateDeviceControl, upsertDevice } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const deviceRouter = router({
  getAll: protectedProcedure.query(async () => {
    return getAllDevices();
  }),

  getOne: protectedProcedure
    .input(z.object({ deviceId: z.string() }))
    .query(async ({ input }) => {
      return getDeviceById(input.deviceId);
    }),

  setPumpStatus: protectedProcedure
    .input(z.object({ deviceId: z.string(), pumpStatus: z.enum(["on", "off"]) }))
    .mutation(async ({ input, ctx }) => {
      await updateDeviceControl(input.deviceId, { pumpStatus: input.pumpStatus });
      await createActivityLog({
        userId: ctx.user.id,
        userName: ctx.user.name ?? ctx.user.email ?? "ผู้ใช้",
        action: "pump_control",
        detail: `สั่งปั๊มน้ำ: ${input.pumpStatus.toUpperCase()} (อุปกรณ์: ${input.deviceId})`,
      });
      return { success: true };
    }),

  setMode: protectedProcedure
    .input(z.object({ deviceId: z.string(), mode: z.enum(["auto", "manual"]) }))
    .mutation(async ({ input, ctx }) => {
      await updateDeviceControl(input.deviceId, { mode: input.mode });
      await createActivityLog({
        userId: ctx.user.id,
        userName: ctx.user.name ?? ctx.user.email ?? "ผู้ใช้",
        action: "mode_change",
        detail: `เปลี่ยนโหมด: ${input.mode.toUpperCase()} (อุปกรณ์: ${input.deviceId})`,
      });
      return { success: true };
    }),
});
