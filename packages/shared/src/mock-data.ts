import { User, Post, Story, Notification } from "./types";

export const CURRENT_USER: User = {
  id: "u1",
  username: "nezz",
  displayName: "Nezz",
  avatar: "https://i.pravatar.cc/150?u=nezz",
  bio: "Building things ⚡",
  posts: 42,
  followers: 1234,
  following: 567,
};

export const USERS: User[] = [
  CURRENT_USER,
  { id: "u2", username: "alex", displayName: "Alex", avatar: "https://i.pravatar.cc/150?u=alex", bio: "Food tech 🍕", posts: 28, followers: 890, following: 234 },
  { id: "u3", username: "sarah.d", displayName: "Sarah D.", avatar: "https://i.pravatar.cc/150?u=sarah", bio: "Design & coffee ☕", posts: 156, followers: 4500, following: 312 },
  { id: "u4", username: "marco_dev", displayName: "Marco", avatar: "https://i.pravatar.cc/150?u=marco", bio: "Code all day 💻", posts: 89, followers: 2100, following: 445 },
  { id: "u5", username: "luna.art", displayName: "Luna", avatar: "https://i.pravatar.cc/150?u=luna", bio: "Artist 🎨", posts: 234, followers: 8900, following: 123 },
];

export const STORIES: Story[] = USERS.map((u) => ({
  id: `story-${u.id}`,
  user: u,
  seen: Math.random() > 0.5,
}));

export const POSTS: Post[] = [
  { id: "p1", user: USERS[2], image: "https://picsum.photos/seed/p1/600/600", caption: "Morning light in the studio ✨", likes: 342, comments: 23, timeAgo: "2h", liked: false, saved: false },
  { id: "p2", user: USERS[4], image: "https://picsum.photos/seed/p2/600/750", caption: "New piece finished 🎨 What do you think?", likes: 1205, comments: 89, timeAgo: "4h", liked: true, saved: false },
  { id: "p3", user: USERS[1], image: "https://picsum.photos/seed/p3/600/600", caption: "Testing the new menu 🍔", likes: 78, comments: 12, timeAgo: "6h", liked: false, saved: false },
  { id: "p4", user: USERS[3], image: "https://picsum.photos/seed/p4/600/800", caption: "Deployed at 3am. No regrets.", likes: 567, comments: 45, timeAgo: "8h", liked: false, saved: true },
  { id: "p5", user: USERS[0], image: "https://picsum.photos/seed/p5/600/600", caption: "Toulouse sunsets hit different 🌅", likes: 198, comments: 15, timeAgo: "12h", liked: true, saved: false },
];

export const EXPLORE_IMAGES = Array.from({ length: 24 }, (_, i) => ({
  id: `e-${i}`,
  image: `https://picsum.photos/seed/explore${i}/300/300`,
}));

export const NOTIFICATIONS: Notification[] = [
  { id: "n1", user: USERS[2], type: "like", timeAgo: "1h", postImage: "https://picsum.photos/seed/p1/100/100" },
  { id: "n2", user: USERS[4], type: "follow", timeAgo: "2h" },
  { id: "n3", user: USERS[3], type: "comment", timeAgo: "3h", text: "This is amazing! 🔥", postImage: "https://picsum.photos/seed/p5/100/100" },
  { id: "n4", user: USERS[1], type: "like", timeAgo: "5h", postImage: "https://picsum.photos/seed/p5/100/100" },
  { id: "n5", user: USERS[2], type: "follow", timeAgo: "1d" },
];
