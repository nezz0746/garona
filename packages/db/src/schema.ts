import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// ─── Users ───
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").unique(),
  name: text("name").notNull(),
  username: text("username").unique(),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  emailVerified: boolean("email_verified").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── BetterAuth sessions ───
export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").unique().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── BetterAuth accounts (social logins) ───
export const accounts = pgTable("accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── BetterAuth passkeys (WebAuthn credentials) ───
export const passkeys = pgTable("passkeys", {
  id: text("id").$defaultFn(() => crypto.randomUUID()).primaryKey(),
  name: text("name"),
  publicKey: text("public_key").notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  credentialID: text("credential_id").notNull(),
  counter: integer("counter").notNull(),
  deviceType: text("device_type").notNull(),
  backedUp: boolean("backed_up").notNull(),
  transports: text("transports"),
  aaguid: text("aaguid"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── BetterAuth verifications ───
export const verifications = pgTable("verifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Vouches (Web of Trust) ───
export const vouches = pgTable(
  "vouches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    voucherId: uuid("voucher_id")
      .notNull()
      .references(() => users.id),
    voucheeId: uuid("vouchee_id")
      .notNull()
      .references(() => users.id),
    weight: integer("weight").default(1).notNull(), // higher rang voucher = more weight
    revoked: boolean("revoked").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("vouches_unique_idx").on(t.voucherId, t.voucheeId),
    index("vouches_vouchee_idx").on(t.voucheeId),
  ],
);

// ─── Posts ───
// Everything is a post: top-level posts, replies, threads.
// parentId links replies to their parent post.
export const posts = pgTable(
  "posts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id"), // self-ref: null = top-level, set = reply
    imageUrl: text("image_url"), // first/cover image, null for text-only posts
    caption: text("caption"),
    imageCount: integer("image_count").default(1).notNull(),
    replyCount: integer("reply_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("posts_author_idx").on(t.authorId),
    index("posts_created_idx").on(t.createdAt),
    index("posts_parent_idx").on(t.parentId),
  ],
);

// ─── Post Images (multi-image carousel) ───
export const postImages = pgTable(
  "post_images",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    imageUrl: text("image_url").notNull(),
    position: integer("position").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("post_images_post_idx").on(t.postId)],
);

// ─── Likes ───
export const likes = pgTable(
  "likes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("likes_unique_idx").on(t.postId, t.userId)],
);

// ─── Follows ───
export const follows = pgTable(
  "follows",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    followerId: uuid("follower_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    followingId: uuid("following_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("follows_unique_idx").on(t.followerId, t.followingId),
    index("follows_following_idx").on(t.followingId),
  ],
);

// ─── Stories ───
export const stories = pgTable(
  "stories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    imageUrl: text("image_url").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("stories_author_idx").on(t.authorId),
    index("stories_expires_idx").on(t.expiresAt),
  ],
);

// ─── Push Tokens ───
export const pushTokens = pgTable(
  "push_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    platform: text("platform").notNull(), // "ios" | "android"
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("push_tokens_token_idx").on(t.token),
    index("push_tokens_user_idx").on(t.userId),
  ],
);

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
