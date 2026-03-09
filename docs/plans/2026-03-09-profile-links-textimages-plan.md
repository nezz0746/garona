# Profile Edit, Link Embeds, Text+Image Posts — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add edit profile (avatar/name/bio), link preview embeds in text posts, and image attachment support in text post creation mode.

**Architecture:** Three independent features. Feature 1 (edit profile) is pure mobile + existing BetterAuth update endpoint. Feature 2 (link embeds) requires new DB tables, a new API route for scraping, enrichment changes, and a mobile component. Feature 3 (text+image) is a mobile-only UI change to the create screen.

**Tech Stack:** Expo (React Native), Hono (API), Drizzle ORM (Postgres), S3/MinIO (uploads), BetterAuth (user updates), expo-image-picker, expo-web-browser.

---

## Task 1: Edit Profile — API Route for Profile Update

The BetterAuth `update-user` endpoint handles `name` and `image` (mapped to `avatar_url`), but it doesn't know about `bio` as an updatable field via the standard endpoint. We need a dedicated profile update route.

**Files:**
- Create: `apps/api/src/routes/me.ts` (modify existing)

**Step 1: Read the existing me route**

Current file at `apps/api/src/routes/me.ts` returns the current user. We need to add a PATCH endpoint.

**Step 2: Add PATCH /api/me endpoint**

In `apps/api/src/routes/me.ts`, add a PATCH handler that updates name, bio, and avatarUrl:

```typescript
// Add to existing imports
import { db, users } from "@garona/db";
import { eq } from "drizzle-orm";

// Add PATCH handler after existing GET
app.patch("/", async (c) => {
  const userId = c.get("userId");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const body = await c.req.json();
  const updates: Record<string, string> = {};

  if (typeof body.name === "string" && body.name.trim()) {
    updates.name = body.name.trim();
  }
  if (typeof body.bio === "string") {
    updates.bio = body.bio.trim() || null;
  }
  if (typeof body.avatarUrl === "string") {
    updates.avatarUrl = body.avatarUrl;
  }

  if (Object.keys(updates).length === 0) {
    return c.json({ error: "No fields to update" }, 400);
  }

  const [updated] = await db
    .update(users)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();

  return c.json({
    id: updated.id,
    name: updated.name,
    username: updated.username,
    avatarUrl: updated.avatarUrl,
    bio: updated.bio,
    rang: 0, // will be recalculated by caller if needed
  });
});
```

**Step 3: Commit**

```bash
git add apps/api/src/routes/me.ts
git commit -m "feat: add PATCH /api/me endpoint for profile updates"
```

---

## Task 2: Edit Profile — Mobile API Layer & Mutation Hook

**Files:**
- Modify: `apps/mobile/lib/api.ts` (add `meApi.update`)
- Create: `apps/mobile/hooks/mutations/useUpdateProfileMutation.ts`

**Step 1: Add update method to meApi**

In `apps/mobile/lib/api.ts`, update the `meApi` object (around line 140):

```typescript
export const meApi = {
  get: () => apiFetch<SignupResult>("/api/me"),
  update: (data: { name?: string; bio?: string; avatarUrl?: string }) =>
    apiFetch<SignupResult>("/api/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};
```

**Step 2: Create mutation hook**

Create `apps/mobile/hooks/mutations/useUpdateProfileMutation.ts`:

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryKeys";
import { meApi } from "../../lib/api";

