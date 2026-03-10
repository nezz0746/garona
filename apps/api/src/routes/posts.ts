import { Hono } from "hono";
import { db, posts, postImages, likes, users, linkPreviews, postLinkPreviews } from "@garona/db";
import { eq, and, sql, isNull, inArray } from "drizzle-orm";
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
  context: "publication" | "réponse",
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

// Create post or reply
// Accepts { imageUrls?, caption?, parentId? }
app.post("/", requirePermission(PERMISSION.POST), async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();
  const { caption, parentId } = body;

  const imageUrls: string[] = body.imageUrls || (body.imageUrl ? [body.imageUrl] : []);
  if (imageUrls.length === 0 && !caption?.trim()) {
    return c.json({ error: "Caption or image required" }, 400);
  }

  // If reply, verify parent exists
  if (parentId) {
    const [parent] = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, parentId));
    if (!parent) return c.json({ error: "Parent post not found" }, 404);
  }

  const [post] = await db
    .insert(posts)
    .values({
      authorId: userId,
      parentId: parentId || null,
      imageUrl: imageUrls[0] || null,
      caption,
      imageCount: imageUrls.length,
    })
    .returning();

  // Increment parent's reply count
  if (parentId) {
    await db.update(posts)
      .set({ replyCount: sql`${posts.replyCount} + 1` })
      .where(eq(posts.id, parentId));
  }

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

  // Notify parent author if this is a reply (fire-and-forget)
  if (parentId) {
    const replyAuthorId = userId as string;
    db.select({ authorId: posts.authorId }).from(posts).where(eq(posts.id, parentId)).then(([parent]) => {
      if (parent && parent.authorId !== replyAuthorId) {
        db.select({ name: users.name }).from(users).where(eq(users.id, replyAuthorId)).then(([replier]) => {
          if (replier) {
            notifyUser(parent.authorId, {
              title: "Nouvelle réponse",
              body: `${replier.name} a répondu : ${(caption || "").trim().slice(0, 80)}`,
              data: { type: "reply", postId: post.id, parentId },
            }).catch(() => {});
          }
        });
      }
    });
  }

  // Notify mentioned users (fire-and-forget)
  if (caption) {
    db.select({ name: users.name }).from(users).where(eq(users.id, userId)).then(([author]) => {
      if (author) notifyMentions(caption, userId, author.name, post.id, parentId ? "réponse" : "publication");
    });
  }

  return c.json(post, 201);
});

// Like post (requires LIKE permission) — works for both posts and replies
app.post("/:postId/like", requirePermission(PERMISSION.LIKE), async (c) => {
  const userId = c.get("userId");
  const postId = c.req.param("postId");

  try {
    await db.insert(likes).values({ postId, userId });

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
    await db
      .delete(likes)
      .where(and(eq(likes.postId, postId), eq(likes.userId, userId)));
    return c.json({ liked: false });
  }
});

