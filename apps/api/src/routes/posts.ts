import { Hono } from "hono";
import { db, posts, postImages, likes, comments, users, linkPreviews, postLinkPreviews } from "@garona/db";
import { eq, and } from "drizzle-orm";
import { requirePermission } from "../middleware";
import { PERMISSION } from "@garona/db";
import { scrapeMetadata } from "../lib/scrape";
import { notifyUser } from "../lib/push";

const app = new Hono();

// Create post (requires POST permission)
// Accepts { imageUrl, caption } or { imageUrls: string[], caption }
app.post("/", requirePermission(PERMISSION.POST), async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();
  const { caption } = body;

  // Support both single and multi-image, and text-only posts
  const imageUrls: string[] = body.imageUrls || (body.imageUrl ? [body.imageUrl] : []);
  if (imageUrls.length === 0 && !caption?.trim()) {
    return c.json({ error: "Caption or image required" }, 400);
  }

  const [post] = await db
    .insert(posts)
    .values({
      authorId: userId,
      imageUrl: imageUrls[0] || null, // cover image, null for text-only
      caption,
      imageCount: imageUrls.length,
    })
    .returning();

  // Insert all images into postImages
  if (imageUrls.length > 0) {
    await db.insert(postImages).values(
      imageUrls.map((url, i) => ({ postId: post.id, imageUrl: url, position: i }))
    );
  }

  // Extract URLs from caption and scrape link previews (fire-and-forget)
  if (caption) {
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
    const matches = caption.match(urlRegex) || [];
    const urls = Array.from(new Set<string>(matches));

    if (urls.length > 0) {
      const postId = post.id;
      Promise.resolve().then(async () => {
        for (let i = 0; i < urls.length && i < 3; i++) {
          const linkUrl = urls[i];
          try {
            let [preview] = await db.select().from(linkPreviews).where(eq(linkPreviews.url, linkUrl));

            if (!preview) {
              const meta = await scrapeMetadata(linkUrl);
              if (meta) {
                [preview] = await db
                  .insert(linkPreviews)
                  .values({ url: linkUrl, ...meta })
                  .onConflictDoNothing()
                  .returning();

                if (!preview) {
                  [preview] = await db.select().from(linkPreviews).where(eq(linkPreviews.url, linkUrl));
                }
              }
            }

            if (preview) {
              await db.insert(postLinkPreviews).values({
                postId,
                linkPreviewId: preview.id,
                position: i,
              });
            }
          } catch {
            // Skip this URL if scraping fails
          }
        }
      }).catch(() => {});
    }
  }

  return c.json(post, 201);
});

// Like post (requires LIKE permission)
app.post("/:postId/like", requirePermission(PERMISSION.LIKE), async (c) => {
  const userId = c.get("userId");
  const postId = c.req.param("postId");

  try {
    await db.insert(likes).values({ postId, userId });

    // Notify post author (fire-and-forget, skip if self-like)
    const likerId = userId as string;
    const likedPostId = postId as string;
    db.select({ authorId: posts.authorId }).from(posts).where(eq(posts.id, likedPostId)).then(([post]) => {
      if (post && post.authorId !== likerId) {
        db.select({ name: users.name }).from(users).where(eq(users.id, likerId)).then(([liker]) => {
          if (liker) {
            notifyUser(post.authorId, {
              title: "Nouveau like",
              body: `${liker.name} a aimé ta publication`,
              data: { type: "like", postId: likedPostId },
            }).catch(() => {});
          }
        });
      }
    });

    return c.json({ liked: true });
  } catch {
    // Already liked — unlike
    await db
      .delete(likes)
      .where(and(eq(likes.postId, postId), eq(likes.userId, userId)));
    return c.json({ liked: false });
  }
});

// Comment on post (requires COMMENT permission)
app.post("/:postId/comment", requirePermission(PERMISSION.COMMENT), async (c) => {
  const userId = c.get("userId");
  const postId = c.req.param("postId");
  const { text } = await c.req.json();

  if (!text?.trim()) return c.json({ error: "Text required" }, 400);

  const [comment] = await db
    .insert(comments)
    .values({ postId, authorId: userId, text: text.trim() })
    .returning();

  // Notify post author (fire-and-forget, skip if self-comment)
  const commenterId = userId as string;
  const commentedPostId = postId as string;
  db.select({ authorId: posts.authorId }).from(posts).where(eq(posts.id, commentedPostId)).then(([post]) => {
    if (post && post.authorId !== commenterId) {
      db.select({ name: users.name }).from(users).where(eq(users.id, commenterId)).then(([commenter]) => {
        if (commenter) {
          notifyUser(post.authorId, {
            title: "Nouveau commentaire",
            body: `${commenter.name} a commenté : ${text.trim().slice(0, 80)}`,
            data: { type: "comment", postId: commentedPostId },
          }).catch(() => {});
        }
      });
    }
  });

  return c.json(comment, 201);
});

// Get comments for a post
app.get("/:postId/comments", async (c) => {
  const postId = c.req.param("postId");

  const result = await db
    .select({
      id: comments.id,
      postId: comments.postId,
      authorId: comments.authorId,
      text: comments.text,
      createdAt: comments.createdAt,
      authorUsername: users.username,
      authorName: users.name,
      authorAvatar: users.avatarUrl,
    })
    .from(comments)
    .innerJoin(users, eq(comments.authorId, users.id))
    .where(eq(comments.postId, postId))
    .orderBy(comments.createdAt);

  return c.json(
    result.map((r) => ({
      id: r.id,
      postId: r.postId,
      authorId: r.authorId,
      text: r.text,
      createdAt: r.createdAt,
      author: { username: r.authorUsername, name: r.authorName, avatarUrl: r.authorAvatar },
    }))
  );
});

// Delete post (author only)
app.delete("/:postId", async (c) => {
  const userId = c.get("userId");
  const postId = c.req.param("postId");

  const [post] = await db.select().from(posts).where(eq(posts.id, postId));
  if (!post) return c.json({ error: "Not found" }, 404);
  if (post.authorId !== userId) return c.json({ error: "Not yours" }, 403);

  await db.delete(posts).where(eq(posts.id, postId));
  return c.json({ deleted: true });
});

export default app;
