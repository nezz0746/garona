import { Hono } from "hono";
import { requirePermission } from "../middleware";
import { PERMISSION } from "@garona/db";
import crypto from "crypto";

const app = new Hono();

// Generate presigned upload URL (requires POST permission)
app.post("/presign", requirePermission(PERMISSION.POST), async (c) => {
  const userId = c.get("userId");
  const { contentType = "image/jpeg" } = await c.req.json().catch(() => ({}));

  const ext = contentType === "image/png" ? "png" : "jpg";
  const key = `posts/${userId}/${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`;

  const S3_ENDPOINT = process.env.S3_ENDPOINT || "http://localhost:9000";
  const S3_BUCKET = process.env.S3_BUCKET || "garona";
  const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || "garona";
  const S3_SECRET_KEY = process.env.S3_SECRET_KEY || "garona123";

  // For MinIO local dev: direct upload URL
  // In production: use AWS SDK presigned URL
  const uploadUrl = `${S3_ENDPOINT}/${S3_BUCKET}/${key}`;
  const publicUrl = `${S3_ENDPOINT}/${S3_BUCKET}/${key}`;

  return c.json({
    uploadUrl,
    publicUrl,
    key,
    method: "PUT",
    headers: {
      "Content-Type": contentType,
    },
  });
});

// Direct upload endpoint for dev (accepts multipart)
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
  const ext = file.type === "image/png" ? "png" : "jpg";
  const key = `posts/${userId}/${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`;

  const S3_ENDPOINT = process.env.S3_ENDPOINT || "http://localhost:9000";
  const S3_BUCKET = process.env.S3_BUCKET || "garona";
  const uploadUrl = `${S3_ENDPOINT}/${S3_BUCKET}/${key}`;

  console.log(`[upload] Uploading ${file.name} (${file.type}, ${file.size} bytes) to ${uploadUrl}`);

  // Upload to MinIO/S3
  let uploadRes;
  try {
    const arrayBuffer = await file.arrayBuffer();
    uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      body: arrayBuffer,
      headers: {
        "Content-Type": file.type,
      },
    });
  } catch (e: unknown) {
    console.error("[upload] S3 fetch error:", e);
    return c.json({ error: "Failed to reach storage" }, 502);
  }

  if (!uploadRes.ok) {
    const errBody = await uploadRes.text().catch(() => "");
    console.error(`[upload] S3 responded ${uploadRes.status}: ${errBody}`);
    return c.json({ error: "Upload failed", status: uploadRes.status }, 500);
  }

  // Return proxied URL through API (works from phone)
  const baseUrl = process.env.PUBLIC_API_URL || new URL(c.req.url).origin;
  const publicUrl = `${baseUrl}/api/upload/images/${key}`;
  console.log(`[upload] Success: ${publicUrl}`);
  return c.json({ url: publicUrl, key });
});

// Proxy S3 images so mobile can access them via API URL
app.get("/images/:key{.+}", async (c) => {
  const key = c.req.param("key");
  const S3_ENDPOINT = process.env.S3_ENDPOINT || "http://localhost:9000";
  const S3_BUCKET = process.env.S3_BUCKET || "garona";

  const res = await fetch(`${S3_ENDPOINT}/${S3_BUCKET}/${key}`);
  if (!res.ok) return c.json({ error: "Not found" }, 404);

  const contentType = res.headers.get("content-type") || "image/jpeg";
  const body = await res.arrayBuffer();
  return c.body(body, 200, {
    "Content-Type": contentType,
    "Cache-Control": "public, max-age=31536000",
  });
});

export default app;
