import { useState } from "react";
import { View, Text, FlatList, Image, Dimensions, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@garona/shared";
import { Avatar, IconButton } from "@garona/ui";
import { RangBadge } from "../../components/RangBadge";
import { ProfileShareSheet } from "../../components/ProfileShareSheet";
import { useAuth } from "../../lib/auth";
import { useProfileQuery } from "../../hooks/queries/useProfileQuery";
import { useProfilePostsQuery } from "../../hooks/queries/useProfilePostsQuery";
import type { UserPost } from "../../lib/api";

const GAP = 2;
const COLS = 3;
const TILE = (Math.min(Dimensions.get("window").width, 600) - GAP * (COLS - 1)) / COLS;

type PostTab = "photos" | "text";

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View className="items-center">
      <Text className="text-text font-bold text-base">{value.toLocaleString()}</Text>
      <Text className="text-text-secondary text-xs mt-0.5">{label}</Text>
    </View>
  );
}

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

function TextPostRow({ item, username }: { item: UserPost; username: string }) {
  return (
    <Pressable
      className="px-4 py-3 border-b border-border"
      style={{ borderBottomWidth: 0.5 }}
      onPress={() => router.push(`/posts/${username}?postId=${item.id}`)}
    >
      <Text className="text-text text-[15px] leading-[22px]" numberOfLines={4}>
        {item.caption}
      </Text>
      <Text className="text-text-muted text-[12px] mt-1.5">{timeAgo(item.createdAt)}</Text>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfileQuery(user?.username || "");
  const { data: userPosts = [] } = useProfilePostsQuery(user?.username || "");
  const [shareVisible, setShareVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<PostTab>("photos");

  const photoPosts = userPosts.filter((p) => p.imageUrl);
  const textPosts = userPosts.filter((p) => !p.imageUrl);

  if (profileLoading && !profile) {
    return (
      <View className="flex-1 bg-bg justify-center items-center" style={{ paddingTop: insets.top }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const headerComponent = () => (
    <View>
      {/* Profile info */}
      <View className="flex-row items-center px-4 pt-4 gap-6">
        <Avatar uri={profile?.avatarUrl || user?.avatarUrl} name={profile?.name || user?.name} size={80} />
        <View className="flex-1 flex-row justify-around">
          <Stat label="Posts" value={profile?.posts ?? 0} />
          <Stat label="Abonnés" value={profile?.followers ?? 0} />
          <Stat label="Abonnements" value={profile?.following ?? 0} />
        </View>
      </View>

      <View className="px-4 pt-3">
        <View className="flex-row items-center gap-2">
          <Text className="text-text font-semibold text-[15px]">{profile?.name || user?.name}</Text>
          <RangBadge rang={profile?.rang ?? user?.rang ?? 0} size="sm" />
        </View>
        {profile?.bio && <Text className="text-text text-[13px] mt-1">{profile.bio}</Text>}
      </View>

      {/* Buttons */}
      <View className="flex-row px-4 pt-4 gap-1.5">
        <Pressable
          className="flex-1 bg-surface rounded-lg py-[7px] items-center border border-border"
          onPress={() => router.push("/edit-profile")}
        >
          <Text className="text-primary font-semibold text-[13px]">Modifier le profil</Text>
        </Pressable>
        <Pressable className="flex-1 bg-surface rounded-lg py-[7px] items-center border border-border" onPress={() => setShareVisible(true)}>
          <Text className="text-primary font-semibold text-[13px]">Partager</Text>
        </Pressable>
      </View>

      {/* Tabs */}
      <View className="flex-row border-t border-b border-border mt-4" style={{ borderTopWidth: 0.5, borderBottomWidth: 0.5 }}>
        <Pressable
          className="flex-1 items-center py-2.5"
          onPress={() => setActiveTab("photos")}
        >
          <Ionicons
            name="grid-outline"
            size={22}
            color={activeTab === "photos" ? colors.text : colors.textMuted}
          />
          {activeTab === "photos" && (
            <View className="absolute bottom-0 left-[25%] right-[25%] h-[2px] bg-primary rounded-full" />
          )}
        </Pressable>
        <Pressable
          className="flex-1 items-center py-2.5"
          onPress={() => setActiveTab("text")}
        >
          <Ionicons
            name="chatbubble-outline"
            size={20}
            color={activeTab === "text" ? colors.text : colors.textMuted}
          />
          {activeTab === "text" && (
            <View className="absolute bottom-0 left-[25%] right-[25%] h-[2px] bg-primary rounded-full" />
          )}
        </Pressable>
      </View>
    </View>
  );

  if (activeTab === "text") {
    return (
      <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
        <View className="flex-row justify-between items-center px-4 py-2 border-b border-border" style={{ borderBottomWidth: 0.5 }}>
          <Text className="text-xl font-bold text-text">{user?.username || "profil"}</Text>
          <View className="flex-row gap-4">
            <IconButton name="log-out-outline" size={24} onPress={signOut} />
          </View>
        </View>

        <FlatList
          key="text"
          data={textPosts}
          keyExtractor={(i) => i.id}
          ListHeaderComponent={headerComponent}
          ListEmptyComponent={() => (
            <View className="py-[60px] items-center gap-3">
              <Ionicons name="chatbubble-outline" size={40} color={colors.textMuted} />
              <Text className="text-text-muted text-[15px]">Aucun message</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <TextPostRow item={item} username={user?.username || ""} />
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

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="flex-row justify-between items-center px-4 py-2 border-b border-border" style={{ borderBottomWidth: 0.5 }}>
        <Text className="text-xl font-bold text-text">{user?.username || "profil"}</Text>
        <View className="flex-row gap-4">
          <IconButton name="log-out-outline" size={24} onPress={signOut} />
        </View>
      </View>

      <FlatList
        key="photos"
        data={photoPosts}
        keyExtractor={(i) => i.id}
        numColumns={COLS}
        columnWrapperStyle={{ gap: GAP }}
        contentContainerStyle={{ gap: GAP }}
        ListHeaderComponent={headerComponent}
        ListEmptyComponent={() => (
          <View className="py-[60px] items-center gap-3">
            <Ionicons name="camera-outline" size={40} color={colors.textMuted} />
            <Text className="text-text-muted text-[15px]">Aucune photo</Text>
          </View>
        )}
        renderItem={({ item, index }) => (
          <Pressable onPress={() => router.push(`/posts/${user?.username}?startIndex=${index}&type=photos`)}>
            <Image source={{ uri: item.imageUrl! }} style={{ width: TILE, height: TILE }} />
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
