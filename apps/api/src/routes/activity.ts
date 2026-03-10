import { Hono } from "hono";
import { db, users, likes, follows, posts } from "@garona/db";
import { eq, desc, and, isNotNull, sql } from "drizzle-orm";

const app = new Hono();

type Activity = {
  id: string;
  type: "like" | "reply" | "follow";
  actor: { id: string; username: string; name: string; avatarUrl: string | null };
  text?: string;
  postId?: string;
  postImage?: string;
  createdAt: string;
};

// Get activity (likes, replies, follows on my content)
app.get("/", async (c) => {
  const userId = c.get("userId");
  if (!userId) return c.json([]);

  const limit = Number(c.req.query("limit") || 30);
  const results: Activity[] = [];

  // Likes on my posts
  const myLikes = await db
    .select({
      likeCreatedAt: likes.createdAt,
      actorId: users.id,
      actorUsername: users.username,
      actorName: users.name,
      actorAvatar: users.avatarUrl,
      postId: posts.id,
      postImage: posts.imageUrl,
    })
    .from(likes)
    .innerJoin(posts, eq(likes.postId, posts.id))
    .innerJoin(users, eq(likes.userId, users.id))
    .where(and(eq(posts.authorId, userId), sql`${likes.userId} != ${userId}`))
    .orderBy(desc(likes.createdAt))
    .limit(limit);

  for (const l of myLikes) {
    results.push({
      id: `like-${l.actorId}-${l.postId}`,
      type: "like",
      actor: { id: l.actorId, username: l.actorUsername, name: l.actorName, avatarUrl: l.actorAvatar },
      postId: l.postId,
      postImage: l.postImage,
      createdAt: l.likeCreatedAt?.toISOString() || new Date().toISOString(),
    });
  }

  // Replies to my posts (posts where parentId is one of my posts)
  // We alias the posts table for the reply and the parent
  const myReplies = await db
    .select({
      replyId: posts.id,
      replyCaption: posts.caption,
      replyCreatedAt: posts.createdAt,
      parentId: posts.parentId,
      actorId: users.id,
      actorUsername: users.username,
      actorName: users.name,
      actorAvatar: users.avatarUrl,
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(
      and(
        isNotNull(posts.parentId),
        sql`${posts.parentId} IN (SELECT id FROM posts WHERE author_id = ${userId})`,
        sql`${posts.authorId} != ${userId}`,
      ),
    )
    .orderBy(desc(posts.createdAt))
    .limit(limit);

  for (const r of myReplies) {
    results.push({
      id: `reply-${r.replyId}`,
      type: "reply",
      actor: { id: r.actorId, username: r.actorUsername, name: r.actorName, avatarUrl: r.actorAvatar },
      text: r.replyCaption,
      postId: r.parentId!,
      createdAt: r.replyCreatedAt?.toISOString() || new Date().toISOString(),
    });
  }

  // New followers
  const myFollowers = await db
    .select({
      followCreatedAt: follows.createdAt,
      actorId: users.id,
      actorUsername: users.username,
      actorName: users.name,
      actorAvatar: users.avatarUrl,
    })
    .from(follows)
    .innerJoin(users, eq(follows.followerId, users.id))
    .where(eq(follows.followingId, userId))
    .orderBy(desc(follows.createdAt))
    .limit(limit);

  for (const f of myFollowers) {
    results.push({
      id: `follow-${f.actorId}`,
      type: "follow",
      actor: { id: f.actorId, username: f.actorUsername, name: f.actorName, avatarUrl: f.actorAvatar },
      createdAt: f.followCreatedAt?.toISOString() || new Date().toISOString(),
    });
  }

  // Sort by date descending, cap at limit
  results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return c.json(results.slice(0, limit));
});

export default app;
