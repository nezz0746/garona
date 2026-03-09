import { API_URL } from "./auth";

type FetchOptions = RequestInit & { params?: Record<string, string> };

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { params, ...init } = options;
  let url = `${API_URL}${path}`;
  if (params) {
    const qs = new URLSearchParams(params).toString();
    url += `?${qs}`;
  }

  const devHeaders: Record<string, string> = __DEV__ ? { "X-Dev-User": "garona" } : {};

  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...devHeaders,
      ...init.headers,
    },
    credentials: "include",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || err.message || `${res.status}`);
  }

  return res.json();
}

// ─── Feed ───
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

export const feedApi = {
  discover: (limit = 20, offset = 0) =>
    apiFetch<FeedPost[]>("/api/feed/discover", { params: { limit: String(limit), offset: String(offset) } }),
  following: (limit = 20, offset = 0) =>
    apiFetch<FeedPost[]>("/api/feed/following", { params: { limit: String(limit), offset: String(offset) } }),
};

// ─── Posts ───
export const postsApi = {
  create: (imageUrls: string[], caption?: string) =>
    apiFetch<{ id: string }>("/api/posts", { method: "POST", body: JSON.stringify({ imageUrls, caption }) }),
  like: (postId: string) =>
    apiFetch<{ liked: boolean }>(`/api/posts/${postId}/like`, { method: "POST" }),
  comment: (postId: string, text: string) =>
    apiFetch<{ id: string }>(`/api/posts/${postId}/comment`, { method: "POST", body: JSON.stringify({ text }) }),
  comments: (postId: string) =>
    apiFetch<{ id: string; authorId: string; text: string; createdAt: string }[]>(`/api/posts/${postId}/comments`),
  delete: (postId: string) =>
    apiFetch<{ deleted: boolean }>(`/api/posts/${postId}`, { method: "DELETE" }),
  likes: (postId: string) =>
    apiFetch<{ id: string; username: string; name: string; avatarUrl: string | null }[]>(`/api/posts/${postId}/likes`),
};

// ─── Profiles ───
export type Profile = {
  id: string;
  username: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  rang: number;
  posts: number;
  followers: number;
  following: number;
  isFollowing: boolean;
  hasVouched: boolean;
  isMe: boolean;
};

export type UserPost = {
  id: string;
  imageUrl: string | null;
  caption: string | null;
  createdAt: string;
};

export const profilesApi = {
  get: (username: string) => apiFetch<Profile>(`/api/profiles/${username}`),
  posts: (username: string, limit = 30) =>
    apiFetch<UserPost[]>(`/api/profiles/${username}/posts`, { params: { limit: String(limit) } }),
  postsFeed: (username: string, limit = 50) =>
    apiFetch<FeedPost[]>(`/api/profiles/${username}/posts`, { params: { limit: String(limit), format: "feed" } }),
  follow: (username: string) =>
    apiFetch<{ following: boolean }>(`/api/profiles/${username}/follow`, { method: "POST" }),
  search: (q: string) =>
    apiFetch<{ id: string; username: string; name: string; avatarUrl: string | null; bio: string | null }[]>(
      "/api/profiles",
      { params: { q } }
    ),
  followers: (username: string) =>
    apiFetch<{ id: string; username: string; name: string; avatarUrl: string | null }[]>(`/api/profiles/${username}/followers`),
  following: (username: string) =>
    apiFetch<{ id: string; username: string; name: string; avatarUrl: string | null }[]>(`/api/profiles/${username}/following`),
};

// ─── Activity ───
export type ActivityItem = {
  id: string;
  type: "like" | "comment" | "follow";
  actor: { id: string; username: string; name: string; avatarUrl: string | null };
  text?: string;
  postId?: string;
  postImage?: string;
  createdAt: string;
};

export const activityApi = {
  get: (limit = 30) =>
    apiFetch<ActivityItem[]>("/api/activity", { params: { limit: String(limit) } }),
};

// ─── Signup ───
export type SignupResult = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  rang: number;
};

export const signupApi = {
  create: (name: string, username: string) =>
    apiFetch<SignupResult>("/api/signup", {
      method: "POST",
      body: JSON.stringify({ name, username }),
    }),
};

// ─── Me (session-based) ───
export const meApi = {
  get: () => apiFetch<SignupResult>("/api/me"),
  update: (data: { name?: string; bio?: string; avatarUrl?: string }) =>
    apiFetch<SignupResult>("/api/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

// ─── Upload ───
export const uploadApi = {
  presign: (contentType = "image/jpeg") =>
    apiFetch<{ uploadUrl: string; publicUrl: string; key: string; method: string; headers: Record<string, string> }>(
      "/api/upload/presign",
      { method: "POST", body: JSON.stringify({ contentType }) }
    ),
};

// ─── Push Notifications ───
export const pushApi = {
  register: (token: string, platform: string) =>
    apiFetch<{ registered: boolean }>("/api/push/register", {
      method: "POST",
      body: JSON.stringify({ token, platform }),
    }),
  unregister: (token: string) =>
    apiFetch<{ unregistered: boolean }>("/api/push/unregister", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),
};

// ─── Vouches ───
export type VouchInfo = {
  rang: number;
  vouchesReceived: number;
  vouchesGiven: number;
  totalWeight: number;
};

export const vouchesApi = {
  me: () => apiFetch<VouchInfo>("/api/vouches/me"),
  vouch: (userId: string) =>
    apiFetch<{ success: boolean; newRang: number }>(`/api/vouches/vouch/${userId}`, { method: "POST" }),
  revoke: (userId: string) =>
    apiFetch<{ success: boolean; newRang: number }>(`/api/vouches/vouch/${userId}`, { method: "DELETE" }),
};
