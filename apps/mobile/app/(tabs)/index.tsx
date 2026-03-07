import { useState } from "react";
import { FlatList, View, Text, RefreshControl, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@garona/shared";
import { useFeedQuery } from "../../hooks/queries/useFeedQuery";
import { useLikeMutation } from "../../hooks/mutations/useLikeMutation";
import { FeedPostCard } from "../../components/FeedPostCard";
import { CommentsSheet } from "../../components/CommentsSheet";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: posts = [], isLoading, error, refetch } = useFeedQuery();
  const likeMutation = useLikeMutation();
  const [commentPostId, setCommentPostId] = useState<string | null>(null);

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="flex-row justify-between items-center px-4 py-2 border-b border-border" style={{ borderBottomWidth: 0.5 }}>
        <Text className="text-2xl font-bold text-primary tracking-tight">Garona</Text>
        <Pressable onPress={() => router.push("/guide")} hitSlop={8}>
          <Ionicons name="book-outline" size={24} color={colors.text} />
        </Pressable>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          <FeedPostCard
            post={item}
            onLike={() => likeMutation.mutate(item.id)}
            onOpenComments={() => setCommentPostId(item.id)}
          />
        )}
        ListEmptyComponent={() =>
          !isLoading ? (
            <View className="p-10 items-center gap-2">
              {error ? (
                <>
                  <Text className="text-base font-semibold text-text">Erreur de chargement</Text>
                  <Text className="text-sm text-text-muted text-center">{error.message}</Text>
                </>
              ) : (
                <>
                  <Text className="text-base font-semibold text-text">Aucune publication pour le moment</Text>
                  <Text className="text-sm text-text-muted text-center">Suis des Toulousains pour voir leurs posts ici</Text>
                </>
              )}
            </View>
          ) : null
        }
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
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
