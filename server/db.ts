import { and, desc, eq, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  activityLogs,
  devices,
  farmAlerts,
  farmYields,
  financeTransactions,
  InsertActivityLog,
  InsertDevice,
  InsertFarmAlert,
  InsertFarmYield,
  InsertFinanceTransaction,
  InsertSchedule,
  InsertSensorReading,
  InsertUser,
  schedules,
  sensorReadings,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

/** Lazily initialise the Drizzle instance so local tooling can run without a DB. */
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  (["name", "email", "loginMethod"] as const).forEach((f) => {
    if (user[f] !== undefined) {
      values[f] = user[f] ?? null;
      updateSet[f] = user[f] ?? null;
    }
  });

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }

  // Auto-promote owner to admin
  const role = user.openId === ENV.ownerOpenId ? "admin" : (user.role ?? "user");
  values.role = role;
  updateSet.role = role;

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserRole(userId: number, role: "admin" | "user") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, userId));
}

export async function deleteUser(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(users).where(eq(users.id, userId));
}

// ─── Devices ─────────────────────────────────────────────────────────────────

export async function upsertDevice(data: InsertDevice) {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(devices)
    .values(data)
    .onDuplicateKeyUpdate({
      set: { name: data.name, status: "online", lastSeen: new Date() },
    });
}

export async function getAllDevices() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(devices).orderBy(desc(devices.lastSeen));
}

export async function getDeviceById(deviceId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(devices).where(eq(devices.deviceId, deviceId)).limit(1);
  return result[0];
}

export async function updateDeviceControl(
  deviceId: string,
  update: { pumpStatus?: "on" | "off"; mode?: "auto" | "manual" }
) {
  const db = await getDb();
  if (!db) return;
  await db.update(devices).set({ ...update, lastSeen: new Date() }).where(eq(devices.deviceId, deviceId));
}

// ─── Sensor Readings ─────────────────────────────────────────────────────────

export async function insertSensorReading(data: InsertSensorReading) {
  const db = await getDb();
  if (!db) return;
  await db.insert(sensorReadings).values(data);
}

export async function getLatestSensorReading(deviceId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(sensorReadings)
    .where(eq(sensorReadings.deviceId, deviceId))
    .orderBy(desc(sensorReadings.recordedAt))
    .limit(1);
  return result[0];
}

export async function getSensorHistory(deviceId: string, hours = 24) {
  const db = await getDb();
  if (!db) return [];
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  return db
    .select()
    .from(sensorReadings)
    .where(and(eq(sensorReadings.deviceId, deviceId), gte(sensorReadings.recordedAt, since)))
    .orderBy(sensorReadings.recordedAt);
}

// ─── Schedules ────────────────────────────────────────────────────────────────

export async function getSchedulesByDevice(deviceId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(schedules).where(eq(schedules.deviceId, deviceId)).orderBy(schedules.time);
}

export async function createSchedule(data: InsertSchedule) {
  const db = await getDb();
  if (!db) return;
  await db.insert(schedules).values(data);
}

export async function updateSchedule(
  id: number,
  data: Partial<Pick<InsertSchedule, "time" | "duration" | "enabled" | "label">>
) {
  const db = await getDb();
  if (!db) return;
  await db.update(schedules).set(data).where(eq(schedules.id, id));
}

export async function deleteSchedule(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(schedules).where(eq(schedules.id, id));
}

// ─── Finance Transactions ────────────────────────────────────────────────────

export async function getFinanceTransactions(filters?: {
  type?: "income" | "expense";
  dateStart?: string;
  dateEnd?: string;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.type) conditions.push(eq(financeTransactions.type, filters.type));
  if (filters?.dateStart) conditions.push(gte(financeTransactions.date, filters.dateStart));
  if (filters?.dateEnd) conditions.push(lte(financeTransactions.date, filters.dateEnd));
  return db
    .select()
    .from(financeTransactions)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(financeTransactions.date));
}

export async function createFinanceTransaction(data: InsertFinanceTransaction) {
  const db = await getDb();
  if (!db) return;
  await db.insert(financeTransactions).values(data);
}

export async function deleteFinanceTransaction(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(financeTransactions).where(eq(financeTransactions.id, id));
}

// ─── Farm Yields ─────────────────────────────────────────────────────────────

export async function getFarmYields(filters?: { grade?: "A" | "B"; dateStart?: string; dateEnd?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.grade) conditions.push(eq(farmYields.grade, filters.grade));
  if (filters?.dateStart) conditions.push(gte(farmYields.date, filters.dateStart));
  if (filters?.dateEnd) conditions.push(lte(farmYields.date, filters.dateEnd));
  return db
    .select()
    .from(farmYields)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(farmYields.date));
}

export async function createFarmYield(data: InsertFarmYield) {
  const db = await getDb();
  if (!db) return;
  await db.insert(farmYields).values(data);
}

export async function deleteFarmYield(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(farmYields).where(eq(farmYields.id, id));
}

// ─── Activity Logs ───────────────────────────────────────────────────────────

export async function createActivityLog(data: InsertActivityLog) {
  const db = await getDb();
  if (!db) return;
  await db.insert(activityLogs).values(data);
}

export async function getActivityLogs(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(limit);
}

// ─── Alerts ──────────────────────────────────────────────────────────────────

export async function createAlert(data: InsertFarmAlert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(farmAlerts).values(data);
}

export async function getAlerts(onlyUnread = false) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(farmAlerts)
    .where(onlyUnread ? eq(farmAlerts.isRead, false) : undefined)
    .orderBy(desc(farmAlerts.triggeredAt))
    .limit(200);
}

export async function markAlertRead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(farmAlerts).set({ isRead: true }).where(eq(farmAlerts.id, id));
}

export async function markAllAlertsRead() {
  const db = await getDb();
  if (!db) return;
  await db.update(farmAlerts).set({ isRead: true }).where(eq(farmAlerts.isRead, false));
}

export async function getUnreadAlertCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select().from(farmAlerts).where(eq(farmAlerts.isRead, false));
  return result.length;
}
