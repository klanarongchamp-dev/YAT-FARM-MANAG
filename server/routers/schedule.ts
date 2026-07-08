/**
 * Schedule Router
 * Manages watering schedules for devices.
 */
import { z } from "zod";
import { createActivityLog, createSchedule, deleteSchedule, getSchedulesByDevice, updateSchedule } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const scheduleRouter = router({
  getByDevice: protectedProcedure
    .input(z.object({ deviceId: z.string() }))
    .query(async ({ input }) => {
      return getSchedulesByDevice(input.deviceId);
    }),

  create: protectedProcedure
    .input(
      z.object({
        deviceId: z.string(),
        time: z.string().regex(/^\d{2}:\d{2}$/),
        duration: z.number().min(1).max(120),
        label: z.string().optional(),
        enabled: z.boolean().default(true),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await createSchedule(input);
      await createActivityLog({
        userId: ctx.user.id,
        userName: ctx.user.name ?? ctx.user.email ?? "ผู้ใช้",
        action: "schedule_create",
        detail: `เพิ่มตารางรดน้ำ: ${input.time} (${input.duration} นาที)`,
      });
      return { success: true };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
        duration: z.number().min(1).max(120).optional(),
        label: z.string().optional(),
        enabled: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateSchedule(id, data);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await deleteSchedule(input.id);
      await createActivityLog({
        userId: ctx.user.id,
        userName: ctx.user.name ?? ctx.user.email ?? "ผู้ใช้",
        action: "schedule_delete",
        detail: `ลบตารางรดน้ำ ID: ${input.id}`,
      });
      return { success: true };
    }),
});