export function useUpdateProfileMutation(username: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: { name?: string; bio?: string; avatarUrl?: string }) =>
      meApi.update(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.profile(username) });
      qc.invalidateQueries({ queryKey: queryKeys.me() });
    },
  });
}
```

**Step 3: Commit**

```bash
git add apps/mobile/lib/api.ts apps/mobile/hooks/mutations/useUpdateProfileMutation.ts
git commit -m "feat: add profile update API method and mutation hook"
```

---

## Task 3: Edit Profile — Edit Profile Screen

**Files:**
- Create: `apps/mobile/app/edit-profile.tsx`
- Modify: `apps/mobile/app/_layout.tsx` (register modal route)
- Modify: `apps/mobile/app/(tabs)/profile.tsx` (wire up button)

**Step 1: Create edit-profile screen**

Create `apps/mobile/app/edit-profile.tsx`:

```typescript
import { useState } from "react";
import {
  View, Text, TextInput, Pressable, ActivityIndicator, Alert, ScrollView, Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { colors } from "@garona/shared";
import { Avatar } from "@garona/ui";
import { useAuth, API_URL } from "../lib/auth";
import { useUpdateProfileMutation } from "../hooks/mutations/useUpdateProfileMutation";
import { useProfileQuery } from "../hooks/queries/useProfileQuery";

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data: profile } = useProfileQuery(user?.username || "");
  const updateMutation = useUpdateProfileMutation(user?.username || "");

  const [name, setName] = useState(profile?.name || user?.name || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [avatarUri, setAvatarUri] = useState<string | null>(null); // local uri for preview
  const [uploading, setUploading] = useState(false);

  const currentAvatar = avatarUri || profile?.avatarUrl || user?.avatarUrl || null;

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri: string): Promise<string> => {
    const filename = uri.split("/").pop() || "avatar.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1].toLowerCase()}` : "image/jpeg";

    const formData = new FormData();
    formData.append("file", { uri, name: filename, type } as any);

    const res = await fetch(`${API_URL}/api/upload`, {
      method: "POST",
      body: formData,
      headers: {
        ...((__DEV__ && user?.username) ? { "X-Dev-User": user.username } : {}),
      },
    });
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return data.url;
  };

  const handleSave = async () => {
    setUploading(true);
    try {
      let avatarUrl: string | undefined;
      if (avatarUri) {
        avatarUrl = await uploadAvatar(avatarUri);
      }
      await updateMutation.mutateAsync({
        name: name.trim() || undefined,
        bio: bio.trim(),
        avatarUrl,
      });
      router.back();
    } catch (e: any) {
      Alert.alert("Erreur", e.message || "Impossible de sauvegarder");
    } finally {
      setUploading(false);
    }
  };

  const hasChanges = name !== (profile?.name || user?.name || "")
    || bio !== (profile?.bio || "")
    || avatarUri !== null;

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 py-2 border-b border-border" style={{ borderBottomWidth: 0.5 }}>
        <Pressable onPress={() => router.back()}>
          <Text className="text-text text-base">Annuler</Text>
        </Pressable>
        <Text className="text-lg font-bold text-text">Modifier le profil</Text>
        <Pressable
          onPress={handleSave}
          disabled={uploading || !hasChanges}
          style={{ opacity: uploading || !hasChanges ? 0.4 : 1 }}
        >
          {uploading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text className="text-primary font-bold text-base">OK</Text>
          )}
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="items-center py-6 px-4 gap-6">
        {/* Avatar */}
        <Pressable onPress={pickAvatar} className="items-center">
          <View className="relative">
            <Avatar uri={currentAvatar} name={name} size={96} />
            <View className="absolute bottom-0 right-0 bg-primary w-8 h-8 rounded-full justify-center items-center border-2 border-bg">
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </View>
          <Text className="text-primary text-sm font-semibold mt-2">Changer la photo</Text>
        </Pressable>

        {/* Name */}
        <View className="w-full">
          <Text className="text-text-muted text-xs mb-1">Nom</Text>
          <TextInput
            className="text-text text-base border-b border-border pb-2"
            value={name}
            onChangeText={setName}
            placeholder="Ton nom"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {/* Bio */}
        <View className="w-full">
          <Text className="text-text-muted text-xs mb-1">Bio</Text>
          <TextInput
            className="text-text text-base border-b border-border pb-2"
            value={bio}
            onChangeText={setBio}
            placeholder="Décris-toi en quelques mots"
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={150}
          />
        </View>
      </ScrollView>
    </View>
  );
}
```

**Step 2: Register the modal route in _layout.tsx**

In `apps/mobile/app/_layout.tsx`, add a Stack.Screen entry for edit-profile inside the `<Stack>` (around line 253):

```tsx
<Stack.Screen
  name="edit-profile"
  options={{ presentation: "modal" }}
