# Design: Edit Profile, Link Embeds, Text Posts with Images

Date: 2026-03-09

## Feature 1: Edit Profile Screen

Full-screen modal at `app/edit-profile.tsx`, accessible from "Modifier le profil" button.

**Fields:** avatar (tappable, opens `expo-image-picker`), name (`TextInput`), bio (`TextInput` multiline).

**Avatar upload:** Selected image uploaded to S3 via existing `/api/upload` endpoint with path `avatars/{userId}/{timestamp}.{ext}`.

**Save:** Calls BetterAuth's `/api/auth/update-user` with `{ name, bio, image }`. On success: invalidate profile query cache, update auth context, navigate back.

**Backend:** No new endpoints. BetterAuth already supports user updates. Upload route already exists — just uses a different S3 path prefix.

## Feature 2: Link Embeds in Text Posts

When a post caption contains URLs, display rich preview cards (image, title, description, domain).

### Backend

- **New route:** `POST /api/links/metadata` — accepts `{ url }`, fetches page, extracts OG/meta tags, returns `{ title, description, imageUrl, domain }`.
- **New DB table:** `link_previews` — `id, url (unique), title, description, imageUrl, domain, createdAt`. Serves as a cache to avoid re-scraping.
- **New join table:** `post_link_previews` — `postId, linkPreviewId, position`.
- **At post creation:** Server detects URLs in caption, looks up or scrapes metadata, links previews to the post.
- **Feed enrichment:** `FeedPost` type gains `linkPreviews?: { url, title, description, imageUrl, domain }[]`.

### Mobile

- **New component:** `LinkPreviewCard` — preview image, title, description, domain. Tappable → opens URL via `expo-web-browser`.
- **Rendered in:** `FeedPostCard`, below caption text, one card per URL.
- **URL detection:** Regex for `https?://` patterns.

## Feature 3: Text Posts with Image Attachments

Add optional image attachment to text post creation mode. Keep existing mode chooser (image / text) as-is.

### Creation flow

- Text mode gains an image button in a bottom toolbar (camera/gallery icon).
- Tapping opens `expo-image-picker`. Selected images appear as horizontal thumbnail strip below text input (removable with X). Max 4 images.
- On submit: uploads images via `/api/upload`, then calls `postsApi.create(imageUrls, caption)`.

### Display

No changes needed. Existing `FeedPostCard` already handles posts with both images and captions correctly. A text post with attached images renders as an image post with caption.

### Backend

No changes needed. `POST /api/posts` already accepts `{ imageUrls: string[], caption?: string }` where either can be empty/populated.
