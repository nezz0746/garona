import { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator, FlatList, Image, Dimensions } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@garona/shared";
import { Avatar } from "@garona/ui";
import { useProfile } from "../../hooks/useProfile";
import { profilesApi, UserPost } from "../../lib/api";
import { PalierBadge } from "../../components/PalierBadge";
import { VouchButton } from "../../components/VouchButton";

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

export default function UserProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const insets = useSafeAreaInsets();
  const { profile, loading, toggleFollow } = useProfile(username);
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);

  useEffect(() => {
    if (username) {
      profilesApi.posts(username).then(setUserPosts).catch(() => setUserPosts([]));
    }
  }, [username]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Utilisateur introuvable</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerName}>{profile.username}</Text>
        <View style={{ width: 32 }} />
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
              <Avatar uri={profile.avatarUrl} name={profile.name} size={80} />
              <View style={styles.statsRow}>
                <Stat label="Posts" value={profile.posts} />
                <Stat label="Abonnés" value={profile.followers} />
                <Stat label="Abonnements" value={profile.following} />
              </View>
            </View>

            <View style={styles.bio}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={styles.displayName}>{profile.name}</Text>
                <PalierBadge palier={profile.palier} size="sm" />
              </View>
              {profile.bio && <Text style={styles.bioText}>{profile.bio}</Text>}
            </View>

            {/* Action buttons */}
            {!profile.isMe && (
              <View style={styles.actionRow}>
                <Pressable
                  style={[styles.followBtn, profile.isFollowing && styles.followingBtn]}
                  onPress={toggleFollow}
                >
                  <Text style={[styles.followText, profile.isFollowing && styles.followingText]}>
                    {profile.isFollowing ? "Abonné" : "S'abonner"}
                  </Text>
                </Pressable>
                <VouchButton userId={profile.id} hasVouched={profile.hasVouched} />
              </View>
            )}

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
          <Pressable onPress={() => router.push(`/posts/${username}?startIndex=${index}`)}>
            <Image source={{ uri: item.imageUrl }} style={{ width: TILE, height: TILE }} />
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: 4 },
  headerName: { fontSize: 18, fontWeight: "700", color: colors.text },
  profileRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 16, gap: 24 },
  statsRow: { flex: 1, flexDirection: "row", justifyContent: "space-around" },
  stat: { alignItems: "center" },
  statVal: { color: colors.text, fontWeight: "700", fontSize: 16 },
  statLabel: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  bio: { paddingHorizontal: 16, paddingTop: 12 },
  displayName: { color: colors.text, fontWeight: "600", fontSize: 15 },
  bioText: { color: colors.text, fontSize: 13, marginTop: 4 },
  actionRow: { flexDirection: "row", paddingHorizontal: 16, paddingTop: 16, gap: 8 },
  followBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 8, alignItems: "center" },
  followingBtn: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  followText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  followingText: { color: colors.text },
  tabs: { flexDirection: "row", borderTopWidth: 0.5, borderTopColor: colors.border, borderBottomWidth: 0.5, borderBottomColor: colors.border, marginTop: 16 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 10 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  empty: { padding: 60, alignItems: "center", gap: 12 },
  emptyText: { color: colors.textMuted, fontSize: 15 },
  errorText: { color: colors.textMuted, fontSize: 16 },
  backLink: { color: colors.primary, fontSize: 15, marginTop: 12 },
});
