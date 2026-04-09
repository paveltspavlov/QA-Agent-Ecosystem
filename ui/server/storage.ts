import { db } from "./db";
import { runs, settings } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import type { Run, InsertRun, Setting } from "@shared/schema";

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
}

export const storage = new Storage();
