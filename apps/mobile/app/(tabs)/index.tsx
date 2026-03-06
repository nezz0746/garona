import { FlatList, View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, POSTS, STORIES } from "@ig/shared";
import { PostCard, StoryBar, IconButton } from "@ig/ui";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.logo}>Garona</Text>
        <View style={styles.headerIcons}>
          <IconButton name="heart-outline" size={26} />
          <IconButton name="chatbubble-ellipses-outline" />
        </View>
      </View>

      <FlatList
        data={POSTS}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <PostCard post={item} />}
        ListHeaderComponent={() => <StoryBar stories={STORIES} />}
        showsVerticalScrollIndicator={false}
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
  logo: { fontSize: 24, fontWeight: "700", color: colors.text, letterSpacing: -0.5 },
  headerIcons: { flexDirection: "row", gap: 16 },
});
