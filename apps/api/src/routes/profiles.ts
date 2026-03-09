import { db, follows, posts, users, vouches, PERMISSION } from "@garona/db";
import { and, eq, ilike, or, sql } from "drizzle-orm";
import { Hono } from "hono";
import { getUserRang, requirePermission } from "../middleware";
import { notifyUser } from "../lib/push";

const app = new Hono();

// Get profile by username
app.get("/:username", async (c) => {
  const username = c.req.param("username");
  const currentUserId = c.get("userId");

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username));
  if (!user) return c.json({ error: "Not found" }, 404);

  const rang = await getUserRang(user.id);

  const [postCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(posts)
    .where(eq(posts.authorId, user.id));

  const [followerCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(follows)
    .where(eq(follows.followingId, user.id));

  const [followingCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(follows)
    .where(eq(follows.followerId, user.id));

  // Am I following this user?
  let isFollowing = false;
  let hasVouched = false;
  if (currentUserId && currentUserId !== user.id) {
    const [f] = await db
      .select()
      .from(follows)
      .where(
        and(
          eq(follows.followerId, currentUserId),
          eq(follows.followingId, user.id),
        ),
      );
    isFollowing = !!f;

    const [v] = await db
      .select()
      .from(vouches)
      .where(
        and(
          eq(vouches.voucherId, currentUserId),
          eq(vouches.voucheeId, user.id),
          eq(vouches.revoked, false),
        ),
      );
    hasVouched = !!v;
  }

  return c.json({
    id: user.id,
    username: user.username,
    name: user.name,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    rang,
    posts: Number(postCount.count),
    followers: Number(followerCount.count),
    following: Number(followingCount.count),
    isFollowing,
    hasVouched,
    isMe: currentUserId === user.id,
  });
});

// Follow (requires FOLLOW permission)
app.post("/:username/follow", requirePermission(PERMISSION.FOLLOW), async (c) => {
  const followerId = c.get("userId");
  const username = c.req.param("username");

  const [target] = await db
    .select()
    .from(users)
    .where(eq(users.username, username));
  if (!target) return c.json({ error: "Not found" }, 404);
  if (target.id === followerId)
    return c.json({ error: "Can't follow yourself" }, 400);

  try {
    await db.insert(follows).values({ followerId, followingId: target.id });

    // Notify followed user (fire-and-forget)
    const fId = followerId as string;
    db.select({ name: users.name, username: users.username }).from(users).where(eq(users.id, fId)).then(([follower]) => {
      if (follower) {
        notifyUser(target.id, {
          title: "Nouvel abonné",
          body: `${follower.name} a commencé à te suivre`,
          data: { type: "follow", username: follower.username },
        }).catch(() => {});
      }
    });

    return c.json({ following: true });
  } catch {
    await db
      .delete(follows)
      .where(
        and(
          eq(follows.followerId, followerId),
          eq(follows.followingId, target.id),
        ),
      );
    return c.json({ following: false });
  }
});

// Get user's posts (grid)
app.get("/:username/posts", async (c) => {
  const username = c.req.param("username");
  const limit = Number(c.req.query("limit") || 30);
  const format = c.req.query("format"); // "feed" for enriched format

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username));
  if (!user) return c.json({ error: "Not found" }, 404);

  if (format === "feed") {
    const currentUserId = c.get("userId");
    const { enrichPosts } = await import("./feed");
    const rawPosts = await db
      .select()
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(eq(posts.authorId, user.id))
      .orderBy(sql`${posts.createdAt} desc`)
      .limit(limit);
    return c.json(await enrichPosts(rawPosts, currentUserId));
  }

  const userPosts = await db
    .select({
      id: posts.id,
      imageUrl: posts.imageUrl,
      caption: posts.caption,
      createdAt: posts.createdAt,
    })
    .from(posts)
    .where(eq(posts.authorId, user.id))
    .orderBy(sql`${posts.createdAt} desc`)
    .limit(limit);

  return c.json(userPosts);
});

// Get followers of a user
app.get("/:username/followers", async (c) => {
  const username = c.req.param("username");

  const [user] = await db.select().from(users).where(eq(users.username, username));
  if (!user) return c.json({ error: "Not found" }, 404);

  const result = await db
    .select({
      id: users.id,
      username: users.username,
      name: users.name,
      avatarUrl: users.avatarUrl,
    })
    .from(follows)
    .innerJoin(users, eq(follows.followerId, users.id))
    .where(eq(follows.followingId, user.id))
    .orderBy(sql`${follows.createdAt} desc`)
    .limit(100);

  return c.json(result);
});

// Get following of a user
app.get("/:username/following", async (c) => {
  const username = c.req.param("username");

  const [user] = await db.select().from(users).where(eq(users.username, username));
  if (!user) return c.json({ error: "Not found" }, 404);

  const result = await db
    .select({
      id: users.id,
      username: users.username,
      name: users.name,
      avatarUrl: users.avatarUrl,
    })
    .from(follows)
    .innerJoin(users, eq(follows.followingId, users.id))
    .where(eq(follows.followerId, user.id))
    .orderBy(sql`${follows.createdAt} desc`)
    .limit(100);

  return c.json(result);
});

// Search users
app.get("/", async (c) => {
  const q = c.req.query("q")?.trim();
  if (!q || q.length < 2) return c.json([]);

  const pattern = `%${q}%`;
  const prefixPattern = `${q}%`;

  const results = await db
    .select({
      id: users.id,
      username: users.username,
      name: users.name,
      avatarUrl: users.avatarUrl,
      bio: users.bio,
    })
    .from(users)
    .where(or(ilike(users.username, pattern), ilike(users.name, pattern)))
    .orderBy(
      sql`CASE WHEN ${users.username} ILIKE ${prefixPattern} THEN 0 ELSE 1 END`,
      sql`CASE WHEN ${users.name} ILIKE ${prefixPattern} THEN 0 ELSE 1 END`,
      users.username,
    )
    .limit(20);

  return c.json(results);
});

export default app;
