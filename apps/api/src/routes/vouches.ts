import { Hono } from "hono";
import { db, vouches, users } from "@garona/db";
import { vouchWeight, PERMISSION, ROOT_USERNAME } from "@garona/db";
import { eq, and, sql } from "drizzle-orm";
import { requirePermission, getUserRang } from "../middleware";

const app = new Hono();

// Get my rang + vouch info
app.get("/me", async (c) => {
  const userId = c.get("userId");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const rang = await getUserRang(userId);

  // Count received vouches
  const received = await db
    .select({ count: sql<number>`count(*)` })
    .from(vouches)
    .where(and(eq(vouches.voucheeId, userId), eq(vouches.revoked, false)));

  // Count given vouches
  const given = await db
    .select({ count: sql<number>`count(*)` })
    .from(vouches)
    .where(and(eq(vouches.voucherId, userId), eq(vouches.revoked, false)));

  return c.json({
    rang,
    vouchesReceived: Number(received[0]?.count ?? 0),
    vouchesGiven: Number(given[0]?.count ?? 0),
  });
});

// Vouch for someone (requires VOUCH permission)
app.post("/vouch/:userId", requirePermission(PERMISSION.VOUCH), async (c) => {
  const voucherId = c.get("userId");
  const voucheeId = c.req.param("userId");
  const voucherRang = c.get("rang");

  if (voucherId === voucheeId) {
    return c.json({ error: "Can't vouch yourself" }, 400);
  }

  // Check target exists
  const target = await db.select().from(users).where(eq(users.id, voucheeId));
  if (target.length === 0) return c.json({ error: "User not found" }, 404);

  // Check not already vouched
  const existing = await db
    .select()
    .from(vouches)
    .where(and(eq(vouches.voucherId, voucherId), eq(vouches.voucheeId, voucheeId)));

  if (existing.length > 0 && !existing[0].revoked) {
    return c.json({ error: "Already vouched" }, 409);
  }

  // Check if voucher is the root garona account
  const [voucher] = await db.select().from(users).where(eq(users.id, voucherId));
  const isRoot = voucher?.username === ROOT_USERNAME;
  const weight = vouchWeight(voucherRang, isRoot);

  if (existing.length > 0) {
    // Re-vouch (was revoked)
    await db
      .update(vouches)
      .set({ revoked: false, weight })
      .where(eq(vouches.id, existing[0].id));
  } else {
    await db.insert(vouches).values({ voucherId, voucheeId, weight });
  }

  const newRang = await getUserRang(voucheeId);
  return c.json({ success: true, newRang });
});

// Revoke vouch
app.delete("/vouch/:userId", requirePermission(PERMISSION.VOUCH), async (c) => {
  const voucherId = c.get("userId");
  const voucheeId = c.req.param("userId");

  await db
    .update(vouches)
    .set({ revoked: true })
    .where(and(eq(vouches.voucherId, voucherId), eq(vouches.voucheeId, voucheeId)));

  const newRang = await getUserRang(voucheeId);
  return c.json({ success: true, newRang });
});

export default app;
