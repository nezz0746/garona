import { Hono } from "hono";
import { db, users } from "@garona/db";
import { eq } from "drizzle-orm";
import { getUserRang } from "../middleware";

const app = new Hono();

// Get current user profile (requires active session)
app.get("/", async (c) => {
  const userId = c.get("userId");
  if (!userId) return c.json({ error: "Non authentifié" }, 401);

  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) return c.json({ error: "Utilisateur introuvable" }, 404);

  const rang = await getUserRang(userId as string);

  return c.json({
    id: user.id,
    name: user.name,
    username: user.username,
    avatarUrl: user.avatarUrl,
    rang,
  });
});

// Update current user profile
app.patch("/", async (c) => {
  const userId = c.get("userId");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const body = await c.req.json();
  const updates: Record<string, string | null | Date> = {};

  if (typeof body.name === "string" && body.name.trim()) {
    updates.name = body.name.trim();
  }
  if (typeof body.bio === "string") {
    updates.bio = body.bio.trim() || null;
  }
  if (typeof body.avatarUrl === "string") {
    updates.avatarUrl = body.avatarUrl;
  }

  if (Object.keys(updates).length === 0) {
    return c.json({ error: "No fields to update" }, 400);
  }

  const [updated] = await db
    .update(users)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(users.id, userId as string))
    .returning();

  const rang = await getUserRang(userId as string);

  return c.json({
    id: updated.id,
    name: updated.name,
    username: updated.username,
    avatarUrl: updated.avatarUrl,
    rang,
  });
});

export default app;