/>
```

**Step 3: Wire up the button in profile.tsx**

In `apps/mobile/app/(tabs)/profile.tsx`, update the "Modifier le profil" Pressable (around line 97) to add `onPress`:

```tsx
<Pressable
  className="flex-1 bg-surface rounded-lg py-[7px] items-center border border-border"
  onPress={() => router.push("/edit-profile")}
>
```

**Step 4: Update auth context with new profile data**

In `apps/mobile/app/_layout.tsx`, the `user` state needs to be updatable when profile is edited. Add a `setUser` method to AuthContext:

In `apps/mobile/lib/auth.ts`, add `updateUser` to `AuthContextType`:

```typescript
export type AuthContextType = {
  user: AuthUser;
  isLoading: boolean;
  signIn: () => void;
  signOut: () => void;
  updateUser: (updates: Partial<NonNullable<AuthUser>>) => void;
};
```

In `apps/mobile/app/_layout.tsx`, in the AuthContext.Provider value, add:

```typescript
updateUser: (updates) => {
  setUser((prev) => prev ? { ...prev, ...updates } : prev);
},
```

Then in `edit-profile.tsx`, after successful mutation, call `updateUser` to sync auth state.

**Step 5: Commit**

```bash
git add apps/mobile/app/edit-profile.tsx apps/mobile/app/_layout.tsx apps/mobile/app/\(tabs\)/profile.tsx apps/mobile/lib/auth.ts
git commit -m "feat: add edit profile screen with avatar, name, bio editing"
```

---

## Task 4: Link Embeds — Database Schema

**Files:**
- Modify: `packages/db/src/schema.ts`

**Step 1: Add link_previews and post_link_previews tables**

Append to `packages/db/src/schema.ts`:

```typescript
// ─── Link Previews ───
export const linkPreviews = pgTable(
  "link_previews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    url: text("url").notNull(),
    title: text("title"),
    description: text("description"),
    imageUrl: text("image_url"),
    domain: text("domain"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("link_previews_url_idx").on(t.url)],
);

// ─── Post Link Previews (join table) ───
export const postLinkPreviews = pgTable(
  "post_link_previews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    linkPreviewId: uuid("link_preview_id")
      .notNull()
      .references(() => linkPreviews.id, { onDelete: "cascade" }),
    position: integer("position").default(0).notNull(),
  },
  (t) => [index("post_link_previews_post_idx").on(t.postId)],
);
```

**Step 2: Generate migration**

```bash
cd packages/db && pnpm generate
```

**Step 3: Run migration**

```bash
cd packages/db && pnpm migrate
```

**Step 4: Commit**

```bash
git add packages/db/src/schema.ts packages/db/drizzle/
git commit -m "feat: add link_previews and post_link_previews tables"
```

---

## Task 5: Link Embeds — Metadata Scraping Route

**Files:**
- Create: `apps/api/src/routes/links.ts`
- Modify: `apps/api/src/index.ts` (mount route)

**Step 1: Create the links route**

Create `apps/api/src/routes/links.ts`:

```typescript
import { Hono } from "hono";
import { db, linkPreviews } from "@garona/db";
import { eq } from "drizzle-orm";

const app = new Hono();

