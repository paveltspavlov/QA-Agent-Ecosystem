import { db } from "./db";
import { runs, settings, users } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import type { Run, InsertRun, Setting, User, InsertUser } from "@shared/schema";

export interface IStorage {
  // Runs
  getRuns(): Run[];
  getRun(id: number): Run | undefined;
  createRun(run: InsertRun): Run;
  updateRun(id: number, partial: Partial<Run>): Run | undefined;
  // Settings
  getSetting(key: string): string | undefined;
  setSetting(key: string, value: string): void;
  getAllSettings(): Setting[];
  // Users
  getUserCount(): number;
  getUserById(id: number): User | undefined;
  getUserByUsername(username: string): User | undefined;
  getAllUsers(): User[];
  createUser(user: InsertUser): User;
  updateUser(id: number, partial: Partial<User>): User | undefined;
  deleteUser(id: number): void;
}

export class Storage implements IStorage {
  getRuns(): Run[] {
    return db.select().from(runs).orderBy(desc(runs.id)).all();
  }

  getRun(id: number): Run | undefined {
    return db.select().from(runs).where(eq(runs.id, id)).get();
  }

  createRun(run: InsertRun): Run {
    return db.insert(runs).values(run).returning().get();
  }

  updateRun(id: number, partial: Partial<Run>): Run | undefined {
    return db.update(runs).set(partial).where(eq(runs.id, id)).returning().get();
  }

  getSetting(key: string): string | undefined {
    const row = db.select().from(settings).where(eq(settings.key, key)).get();
    return row?.value;
  }

  setSetting(key: string, value: string): void {
    db
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: settings.key, set: { value } })
      .run();
  }

  getAllSettings(): Setting[] {
    return db.select().from(settings).all();
  }

  // Users ------------------------------------------------------------------
  getUserCount(): number {
    return db.select().from(users).all().length;
  }

  getUserById(id: number): User | undefined {
    return db.select().from(users).where(eq(users.id, id)).get();
  }

  getUserByUsername(username: string): User | undefined {
    return db.select().from(users).where(eq(users.username, username)).get();
  }

  getAllUsers(): User[] {
    return db.select().from(users).orderBy(users.id).all();
  }

  createUser(user: InsertUser): User {
    return db.insert(users).values(user).returning().get();
  }

  updateUser(id: number, partial: Partial<User>): User | undefined {
    return db.update(users).set(partial).where(eq(users.id, id)).returning().get();
  }

  deleteUser(id: number): void {
    db.delete(users).where(eq(users.id, id)).run();
  }
}

export const storage = new Storage();
