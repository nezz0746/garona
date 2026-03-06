import { Hono } from "hono";
import { db, users } from "@garona/db";
import { eq } from "drizzle-orm";
import { computePalier } from "@garona/db";

const app = new Hono();

// Get current user profile (requires active session)
app.get("/", async (c) => {
  const userId = c.get("userId");
  if (!userId) return c.json({ error: "Non authentifié" }, 401);

  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) return c.json({ error: "Utilisateur introuvable" }, 404);

  return c.json({
    id: user.id,
    name: user.name,
    username: user.username,
    avatarUrl: user.avatarUrl,
    rang: 1,
  });
});

export default app;
