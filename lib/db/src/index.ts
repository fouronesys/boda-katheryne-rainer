import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import * as schema from "./schema";

const dbFile = resolve(process.env.DATABASE_FILE ?? "./data/wedding.db");

mkdirSync(dirname(dbFile), { recursive: true });

const sqlite = new Database(dbFile);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

/**
 * Idempotently create the schema. Safe to call on every startup — uses
 * `CREATE TABLE IF NOT EXISTS`, so an existing database (or volume) is left
 * untouched. This is what lets a fresh SQLite file (e.g. a new CapRover
 * persistent volume) bootstrap itself without a separate migration step.
 */
export function ensureSchema(): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS wedding_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bride_name TEXT NOT NULL DEFAULT 'Katheryne',
      groom_name TEXT NOT NULL DEFAULT 'Rainer',
      wedding_date TEXT NOT NULL DEFAULT '2026-11-20',
      venue TEXT NOT NULL DEFAULT 'Salón Océano',
      venue_address TEXT NOT NULL DEFAULT 'Av. del Mar 123, Santo Domingo',
      maps_url TEXT,
      music_url TEXT,
      dress_code TEXT NOT NULL DEFAULT 'Formal — Elegante',
      allowed_colors TEXT NOT NULL DEFAULT '["#BCAE98","#D9D3C5","#A38C70","#705B46","#553927","#FFFFFF","#F5F0EB"]',
      ceremony_time TEXT NOT NULL DEFAULT '6:00 PM',
      reception_time TEXT NOT NULL DEFAULT '7:30 PM',
      additional_info TEXT,
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS guests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      table_number INTEGER,
      plus_one INTEGER NOT NULL DEFAULT 0,
      plus_one_name TEXT,
      invitation_token TEXT NOT NULL UNIQUE,
      rsvp_status TEXT NOT NULL DEFAULT 'pending',
      notes TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
  `);

  // Idempotent column additions for databases created before a column existed
  // (e.g. an existing CapRover volume). CREATE TABLE IF NOT EXISTS above does
  // not alter an existing table, so upgrade it here.
  addColumnIfMissing("wedding_config", "music_url", "music_url TEXT");
}

function addColumnIfMissing(table: string, column: string, ddl: string): void {
  const columns = sqlite
    .prepare(`PRAGMA table_info(${table})`)
    .all() as Array<{ name: string }>;
  if (!columns.some((c) => c.name === column)) {
    sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
  }
}

export * from "./schema";
