import { Hono } from "hono";
import { db, pushTokens } from "@garona/db";
import { and, eq } from "drizzle-orm";

const app = new Hono();

// Register a push token for the current user
app.post("/register", async (c) => {
  const userId = c.get("userId");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const { token, platform } = await c.req.json();
  if (!token || !platform) {
    return c.json({ error: "token and platform required" }, 400);
  }

  // Upsert: if the token already exists, update the userId (device may have changed user)
  await db
    .insert(pushTokens)
    .values({ userId, token, platform })
    .onConflictDoUpdate({
      target: pushTokens.token,
      set: { userId, platform, updatedAt: new Date() },
    });

  return c.json({ registered: true });
});

// Unregister a push token (logout or opt-out)
app.post("/unregister", async (c) => {
  const userId = c.get("userId");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const { token } = await c.req.json();
  if (!token) return c.json({ error: "token required" }, 400);

  await db
    .delete(pushTokens)
    .where(and(eq(pushTokens.token, token), eq(pushTokens.userId, userId)));

  return c.json({ unregistered: true });
});

export default app;
