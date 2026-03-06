import { ScrollView, View, Text, StyleSheet, Pressable } from "react-native";
import { colors, Story } from "@ig/shared";
import { Avatar } from "./Avatar";
import { Ionicons } from "@expo/vector-icons";

export function StoryBar({ stories }: { stories: Story[] }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
      {/* Your story */}
      <Pressable style={styles.item}>
        <View>
          <Avatar uri={stories[0]?.user.avatar} size={56} />
          <View style={styles.addBadge}>
            <Ionicons name="add-circle" size={18} color={colors.primary} />
          </View>
        </View>
        <Text style={styles.label} numberOfLines={1}>Your story</Text>
      </Pressable>

      {stories.slice(1).map((s) => (
        <Pressable key={s.id} style={styles.item}>
          <Avatar uri={s.user.avatar} size={56} ring seen={s.seen} />
          <Text style={[styles.label, s.seen && styles.seen]} numberOfLines={1}>
            {s.user.username}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 8, paddingVertical: 10, gap: 12 },
  item: { alignItems: "center", width: 68 },
  label: { color: colors.text, fontSize: 11, marginTop: 4, textAlign: "center" },
  seen: { color: colors.textMuted },
  addBadge: { position: "absolute", bottom: -2, right: -2, backgroundColor: colors.bg, borderRadius: 10, overflow: "hidden" },
});
