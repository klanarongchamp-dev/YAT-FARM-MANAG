/**
 * YAT FARM MANAGER - Server-side Tests
 * Tests for sensor ingestion, finance, and auth flows.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

// ─── Mock DB helpers ──────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  getAllUsers: vi.fn().mockResolvedValue([]),
  updateUserRole: vi.fn(),
  deleteUser: vi.fn(),
  upsertDevice: vi.fn(),
  getAllDevices: vi.fn().mockResolvedValue([]),
  getDeviceById: vi.fn().mockResolvedValue(null),
  updateDeviceControl: vi.fn(),
  insertSensorReading: vi.fn(),
  getLatestSensorReading: vi.fn().mockResolvedValue(null),
  getSensorHistory: vi.fn().mockResolvedValue([]),
  getSchedulesByDevice: vi.fn().mockResolvedValue([]),
  createSchedule: vi.fn(),
  updateSchedule: vi.fn(),
  deleteSchedule: vi.fn(),
  getFinanceTransactions: vi.fn().mockResolvedValue([]),
  createFinanceTransaction: vi.fn(),
  deleteFinanceTransaction: vi.fn(),
  getFarmYields: vi.fn().mockResolvedValue([]),
  createFarmYield: vi.fn(),
  deleteFarmYield: vi.fn(),
  createActivityLog: vi.fn(),
  getActivityLogs: vi.fn().mockResolvedValue([]),
  createAlert: vi.fn(),
  getAlerts: vi.fn().mockResolvedValue([]),
  markAlertRead: vi.fn(),
  markAllAlertsRead: vi.fn(),
  getUnreadAlertCount: vi.fn().mockResolvedValue(0),
}));

// ─── Context helpers ──────────────────────────────────────────────────────────
type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function makeCtx(role: "admin" | "user" = "user"): TrpcContext {
  const clearedCookies: { name: string; options: Record<string, unknown> }[] = [];
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-001",
    email: "test@yatfarm.dev",
    name: "Test User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, opts: Record<string, unknown>) =>
        clearedCookies.push({ name, options: opts }),
    } as TrpcContext["res"],
  };
}

function makeAdminCtx(): TrpcContext {
  return makeCtx("admin");
}

// ─── Auth Tests ───────────────────────────────────────────────────────────────
describe("auth.logout", () => {
  it("clears session cookie and returns success", async () => {
    const clearedCookies: { name: string; options: Record<string, unknown> }[] = [];
    const ctx: TrpcContext = {
      user: {
        id: 1,
        openId: "test",
        email: "test@test.com",
        name: "Test",
        loginMethod: "manus",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {
        clearCookie: (name: string, opts: Record<string, unknown>) =>
          clearedCookies.push({ name, options: opts }),
      } as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({ maxAge: -1 });
  });

  it("auth.me returns null when unauthenticated", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const me = await caller.auth.me();
    expect(me).toBeNull();
  });
});

// ─── Sensor Tests ─────────────────────────────────────────────────────────────
describe("sensor.getLatest", () => {
  it("returns null when no reading exists", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.sensor.getLatest({ deviceId: "esp8266-001" });
    expect(result).toBeNull();
  });
});

describe("sensor.getHistory", () => {
  it("returns empty array when no history", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.sensor.getHistory({ deviceId: "esp8266-001", hours: 24 });
    expect(result).toEqual([]);
  });
});

describe("sensor.postReading", () => {
  it("accepts valid sensor data", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.sensor.postReading({
      deviceId: "esp8266-001",
      temperature: 28.5,
      humidity: 65.0,
      soilMoisture: 42.0,
      light: 800,
    });
    expect(result).toEqual({ success: true });
  });

  it("rejects missing deviceId", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.sensor.postReading({ deviceId: "" } as any)
    ).rejects.toThrow();
  });
});

// ─── Device Tests ─────────────────────────────────────────────────────────────
describe("device.getAll", () => {
  it("returns empty array when no devices", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.device.getAll();
    expect(result).toEqual([]);
  });
});

describe("device.setPumpStatus", () => {
  it("sets pump status and returns success", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.device.setPumpStatus({
      deviceId: "esp8266-001",
      pumpStatus: "on",
    });
    expect(result).toEqual({ success: true });
  });
});

// ─── Finance Tests ────────────────────────────────────────────────────────────
describe("finance.getTransactions", () => {
  it("returns empty array when no transactions", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.finance.getTransactions({});
    expect(result).toEqual([]);
  });
});

describe("finance.createTransaction", () => {
  it("creates income transaction successfully", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.finance.createTransaction({
      type: "income",
      category: "ขายผลผลิต",
      amount: 1500,
      date: "2026-07-08",
    });
    expect(result).toEqual({ success: true });
  });

  it("creates expense transaction successfully", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.finance.createTransaction({
      type: "expense",
      category: "ค่าปุ๋ย",
      amount: 350,
      date: "2026-07-08",
    });
    expect(result).toEqual({ success: true });
  });

  it("rejects negative amount", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.finance.createTransaction({
        type: "income",
        category: "ขายผลผลิต",
        amount: -100,
        date: "2026-07-08",
      })
    ).rejects.toThrow();
  });
});

describe("finance.createYield", () => {
  it("creates Grade A yield successfully", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.finance.createYield({
      cropName: "มะเขือเทศ",
      kg: 50,
      grade: "A",
      pricePerKg: 25,
      date: "2026-07-08",
    });
    expect(result).toEqual({ success: true });
  });

  it("creates Grade B yield successfully", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.finance.createYield({
      cropName: "มะเขือเทศ",
      kg: 30,
      grade: "B",
      pricePerKg: 15,
      date: "2026-07-08",
    });
    expect(result).toEqual({ success: true });
  });

  it("rejects invalid grade", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.finance.createYield({
        cropName: "มะเขือเทศ",
        kg: 10,
        grade: "C" as any,
        pricePerKg: 10,
        date: "2026-07-08",
      })
    ).rejects.toThrow();
  });
});

// ─── Admin Users Tests ────────────────────────────────────────────────────────
describe("adminUsers.getAll", () => {
  it("admin can list users", async () => {
    const ctx = makeAdminCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.adminUsers.getAll();
    expect(Array.isArray(result)).toBe(true);
  });

  it("non-admin is forbidden", async () => {
    const ctx = makeCtx("user");
    const caller = appRouter.createCaller(ctx);
    await expect(caller.adminUsers.getAll()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

// ─── Alerts Tests ─────────────────────────────────────────────────────────────
describe("alerts.getUnreadCount", () => {
  it("returns 0 when no unread alerts", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const count = await caller.alerts.getUnreadCount();
    expect(count).toBe(0);
  });
});

describe("alerts.markAllRead", () => {
  it("marks all alerts as read", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.alerts.markAllRead();
    expect(result).toEqual({ success: true });
  });
});
