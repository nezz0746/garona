# Design: @Mentions & User List Bottom Sheets

**Date:** 2026-03-09

## 1. @Mention Tagging (Posts & Comments)

### Components

- **`MentionTextInput`** — Wrapper around `TextInput` that detects `@` typing, shows suggestion dropdown, handles user selection. Used in `CommentsSheet` (comment input) and `create.tsx` (caption inputs).

- **Suggestion dropdown** — Absolutely-positioned `FlatList` above input. Shows avatar + username + name. Calls `profilesApi.search(query)` with ~300ms debounce.

- **`RichText`** — Parses `@username` patterns in displayed text (captions, comments) and renders them as bold/tappable `<Text>` navigating to `/user/{username}`.

### Interaction Flow

1. User types `@` → dropdown appears
2. User types more characters → results filter in real-time
3. User taps suggestion → `@username ` inserted at cursor, dropdown closes
4. Backspace deletes mention characters normally

### Backend

- In `POST /api/posts` and `POST /api/posts/:postId/comment`: parse `@username` patterns from text, look up matching users, call `notifyUsers()` (excluding author).
- Notification: `"{name} t'a mentionné dans une publication"` / `"...un commentaire"`, type `"mention"`, data `{ postId }`.
- No DB schema changes — mentions parsed from text at write time.

## 2. User List Bottom Sheets

### Component

- **`UsersListSheet`** — Reusable `<Modal presentationStyle="pageSheet">`. Props: `visible`, `onClose`, `title`, `users`, `isLoading`. FlatList of user rows (avatar, name, @username). Tap row → navigate to profile, close sheet.

### Usage

| Trigger | Title | Endpoint |
|---------|-------|----------|
| Tap "Abonnés" count | "Abonnés" | `GET /api/profiles/:username/followers` |
| Tap "Abonnements" count | "Abonnements" | `GET /api/profiles/:username/following` |
| Tap likes count (any post) | "J'aime" | `GET /api/posts/:postId/likes` |

### New API Endpoints

```
GET /api/profiles/:username/followers → [{ id, username, name, avatarUrl }]
GET /api/profiles/:username/following → [{ id, username, name, avatarUrl }]
GET /api/posts/:postId/likes         → [{ id, username, name, avatarUrl }]
```

### Mobile API Additions

```ts
profilesApi.followers(username)
profilesApi.following(username)
postsApi.likes(postId)
```

## 3. Notification Handling

- New notification type `"mention"` in push data
- `useNotifications.ts`: mention tap → navigate to post detail (same as like/comment)
- Users without push tokens gracefully skipped via existing `notifyUsers()`
