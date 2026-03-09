import { useState, useEffect, useRef } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator, ScrollView } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@garona/shared";
import { FeedPostCard } from "../../components/FeedPostCard";
import { CommentsSheet } from "../../components/CommentsSheet";
import { useProfilePostsFeedQuery } from "../../hooks/queries/useProfilePostsFeedQuery";
import { useLikeMutation } from "../../hooks/mutations/useLikeMutation";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryKeys";
import { postsApi } from "../../lib/api";
import { UsersListSheet } from "../../components/UsersListSheet";

export default function UserPostsScreen() {
  const { username, startIndex, postId, type } = useLocalSearchParams<{
    username: string;
    startIndex?: string;
    postId?: string;
    type?: string;
  }>();
  const insets = useSafeAreaInsets();
  const { data: allPosts = [], isLoading } = useProfilePostsFeedQuery(username);
  const likeMutation = useLikeMutation();
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [likesPostId, setLikesPostId] = useState<string | null>(null);

  const { data: likedUsers = [], isLoading: likesLoading } = useQuery({
    queryKey: queryKeys.postLikes(likesPostId!),
    queryFn: () => postsApi.likes(likesPostId!),
    enabled: !!likesPostId,
  });

  const flatListRef = useRef<FlatList>(null);
  const [scrolledOnce, setScrolledOnce] = useState(false);

  // Filter posts based on type param
  const posts = type === "photos"
    ? allPosts.filter((p) => p.imageUrl || (p.imageUrls && p.imageUrls.length > 0))
    : allPosts;

  // Single post thread view
  const singlePost = postId ? allPosts.find((p) => p.id === postId) : null;

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

  // ── Single post thread view ──
  if (postId) {
    if (!singlePost) {
      return (
        <View className="flex-1 bg-bg justify-center items-center" style={{ paddingTop: insets.top }}>
          <Text className="text-text-muted text-base">Publication introuvable</Text>
          <Pressable onPress={() => router.back()}>
            <Text className="text-primary text-[15px] mt-3">Retour</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center justify-between px-4 py-2 border-b border-border" style={{ borderBottomWidth: 0.5 }}>
          <Pressable onPress={() => router.back()} className="p-1">
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text className="text-lg font-bold text-text">Post</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView className="flex-1">
          <FeedPostCard
            post={singlePost}
            onLike={() => likeMutation.mutate(singlePost.id)}
            onOpenComments={() => setCommentPostId(singlePost.id)}
            onOpenLikes={() => setLikesPostId(singlePost.id)}
          />
        </ScrollView>

        <CommentsSheet
          postId={commentPostId}
          visible={commentPostId !== null}
          onClose={() => setCommentPostId(null)}
        />
        <UsersListSheet
          visible={!!likesPostId}
          onClose={() => setLikesPostId(null)}
          title="J'aime"
          users={likedUsers}
          isLoading={likesLoading}
        />
      </View>
    );
  }

  // ── Feed list view ──
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
            onLike={() => likeMutation.mutate(item.id)}
            onOpenComments={() => setCommentPostId(item.id)}
            onOpenLikes={() => setLikesPostId(item.id)}
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
      <UsersListSheet
        visible={!!likesPostId}
        onClose={() => setLikesPostId(null)}
        title="J'aime"
        users={likedUsers}
        isLoading={likesLoading}
      />
    </View>
  );
}
