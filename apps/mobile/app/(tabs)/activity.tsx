import { useState } from "react";
import { View, Text, FlatList, Pressable, Image, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@garona/shared";
import { Avatar } from "@garona/ui";
import { profilesApi, ActivityItem } from "../../lib/api";
import { useActivityQuery } from "../../hooks/queries/useActivityQuery";

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

function NotifRow({ item }: { item: ActivityItem }) {
  const [following, setFollowing] = useState(false);

  const handleFollow = async () => {
    try {
      const res = await profilesApi.follow(item.actor.username);
      setFollowing(res.following);
    } catch {}
  };

  return (
    <Pressable className="flex-row items-center gap-3 px-4 py-3" onPress={() => router.push(`/user/${item.actor.username}`)}>
      <Avatar uri={item.actor.avatarUrl} name={item.actor.name} size={44} />
      <View className="flex-1">
        <Text className="text-text text-sm leading-5">
          <Text className="font-semibold">{item.actor.username}</Text>
          {item.type === "like" && " a aimé ta publication."}
          {item.type === "follow" && " s'est abonné(e)."}
          {item.type === "comment" && ` a commenté : "${item.text}"`}
          <Text className="text-text-muted"> {timeAgo(item.createdAt)}</Text>
        </Text>
      </View>
      {item.type === "follow" ? (
        <Pressable
          className={following ? "bg-surface border border-border px-4 py-1.5 rounded-lg" : "bg-primary px-4 py-1.5 rounded-lg"}
          onPress={(e) => { e.stopPropagation?.(); handleFollow(); }}
        >
          <Text className={following ? "text-text font-semibold text-[13px]" : "text-white font-semibold text-[13px]"}>
            {following ? "Abonné" : "Suivre"}
          </Text>
        </Pressable>
      ) : item.postImage ? (
        <Image source={{ uri: item.postImage }} className="w-11 h-11 rounded-md" />
      ) : null}
    </Pressable>
  );
}

export default function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const { data: items = [], isLoading, isRefetching, refetch } = useActivityQuery();

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="px-4 py-2 border-b border-border" style={{ borderBottomWidth: 0.5 }}>
        <Text className="text-xl font-bold text-text">Activité</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(n) => n.id}
        renderItem={({ item }) => <NotifRow item={item} />}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
        ListEmptyComponent={() =>
          !isLoading ? (
            <View className="flex-1 justify-center items-center gap-2">
              <Ionicons name="heart-outline" size={48} color={colors.textMuted} />
              <Text className="text-base font-semibold text-text">Aucune activité pour le moment</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}
