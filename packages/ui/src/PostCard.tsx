import { useState } from "react";
import { View, Text, Image, Dimensions, Pressable } from "react-native";
import { colors, Post } from "@garona/shared";
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
    <View className="mb-2">
      {/* Header */}
      <View className="flex-row items-center justify-between px-3 py-2.5">
        <Pressable className="flex-row items-center gap-2.5">
          <Avatar uri={post.user.avatar} size={32} />
          <Text className="text-text font-semibold text-[13px]">{post.user.username}</Text>
        </Pressable>
        <IconButton name="ellipsis-horizontal" size={20} />
      </View>

      {/* Image */}
      <Image
        source={{ uri: post.image }}
        style={{ width: MAX_IMAGE_WIDTH, height: MAX_IMAGE_WIDTH, alignSelf: "center" }}
        resizeMode="cover"
      />

      {/* Actions */}
      <View className="flex-row justify-between items-center px-3 py-2">
        <View className="flex-row gap-1">
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
      <View className="px-3.5 gap-1 pb-2">
        <Text className="text-text font-semibold text-[13px]">{likes.toLocaleString()} likes</Text>
        <Text className="text-text text-[13px] leading-[18px]">
          <Text className="text-text font-semibold text-[13px]">{post.user.username}</Text> {post.caption}
        </Text>
        {post.comments > 0 && (
          <Pressable>
            <Text className="text-primary text-[13px]">View all {post.comments} comments</Text>
          </Pressable>
        )}
        <Text className="text-text-muted text-[11px]">{post.timeAgo}</Text>
      </View>
    </View>
  );
}