// Get replies for a post (replaces old comments endpoint)
app.get("/:postId/replies", async (c) => {
  const postId = c.req.param("postId");
  const currentUserId = c.get("userId") || null;

  const replies = await db
    .select()
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(eq(posts.parentId, postId))
    .orderBy(posts.createdAt);

  if (replies.length === 0) return c.json([]);

  // Enrich replies with like counts + liked status
  const replyIds = replies.map((r) => r.posts.id);

  const likeCounts = await db
    .select({ postId: likes.postId, count: sql<number>`count(*)` })
    .from(likes)
    .where(inArray(likes.postId, replyIds))
    .groupBy(likes.postId);

  const myLikes = currentUserId
    ? await db.select({ postId: likes.postId }).from(likes)
        .where(and(inArray(likes.postId, replyIds), eq(likes.userId, currentUserId)))
    : [];

  // Sub-reply counts
  const subReplyCounts = await db
    .select({ parentId: posts.parentId, count: sql<number>`count(*)` })
    .from(posts)
    .where(inArray(posts.parentId, replyIds))
    .groupBy(posts.parentId);

  const likeMap = Object.fromEntries(likeCounts.map((l) => [l.postId, Number(l.count)]));
  const myLikeSet = new Set(myLikes.map((l) => l.postId));
  const subReplyMap = Object.fromEntries(subReplyCounts.map((r) => [r.parentId!, Number(r.count)]));

  // Get images for replies
  const allImages = await db
    .select({ postId: postImages.postId, imageUrl: postImages.imageUrl, position: postImages.position })
    .from(postImages)
    .where(inArray(postImages.postId, replyIds))
    .orderBy(postImages.position);

  const imagesMap: Record<string, string[]> = {};
  for (const img of allImages) {
    if (!imagesMap[img.postId]) imagesMap[img.postId] = [];
    imagesMap[img.postId].push(img.imageUrl);
  }

  return c.json(
    replies.map((r) => ({
      id: r.posts.id,
      parentId: r.posts.parentId,
      authorId: r.posts.authorId,
      caption: r.posts.caption,
      imageUrl: r.posts.imageUrl,
      imageUrls: imagesMap[r.posts.id] || (r.posts.imageUrl ? [r.posts.imageUrl] : []),
      imageCount: r.posts.imageCount,
      createdAt: r.posts.createdAt,
      likes: likeMap[r.posts.id] || 0,
      liked: myLikeSet.has(r.posts.id),
      replies: subReplyMap[r.posts.id] || 0,
      author: {
        id: r.users.id,
        username: r.users.username,
        name: r.users.name,
        avatarUrl: r.users.avatarUrl,
      },
    }))
  );
});

// Backward compat: /comments → /replies
app.get("/:postId/comments", async (c) => {
  const postId = c.req.param("postId");
  const currentUserId = c.get("userId") || null;

  // Fetch replies and map to old comment shape
  const replies = await db
    .select()
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(eq(posts.parentId, postId))
    .orderBy(posts.createdAt);

  return c.json(
    replies.map((r) => ({
      id: r.posts.id,
      postId: postId,
      authorId: r.posts.authorId,
      text: r.posts.caption || "",
      createdAt: r.posts.createdAt,
      author: {
        username: r.users.username,
        name: r.users.name,
        avatarUrl: r.users.avatarUrl,
      },
    }))
  );
});

// Backward compat: POST /comment → create reply
app.post("/:postId/comment", requirePermission(PERMISSION.COMMENT), async (c) => {
  const userId = c.get("userId");
  const postId = c.req.param("postId");
  const { text } = await c.req.json();

  if (!text?.trim()) return c.json({ error: "Text required" }, 400);

  // Create a reply post
  const [reply] = await db
    .insert(posts)
    .values({
      authorId: userId,
      parentId: postId,
      caption: text.trim(),
      imageCount: 0,
    })
    .returning();

  // Increment parent reply count
  await db.update(posts)
    .set({ replyCount: sql`${posts.replyCount} + 1` })
    .where(eq(posts.id, postId));

  // Notify parent author (fire-and-forget)
  const replyAuthorId = userId as string;
  db.select({ authorId: posts.authorId }).from(posts).where(eq(posts.id, postId)).then(([parent]) => {
    if (parent && parent.authorId !== replyAuthorId) {
      db.select({ name: users.name }).from(users).where(eq(users.id, replyAuthorId)).then(([replier]) => {
        if (replier) {
          notifyUser(parent.authorId, {
            title: "Nouvelle réponse",
            body: `${replier.name} a répondu : ${text.trim().slice(0, 80)}`,
            data: { type: "reply", postId: reply.id, parentId: postId },
          }).catch(() => {});
        }
      });
    }
  });

  // Notify mentions
  db.select({ name: users.name }).from(users).where(eq(users.id, userId)).then(([author]) => {
    if (author) notifyMentions(text.trim(), userId, author.name, reply.id, "réponse");
  });

  return c.json(reply, 201);
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

  // If deleting a reply, decrement parent's reply count
  if (post.parentId) {
    await db.update(posts)
      .set({ replyCount: sql`GREATEST(${posts.replyCount} - 1, 0)` })
      .where(eq(posts.id, post.parentId));
  }

  await db.delete(posts).where(eq(posts.id, postId));
  return c.json({ deleted: true });
});

export default app;
