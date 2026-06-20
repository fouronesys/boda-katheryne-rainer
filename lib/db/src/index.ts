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

/**
 * Dress-to-Impress glitch color palette.
 * Called by the docker-entrypoint seed script on every CapRover deploy.
 * Safe to call after ensureSchema() — upserts the config row if needed.
 */
export function seedDressToImpressColors(): void {
  const GLITCH_COLORS = [
    "#C0C0C0", // Silver (DG-1)
    "#D4AF37", // Light Gold (DG-2)
    "#D32F2F", // Red (DG-3)
    "#00AEEF", // Aqua (DG-4)
    "#B57EDC", // Lavender (DG-7)
    "#009B77", // Emerald (DG-8)
    "#5D4037", // Brown (DG-9)
    "#0D0D0D", // Black (DG-10)
    "#E8E8E8", // Holo Silver (DG-11)
    "#FFD700", // Gold (DG-12)
    "#1A237E", // Navy (DG-13)
    "#E91E63", // Pink (DG-14)
    "#00C9A7", // Jade (DG-16)
    "#008F39", // Green (DG-17)
    "#66BB44", // Light Green (DG-19)
    "#616161", // Grey (DG-21)
    "#B87333", // Copper (DG-22)
    "#4A235A", // Dark Purple (DG-23)
    "#2962FF", // Royal Blue (DG-24)
    "#7B1FA2", // Purple (DG-25)
    "#FF1493", // Hot Pink (DG-26)
    "#800020", // Maroon (DG-28)
    "#FFFFFF", // White (DG-29)
    "#B76E79", // Rose Gold (DG-31)
    "#F7C6D0", // Lady Pink (DG-32)
    "#CCFF33", // Neon Rainbow Yellow (DG-302)
    "#FFB347", // Neon Rainbow Orange (DG-303)
    "#FF66CC", // Neon Rainbow Pink (DG-304)
    "#7CFC6B", // Neon Rainbow Green (DG-305)
    "#7FDBFF", // Neon Rainbow Blue (DG-306)
    "#D291FF", // Neon Rainbow Purple (DG-307)
    "#0038A8", // Blue (OCG-05)
    "#C2185B", // Cherry (OCG-06)
  ];

  const colorsJson = JSON.stringify(GLITCH_COLORS);

  const existing = sqlite
    .prepare("SELECT id FROM wedding_config LIMIT 1")
    .get() as { id: number } | undefined;

  if (existing) {
    sqlite
      .prepare("UPDATE wedding_config SET allowed_colors = ? WHERE id = ?")
      .run(colorsJson, existing.id);
  } else {
    sqlite
      .prepare("INSERT INTO wedding_config (allowed_colors) VALUES (?)")
      .run(colorsJson);
  }
}

export * from "./schema";
