/**
 * Admin Users Router
 * Admin-only procedures for user management.
 */
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createActivityLog, deleteUser, getAllUsers, updateUserRole } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

/** Middleware that restricts access to admin users only */
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "เฉพาะผู้ดูแลระบบเท่านั้น" });
  }
  return next({ ctx });
});

export const adminUsersRouter = router({
  getAll: adminProcedure.query(async () => {
    return getAllUsers();
  }),

  updateRole: adminProcedure
    .input(z.object({ userId: z.number(), role: z.enum(["admin", "user"]) }))
    .mutation(async ({ input, ctx }) => {
      await updateUserRole(input.userId, input.role);
      await createActivityLog({
        userId: ctx.user.id,
        userName: ctx.user.name ?? ctx.user.email ?? "ผู้ดูแล",
        action: "user_role_change",
        detail: `เปลี่ยน Role ผู้ใช้ ID ${input.userId} เป็น ${input.role}`,
      });
      return { success: true };
    }),

  deleteUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (input.userId === ctx.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "ไม่สามารถลบบัญชีตัวเองได้" });
      }
      await deleteUser(input.userId);
      await createActivityLog({
        userId: ctx.user.id,
        userName: ctx.user.name ?? ctx.user.email ?? "ผู้ดูแล",
        action: "user_delete",
        detail: `ลบผู้ใช้ ID: ${input.userId}`,
      });
      return { success: true };
    }),
});
