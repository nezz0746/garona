-- Migration: Everything is a post (comments → reply posts)
-- Safe to run on production. Non-destructive until final DROP.

-- 1. Add new columns to posts
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "parent_id" uuid;
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "reply_count" integer NOT NULL DEFAULT 0;

-- 2. Index for fast reply lookups
CREATE INDEX IF NOT EXISTS "posts_parent_idx" ON "posts" ("parent_id");

-- 3. Migrate existing comments into posts as replies
INSERT INTO "posts" ("id", "author_id", "parent_id", "caption", "image_count", "created_at")
SELECT
  c."id",
  c."author_id",
  c."post_id",   -- parent_id = the post being commented on
  c."text",      -- comment text → caption
  0,             -- no images
  c."created_at"
FROM "comments" c;

-- 4. Update reply_count on parent posts
UPDATE "posts" p
SET "reply_count" = sub.cnt
FROM (
  SELECT "parent_id", count(*)::int AS cnt
  FROM "posts"
  WHERE "parent_id" IS NOT NULL
  GROUP BY "parent_id"
) sub
WHERE p."id" = sub."parent_id";

-- 5. Drop comments table
DROP TABLE IF EXISTS "comments";
