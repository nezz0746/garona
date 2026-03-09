import { Ionicons } from "@expo/vector-icons";
import { colors } from "@garona/shared";
import Constants from "expo-constants";
import * as Updates from "expo-updates";
import { useRouter } from "expo-router";
import { useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BrandText } from "../../components/BrandText";
import { CommentsSheet } from "../../components/CommentsSheet";
import { FeedPostCard } from "../../components/FeedPostCard";
import { useLikeMutation } from "../../hooks/mutations/useLikeMutation";
import { useFeedQuery } from "../../hooks/queries/useFeedQuery";

function getAppVersion() {
  const version = Constants.expoConfig?.version ?? "?";
  const updateId = Updates.updateId;
  if (updateId) {
    return `v${version} · ${updateId.slice(0, 7)}`;
  }
  return `v${version}`;
}

type FeedTab = "discover" | "following";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FeedTab>("discover");
  const { data: posts = [], isLoading, isRefetching, error, refetch } = useFeedQuery(activeTab);
  const likeMutation = useLikeMutation();
  const [commentPostId, setCommentPostId] = useState<string | null>(null);

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View
        className="flex-row justify-between items-center px-4 py-2"
      >
        <View className="flex-row items-baseline gap-2">
          <BrandText className="text-2xl text-accent tracking-tight">
            Garona
          </BrandText>
          <Text className="text-[10px] text-text-muted">{getAppVersion()}</Text>
        </View>
        <Pressable onPress={() => router.push("/guide")} hitSlop={8}>
          <Ionicons name="book-outline" size={24} color={colors.text} />
        </Pressable>
      </View>

      {/* Feed tabs */}
      <View className="flex-row border-b border-border" style={{ borderBottomWidth: 0.5 }}>
        <Pressable
          className="flex-1 items-center py-2.5"
          onPress={() => setActiveTab("discover")}
        >
          <Text
            className={`text-[13px] font-semibold ${activeTab === "discover" ? "text-text" : "text-text-muted"}`}
          >
            Explorer
          </Text>
          {activeTab === "discover" && (
            <View className="absolute bottom-0 left-[25%] right-[25%] h-[2px] bg-primary rounded-full" />
          )}
        </Pressable>
        <Pressable
          className="flex-1 items-center py-2.5"
          onPress={() => setActiveTab("following")}
        >
          <Text
            className={`text-[13px] font-semibold ${activeTab === "following" ? "text-text" : "text-text-muted"}`}
          >
            Abonnements
          </Text>
          {activeTab === "following" && (
            <View className="absolute bottom-0 left-[25%] right-[25%] h-[2px] bg-primary rounded-full" />
          )}
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
                  <Text className="text-base font-semibold text-text">
                    Erreur de chargement
                  </Text>
                  <Text className="text-sm text-text-muted text-center">
                    {error.message}
                  </Text>
                </>
              ) : activeTab === "following" ? (
                <>
                  <Text className="text-base font-semibold text-text">
                    Rien ici pour le moment
                  </Text>
                  <Text className="text-sm text-text-muted text-center">
                    Suis des Toulousains pour voir leurs posts ici
                  </Text>
                </>
              ) : (
                <Text className="text-base font-semibold text-text">
                  Aucune publication pour le moment
                </Text>
              )}
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.accent}
          />
        }
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
