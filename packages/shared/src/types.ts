export type User = {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  posts: number;
  followers: number;
  following: number;
};

export type Post = {
  id: string;
  user: User;
  image: string;
  caption: string;
  likes: number;
  comments: number;
  timeAgo: string;
  liked: boolean;
  saved: boolean;
};

export type Story = {
  id: string;
  user: User;
  seen: boolean;
};

export type Notification = {
  id: string;
  user: User;
  type: "like" | "follow" | "comment";
  timeAgo: string;
  text?: string;
  postImage?: string;
};
