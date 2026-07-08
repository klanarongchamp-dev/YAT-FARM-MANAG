/**
 * Finance Router
 * Manages income/expense transactions and farm yields (Grade A/B).
 */
import { z } from "zod";
import {
  createActivityLog,
  createFarmYield,
  createFinanceTransaction,
  deleteFarmYield,
  deleteFinanceTransaction,
  getFarmYields,
  getFinanceTransactions,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const INCOME_CATEGORIES = ["ขายผลผลิต", "ขายสัตว์", "เงินช่วยเหลือ", "อื่นๆ"] as const;
export const EXPENSE_CATEGORIES = [
  "ค่าปุ๋ย",
  "ค่ายา/สารเคมี",
  "ค่าแรง",
  "ค่าไฟฟ้า/น้ำ",
  "ค่าซ่อมบำรุง",
  "ค่าอาหารสัตว์",
  "ค่าขนส่ง",
  "อื่นๆ",
] as const;

export const financeRouter = router({
  getTransactions: protectedProcedure
    .input(
      z.object({
        type: z.enum(["income", "expense"]).optional(),
        dateStart: z.string().optional(),
        dateEnd: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      return getFinanceTransactions(input);
    }),

  createTransaction: protectedProcedure
    .input(
      z.object({
        type: z.enum(["income", "expense"]),
        category: z.string().min(1),
        amount: z.number().positive(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        note: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await createFinanceTransaction({
        ...input,
        amount: String(input.amount),
        userId: ctx.user.id,
      });
      await createActivityLog({
        userId: ctx.user.id,
        userName: ctx.user.name ?? ctx.user.email ?? "ผู้ใช้",
        action: "finance_create",
        detail: `บันทึก${input.type === "income" ? "รายรับ" : "รายจ่าย"}: ${input.category} ฿${input.amount}`,
      });
      return { success: true };
    }),

  deleteTransaction: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await deleteFinanceTransaction(input.id);
      await createActivityLog({
        userId: ctx.user.id,
        userName: ctx.user.name ?? ctx.user.email ?? "ผู้ใช้",
        action: "finance_delete",
        detail: `ลบรายการ ID: ${input.id}`,
      });
      return { success: true };
    }),

  getYields: protectedProcedure
    .input(
      z.object({
        grade: z.enum(["A", "B"]).optional(),
        dateStart: z.string().optional(),
        dateEnd: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      return getFarmYields(input);
    }),

  createYield: protectedProcedure
    .input(
      z.object({
        cropName: z.string().min(1),
        kg: z.number().positive(),
        grade: z.enum(["A", "B"]),
        pricePerKg: z.number().positive(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        note: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const totalValue = input.kg * input.pricePerKg;
      await createFarmYield({
        ...input,
        kg: String(input.kg),
        pricePerKg: String(input.pricePerKg),
        totalValue: String(totalValue),
        userId: ctx.user.id,
      });
      await createActivityLog({
        userId: ctx.user.id,
        userName: ctx.user.name ?? ctx.user.email ?? "ผู้ใช้",
        action: "yield_create",
        detail: `บันทึกผลผลิต: ${input.cropName} Grade ${input.grade} ${input.kg}kg`,
      });
      return { success: true };
    }),

  deleteYield: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await deleteFarmYield(input.id);
      await createActivityLog({
        userId: ctx.user.id,
        userName: ctx.user.name ?? ctx.user.email ?? "ผู้ใช้",
        action: "yield_delete",
        detail: `ลบผลผลิต ID: ${input.id}`,
      });
      return { success: true };
    }),
});
