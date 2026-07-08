import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { activityLogRouter } from "./routers/activityLog";
import { adminUsersRouter } from "./routers/adminUsers";
import { alertsRouter } from "./routers/alerts";
import { deviceRouter } from "./routers/device";
import { financeRouter } from "./routers/finance";
import { scheduleRouter } from "./routers/schedule";
import { sensorRouter } from "./routers/sensor";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  sensor: sensorRouter,
  device: deviceRouter,
  schedule: scheduleRouter,
  finance: financeRouter,
  adminUsers: adminUsersRouter,
  activityLog: activityLogRouter,
  alerts: alertsRouter,
});

export type AppRouter = typeof appRouter;
