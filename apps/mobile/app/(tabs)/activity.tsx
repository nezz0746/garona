import { View, Text, FlatList, StyleSheet, Pressable, Image, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@garona/shared";
import { Avatar } from "@garona/ui";
import { useAuth } from "../../lib/auth";
import { useState, useEffect, useCallback } from "react";
import { activityApi, profilesApi, ActivityItem } from "../../lib/api";

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
    <Pressable style={styles.row} onPress={() => router.push(`/user/${item.actor.username}`)}>
      <Avatar uri={item.actor.avatarUrl} name={item.actor.name} size={44} />
      <View style={styles.content}>
        <Text style={styles.text}>
          <Text style={styles.bold}>{item.actor.username}</Text>
          {item.type === "like" && " a aimé ta publication."}
          {item.type === "follow" && " s'est abonné(e)."}
          {item.type === "comment" && ` a commenté : "${item.text}"`}
          <Text style={styles.time}> {timeAgo(item.createdAt)}</Text>
        </Text>
      </View>
      {item.type === "follow" ? (
        <Pressable
          style={[styles.followBtn, following && styles.followingBtn]}
          onPress={(e) => { e.stopPropagation?.(); handleFollow(); }}
        >
          <Text style={[styles.followText, following && styles.followingText]}>
            {following ? "Abonné" : "Suivre"}
          </Text>
        </Pressable>
      ) : item.postImage ? (
        <Image source={{ uri: item.postImage }} style={styles.thumb} />
      ) : null}
    </Pressable>
  );
}

export default function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await activityApi.get();
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Activité</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(n) => n.id}
        renderItem={({ item }) => <NotifRow item={item} />}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />
        }
        ListEmptyComponent={() =>
          !loading ? (
            <View style={styles.empty}>
              <Ionicons name="heart-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>Aucune activité pour le moment</Text>
            </View>
          ) : null
        }
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
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 18, fontWeight: "700", color: colors.primary },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, gap: 12 },
  content: { flex: 1 },
  text: { color: colors.text, fontSize: 13, lineHeight: 18 },
  bold: { fontWeight: "600" },
  time: { color: colors.textMuted },
  followBtn: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8 },
  followingBtn: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  followText: { color: "#ffffff", fontWeight: "600", fontSize: 13 },
  followingText: { color: colors.text },
  thumb: { width: 44, height: 44, borderRadius: 6 },
  empty: { padding: 60, alignItems: "center", gap: 12 },
  emptyText: { color: colors.textMuted, fontSize: 15 },
});