// Extract OG metadata from a URL
async function scrapeMetadata(url: string) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Garona/1.0 (link-preview)" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;

    const html = await res.text();
    const get = (property: string): string | null => {
      // Try og: tags first, then regular meta
      const ogMatch = html.match(
        new RegExp(`<meta[^>]*property=["']og:${property}["'][^>]*content=["']([^"']*)["']`, "i")
      ) || html.match(
        new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:${property}["']`, "i")
      );
      if (ogMatch) return ogMatch[1];

      // Fallback to name= meta tags
      const nameMatch = html.match(
        new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']*)["']`, "i")
      ) || html.match(
        new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${property}["']`, "i")
      );
      return nameMatch ? nameMatch[1] : null;
    };

    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = get("title") || (titleMatch ? titleMatch[1].trim() : null);
    const description = get("description");
    const imageUrl = get("image");
    const domain = new URL(url).hostname.replace(/^www\./, "");

    return { title, description, imageUrl, domain };
  } catch {
    return null;
  }
}

// Fetch or return cached metadata for a URL
app.post("/metadata", async (c) => {
  const userId = c.get("userId");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const { url } = await c.req.json();
  if (!url || typeof url !== "string") return c.json({ error: "URL required" }, 400);

  // Check cache
  const [existing] = await db
    .select()
    .from(linkPreviews)
    .where(eq(linkPreviews.url, url));

  if (existing) {
    return c.json({
      url: existing.url,
      title: existing.title,
      description: existing.description,
      imageUrl: existing.imageUrl,
      domain: existing.domain,
    });
  }

  // Scrape
  const meta = await scrapeMetadata(url);
  if (!meta) return c.json({ error: "Could not fetch metadata" }, 422);

  // Cache
  const [preview] = await db
    .insert(linkPreviews)
    .values({ url, ...meta })
    .onConflictDoNothing()
    .returning();

  // If onConflictDoNothing returned nothing, fetch the existing one
  const result = preview || (await db.select().from(linkPreviews).where(eq(linkPreviews.url, url)))[0];

  return c.json({
    url: result.url,
    title: result.title,
    description: result.description,
    imageUrl: result.imageUrl,
    domain: result.domain,
  });
});

