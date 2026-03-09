# @Mentions & User List Sheets Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add @mention tagging in posts/comments with notifications, and tappable user list bottom sheets for followers/following/likes.

**Architecture:** Inline `@` detection in TextInput with dropdown suggestions using existing search API. Reusable `UsersListSheet` modal component (same pattern as CommentsSheet). Three new API endpoints for followers/following/likes lists. Backend mention parsing + push notifications via existing `notifyUsers()`.

**Tech Stack:** React Native, Expo, Hono.js, Drizzle ORM, TanStack React Query, NativeWind

---

### Task 1: Backend — Followers/Following/Likes list endpoints

**Files:**
- Modify: `apps/api/src/routes/profiles.ts` (add 2 routes)
- Modify: `apps/api/src/routes/posts.ts` (add 1 route)

**Step 1: Add followers endpoint to profiles.ts**

Add before the `// Search users` section (~line 162):

```typescript
// Get followers of a user
app.get("/:username/followers", async (c) => {
  const username = c.req.param("username");

  const [user] = await db.select().from(users).where(eq(users.username, username));
  if (!user) return c.json({ error: "Not found" }, 404);

  const result = await db
    .select({
      id: users.id,
      username: users.username,
      name: users.name,
      avatarUrl: users.avatarUrl,
    })
    .from(follows)
    .innerJoin(users, eq(follows.followerId, users.id))
    .where(eq(follows.followingId, user.id))
    .orderBy(sql`${follows.createdAt} desc`)
    .limit(100);

  return c.json(result);
});

// Get following of a user
app.get("/:username/following", async (c) => {
  const username = c.req.param("username");

  const [user] = await db.select().from(users).where(eq(users.username, username));
  if (!user) return c.json({ error: "Not found" }, 404);

  const result = await db
    .select({
      id: users.id,
      username: users.username,
      name: users.name,
      avatarUrl: users.avatarUrl,
    })
    .from(follows)
    .innerJoin(users, eq(follows.followingId, users.id))
    .where(eq(follows.followerId, user.id))
    .orderBy(sql`${follows.createdAt} desc`)
    .limit(100);

  return c.json(result);
});
```

**Step 2: Add likes list endpoint to posts.ts**

Add before the `// Delete post` section (~line 189):

```typescript
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
```

**Step 3: Commit**

```
feat: add followers/following/likes list API endpoints
```

---

### Task 2: Backend — Mention parsing + notifications

**Files:**
- Modify: `apps/api/src/routes/posts.ts`

**Step 1: Add mention notification helper**

Add at the top of `posts.ts`, after the imports:

```typescript
import { inArray } from "drizzle-orm";
import { notifyUsers } from "../lib/push";

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
```

**Step 2: Call notifyMentions in post creation**

In the `POST /` handler, after the link preview extraction block (after line ~83), add:

```typescript
  // Notify mentioned users (fire-and-forget)
  if (caption) {
    db.select({ name: users.name }).from(users).where(eq(users.id, userId)).then(([author]) => {
      if (author) notifyMentions(caption, userId, author.name, post.id, "publication");
    });
  }
```

**Step 3: Call notifyMentions in comment creation**

In the `POST /:postId/comment` handler, after the existing notify block (after line ~151), add:

```typescript
  // Notify mentioned users in comment (fire-and-forget)
  db.select({ name: users.name }).from(users).where(eq(users.id, userId)).then(([author]) => {
    if (author) notifyMentions(text.trim(), userId, author.name, postId, "commentaire");
  });
```

**Step 4: Commit**

```
feat: parse @mentions and send push notifications to mentioned users
```

---

### Task 3: Mobile — API layer + query keys for new endpoints

**Files:**
- Modify: `apps/mobile/lib/api.ts`
- Modify: `apps/mobile/lib/queryKeys.ts`

**Step 1: Add API methods**

In `api.ts`, add to `postsApi`:

```typescript
  likes: (postId: string) =>
    apiFetch<{ id: string; username: string; name: string; avatarUrl: string | null }[]>(`/api/posts/${postId}/likes`),
```

Add to `profilesApi`:

```typescript
  followers: (username: string) =>
    apiFetch<{ id: string; username: string; name: string; avatarUrl: string | null }[]>(`/api/profiles/${username}/followers`),
  following: (username: string) =>
    apiFetch<{ id: string; username: string; name: string; avatarUrl: string | null }[]>(`/api/profiles/${username}/following`),
```

**Step 2: Add query keys**

In `queryKeys.ts`, add:

