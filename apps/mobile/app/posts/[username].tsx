import { useState, useEffect, useRef } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@garona/shared";
import { FeedPostCard } from "../../components/FeedPostCard";
import { CommentsSheet } from "../../components/CommentsSheet";
import { useProfilePostsFeedQuery } from "../../hooks/queries/useProfilePostsFeedQuery";

export default function UserPostsScreen() {
  const { username, startIndex } = useLocalSearchParams<{ username: string; startIndex?: string }>();
  const insets = useSafeAreaInsets();
  const { data: posts = [], isLoading } = useProfilePostsFeedQuery(username);
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const [scrolledOnce, setScrolledOnce] = useState(false);

  // Scroll to tapped post
  useEffect(() => {
    if (!isLoading && posts.length > 0 && startIndex && !scrolledOnce) {
      const idx = parseInt(startIndex, 10);
      if (idx > 0 && idx < posts.length) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({ index: idx, animated: false });
        }, 100);
      }
      setScrolledOnce(true);
    }
  }, [isLoading, posts, startIndex, scrolledOnce]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-bg justify-center items-center" style={{ paddingTop: insets.top }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-4 py-2 border-b border-border" style={{ borderBottomWidth: 0.5 }}>
        <Pressable onPress={() => router.back()} className="p-1">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text className="text-lg font-bold text-text">Publications</Text>
        <View style={{ width: 32 }} />
      </View>

      <FlatList
        ref={flatListRef}
        data={posts}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          <FeedPostCard
            post={item}
            onLike={() => {}}
            onOpenComments={() => setCommentPostId(item.id)}
          />
        )}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
          }, 200);
        }}
        showsVerticalScrollIndicator={false}
      />

      <CommentsSheet
        postId={commentPostId}
        visible={commentPostId !== null}
        onClose={() => setCommentPostId(null)}
      />
    </View>
  );
}
