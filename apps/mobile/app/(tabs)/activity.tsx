import { View, Text, FlatList, StyleSheet, Pressable, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, NOTIFICATIONS, Notification } from "@ig/shared";
import { Avatar } from "@ig/ui";

function NotifRow({ item }: { item: Notification }) {
  return (
    <View style={styles.row}>
      <Avatar uri={item.user.avatar} size={40} />
      <View style={styles.content}>
        <Text style={styles.text}>
          <Text style={styles.bold}>{item.user.username}</Text>
          {item.type === "like" && " liked your post."}
          {item.type === "follow" && " started following you."}
          {item.type === "comment" && ` commented: ${item.text}`}
          <Text style={styles.time}> {item.timeAgo}</Text>
        </Text>
      </View>
      {item.type === "follow" ? (
        <Pressable style={styles.followBtn}>
          <Text style={styles.followText}>Follow</Text>
        </Pressable>
      ) : item.postImage ? (
        <Image source={{ uri: item.postImage }} style={styles.thumb} />
      ) : null}
    </View>
  );
}

export default function ActivityScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Activity</Text>
      <FlatList
        data={NOTIFICATIONS}
        keyExtractor={(n) => n.id}
        renderItem={({ item }) => <NotifRow item={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: 18, fontWeight: "700", color: colors.primary, padding: 16, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, gap: 12 },
  content: { flex: 1 },
  text: { color: colors.text, fontSize: 13, lineHeight: 18 },
  bold: { fontWeight: "600" },
  time: { color: colors.textMuted },
  followBtn: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8 },
  followText: { color: "#ffffff", fontWeight: "600", fontSize: 13 },
  thumb: { width: 40, height: 40, borderRadius: 4 },
});
