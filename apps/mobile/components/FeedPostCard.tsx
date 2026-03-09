import { colors } from "@garona/shared";
import { Avatar, IconButton } from "@garona/ui";
import { router } from "expo-router";
import { useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  Text,
  View,
} from "react-native";
import type { FeedPost } from "../lib/api";
import { LinkPreviewCard } from "./LinkPreviewCard";

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
  const [activeIndex, setActiveIndex] = useState(0);

  const images =
    post.imageUrls && post.imageUrls.length > 0
      ? post.imageUrls
      : post.imageUrl
        ? [post.imageUrl]
        : [];
  const hasImages = images.length > 0;
  const isCarousel = images.length > 1;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / MAX_WIDTH);
    setActiveIndex(idx);
  };

  if (!hasImages) {
    // Tweet-style layout for text-only posts
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
              <IconButton name="ellipsis-horizontal" size={18} />
            </View>

            {/* Body */}
            <Text className="text-text text-[15px] leading-[22px] mt-1">
              {post.caption}
            </Text>

            {/* Link previews */}
            {post.linkPreviews && post.linkPreviews.length > 0 && (
              <View>
                {post.linkPreviews.map((lp) => (
                  <LinkPreviewCard key={lp.url} preview={lp} />
                ))}
              </View>
            )}

            {/* Engagement row */}
            <View className="flex-row items-center mt-2.5 -ml-2">
              <View className="flex-row items-center flex-1">
                <IconButton name="chatbubble-outline" size={18} onPress={onOpenComments} />
                <Text className="text-text-muted text-[13px] ml-0.5">
                  {post.comments || ""}
                </Text>
              </View>
              <View className="flex-row items-center flex-1">
                <IconButton name="repeat-outline" size={18} />
              </View>
              <View className="flex-row items-center flex-1">
                <IconButton
                  name={post.liked ? "heart" : "heart-outline"}
                  size={18}
                  color={post.liked ? colors.like : colors.textMuted}
                  onPress={onLike}
                />
                <Text className="text-text-muted text-[13px] ml-0.5">
                  {post.likes || ""}
                </Text>
              </View>
              <View className="flex-row items-center">
                <IconButton name="share-outline" size={18} />
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Instagram-style layout for image posts
  return (
    <View className="mb-2">
      <View className="flex-row items-center justify-between px-3 py-2.5">
        <Pressable
          className="flex-row items-center gap-2.5"
          onPress={() => router.push(`/user/${post.author.username}`)}
        >
          <Avatar
            uri={post.author.avatarUrl}
            name={post.author.name}
            size={32}
          />
          <Text className="text-text font-semibold text-[13px]">
            {post.author.username}
          </Text>
        </Pressable>
        <IconButton name="ellipsis-horizontal" size={20} />
      </View>

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
              <Image
                source={{ uri: item }}
                style={{ width: MAX_WIDTH, height: MAX_WIDTH }}
                resizeMode="cover"
              />
            )}
          />
          {/* Dots */}
          <View className="flex-row justify-center gap-1.5 absolute bottom-3 left-0 right-0">
            {images.map((imageUrl, i) => (
              <View
                key={imageUrl}
                className={`w-1.5 h-1.5 rounded-full bg-white/50 ${i === activeIndex ? "bg-white" : ""}`}
              />
            ))}
          </View>
          {/* Counter */}
          <View className="absolute top-3 right-3 bg-black/60 px-2.5 py-1 rounded-xl">
            <Text className="text-white text-xs font-semibold">
              {activeIndex + 1}/{images.length}
            </Text>
          </View>
        </View>
      ) : (
        <Image
          source={{ uri: images[0] }}
          style={{ width: MAX_WIDTH, height: MAX_WIDTH, alignSelf: "center" }}
          resizeMode="cover"
        />
      )}

      <View className="flex-row justify-between items-center px-3 py-2">
        <View className="flex-row gap-1">
          <IconButton
            name={post.liked ? "heart" : "heart-outline"}
            size={26}
            color={post.liked ? colors.like : colors.text}
            onPress={onLike}
          />
          <IconButton name="chatbubble-outline" onPress={onOpenComments} />
          <IconButton name="paper-plane-outline" />
        </View>
        {isCarousel && (
          <View className="flex-row gap-1 absolute left-0 right-0 justify-center">
            {images.map((imageUrl, i) => (
              <View
                key={imageUrl}
                className={`w-[5px] h-[5px] rounded-full bg-border ${i === activeIndex ? "bg-primary" : ""}`}
              />
            ))}
          </View>
        )}
        <IconButton name="bookmark-outline" />
      </View>

      <View className="px-3.5 gap-1 pb-2">
        <Text className="text-text font-semibold text-[13px]">
          {post.likes.toLocaleString()} j'aime
        </Text>
        {post.caption && (
          <Text className="text-text text-[13px] leading-[18px]">
            <Text className="text-text font-semibold text-[13px]">
              {post.author.username}
            </Text>{" "}
            {post.caption}
          </Text>
        )}
        {post.linkPreviews && post.linkPreviews.length > 0 && (
          <View>
            {post.linkPreviews.map((lp) => (
              <LinkPreviewCard key={lp.url} preview={lp} />
            ))}
          </View>
        )}
        {post.comments > 0 && (
          <Pressable onPress={onOpenComments}>
            <Text className="text-accent text-[13px]">
              Voir les {post.comments} commentaire{post.comments > 1 ? "s" : ""}
            </Text>
          </Pressable>
        )}
        <Text className="text-text-muted text-[11px]">
          {timeAgo(post.createdAt)}
        </Text>
      </View>
    </View>
  );
}
