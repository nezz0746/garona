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

export default app;
