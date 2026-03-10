import { Hono } from "hono";
import { db, posts, postImages, users, likes, follows, linkPreviews, postLinkPreviews } from "@garona/db";
import { eq, desc, sql, and, isNull, inArray } from "drizzle-orm";

const app = new Hono();

// Discovery feed — top-level posts only, newest first
app.get("/discover", async (c) => {
  const userId = c.get("userId") || null;
  const limit = Number(c.req.query("limit") || 20);
  const offset = Number(c.req.query("offset") || 0);

  const allPosts = await db
    .select()
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(isNull(posts.parentId))
    .orderBy(desc(posts.createdAt))
    .limit(limit)
    .offset(offset);

  return c.json(await enrichPosts(allPosts, userId));
});

// Following feed — posts from people you follow + your own
app.get("/following", async (c) => {
  const userId = c.get("userId");
  const limit = Number(c.req.query("limit") || 20);
  const offset = Number(c.req.query("offset") || 0);

  if (!userId) return c.json([]);

  const myFollows = await db
    .select({ followingId: follows.followingId })
    .from(follows)
    .where(eq(follows.followerId, userId));

  const followingIds = myFollows.map((f) => f.followingId);
  followingIds.push(userId);

  const feedPosts = await db
    .select()
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(and(inArray(posts.authorId, followingIds), isNull(posts.parentId)))
    .orderBy(desc(posts.createdAt))
    .limit(limit)
    .offset(offset);

  return c.json(await enrichPosts(feedPosts, userId));
});

// Default feed
app.get("/", async (c) => {
  const userId = c.get("userId") || null;
  const limit = Number(c.req.query("limit") || 20);
  const offset = Number(c.req.query("offset") || 0);

  const allPosts = await db
    .select()
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(isNull(posts.parentId))
    .orderBy(desc(posts.createdAt))
    .limit(limit)
    .offset(offset);

  return c.json(await enrichPosts(allPosts, userId));
});

// Get single post
app.get("/:postId", async (c) => {
  const postId = c.req.param("postId");
  const userId = c.get("userId");

  const result = await db
    .select()
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(eq(posts.id, postId));

  if (result.length === 0) return c.json({ error: "Not found" }, 404);

  const enriched = await enrichPosts(result, userId);
  return c.json(enriched[0]);
});

// Helper: enrich posts with likes, reply counts, images, link previews
export async function enrichPosts(
  rawPosts: { posts: typeof posts.$inferSelect; users: typeof users.$inferSelect }[],
  currentUserId: string | null
) {
  if (rawPosts.length === 0) return [];

  const postIds = rawPosts.map((p) => p.posts.id);

  // Like counts
  const likeCounts = await db
    .select({ postId: likes.postId, count: sql<number>`count(*)` })
    .from(likes)
    .where(inArray(likes.postId, postIds))
    .groupBy(likes.postId);

  // My likes
  const myLikes = currentUserId
    ? await db
        .select({ postId: likes.postId })
        .from(likes)
        .where(and(inArray(likes.postId, postIds), eq(likes.userId, currentUserId)))
    : [];

  // Multi-image data
  const allImages = await db
    .select({ postId: postImages.postId, imageUrl: postImages.imageUrl, position: postImages.position })
    .from(postImages)
    .where(inArray(postImages.postId, postIds))
    .orderBy(postImages.position);

  const imagesMap: Record<string, string[]> = {};
  for (const img of allImages) {
    if (!imagesMap[img.postId]) imagesMap[img.postId] = [];
    imagesMap[img.postId].push(img.imageUrl);
  }

  // Link previews
  const linkPreviewMap: Record<string, { url: string; title: string | null; description: string | null; imageUrl: string | null; domain: string | null }[]> = {};
  try {
    const allLinkPreviews = await db
      .select({
        postId: postLinkPreviews.postId,
        url: linkPreviews.url,
        title: linkPreviews.title,
        description: linkPreviews.description,
        imageUrl: linkPreviews.imageUrl,
        domain: linkPreviews.domain,
        position: postLinkPreviews.position,
      })
      .from(postLinkPreviews)
      .innerJoin(linkPreviews, eq(postLinkPreviews.linkPreviewId, linkPreviews.id))
      .where(inArray(postLinkPreviews.postId, postIds))
      .orderBy(postLinkPreviews.position);

    for (const lp of allLinkPreviews) {
      if (!linkPreviewMap[lp.postId]) linkPreviewMap[lp.postId] = [];
      linkPreviewMap[lp.postId].push({
        url: lp.url,
        title: lp.title,
        description: lp.description,
        imageUrl: lp.imageUrl,
        domain: lp.domain,
      });
    }
  } catch {
    // post_link_previews table may not exist yet
  }

  const likeMap = Object.fromEntries(likeCounts.map((l) => [l.postId, Number(l.count)]));
  const myLikeSet = new Set(myLikes.map((l) => l.postId));

  return rawPosts.map((p) => ({
    id: p.posts.id,
    caption: p.posts.caption,
    imageUrl: p.posts.imageUrl ?? null,
    imageUrls: imagesMap[p.posts.id] || (p.posts.imageUrl ? [p.posts.imageUrl] : []),
    imageCount: p.posts.imageCount,
    parentId: p.posts.parentId ?? null,
    createdAt: p.posts.createdAt,
    authorId: p.posts.authorId,
    author: {
      id: p.users.id,
      username: p.users.username,
      name: p.users.name,
      avatarUrl: p.users.avatarUrl,
    },
    likes: likeMap[p.posts.id] || 0,
    comments: p.posts.replyCount, // backward compat field name
    replies: p.posts.replyCount,
    liked: myLikeSet.has(p.posts.id),
    linkPreviews: linkPreviewMap[p.posts.id] || [],
  }));
}

export default app;
