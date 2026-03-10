import { useState } from "react";
import { View, Text, Pressable, ActivityIndicator, FlatList, Image, Dimensions } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@garona/shared";
import { Avatar } from "@garona/ui";
import { useQuery } from "@tanstack/react-query";
import { useProfileQuery } from "../../hooks/queries/useProfileQuery";
import { useProfilePostsQuery } from "../../hooks/queries/useProfilePostsQuery";
import { useFollowMutation } from "../../hooks/mutations/useFollowMutation";
import { RangBadge } from "../../components/RangBadge";
import { VouchButton } from "../../components/VouchButton";
import { UsersListSheet } from "../../components/UsersListSheet";
import { queryKeys } from "../../lib/queryKeys";
import { profilesApi } from "../../lib/api";
import type { UserPost } from "../../lib/api";

const GAP = 2;
const COLS = 3;
const TILE = (Math.min(Dimensions.get("window").width, 600) - GAP * (COLS - 1)) / COLS;

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View className="items-center">
      <Text className="text-text font-bold text-base">{value.toLocaleString()}</Text>
      <Text className="text-text-secondary text-xs mt-0.5">{label}</Text>
    </View>
  );
}

export default function UserProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const insets = useSafeAreaInsets();
  const { data: profile, isLoading } = useProfileQuery(username);
  const { data: userPosts = [] } = useProfilePostsQuery(username);
  const followMutation = useFollowMutation(username);
  const [followersVisible, setFollowersVisible] = useState(false);
  const [followingVisible, setFollowingVisible] = useState(false);

  const { data: followers = [], isLoading: followersLoading } = useQuery({
    queryKey: queryKeys.followers(username),
    queryFn: () => profilesApi.followers(username),
    enabled: followersVisible && !!username,
  });

  const { data: followingUsers = [], isLoading: followingLoading } = useQuery({
    queryKey: queryKeys.following(username),
    queryFn: () => profilesApi.following(username),
    enabled: followingVisible && !!username,
  });

  if (isLoading) {
    return (
      <View className="flex-1 bg-bg justify-center items-center" style={{ paddingTop: insets.top }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View className="flex-1 bg-bg justify-center items-center" style={{ paddingTop: insets.top }}>
        <Text className="text-text-muted text-base">Utilisateur introuvable</Text>
        <Pressable onPress={() => router.back()}>
          <Text className="text-primary text-[15px] mt-3">Retour</Text>
        </Pressable>
      </View>
    );
  }

  const headerComponent = () => (
    <View>
      {/* Profile info */}
      <View className="flex-row items-center px-4 pt-4 gap-6">
        <Avatar uri={profile.avatarUrl} name={profile.name} size={80} />
        <View className="flex-1 flex-row justify-around">
          <Stat label="Posts" value={profile.posts} />
          <Pressable onPress={() => setFollowersVisible(true)}>
            <Stat label="Abonnés" value={profile.followers} />
          </Pressable>
          <Pressable onPress={() => setFollowingVisible(true)}>
            <Stat label="Abonnements" value={profile.following} />
          </Pressable>
        </View>
      </View>

      <View className="px-4 pt-3">
        <View className="flex-row items-center gap-2">
          <Text className="text-text font-semibold text-[15px]">{profile.name}</Text>
          <RangBadge rang={profile.rang} size="sm" />
        </View>
        {profile.bio && <Text className="text-text text-[13px] mt-1">{profile.bio}</Text>}
      </View>

      {/* Action buttons */}
      {!profile.isMe && (
        <View className="flex-row px-4 pt-4 gap-2">
          <Pressable
            className={`flex-1 rounded-lg py-2 items-center ${profile.isFollowing ? "bg-surface border border-border" : "bg-primary"}`}
            onPress={() => followMutation.mutate()}
          >
            <Text className={`font-semibold text-sm ${profile.isFollowing ? "text-text" : "text-white"}`}>
              {profile.isFollowing ? "Abonné" : "S'abonner"}
            </Text>
          </Pressable>
          <VouchButton userId={profile.id} hasVouched={profile.hasVouched} />
        </View>
      )}

      <View className="mt-4 border-t border-border" style={{ borderTopWidth: 0.5 }} />
    </View>
  );

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-2 border-b border-border" style={{ borderBottomWidth: 0.5 }}>
        <Pressable onPress={() => router.back()} className="p-1">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text className="text-lg font-bold text-text">{profile.username}</Text>
        <View style={{ width: 32 }} />
      </View>

      <FlatList
        data={userPosts}
        keyExtractor={(i) => i.id}
        numColumns={COLS}
        columnWrapperStyle={{ gap: GAP }}
        contentContainerStyle={{ gap: GAP }}
        ListHeaderComponent={headerComponent}
        ListEmptyComponent={() => (
          <View className="py-[60px] items-center gap-3">
            <Ionicons name="create-outline" size={40} color={colors.textMuted} />
            <Text className="text-text-muted text-[15px]">Aucune publication</Text>
          </View>
        )}
        renderItem={({ item, index }) => (
          <Pressable onPress={() => router.push(`/posts/${username}?startIndex=${index}`)}>
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={{ width: TILE, height: TILE }} />
            ) : (
              <View style={{ width: TILE, height: TILE, backgroundColor: colors.surface, padding: 8, justifyContent: "center" }}>
                <Text className="text-text text-[11px] leading-[14px]" numberOfLines={5}>
                  {item.caption}
                </Text>
              </View>
            )}
          </Pressable>
        )}
      />
      <UsersListSheet
        visible={followersVisible}
        onClose={() => setFollowersVisible(false)}
        title="Abonnés"
        users={followers}
        isLoading={followersLoading}
      />
      <UsersListSheet
        visible={followingVisible}
        onClose={() => setFollowingVisible(false)}
        title="Abonnements"
        users={followingUsers}
        isLoading={followingLoading}
      />
    </View>
  );
}
