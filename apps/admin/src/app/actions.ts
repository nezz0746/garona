"use server";

import { db, users, posts, postImages, vouches, computeRang, vouchWeight, ROOT_USERNAME } from "@garona/db";
import { eq, and, sql, desc, isNotNull } from "drizzle-orm";
import crypto from "crypto";
import { revalidatePath } from "next/cache";

export async function createRootAccount() {
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.username, "garona"));

  if (existing) {
    return { error: "Root account already exists" };
  }

  const [root] = await db
    .insert(users)
    .values({
      name: "Garona",
      username: "garona",
      email: "garona@garona.local",
      bio: "Compte officiel Garona",
    })
    .returning();

  return { success: true, user: root };
}

export async function uploadImage(formData: FormData) {
  const file = formData.get("file") as File | null;
  if (!file) return { url: "", error: "No file provided" };

  const ext = file.type === "image/png" ? "png" : "jpg";
  const key = `posts/admin/${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`;

  const S3_ENDPOINT = process.env.S3_ENDPOINT || "http://localhost:9000";
  const S3_BUCKET = process.env.S3_BUCKET || "garona";

  const arrayBuffer = await file.arrayBuffer();
  const res = await fetch(`${S3_ENDPOINT}/${S3_BUCKET}/${key}`, {
    method: "PUT",
    body: arrayBuffer,
    headers: { "Content-Type": file.type },
  });

  if (!res.ok) return { url: "", error: "Upload failed" };

  const PUBLIC_API_URL =
    process.env.PUBLIC_API_URL || "http://localhost:3001";
  return { url: `${PUBLIC_API_URL}/api/upload/images/${key}` };
}

export async function createPostAsRoot(
  imageUrls: string[],
  caption?: string,
) {
  const [rootUser] = await db
    .select()
    .from(users)
    .where(eq(users.username, "garona"));

  if (!rootUser) {
    return { error: "Root account does not exist. Create it first." };
  }

  if (imageUrls.length === 0 && !caption?.trim()) {
    return { error: "Provide at least a caption or images." };
  }

  const [post] = await db
    .insert(posts)
    .values({
      authorId: rootUser.id,
      imageUrl: imageUrls[0] || null,
      caption: caption || null,
      imageCount: imageUrls.length,
    })
    .returning();

  if (imageUrls.length > 0) {
    await db.insert(postImages).values(
      imageUrls.map((url, i) => ({
        postId: post.id,
        imageUrl: url,
        position: i,
      })),
    );
  }

  return { success: true, postId: post.id };
}

export async function getUsers() {
  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      email: users.email,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  // Get vouch weight + rang for each user
  const usersWithRang = await Promise.all(
    allUsers.map(async (u) => {
      const [result] = await db
        .select({ total: sql<number>`coalesce(sum(${vouches.weight}), 0)` })
        .from(vouches)
        .where(and(eq(vouches.voucheeId, u.id), eq(vouches.revoked, false)));
      const totalWeight = Number(result?.total ?? 0);
      const rang = computeRang(totalWeight);

      // Check if root has already vouched for this user
      const [rootUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, ROOT_USERNAME));

      let rootVouched = false;
      if (rootUser) {
        const [existing] = await db
          .select()
          .from(vouches)
          .where(
            and(
              eq(vouches.voucherId, rootUser.id),
              eq(vouches.voucheeId, u.id),
              eq(vouches.revoked, false),
            ),
          );
        rootVouched = !!existing;
      }

      return { ...u, rang, totalWeight, rootVouched };
    }),
  );

  return usersWithRang;
}

export async function vouchAsRoot(userId: string) {
  const [rootUser] = await db
    .select()
    .from(users)
    .where(eq(users.username, ROOT_USERNAME));

  if (!rootUser) {
    return { error: "Root account does not exist" };
  }

  if (rootUser.id === userId) {
    return { error: "Can't vouch yourself" };
  }

  // Check not already vouched
  const [existing] = await db
    .select()
    .from(vouches)
    .where(
      and(
        eq(vouches.voucherId, rootUser.id),
        eq(vouches.voucheeId, userId),
      ),
    );

  const weight = vouchWeight(1, true); // root always gets weight 3

  if (existing && !existing.revoked) {
    return { error: "Already vouched" };
  }

  if (existing) {
    // Re-vouch
    await db
      .update(vouches)
      .set({ revoked: false, weight })
      .where(eq(vouches.id, existing.id));
  } else {
    await db.insert(vouches).values({
      voucherId: rootUser.id,
      voucheeId: userId,
      weight,
    });
  }

  revalidatePath("/");
  return { success: true };
}

export async function revokeRootVouch(userId: string) {
  const [rootUser] = await db
    .select()
    .from(users)
    .where(eq(users.username, ROOT_USERNAME));

  if (!rootUser) {
    return { error: "Root account does not exist" };
  }

  await db
    .update(vouches)
    .set({ revoked: true })
    .where(
      and(
        eq(vouches.voucherId, rootUser.id),
        eq(vouches.voucheeId, userId),
      ),
    );

  revalidatePath("/");
  return { success: true };
}

export async function runCommentsMigration() {
  // Check if comments table still exists
  const tableCheck = await db.execute(
    sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'comments') as exists`
  );
  const commentsExist = (tableCheck.rows[0] as any)?.exists;

  if (!commentsExist) {
    const [replyStats] = await db
      .select({ count: sql<number>`count(*)` })
      .from(posts)
      .where(isNotNull(posts.parentId));

    const [topLevel] = await db
      .select({ count: sql<number>`count(*)` })
      .from(posts)
      .where(sql`${posts.parentId} IS NULL`);

    return {
      success: true,
      alreadyDone: true,
      message: `Migration déjà effectuée. ${Number(topLevel.count)} posts, ${Number(replyStats.count)} réponses.`,
    };
  }

  // 1. Add columns (idempotent)
  await db.execute(sql`ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "parent_id" uuid`);
  await db.execute(sql`ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "reply_count" integer NOT NULL DEFAULT 0`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "posts_parent_idx" ON "posts" ("parent_id")`);

  // 2. Backup
  await db.execute(sql`CREATE TABLE IF NOT EXISTS "_comments_backup" AS SELECT * FROM "comments"`);

  // 3. Count comments to migrate
  const [commentCount] = await db.execute(sql`SELECT count(*) as count FROM "comments"`);
  const totalComments = Number((commentCount as any).count);

  // 4. Migrate comments → posts with parentId
  await db.execute(sql`
    INSERT INTO "posts" ("id", "author_id", "parent_id", "caption", "image_count", "created_at")
    SELECT c."id", c."author_id", c."post_id", c."text", 0, c."created_at"
    FROM "comments" c
    ON CONFLICT ("id") DO NOTHING
  `);

  // 5. Recompute reply counts
  await db.execute(sql`
    UPDATE "posts" p
    SET "reply_count" = COALESCE(sub.cnt, 0)
    FROM (
      SELECT "parent_id", count(*)::int AS cnt
      FROM "posts"
      WHERE "parent_id" IS NOT NULL
      GROUP BY "parent_id"
    ) sub
    WHERE p."id" = sub."parent_id"
  `);

  // 6. Drop comments table
  await db.execute(sql`DROP TABLE IF EXISTS "comments"`);

  return {
    success: true,
    alreadyDone: false,
    message: `Migration terminée ! ${totalComments} commentaires convertis en réponses. Table "comments" supprimée (backup dans "_comments_backup").`,
  };
}
