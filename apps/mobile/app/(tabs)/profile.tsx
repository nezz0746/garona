import { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, Image, StyleSheet, Dimensions, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@garona/shared";
import { Avatar, IconButton } from "@garona/ui";
import { PalierBadge } from "../../components/PalierBadge";
import { ProfileShareSheet } from "../../components/ProfileShareSheet";
import { useAuth } from "../../lib/auth";
import { profilesApi, Profile, UserPost } from "../../lib/api";

const GAP = 2;
const COLS = 3;
const TILE = (Math.min(Dimensions.get("window").width, 600) - GAP * (COLS - 1)) / COLS;

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
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareVisible, setShareVisible] = useState(false);

  const load = useCallback(async () => {
    if (!user?.username) return;
    setLoading(true);
    try {
      const [p, posts] = await Promise.all([
        profilesApi.get(user.username),
        profilesApi.posts(user.username),
      ]);
      setProfile(p);
      setUserPosts(posts);
    } catch {}
    setLoading(false);
  }, [user?.username]);

  useEffect(() => { load(); }, [load]);

  if (loading && !profile) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerName}>{user?.username || "profil"}</Text>
        <View style={styles.headerIcons}>
          <IconButton name="log-out-outline" size={24} onPress={signOut} />
        </View>
      </View>

      <FlatList
        data={userPosts}
        keyExtractor={(i) => i.id}
        numColumns={COLS}
        columnWrapperStyle={{ gap: GAP }}
        contentContainerStyle={{ gap: GAP }}
        ListHeaderComponent={() => (
          <View>
            {/* Profile info */}
            <View style={styles.profileRow}>
              <Avatar uri={profile?.avatarUrl || user?.avatarUrl} name={profile?.name || user?.name} size={80} />
              <View style={styles.statsRow}>
                <Stat label="Posts" value={profile?.posts ?? 0} />
                <Stat label="Abonnés" value={profile?.followers ?? 0} />
                <Stat label="Abonnements" value={profile?.following ?? 0} />
              </View>
            </View>

            <View style={styles.bio}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={styles.displayName}>{profile?.name || user?.name}</Text>
                <PalierBadge palier={profile?.palier ?? user?.palier ?? 0} size="sm" />
              </View>
              {profile?.bio && <Text style={styles.bioText}>{profile.bio}</Text>}
            </View>

            {/* Buttons */}
            <View style={styles.btnRow}>
              <Pressable style={styles.editBtn}><Text style={styles.editText}>Modifier le profil</Text></Pressable>
              <Pressable style={styles.editBtn} onPress={() => setShareVisible(true)}><Text style={styles.editText}>Partager</Text></Pressable>
            </View>

            {/* Grid header */}
            <View style={styles.tabs}>
              <Pressable style={[styles.tab, styles.activeTab]}>
                <Ionicons name="grid-outline" size={22} color={colors.text} />
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Ionicons name="camera-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyText}>Aucune publication</Text>
          </View>
        )}
        renderItem={({ item, index }) => (
          <Pressable onPress={() => router.push(`/posts/${user?.username}?startIndex=${index}`)}>
            <Image source={{ uri: item.imageUrl }} style={{ width: TILE, height: TILE }} />
          </Pressable>
        )}
      />

      <ProfileShareSheet
        visible={shareVisible}
        onClose={() => setShareVisible(false)}
        username={user?.username || ""}
        name={profile?.name || user?.name || ""}
        avatarUrl={profile?.avatarUrl || user?.avatarUrl || null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  headerName: { fontSize: 20, fontWeight: "700", color: colors.text },
  headerIcons: { flexDirection: "row", gap: 16 },
  profileRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 16, gap: 24 },
  statsRow: { flex: 1, flexDirection: "row", justifyContent: "space-around" },
  stat: { alignItems: "center" },
  statVal: { color: colors.text, fontWeight: "700", fontSize: 16 },
  statLabel: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  bio: { paddingHorizontal: 16, paddingTop: 12 },
  displayName: { color: colors.text, fontWeight: "600", fontSize: 15 },
  bioText: { color: colors.text, fontSize: 13, marginTop: 4 },
  btnRow: { flexDirection: "row", paddingHorizontal: 16, paddingTop: 16, gap: 6 },
  editBtn: { flex: 1, backgroundColor: colors.surface, borderRadius: 8, paddingVertical: 7, alignItems: "center", borderWidth: 1, borderColor: colors.border },
  editText: { color: colors.primary, fontWeight: "600", fontSize: 13 },
  tabs: { flexDirection: "row", borderTopWidth: 0.5, borderTopColor: colors.border, borderBottomWidth: 0.5, borderBottomColor: colors.border, marginTop: 16 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 10 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  empty: { padding: 60, alignItems: "center", gap: 12 },
  emptyText: { color: colors.textMuted, fontSize: 15 },
});
