export const queryKeys = {
  feed: (limit?: number, offset?: number) => ["feed", { limit, offset }] as const,
  profile: (username: string) => ["profile", username] as const,
  profilePosts: (username: string) => ["profilePosts", username] as const,
  profilePostsFeed: (username: string) => ["profilePostsFeed", username] as const,
  comments: (postId: string) => ["comments", postId] as const,
  activity: () => ["activity"] as const,
  search: (query: string) => ["search", query] as const,
  me: () => ["me"] as const,
  vouchesMe: () => ["vouchesMe"] as const,
};
