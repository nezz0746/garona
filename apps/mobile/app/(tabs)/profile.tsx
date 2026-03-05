import { View, Text, FlatList, Image, StyleSheet, Dimensions, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, CURRENT_USER } from "@ig/shared";
import { Avatar, IconButton } from "@ig/ui";

const GAP = 2;
const COLS = 3;
const TILE = (Math.min(Dimensions.get("window").width, 600) - GAP * (COLS - 1)) / COLS;
const USER_POSTS = Array.from({ length: 18 }, (_, i) => ({
  id: `up-${i}`,
  image: `https://picsum.photos/seed/userpost${i}/300/300`,
}));

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statVal}>{value.toLocaleString()}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerName}>{CURRENT_USER.username}</Text>
        <View style={styles.headerIcons}>
          <IconButton name="add-circle-outline" size={26} />
          <IconButton name="menu-outline" size={28} />
        </View>
      </View>

      <FlatList
        data={USER_POSTS}
        keyExtractor={(i) => i.id}
        numColumns={COLS}
        columnWrapperStyle={{ gap: GAP }}
        contentContainerStyle={{ gap: GAP }}
        ListHeaderComponent={() => (
          <View>
            {/* Profile info */}
            <View style={styles.profileRow}>
              <Avatar uri={CURRENT_USER.avatar} size={80} />
              <View style={styles.statsRow}>
                <Stat label="Posts" value={CURRENT_USER.posts} />
                <Stat label="Followers" value={CURRENT_USER.followers} />
                <Stat label="Following" value={CURRENT_USER.following} />
              </View>
            </View>
            <View style={styles.bio}>
              <Text style={styles.displayName}>{CURRENT_USER.displayName}</Text>
              <Text style={styles.bioText}>{CURRENT_USER.bio}</Text>
            </View>
            {/* Buttons */}
            <View style={styles.btnRow}>
              <Pressable style={styles.editBtn}><Text style={styles.editText}>Edit profile</Text></Pressable>
              <Pressable style={styles.editBtn}><Text style={styles.editText}>Share profile</Text></Pressable>
            </View>
            {/* Grid tabs */}
            <View style={styles.tabs}>
              <Pressable style={[styles.tab, styles.activeTab]}><Ionicons name="grid-outline" size={22} color={colors.text} /></Pressable>
              <Pressable style={styles.tab}><Ionicons name="play-outline" size={22} color={colors.textMuted} /></Pressable>
              <Pressable style={styles.tab}><Ionicons name="person-outline" size={22} color={colors.textMuted} /></Pressable>
            </View>
          </View>
        )}
        renderItem={({ item }) => (
          <Pressable><Image source={{ uri: item.image }} style={{ width: TILE, height: TILE }} /></Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  headerName: { fontSize: 20, fontWeight: "700", color: colors.text },
  headerIcons: { flexDirection: "row", gap: 20 },
  profileRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 16, gap: 24 },
  statsRow: { flex: 1, flexDirection: "row", justifyContent: "space-around" },
  stat: { alignItems: "center" },
  statVal: { color: colors.text, fontWeight: "700", fontSize: 16 },
  statLabel: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  bio: { paddingHorizontal: 16, paddingTop: 12 },
  displayName: { color: colors.text, fontWeight: "600", fontSize: 13 },
  bioText: { color: colors.text, fontSize: 13, marginTop: 2 },
  btnRow: { flexDirection: "row", paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, gap: 6 },
  editBtn: { flex: 1, backgroundColor: colors.surface, borderRadius: 8, paddingVertical: 7, alignItems: "center" },
  editText: { color: colors.text, fontWeight: "600", fontSize: 13 },
  tabs: { flexDirection: "row", borderTopWidth: 0.5, borderTopColor: colors.border, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  tab: { flex: 1, alignItems: "center", paddingVertical: 10 },
  activeTab: { borderBottomWidth: 1, borderBottomColor: colors.text },
});
