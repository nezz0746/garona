import { useState, useCallback } from "react";
import { FlatList, View, Text, StyleSheet, RefreshControl, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@garona/shared";
import { useFeed } from "../../hooks/useFeed";
import { FeedPostCard } from "../../components/FeedPostCard";
import { CommentsSheet } from "../../components/CommentsSheet";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { posts, loading, error, refresh, toggleLike } = useFeed();
  const [commentPostId, setCommentPostId] = useState<string | null>(null);

  const handleCommentAdded = useCallback(() => {
    // Refresh feed to update comment counts
    refresh();
  }, [refresh]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.logo}>Garona</Text>
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
            onLike={() => toggleLike(item.id)}
            onOpenComments={() => setCommentPostId(item.id)}
          />
        )}
        ListEmptyComponent={() =>
          !loading ? (
            <View style={styles.empty}>
              {error ? (
                <>
                  <Text style={styles.emptyText}>Erreur de chargement</Text>
                  <Text style={styles.emptyHint}>{error}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.emptyText}>Aucune publication pour le moment</Text>
                  <Text style={styles.emptyHint}>Suis des Toulousains pour voir leurs posts ici</Text>
                </>
              )}
            </View>
          ) : null
        }
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      />

      <CommentsSheet
        postId={commentPostId}
        visible={commentPostId !== null}
        onClose={() => setCommentPostId(null)}
        onCommentAdded={handleCommentAdded}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  logo: { fontSize: 24, fontWeight: "700", color: colors.primary, letterSpacing: -0.5 },
  headerIcons: { flexDirection: "row", gap: 16 },
  empty: { padding: 40, alignItems: "center", gap: 8 },
  emptyText: { fontSize: 16, fontWeight: "600", color: colors.text },
  emptyHint: { fontSize: 14, color: colors.textMuted, textAlign: "center" },
});
