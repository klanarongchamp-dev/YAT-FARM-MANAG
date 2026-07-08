import {
  bigint,
  boolean,
  decimal,
  float,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users ───────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Devices ─────────────────────────────────────────────────────────────────
export const devices = mysqlTable("devices", {
  id: int("id").autoincrement().primaryKey(),
  deviceId: varchar("deviceId", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 128 }).notNull().default("ESP8266 Node"),
  type: varchar("type", { length: 64 }).notNull().default("esp8266"),
  status: mysqlEnum("status", ["online", "offline"]).default("offline").notNull(),
  mode: mysqlEnum("mode", ["auto", "manual"]).default("auto").notNull(),
  pumpStatus: mysqlEnum("pumpStatus", ["on", "off"]).default("off").notNull(),
  lastSeen: timestamp("lastSeen").defaultNow(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Device = typeof devices.$inferSelect;
export type InsertDevice = typeof devices.$inferInsert;

// ─── Sensor Readings ─────────────────────────────────────────────────────────
export const sensorReadings = mysqlTable("sensor_readings", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  deviceId: varchar("deviceId", { length: 64 }).notNull(),
  temperature: float("temperature"),
  humidity: float("humidity"),
  soilMoisture: float("soilMoisture"),
  light: float("light"),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
});

export type SensorReading = typeof sensorReadings.$inferSelect;
export type InsertSensorReading = typeof sensorReadings.$inferInsert;

// ─── Schedules ────────────────────────────────────────────────────────────────
export const schedules = mysqlTable("schedules", {
  id: int("id").autoincrement().primaryKey(),
  deviceId: varchar("deviceId", { length: 64 }).notNull(),
  time: varchar("time", { length: 5 }).notNull(),
  duration: int("duration").notNull().default(10),
  enabled: boolean("enabled").notNull().default(true),
  label: varchar("label", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Schedule = typeof schedules.$inferSelect;
export type InsertSchedule = typeof schedules.$inferInsert;

// ─── Finance Transactions ────────────────────────────────────────────────────
export const financeTransactions = mysqlTable("finance_transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["income", "expense"]).notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FinanceTransaction = typeof financeTransactions.$inferSelect;
export type InsertFinanceTransaction = typeof financeTransactions.$inferInsert;

// ─── Yields ──────────────────────────────────────────────────────────────────
export const farmYields = mysqlTable("farm_yields", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  cropName: varchar("cropName", { length: 128 }).notNull(),
  kg: decimal("kg", { precision: 10, scale: 2 }).notNull(),
  grade: mysqlEnum("grade", ["A", "B"]).notNull(),
  pricePerKg: decimal("pricePerKg", { precision: 10, scale: 2 }).notNull(),
  totalValue: decimal("totalValue", { precision: 12, scale: 2 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FarmYield = typeof farmYields.$inferSelect;
export type InsertFarmYield = typeof farmYields.$inferInsert;

// ─── Activity Logs ───────────────────────────────────────────────────────────
export const activityLogs = mysqlTable("activity_logs", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  userId: int("userId"),
  userName: varchar("userName", { length: 128 }),
  action: varchar("action", { length: 128 }).notNull(),
  detail: text("detail"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;

// ─── Alerts ──────────────────────────────────────────────────────────────────
export const farmAlerts = mysqlTable("farm_alerts", {
  id: int("id").autoincrement().primaryKey(),
  type: varchar("type", { length: 64 }).notNull(),
  message: text("message").notNull(),
  value: float("value"),
  threshold: float("threshold"),
  isRead: boolean("isRead").notNull().default(false),
  triggeredAt: timestamp("triggeredAt").defaultNow().notNull(),
});

export type FarmAlert = typeof farmAlerts.$inferSelect;
export type InsertFarmAlert = typeof farmAlerts.$inferInsert;
