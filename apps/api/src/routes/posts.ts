import { Hono } from "hono";
import { db, posts, postImages, likes, comments, users, linkPreviews, postLinkPreviews } from "@garona/db";
import { eq, and, sql, inArray } from "drizzle-orm";
import { requirePermission } from "../middleware";
import { PERMISSION } from "@garona/db";
import { scrapeMetadata } from "../lib/scrape";
import { notifyUser, notifyUsers } from "../lib/push";

const app = new Hono();

/** Parse @username mentions from text, notify matched users */
async function notifyMentions(
  text: string,
  authorId: string,
  authorName: string,
  postId: string,
  context: "publication" | "commentaire",
) {
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  const usernames = [...new Set(Array.from(text.matchAll(mentionRegex), (m) => m[1]))];
  if (usernames.length === 0) return;

  const mentionedUsers = await db
    .select({ id: users.id, username: users.username })
    .from(users)
    .where(inArray(users.username, usernames));

  const userIds = mentionedUsers
    .filter((u) => u.id !== authorId)
    .map((u) => u.id);

  if (userIds.length === 0) return;

  notifyUsers(userIds, {
    title: "Mention",
    body: `${authorName} t'a mentionné dans une ${context}`,
    data: { type: "mention", postId },
  }).catch(() => {});
}

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

  // Notify mentioned users (fire-and-forget)
  if (caption) {
    db.select({ name: users.name }).from(users).where(eq(users.id, userId)).then(([author]) => {
      if (author) notifyMentions(caption, userId, author.name, post.id, "publication");
    });
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

  // Notify mentioned users in comment (fire-and-forget)
  db.select({ name: users.name }).from(users).where(eq(users.id, userId)).then(([author]) => {
    if (author) notifyMentions(text.trim(), userId, author.name, postId, "commentaire");
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

// Get users who liked a post
app.get("/:postId/likes", async (c) => {
  const postId = c.req.param("postId");

  const result = await db
    .select({
      id: users.id,
      username: users.username,
      name: users.name,
      avatarUrl: users.avatarUrl,
    })
    .from(likes)
    .innerJoin(users, eq(likes.userId, users.id))
    .where(eq(likes.postId, postId))
    .orderBy(sql`${likes.createdAt} desc`)
    .limit(100);

  return c.json(result);
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
