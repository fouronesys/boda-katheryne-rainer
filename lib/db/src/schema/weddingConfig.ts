import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const weddingConfigTable = pgTable("wedding_config", {
  id: serial("id").primaryKey(),
  brideName: text("bride_name").notNull().default("Katheryne"),
  groomName: text("groom_name").notNull().default("Rainer"),
  weddingDate: text("wedding_date").notNull().default("2026-12-20"),
  venue: text("venue").notNull().default("Salón Océano"),
  venueAddress: text("venue_address").notNull().default("Av. del Mar 123, Santo Domingo"),
  mapsUrl: text("maps_url"),
  dressCode: text("dress_code").notNull().default("Formal — Elegante"),
  allowedColors: text("allowed_colors").notNull().default('["#BCAE98","#D9D3C5","#A38C70","#705B46","#553927","#FFFFFF","#F5F0EB"]'),
  ceremonyTime: text("ceremony_time").notNull().default("6:00 PM"),
  receptionTime: text("reception_time").notNull().default("7:30 PM"),
  additionalInfo: text("additional_info"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertWeddingConfigSchema = createInsertSchema(weddingConfigTable).omit({
  id: true,
  updatedAt: true,
});

export type InsertWeddingConfig = z.infer<typeof insertWeddingConfigSchema>;
export type WeddingConfig = typeof weddingConfigTable.$inferSelect;
