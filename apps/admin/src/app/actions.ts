"use server";

import { db, users, posts, postImages, vouches, computeRang, vouchWeight, ROOT_USERNAME } from "@garona/db";
import { eq, and, sql, desc } from "drizzle-orm";
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
