import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Users & auth
// ---------------------------------------------------------------------------
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("viewer"), // 'admin' | 'operator' | 'viewer'
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  mustChangePassword: integer("must_change_password", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
  lastLoginAt: text("last_login_at"),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Public-safe user (no passwordHash)
export type SafeUser = Omit<User, "passwordHash">;

// ---------------------------------------------------------------------------
// Runs
// ---------------------------------------------------------------------------
export const runs = sqliteTable("runs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type").notNull(), // 'agent' | 'workflow'
  name: text("name").notNull(),
  input: text("input").notNull(),
  model: text("model"),
  status: text("status").notNull().default("pending"), // pending|running|completed|failed|stopped
  output: text("output").default(""),
  outputPath: text("output_path"),
  startedAt: text("started_at").notNull(),
  completedAt: text("completed_at"),
  errorMessage: text("error_message"),
});

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

export const insertRunSchema = createInsertSchema(runs).omit({ id: true });
export const insertSettingSchema = createInsertSchema(settings).omit({ id: true });

export type Run = typeof runs.$inferSelect;
export type InsertRun = z.infer<typeof insertRunSchema>;
export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;