```typescript
  followers: (username: string) => ["followers", username] as const,
  following: (username: string) => ["following", username] as const,
  postLikes: (postId: string) => ["postLikes", postId] as const,
```

**Step 3: Commit**

```
feat: add API methods and query keys for followers/following/likes lists
```

---

### Task 4: Mobile — UsersListSheet component

**Files:**
- Create: `apps/mobile/components/UsersListSheet.tsx`

**Step 1: Create the component**

```tsx
import {
  View, Text, Modal, Pressable, FlatList, ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@garona/shared";
import { Avatar } from "@garona/ui";
import { router } from "expo-router";

type User = {
  id: string;
  username: string;
  name: string;
  avatarUrl: string | null;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  users: User[];
  isLoading: boolean;
};

export function UsersListSheet({ visible, onClose, title, users, isLoading }: Props) {
  const handleUserPress = (username: string) => {
    onClose();
    router.push(`/user/${username}`);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-bg">
        {/* Header */}
        <View className="items-center py-3 border-b border-border" style={{ borderBottomWidth: 0.5 }}>
          <View className="w-10 h-1 rounded-sm bg-border mb-2" />
          <Text className="text-base font-bold text-text">{title}</Text>
          <Pressable onPress={onClose} className="absolute right-4 top-4">
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>

        {/* List */}
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : users.length === 0 ? (
          <View className="flex-1 justify-center items-center gap-2">
            <Text className="text-base font-semibold text-text">Aucun utilisateur</Text>
          </View>
        ) : (
          <FlatList
            data={users}
            keyExtractor={(u) => u.id}
            contentContainerClassName="py-2"
            renderItem={({ item }) => (
              <Pressable
                className="flex-row items-center px-4 py-2.5 gap-3"
                onPress={() => handleUserPress(item.username)}
              >
                <Avatar uri={item.avatarUrl} name={item.name} size={44} />
                <View className="flex-1">
                  <Text className="text-text font-semibold text-[14px]">{item.name}</Text>
                  <Text className="text-text-muted text-[13px]">@{item.username}</Text>
                </View>
              </Pressable>
            )}
          />
        )}
      </View>
    </Modal>
  );
}
```

**Step 2: Commit**

```
feat: add UsersListSheet reusable bottom sheet component
```

---

### Task 5: Mobile — Wire up UsersListSheet to profile screens

**Files:**
- Modify: `apps/mobile/app/(tabs)/profile.tsx`
- Modify: `apps/mobile/app/user/[username].tsx`

**Step 1: Add state and queries to profile.tsx**

Add imports:

```typescript
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryKeys";
import { profilesApi } from "../../lib/api";
import { UsersListSheet } from "../../components/UsersListSheet";
```

Add state inside `ProfileScreen`:

```typescript
const [followersVisible, setFollowersVisible] = useState(false);
const [followingVisible, setFollowingVisible] = useState(false);

const { data: followers = [], isLoading: followersLoading } = useQuery({
  queryKey: queryKeys.followers(user?.username || ""),
  queryFn: () => profilesApi.followers(user?.username || ""),
  enabled: followersVisible && !!user?.username,
});

const { data: following = [], isLoading: followingLoading } = useQuery({
  queryKey: queryKeys.following(user?.username || ""),
  queryFn: () => profilesApi.following(user?.username || ""),
  enabled: followingVisible && !!user?.username,
});
```

Make the Abonnés and Abonnements stats tappable. Replace the stats row in `headerComponent`:

```tsx
<View className="flex-1 flex-row justify-around">
  <Stat label="Posts" value={profile?.posts ?? 0} />
  <Pressable onPress={() => setFollowersVisible(true)}>
    <Stat label="Abonnés" value={profile?.followers ?? 0} />
  </Pressable>
  <Pressable onPress={() => setFollowingVisible(true)}>
    <Stat label="Abonnements" value={profile?.following ?? 0} />
  </Pressable>
</View>
```

Add the sheet modals at the end of each return block (before the closing `</View>`), right after `<ProfileShareSheet>`:

```tsx
<UsersListSheet
  visible={followersVisible}
  onClose={() => setFollowersVisible(false)}
  title="Abonnés"
  users={followers}
  isLoading={followersLoading}
/>
<UsersListSheet
  visible={followingVisible}
  onClose={() => setFollowingVisible(false)}
  title="Abonnements"
  users={following}
  isLoading={followingLoading}
/>
```

**Step 2: Do the same for `user/[username].tsx`**

Same pattern — add state, queries, make stats tappable, add sheet modals. Use `username` (from params) instead of `user?.username`.

**Step 3: Commit**

