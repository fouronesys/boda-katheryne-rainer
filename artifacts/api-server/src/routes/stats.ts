import { Router, type IRouter } from "express";
import { db, guestsTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { GetStatsResponse } from "@workspace/api-zod";
import { requirePanel } from "../lib/admin-auth";

const router: IRouter = Router();

router.get("/stats", requirePanel, async (req, res): Promise<void> => {
  const rows = await db
    .select({
      total: sql<number>`count(*)::int`,
      confirmed: sql<number>`count(*) filter (where rsvp_status = 'confirmed')::int`,
      declined: sql<number>`count(*) filter (where rsvp_status = 'declined')::int`,
      pending: sql<number>`count(*) filter (where rsvp_status = 'pending')::int`,
      withPlusOne: sql<number>`count(*) filter (where plus_one = true)::int`,
      confirmedPlusOne: sql<number>`count(*) filter (where rsvp_status = 'confirmed' and plus_one = true)::int`,
    })
    .from(guestsTable);

  const row = rows[0] ?? {
    total: 0,
    confirmed: 0,
    declined: 0,
    pending: 0,
    withPlusOne: 0,
    confirmedPlusOne: 0,
  };

  const stats = {
    totalGuests: row.total,
    confirmed: row.confirmed,
    declined: row.declined,
    pending: row.pending,
    withPlusOne: row.withPlusOne,
    totalAttendees: row.confirmed + row.confirmedPlusOne,
  };

  res.json(GetStatsResponse.parse(stats));
});

export default router;