export default app;
```

**Step 2: Mount the route in index.ts**

In `apps/api/src/index.ts`, add:

```typescript
import linkRoutes from "./routes/links";
```

And mount it after the other routes:

```typescript
app.route("/api/links", linkRoutes);
```

**Step 3: Commit**

```bash
git add apps/api/src/routes/links.ts apps/api/src/index.ts
git commit -m "feat: add link metadata scraping endpoint with caching"
```

---

## Task 6: Link Embeds — Wire into Post Creation

**Files:**
- Modify: `apps/api/src/routes/posts.ts`

**Step 1: Extract URLs from caption and create link preview associations at post creation time**

In `apps/api/src/routes/posts.ts`, update the POST handler to detect URLs in caption, look up or scrape metadata, and link previews to the post.

Add imports:

```typescript
import { db, posts, postImages, likes, comments, users, linkPreviews, postLinkPreviews } from "@garona/db";
```

After the post is created (after `returning()`), add:

```typescript
// Extract URLs from caption and link previews
if (caption) {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
  const urls = [...new Set(caption.match(urlRegex) || [])];

  for (let i = 0; i < urls.length && i < 3; i++) {
    const url = urls[i];
    // Find or create link preview
    let [preview] = await db.select().from(linkPreviews).where(eq(linkPreviews.url, url));

    if (!preview) {
      // Scrape in background — don't block post creation
      try {
        const res = await fetch(url, {
          headers: { "User-Agent": "Garona/1.0 (link-preview)" },
          signal: AbortSignal.timeout(5000),
        });
        if (res.ok) {
          const html = await res.text();
          const getOg = (prop: string) => {
            const m = html.match(new RegExp(`<meta[^>]*property=["']og:${prop}["'][^>]*content=["']([^"']*)["']`, "i"))
              || html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:${prop}["']`, "i"));
            return m ? m[1] : null;
          };
          const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
          const title = getOg("title") || (titleMatch ? titleMatch[1].trim() : null);
          const description = getOg("description")
            || (html.match(new RegExp(`<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']`, "i")) || [])[1]
            || null;
          const imageUrl = getOg("image");
          const domain = new URL(url).hostname.replace(/^www\./, "");

          [preview] = await db
            .insert(linkPreviews)
            .values({ url, title, description, imageUrl, domain })
            .onConflictDoNothing()
            .returning();

          if (!preview) {
            [preview] = await db.select().from(linkPreviews).where(eq(linkPreviews.url, url));
          }
        }
      } catch {
        // Skip this URL if scraping fails
        continue;
      }
    }

    if (preview) {
      await db.insert(postLinkPreviews).values({
        postId: post.id,
        linkPreviewId: preview.id,
        position: i,
      });
    }
  }
}
```

Note: This duplicates scraping logic from the links route. To DRY it up, extract `scrapeMetadata` into a shared utility file at `apps/api/src/lib/scrape.ts` and import from both routes. Do this as part of this task.

**Step 2: Create shared scrape utility**

Create `apps/api/src/lib/scrape.ts`:

```typescript
export async function scrapeMetadata(url: string) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Garona/1.0 (link-preview)" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;

    const html = await res.text();
    const get = (property: string): string | null => {
      const ogMatch = html.match(
        new RegExp(`<meta[^>]*property=["']og:${property}["'][^>]*content=["']([^"']*)["']`, "i")
      ) || html.match(
        new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:${property}["']`, "i")
      );
      if (ogMatch) return ogMatch[1];

      const nameMatch = html.match(
        new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']*)["']`, "i")
      ) || html.match(
        new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${property}["']`, "i")
      );
      return nameMatch ? nameMatch[1] : null;
    };

    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = get("title") || (titleMatch ? titleMatch[1].trim() : null);
    const description = get("description");
    const imageUrl = get("image");
    const domain = new URL(url).hostname.replace(/^www\./, "");

    return { title, description, imageUrl, domain };
  } catch {
    return null;
  }
}
```

Update `apps/api/src/routes/links.ts` and `apps/api/src/routes/posts.ts` to import from this shared utility.

**Step 3: Commit**

```bash
git add apps/api/src/lib/scrape.ts apps/api/src/routes/posts.ts apps/api/src/routes/links.ts
git commit -m "feat: scrape link previews at post creation, DRY scrape utility"
```

---

## Task 7: Link Embeds — Feed Enrichment

**Files:**
- Modify: `apps/api/src/routes/feed.ts` (enrichPosts function)

**Step 1: Add link preview data to enrichPosts**

In `apps/api/src/routes/feed.ts`, update imports:

```typescript
import { db, posts, postImages, users, likes, comments, follows, postLinkPreviews, linkPreviews } from "@garona/db";
```

In the `enrichPosts` function (around line 87), after fetching multi-image data, add:

```typescript
// Link previews
const allLinkPreviews = await db
  .select({
    postId: postLinkPreviews.postId,
    url: linkPreviews.url,
    title: linkPreviews.title,
    description: linkPreviews.description,
    imageUrl: linkPreviews.imageUrl,
    domain: linkPreviews.domain,
    position: postLinkPreviews.position,
  })
  .from(postLinkPreviews)
  .innerJoin(linkPreviews, eq(postLinkPreviews.linkPreviewId, linkPreviews.id))
  .where(inArray(postLinkPreviews.postId, postIds))
  .orderBy(postLinkPreviews.position);

