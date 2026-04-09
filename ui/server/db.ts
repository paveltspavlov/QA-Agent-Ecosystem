import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import * as schema from "@shared/schema";

const dbDir = path.join(process.cwd(), "data");
fs.mkdirSync(dbDir, { recursive: true });
const dbPath = path.join(dbDir, "qa-ui.db");

const sqlite = new Database(dbPath);
sqlite.exec("PRAGMA journal_mode = WAL;");

export const db = drizzle(sqlite, { schema });

// Initialize tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    input TEXT NOT NULL,
    model TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    output TEXT DEFAULT '',
    output_path TEXT,
    started_at TEXT NOT NULL,
    completed_at TEXT,
    error_message TEXT
  );
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL
  );
`);