```
feat: wire up followers/following bottom sheets to profile screens
```

---

### Task 6: Mobile — Wire up likes list to FeedPostCard

**Files:**
- Modify: `apps/mobile/components/FeedPostCard.tsx`

**Step 1: Add likes sheet**

The likes count display needs to become tappable and open a `UsersListSheet`. Since `FeedPostCard` is a presentational component, add a new `onOpenLikes` callback prop (same pattern as `onOpenComments`).

Update the Props type:

```typescript
type Props = {
  post: FeedPost;
  onLike: () => void;
  onOpenComments: () => void;
  onOpenLikes: () => void;
};
```

Update the function signature:

```typescript
export function FeedPostCard({ post, onLike, onOpenComments, onOpenLikes }: Props) {
```

In the **image post layout** (Instagram-style), make the likes count tappable (~line 219):

```tsx
<Pressable onPress={onOpenLikes}>
  <Text className="text-text font-semibold text-[13px]">
    {post.likes.toLocaleString()} j'aime
  </Text>
</Pressable>
```

In the **text post layout** (tweet-style), make the likes count tappable (~line 118):

```tsx
<Pressable className="flex-row items-center flex-1" onPress={onOpenLikes}>
  <IconButton
    name={post.liked ? "heart" : "heart-outline"}
    size={18}
    color={post.liked ? colors.like : colors.textMuted}
    onPress={onLike}
  />
  <Text className="text-text-muted text-[13px] ml-0.5">
    {post.likes || ""}
  </Text>
</Pressable>
```

**Step 2: Update all FeedPostCard call sites**

Find all files rendering `<FeedPostCard>` and add the `onOpenLikes` prop. These are likely in feed screens and post detail views. The parent component should manage a `likesPostId` state and render a `UsersListSheet`.

For each parent, add:

```typescript
const [likesPostId, setLikesPostId] = useState<string | null>(null);

const { data: likedUsers = [], isLoading: likesLoading } = useQuery({
  queryKey: queryKeys.postLikes(likesPostId!),
  queryFn: () => postsApi.likes(likesPostId!),
  enabled: !!likesPostId,
});
```

Pass to FeedPostCard:

```tsx
onOpenLikes={() => setLikesPostId(post.id)}
```

And render:

```tsx
<UsersListSheet
  visible={!!likesPostId}
  onClose={() => setLikesPostId(null)}
  title="J'aime"
  users={likedUsers}
  isLoading={likesLoading}
/>
```

**Step 3: Commit**

```
feat: wire up likes list bottom sheet to post cards
```

---

### Task 7: Mobile — MentionTextInput component

**Files:**
- Create: `apps/mobile/components/MentionTextInput.tsx`

**Step 1: Create the component**

```tsx
import { useState, useRef, useCallback } from "react";
import {
  View, Text, TextInput, FlatList, Pressable, type TextInputProps,
  type NativeSyntheticEvent, type TextInputSelectionChangeEventData,
} from "react-native";
import { colors } from "@garona/shared";
import { Avatar } from "@garona/ui";
import { useSearchQuery } from "../hooks/queries/useSearchQuery";

type Props = Omit<TextInputProps, "value" | "onChangeText"> & {
  value: string;
  onChangeText: (text: string) => void;
  inputRef?: React.RefObject<TextInput | null>;
};

export function MentionTextInput({ value, onChangeText, inputRef, ...rest }: Props) {
  const [mentionQuery, setMentionQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const cursorPos = useRef(0);
  const mentionStart = useRef(-1);

  const { data: suggestions = [] } = useSearchQuery(mentionQuery);

  const handleChangeText = useCallback((text: string) => {
    onChangeText(text);

    // Find if cursor is inside a @mention being typed
    const pos = cursorPos.current + (text.length - value.length);
    cursorPos.current = pos;

    const textBefore = text.slice(0, pos);
    const atIndex = textBefore.lastIndexOf("@");

    if (atIndex !== -1) {
      const charBefore = atIndex > 0 ? textBefore[atIndex - 1] : " ";
      const query = textBefore.slice(atIndex + 1);
      const hasSpace = query.includes(" ");

      if ((charBefore === " " || charBefore === "\n" || atIndex === 0) && !hasSpace && query.length >= 1) {
        mentionStart.current = atIndex;
        setMentionQuery(query);
        setShowSuggestions(true);
        return;
      }
    }

    setShowSuggestions(false);
    setMentionQuery("");
  }, [value, onChangeText]);

  const handleSelectionChange = useCallback(
    (e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
      cursorPos.current = e.nativeEvent.selection.end;
    }, []
  );

  const handleSelectUser = useCallback((username: string) => {
    const start = mentionStart.current;
    const before = value.slice(0, start);
    const after = value.slice(cursorPos.current);
    const newText = `${before}@${username} ${after}`;
    onChangeText(newText);
    cursorPos.current = start + username.length + 2; // @username + space
    setShowSuggestions(false);
    setMentionQuery("");
  }, [value, onChangeText]);

  return (
    <View className="flex-1">
      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <View
          className="bg-bg border border-border rounded-xl mb-1 max-h-[180px] overflow-hidden"
          style={{ shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: -2 }, elevation: 4 }}
        >
          <FlatList
            data={suggestions.slice(0, 5)}
            keyExtractor={(u) => u.id}
            keyboardShouldPersistTaps="always"
            renderItem={({ item }) => (
              <Pressable
                className="flex-row items-center px-3 py-2 gap-2.5"
                onPress={() => handleSelectUser(item.username)}
              >
                <Avatar uri={item.avatarUrl} name={item.name} size={32} />
                <View className="flex-1">
                  <Text className="text-text font-semibold text-[13px]">{item.name}</Text>
                  <Text className="text-text-muted text-[12px]">@{item.username}</Text>
                </View>
              </Pressable>
            )}
          />
        </View>
      )}

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChangeText}
        onSelectionChange={handleSelectionChange}
        {...rest}
      />
    </View>
  );
}
```