const linkPreviewMap: Record<string, typeof allLinkPreviews> = {};
for (const lp of allLinkPreviews) {
  if (!linkPreviewMap[lp.postId]) linkPreviewMap[lp.postId] = [];
  linkPreviewMap[lp.postId].push(lp);
}
```

Then in the return mapping, add `linkPreviews`:

```typescript
linkPreviews: (linkPreviewMap[p.posts.id] || []).map((lp) => ({
  url: lp.url,
  title: lp.title,
  description: lp.description,
  imageUrl: lp.imageUrl,
  domain: lp.domain,
})),
```

**Step 2: Commit**

```bash
git add apps/api/src/routes/feed.ts
git commit -m "feat: include link previews in feed enrichment"
```

---

## Task 8: Link Embeds — Mobile Types & LinkPreviewCard

**Files:**
- Modify: `apps/mobile/lib/api.ts` (update FeedPost type)
- Create: `apps/mobile/components/LinkPreviewCard.tsx`
- Modify: `apps/mobile/components/FeedPostCard.tsx` (render previews)

**Step 1: Update FeedPost type**

In `apps/mobile/lib/api.ts`, add to the `FeedPost` type (around line 34):

```typescript
export type LinkPreview = {
  url: string;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  domain: string | null;
};

export type FeedPost = {
  id: string;
  caption: string | null;
  imageUrl: string | null;
  imageUrls?: string[];
  imageCount?: number;
  createdAt: string;
  author: { id: string; username: string; name: string; avatarUrl: string | null };
  likes: number;
  comments: number;
  liked: boolean;
  linkPreviews?: LinkPreview[];
};
```

**Step 2: Create LinkPreviewCard component**

Create `apps/mobile/components/LinkPreviewCard.tsx`:

```typescript
import { View, Text, Image, Pressable } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { colors } from "@garona/shared";
import type { LinkPreview } from "../lib/api";

type Props = {
  preview: LinkPreview;
};

