import { Hono } from "hono";
import { requirePermission } from "../middleware";
import { PERMISSION } from "@garona/db";
import crypto from "crypto";
import sharp from "sharp";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

const MAX_WIDTH = 1200;
const MAX_HEIGHT = 1200;
const JPEG_QUALITY = 80;
const AVATAR_SIZE = 400;

async function processImage(buffer: ArrayBuffer, maxW = MAX_WIDTH, maxH = MAX_HEIGHT, quality = JPEG_QUALITY): Promise<{ data: Buffer; contentType: string }> {
  const data = await sharp(Buffer.from(buffer))
    .rotate() // auto-rotate based on EXIF
    .resize(maxW, maxH, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();
  return { data, contentType: "image/jpeg" };
}

const S3_ENDPOINT = process.env.S3_ENDPOINT || "http://localhost:9000";
const S3_BUCKET = process.env.S3_BUCKET || "garona";
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || "garona";
const S3_SECRET_KEY = process.env.S3_SECRET_KEY || "garona123";
const S3_REGION = process.env.S3_REGION || "auto";

const s3 = new S3Client({
  endpoint: S3_ENDPOINT,
  region: S3_REGION,
  credentials: {
    accessKeyId: S3_ACCESS_KEY,
    secretAccessKey: S3_SECRET_KEY,
  },
  forcePathStyle: true,
});

const app = new Hono();

// Log all requests to upload routes
app.use("*", async (c, next) => {
  console.log(`[upload] ${c.req.method} ${c.req.path} (full URL: ${c.req.url})`);
  return next();
});

// Direct upload endpoint (accepts multipart)
app.post("/", requirePermission(PERMISSION.POST), async (c) => {
  let body: Record<string, string | File>;
  try {
    body = await c.req.parseBody();
  } catch (e: unknown) {
    console.error("[upload] Failed to parse multipart body:", e);
    return c.json({ error: "Invalid multipart body" }, 400);
  }

  const file = body["file"];

  if (!file || !(file instanceof File)) {
    console.error("[upload] No file in body. Keys:", Object.keys(body));
    return c.json({ error: "No file provided" }, 400);
  }

  const userId = c.get("userId");
  const key = `posts/${userId}/${Date.now()}-${crypto.randomBytes(4).toString("hex")}.jpg`;

  console.log(`[upload] Uploading ${file.name} (${file.type}, ${file.size} bytes) to ${S3_BUCKET}/${key}`);

  try {
    const arrayBuffer = await file.arrayBuffer();
    const { data, contentType } = await processImage(arrayBuffer);
    console.log(`[upload] Compressed: ${file.size} → ${data.length} bytes (${Math.round(data.length / 1024)}KB)`);
    await s3.send(new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: data,
      ContentType: contentType,
    }));
  } catch (e: unknown) {
    console.error("[upload] S3 upload error:", e);
    return c.json({ error: "Upload failed" }, 500);
  }

  // Return proxied URL through API (works from phone)
  const baseUrl = process.env.PUBLIC_API_URL || new URL(c.req.url).origin;
  const publicUrl = `${baseUrl}/api/upload/images/${key}`;
  console.log(`[upload] Success: ${publicUrl}`);
  return c.json({ url: publicUrl, key });
});

// Avatar upload (no rang requirement, just auth)
app.post("/avatar", async (c) => {
  console.log("[upload/avatar] POST /avatar hit");
  const userId = c.get("userId");
  console.log("[upload/avatar] userId:", userId);
  if (!userId) {
    console.log("[upload/avatar] No userId — returning 401");
    return c.json({ error: "Unauthorized" }, 401);
  }

  let body: Record<string, string | File>;
  try {
    body = await c.req.parseBody();
  } catch (e: unknown) {
    console.error("[upload] Failed to parse multipart body:", e);
    return c.json({ error: "Invalid multipart body" }, 400);
  }

  const file = body["file"];
  if (!file || !(file instanceof File)) {
    return c.json({ error: "No file provided" }, 400);
  }

  const key = `avatars/${userId}/${Date.now()}-${crypto.randomBytes(4).toString("hex")}.jpg`;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const { data, contentType } = await processImage(arrayBuffer, AVATAR_SIZE, AVATAR_SIZE, 85);
    console.log(`[upload/avatar] Compressed: ${file.size} → ${data.length} bytes (${Math.round(data.length / 1024)}KB)`);
    await s3.send(new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: data,
      ContentType: contentType,
    }));
  } catch (e: unknown) {
    console.error("[upload] S3 avatar upload error:", e);
    return c.json({ error: "Upload failed" }, 500);
  }

  const baseUrl = process.env.PUBLIC_API_URL || new URL(c.req.url).origin;
  const publicUrl = `${baseUrl}/api/upload/images/${key}`;
  return c.json({ url: publicUrl, key });
});

// Proxy S3 images so mobile can access them via API URL
app.get("/images/:key{.+}", async (c) => {
  const key = c.req.param("key");

  try {
    const response = await s3.send(new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    }));

    const contentType = response.ContentType || "image/jpeg";
    const bodyBytes = await response.Body?.transformToByteArray();
    if (!bodyBytes) return c.json({ error: "Not found" }, 404);

    return c.body(bodyBytes, 200, {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000",
    });
  } catch (e: unknown) {
    console.error("[upload] S3 get error:", e);
    return c.json({ error: "Not found" }, 404);
  }
});

export default app;