**Step 2: Commit**

```
feat: add MentionTextInput component with inline @mention suggestions
```

---

### Task 8: Mobile — RichText component for rendering mentions

**Files:**
- Create: `apps/mobile/components/RichText.tsx`

**Step 1: Create the component**

```tsx
import { Text, type TextProps } from "react-native";
import { router } from "expo-router";
import { colors } from "@garona/shared";

type Props = TextProps & {
  children: string;
};

export function RichText({ children: text, ...rest }: Props) {
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mentionRegex.exec(text)) !== null) {
    // Text before the mention
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const username = match[1];
    parts.push(
      <Text
        key={`${match.index}-${username}`}
        style={{ fontWeight: "600", color: colors.accent }}
        onPress={() => router.push(`/user/${username}`)}
      >
        @{username}
      </Text>
    );

    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <Text {...rest}>{parts}</Text>;
}
```

**Step 2: Commit**

```
feat: add RichText component for rendering tappable @mentions
```

---

### Task 9: Mobile — Integrate MentionTextInput into CommentsSheet

**Files:**
- Modify: `apps/mobile/components/CommentsSheet.tsx`

**Step 1: Replace TextInput with MentionTextInput**

Replace the `TextInput` import and usage. Import `MentionTextInput` and `RichText`:

```typescript
import { MentionTextInput } from "./MentionTextInput";
import { RichText } from "./RichText";
```

Replace the comment input `<TextInput>` (~line 92-100) with:

```tsx
<MentionTextInput
  inputRef={inputRef}
  value={text}
  onChangeText={setText}
  placeholder="Ajouter un commentaire..."
  placeholderTextColor={colors.textMuted}
  multiline
  maxLength={300}
  className="flex-1 bg-surface rounded-[20px] px-4 py-2.5 text-sm text-text max-h-[80px]"
/>
```

Replace the comment text display (~line 81) with RichText:

```tsx
<RichText className="text-text text-sm leading-5">
  {`${(item as any).author?.username || "utilisateur"} ${item.text}`}
</RichText>
```

Wait — actually keep the username bold separately and only use RichText for the comment text:

```tsx
<View className="flex-1 gap-0.5">
  <Text className="text-text text-sm leading-5">
    <Text className="font-semibold">
      {(item as any).author?.username || "utilisateur"}
    </Text>{" "}
    <RichText>{item.text}</RichText>
  </Text>
  <Text className="text-text-muted text-[11px]">{timeAgo(item.createdAt)}</Text>
</View>
```

Note: Nested `<RichText>` inside `<Text>` may not work since RichText returns a `<Text>` itself. Instead, render as sibling:

```tsx
<View className="flex-1 gap-0.5">
  <RichText className="text-text text-sm leading-5">
    {`${(item as any).author?.username || "utilisateur"} ${item.text}`}
  </RichText>
  <Text className="text-text-muted text-[11px]">{timeAgo(item.createdAt)}</Text>
</View>
```

But we need the username bold. Adjust `RichText` to not handle the username — or just keep inline. Simplest: wrap the whole string, and the author username won't have `@` prefix so it won't be styled.