export function LinkPreviewCard({ preview }: Props) {
  const handlePress = () => {
    WebBrowser.openBrowserAsync(preview.url);
  };

  return (
    <Pressable
      onPress={handlePress}
      className="border border-border rounded-xl overflow-hidden mt-2.5"
    >
      {preview.imageUrl && (
        <Image
          source={{ uri: preview.imageUrl }}
          className="w-full h-[160px]"
          resizeMode="cover"
        />
      )}
      <View className="px-3 py-2.5">
        {preview.domain && (
          <Text className="text-text-muted text-[11px] uppercase mb-0.5">
            {preview.domain}
          </Text>
        )}
        {preview.title && (
          <Text className="text-text font-semibold text-[14px] leading-[19px]" numberOfLines={2}>
            {preview.title}
          </Text>
        )}
        {preview.description && (
          <Text className="text-text-muted text-[13px] leading-[17px] mt-0.5" numberOfLines={2}>
            {preview.description}
          </Text>
        )}
      </View>
    </Pressable>
  );
}
```

**Step 3: Install expo-web-browser**

```bash
cd apps/mobile && npx expo install expo-web-browser
```

**Step 4: Render link previews in FeedPostCard**

In `apps/mobile/components/FeedPostCard.tsx`:

Add import:

```typescript
import { LinkPreviewCard } from "./LinkPreviewCard";
```

In the text-only post layout (the `!hasImages` branch, around line 86-88), after the caption `<Text>` and before the engagement row, add:

```tsx
{/* Link previews */}
{post.linkPreviews && post.linkPreviews.length > 0 && (
  <View>
    {post.linkPreviews.map((lp) => (
      <LinkPreviewCard key={lp.url} preview={lp} />
    ))}
  </View>
)}
```

Also add link previews in the image post layout — after the caption text in the bottom section (around line 218), add the same block:

```tsx
{post.linkPreviews && post.linkPreviews.length > 0 && (
  <View className="px-3.5">
    {post.linkPreviews.map((lp) => (
      <LinkPreviewCard key={lp.url} preview={lp} />
    ))}
  </View>
)}
```

**Step 5: Commit**

```bash
git add apps/mobile/lib/api.ts apps/mobile/components/LinkPreviewCard.tsx apps/mobile/components/FeedPostCard.tsx apps/mobile/package.json
git commit -m "feat: display link preview cards in feed posts"
```

---

## Task 9: Text Posts with Image Attachments — Update Create Screen

**Files:**
- Modify: `apps/mobile/app/(tabs)/create.tsx`

**Step 1: Add image attachment state to text mode**

In `apps/mobile/app/(tabs)/create.tsx`, the text mode section starts at line 194. We need to:

1. Add an `attachedImages` state (reuse the existing `selected` state — it's already there and the `handlePost` already uploads from `selected`).
2. Add an image picker button below the text input.
3. Show attached image thumbnails.

Update the text mode section (lines 194-228). The key changes:

Add a function to pick images for text mode (can reuse `ImagePicker.launchImageLibraryAsync`):

```typescript
const pickTextImages = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: true,
    selectionLimit: 4,
    quality: 0.8,
  });
  if (!result.canceled) {
    setSelected((prev) => {
      const newUris = result.assets.map((a) => a.uri);
      const combined = [...prev, ...newUris];
      return combined.slice(0, 4); // max 4
    });
  }
};
```

Replace the text mode return (lines 194-228) with:

```tsx
if (mode === "text") {
  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="flex-row justify-between items-center px-4 py-2 border-b border-border" style={{ borderBottomWidth: 0.5 }}>
        <Pressable onPress={resetToChooser}>
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </Pressable>
        <Text className="text-lg font-bold text-text">Nouveau message</Text>
        <Pressable
          onPress={handlePost}
          disabled={uploading || !caption.trim()}
          style={{ opacity: uploading || !caption.trim() ? 0.4 : 1 }}
        >
          {uploading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text className="text-primary font-bold text-base">Partager</Text>
          )}
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="p-4 flex-1">
        <TextInput
          className="text-text text-[16px] leading-[24px] min-h-[200px]"
          style={{ textAlignVertical: "top" }}
          placeholder="Quoi de neuf ?"
          placeholderTextColor={colors.textMuted}
          value={caption}
          onChangeText={setCaption}
          multiline
          maxLength={500}
          autoFocus
        />

        {/* Attached image thumbnails */}
        {selected.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
            {selected.map((uri, i) => (
              <View key={uri} className="mr-2 relative">
                <Image source={{ uri }} className="w-20 h-20 rounded-lg" />
                <Pressable
                  className="absolute -top-1.5 -right-1.5 bg-black/70 w-5 h-5 rounded-full justify-center items-center"
                  onPress={() => setSelected((prev) => prev.filter((_, j) => j !== i))}
                >
                  <Ionicons name="close" size={12} color="#fff" />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        )}
      </ScrollView>

      {/* Bottom toolbar */}
      <View className="flex-row items-center px-4 py-2.5 border-t border-border" style={{ borderTopWidth: 0.5 }}>
        <Pressable
          onPress={pickTextImages}
          disabled={selected.length >= 4}
          style={{ opacity: selected.length >= 4 ? 0.4 : 1 }}
        >
          <Ionicons name="image-outline" size={24} color={colors.primary} />
        </Pressable>
        <View className="flex-1" />
        <Text className="text-text-muted text-xs">{caption.length}/500</Text>
      </View>
    </View>
  );
}
```

**Step 2: Commit**

```bash
git add apps/mobile/app/\(tabs\)/create.tsx
git commit -m "feat: add image attachment support to text post mode"
```

---

## Task 10: Final Verification

**Step 1: Start the API and mobile app**

```bash
cd apps/api && pnpm dev
cd apps/mobile && npx expo start
```

**Step 2: Test each feature**

1. **Edit profile:** Go to profile tab → tap "Modifier le profil" → change avatar, name, bio → save → verify changes persist.
2. **Link embeds:** Create a text post with a URL (e.g., `https://github.com`) → verify preview card appears in feed.
3. **Text + images:** Create a text post → tap image button → attach photos → post → verify it appears correctly in feed.

**Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: polish profile edit, link embeds, and text+image posts"
```
