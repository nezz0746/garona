import { useState } from "react";
import { View, Text, Image, StyleSheet, Dimensions, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, Post } from "@ig/shared";
import { Avatar } from "./Avatar";
import { IconButton } from "./IconButton";

const SCREEN_WIDTH = Dimensions.get("window").width;
const MAX_IMAGE_WIDTH = Math.min(SCREEN_WIDTH, 600);

export function PostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(post.liked);
  const [saved, setSaved] = useState(post.saved);
  const [likes, setLikes] = useState(post.likes);

  const toggleLike = () => {
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.headerLeft}>
          <Avatar uri={post.user.avatar} size={32} />
          <Text style={styles.username}>{post.user.username}</Text>
        </Pressable>
        <IconButton name="ellipsis-horizontal" size={20} />
      </View>

      {/* Image */}
      <Image
        source={{ uri: post.image }}
        style={[styles.image, { width: MAX_IMAGE_WIDTH, height: MAX_IMAGE_WIDTH }]}
        resizeMode="cover"
      />

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.actionsLeft}>
          <IconButton
            name={liked ? "heart" : "heart-outline"}
            size={26}
            color={liked ? colors.like : colors.text}
            onPress={toggleLike}
          />
          <IconButton name="chatbubble-outline" />
          <IconButton name="paper-plane-outline" />
        </View>
        <IconButton
          name={saved ? "bookmark" : "bookmark-outline"}
          onPress={() => setSaved(!saved)}
        />
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.likesText}>{likes.toLocaleString()} likes</Text>
        <Text style={styles.caption}>
          <Text style={styles.username}>{post.user.username}</Text> {post.caption}
        </Text>
        {post.comments > 0 && (
          <Pressable>
            <Text style={styles.commentsLink}>View all {post.comments} comments</Text>
          </Pressable>
        )}
        <Text style={styles.timeAgo}>{post.timeAgo}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 8 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 10 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  username: { color: colors.text, fontWeight: "600", fontSize: 13 },
  image: { alignSelf: "center" },
  actions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8 },
  actionsLeft: { flexDirection: "row", gap: 4 },
  info: { paddingHorizontal: 14, gap: 4, paddingBottom: 8 },
  likesText: { color: colors.text, fontWeight: "600", fontSize: 13 },
  caption: { color: colors.text, fontSize: 13, lineHeight: 18 },
  commentsLink: { color: colors.primary, fontSize: 13 },
  timeAgo: { color: colors.textMuted, fontSize: 11 },
});