**Step 2: Commit**

```
feat: integrate MentionTextInput and RichText into CommentsSheet
```

---

### Task 10: Mobile — Integrate MentionTextInput into create.tsx

**Files:**
- Modify: `apps/mobile/app/(tabs)/create.tsx`

**Step 1: Replace caption TextInputs with MentionTextInput**

Import:

```typescript
import { MentionTextInput } from "../../components/MentionTextInput";
```

Replace the text-post caption input (~line 239-248) and the image-post caption input (~line 314-323) with `MentionTextInput`, keeping same styling and props.

For the text post input:

```tsx
<MentionTextInput
  value={caption}
  onChangeText={setCaption}
  placeholder="Quoi de neuf ?"
  placeholderTextColor={colors.textMuted}
  multiline
  maxLength={500}
  autoFocus
  className="text-text text-[16px] leading-[24px] min-h-[200px]"
  style={{ textAlignVertical: "top" }}
/>
```

For the image post caption:

```tsx
<MentionTextInput
  value={caption}
  onChangeText={setCaption}
  placeholder="Ecris une legende..."
  placeholderTextColor={colors.textMuted}
  multiline
  maxLength={500}
  autoFocus
  className="flex-1 text-text text-[15px] leading-[22px] min-h-[80px]"
  style={{ textAlignVertical: "top" }}
/>
```

**Step 2: Commit**

```
feat: integrate MentionTextInput into post creation screens
```

---

### Task 11: Mobile — Render mentions in FeedPostCard captions

**Files:**
- Modify: `apps/mobile/components/FeedPostCard.tsx`

**Step 1: Use RichText for captions**

Import:

```typescript
import { RichText } from "./RichText";
```

In the text-only post layout, replace the caption Text (~line 87-89):

```tsx
<RichText className="text-text text-[15px] leading-[22px] mt-1">
  {post.caption || ""}
</RichText>
```

In the image post layout, replace the caption display (~line 223-229):

```tsx
{post.caption && (
  <Text className="text-text text-[13px] leading-[18px]">
    <Text className="text-text font-semibold text-[13px]">
      {post.author.username}
    </Text>{" "}
  </Text>
)}
{post.caption && (
  <RichText className="text-text text-[13px] leading-[18px]">
    {post.caption}
  </RichText>
)}
```

Actually, cleaner approach — since RichText is a Text component, we can put the username inside it but we need it bold. Better: keep username separate and have RichText just for caption text:

```tsx
{post.caption && (
  <View className="flex-row flex-wrap">
    <Text className="text-text font-semibold text-[13px]">{post.author.username} </Text>
    <RichText className="text-text text-[13px] leading-[18px]">{post.caption}</RichText>
  </View>
)}
```

**Step 2: Commit**

```
feat: render tappable @mentions in feed post captions
```

---

### Task 12: Mobile — Handle mention notification taps

**Files:**
- Modify: `apps/mobile/hooks/useNotifications.ts`

**Step 1: Add mention handler**

In the response listener (~line 76), add mention type handling:

```typescript
if (data?.type === "like" || data?.type === "comment" || data?.type === "mention") {
  if (data.postId) {
    router.push(`/posts/${data.username}?postId=${data.postId}`);
  }
}
```

This is a one-line change — just add `|| data?.type === "mention"` to the existing condition.

**Step 2: Commit**

```
feat: handle mention notification taps in navigation
```

---

### Task 13: Final integration testing & cleanup

**Step 1: Manual testing checklist**

- [ ] Type `@` in comment input → suggestion dropdown appears
- [ ] Type `@` in post caption (text mode) → dropdown appears
- [ ] Type `@` in post caption (image mode) → dropdown appears
- [ ] Select a user from dropdown → `@username ` inserted
- [ ] Mentions rendered as tappable styled text in feed
- [ ] Mentions rendered as tappable styled text in comments
- [ ] Tapping a mention navigates to user profile
- [ ] Creating post/comment with mention sends push notification to mentioned user
- [ ] Tap "Abonnés" on own profile → followers sheet opens
- [ ] Tap "Abonnements" on own profile → following sheet opens
- [ ] Tap "Abonnés" on other profile → followers sheet opens
- [ ] Tap "Abonnements" on other profile → following sheet opens
- [ ] Tap likes count on image post → likes sheet opens
- [ ] Tap likes count on text post → likes sheet opens
- [ ] Tap user in any sheet → navigates to profile, sheet closes
- [ ] Swipe down on any sheet → closes with gesture

**Step 2: Commit**

```
feat: mentions and user list sheets - integration complete
```
