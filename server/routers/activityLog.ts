/**
 * Activity Log Router
 */
import { z } from "zod";
import { getActivityLogs } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const activityLogRouter = router({
  getAll: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(500).default(100) }))
    .query(async ({ input }) => {
      return getActivityLogs(input.limit);
    }),
});
