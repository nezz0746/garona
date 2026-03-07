import { Hono } from "hono";
import { db, users, invites } from "@garona/db";
import { eq } from "drizzle-orm";
import { auth } from "../auth";
import { nanoid } from "nanoid";

const app = new Hono();

// Sign up — creates account via Better Auth (session included), becomes Rang 1 (Membre)
app.post("/", async (c) => {
  const { name, username, inviteCode } = await c.req.json();

  if (!name?.trim()) return c.json({ error: "Nom requis" }, 400);
  if (!username?.trim())
    return c.json({ error: "Nom d'utilisateur requis" }, 400);

  const cleanUsername = username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "");
  if (cleanUsername.length < 3)
    return c.json({ error: "Nom d'utilisateur trop court (min 3)" }, 400);
  if (cleanUsername.length > 30)
    return c.json({ error: "Nom d'utilisateur trop long (max 30)" }, 400);

  // Check username availability
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.username, cleanUsername));
  if (existing)
    return c.json({ error: "Ce nom d'utilisateur est déjà pris" }, 400);

  // Create user via Better Auth (creates user + session)
  const email = `${cleanUsername}@garona.local`;
  const password = nanoid(32);

  const authResponse = await auth.api.signUpEmail({
    body: {
      name: name.trim(),
      email,
      password,
    },
    headers: c.req.raw.headers,
    asResponse: true,
  });

  if (!authResponse.ok) {
    return c.json({ error: "Impossible de créer le compte" }, 500);
  }

  const authData = await authResponse.json();

  // Update with username and avatar (Better Auth doesn't handle these)
  const avatarUrl = `https://i.pravatar.cc/150?u=${cleanUsername}`;
  await db
    .update(users)
    .set({ username: cleanUsername, avatarUrl })
    .where(eq(users.id, authData.user.id));

  // If invite code provided, mark it as used
  if (inviteCode) {
    const [invite] = await db
      .select()
      .from(invites)
      .where(eq(invites.code, inviteCode));
    if (invite && !invite.usedById) {
      await db
        .update(invites)
        .set({ usedById: authData.user.id })
        .where(eq(invites.id, invite.id));
    }
  }

  // Forward session cookies from Better Auth
  authResponse.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") {
      c.header("set-cookie", value, { append: true });
    }
  });

  return c.json(
    {
      id: authData.user.id,
      name: name.trim(),
      username: cleanUsername,
      avatarUrl,
      rang: 1,
    },
    201,
  );
});

export default app;
