import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, guestsTable, weddingConfigTable } from "@workspace/db";
import {
  GetInvitationParams,
  UpdateRsvpParams,
  UpdateRsvpBody,
  UpdateRsvpResponse,
  GetInvitationResponse,
} from "@workspace/api-zod";
import { serializeGuest, serializeConfig } from "../lib/serialize";

const router: IRouter = Router();

router.get("/invitation/:token", async (req, res): Promise<void> => {
  const params = GetInvitationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [guest] = await db
    .select()
    .from(guestsTable)
    .where(eq(guestsTable.invitationToken, params.data.token));

  if (!guest) {
    res.status(404).json({ error: "Invitation not found" });
    return;
  }

  const configs = await db.select().from(weddingConfigTable).limit(1);
  let weddingConfig = configs[0];

  if (!weddingConfig) {
    const [created] = await db.insert(weddingConfigTable).values({}).returning();
    weddingConfig = created;
  }

  const config = {
    ...serializeConfig(weddingConfig as unknown as Record<string, unknown>),
    allowedColors: JSON.parse(weddingConfig.allowedColors ?? "[]"),
  };

  res.json(
    GetInvitationResponse.parse({
      guest: serializeGuest(guest as unknown as Record<string, unknown>),
      weddingConfig: config,
    })
  );
});

router.patch("/invitation/:token/rsvp", async (req, res): Promise<void> => {
  const params = UpdateRsvpParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateRsvpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [guest] = await db
    .update(guestsTable)
    .set(parsed.data)
    .where(eq(guestsTable.invitationToken, params.data.token))
    .returning();

  if (!guest) {
    res.status(404).json({ error: "Invitation not found" });
    return;
  }

  res.json(UpdateRsvpResponse.parse(serializeGuest(guest as unknown as Record<string, unknown>)));
});

export default router;
