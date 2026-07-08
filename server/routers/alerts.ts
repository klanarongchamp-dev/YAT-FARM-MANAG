/**
 * Alerts Router
 */
import { z } from "zod";
import { getAlerts, getUnreadAlertCount, markAlertRead, markAllAlertsRead } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const alertsRouter = router({
  getAll: protectedProcedure
    .input(z.object({ onlyUnread: z.boolean().default(false) }))
    .query(async ({ input }) => {
      return getAlerts(input.onlyUnread);
    }),

  getUnreadCount: protectedProcedure.query(async () => {
    return getUnreadAlertCount();
  }),

  markRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await markAlertRead(input.id);
      return { success: true };
    }),

  markAllRead: protectedProcedure.mutation(async () => {
    await markAllAlertsRead();
    return { success: true };
  }),
});

