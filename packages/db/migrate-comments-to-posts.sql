-- ============================================================
-- MIGRATION: Everything is a post (comments → reply posts)
-- Run against production DB:
--   psql $DATABASE_URL -f migrate-comments-to-posts.sql
--
-- Safe & idempotent. Backs up comments before dropping.
-- ============================================================

BEGIN;

-- 1. Add new columns (idempotent)
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "parent_id" uuid;
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "reply_count" integer NOT NULL DEFAULT 0;

-- 2. Index for fast reply lookups
CREATE INDEX IF NOT EXISTS "posts_parent_idx" ON "posts" ("parent_id");

-- 3. Backup comments (safety net)
CREATE TABLE IF NOT EXISTS "_comments_backup" AS SELECT * FROM "comments";

-- 4. Migrate existing comments into posts as replies
-- Uses comment UUID as post UUID so likes/references stay valid
INSERT INTO "posts" ("id", "author_id", "parent_id", "caption", "image_count", "created_at")
SELECT
  c."id",
  c."author_id",
  c."post_id",   -- parent_id = the post being commented on
  c."text",      -- comment text → caption
  0,             -- no images on comments
  c."created_at"
FROM "comments" c
ON CONFLICT ("id") DO NOTHING;  -- idempotent

-- 5. Recompute reply_count on all parent posts
UPDATE "posts" p
SET "reply_count" = COALESCE(sub.cnt, 0)
FROM (
  SELECT "parent_id", count(*)::int AS cnt
  FROM "posts"
  WHERE "parent_id" IS NOT NULL
  GROUP BY "parent_id"
) sub
WHERE p."id" = sub."parent_id";

-- 6. Drop comments table
DROP TABLE IF EXISTS "comments";

COMMIT;

-- Verify
SELECT
  (SELECT count(*) FROM "posts" WHERE "parent_id" IS NOT NULL) AS migrated_replies,
  (SELECT count(*) FROM "posts" WHERE "parent_id" IS NULL) AS top_level_posts,
  (SELECT count(*) FROM "_comments_backup") AS original_comments;
