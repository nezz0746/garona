import { useState, useRef } from "react";
import { View, Text, Image, StyleSheet, Dimensions, Pressable, FlatList, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { router } from "expo-router";
import { colors } from "@garona/shared";
import { Avatar, IconButton } from "@garona/ui";
import { FeedPost, postsApi } from "../lib/api";

const MAX_WIDTH = Math.min(Dimensions.get("window").width, 600);

type Props = {
  post: FeedPost;
  onLike: () => void;
  onOpenComments: () => void;
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "maintenant";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}j`;
}

export function FeedPostCard({ post, onLike, onOpenComments }: Props) {
  const [liked, setLiked] = useState(post.liked);
  const [likes, setLikes] = useState(post.likes);
  const [activeIndex, setActiveIndex] = useState(0);

  const images = post.imageUrls && post.imageUrls.length > 0 ? post.imageUrls : [post.imageUrl];
  const isCarousel = images.length > 1;

  const handleLike = async () => {
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikes(wasLiked ? likes - 1 : likes + 1);
    try {
      const res = await postsApi.like(post.id);
      setLiked(res.liked);
    } catch {
      setLiked(wasLiked);
      setLikes(wasLiked ? likes : likes - 1);
    }
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / MAX_WIDTH);
    setActiveIndex(idx);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.headerLeft} onPress={() => router.push(`/user/${post.author.username}`)}>
          <Avatar uri={post.author.avatarUrl} name={post.author.name} size={32} />
          <Text style={styles.username}>{post.author.username}</Text>
        </Pressable>
        <IconButton name="ellipsis-horizontal" size={20} />
      </View>

      {/* Image(s) */}
      {isCarousel ? (
        <View>
          <FlatList
            data={images}
            keyExtractor={(_, i) => `img-${i}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={{ width: MAX_WIDTH, height: MAX_WIDTH }} resizeMode="cover" />
            )}
          />
          {/* Dots */}
          <View style={styles.dots}>
            {images.map((_, i) => (
              <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
            ))}
          </View>
          {/* Counter */}
          <View style={styles.counter}>
            <Text style={styles.counterText}>{activeIndex + 1}/{images.length}</Text>
          </View>
        </View>
      ) : (
        <Image
          source={{ uri: images[0] }}
          style={{ width: MAX_WIDTH, height: MAX_WIDTH, alignSelf: "center" }}
          resizeMode="cover"
        />
      )}

      <View style={styles.actions}>
        <View style={styles.actionsLeft}>
          <IconButton
            name={liked ? "heart" : "heart-outline"}
            size={26}
            color={liked ? "#e91e63" : colors.text}
            onPress={handleLike}
          />
          <IconButton name="chatbubble-outline" onPress={onOpenComments} />
          <IconButton name="paper-plane-outline" />
        </View>
        {isCarousel && (
          <View style={styles.dotsSmall}>
            {images.map((_, i) => (
              <View key={i} style={[styles.dotSm, i === activeIndex && styles.dotSmActive]} />
            ))}
          </View>
        )}
        <IconButton name="bookmark-outline" />
      </View>

      <View style={styles.info}>
        <Text style={styles.likes}>{likes.toLocaleString()} j'aime</Text>
        {post.caption && (
          <Text style={styles.caption}>
            <Text style={styles.username}>{post.author.username}</Text> {post.caption}
          </Text>
        )}
        {post.comments > 0 && (
          <Pressable onPress={onOpenComments}>
            <Text style={styles.commentsLink}>
              Voir les {post.comments} commentaire{post.comments > 1 ? "s" : ""}
            </Text>
          </Pressable>
        )}
        <Text style={styles.time}>{timeAgo(post.createdAt)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 8 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 10 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  username: { color: colors.text, fontWeight: "600", fontSize: 13 },
  actions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8 },
  actionsLeft: { flexDirection: "row", gap: 4 },
  info: { paddingHorizontal: 14, gap: 4, paddingBottom: 8 },
  likes: { color: colors.text, fontWeight: "600", fontSize: 13 },
  caption: { color: colors.text, fontSize: 13, lineHeight: 18 },
  commentsLink: { color: colors.primary, fontSize: 13 },
  time: { color: colors.textMuted, fontSize: 11 },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.5)" },
  dotActive: { backgroundColor: "#fff" },
  counter: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  counterText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  dotsSmall: { flexDirection: "row", gap: 4, position: "absolute", left: 0, right: 0, justifyContent: "center" },
  dotSm: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.border },
  dotSmActive: { backgroundColor: colors.primary },
});
