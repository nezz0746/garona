# How Garona Works

Garona is a trust-based social network for the city of Toulouse. Unlike traditional social networks where anyone can immediately participate, Garona uses a **Web of Trust** system where users earn privileges through community vouching.

---

## Core Concept: The Rang System

Every user has a **Rang** (trust level) from 0 to 5, computed dynamically from the vouches they've received. Higher rang unlocks more abilities on the platform.

| Rang | Label | Vouch Weight Needed | Abilities Unlocked |
|------|-------|---------------------|-------------------|
| 0 | Visiteur | — (unauthenticated) | Browse the feed |
| 1 | Membre | 0 (just sign up) | Create profile, follow users, like posts |
| 2 | Contributeur | 3+ | Post content, comment |
| 3 | Résident | 5+ | Direct messages |
| 4 | Notable | 10+ | Create events |
| 5 | Gardien | 20+ | Moderate content, verify other users |

A user's rang is **never stored** — it's always computed on-the-fly from the sum of active (non-revoked) vouch weights they've received. Authenticated users are always at least Rang 1.

---

## Vouching Mechanics

### How Vouching Works

Any user at Rang 1+ can vouch for another user. Each vouch carries a **weight** that depends on the voucher's own rang:

| Voucher's Rang | Vouch Weight |
|----------------|-------------|
| 0 (Visiteur) | Cannot vouch |
| 1 (Membre) | 1 |
| 2 (Contributeur) | 1 |
| 3 (Résident) | 2 |
| 4 (Notable) | 3 |
| 5 (Gardien) | 5 |

### Rules

- A user can only vouch for another user **once** (enforced by a unique constraint on voucher + vouchee).
- You **cannot vouch for yourself**.
- Vouches can be **revoked**, which sets `revoked = true` without deleting the row. Revoked vouches don't count toward the vouchee's rang.
- A revoked vouch can be **re-activated** — the row is updated rather than a new one created.
- A vouchee's rang is recalculated after every vouch or revocation.

### Example

If a user receives:
- 2 vouches from Rang 1 users (2 × weight 1 = 2)
- 1 vouch from a Rang 3 user (1 × weight 2 = 2)

Their total weight = **4**, making them Rang 2 (Contributeur, needs 3+).

---

## User Signup Flow

1. User provides a **name** and **username**.
2. Username is sanitized: lowercased, only `a-z`, `0-9`, `.`, `_`, `-` allowed. Must be 3–30 characters.
3. An internal email is generated (`username@garona.local`) and a random password — users authenticate via passkeys, not passwords.
4. Better-Auth creates the user and a session.
5. The username is set on the user record (Better-Auth doesn't handle this field).
6. User starts at **Rang 1 (Membre)**.

---

## Authentication

Garona uses **Better-Auth** with the following setup:

- **Passkey/WebAuthn** support — the primary authentication method.
- **Email/password** is technically enabled but only used internally (auto-generated passwords).
- Sessions are stored in the database and validated via cookies.
- Trusted origins include the mobile app (`garona://`), local dev servers, and the production domain (`garona.econome.studio`).

### Dev Mode

In non-production environments, you can bypass auth by sending the `X-Dev-User` header with a seeded username. The API will look up the user and set the session accordingly.

---

## Social Features

### Posts
- Users at Rang 2+ can create posts with images and optional captions.
- Posts support **multi-image carousels** — each image has a position for ordering.
- The first image is also stored as `imageUrl` on the post for backward compatibility.

### Likes
- Users at Rang 2+ can like posts. Likes toggle (like/unlike).
- A user can only like a post once (unique constraint on post + user).

### Comments
- Users at Rang 2+ can comment on posts.
- Comments are plain text tied to a post and author.

### Follows
- Users at Rang 1+ can follow other users.
- A user can only follow another user once (unique constraint on follower + following).

### Stories
- Ephemeral content with an `expiresAt` timestamp (typically 24 hours).
- Tied to an author, displayed until expiry.

### Feed
- Authenticated users see a personalized feed: posts from users they follow + their own posts, ordered by recency.
- Unauthenticated users (Rang 0) see a discovery feed.

### Activity
- Users can view activity on their content: who liked, commented on, or followed them.

---

## Data Model Summary

```
users ──────────┬──→ sessions (1:N)
                ├──→ accounts (1:N, OAuth providers)
                ├──→ passkeys (1:N, WebAuthn)
                ├──→ posts ──→ postImages (1:N)
                │         ├──→ likes (N:M via likes table)
                │         └──→ comments (1:N)
                ├──→ stories (1:N)
                ├──→ follows (N:M via follows table)
                └──→ vouches (N:M — voucher → vouchee)
```

---

## API Overview

The API runs on **Hono** (port 3001 by default) with the following route groups:

| Route | Description | Auth Required |
|-------|------------|--------------|
| `/api/auth/**` | Better-Auth endpoints (sign in, sign up, passkey) | No |
| `/api/signup` | Create account with username | No |
| `/api/vouches/me` | Get my rang + vouch counts | Yes |
| `/api/vouches/vouch/:userId` | Vouch for / revoke vouch (POST/DELETE) | Rang 1+ |
| `/api/feed` | Personalized or discovery feed | Optional |
| `/api/feed/:postId` | Single post detail | Optional |
| `/api/posts` | Create post (POST) | Rang 2+ |
| `/api/posts/:postId/like` | Like/unlike (POST) | Rang 2+ |
| `/api/posts/:postId/comment` | Add comment (POST) | Rang 2+ |
| `/api/posts/:postId/comments` | List comments (GET) | No |
| `/api/posts/:postId` | Delete own post (DELETE) | Yes (author) |
| `/api/profiles/:username` | Get user profile | No |
| `/api/profiles/:username/follow` | Follow user (POST) | Rang 1+ |
| `/api/profiles/:username/posts` | Get user's posts | No |
| `/api/profiles` | Search users (GET) | No |
| `/api/activity` | Activity on my content | Yes |
| `/api/me` | Current user profile | Yes |
| `/api/upload` | Upload images (S3) | Yes |

---

## Key Design Decisions

1. **Rang is computed, not stored** — prevents stale data and ensures consistency when vouches are revoked.
2. **Weighted vouching** — higher-trust users have more influence, creating a natural hierarchy.
3. **Progressive access** — new users can browse immediately but must earn trust to post. This prevents spam and abuse.
4. **Soft-delete for vouches** — revoking a vouch sets `revoked = true` rather than deleting the row, preserving the history.
5. **No email-based identity** — users sign up with usernames and authenticate via passkeys. Internal `@garona.local` emails are generated for Better-Auth compatibility.
