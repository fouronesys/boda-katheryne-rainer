import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { db, guestsTable } from "@workspace/db";
import {
  CreateGuestBody,
  UpdateGuestBody,
  UpdateGuestParams,
  GetGuestParams,
  DeleteGuestParams,
  ListGuestsResponse,
  GetGuestResponse,
  UpdateGuestResponse,
} from "@workspace/api-zod";
import { serializeGuest } from "../lib/serialize";
import { requireAdmin } from "../lib/admin-auth";

const router: IRouter = Router();

function generateToken(): string {
  return randomBytes(16).toString("hex");
}

router.get("/guests", requireAdmin, async (req, res): Promise<void> => {
  const guests = await db
    .select()
    .from(guestsTable)
    .orderBy(guestsTable.createdAt);
  res.json(ListGuestsResponse.parse(guests.map(serializeGuest)));
});

router.post("/guests", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateGuestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const invitationToken = generateToken();
  const [guest] = await db
    .insert(guestsTable)
    .values({ ...parsed.data, invitationToken })
    .returning();

  res.status(201).json(GetGuestResponse.parse(serializeGuest(guest)));
});

router.get("/guests/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = GetGuestParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [guest] = await db
    .select()
    .from(guestsTable)
    .where(eq(guestsTable.id, params.data.id));

  if (!guest) {
    res.status(404).json({ error: "Guest not found" });
    return;
  }

  res.json(GetGuestResponse.parse(serializeGuest(guest)));
});

router.patch("/guests/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateGuestParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateGuestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [guest] = await db
    .update(guestsTable)
    .set(parsed.data)
    .where(eq(guestsTable.id, params.data.id))
    .returning();

  if (!guest) {
    res.status(404).json({ error: "Guest not found" });
    return;
  }

  res.json(UpdateGuestResponse.parse(serializeGuest(guest)));
});

router.delete("/guests/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteGuestParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(guestsTable)
    .where(eq(guestsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Guest not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
