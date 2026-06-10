import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, weddingConfigTable } from "@workspace/db";
import {
  UpdateWeddingConfigBody,
  GetWeddingConfigResponse,
  UpdateWeddingConfigResponse,
} from "@workspace/api-zod";
import { serializeConfig } from "../lib/serialize";
import { requireAdmin } from "../lib/admin-auth";

const router: IRouter = Router();

async function getOrCreateConfig() {
  const configs = await db.select().from(weddingConfigTable).limit(1);
  if (configs[0]) return configs[0];
  const [created] = await db.insert(weddingConfigTable).values({}).returning();
  return created;
}

router.get("/wedding-config", async (req, res): Promise<void> => {
  const config = await getOrCreateConfig();
  const parsed = {
    ...serializeConfig(config as unknown as Record<string, unknown>),
    allowedColors: JSON.parse(config.allowedColors ?? "[]"),
  };
  res.json(GetWeddingConfigResponse.parse(parsed));
});

router.patch("/wedding-config", requireAdmin, async (req, res): Promise<void> => {
  const parsed = UpdateWeddingConfigBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const current = await getOrCreateConfig();

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (Array.isArray(parsed.data.allowedColors)) {
    updateData.allowedColors = JSON.stringify(parsed.data.allowedColors);
  }

  const [updated] = await db
    .update(weddingConfigTable)
    .set(updateData)
    .where(eq(weddingConfigTable.id, current.id))
    .returning();

  const config = updated ?? current;
  const result = {
    ...serializeConfig(config as unknown as Record<string, unknown>),
    allowedColors: JSON.parse(config.allowedColors ?? "[]"),
  };

  res.json(UpdateWeddingConfigResponse.parse(result));
});

export default router;
