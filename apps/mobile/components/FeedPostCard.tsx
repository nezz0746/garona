import { colors } from "@garona/shared";
import { Avatar, IconButton } from "@garona/ui";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Image,
  Pressable,
  Share,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { FeedPost } from "../lib/api";
import { postsApi } from "../lib/api";
import { useAuth } from "../lib/auth";
import { LinkPreviewCard } from "./LinkPreviewCard";
import { RichText } from "./RichText";

const MAX_WIDTH = Math.min(Dimensions.get("window").width, 600);
const IMAGE_WIDTH = MAX_WIDTH - 14 - 40 - 12 - 14; // px-3.5 + avatar + ml-3 + px-3.5

type Props = {
  post: FeedPost;
  onLike: () => void;
  onOpenComments: () => void;
  onOpenLikes: () => void;
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

export function FeedPostCard({ post, onLike, onOpenComments, onOpenLikes }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showHeart, setShowHeart] = useState(false);
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;
  const lastTap = useRef(0);
  const { user } = useAuth();
  const qc = useQueryClient();

  const isOwn = user?.id === post.authorId;

  const deleteMutation = useMutation({
    mutationFn: () => postsApi.delete(post.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["profilePosts"] });
    },
  });

  const handleMenu = () => {
    if (isOwn) {
      Alert.alert(
        "Supprimer la publication",
        "Es-tu sûr de vouloir supprimer cette publication ?",
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Supprimer",
            style: "destructive",
            onPress: () => deleteMutation.mutate(),
          },
        ],
      );
    }
  };

  const handleShare = async () => {
    const url = `https://garona.city/post/${post.id}`;
    const message = post.caption
      ? `${post.caption.slice(0, 100)}${post.caption.length > 100 ? "…" : ""}\n\n${url}`
      : url;
    try {
      await Share.share({ message, url });
    } catch (_) {
      // user cancelled
    }
  };

  const images =
    post.imageUrls && post.imageUrls.length > 0
      ? post.imageUrls
      : post.imageUrl
        ? [post.imageUrl]
        : [];
  const hasImages = images.length > 0;
  const isCarousel = images.length > 1;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / IMAGE_WIDTH);
    setActiveIndex(idx);
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (!post.liked) onLike();
      setShowHeart(true);
      heartScale.setValue(0);
      heartOpacity.setValue(1);
      Animated.sequence([
        Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 12 }),
        Animated.timing(heartOpacity, { toValue: 0, duration: 400, delay: 200, useNativeDriver: true }),
      ]).start(() => setShowHeart(false));
    }
    lastTap.current = now;
  };

  return (
    <View className="border-b border-border" style={{ borderBottomWidth: 0.5 }}>
      <View className="flex-row px-3.5 pt-3 pb-2.5">
        <Pressable onPress={() => router.push(`/user/${post.author.username}`)}>
          <Avatar
            uri={post.author.avatarUrl}
            name={post.author.name}
            size={40}
          />
        </Pressable>
        <View className="flex-1 ml-3">
          {/* Header row */}
          <View className="flex-row items-center justify-between">
            <Pressable
              className="flex-row items-center gap-1 flex-shrink"
              onPress={() => router.push(`/user/${post.author.username}`)}
            >
              <Text className="text-text font-bold text-[15px]" numberOfLines={1}>
                {post.author.name}
              </Text>
              <Text className="text-text-muted text-[14px]" numberOfLines={1}>
                @{post.author.username}
              </Text>
              <Text className="text-text-muted text-[14px]">
                · {timeAgo(post.createdAt)}
              </Text>
            </Pressable>
            <IconButton
              name="ellipsis-horizontal"
              size={18}
              onPress={handleMenu}
              color={isOwn ? colors.text : colors.textMuted}
            />
          </View>

          {/* Body */}
          <Pressable onPress={() => router.push(`/post/${post.id}`)}>
            {post.caption ? (
              <RichText className="text-text text-[15px] leading-[22px] mt-1">
                {post.caption}
              </RichText>
            ) : null}

            {/* Images */}
            {hasImages && (
              <Pressable onPress={handleDoubleTap} style={{ marginTop: 8 }}>
                {isCarousel ? (
                  <View style={{ borderRadius: 12, overflow: "hidden" }}>
                    <FlatList
                      data={images}
                      keyExtractor={(_, i) => `img-${i}`}
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      onScroll={onScroll}
                      scrollEventThrottle={16}
                      snapToInterval={IMAGE_WIDTH}
                      decelerationRate="fast"
                      renderItem={({ item }) => (
                        <Image
                          source={{ uri: item }}
                          style={{ width: IMAGE_WIDTH, height: IMAGE_WIDTH, borderRadius: 12 }}
                          resizeMode="cover"
                        />
                      )}
                    />
                    {/* Dots */}
                    <View className="flex-row justify-center gap-1.5 mt-2">
                      {images.map((url, i) => (
                        <View
                          key={url}
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: i === activeIndex ? colors.primary : colors.border,
                          }}
                        />
                      ))}
                    </View>
                  </View>
                ) : (
                  <Image
                    source={{ uri: images[0] }}
                    style={{ width: IMAGE_WIDTH, height: IMAGE_WIDTH, borderRadius: 12 }}
                    resizeMode="cover"
                  />
                )}
                {/* Double-tap heart overlay */}
                {showHeart && (
                  <Animated.View
                    style={{
                      position: "absolute",
                      top: 0, left: 0, right: 0, bottom: 0,
                      justifyContent: "center",
                      alignItems: "center",
                      opacity: heartOpacity,
                      transform: [{ scale: heartScale }],
                    }}
                    pointerEvents="none"
                  >
                    <Ionicons name="heart" size={60} color="#fff" />
                  </Animated.View>
                )}
              </Pressable>
            )}

            {/* Link previews */}
            {post.linkPreviews && post.linkPreviews.length > 0 && (
              <View style={{ marginTop: 8 }}>
                {post.linkPreviews.map((lp) => (
                  <LinkPreviewCard key={lp.url} preview={lp} />
                ))}
              </View>
            )}
          </Pressable>

          {/* Engagement row */}
          <View className="flex-row items-center mt-2.5 -ml-2">
            <View className="flex-row items-center flex-1">
              <IconButton name="chatbubble-outline" size={18} onPress={() => router.push(`/post/${post.id}`)} />
              <Text className="text-text-muted text-[13px] ml-0.5">
                {post.comments || ""}
              </Text>
            </View>
            <View className="flex-row items-center flex-1">
              <IconButton
                name={post.liked ? "heart" : "heart-outline"}
                size={18}
                color={post.liked ? colors.like : colors.textMuted}
                onPress={onLike}
              />
              <Pressable onPress={onOpenLikes}>
                <Text className="text-text-muted text-[13px] ml-0.5">
                  {post.likes || ""}
                </Text>
              </Pressable>
            </View>
            <View className="flex-row items-center">
              <IconButton name="share-outline" size={18} onPress={handleShare} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
