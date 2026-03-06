import { User, Post, Story, Notification } from "./types";

export const CURRENT_USER: User = {
  id: "u1",
  username: "nezz",
  displayName: "Nezz",
  avatar: "https://i.pravatar.cc/150?u=nezz",
  bio: "Dev toulousain 🧱",
  posts: 42,
  followers: 1234,
  following: 567,
};

export const USERS: User[] = [
  CURRENT_USER,
  { id: "u2", username: "alex.cuisine", displayName: "Alex", avatar: "https://i.pravatar.cc/150?u=alex", bio: "Chef au marché Victor Hugo 🍳", posts: 28, followers: 890, following: 234 },
  { id: "u3", username: "sarah.capitole", displayName: "Sarah", avatar: "https://i.pravatar.cc/150?u=sarah", bio: "Archi & patrimoine 🏛", posts: 156, followers: 4500, following: 312 },
  { id: "u4", username: "marco.stade", displayName: "Marco", avatar: "https://i.pravatar.cc/150?u=marco", bio: "Rugby & bière artisanale 🏉", posts: 89, followers: 2100, following: 445 },
  { id: "u5", username: "luna.minimes", displayName: "Luna", avatar: "https://i.pravatar.cc/150?u=luna", bio: "Illustratrice 🎨 St-Cyprien", posts: 234, followers: 8900, following: 123 },
  { id: "u6", username: "youssef.mirail", displayName: "Youssef", avatar: "https://i.pravatar.cc/150?u=youssef", bio: "Photo de rue 📸", posts: 312, followers: 3200, following: 198 },
];

export const STORIES: Story[] = USERS.map((u) => ({
  id: `story-${u.id}`,
  user: u,
  seen: Math.random() > 0.5,
}));

export const POSTS: Post[] = [
  { id: "p1", user: USERS[2], image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Toulouse_Capitole_Night_Wikimedia_Commons.jpg/1280px-Toulouse_Capitole_Night_Wikimedia_Commons.jpg", caption: "Le Capitole ce soir, toujours aussi beau 🌙", likes: 342, comments: 23, timeAgo: "2h", liked: false, saved: false },
  { id: "p2", user: USERS[1], image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/March%C3%A9_Victor_Hugo_Toulouse.jpg/1280px-March%C3%A9_Victor_Hugo_Toulouse.jpg", caption: "Samedi matin au marché Victor Hugo 🧀", likes: 205, comments: 31, timeAgo: "4h", liked: true, saved: false },
  { id: "p3", user: USERS[4], image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Pont_Neuf_Toulouse.jpg/1280px-Pont_Neuf_Toulouse.jpg", caption: "Pont Neuf au coucher du soleil, ça ne vieillit jamais", likes: 1205, comments: 89, timeAgo: "6h", liked: false, saved: false },
  { id: "p4", user: USERS[3], image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Stade_toulousain_2012-2013.JPG/1280px-Stade_toulousain_2012-2013.JPG", caption: "Allez le Stade 🔴⚫ Jour de match à Ernest-Wallon", likes: 567, comments: 45, timeAgo: "8h", liked: false, saved: true },
  { id: "p5", user: USERS[5], image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Toulouse_-_Basilique_Saint-Sernin_-_20110611_%282%29.jpg/800px-Toulouse_-_Basilique_Saint-Sernin_-_20110611_%282%29.jpg", caption: "Saint-Sernin sous la pluie 🌧 toujours magnifique", likes: 198, comments: 15, timeAgo: "12h", liked: true, saved: false },
  { id: "p6", user: USERS[0], image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Canal_du_Midi_near_Toulouse.jpg/1280px-Canal_du_Midi_near_Toulouse.jpg", caption: "Canal du Midi, pause déjeuner 🚲", likes: 78, comments: 8, timeAgo: "1j", liked: false, saved: false },
];

export const EXPLORE_IMAGES = Array.from({ length: 24 }, (_, i) => ({
  id: `e-${i}`,
  image: `https://picsum.photos/seed/toulouse${i}/300/300`,
}));

export const NOTIFICATIONS: Notification[] = [
  { id: "n1", user: USERS[2], type: "like", timeAgo: "1h", postImage: "https://picsum.photos/seed/toulouse0/100/100" },
  { id: "n2", user: USERS[4], type: "follow", timeAgo: "2h" },
  { id: "n3", user: USERS[3], type: "comment", timeAgo: "3h", text: "Allez le Stade ! 🏉", postImage: "https://picsum.photos/seed/toulouse1/100/100" },
  { id: "n4", user: USERS[1], type: "like", timeAgo: "5h", postImage: "https://picsum.photos/seed/toulouse2/100/100" },
  { id: "n5", user: USERS[5], type: "follow", timeAgo: "1j" },
];
